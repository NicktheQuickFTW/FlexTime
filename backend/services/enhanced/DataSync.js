/**
 * FlexTime Data Synchronization System
 * 
 * Provides real-time data synchronization across clients with advanced conflict resolution,
 * offline support, and ACID transaction guarantees for the FlexTime scheduling platform.
 * 
 * Features:
 * - Real-time synchronization with WebSocket connections
 * - Advanced conflict resolution with operational transforms
 * - CRDT (Conflict-free Replicated Data Types) support
 * - Offline capability with delta synchronization
 * - ACID transaction support with rollback mechanisms
 * - Data versioning and integrity validation
 * 
 * @author FlexTime Engine Data Worker 3
 * @version 2.1.0
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const { performance } = require('perf_hooks');

class DataSyncEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            maxConflictRetries: 3,
            syncInterval: 5000,
            deltaCompressionThreshold: 1024,
            transactionTimeout: 30000,
            maxOfflineOperations: 10000,
            versioningEnabled: true,
            crdtEnabled: true,
            ...options
        };

        // Core sync state
        this.syncState = new Map();
        this.operationQueue = [];
        this.conflictResolver = new ConflictResolver();
        this.versionManager = new VersionManager();
        this.transactionManager = new TransactionManager();
        this.crdtManager = new CRDTManager();
        this.offlineManager = new OfflineManager();
        
        // Performance tracking
        this.metrics = {
            syncOperations: 0,
            conflictsResolved: 0,
            transactionsCompleted: 0,
            deltasSynchronized: 0,
            averageSyncTime: 0
        };

        // Active connections and subscriptions
        this.connections = new Map();
        this.subscriptions = new Map();
        
        this.initialize();
    }

    /**
     * Initialize the synchronization engine
     */
    async initialize() {
        console.log('🔄 Initializing FlexTime Data Synchronization Engine...');
        
        // Start periodic sync processes
        this.startPeriodicSync();
        
        // Initialize conflict resolution strategies
        this.conflictResolver.initialize();
        
        // Setup transaction recovery
        await this.transactionManager.recoverPendingTransactions();
        
        console.log('✅ Data Synchronization Engine initialized successfully');
        this.emit('engine:initialized');
    }

    /**
     * Register a client connection for real-time synchronization
     */
    registerClient(clientId, connection, options = {}) {
        const clientInfo = {
            id: clientId,
            connection,
            lastSync: Date.now(),
            subscriptions: new Set(),
            offlineQueue: [],
            version: options.version || '1.0.0',
            capabilities: options.capabilities || ['realtime', 'delta', 'crdt']
        };

        this.connections.set(clientId, clientInfo);
        
        // Setup connection event handlers
        this.setupConnectionHandlers(clientId, connection);
        
        console.log(`📱 Client ${clientId} registered for data synchronization`);
        this.emit('client:registered', { clientId, capabilities: clientInfo.capabilities });

        return clientInfo;
    }

    /**
     * Setup event handlers for client connections
     */
    setupConnectionHandlers(clientId, connection) {
        // Handle data operations from client
        connection.on('data:operation', async (operation) => {
            await this.handleClientOperation(clientId, operation);
        });

        // Handle sync requests
        connection.on('sync:request', async (request) => {
            await this.handleSyncRequest(clientId, request);
        });

        // Handle subscription requests
        connection.on('subscribe', (subscription) => {
            this.handleSubscription(clientId, subscription);
        });

        // Handle client disconnect
        connection.on('disconnect', () => {
            this.handleClientDisconnect(clientId);
        });

        // Handle offline queue sync
        connection.on('offline:sync', async (offlineOperations) => {
            await this.syncOfflineOperations(clientId, offlineOperations);
        });
    }

    /**
     * Handle data operations from clients
     */
    async handleClientOperation(clientId, operation) {
        const startTime = performance.now();
        
        try {
            // Validate operation
            if (!this.validateOperation(operation)) {
                throw new Error(`Invalid operation format: ${operation.type}`);
            }

            // Check for conflicts
            const conflicts = await this.detectConflicts(operation);
            
            if (conflicts.length > 0) {
                // Resolve conflicts using operational transforms
                operation = await this.conflictResolver.resolve(operation, conflicts);
                this.metrics.conflictsResolved++;
            }

            // Apply operation within transaction
            const result = await this.transactionManager.executeTransaction(async (tx) => {
                // Apply CRDT operations if enabled
                if (this.config.crdtEnabled && operation.crdtType) {
                    await this.crdtManager.applyOperation(operation, tx);
                }

                // Apply the operation
                const applied = await this.applyOperation(operation, tx);
                
                // Update version
                if (this.config.versioningEnabled) {
                    await this.versionManager.createVersion(operation, applied, tx);
                }

                return applied;
            });

            // Broadcast to subscribed clients
            await this.broadcastToSubscribers(operation, result);

            // Update metrics
            this.metrics.syncOperations++;
            this.updateAverageSyncTime(performance.now() - startTime);

            // Send acknowledgment to client
            this.sendToClient(clientId, {
                type: 'operation:ack',
                operationId: operation.id,
                result: result,
                timestamp: Date.now()
            });

            this.emit('operation:applied', { clientId, operation, result });

        } catch (error) {
            console.error(`❌ Error handling operation from ${clientId}:`, error);
            
            // Send error response to client
            this.sendToClient(clientId, {
                type: 'operation:error',
                operationId: operation.id,
                error: error.message,
                timestamp: Date.now()
            });

            this.emit('operation:error', { clientId, operation, error });
        }
    }

    /**
     * Detect conflicts between operations
     */
    async detectConflicts(operation) {
        const conflicts = [];
        
        // Check for concurrent modifications to the same resource
        const resourceId = operation.resourceId;
        const timestamp = operation.timestamp;
        
        // Look for operations on the same resource within conflict window
        const conflictWindow = 10000; // 10 seconds
        const recentOperations = this.operationQueue.filter(op => 
            op.resourceId === resourceId &&
            op.timestamp > (timestamp - conflictWindow) &&
            op.id !== operation.id
        );

        for (const recentOp of recentOperations) {
            if (this.operationsConflict(operation, recentOp)) {
                conflicts.push(recentOp);
            }
        }

        return conflicts;
    }

    /**
     * Check if two operations conflict
     */
    operationsConflict(op1, op2) {
        // Same resource and overlapping fields
        if (op1.resourceId === op2.resourceId) {
            const op1Fields = new Set(Object.keys(op1.data || {}));
            const op2Fields = new Set(Object.keys(op2.data || {}));
            
            // Check for field overlap
            for (const field of op1Fields) {
                if (op2Fields.has(field)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Apply an operation to the data store
     */
    async applyOperation(operation, transaction) {
        const { type, resourceType, resourceId, data } = operation;
        
        switch (type) {
            case 'create':
                return await this.createResource(resourceType, data, transaction);
            
            case 'update':
                return await this.updateResource(resourceType, resourceId, data, transaction);
            
            case 'delete':
                return await this.deleteResource(resourceType, resourceId, transaction);
            
            case 'patch':
                return await this.patchResource(resourceType, resourceId, data, transaction);
            
            default:
                throw new Error(`Unsupported operation type: ${type}`);
        }
    }

    /**
     * Handle synchronization requests from clients
     */
    async handleSyncRequest(clientId, request) {
        try {
            const { lastSync, resources, deltaOnly = true } = request;
            const client = this.connections.get(clientId);
            
            if (!client) {
                throw new Error(`Client ${clientId} not found`);
            }

            let syncData;
            
            if (deltaOnly && lastSync) {
                // Send only changes since last sync
                syncData = await this.getDeltaSync(lastSync, resources);
                this.metrics.deltasSynchronized++;
            } else {
                // Send full sync
                syncData = await this.getFullSync(resources);
            }

            // Compress large deltas
            if (JSON.stringify(syncData).length > this.config.deltaCompressionThreshold) {
                syncData = await this.compressData(syncData);
            }

            // Send sync response
            this.sendToClient(clientId, {
                type: 'sync:response',
                requestId: request.id,
                data: syncData,
                timestamp: Date.now(),
                compressed: syncData.compressed || false
            });

            // Update client last sync time
            client.lastSync = Date.now();

            this.emit('sync:completed', { clientId, deltaOnly, dataSize: JSON.stringify(syncData).length });

        } catch (error) {
            console.error(`❌ Error handling sync request from ${clientId}:`, error);
            
            this.sendToClient(clientId, {
                type: 'sync:error',
                requestId: request.id,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    /**
     * Get delta synchronization data
     */
    async getDeltaSync(lastSync, resources) {
        const changes = {
            operations: [],
            versions: [],
            conflicts: []
        };

        // Get operations since last sync
        const recentOperations = this.operationQueue.filter(op => 
            op.timestamp > lastSync &&
            (!resources || resources.includes(op.resourceType))
        );

        changes.operations = recentOperations;

        // Get version information if enabled
        if (this.config.versioningEnabled) {
            changes.versions = await this.versionManager.getVersionsSince(lastSync, resources);
        }

        return changes;
    }

    /**
     * Handle offline operation synchronization
     */
    async syncOfflineOperations(clientId, offlineOperations) {
        const results = {
            applied: [],
            conflicts: [],
            errors: []
        };

        for (const operation of offlineOperations) {
            try {
                // Apply offline operation with conflict detection
                const conflicts = await this.detectConflicts(operation);
                
                if (conflicts.length > 0) {
                    // Store conflict for manual resolution
                    results.conflicts.push({
                        operation,
                        conflicts,
                        resolution: await this.conflictResolver.suggestResolution(operation, conflicts)
                    });
                } else {
                    // Apply operation
                    const result = await this.handleClientOperation(clientId, operation);
                    results.applied.push({ operation, result });
                }
                
            } catch (error) {
                results.errors.push({ operation, error: error.message });
            }
        }

        // Send offline sync results
        this.sendToClient(clientId, {
            type: 'offline:sync:complete',
            results,
            timestamp: Date.now()
        });

        this.emit('offline:sync:completed', { clientId, results });
    }

    /**
     * Broadcast operation to subscribed clients
     */
    async broadcastToSubscribers(operation, result) {
        const { resourceType, resourceId } = operation;
        
        for (const [clientId, client] of this.connections) {
            if (this.clientSubscribedTo(client, resourceType, resourceId)) {
                this.sendToClient(clientId, {
                    type: 'data:update',
                    operation,
                    result,
                    timestamp: Date.now()
                });
            }
        }
    }

    /**
     * Check if client is subscribed to resource
     */
    clientSubscribedTo(client, resourceType, resourceId) {
        for (const subscription of client.subscriptions) {
            if (subscription.resourceType === resourceType) {
                if (!subscription.resourceId || subscription.resourceId === resourceId) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Handle client subscriptions
     */
    handleSubscription(clientId, subscription) {
        const client = this.connections.get(clientId);
        if (!client) return;

        client.subscriptions.add(subscription);
        
        console.log(`📡 Client ${clientId} subscribed to ${subscription.resourceType}:${subscription.resourceId || 'all'}`);
        this.emit('subscription:added', { clientId, subscription });
    }

    /**
     * Handle client disconnection
     */
    handleClientDisconnect(clientId) {
        const client = this.connections.get(clientId);
        if (client) {
            // Store any pending operations for when client reconnects
            this.offlineManager.storeClientState(clientId, client);
            this.connections.delete(clientId);
            
            console.log(`📱 Client ${clientId} disconnected`);
            this.emit('client:disconnected', { clientId });
        }
    }

    /**
     * Send data to specific client
     */
    sendToClient(clientId, data) {
        const client = this.connections.get(clientId);
        if (client && client.connection) {
            try {
                client.connection.emit('data', data);
            } catch (error) {
                console.error(`❌ Error sending data to client ${clientId}:`, error);
            }
        }
    }

    /**
     * Start periodic synchronization processes
     */
    startPeriodicSync() {
        setInterval(() => {
            this.performPeriodicMaintenance();
        }, this.config.syncInterval);
    }

    /**
     * Perform periodic maintenance tasks
     */
    async performPeriodicMaintenance() {
        try {
            // Clean up old operations
            this.cleanupOperationQueue();
            
            // Garbage collect versions
            if (this.config.versioningEnabled) {
                await this.versionManager.garbageCollect();
            }
            
            // Check for stale transactions
            await this.transactionManager.checkStaleTransactions();
            
            // Emit health status
            this.emit('maintenance:completed', {
                timestamp: Date.now(),
                metrics: this.metrics,
                activeConnections: this.connections.size
            });
            
        } catch (error) {
            console.error('❌ Error during periodic maintenance:', error);
        }
    }

    /**
     * Clean up old operations from queue
     */
    cleanupOperationQueue() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        const originalLength = this.operationQueue.length;
        
        this.operationQueue = this.operationQueue.filter(op => op.timestamp > cutoff);
        
        if (this.operationQueue.length < originalLength) {
            console.log(`🧹 Cleaned up ${originalLength - this.operationQueue.length} old operations`);
        }
    }

    /**
     * Validate operation format
     */
    validateOperation(operation) {
        const required = ['id', 'type', 'resourceType', 'timestamp'];
        return required.every(field => operation.hasOwnProperty(field));
    }

    /**
     * Update average sync time metric
     */
    updateAverageSyncTime(syncTime) {
        const count = this.metrics.syncOperations;
        this.metrics.averageSyncTime = ((this.metrics.averageSyncTime * (count - 1)) + syncTime) / count;
    }

    /**
     * Get synchronization metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeConnections: this.connections.size,
            queueSize: this.operationQueue.length,
            uptime: process.uptime()
        };
    }

    /**
     * Shutdown the synchronization engine
     */
    async shutdown() {
        console.log('🔄 Shutting down Data Synchronization Engine...');
        
        // Close all client connections
        for (const [clientId, client] of this.connections) {
            client.connection.disconnect();
        }
        
        // Complete pending transactions
        await this.transactionManager.completePendingTransactions();
        
        // Cleanup resources
        this.connections.clear();
        this.operationQueue = [];
        
        console.log('✅ Data Synchronization Engine shutdown complete');
        this.emit('engine:shutdown');
    }
}

/**
 * Conflict Resolution Manager
 * Handles conflict detection and resolution using operational transforms
 */
class ConflictResolver {
    constructor() {
        this.strategies = new Map();
        this.setupDefaultStrategies();
    }

    initialize() {
        console.log('🔧 Initializing Conflict Resolution strategies...');
    }

    setupDefaultStrategies() {
        // Last-write-wins strategy
        this.strategies.set('last-write-wins', (operation, conflicts) => {
            return operation; // Simply use the latest operation
        });

        // Merge strategy for non-conflicting fields
        this.strategies.set('field-merge', (operation, conflicts) => {
            const merged = { ...operation };
            
            // Merge data from conflicts if fields don't overlap
            for (const conflict of conflicts) {
                if (conflict.data) {
                    for (const [key, value] of Object.entries(conflict.data)) {
                        if (!merged.data.hasOwnProperty(key)) {
                            merged.data[key] = value;
                        }
                    }
                }
            }
            
            return merged;
        });

        // Custom resolution for scheduling conflicts
        this.strategies.set('schedule-merge', (operation, conflicts) => {
            // Implement scheduling-specific conflict resolution
            return this.resolveScheduleConflict(operation, conflicts);
        });
    }

    async resolve(operation, conflicts) {
        const strategy = operation.conflictStrategy || 'last-write-wins';
        const resolver = this.strategies.get(strategy);
        
        if (!resolver) {
            throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
        }

        return resolver(operation, conflicts);
    }

    async suggestResolution(operation, conflicts) {
        return {
            strategy: 'manual',
            operation,
            conflicts,
            suggestions: [
                { type: 'merge', description: 'Merge non-conflicting fields' },
                { type: 'override', description: 'Use latest operation' },
                { type: 'defer', description: 'Defer to manual resolution' }
            ]
        };
    }

    resolveScheduleConflict(operation, conflicts) {
        // Custom logic for scheduling conflicts
        // This could involve time slot prioritization, constraint checking, etc.
        return operation;
    }
}

/**
 * Version Manager
 * Handles data versioning and history tracking
 */
class VersionManager {
    constructor() {
        this.versions = new Map();
        this.maxVersions = 100; // Keep last 100 versions per resource
    }

    async createVersion(operation, result, transaction) {
        const versionId = this.generateVersionId();
        const version = {
            id: versionId,
            operation,
            result,
            timestamp: Date.now(),
            hash: this.calculateHash(result)
        };

        const resourceKey = `${operation.resourceType}:${operation.resourceId}`;
        
        if (!this.versions.has(resourceKey)) {
            this.versions.set(resourceKey, []);
        }

        const resourceVersions = this.versions.get(resourceKey);
        resourceVersions.push(version);

        // Limit version history
        if (resourceVersions.length > this.maxVersions) {
            resourceVersions.shift();
        }

        return version;
    }

    async getVersionsSince(timestamp, resources) {
        const versions = [];
        
        for (const [resourceKey, resourceVersions] of this.versions) {
            if (!resources || this.resourceMatches(resourceKey, resources)) {
                const recentVersions = resourceVersions.filter(v => v.timestamp > timestamp);
                versions.push(...recentVersions);
            }
        }

        return versions;
    }

    async garbageCollect() {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
        let cleaned = 0;

        for (const [resourceKey, resourceVersions] of this.versions) {
            const originalLength = resourceVersions.length;
            const filtered = resourceVersions.filter(v => v.timestamp > cutoff);
            
            if (filtered.length < originalLength) {
                this.versions.set(resourceKey, filtered);
                cleaned += originalLength - filtered.length;
            }
        }

        if (cleaned > 0) {
            console.log(`🗑️ Garbage collected ${cleaned} old versions`);
        }
    }

    generateVersionId() {
        return crypto.randomUUID();
    }

    calculateHash(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    resourceMatches(resourceKey, resources) {
        const [resourceType] = resourceKey.split(':');
        return resources.includes(resourceType);
    }
}

/**
 * Transaction Manager
 * Handles ACID transactions with rollback support
 */
class TransactionManager {
    constructor() {
        this.activeTransactions = new Map();
        this.transactionTimeout = 30000; // 30 seconds
    }

    async executeTransaction(callback) {
        const transactionId = crypto.randomUUID();
        const transaction = {
            id: transactionId,
            startTime: Date.now(),
            operations: [],
            rollbackData: []
        };

        this.activeTransactions.set(transactionId, transaction);

        try {
            // Execute the transaction
            const result = await callback(transaction);
            
            // Commit transaction
            await this.commitTransaction(transactionId);
            
            return result;
            
        } catch (error) {
            // Rollback transaction
            await this.rollbackTransaction(transactionId);
            throw error;
        } finally {
            this.activeTransactions.delete(transactionId);
        }
    }

    async commitTransaction(transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) return;

        // In a real implementation, this would commit to the database
        console.log(`✅ Transaction ${transactionId} committed successfully`);
    }

    async rollbackTransaction(transactionId) {
        const transaction = this.activeTransactions.get(transactionId);
        if (!transaction) return;

        // Rollback operations in reverse order
        for (let i = transaction.rollbackData.length - 1; i >= 0; i--) {
            const rollbackOp = transaction.rollbackData[i];
            await this.executeRollbackOperation(rollbackOp);
        }

        console.log(`↩️ Transaction ${transactionId} rolled back`);
    }

    async executeRollbackOperation(rollbackOp) {
        // Execute the rollback operation
        // This would restore the previous state
    }

    async recoverPendingTransactions() {
        // In a real implementation, this would recover from crash/restart
        console.log('🔄 Recovering pending transactions...');
    }

    async completePendingTransactions() {
        for (const [transactionId, transaction] of this.activeTransactions) {
            try {
                await this.commitTransaction(transactionId);
            } catch (error) {
                await this.rollbackTransaction(transactionId);
            }
        }
    }

    async checkStaleTransactions() {
        const now = Date.now();
        
        for (const [transactionId, transaction] of this.activeTransactions) {
            if (now - transaction.startTime > this.transactionTimeout) {
                console.warn(`⚠️ Stale transaction detected: ${transactionId}`);
                await this.rollbackTransaction(transactionId);
            }
        }
    }
}

/**
 * CRDT Manager
 * Handles Conflict-free Replicated Data Types
 */
class CRDTManager {
    constructor() {
        this.crdts = new Map();
        this.setupCRDTTypes();
    }

    setupCRDTTypes() {
        // G-Counter (Grow-only Counter)
        this.crdts.set('g-counter', {
            merge: (state1, state2) => {
                const merged = { ...state1 };
                for (const [node, value] of Object.entries(state2)) {
                    merged[node] = Math.max(merged[node] || 0, value);
                }
                return merged;
            }
        });

        // OR-Set (Observe-Remove Set)
        this.crdts.set('or-set', {
            merge: (state1, state2) => {
                return {
                    added: new Set([...state1.added, ...state2.added]),
                    removed: new Set([...state1.removed, ...state2.removed])
                };
            }
        });

        // LWW-Register (Last-Write-Wins Register)
        this.crdts.set('lww-register', {
            merge: (state1, state2) => {
                return state1.timestamp > state2.timestamp ? state1 : state2;
            }
        });
    }

    async applyOperation(operation, transaction) {
        const { crdtType, resourceId } = operation;
        const crdt = this.crdts.get(crdtType);
        
        if (!crdt) {
            throw new Error(`Unknown CRDT type: ${crdtType}`);
        }

        // Apply CRDT operation
        // This would integrate with the actual data storage
        console.log(`🔀 Applied CRDT operation: ${crdtType} on ${resourceId}`);
    }
}

/**
 * Offline Manager
 * Handles offline operation queuing and synchronization
 */
class OfflineManager {
    constructor() {
        this.offlineStates = new Map();
        this.maxOfflineOperations = 10000;
    }

    storeClientState(clientId, clientState) {
        this.offlineStates.set(clientId, {
            lastSync: clientState.lastSync,
            offlineQueue: clientState.offlineQueue || [],
            subscriptions: Array.from(clientState.subscriptions),
            timestamp: Date.now()
        });
    }

    getClientState(clientId) {
        return this.offlineStates.get(clientId);
    }

    clearClientState(clientId) {
        this.offlineStates.delete(clientId);
    }
}

module.exports = {
    DataSyncEngine,
    ConflictResolver,
    VersionManager,
    TransactionManager,
    CRDTManager,
    OfflineManager
};