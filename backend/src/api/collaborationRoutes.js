/**
 * Collaboration Routes - Real-time WebSocket endpoints for schedule collaboration
 * Integrates with the advanced CollaborationEngine for multi-user synchronization
 */

const express = require('express');
const expressWs = require('express-ws');
const CollaborationEngine = require('../../services/enhanced/CollaborationEngine');

// Initialize express with websockets
const router = express.Router();
expressWs(express().use(router));


// Store active collaboration sessions by schedule ID
const collaborationSessions = new Map();

/**
 * Get or create collaboration session for a schedule
 */
function getCollaborationSession(scheduleId) {
  if (!collaborationSessions.has(scheduleId)) {
    const engine = new CollaborationEngine({
      maxUsers: 50,
      conflictTimeout: 5000,
      syncInterval: 100,
      presenceTimeout: 30000
    });
    
    collaborationSessions.set(scheduleId, {
      engine,
      connections: new Map(),
      createdAt: Date.now()
    });
  }
  
  return collaborationSessions.get(scheduleId);
}

/**
 * WebSocket endpoint for real-time collaboration
 */
router.ws('/collaboration/:scheduleId', (ws, req) => {
  const { scheduleId } = req.params;
  const userId = req.query.userId || `user-${Date.now()}`;
  const userName = req.query.userName || 'Anonymous User';
  const userColor = req.query.userColor || '#4ECDC4';
  
  console.log(`🔗 User ${userName} (${userId}) connected to schedule ${scheduleId}`);
  
  try {
    // Get or create collaboration session
    const session = getCollaborationSession(scheduleId);
    const { engine, connections } = session;
    
    // Add user to collaboration engine
    const user = engine.addUser(userId, {
      name: userName,
      color: userColor,
      permissions: ['read', 'write'],
      role: 'collaborator'
    });
    
    // Store WebSocket connection
    connections.set(userId, ws);
    
    // Set up event handlers for the collaboration engine
    const handleOperationBroadcast = (data) => {
      if (data.targetUser !== userId) return;
      
      const targetWs = connections.get(data.targetUser);
      if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({
          type: 'operation',
          operation: data.operation
        }));
      }
    };
    
    const handleCursorUpdate = (data) => {
      if (data.targetUser !== userId) return;
      
      const targetWs = connections.get(data.targetUser);
      if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({
          type: 'cursor_move',
          userId: data.userId,
          data: data.cursor,
          timestamp: new Date()
        }));
      }
    };
    
    const handleStateSync = (data) => {
      if (data.targetUser !== userId) return;
      
      const targetWs = connections.get(data.targetUser);
      if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({
          type: 'state_sync',
          state: data.state,
          operations: data.operations,
          users: data.users,
          cursors: data.cursors
        }));
      }
    };
    
    const handleConflictNotification = (data) => {
      if (data.targetUser !== userId) return;
      
      const targetWs = connections.get(data.targetUser);
      if (targetWs && targetWs.readyState === 1) {
        targetWs.send(JSON.stringify({
          type: 'conflict_detected',
          data: data.conflict,
          timestamp: new Date()
        }));
      }
    };
    
    // Register event listeners
    engine.on('operationBroadcast', handleOperationBroadcast);
    engine.on('cursorUpdate', handleCursorUpdate);
    engine.on('stateSync', handleStateSync);
    engine.on('conflictNotification', handleConflictNotification);
    
    // Handle incoming WebSocket messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        
        switch (data.type) {
          case 'cursor_move':
            engine.updateCursor(userId, {
              x: data.data.x,
              y: data.data.y,
              element: data.data.element
            });
            break;
            
          case 'schedule_change':
            // Create and apply operation through the collaboration engine
            const operation = engine.createOperation(userId, data.data.operationType, {
              id: data.data.id,
              scheduleId: scheduleId,
              ...data.data
            });
            
            const result = engine.applyOperation(operation);
            
            // Send result back to the user
            ws.send(JSON.stringify({
              type: 'operation_result',
              success: !!result,
              operation: result || operation,
              timestamp: new Date()
            }));
            break;
            
          case 'selection_update':
            engine.updateSelection(userId, {
              elements: data.data.elements || []
            });
            break;
            
          case 'conflict_resolve':
            const conflict = engine.conflicts.get(data.conflictId);
            if (conflict) {
              engine.applyResolution(conflict, {
                resolution: data.resolution,
                resolvedBy: userId
              });
            }
            break;
            
          case 'ping':
            // Update user presence
            engine.updateUserPresence(userId, {
              lastActivity: Date.now()
            });
            
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date()
            }));
            break;
            
          default:
            console.warn(`Unknown message type: ${data.type}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
          error: error.message
        }));
      }
    });
    
    // Handle WebSocket disconnection
    ws.on('close', () => {
      console.log(`🔌 User ${userName} (${userId}) disconnected from schedule ${scheduleId}`);
      
      // Remove event listeners
      engine.off('operationBroadcast', handleOperationBroadcast);
      engine.off('cursorUpdate', handleCursorUpdate);
      engine.off('stateSync', handleStateSync);
      engine.off('conflictNotification', handleConflictNotification);
      
      // Remove user from collaboration engine
      engine.removeUser(userId);
      
      // Remove WebSocket connection
      connections.delete(userId);
      
      // Clean up session if no users left
      if (connections.size === 0) {
        engine.destroy();
        collaborationSessions.delete(scheduleId);
        console.log(`🗑️ Cleaned up collaboration session for schedule ${scheduleId}`);
      }
    });
    
    // Handle WebSocket errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for user ${userId}:`, error);
    });
    
    // Send initial state sync
    setTimeout(() => {
      engine.synchronizeUser(userId);
    }, 100);
    
  } catch (error) {
    console.error('Error setting up collaboration WebSocket:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Failed to establish collaboration session',
      error: error.message
    }));
    ws.close();
  }
});

