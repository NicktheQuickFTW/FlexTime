import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import './RealtimeCollaboration.css';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  isActive: boolean;
  lastSeen: Date;
}

interface ScheduleChange {
  id: string;
  userId: string;
  userName: string;
  type: 'move' | 'add' | 'delete' | 'edit';
  timestamp: Date;
  description: string;
  gameId?: string;
  data?: any;
}

interface ConflictResolution {
  id: string;
  conflictType: string;
  severity: 'error' | 'warning' | 'info';
  affectedGames: string[];
  proposedSolution?: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

interface CollaborationMessage {
  type: 'user_joined' | 'user_left' | 'cursor_move' | 'schedule_change' | 
        'conflict_detected' | 'message' | 'typing' | 'selection';
  userId: string;
  data: any;
  timestamp: Date;
}

interface RealtimeCollaborationProps {
  scheduleId: string;
  currentUser: User;
  wsUrl?: string;
  onScheduleChange?: (change: ScheduleChange) => void;
  onConflictDetected?: (conflict: ConflictResolution) => void;
}

// Cursor Component for showing other users' cursors
const UserCursor: React.FC<{ 
  user: User; 
  position: { x: number; y: number } 
}> = ({ user, position }) => {
  if (!position) return null;
  
  return (
    <motion.div
      className="ft-user-cursor"
      style={{
        left: position.x,
        top: position.y,
        '--user-color': user.color
      } as React.CSSProperties}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
    >
      <div className="ft-cursor-pointer" />
      <div className="ft-cursor-label">{user.name}</div>
    </motion.div>
  );
};

// Active Users Panel
const ActiveUsersPanel: React.FC<{ 
  users: User[]; 
  currentUserId: string 
}> = ({ users, currentUserId }) => {
  const activeUsers = users.filter(u => u.isActive && u.id !== currentUserId);
  
  return (
    <div className="ft-active-users-panel">
      <h4 className="ft-panel-header">
        <span className="ft-active-indicator" />
        Active Collaborators ({activeUsers.length})
      </h4>
      <AnimatePresence>
        {activeUsers.map((user, index) => (
          <motion.div
            key={user.id}
            className="ft-active-user"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div 
              className="ft-user-avatar"
              style={{ '--user-color': user.color } as React.CSSProperties}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="ft-user-info">
              <div className="ft-user-name">{user.name}</div>
              <div className="ft-user-status">
                {user.cursor ? 'Active' : 'Viewing'}
              </div>
            </div>
            <div 
              className="ft-user-activity-indicator"
              style={{ backgroundColor: user.color }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// Live Changes Feed
const LiveChangesFeed: React.FC<{ 
  changes: ScheduleChange[];
  maxItems?: number;
}> = ({ changes, maxItems = 10 }) => {
  const recentChanges = changes.slice(-maxItems).reverse();
  
  return (
    <div className="ft-live-changes-feed">
      <h4 className="ft-panel-header">
        <span className="ft-pulse-dot" />
        Live Activity
      </h4>
      <div className="ft-changes-list">
        <AnimatePresence>
          {recentChanges.map((change, index) => (
            <motion.div
              key={change.id}
              className="ft-change-item"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="ft-change-icon">
                {getChangeIcon(change.type)}
              </div>
              <div className="ft-change-content">
                <div className="ft-change-description">
                  <strong>{change.userName}</strong> {change.description}
                </div>
                <div className="ft-change-time">
                  {formatTimeAgo(change.timestamp)}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Conflict Resolution Panel
const ConflictResolutionPanel: React.FC<{
  conflicts: ConflictResolution[];
  onResolve: (conflictId: string, solution: string) => void;
  onDismiss: (conflictId: string) => void;
}> = ({ conflicts, onResolve, onDismiss }) => {
  const activeConflicts = conflicts.filter(c => c.status === 'pending');
  
  if (activeConflicts.length === 0) return null;
  
  return (
    <motion.div
      className="ft-conflict-resolution-panel"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
    >
      <h4 className="ft-panel-header">
        <span className="ft-warning-icon">⚠️</span>
        Conflicts Detected ({activeConflicts.length})
      </h4>
      {activeConflicts.map(conflict => (
        <div key={conflict.id} className={`ft-conflict-card ft-conflict-${conflict.severity}`}>
          <div className="ft-conflict-header">
            <span className="ft-conflict-type">{conflict.conflictType}</span>
            <span className="ft-conflict-severity">{conflict.severity}</span>
          </div>
          <div className="ft-conflict-games">
            Affects: {conflict.affectedGames.join(', ')}
          </div>
          {conflict.proposedSolution && (
            <div className="ft-proposed-solution">
              <strong>Suggested:</strong> {conflict.proposedSolution}
            </div>
          )}
          <div className="ft-conflict-actions">
            <button 
              className="ft-btn-resolve"
              onClick={() => onResolve(conflict.id, conflict.proposedSolution || '')}
            >
              Apply Solution
            </button>
            <button 
              className="ft-btn-dismiss"
              onClick={() => onDismiss(conflict.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </motion.div>
  );
};

// Main Realtime Collaboration Component
export const RealtimeCollaboration: React.FC<RealtimeCollaborationProps> = ({
  scheduleId,
  currentUser,
  wsUrl = `wss://api.flextime.com/collaboration`,
  onScheduleChange,
  onConflictDetected
}) => {
  const { theme } = useTheme();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const cursorThrottleRef = useRef<NodeJS.Timeout>();
  
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([currentUser]);
  const [userCursors, setUserCursors] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [liveChanges, setLiveChanges] = useState<ScheduleChange[]>([]);
  const [conflicts, setConflicts] = useState<ConflictResolution[]>([]);
  const [isCollaborating, setIsCollaborating] = useState(true);
  
  // WebSocket Connection Management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    const ws = new WebSocket(`${wsUrl}/${scheduleId}`);
    
    ws.onopen = () => {
      console.log('Collaboration connected');
      setIsConnected(true);
      
      // Send join message
      ws.send(JSON.stringify({
        type: 'user_joined',
        userId: currentUser.id,
        data: currentUser,
        timestamp: new Date()
      }));
    };
    
    ws.onmessage = (event) => {
      const message: CollaborationMessage = JSON.parse(event.data);
      handleCollaborationMessage(message);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('Collaboration disconnected');
      setIsConnected(false);
      
      // Attempt to reconnect after 3 seconds
      if (isCollaborating) {
        reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
      }
    };
    
    wsRef.current = ws;
  }, [scheduleId, currentUser, wsUrl, isCollaborating]);
  
  // Handle incoming collaboration messages
  const handleCollaborationMessage = (message: CollaborationMessage) => {
    switch (message.type) {
      case 'user_joined':
        setActiveUsers(prev => {
          const exists = prev.find(u => u.id === message.data.id);
          if (exists) return prev;
          return [...prev, { ...message.data, isActive: true }];
        });
        break;
        
      case 'user_left':
        setActiveUsers(prev => 
          prev.map(u => u.id === message.userId ? { ...u, isActive: false } : u)
        );
        setUserCursors(prev => {
          const newMap = new Map(prev);
          newMap.delete(message.userId);
          return newMap;
        });
        break;
        
      case 'cursor_move':
        if (message.userId !== currentUser.id) {
          setUserCursors(prev => {
            const newMap = new Map(prev);
            newMap.set(message.userId, message.data);
            return newMap;
          });
        }
        break;
        
      case 'schedule_change':
        const change: ScheduleChange = {
          id: `change-${Date.now()}`,
          userId: message.userId,
          userName: message.data.userName || 'Unknown User',
          type: message.data.type,
          timestamp: new Date(message.timestamp),
          description: message.data.description,
          gameId: message.data.gameId,
          data: message.data
        };
        setLiveChanges(prev => [...prev, change]);
        onScheduleChange?.(change);
        break;
        
      case 'conflict_detected':
        const conflict: ConflictResolution = {
          ...message.data,
          status: 'pending'
        };
        setConflicts(prev => [...prev, conflict]);
        onConflictDetected?.(conflict);
        break;
    }
  };
  
  // Send cursor position
  const sendCursorPosition = useCallback((x: number, y: number) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    
    // Throttle cursor updates to reduce bandwidth
    if (cursorThrottleRef.current) return;
    
    cursorThrottleRef.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({
        type: 'cursor_move',
        userId: currentUser.id,
        data: { x, y },
        timestamp: new Date()
      }));
      cursorThrottleRef.current = undefined;
    }, 50);
  }, [currentUser.id]);
  
  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isCollaborating && isConnected) {
        sendCursorPosition(e.clientX, e.clientY);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [isCollaborating, isConnected, sendCursorPosition]);
  
  // WebSocket lifecycle
  useEffect(() => {
    if (isCollaborating) {
      connectWebSocket();
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, isCollaborating]);
  
  // Conflict resolution handlers
  const handleResolveConflict = (conflictId: string, solution: string) => {
    setConflicts(prev => 
      prev.map(c => c.id === conflictId ? { ...c, status: 'resolved' } : c)
    );
    
    // Send resolution to server
    wsRef.current?.send(JSON.stringify({
      type: 'conflict_resolved',
      userId: currentUser.id,
      data: { conflictId, solution },
      timestamp: new Date()
    }));
  };
  
  const handleDismissConflict = (conflictId: string) => {
    setConflicts(prev => 
      prev.map(c => c.id === conflictId ? { ...c, status: 'dismissed' } : c)
    );
  };
  
  return (
    <div className="ft-realtime-collaboration">
      {/* Collaboration Toggle */}
      <div className="ft-collaboration-toggle">
        <label className="ft-toggle-label">
          <input
            type="checkbox"
            checked={isCollaborating}
            onChange={(e) => setIsCollaborating(e.target.checked)}
            className="ft-toggle-input"
          />
          <span className="ft-toggle-switch" />
          <span className="ft-toggle-text">
            {isCollaborating ? 'Collaboration On' : 'Collaboration Off'}
          </span>
        </label>
        <div className={`ft-connection-status ${isConnected ? 'ft-connected' : 'ft-disconnected'}`}>
          <span className="ft-status-dot" />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      {/* Collaboration Panels */}
      <AnimatePresence>
        {isCollaborating && (
          <>
            {/* User Cursors */}
            {Array.from(userCursors.entries()).map(([userId, position]) => {
              const user = activeUsers.find(u => u.id === userId);
              if (!user || user.id === currentUser.id) return null;
              return (
                <UserCursor 
                  key={userId} 
                  user={user} 
                  position={position} 
                />
              );
            })}
            
            {/* Side Panels */}
            <motion.div
              className="ft-collaboration-panels"
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
            >
              <ActiveUsersPanel 
                users={activeUsers} 
                currentUserId={currentUser.id} 
              />
              <LiveChangesFeed 
                changes={liveChanges} 
              />
            </motion.div>
            
            {/* Conflict Resolution */}
            <ConflictResolutionPanel
              conflicts={conflicts}
              onResolve={handleResolveConflict}
              onDismiss={handleDismissConflict}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

// Utility Functions
const getChangeIcon = (type: string) => {
  switch (type) {
    case 'move': return '↔️';
    case 'add': return '➕';
    case 'delete': return '❌';
    case 'edit': return '✏️';
    default: return '📝';
  }
};

const formatTimeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default RealtimeCollaboration;