/**
 * CollaborationEngine.js
 * 
 * Real-time collaboration engine for FlexTime scheduling platform
 * Implements operational transformation, CRDTs, and conflict resolution
 * for multi-user synchronization of scheduling operations.
 * 
 * @author FlexTime Engineering Team
 * @version 2.0.0
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class CollaborationEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            maxUsers: options.maxUsers || 50,
            conflictTimeout: options.conflictTimeout || 5000,
            syncInterval: options.syncInterval || 100,
            presenceTimeout: options.presenceTimeout || 30000,
            operationBatchSize: options.operationBatchSize || 10,
            ...options
        };

        // Core state management
        this.state = new Map(); // CRDT state
        this.operations = new Map(); // Operation history
        this.users = new Map(); // Active users
        this.cursors = new Map(); // User cursor positions
        this.conflicts = new Map(); // Active conflicts
        
        // Operational transformation
        this.operationQueue = [];
        this.transformEngine = new OperationalTransform();
        
        // Real-time synchronization
        this.syncTimer = null;
        this.presenceTimer = null;
        
        this.initializeEngine();
    }

    /**
     * Initialize the collaboration engine
     */
    initializeEngine() {
        this.startSyncTimer();
        this.startPresenceTimer();
        
        this.on('operation', this.handleOperation.bind(this));
        this.on('conflict', this.handleConflict.bind(this));
        this.on('userJoin', this.handleUserJoin.bind(this));
        this.on('userLeave', this.handleUserLeave.bind(this));
    }

    /**
     * User session management
     */
    addUser(userId, userData) {
        const user = {
            id: userId,
            name: userData.name || 'Anonymous',
            color: userData.color || this.generateUserColor(),
            joinedAt: Date.now(),
            lastActivity: Date.now(),
            permissions: userData.permissions || ['read'],
            cursor: { x: 0, y: 0, element: null },
            selections: new Set(),
            ...userData
        };

        this.users.set(userId, user);
        this.emit('userJoin', user);
        
        return user;
    }

    removeUser(userId) {
        const user = this.users.get(userId);
        if (user) {
            this.users.delete(userId);
            this.cursors.delete(userId);
            this.emit('userLeave', user);
        }
    }

    updateUserPresence(userId, presenceData) {
        const user = this.users.get(userId);
        if (user) {
            user.lastActivity = Date.now();
            Object.assign(user, presenceData);
            this.emit('presenceUpdate', user);
        }
    }

    /**
     * Cursor and selection synchronization
     */
    updateCursor(userId, cursorData) {
        const user = this.users.get(userId);
        if (user) {
            user.cursor = {
                x: cursorData.x,
                y: cursorData.y,
                element: cursorData.element,
                timestamp: Date.now()
            };
            
            this.cursors.set(userId, user.cursor);
            this.broadcastCursorUpdate(userId, user.cursor);
        }
    }

    updateSelection(userId, selectionData) {
        const user = this.users.get(userId);
        if (user) {
            user.selections = new Set(selectionData.elements || []);
            this.broadcastSelectionUpdate(userId, user.selections);
        }
    }

    /**
     * Operational Transformation for concurrent edits
     */
    createOperation(userId, operationType, data) {
        const operation = {
            id: uuidv4(),
            userId,
            type: operationType,
            data,
            timestamp: Date.now(),
            vector: this.generateVectorClock(userId),
            transformed: false
        };

        return operation;
    }

    applyOperation(operation) {
        // Validate operation
        if (!this.validateOperation(operation)) {
            throw new Error(`Invalid operation: ${operation.id}`);
        }

        // Check for conflicts
        const conflicts = this.detectConflicts(operation);
        if (conflicts.length > 0) {
            return this.handleConflictResolution(operation, conflicts);
        }

        // Transform operation against concurrent operations
        const transformedOp = this.transformEngine.transform(
            operation,
            this.getRecentOperations(operation.timestamp)
        );

        // Apply to state
        this.applyToState(transformedOp);
        
        // Store in operation history
        this.operations.set(operation.id, transformedOp);
        
        // Broadcast to other users
        this.broadcastOperation(transformedOp);
        
        return transformedOp;
    }

    /**
     * CRDT (Conflict-free Replicated Data Types) implementation
     */
    applyToState(operation) {
        const { type, data } = operation;
        
        switch (type) {
            case 'schedule.create':
                this.crdtCreateSchedule(operation);
                break;
                
            case 'schedule.update':
                this.crdtUpdateSchedule(operation);
                break;
                
            case 'schedule.delete':
                this.crdtDeleteSchedule(operation);
                break;
                
            case 'constraint.add':
                this.crdtAddConstraint(operation);
                break;
                
            case 'constraint.modify':
                this.crdtModifyConstraint(operation);
                break;
                
            case 'constraint.remove':
                this.crdtRemoveConstraint(operation);
                break;
                
            case 'team.assign':
                this.crdtAssignTeam(operation);
                break;
                
            case 'venue.allocate':
                this.crdtAllocateVenue(operation);
                break;
                
            default:
                console.warn(`Unknown operation type: ${type}`);
        }
    }

    crdtCreateSchedule(operation) {
        const scheduleId = operation.data.id;
        const existingSchedule = this.state.get(`schedule:${scheduleId}`);
        
        if (!existingSchedule || operation.timestamp > existingSchedule.timestamp) {
            this.state.set(`schedule:${scheduleId}`, {
                ...operation.data,
                timestamp: operation.timestamp,
                createdBy: operation.userId
            });
        }
    }

    crdtUpdateSchedule(operation) {
        const scheduleId = operation.data.id;
        const scheduleKey = `schedule:${scheduleId}`;
        const current = this.state.get(scheduleKey);
        
        if (current) {
            // Merge updates using last-writer-wins with field-level granularity
            const merged = { ...current };
            
            Object.keys(operation.data.updates).forEach(field => {
                const fieldKey = `${scheduleKey}:${field}`;
                const currentFieldTime = current.fieldTimestamps?.[field] || current.timestamp;
                
                if (operation.timestamp >= currentFieldTime) {
                    merged[field] = operation.data.updates[field];
                    merged.fieldTimestamps = merged.fieldTimestamps || {};
                    merged.fieldTimestamps[field] = operation.timestamp;
                }
            });
            
            this.state.set(scheduleKey, merged);
        }
    }

    crdtDeleteSchedule(operation) {
        const scheduleId = operation.data.id;
        const scheduleKey = `schedule:${scheduleId}`;
        const current = this.state.get(scheduleKey);
        
        if (current && operation.timestamp > current.timestamp) {
            this.state.set(scheduleKey, {
                ...current,
                deleted: true,
                deletedAt: operation.timestamp,
                deletedBy: operation.userId
            });
        }
    }

    /**
     * Conflict Detection and Resolution
     */
    detectConflicts(operation) {
        const conflicts = [];
        const recentOps = this.getRecentOperations(operation.timestamp - this.config.conflictTimeout);
        
        recentOps.forEach(recentOp => {
            if (this.operationsConflict(operation, recentOp)) {
                conflicts.push(recentOp);
            }
        });
        
        return conflicts;
    }

    operationsConflict(op1, op2) {
        // Same resource conflict
        if (op1.data.id === op2.data.id && op1.userId !== op2.userId) {
            return true;
        }
        
        // Constraint conflicts
        if (this.constraintConflict(op1, op2)) {
            return true;
        }
        
        // Resource allocation conflicts
        if (this.resourceConflict(op1, op2)) {
            return true;
        }
        
        return false;
    }

    constraintConflict(op1, op2) {
        const constraintTypes = ['constraint.add', 'constraint.modify', 'constraint.remove'];
        
        if (constraintTypes.includes(op1.type) && constraintTypes.includes(op2.type)) {
            // Check if constraints affect the same entities
            const entities1 = this.extractAffectedEntities(op1);
            const entities2 = this.extractAffectedEntities(op2);
            
            return entities1.some(entity => entities2.includes(entity));
        }
        
        return false;
    }

    resourceConflict(op1, op2) {
        const resourceTypes = ['team.assign', 'venue.allocate'];
        
        if (resourceTypes.includes(op1.type) && resourceTypes.includes(op2.type)) {
            // Check for double allocation
            return op1.data.resourceId === op2.data.resourceId &&
                   op1.data.timeSlot === op2.data.timeSlot;
        }
        
        return false;
    }

    handleConflictResolution(operation, conflicts) {
        const conflictId = uuidv4();
        const conflict = {
            id: conflictId,
            operation,
            conflicts,
            timestamp: Date.now(),
            status: 'pending',
            resolution: null
        };
        
        this.conflicts.set(conflictId, conflict);
        
        // Apply resolution strategy
        const resolution = this.resolveConflict(conflict);
        
        if (resolution.automatic) {
            // Apply automatic resolution
            this.applyResolution(conflict, resolution);
            return resolution.resolvedOperation;
        } else {
            // Notify users of manual resolution needed
            this.notifyConflict(conflict);
            return null;
        }
    }

    resolveConflict(conflict) {
        const { operation, conflicts } = conflict;
        
        // Priority-based resolution strategies
        const strategies = [
            this.timestampResolution,
            this.userPriorityResolution,
            this.operationTypeResolution,
            this.manualResolution
        ];
        
        for (const strategy of strategies) {
            const resolution = strategy.call(this, operation, conflicts);
            if (resolution) {
                return resolution;
            }
        }
        
        // Fallback to manual resolution
        return { automatic: false, requiresManual: true };
    }

    timestampResolution(operation, conflicts) {
        // Last-writer-wins based on timestamp
        const allOps = [operation, ...conflicts];
        const latest = allOps.reduce((latest, op) => 
            op.timestamp > latest.timestamp ? op : latest
        );
        
        return {
            automatic: true,
            strategy: 'timestamp',
            resolvedOperation: latest,
            discardedOperations: allOps.filter(op => op !== latest)
        };
    }

    userPriorityResolution(operation, conflicts) {
        // Resolve based on user permissions and roles
        const allOps = [operation, ...conflicts];
        const priorityOrder = ['admin', 'editor', 'collaborator', 'viewer'];
        
        const sorted = allOps.sort((a, b) => {
            const userA = this.users.get(a.userId);
            const userB = this.users.get(b.userId);
            
            const priorityA = priorityOrder.indexOf(userA?.role || 'viewer');
            const priorityB = priorityOrder.indexOf(userB?.role || 'viewer');
            
            return priorityA - priorityB;
        });
        
        return {
            automatic: true,
            strategy: 'userPriority',
            resolvedOperation: sorted[0],
            discardedOperations: sorted.slice(1)
        };
    }

    operationTypeResolution(operation, conflicts) {
        // Resolve based on operation type hierarchy
        const typeHierarchy = {
            'schedule.delete': 1,
            'schedule.create': 2,
            'schedule.update': 3,
            'constraint.remove': 4,
            'constraint.add': 5,
            'constraint.modify': 6
        };
        
        const allOps = [operation, ...conflicts];
        const sorted = allOps.sort((a, b) => 
            (typeHierarchy[a.type] || 10) - (typeHierarchy[b.type] || 10)
        );
        
        return {
            automatic: true,
            strategy: 'operationType',
            resolvedOperation: sorted[0],
            discardedOperations: sorted.slice(1)
        };
    }

    /**
     * Vector Clock for causality tracking
     */
    generateVectorClock(userId) {
        const clock = {};
        this.users.forEach((user, id) => {
            clock[id] = user.vectorClock || 0;
        });
        clock[userId] = (clock[userId] || 0) + 1;
        
        // Update user's vector clock
        const user = this.users.get(userId);
        if (user) {
            user.vectorClock = clock[userId];
        }
        
        return clock;
    }

    compareVectorClocks(clock1, clock2) {
        const allKeys = new Set([...Object.keys(clock1), ...Object.keys(clock2)]);
        let relation = 'concurrent';
        
        let clock1Greater = false;
        let clock2Greater = false;
        
        for (const key of allKeys) {
            const val1 = clock1[key] || 0;
            const val2 = clock2[key] || 0;
            
            if (val1 > val2) clock1Greater = true;
            if (val2 > val1) clock2Greater = true;
        }
        
        if (clock1Greater && !clock2Greater) return 'after';
        if (clock2Greater && !clock1Greater) return 'before';
        if (!clock1Greater && !clock2Greater) return 'equal';
        
        return 'concurrent';
    }

    /**
     * Broadcasting and synchronization
     */
    broadcastOperation(operation) {
        this.users.forEach((user, userId) => {
            if (userId !== operation.userId) {
                this.emit('operationBroadcast', {
                    targetUser: userId,
                    operation
                });
            }
        });
    }

    broadcastCursorUpdate(userId, cursor) {
        this.users.forEach((user, targetUserId) => {
            if (targetUserId !== userId) {
                this.emit('cursorUpdate', {
                    targetUser: targetUserId,
                    userId,
                    cursor
                });
            }
        });
    }

    broadcastSelectionUpdate(userId, selections) {
        this.users.forEach((user, targetUserId) => {
            if (targetUserId !== userId) {
                this.emit('selectionUpdate', {
                    targetUser: targetUserId,
                    userId,
                    selections: Array.from(selections)
                });
            }
        });
    }

    notifyConflict(conflict) {
        const affectedUsers = new Set([
            conflict.operation.userId,
            ...conflict.conflicts.map(op => op.userId)
        ]);
        
        affectedUsers.forEach(userId => {
            this.emit('conflictNotification', {
                targetUser: userId,
                conflict: {
                    id: conflict.id,
                    type: 'manual_resolution_required',
                    operations: [conflict.operation, ...conflict.conflicts],
                    timestamp: conflict.timestamp
                }
            });
        });
    }

    /**
     * State synchronization and recovery
     */
    getState(filter = null) {
        if (!filter) {
            return Object.fromEntries(this.state);
        }
        
        const filtered = new Map();
        this.state.forEach((value, key) => {
            if (filter(key, value)) {
                filtered.set(key, value);
            }
        });
        
        return Object.fromEntries(filtered);
    }

    synchronizeUser(userId) {
        const user = this.users.get(userId);
        if (!user) return;
        
        const state = this.getState();
        const recentOperations = this.getRecentOperations(Date.now() - 60000); // Last minute
        
        this.emit('stateSync', {
            targetUser: userId,
            state,
            operations: recentOperations,
            users: this.getActiveUsers(),
            cursors: Object.fromEntries(this.cursors)
        });
    }

    /**
     * Utility methods
     */
    generateUserColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getActiveUsers() {
        const users = {};
        this.users.forEach((user, userId) => {
            users[userId] = {
                id: user.id,
                name: user.name,
                color: user.color,
                cursor: user.cursor,
                selections: Array.from(user.selections),
                lastActivity: user.lastActivity
            };
        });
        return users;
    }

    getRecentOperations(since) {
        return Array.from(this.operations.values())
            .filter(op => op.timestamp >= since)
            .sort((a, b) => a.timestamp - b.timestamp);
    }

    validateOperation(operation) {
        // Basic validation
        if (!operation.id || !operation.userId || !operation.type) {
            return false;
        }
        
        // User permission validation
        const user = this.users.get(operation.userId);
        if (!user) return false;
        
        const requiredPermission = this.getRequiredPermission(operation.type);
        return user.permissions.includes(requiredPermission);
    }

    getRequiredPermission(operationType) {
        const permissionMap = {
            'schedule.create': 'write',
            'schedule.update': 'write',
            'schedule.delete': 'admin',
            'constraint.add': 'write',
            'constraint.modify': 'write',
            'constraint.remove': 'write',
            'team.assign': 'write',
            'venue.allocate': 'write'
        };
        
        return permissionMap[operationType] || 'read';
    }

    extractAffectedEntities(operation) {
        // Extract entities affected by the operation
        const entities = [];
        
        if (operation.data.scheduleId) entities.push(`schedule:${operation.data.scheduleId}`);
        if (operation.data.teamId) entities.push(`team:${operation.data.teamId}`);
        if (operation.data.venueId) entities.push(`venue:${operation.data.venueId}`);
        if (operation.data.constraintId) entities.push(`constraint:${operation.data.constraintId}`);
        
        return entities;
    }

    startSyncTimer() {
        this.syncTimer = setInterval(() => {
            this.emit('syncTick');
        }, this.config.syncInterval);
    }

    startPresenceTimer() {
        this.presenceTimer = setInterval(() => {
            const now = Date.now();
            const inactiveUsers = [];
            
            this.users.forEach((user, userId) => {
                if (now - user.lastActivity > this.config.presenceTimeout) {
                    inactiveUsers.push(userId);
                }
            });
            
            inactiveUsers.forEach(userId => this.removeUser(userId));
        }, this.config.presenceTimeout / 2);
    }

    handleOperation(operation) {
        try {
            return this.applyOperation(operation);
        } catch (error) {
            console.error('Operation handling failed:', error);
            this.emit('operationError', { operation, error });
        }
    }

    handleConflict(conflict) {
        console.log(`Conflict detected: ${conflict.id}`);
    }

    handleUserJoin(user) {
        console.log(`User joined: ${user.name} (${user.id})`);
        this.synchronizeUser(user.id);
    }

    handleUserLeave(user) {
        console.log(`User left: ${user.name} (${user.id})`);
    }

    destroy() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        
        if (this.presenceTimer) {
            clearInterval(this.presenceTimer);
        }
        
        this.removeAllListeners();
    }
}

