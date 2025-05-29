/**
 * WebSocket Collaboration System for FlexTime
 * 
 * Real-time collaboration features including:
 * - Multi-user schedule editing
 * - Live conflict notifications
 * - Real-time updates
 * - User presence indicators
 * - Live chat and commenting
 */

import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef, 
  useCallback,
  ReactNode 
} from 'react';
import { 
  Badge, 
  Avatar, 
  AvatarGroup, 
  Chip, 
  Snackbar, 
  Alert,
  Box,
  Typography,
  Tooltip
} from '@mui/material';
import { alpha } from '@mui/material/styles';

// Types for real-time collaboration
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface PresenceUser extends User {
  lastSeen: Date;
  currentPage?: string;
  isActive: boolean;
  cursor?: { x: number; y: number };
}

export interface CollaborationEvent {
  id: string;
  type: 'schedule_update' | 'game_move' | 'constraint_change' | 'conflict_detected' | 'user_joined' | 'user_left' | 'chat_message' | 'cursor_move';
  userId: string;
  timestamp: Date;
  data: any;
  scheduleId?: string;
}

export interface ScheduleChange {
  id: string;
  type: 'game_added' | 'game_removed' | 'game_moved' | 'date_changed' | 'venue_changed';
  gameId: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  timestamp: Date;
}

export interface ConflictNotification {
  id: string;
  type: 'scheduling_conflict' | 'venue_conflict' | 'travel_conflict' | 'constraint_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  gameIds: string[];
  suggestedResolution?: string;
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'schedule_reference';
  references?: {
    gameId?: string;
    constraintId?: string;
    scheduleId?: string;
  };
}

// WebSocket connection states
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// Collaboration context interface
interface CollaborationContextType {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  
  // Users and presence
  currentUser: User | null;
  activeUsers: PresenceUser[];
  
  // Real-time events
  scheduleChanges: ScheduleChange[];
  conflicts: ConflictNotification[];
  chatMessages: ChatMessage[];
  
  // Actions
  connect: (scheduleId: string, user: User) => void;
  disconnect: () => void;
  sendScheduleChange: (change: Omit<ScheduleChange, 'id' | 'userId' | 'timestamp'>) => void;
  sendChatMessage: (message: string, references?: ChatMessage['references']) => void;
  acknowledgeConflict: (conflictId: string) => void;
  updateCursor: (x: number, y: number) => void;
  
