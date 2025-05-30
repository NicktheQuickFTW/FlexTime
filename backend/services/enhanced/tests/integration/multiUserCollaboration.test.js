/**
 * Multi-User Collaboration Integration Tests
 * Tests collaborative features and concurrent user interactions
 */

const { expect } = require('chai');
const sinon = require('sinon');
const WebSocket = require('ws');
const CollaborationEngine = require('../../CollaborationEngine');
const FTBuilderEngine = require('../../FT_Builder_Engine_v2');
const CacheManager = require('../../CacheManager');

describe('Multi-User Collaboration Integration', () => {
    let collaborationEngine;
    let ftEngine;
    let cacheManager;
    let sandbox;
    let mockWebSocketServer;

    beforeEach(async () => {
        sandbox = sinon.createSandbox();
        collaborationEngine = new CollaborationEngine();
        ftEngine = new FTBuilderEngine();
        cacheManager = new CacheManager();
        
        // Setup mock WebSocket server
        mockWebSocketServer = {
            clients: new Set(),
            broadcast: sandbox.stub(),
            send: sandbox.stub()
        };
        
        await collaborationEngine.initialize({ websocketServer: mockWebSocketServer });
    });

    afterEach(() => {
        sandbox.restore();
        if (mockWebSocketServer) {
            mockWebSocketServer.clients.clear();
        }
    });

    describe('Concurrent Schedule Editing', () => {
        it('should handle multiple users editing the same schedule simultaneously', async function() {
            this.timeout(15000);

            const scheduleId = 'collab-test-' + Date.now();
            
            // Create base schedule
            const schedule = await ftEngine.initializeSchedule({
                sport: 'basketball',
                teams: ['Kansas', 'Kansas State', 'Baylor', 'TCU'],
                scheduleId
            });

            // Simulate multiple users
            const users = [
                { id: 'user1', role: 'admin', name: 'John Doe' },
                { id: 'user2', role: 'editor', name: 'Jane Smith' },
                { id: 'user3', role: 'viewer', name: 'Bob Wilson' }
            ];

            // Register users in collaboration session
            for (const user of users) {
                const joinResult = await collaborationEngine.joinSession(scheduleId, user);
                expect(joinResult.success).to.be.true;
            }

            // Concurrent edits
            const edits = [
                {
                    userId: 'user1',
                    action: 'add_game',
                    data: { homeTeam: 'Kansas', awayTeam: 'Baylor', date: '2025-01-15' }
                },
                {
                    userId: 'user2',
                    action: 'add_constraint',
                    data: { type: 'rest_days', value: 2, team: 'Kansas State' }
                },
                {
                    userId: 'user1',
                    action: 'update_venue',
                    data: { gameId: 'game1', newVenue: 'Allen Fieldhouse' }
                }
            ];

            // Apply edits concurrently
            const editPromises = edits.map(edit => 
                collaborationEngine.applyEdit(scheduleId, edit.userId, edit)
            );

            const editResults = await Promise.all(editPromises);
            editResults.forEach(result => {
                expect(result.success).to.be.true;
                expect(result.conflictResolution).to.exist;
            });

            // Verify collaboration state
            const sessionState = await collaborationEngine.getSessionState(scheduleId);
            expect(sessionState.activeUsers).to.have.length(3);
            expect(sessionState.editHistory).to.have.length(3);
            expect(sessionState.conflicts).to.have.length(0);
        });

        it('should resolve edit conflicts using operational transformation', async function() {
            this.timeout(10000);

            const scheduleId = 'conflict-test-' + Date.now();
            
            await ftEngine.initializeSchedule({
                sport: 'football',
                teams: ['Arizona', 'Utah'],
                scheduleId
            });

            const user1 = { id: 'user1', role: 'admin' };
            const user2 = { id: 'user2', role: 'editor' };

            await collaborationEngine.joinSession(scheduleId, user1);
            await collaborationEngine.joinSession(scheduleId, user2);

            // Create conflicting edits on the same element
            const conflictingEdits = [
                {
                    userId: 'user1',
                    timestamp: Date.now(),
                    action: 'update_game_time',
                    target: 'game1',
                    data: { time: '14:00' }
                },
                {
                    userId: 'user2',
                    timestamp: Date.now() + 50, // Slightly later
                    action: 'update_game_time',
                    target: 'game1',
                    data: { time: '16:00' }
                }
            ];

            // Apply conflicting edits
            const [result1, result2] = await Promise.all([
                collaborationEngine.applyEdit(scheduleId, 'user1', conflictingEdits[0]),
                collaborationEngine.applyEdit(scheduleId, 'user2', conflictingEdits[1])
            ]);

            expect(result1.success).to.be.true;
            expect(result2.success).to.be.true;
            expect(result2.conflictResolved).to.be.true;
            expect(result2.winningEdit).to.equal('user2'); // Later timestamp wins

            // Verify final state
            const finalSchedule = await ftEngine.getSchedule(scheduleId);
            const game1 = finalSchedule.games.find(g => g.id === 'game1');
            expect(game1.time).to.equal('16:00');
        });

        it('should maintain edit history and allow rollback', async function() {
            this.timeout(8000);

            const scheduleId = 'history-test-' + Date.now();
            
            await ftEngine.initializeSchedule({
                sport: 'basketball',
                teams: ['Kansas', 'Baylor'],
                scheduleId
            });

            const user = { id: 'admin1', role: 'admin' };
            await collaborationEngine.joinSession(scheduleId, user);

            // Perform series of edits
            const edits = [
                { action: 'add_game', data: { homeTeam: 'Kansas', awayTeam: 'Baylor' } },
                { action: 'update_date', data: { gameId: 'game1', date: '2025-01-15' } },
                { action: 'add_constraint', data: { type: 'venue_capacity', value: 16500 } }
            ];

            for (const edit of edits) {
                await collaborationEngine.applyEdit(scheduleId, user.id, edit);
            }

            // Get edit history
            const history = await collaborationEngine.getEditHistory(scheduleId);
            expect(history.edits).to.have.length(3);
            expect(history.edits[0].action).to.equal('add_game');

            // Rollback to previous state
            const rollbackResult = await collaborationEngine.rollbackToEdit(
                scheduleId, 
                history.edits[1].id, 
                user.id
            );

            expect(rollbackResult.success).to.be.true;
            expect(rollbackResult.rolledBackEdits).to.have.length(1);

            // Verify state after rollback
            const currentHistory = await collaborationEngine.getEditHistory(scheduleId);
            expect(currentHistory.edits).to.have.length(2);
        });
    });

    describe('Real-time Synchronization', () => {
        it('should broadcast changes to all connected users in real-time', async function() {
            this.timeout(8000);

            const scheduleId = 'sync-test-' + Date.now();
            
            // Create mock WebSocket connections for multiple users
            const mockClients = [
                { id: 'client1', userId: 'user1', send: sandbox.stub(), readyState: 1 },
                { id: 'client2', userId: 'user2', send: sandbox.stub(), readyState: 1 },
                { id: 'client3', userId: 'user3', send: sandbox.stub(), readyState: 1 }
            ];

            mockWebSocketServer.clients = new Set(mockClients);

            await ftEngine.initializeSchedule({
                sport: 'baseball',
                teams: ['Houston', 'TCU'],
                scheduleId
            });

            // Register users
            for (let i = 0; i < mockClients.length; i++) {
                await collaborationEngine.joinSession(scheduleId, {
                    id: `user${i + 1}`,
                    websocket: mockClients[i]
                });
            }

            // Make an edit
            const edit = {
                action: 'add_game',
                data: { homeTeam: 'Houston', awayTeam: 'TCU', date: '2025-03-15' }
            };

            await collaborationEngine.applyEdit(scheduleId, 'user1', edit);

            // Verify all clients received the broadcast
            mockClients.forEach((client, index) => {
                if (index === 0) return; // Skip the user who made the edit
                
                expect(client.send.calledOnce).to.be.true;
                const sentData = JSON.parse(client.send.firstCall.args[0]);
                expect(sentData.type).to.equal('schedule_update');
                expect(sentData.edit.action).to.equal('add_game');
            });
        });

        it('should handle user disconnections gracefully', async function() {
            this.timeout(6000);

            const scheduleId = 'disconnect-test-' + Date.now();
            
            const users = [
                { id: 'user1', role: 'admin' },
                { id: 'user2', role: 'editor' }
            ];

            // Join session
            for (const user of users) {
                await collaborationEngine.joinSession(scheduleId, user);
            }

            let sessionState = await collaborationEngine.getSessionState(scheduleId);
            expect(sessionState.activeUsers).to.have.length(2);

            // Simulate disconnection
            const disconnectResult = await collaborationEngine.handleDisconnection(scheduleId, 'user1');
            expect(disconnectResult.success).to.be.true;

            sessionState = await collaborationEngine.getSessionState(scheduleId);
            expect(sessionState.activeUsers).to.have.length(1);
            expect(sessionState.activeUsers[0].id).to.equal('user2');
        });

        it('should handle network partitions and reconnections', async function() {
            this.timeout(10000);

            const scheduleId = 'partition-test-' + Date.now();
            const user = { id: 'user1', role: 'admin' };

            await collaborationEngine.joinSession(scheduleId, user);

            // Simulate network partition (offline mode)
            const offlineEdits = [
                { action: 'add_game', data: { homeTeam: 'Kansas', awayTeam: 'Iowa State' } },
                { action: 'update_venue', data: { gameId: 'game1', venue: 'Allen Fieldhouse' } }
            ];

            // Queue offline edits
            for (const edit of offlineEdits) {
                await collaborationEngine.queueOfflineEdit(scheduleId, user.id, edit);
            }

            // Simulate reconnection and sync
            const syncResult = await collaborationEngine.syncOfflineEdits(scheduleId, user.id);
            
            expect(syncResult.success).to.be.true;
            expect(syncResult.appliedEdits).to.have.length(2);
            expect(syncResult.conflicts).to.have.length(0);
        });
    });

    describe('Permission Management', () => {
        it('should enforce role-based permissions for edits', async function() {
            this.timeout(6000);

            const scheduleId = 'permissions-test-' + Date.now();
            
            await ftEngine.initializeSchedule({
                sport: 'basketball',
                teams: ['Arizona', 'Colorado'],
                scheduleId
            });

            const users = [
                { id: 'admin1', role: 'admin' },
                { id: 'editor1', role: 'editor' },
                { id: 'viewer1', role: 'viewer' }
            ];

            // Join session with different roles
            for (const user of users) {
                await collaborationEngine.joinSession(scheduleId, user);
            }

            // Test admin permissions (should succeed)
            const adminEdit = {
                action: 'delete_game',
                data: { gameId: 'game1' }
            };
            const adminResult = await collaborationEngine.applyEdit(scheduleId, 'admin1', adminEdit);
            expect(adminResult.success).to.be.true;

            // Test editor permissions (should succeed for most actions)
            const editorEdit = {
                action: 'update_game_time',
                data: { gameId: 'game2', time: '19:00' }
            };
            const editorResult = await collaborationEngine.applyEdit(scheduleId, 'editor1', editorEdit);
            expect(editorResult.success).to.be.true;

            // Test viewer permissions (should fail for edit actions)
            const viewerEdit = {
                action: 'add_game',
                data: { homeTeam: 'Arizona', awayTeam: 'Colorado' }
            };
            const viewerResult = await collaborationEngine.applyEdit(scheduleId, 'viewer1', viewerEdit);
            expect(viewerResult.success).to.be.false;
            expect(viewerResult.error).to.include('permission denied');
        });

        it('should allow permission changes during active session', async function() {
            this.timeout(5000);

            const scheduleId = 'permission-change-test-' + Date.now();
            const user = { id: 'user1', role: 'viewer' };

            await collaborationEngine.joinSession(scheduleId, user);

            // Try edit as viewer (should fail)
            let editResult = await collaborationEngine.applyEdit(scheduleId, 'user1', {
                action: 'add_game',
                data: { homeTeam: 'Kansas', awayTeam: 'Baylor' }
            });
            expect(editResult.success).to.be.false;

            // Promote to editor
            const promoteResult = await collaborationEngine.updateUserRole(scheduleId, 'user1', 'editor');
            expect(promoteResult.success).to.be.true;

            // Try edit as editor (should succeed)
            editResult = await collaborationEngine.applyEdit(scheduleId, 'user1', {
                action: 'add_game',
                data: { homeTeam: 'Kansas', awayTeam: 'Baylor' }
            });
            expect(editResult.success).to.be.true;
        });
    });

    describe('Collaborative Constraint Management', () => {
        it('should handle collaborative constraint editing', async function() {
            this.timeout(8000);

            const scheduleId = 'constraint-collab-test-' + Date.now();
            
            await ftEngine.initializeSchedule({
                sport: 'football',
                teams: ['Texas Tech', 'West Virginia'],
                scheduleId
            });

            const users = [
                { id: 'constraint_admin', role: 'admin' },
                { id: 'schedule_editor', role: 'editor' }
            ];

            for (const user of users) {
                await collaborationEngine.joinSession(scheduleId, user);
            }

            // User 1 adds travel constraint
            const travelConstraint = {
                action: 'add_constraint',
                data: {
                    type: 'travel_optimization',
                    maxTravelDistance: 1000,
                    applyTo: ['Texas Tech', 'West Virginia']
                }
            };

            await collaborationEngine.applyEdit(scheduleId, 'constraint_admin', travelConstraint);

            // User 2 adds venue constraint
            const venueConstraint = {
                action: 'add_constraint',
                data: {
                    type: 'venue_availability',
                    team: 'Texas Tech',
                    unavailableDates: ['2025-11-15', '2025-11-22']
                }
            };

            await collaborationEngine.applyEdit(scheduleId, 'schedule_editor', venueConstraint);

            // Verify both constraints are applied and compatible
            const schedule = await ftEngine.getSchedule(scheduleId);
            expect(schedule.constraints).to.have.length(2);
            
            const constraintCheck = await collaborationEngine.validateConstraintCompatibility(scheduleId);
            expect(constraintCheck.compatible).to.be.true;
        });
    });

    describe('Session Recovery', () => {
        it('should recover collaboration session after server restart', async function() {
            this.timeout(8000);

            const scheduleId = 'recovery-test-' + Date.now();
            
            // Create session with edits
            const user = { id: 'user1', role: 'admin' };
            await collaborationEngine.joinSession(scheduleId, user);
            
            await collaborationEngine.applyEdit(scheduleId, 'user1', {
                action: 'add_game',
                data: { homeTeam: 'Utah', awayTeam: 'Colorado' }
            });

            // Simulate server restart by creating new collaboration engine
            const newCollaborationEngine = new CollaborationEngine();
            await newCollaborationEngine.initialize({ websocketServer: mockWebSocketServer });

            // Recover session
            const recoveryResult = await newCollaborationEngine.recoverSession(scheduleId);
            expect(recoveryResult.success).to.be.true;
            expect(recoveryResult.editHistory).to.have.length(1);

            // User reconnects
            const reconnectResult = await newCollaborationEngine.rejoinSession(scheduleId, user);
            expect(reconnectResult.success).to.be.true;
            expect(reconnectResult.sessionState.editHistory).to.have.length(1);
        });
    });
});