/**
 * REST API endpoints for collaboration status and management
 */

// Get active users for a schedule
router.get('/schedules/:scheduleId/users', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const session = collaborationSessions.get(scheduleId);
    
    if (!session) {
      return res.json({ users: [], activeCount: 0 });
    }
    
    const activeUsers = session.engine.getActiveUsers();
    
    res.json({
      users: Object.values(activeUsers),
      activeCount: Object.keys(activeUsers).length,
      sessionCreated: session.createdAt
    });
  } catch (error) {
    console.error('Error getting active users:', error);
    res.status(500).json({ error: 'Failed to retrieve active users' });
  }
});

// Get collaboration state for a schedule
router.get('/schedules/:scheduleId/state', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const session = collaborationSessions.get(scheduleId);
    
    if (!session) {
      return res.json({ state: {}, operations: [], conflicts: [] });
    }
    
    const state = session.engine.getState();
    const recentOperations = session.engine.getRecentOperations(Date.now() - 300000); // Last 5 minutes
    const activeConflicts = Array.from(session.engine.conflicts.values())
      .filter(conflict => conflict.status === 'pending');
    
    res.json({
      state,
      operations: recentOperations,
      conflicts: activeConflicts,
      sessionCreated: session.createdAt
    });
  } catch (error) {
    console.error('Error getting collaboration state:', error);
    res.status(500).json({ error: 'Failed to retrieve collaboration state' });
  }
});

// Manually resolve a conflict
router.post('/schedules/:scheduleId/conflicts/:conflictId/resolve', (req, res) => {
  try {
    const { scheduleId, conflictId } = req.params;
    const { resolution, resolvedBy } = req.body;
    
    const session = collaborationSessions.get(scheduleId);
    if (!session) {
      return res.status(404).json({ error: 'Collaboration session not found' });
    }
    
    const conflict = session.engine.conflicts.get(conflictId);
    if (!conflict) {
      return res.status(404).json({ error: 'Conflict not found' });
    }
    
    // Apply manual resolution
    const result = session.engine.applyResolution(conflict, {
      resolution,
      resolvedBy: resolvedBy || 'system',
      manual: true
    });
    
    res.json({
      message: 'Conflict resolved successfully',
      conflictId,
      resolution: result
    });
  } catch (error) {
    console.error('Error resolving conflict:', error);
    res.status(500).json({ error: 'Failed to resolve conflict' });
  }
});

// Get collaboration metrics
router.get('/schedules/:scheduleId/metrics', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const session = collaborationSessions.get(scheduleId);
    
    if (!session) {
      return res.json({
        activeUsers: 0,
        totalOperations: 0,
        conflictsResolved: 0,
        sessionDuration: 0
      });
    }
    
    const activeUsers = Object.keys(session.engine.getActiveUsers()).length;
    const totalOperations = session.engine.operations.size;
    const conflictsResolved = Array.from(session.engine.conflicts.values())
      .filter(conflict => conflict.status === 'resolved').length;
    const sessionDuration = Date.now() - session.createdAt;
    
    res.json({
      activeUsers,
      totalOperations,
      conflictsResolved,
      sessionDuration,
      averageOperationsPerUser: activeUsers > 0 ? totalOperations / activeUsers : 0,
      conflictResolutionRate: session.engine.conflicts.size > 0 
        ? conflictsResolved / session.engine.conflicts.size 
        : 1
    });
  } catch (error) {
    console.error('Error getting collaboration metrics:', error);
    res.status(500).json({ error: 'Failed to retrieve collaboration metrics' });
  }
});

// Health check for collaboration service
router.get('/health', (req, res) => {
  try {
    const activeSessions = collaborationSessions.size;
    const totalUsers = Array.from(collaborationSessions.values())
      .reduce((total, session) => total + session.connections.size, 0);
    
    res.json({
      status: 'healthy',
      activeSessions,
      totalUsers,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in collaboration health check:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;