  // Event handlers
  onScheduleChange: (callback: (change: ScheduleChange) => void) => () => void;
  onConflictDetected: (callback: (conflict: ConflictNotification) => void) => () => void;
  onUserPresenceChange: (callback: (users: PresenceUser[]) => void) => () => void;
}

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// WebSocket manager class
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private scheduleId: string | null = null;
  private currentUser: User | null = null;

  public onConnectionStateChange: (state: ConnectionState) => void = () => {};
  public onMessage: (event: CollaborationEvent) => void = () => {};
  public onUsersChange: (users: PresenceUser[]) => void = () => {};

  connect(scheduleId: string, user: User) {
    this.scheduleId = scheduleId;
    this.currentUser = user;
    
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    const url = `${wsUrl}/collaboration?scheduleId=${scheduleId}&userId=${user.id}`;
    
    try {
      this.ws = new WebSocket(url);
      this.onConnectionStateChange(ConnectionState.CONNECTING);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.onConnectionStateChange(ConnectionState.ERROR);
    }
  }

  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    
    this.onConnectionStateChange(ConnectionState.DISCONNECTED);
  }

  send(event: Omit<CollaborationEvent, 'id' | 'timestamp'>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullEvent: CollaborationEvent = {
        ...event,
        id: this.generateId(),
        timestamp: new Date()
      };
      
      this.ws.send(JSON.stringify(fullEvent));
    }
  }

  private handleOpen() {
    console.log('WebSocket connected');
    this.onConnectionStateChange(ConnectionState.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'cursor_move',
        userId: this.currentUser?.id || '',
        data: { type: 'heartbeat' }
      });
    }, 30000);
    
    // Send initial presence
    this.send({
      type: 'user_joined',
      userId: this.currentUser?.id || '',
      data: { 
        user: this.currentUser,
        page: window.location.pathname
      }
    });
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'users_update') {
        this.onUsersChange(data.users);
      } else {
        this.onMessage(data);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.onConnectionStateChange(ConnectionState.DISCONNECTED);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Attempt to reconnect if not a clean close
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        if (this.scheduleId && this.currentUser) {
          this.connect(this.scheduleId, this.currentUser);
        }
      }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    }
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    this.onConnectionStateChange(ConnectionState.ERROR);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Collaboration Provider Component
interface CollaborationProviderProps {
  children: ReactNode;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeUsers, setActiveUsers] = useState<PresenceUser[]>([]);
  const [scheduleChanges, setScheduleChanges] = useState<ScheduleChange[]>([]);
  const [conflicts, setConflicts] = useState<ConflictNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  
  const wsManager = useRef<WebSocketManager>(new WebSocketManager());
  const eventCallbacks = useRef<{
    scheduleChange: ((change: ScheduleChange) => void)[];
    conflictDetected: ((conflict: ConflictNotification) => void)[];
    userPresenceChange: ((users: PresenceUser[]) => void)[];
  }>({
    scheduleChange: [],
    conflictDetected: [],
    userPresenceChange: []
  });

  useEffect(() => {
    const ws = wsManager.current;
    
    ws.onConnectionStateChange = setConnectionState;
    ws.onUsersChange = (users: PresenceUser[]) => {
      setActiveUsers(users);
      eventCallbacks.current.userPresenceChange.forEach(callback => callback(users));
    };
    ws.onMessage = handleWebSocketMessage;
    
    return () => {
      ws.disconnect();
    };
  }, []);

  const handleWebSocketMessage = useCallback((event: CollaborationEvent) => {
    switch (event.type) {
      case 'schedule_update':
      case 'game_move':
        const change = event.data as ScheduleChange;
        setScheduleChanges(prev => [...prev, change]);
        eventCallbacks.current.scheduleChange.forEach(callback => callback(change));
        break;
        
      case 'conflict_detected':
        const conflict = event.data as ConflictNotification;
        setConflicts(prev => [...prev, conflict]);
        eventCallbacks.current.conflictDetected.forEach(callback => callback(conflict));
        break;
        
      case 'chat_message':
        const message = event.data as ChatMessage;
        setChatMessages(prev => [...prev, message]);
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }
  }, []);

  const connect = useCallback((scheduleId: string, user: User) => {
    setCurrentUser(user);
    wsManager.current.connect(scheduleId, user);
  }, []);

  const disconnect = useCallback(() => {
    wsManager.current.disconnect();
    setCurrentUser(null);
    setActiveUsers([]);
  }, []);

  const sendScheduleChange = useCallback((change: Omit<ScheduleChange, 'id' | 'userId' | 'timestamp'>) => {
    if (!currentUser) return;
    
    wsManager.current.send({
      type: 'schedule_update',
      userId: currentUser.id,
      data: {
        ...change,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: currentUser.id,
        timestamp: new Date()
      }
    });
  }, [currentUser]);

  const sendChatMessage = useCallback((message: string, references?: ChatMessage['references']) => {
    if (!currentUser) return;
    
    const chatMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: currentUser.id,
      userName: currentUser.name,
      message,
      timestamp: new Date(),
      type: references ? 'schedule_reference' : 'text',
      references
    };
    
    wsManager.current.send({
      type: 'chat_message',
      userId: currentUser.id,
      data: chatMessage
    });
  }, [currentUser]);

  const acknowledgeConflict = useCallback((conflictId: string) => {
    setConflicts(prev => prev.filter(c => c.id !== conflictId));
  }, []);

  const updateCursor = useCallback((x: number, y: number) => {
    if (!currentUser) return;
    
    wsManager.current.send({
      type: 'cursor_move',
      userId: currentUser.id,
      data: { x, y }
    });
  }, [currentUser]);

  const onScheduleChange = useCallback((callback: (change: ScheduleChange) => void) => {
    eventCallbacks.current.scheduleChange.push(callback);
    return () => {
      eventCallbacks.current.scheduleChange = eventCallbacks.current.scheduleChange.filter(cb => cb !== callback);
    };
  }, []);

  const onConflictDetected = useCallback((callback: (conflict: ConflictNotification) => void) => {
    eventCallbacks.current.conflictDetected.push(callback);
    return () => {
      eventCallbacks.current.conflictDetected = eventCallbacks.current.conflictDetected.filter(cb => cb !== callback);
    };
  }, []);

  const onUserPresenceChange = useCallback((callback: (users: PresenceUser[]) => void) => {
    eventCallbacks.current.userPresenceChange.push(callback);
    return () => {
      eventCallbacks.current.userPresenceChange = eventCallbacks.current.userPresenceChange.filter(cb => cb !== callback);
    };
  }, []);

  const contextValue: CollaborationContextType = {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    currentUser,
    activeUsers,
    scheduleChanges,
    conflicts,
    chatMessages,
    connect,
    disconnect,
    sendScheduleChange,
    sendChatMessage,
    acknowledgeConflict,
    updateCursor,
    onScheduleChange,
    onConflictDetected,
    onUserPresenceChange
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};