/**
 * Operational Transform Engine
 * Handles transformation of concurrent operations
 */
class OperationalTransform {
    transform(operation, concurrentOperations) {
        let transformedOp = { ...operation };
        
        concurrentOperations.forEach(concurrentOp => {
            if (this.shouldTransform(transformedOp, concurrentOp)) {
                transformedOp = this.transformAgainst(transformedOp, concurrentOp);
            }
        });
        
        transformedOp.transformed = true;
        return transformedOp;
    }

    shouldTransform(op1, op2) {
        // Don't transform against operations from the same user
        if (op1.userId === op2.userId) return false;
        
        // Only transform if operations affect the same resource
        return this.operationsAffectSameResource(op1, op2);
    }

    operationsAffectSameResource(op1, op2) {
        return op1.data.id === op2.data.id ||
               op1.data.scheduleId === op2.data.scheduleId ||
               op1.data.resourceId === op2.data.resourceId;
    }

    transformAgainst(operation, concurrentOp) {
        const transformFunction = this.getTransformFunction(operation.type, concurrentOp.type);
        
        if (transformFunction) {
            return transformFunction(operation, concurrentOp);
        }
        
        return operation;
    }

    getTransformFunction(type1, type2) {
        const transformMap = {
            'schedule.update_schedule.update': this.transformUpdateUpdate,
            'schedule.update_schedule.delete': this.transformUpdateDelete,
            'constraint.add_constraint.add': this.transformConstraintAdd,
            'team.assign_team.assign': this.transformTeamAssign
        };
        
        return transformMap[`${type1}_${type2}`];
    }

