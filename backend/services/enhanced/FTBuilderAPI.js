/**
 * FlexTime Builder API Layer
 * Comprehensive RESTful API with WebSocket integration for real-time collaboration
 * 
 * Features:
 * - Complete CRUD operations for schedules
 * - Batch operations for efficiency
 * - Streaming APIs for real-time updates
 * - GraphQL endpoint for flexible queries
 * - Rate limiting and throttling
 * - API versioning and backward compatibility
 * - WebSocket integration for real-time collaboration
 */

const express = require('express');
const WebSocket = require('ws');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const Redis = require('redis');
const EventEmitter = require('events');

class FTBuilderAPI extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            port: options.port || 3006,
            redisUrl: options.redisUrl || 'redis://localhost:6379',
            apiVersion: 'v1',
            enableGraphQL: options.enableGraphQL !== false,
            enableWebSocket: options.enableWebSocket !== false,
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // requests per window
                standardHeaders: true,
                legacyHeaders: false,
                ...options.rateLimit
            },
            ...options
        };

        this.app = express();
        this.server = null;
        this.wss = null;
        this.redis = null;
        this.connections = new Map(); // WebSocket connections
        this.scheduleCache = new Map(); // In-memory cache for performance
        
        this.initializeMiddleware();
        this.initializeRedis();
        this.initializeRoutes();
        
        if (this.options.enableGraphQL) {
            this.initializeGraphQL();
        }
    }

    /**
     * Initialize Express middleware
     */
    initializeMiddleware() {
        // Security
        this.app.use(helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                },
            },
        }));

        // CORS
        this.app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://your-domain.com'] 
                : ['http://localhost:3000', 'http://localhost:3005'],
            credentials: true
        }));

        // Compression
        this.app.use(compression());

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Rate limiting
        const limiter = rateLimit(this.options.rateLimit);
        this.app.use(`/api/${this.options.apiVersion}`, limiter);

        // Request logging
        this.app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });

        // API versioning middleware
        this.app.use(`/api/${this.options.apiVersion}`, (req, res, next) => {
            req.apiVersion = this.options.apiVersion;
            next();
        });
    }

    /**
     * Initialize Redis connection
     */
    async initializeRedis() {
        try {
            this.redis = Redis.createClient({ url: this.options.redisUrl });
            await this.redis.connect();
            console.log('Redis connected successfully');
        } catch (error) {
            console.warn('Redis connection failed, using in-memory fallback:', error.message);
            this.redis = null;
        }
    }

    /**
     * Initialize API routes
     */
    initializeRoutes() {
        const router = express.Router();

        // Health check
        router.get('/health', this.handleHealthCheck.bind(this));

        // Schedule CRUD operations
        router.get('/schedules', this.handleGetSchedules.bind(this));
        router.get('/schedules/:id', this.handleGetSchedule.bind(this));
        router.post('/schedules', this.handleCreateSchedule.bind(this));
        router.put('/schedules/:id', this.handleUpdateSchedule.bind(this));
        router.patch('/schedules/:id', this.handlePatchSchedule.bind(this));
        router.delete('/schedules/:id', this.handleDeleteSchedule.bind(this));

        // Batch operations
        router.post('/schedules/batch', this.handleBatchCreate.bind(this));
        router.put('/schedules/batch', this.handleBatchUpdate.bind(this));
        router.delete('/schedules/batch', this.handleBatchDelete.bind(this));

        // Streaming endpoints
        router.get('/schedules/:id/stream', this.handleScheduleStream.bind(this));
        router.get('/events/stream', this.handleEventStream.bind(this));

        // Advanced operations
        router.post('/schedules/:id/clone', this.handleCloneSchedule.bind(this));
        router.post('/schedules/:id/optimize', this.handleOptimizeSchedule.bind(this));
        router.get('/schedules/:id/conflicts', this.handleGetConflicts.bind(this));
        router.post('/schedules/:id/resolve-conflicts', this.handleResolveConflicts.bind(this));

        // Analytics and reporting
        router.get('/analytics/schedules', this.handleScheduleAnalytics.bind(this));
        router.get('/reports/performance', this.handlePerformanceReport.bind(this));

        // Collaboration features
        router.post('/schedules/:id/collaborate', this.handleJoinCollaboration.bind(this));
        router.delete('/schedules/:id/collaborate/:userId', this.handleLeaveCollaboration.bind(this));
        router.get('/schedules/:id/collaborators', this.handleGetCollaborators.bind(this));

        this.app.use(`/api/${this.options.apiVersion}`, router);

        // Error handling
        this.app.use(this.handleError.bind(this));
    }

    /**
     * Initialize GraphQL endpoint
     */
    initializeGraphQL() {
        const schema = buildSchema(`
            type Schedule {
                id: ID!
                name: String!
                description: String
                games: [Game!]!
                constraints: [Constraint!]!
                status: ScheduleStatus!
                createdAt: String!
                updatedAt: String!
                collaborators: [User!]!
                metrics: ScheduleMetrics!
            }

            type Game {
                id: ID!
                homeTeam: Team!
                awayTeam: Team!
                venue: Venue!
                dateTime: String!
                status: GameStatus!
                constraints: [Constraint!]!
            }

            type Team {
                id: ID!
                name: String!
                shortName: String!
                conference: String!
                division: String
            }

            type Venue {
                id: ID!
                name: String!
                location: String!
                capacity: Int!
                surface: String
                isNeutral: Boolean!
            }

            type Constraint {
                id: ID!
                type: ConstraintType!
                weight: Float!
                description: String!
                isHard: Boolean!
                parameters: String
            }

            type User {
                id: ID!
                name: String!
                email: String!
                role: UserRole!
            }

            type ScheduleMetrics {
                totalGames: Int!
                conflicts: Int!
                efficiency: Float!
                travelDistance: Float!
                averageGap: Float!
            }

            enum ScheduleStatus {
                DRAFT
                IN_PROGRESS
                COMPLETED
                PUBLISHED
                ARCHIVED
            }

            enum GameStatus {
                SCHEDULED
                CONFIRMED
                COMPLETED
                CANCELLED
                POSTPONED
            }

            enum ConstraintType {
                DATE_RANGE
                VENUE_AVAILABILITY
                TEAM_AVAILABILITY
                TRAVEL_LIMIT
                REST_PERIOD
                RIVALRY_GAME
                TV_WINDOW
                CUSTOM
            }

            enum UserRole {
                ADMIN
                SCHEDULER
                COLLABORATOR
                VIEWER
            }

            type Query {
                schedules(filter: ScheduleFilter): [Schedule!]!
                schedule(id: ID!): Schedule
                games(scheduleId: ID!, filter: GameFilter): [Game!]!
                teams(conference: String): [Team!]!
                venues(location: String): [Venue!]!
                conflicts(scheduleId: ID!): [Conflict!]!
                analytics(scheduleId: ID!): ScheduleMetrics!
            }

            type Mutation {
                createSchedule(input: CreateScheduleInput!): Schedule!
                updateSchedule(id: ID!, input: UpdateScheduleInput!): Schedule!
                deleteSchedule(id: ID!): Boolean!
                addGame(scheduleId: ID!, input: AddGameInput!): Game!
                updateGame(id: ID!, input: UpdateGameInput!): Game!
                deleteGame(id: ID!): Boolean!
                optimizeSchedule(id: ID!, options: OptimizationOptions): Schedule!
                resolveConflicts(scheduleId: ID!, resolutions: [ConflictResolution!]!): Schedule!
            }

            type Subscription {
                scheduleUpdated(id: ID!): Schedule!
                gameUpdated(scheduleId: ID!): Game!
                conflictDetected(scheduleId: ID!): Conflict!
                collaboratorJoined(scheduleId: ID!): User!
                collaboratorLeft(scheduleId: ID!): User!
            }

            input ScheduleFilter {
                status: ScheduleStatus
                createdAfter: String
                createdBefore: String
                nameContains: String
            }

            input GameFilter {
                team: String
                venue: String
                dateAfter: String
                dateBefore: String
                status: GameStatus
            }

            input CreateScheduleInput {
                name: String!
                description: String
                constraints: [ConstraintInput!]!
                template: ID
            }

            input UpdateScheduleInput {
                name: String
                description: String
                status: ScheduleStatus
            }

            input AddGameInput {
                homeTeamId: ID!
                awayTeamId: ID!
                venueId: ID!
                dateTime: String!
                constraints: [ConstraintInput!]
            }

            input UpdateGameInput {
                homeTeamId: ID
                awayTeamId: ID
                venueId: ID
                dateTime: String
                status: GameStatus
            }

            input ConstraintInput {
                type: ConstraintType!
                weight: Float!
                description: String!
                isHard: Boolean!
                parameters: String
            }

            input OptimizationOptions {
                algorithm: String
                maxIterations: Int
                prioritizeTravel: Boolean
                prioritizeRest: Boolean
            }

            input ConflictResolution {
                conflictId: ID!
                action: ConflictAction!
                parameters: String
            }

            enum ConflictAction {
                RESCHEDULE
                CHANGE_VENUE
                OVERRIDE
                IGNORE
            }

            type Conflict {
                id: ID!
                type: ConflictType!
                severity: ConflictSeverity!
                description: String!
                affectedGames: [Game!]!
                suggestedResolutions: [ConflictResolution!]!
            }

            enum ConflictType {
                VENUE_DOUBLE_BOOKING
                TRAVEL_VIOLATION
                REST_VIOLATION
                DATE_CONSTRAINT
                CUSTOM_CONSTRAINT
            }

            enum ConflictSeverity {
                LOW
                MEDIUM
                HIGH
                CRITICAL
            }
        `);

        const root = {
            // Queries
            schedules: this.graphqlGetSchedules.bind(this),
            schedule: this.graphqlGetSchedule.bind(this),
            games: this.graphqlGetGames.bind(this),
            teams: this.graphqlGetTeams.bind(this),
            venues: this.graphqlGetVenues.bind(this),
            conflicts: this.graphqlGetConflicts.bind(this),
            analytics: this.graphqlGetAnalytics.bind(this),

            // Mutations
            createSchedule: this.graphqlCreateSchedule.bind(this),
            updateSchedule: this.graphqlUpdateSchedule.bind(this),
            deleteSchedule: this.graphqlDeleteSchedule.bind(this),
            addGame: this.graphqlAddGame.bind(this),
            updateGame: this.graphqlUpdateGame.bind(this),
            deleteGame: this.graphqlDeleteGame.bind(this),
            optimizeSchedule: this.graphqlOptimizeSchedule.bind(this),
            resolveConflicts: this.graphqlResolveConflicts.bind(this),
        };

        this.app.use('/graphql', graphqlHTTP({
            schema: schema,
            rootValue: root,
            graphiql: process.env.NODE_ENV !== 'production',
            context: (req) => ({ req }),
        }));
    }

    /**
     * Start the API server
     */
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.options.port, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                console.log(`FT Builder API server running on port ${this.options.port}`);
                
                if (this.options.enableWebSocket) {
                    this.initializeWebSocket();
                }

                resolve();
            });
        });
    }

    /**
     * Initialize WebSocket server
     */
    initializeWebSocket() {
        this.wss = new WebSocket.Server({ 
            server: this.server,
            path: '/ws'
        });

        this.wss.on('connection', (ws, req) => {
            const connectionId = this.generateId();
            const userId = this.extractUserId(req);
            
            this.connections.set(connectionId, {
                ws,
                userId,
                subscriptions: new Set(),
                joinedAt: new Date()
            });

            ws.on('message', (data) => {
                this.handleWebSocketMessage(connectionId, data);
            });

            ws.on('close', () => {
                this.handleWebSocketClose(connectionId);
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.connections.delete(connectionId);
            });

            // Send welcome message
            this.sendToConnection(connectionId, {
                type: 'connected',
                connectionId,
                timestamp: new Date().toISOString()
            });

            console.log(`WebSocket connection established: ${connectionId} (User: ${userId})`);
        });

        console.log('WebSocket server initialized');
    }

    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(connectionId, data) {
        try {
            const message = JSON.parse(data);
            const connection = this.connections.get(connectionId);
            
            if (!connection) {
                return;
            }

            switch (message.type) {
                case 'subscribe':
                    this.handleSubscribe(connectionId, message);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscribe(connectionId, message);
                    break;
                case 'ping':
                    this.sendToConnection(connectionId, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                case 'join_collaboration':
                    this.handleJoinCollaborationWS(connectionId, message);
                    break;
                case 'leave_collaboration':
                    this.handleLeaveCollaborationWS(connectionId, message);
                    break;
                case 'cursor_update':
                    this.handleCursorUpdate(connectionId, message);
                    break;
                case 'selection_update':
                    this.handleSelectionUpdate(connectionId, message);
                    break;
                default:
                    console.warn('Unknown WebSocket message type:', message.type);
            }
        } catch (error) {
            console.error('Error handling WebSocket message:', error);
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Invalid message format',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle WebSocket connection close
     */
    handleWebSocketClose(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            // Notify other collaborators
            connection.subscriptions.forEach(subscription => {
                if (subscription.startsWith('collaboration:')) {
                    const scheduleId = subscription.split(':')[1];
                    this.broadcastToSchedule(scheduleId, {
                        type: 'collaborator_left',
                        userId: connection.userId,
                        timestamp: new Date().toISOString()
                    }, connectionId);
                }
            });
            
            this.connections.delete(connectionId);
            console.log(`WebSocket connection closed: ${connectionId}`);
        }
    }

    // REST API Handlers

    /**
     * Health check endpoint
     */
    async handleHealthCheck(req, res) {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: this.options.apiVersion,
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: {
                websocket: this.connections.size,
                redis: this.redis ? 'connected' : 'disconnected'
            }
        };

        res.json(health);
    }

    /**
     * Get all schedules
     */
    async handleGetSchedules(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                sort = 'createdAt',
                order = 'desc',
                status,
                search,
                userId
            } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (search) filters.search = search;
            if (userId) filters.userId = userId;

            const schedules = await this.getSchedules({
                page: parseInt(page),
                limit: parseInt(limit),
                sort,
                order,
                filters
            });

            res.json({
                data: schedules.data,
                pagination: schedules.pagination,
                meta: {
                    total: schedules.total,
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Get single schedule
     */
    async handleGetSchedule(req, res) {
        try {
            const { id } = req.params;
            const { include } = req.query;

            const schedule = await this.getSchedule(id, { include });
            
            if (!schedule) {
                return res.status(404).json({
                    error: 'Schedule not found',
                    code: 'SCHEDULE_NOT_FOUND'
                });
            }

            res.json({ data: schedule });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Create new schedule
     */
    async handleCreateSchedule(req, res) {
        try {
            const scheduleData = req.body;
            const userId = this.extractUserId(req);

            const schedule = await this.createSchedule({
                ...scheduleData,
                createdBy: userId
            });

            // Notify WebSocket subscribers
            this.broadcastToAll({
                type: 'schedule_created',
                data: schedule,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({ data: schedule });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Update schedule
     */
    async handleUpdateSchedule(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const userId = this.extractUserId(req);

            const schedule = await this.updateSchedule(id, {
                ...updateData,
                updatedBy: userId
            });

            if (!schedule) {
                return res.status(404).json({
                    error: 'Schedule not found',
                    code: 'SCHEDULE_NOT_FOUND'
                });
            }

            // Notify WebSocket subscribers
            this.broadcastToSchedule(id, {
                type: 'schedule_updated',
                data: schedule,
                updatedBy: userId,
                timestamp: new Date().toISOString()
            });

            res.json({ data: schedule });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Patch schedule (partial update)
     */
    async handlePatchSchedule(req, res) {
        try {
            const { id } = req.params;
            const patchData = req.body;
            const userId = this.extractUserId(req);

            const schedule = await this.patchSchedule(id, {
                ...patchData,
                updatedBy: userId
            });

            if (!schedule) {
                return res.status(404).json({
                    error: 'Schedule not found',
                    code: 'SCHEDULE_NOT_FOUND'
                });
            }

            // Notify WebSocket subscribers
            this.broadcastToSchedule(id, {
                type: 'schedule_patched',
                data: schedule,
                changes: patchData,
                updatedBy: userId,
                timestamp: new Date().toISOString()
            });

            res.json({ data: schedule });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Delete schedule
     */
    async handleDeleteSchedule(req, res) {
        try {
            const { id } = req.params;
            const userId = this.extractUserId(req);

            const deleted = await this.deleteSchedule(id, userId);

            if (!deleted) {
                return res.status(404).json({
                    error: 'Schedule not found',
                    code: 'SCHEDULE_NOT_FOUND'
                });
            }

            // Notify WebSocket subscribers
            this.broadcastToSchedule(id, {
                type: 'schedule_deleted',
                scheduleId: id,
                deletedBy: userId,
                timestamp: new Date().toISOString()
            });

            res.status(204).send();
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Batch create schedules
     */
    async handleBatchCreate(req, res) {
        try {
            const { schedules } = req.body;
            const userId = this.extractUserId(req);

            if (!Array.isArray(schedules) || schedules.length === 0) {
                return res.status(400).json({
                    error: 'Invalid schedules array',
                    code: 'INVALID_BATCH_DATA'
                });
            }

            const results = await this.batchCreateSchedules(schedules, userId);

            // Notify WebSocket subscribers
            this.broadcastToAll({
                type: 'schedules_batch_created',
                data: results.success,
                errors: results.errors,
                createdBy: userId,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({
                data: results.success,
                errors: results.errors,
                meta: {
                    totalCreated: results.success.length,
                    totalErrors: results.errors.length
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Batch update schedules
     */
    async handleBatchUpdate(req, res) {
        try {
            const { updates } = req.body;
            const userId = this.extractUserId(req);

            if (!Array.isArray(updates) || updates.length === 0) {
                return res.status(400).json({
                    error: 'Invalid updates array',
                    code: 'INVALID_BATCH_DATA'
                });
            }

            const results = await this.batchUpdateSchedules(updates, userId);

            // Notify WebSocket subscribers for each updated schedule
            results.success.forEach(schedule => {
                this.broadcastToSchedule(schedule.id, {
                    type: 'schedule_updated',
                    data: schedule,
                    updatedBy: userId,
                    isBatch: true,
                    timestamp: new Date().toISOString()
                });
            });

            res.json({
                data: results.success,
                errors: results.errors,
                meta: {
                    totalUpdated: results.success.length,
                    totalErrors: results.errors.length
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Batch delete schedules
     */
    async handleBatchDelete(req, res) {
        try {
            const { ids } = req.body;
            const userId = this.extractUserId(req);

            if (!Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({
                    error: 'Invalid ids array',
                    code: 'INVALID_BATCH_DATA'
                });
            }

            const results = await this.batchDeleteSchedules(ids, userId);

            // Notify WebSocket subscribers for each deleted schedule
            results.success.forEach(scheduleId => {
                this.broadcastToSchedule(scheduleId, {
                    type: 'schedule_deleted',
                    scheduleId,
                    deletedBy: userId,
                    isBatch: true,
                    timestamp: new Date().toISOString()
                });
            });

            res.json({
                data: results.success,
                errors: results.errors,
                meta: {
                    totalDeleted: results.success.length,
                    totalErrors: results.errors.length
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Schedule streaming endpoint
     */
    async handleScheduleStream(req, res) {
        const { id } = req.params;
        
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const streamId = this.generateId();
        const cleanup = () => {
            this.removeEventListener(`schedule:${id}`, handleUpdate);
            res.end();
        };

        const handleUpdate = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        this.on(`schedule:${id}`, handleUpdate);

        req.on('close', cleanup);
        req.on('end', cleanup);

        // Send initial data
        try {
            const schedule = await this.getSchedule(id);
            if (schedule) {
                res.write(`data: ${JSON.stringify({
                    type: 'initial',
                    data: schedule,
                    timestamp: new Date().toISOString()
                })}\n\n`);
            }
        } catch (error) {
            res.write(`data: ${JSON.stringify({
                type: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            })}\n\n`);
        }

        // Keep connection alive
        const keepAlive = setInterval(() => {
            res.write(`data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
            })}\n\n`);
        }, 30000);

        req.on('close', () => {
            clearInterval(keepAlive);
        });
    }

    /**
     * Event streaming endpoint
     */
    async handleEventStream(req, res) {
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });

        const streamId = this.generateId();
        const cleanup = () => {
            this.removeEventListener('global:event', handleEvent);
            res.end();
        };

        const handleEvent = (data) => {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
        };

        this.on('global:event', handleEvent);

        req.on('close', cleanup);
        req.on('end', cleanup);

        // Send connection confirmation
        res.write(`data: ${JSON.stringify({
            type: 'connected',
            streamId,
            timestamp: new Date().toISOString()
        })}\n\n`);
    }

    /**
     * Clone schedule
     */
    async handleCloneSchedule(req, res) {
        try {
            const { id } = req.params;
            const { name, includeGames = true, includeConstraints = true } = req.body;
            const userId = this.extractUserId(req);

            const clonedSchedule = await this.cloneSchedule(id, {
                name,
                includeGames,
                includeConstraints,
                clonedBy: userId
            });

            if (!clonedSchedule) {
                return res.status(404).json({
                    error: 'Original schedule not found',
                    code: 'SCHEDULE_NOT_FOUND'
                });
            }

            // Notify WebSocket subscribers
            this.broadcastToAll({
                type: 'schedule_cloned',
                originalId: id,
                cloned: clonedSchedule,
                clonedBy: userId,
                timestamp: new Date().toISOString()
            });

            res.status(201).json({ data: clonedSchedule });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Optimize schedule
     */
    async handleOptimizeSchedule(req, res) {
        try {
            const { id } = req.params;
            const options = req.body;
            const userId = this.extractUserId(req);

            // Start optimization process
            const optimizationId = this.generateId();
            
            // Notify start of optimization
            this.broadcastToSchedule(id, {
                type: 'optimization_started',
                optimizationId,
                scheduleId: id,
                startedBy: userId,
                options,
                timestamp: new Date().toISOString()
            });

            // Run optimization asynchronously
            this.optimizeScheduleAsync(id, options, userId, optimizationId)
                .then(result => {
                    this.broadcastToSchedule(id, {
                        type: 'optimization_completed',
                        optimizationId,
                        scheduleId: id,
                        result,
                        timestamp: new Date().toISOString()
                    });
                })
                .catch(error => {
                    this.broadcastToSchedule(id, {
                        type: 'optimization_failed',
                        optimizationId,
                        scheduleId: id,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                });

            res.json({
                message: 'Optimization started',
                optimizationId,
                status: 'in_progress'
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Get schedule conflicts
     */
    async handleGetConflicts(req, res) {
        try {
            const { id } = req.params;
            const { severity, type, includeResolutions = true } = req.query;

            const conflicts = await this.getScheduleConflicts(id, {
                severity,
                type,
                includeResolutions: includeResolutions === 'true'
            });

            res.json({
                data: conflicts,
                meta: {
                    total: conflicts.length,
                    bySeverity: this.groupConflictsBySeverity(conflicts),
                    byType: this.groupConflictsByType(conflicts)
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Resolve conflicts
     */
    async handleResolveConflicts(req, res) {
        try {
            const { id } = req.params;
            const { resolutions } = req.body;
            const userId = this.extractUserId(req);

            if (!Array.isArray(resolutions) || resolutions.length === 0) {
                return res.status(400).json({
                    error: 'Invalid resolutions array',
                    code: 'INVALID_RESOLUTIONS'
                });
            }

            const results = await this.resolveConflicts(id, resolutions, userId);

            // Notify WebSocket subscribers
            this.broadcastToSchedule(id, {
                type: 'conflicts_resolved',
                scheduleId: id,
                resolutions: results.success,
                errors: results.errors,
                resolvedBy: userId,
                timestamp: new Date().toISOString()
            });

            res.json({
                data: results.success,
                errors: results.errors,
                meta: {
                    totalResolved: results.success.length,
                    totalErrors: results.errors.length
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Get schedule analytics
     */
    async handleScheduleAnalytics(req, res) {
        try {
            const {
                timeframe = '30d',
                metrics = 'all',
                groupBy = 'day'
            } = req.query;

            const analytics = await this.getScheduleAnalytics({
                timeframe,
                metrics: metrics === 'all' ? null : metrics.split(','),
                groupBy
            });

            res.json({ data: analytics });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Get performance report
     */
    async handlePerformanceReport(req, res) {
        try {
            const {
                startDate,
                endDate,
                includeSystemMetrics = true,
                includeUserMetrics = true
            } = req.query;

            const report = await this.getPerformanceReport({
                startDate,
                endDate,
                includeSystemMetrics: includeSystemMetrics === 'true',
                includeUserMetrics: includeUserMetrics === 'true'
            });

            res.json({ data: report });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Join collaboration
     */
    async handleJoinCollaboration(req, res) {
        try {
            const { id } = req.params;
            const userId = this.extractUserId(req);
            const { role = 'collaborator' } = req.body;

            const collaboration = await this.joinCollaboration(id, userId, role);

            // Notify other collaborators
            this.broadcastToSchedule(id, {
                type: 'collaborator_joined',
                scheduleId: id,
                userId,
                role,
                timestamp: new Date().toISOString()
            }, null, [userId]);

            res.json({ data: collaboration });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Leave collaboration
     */
    async handleLeaveCollaboration(req, res) {
        try {
            const { id, userId: targetUserId } = req.params;
            const currentUserId = this.extractUserId(req);

            // Only allow users to remove themselves or admins to remove others
            if (targetUserId !== currentUserId && !await this.isScheduleAdmin(id, currentUserId)) {
                return res.status(403).json({
                    error: 'Insufficient permissions',
                    code: 'FORBIDDEN'
                });
            }

            const success = await this.leaveCollaboration(id, targetUserId);

            if (!success) {
                return res.status(404).json({
                    error: 'Collaboration not found',
                    code: 'COLLABORATION_NOT_FOUND'
                });
            }

            // Notify other collaborators
            this.broadcastToSchedule(id, {
                type: 'collaborator_left',
                scheduleId: id,
                userId: targetUserId,
                removedBy: currentUserId,
                timestamp: new Date().toISOString()
            }, null, [targetUserId]);

            res.status(204).send();
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    /**
     * Get collaborators
     */
    async handleGetCollaborators(req, res) {
        try {
            const { id } = req.params;

            const collaborators = await this.getCollaborators(id);

            res.json({
                data: collaborators,
                meta: {
                    total: collaborators.length,
                    online: this.getOnlineCollaborators(id).length
                }
            });
        } catch (error) {
            this.handleErrorResponse(res, error);
        }
    }

    // WebSocket Handlers

    /**
     * Handle subscription requests
     */
    handleSubscribe(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { channel, filters } = message;
        
        // Validate subscription permissions
        if (!this.validateSubscriptionPermissions(connection.userId, channel, filters)) {
            this.sendToConnection(connectionId, {
                type: 'subscription_error',
                error: 'Insufficient permissions',
                channel,
                timestamp: new Date().toISOString()
            });
            return;
        }

        connection.subscriptions.add(channel);
        
        this.sendToConnection(connectionId, {
            type: 'subscribed',
            channel,
            timestamp: new Date().toISOString()
        });

        console.log(`Connection ${connectionId} subscribed to ${channel}`);
    }

    /**
     * Handle unsubscription requests
     */
    handleUnsubscribe(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { channel } = message;
        connection.subscriptions.delete(channel);
        
        this.sendToConnection(connectionId, {
            type: 'unsubscribed',
            channel,
            timestamp: new Date().toISOString()
        });

        console.log(`Connection ${connectionId} unsubscribed from ${channel}`);
    }

    /**
     * Handle collaboration join via WebSocket
     */
    async handleJoinCollaborationWS(connectionId, message) {
        try {
            const connection = this.connections.get(connectionId);
            if (!connection) return;

            const { scheduleId, role = 'collaborator' } = message;
            
            const collaboration = await this.joinCollaboration(scheduleId, connection.userId, role);
            
            // Subscribe to collaboration channel
            connection.subscriptions.add(`collaboration:${scheduleId}`);
            
            // Notify other collaborators
            this.broadcastToSchedule(scheduleId, {
                type: 'collaborator_joined',
                scheduleId,
                userId: connection.userId,
                role,
                timestamp: new Date().toISOString()
            }, connectionId);

            this.sendToConnection(connectionId, {
                type: 'collaboration_joined',
                scheduleId,
                collaboration,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.sendToConnection(connectionId, {
                type: 'collaboration_error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle collaboration leave via WebSocket
     */
    async handleLeaveCollaborationWS(connectionId, message) {
        try {
            const connection = this.connections.get(connectionId);
            if (!connection) return;

            const { scheduleId } = message;
            
            const success = await this.leaveCollaboration(scheduleId, connection.userId);
            
            // Unsubscribe from collaboration channel
            connection.subscriptions.delete(`collaboration:${scheduleId}`);
            
            if (success) {
                // Notify other collaborators
                this.broadcastToSchedule(scheduleId, {
                    type: 'collaborator_left',
                    scheduleId,
                    userId: connection.userId,
                    timestamp: new Date().toISOString()
                }, connectionId);
            }

            this.sendToConnection(connectionId, {
                type: 'collaboration_left',
                scheduleId,
                success,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            this.sendToConnection(connectionId, {
                type: 'collaboration_error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle cursor updates for collaboration
     */
    handleCursorUpdate(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { scheduleId, position, element } = message;
        
        // Broadcast cursor position to other collaborators
        this.broadcastToSchedule(scheduleId, {
            type: 'cursor_update',
            scheduleId,
            userId: connection.userId,
            position,
            element,
            timestamp: new Date().toISOString()
        }, connectionId);
    }

    /**
     * Handle selection updates for collaboration
     */
    handleSelectionUpdate(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection) return;

        const { scheduleId, selection, action } = message;
        
        // Broadcast selection to other collaborators
        this.broadcastToSchedule(scheduleId, {
            type: 'selection_update',
            scheduleId,
            userId: connection.userId,
            selection,
            action,
            timestamp: new Date().toISOString()
        }, connectionId);
    }

    // GraphQL Resolvers

    async graphqlGetSchedules(args, context) {
        const { filter } = args;
        return await this.getSchedules({
            filters: filter,
            userId: this.extractUserId(context.req)
        });
    }

    async graphqlGetSchedule(args, context) {
        const { id } = args;
        return await this.getSchedule(id, {
            userId: this.extractUserId(context.req)
        });
    }

    async graphqlGetGames(args, context) {
        const { scheduleId, filter } = args;
        return await this.getGames(scheduleId, {
            filters: filter,
            userId: this.extractUserId(context.req)
        });
    }

    async graphqlGetTeams(args, context) {
        const { conference } = args;
        return await this.getTeams({ conference });
    }

    async graphqlGetVenues(args, context) {
        const { location } = args;
        return await this.getVenues({ location });
    }

    async graphqlGetConflicts(args, context) {
        const { scheduleId } = args;
        return await this.getScheduleConflicts(scheduleId, {
            userId: this.extractUserId(context.req)
        });
    }

    async graphqlGetAnalytics(args, context) {
        const { scheduleId } = args;
        return await this.getScheduleAnalytics({
            scheduleId,
            userId: this.extractUserId(context.req)
        });
    }

    async graphqlCreateSchedule(args, context) {
        const { input } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.createSchedule({
            ...input,
            createdBy: userId
        });
    }

    async graphqlUpdateSchedule(args, context) {
        const { id, input } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.updateSchedule(id, {
            ...input,
            updatedBy: userId
        });
    }

    async graphqlDeleteSchedule(args, context) {
        const { id } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.deleteSchedule(id, userId);
    }

    async graphqlAddGame(args, context) {
        const { scheduleId, input } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.addGame(scheduleId, {
            ...input,
            addedBy: userId
        });
    }

    async graphqlUpdateGame(args, context) {
        const { id, input } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.updateGame(id, {
            ...input,
            updatedBy: userId
        });
    }

    async graphqlDeleteGame(args, context) {
        const { id } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.deleteGame(id, userId);
    }

    async graphqlOptimizeSchedule(args, context) {
        const { id, options } = args;
        const userId = this.extractUserId(context.req);
        
        return await this.optimizeScheduleAsync(id, options, userId);
    }

    async graphqlResolveConflicts(args, context) {
        const { scheduleId, resolutions } = args;
        const userId = this.extractUserId(context.req);
        
        const results = await this.resolveConflicts(scheduleId, resolutions, userId);
        return results.schedule;
    }

    // Utility Methods

    /**
     * Send message to specific WebSocket connection
     */
    sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (connection && connection.ws.readyState === WebSocket.OPEN) {
            connection.ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcast message to all connections subscribed to a schedule
     */
    broadcastToSchedule(scheduleId, message, excludeConnectionId = null, excludeUserIds = []) {
        this.connections.forEach((connection, connectionId) => {
            if (connectionId === excludeConnectionId) return;
            if (excludeUserIds.includes(connection.userId)) return;
            
            if (connection.subscriptions.has(`collaboration:${scheduleId}`) ||
                connection.subscriptions.has(`schedule:${scheduleId}`)) {
                this.sendToConnection(connectionId, message);
            }
        });

        // Also emit for SSE streams
        this.emit(`schedule:${scheduleId}`, message);
    }

    /**
     * Broadcast message to all WebSocket connections
     */
    broadcastToAll(message, excludeConnectionId = null) {
        this.connections.forEach((connection, connectionId) => {
            if (connectionId === excludeConnectionId) return;
            this.sendToConnection(connectionId, message);
        });

        // Also emit for SSE streams
        this.emit('global:event', message);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    /**
     * Extract user ID from request
     */
    extractUserId(req) {
        // In production, this would extract from JWT token or session
        return req.headers['x-user-id'] || req.query.userId || 'anonymous';
    }

    /**
     * Validate subscription permissions
     */
    validateSubscriptionPermissions(userId, channel, filters) {
        // Implement permission validation logic
        // For now, allow all subscriptions for authenticated users
        return userId !== 'anonymous';
    }

    /**
     * Get online collaborators for a schedule
     */
    getOnlineCollaborators(scheduleId) {
        const online = [];
        this.connections.forEach((connection, connectionId) => {
            if (connection.subscriptions.has(`collaboration:${scheduleId}`)) {
                online.push(connection.userId);
            }
        });
        return [...new Set(online)]; // Remove duplicates
    }

    /**
     * Group conflicts by severity
     */
    groupConflictsBySeverity(conflicts) {
        return conflicts.reduce((groups, conflict) => {
            const severity = conflict.severity || 'unknown';
            groups[severity] = (groups[severity] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Group conflicts by type
     */
    groupConflictsByType(conflicts) {
        return conflicts.reduce((groups, conflict) => {
            const type = conflict.type || 'unknown';
            groups[type] = (groups[type] || 0) + 1;
            return groups;
        }, {});
    }

    /**
     * Handle API errors
     */
    handleError(error, req, res, next) {
        console.error('API Error:', error);

        if (res.headersSent) {
            return next(error);
        }

        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || 'Internal Server Error';
        const code = error.code || 'INTERNAL_ERROR';

        res.status(statusCode).json({
            error: message,
            code,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        });
    }

    /**
     * Handle error responses
     */
    handleErrorResponse(res, error) {
        console.error('Operation error:', error);

        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || 'Operation failed';
        const code = error.code || 'OPERATION_ERROR';

        res.status(statusCode).json({
            error: message,
            code,
            timestamp: new Date().toISOString()
        });
    }

    // Business Logic Methods (to be implemented based on your data layer)

    async getSchedules(options) {
        // Implement schedule retrieval logic
        // This would interact with your database/data layer
        throw new Error('getSchedules method not implemented');
    }

    async getSchedule(id, options) {
        // Implement single schedule retrieval logic
        throw new Error('getSchedule method not implemented');
    }

    async createSchedule(data) {
        // Implement schedule creation logic
        throw new Error('createSchedule method not implemented');
    }

    async updateSchedule(id, data) {
        // Implement schedule update logic
        throw new Error('updateSchedule method not implemented');
    }

    async patchSchedule(id, data) {
        // Implement schedule patch logic
        throw new Error('patchSchedule method not implemented');
    }

    async deleteSchedule(id, userId) {
        // Implement schedule deletion logic
        throw new Error('deleteSchedule method not implemented');
    }

    async batchCreateSchedules(schedules, userId) {
        // Implement batch create logic
        throw new Error('batchCreateSchedules method not implemented');
    }

    async batchUpdateSchedules(updates, userId) {
        // Implement batch update logic
        throw new Error('batchUpdateSchedules method not implemented');
    }

    async batchDeleteSchedules(ids, userId) {
        // Implement batch delete logic
        throw new Error('batchDeleteSchedules method not implemented');
    }

    async cloneSchedule(id, options) {
        // Implement schedule cloning logic
        throw new Error('cloneSchedule method not implemented');
    }

    async optimizeScheduleAsync(id, options, userId, optimizationId) {
        // Implement schedule optimization logic
        throw new Error('optimizeScheduleAsync method not implemented');
    }

    async getScheduleConflicts(id, options) {
        // Implement conflict detection logic
        throw new Error('getScheduleConflicts method not implemented');
    }

    async resolveConflicts(scheduleId, resolutions, userId) {
        // Implement conflict resolution logic
        throw new Error('resolveConflicts method not implemented');
    }

    async getScheduleAnalytics(options) {
        // Implement analytics logic
        throw new Error('getScheduleAnalytics method not implemented');
    }

    async getPerformanceReport(options) {
        // Implement performance reporting logic
        throw new Error('getPerformanceReport method not implemented');
    }

    async joinCollaboration(scheduleId, userId, role) {
        // Implement collaboration join logic
        throw new Error('joinCollaboration method not implemented');
    }

    async leaveCollaboration(scheduleId, userId) {
        // Implement collaboration leave logic
        throw new Error('leaveCollaboration method not implemented');
    }

    async getCollaborators(scheduleId) {
        // Implement collaborators retrieval logic
        throw new Error('getCollaborators method not implemented');
    }

    async isScheduleAdmin(scheduleId, userId) {
        // Implement admin check logic
        throw new Error('isScheduleAdmin method not implemented');
    }

    async getGames(scheduleId, options) {
        // Implement games retrieval logic
        throw new Error('getGames method not implemented');
    }

    async getTeams(options) {
        // Implement teams retrieval logic
        throw new Error('getTeams method not implemented');
    }

    async getVenues(options) {
        // Implement venues retrieval logic
        throw new Error('getVenues method not implemented');
    }

    async addGame(scheduleId, data) {
        // Implement add game logic
        throw new Error('addGame method not implemented');
    }

    async updateGame(id, data) {
        // Implement update game logic
        throw new Error('updateGame method not implemented');
    }

    async deleteGame(id, userId) {
        // Implement delete game logic
        throw new Error('deleteGame method not implemented');
    }

    /**
     * Stop the API server
     */
    async stop() {
        if (this.server) {
            return new Promise((resolve) => {
                this.server.close(() => {
                    console.log('FT Builder API server stopped');
                    resolve();
                });
            });
        }
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        if (this.redis) {
            await this.redis.disconnect();
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        this.connections.clear();
        this.scheduleCache.clear();
    }
}

module.exports = FTBuilderAPI;

// Example usage:
if (require.main === module) {
    const api = new FTBuilderAPI({
        port: 3006,
        enableGraphQL: true,
        enableWebSocket: true,
        rateLimit: {
            max: 2000 // Higher limit for development
        }
    });

    api.start()
        .then(() => {
            console.log('FT Builder API is running!');
            console.log('RESTful API: http://localhost:3006/api/v1/');
            console.log('GraphQL: http://localhost:3006/graphql');
            console.log('WebSocket: ws://localhost:3006/ws');
            console.log('Health Check: http://localhost:3006/api/v1/health');
        })
        .catch(error => {
            console.error('Failed to start FT Builder API:', error);
            process.exit(1);
        });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('Shutting down FT Builder API...');
        await api.stop();
        await api.cleanup();
        process.exit(0);
    });
}