// Hook to use collaboration context
export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

// User Presence Component
interface UserPresenceProps {
  maxVisible?: number;
}

export const UserPresence: React.FC<UserPresenceProps> = ({ maxVisible = 5 }) => {
  const { activeUsers, currentUser } = useCollaboration();
  
  const otherUsers = activeUsers.filter(user => user.id !== currentUser?.id);
  
  if (otherUsers.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        Online:
      </Typography>
      <AvatarGroup max={maxVisible} sx={{ '& .MuiAvatar-root': { width: 32, height: 32 } }}>
        {otherUsers.map(user => (
          <Tooltip key={user.id} title={`${user.name} (${user.role})`}>
            <Badge
              variant="dot"
              color={user.isActive ? 'success' : 'default'}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
            >
              <Avatar
                src={user.avatar}
                sx={{
                  bgcolor: user.color,
                  border: `2px solid ${alpha(user.color, 0.3)}`
                }}
              >
                {user.name.charAt(0)}
              </Avatar>
            </Badge>
          </Tooltip>
        ))}
      </AvatarGroup>
    </Box>
  );
};

// Connection Status Component
export const ConnectionStatus: React.FC = () => {
  const { connectionState } = useCollaboration();
  
  const getStatusProps = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED:
        return { color: 'success' as const, label: 'Connected' };
      case ConnectionState.CONNECTING:
        return { color: 'warning' as const, label: 'Connecting...' };
      case ConnectionState.DISCONNECTED:
        return { color: 'default' as const, label: 'Offline' };
      case ConnectionState.ERROR:
        return { color: 'error' as const, label: 'Connection Error' };
      default:
        return { color: 'default' as const, label: 'Unknown' };
    }
  };

  const { color, label } = getStatusProps();

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant="outlined"
      sx={{ minWidth: 100 }}
    />
  );
};

// Conflict Notifications Component
export const ConflictNotifications: React.FC = () => {
  const { conflicts, acknowledgeConflict } = useCollaboration();
  const [openConflicts, setOpenConflicts] = useState<ConflictNotification[]>([]);

  useEffect(() => {
    setOpenConflicts(conflicts.slice(-3)); // Show last 3 conflicts
  }, [conflicts]);

  const handleClose = (conflictId: string) => {
    setOpenConflicts(prev => prev.filter(c => c.id !== conflictId));
    acknowledgeConflict(conflictId);
  };

  return (
    <>
      {openConflicts.map(conflict => (
        <Snackbar
          key={conflict.id}
          open={true}
          autoHideDuration={6000}
          onClose={() => handleClose(conflict.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert
            onClose={() => handleClose(conflict.id)}
            severity={conflict.severity === 'critical' ? 'error' : conflict.severity === 'high' ? 'warning' : 'info'}
            sx={{ width: '100%' }}
          >
            <Typography variant="subtitle2">{conflict.type.replace('_', ' ').toUpperCase()}</Typography>
            <Typography variant="body2">{conflict.message}</Typography>
            {conflict.suggestedResolution && (
              <Typography variant="caption" color="text.secondary">
                Suggestion: {conflict.suggestedResolution}
              </Typography>
            )}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};

// Export all components and hooks
export {
  CollaborationProvider,
  UserPresence,
  ConnectionStatus,
  ConflictNotifications
};

// Export types
export type {
  User,
  PresenceUser,
  CollaborationEvent,
  ScheduleChange,
  ConflictNotification,
  ChatMessage
};