    transformUpdateUpdate(op1, op2) {
        // Transform concurrent updates by merging non-conflicting fields
        const transformedData = { ...op1.data };
        
        // Remove fields that were updated by the concurrent operation
        Object.keys(op2.data.updates || {}).forEach(field => {
            if (transformedData.updates && transformedData.updates[field]) {
                // Field conflict - apply timestamp-based resolution
                if (op2.timestamp > op1.timestamp) {
                    delete transformedData.updates[field];
                }
            }
        });
        
        return { ...op1, data: transformedData };
    }

    transformUpdateDelete(op1, op2) {
        // Transform update against delete - operation becomes no-op
        return { ...op1, type: 'noop', data: {} };
    }

    transformConstraintAdd(op1, op2) {
        // Handle concurrent constraint additions
        if (op1.data.constraintType === op2.data.constraintType &&
            JSON.stringify(op1.data.entities) === JSON.stringify(op2.data.entities)) {
            // Duplicate constraint - make second one a no-op
            return op1.timestamp > op2.timestamp ? op1 : { ...op1, type: 'noop' };
        }
        
        return op1;
    }

    transformTeamAssign(op1, op2) {
        // Handle concurrent team assignments
        if (op1.data.teamId === op2.data.teamId && op1.data.timeSlot === op2.data.timeSlot) {
            // Double assignment conflict - apply user priority
            return { ...op1, data: { ...op1.data, conflictResolution: 'priority' } };
        }
        
        return op1;
    }
}

module.exports = CollaborationEngine;