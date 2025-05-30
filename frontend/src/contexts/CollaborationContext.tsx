import React, { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  useRef, 
  useCallback,
  ReactNode,
  useMemo 
} from 'react';

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

export interface ScheduleChange {
  id: string;
  type: 'game_added' | 'game_removed' | 'game_moved' | 'date_changed' | 'venue_changed';
  gameId: string;
  oldValue?: any;
  newValue?: any;
  userId: string;
  timestamp: Date;
}

export interface ConflictResolution {
  id: string;
  type: 'scheduling_conflict' | 'venue_conflict' | 'travel_conflict' | 'constraint_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  gameIds: string[];
  suggestedResolution?: string;
  timestamp: Date;
}

export interface WebSocketMessage {
  id: string;
  type: 'user_joined' | 'user_left' | 'schedule_change' | 'conflict_detected' | 'users_update' | 'heartbeat' | 'cursor_move';
  userId: string;
  timestamp: Date;
  data: any;
}

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

// Collaboration context interface
interface CollaborationState {
  activeUsers: PresenceUser[];
  liveChanges: ScheduleChange[];
  conflictResolution: ConflictResolution | null;
  connectionStatus: ConnectionStatus;
  currentUser: User | null;
  scheduleId: string | null;
}

interface CollaborationContextType {
  // State
  state: CollaborationState;
  
  // Connection management
  connect: (scheduleId: string, user: User) => void;
  disconnect: () => void;
  
  // Real-time operations
  sendScheduleChange: (change: Omit<ScheduleChange, 'id' | 'userId' | 'timestamp'>) => void;
  acknowledgeConflict: () => void;
  updateCursor: (x: number, y: number) => void;
  
  // Event subscriptions
  onScheduleChange: (callback: (change: ScheduleChange) => void) => () => void;
  onConflictDetected: (callback: (conflict: ConflictResolution) => void) => () => void;
  onUserPresenceChange: (callback: (users: PresenceUser[]) => void) => () => void;
  
  // WebSocket instance for direct access
  ws: WebSocket | null;
}

// Create the context with undefined as initial value
const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// WebSocket manager class for handling connection lifecycle
class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private scheduleId: string | null = null;
  private currentUser: User | null = null;

  public onConnectionStateChange: (state: ConnectionStatus) => void = () => {};
  public onMessage: (message: WebSocketMessage) => void = () => {};
  public onUsersChange: (users: PresenceUser[]) => void = () => {};

  connect(scheduleId: string, user: User): void {
    this.scheduleId = scheduleId;
    this.currentUser = user;
    
    // Get WebSocket URL from environment or use default
    const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:3001';
    const url = `${wsUrl}/collaboration?scheduleId=${scheduleId}&userId=${user.id}`;
    
    try {
      this.ws = new WebSocket(url);
      this.onConnectionStateChange(ConnectionStatus.CONNECTING);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.onConnectionStateChange(ConnectionStatus.ERROR);
    }
  }

  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
      this.ws = null;
    }
    
    this.onConnectionStateChange(ConnectionStatus.DISCONNECTED);
  }

  send(message: Omit<WebSocketMessage, 'id' | 'timestamp'>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const fullMessage: WebSocketMessage = {
        ...message,
        id: this.generateId(),
        timestamp: new Date()
      };
      
      this.ws.send(JSON.stringify(fullMessage));
    }
  }

  getWebSocket(): WebSocket | null {
    return this.ws;
  }

  private handleOpen(): void {
    console.log('WebSocket connected to collaboration server');
    this.onConnectionStateChange(ConnectionStatus.CONNECTED);
    this.reconnectAttempts = 0;
    
    // Start heartbeat to maintain connection
    this.heartbeatInterval = setInterval(() => {
      this.send({
        type: 'heartbeat',
        userId: this.currentUser?.id || '',
        data: { type: 'ping' }
      });
    }, 30000); // Send heartbeat every 30 seconds
    
    // Send initial presence announcement
    this.send({
      type: 'user_joined',
      userId: this.currentUser?.id || '',
      data: { 
        user: this.currentUser,
        page: window.location.pathname,
        timestamp: new Date()
      }
    });
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle special message types
      if (message.type === 'users_update') {
        this.onUsersChange(message.data.users);
      } else {
        this.onMessage(message);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.code, event.reason);
    this.onConnectionStateChange(ConnectionStatus.DISCONNECTED);
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Attempt to reconnect if not a clean close and haven't exceeded max attempts
    if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.reconnectAttempts++;
        if (this.scheduleId && this.currentUser) {
          this.connect(this.scheduleId, this.currentUser);
        }
      }, delay);
    }
  }

  private handleError(error: Event): void {
    console.error('WebSocket error:', error);
    this.onConnectionStateChange(ConnectionStatus.ERROR);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

// Storage keys for persistence
const COLLABORATION_STORAGE_KEYS = {
  USER: 'flextime-collaboration-user',
  SCHEDULE_ID: 'flextime-collaboration-schedule'
} as const;

// Get initial state from localStorage
const getInitialState = (): CollaborationState => {
  if (typeof window === 'undefined') {
    return {
      activeUsers: [],
      liveChanges: [],
      conflictResolution: null,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      currentUser: null,
      scheduleId: null
    };
  }
  
  try {
    const storedUser = localStorage.getItem(COLLABORATION_STORAGE_KEYS.USER);
    const storedScheduleId = localStorage.getItem(COLLABORATION_STORAGE_KEYS.SCHEDULE_ID);
    
    return {
      activeUsers: [],
      liveChanges: [],
      conflictResolution: null,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      currentUser: storedUser ? JSON.parse(storedUser) : null,
      scheduleId: storedScheduleId || null
    };
  } catch (error) {
    console.error('Error reading collaboration state from localStorage:', error);
    return {
      activeUsers: [],
      liveChanges: [],
      conflictResolution: null,
      connectionStatus: ConnectionStatus.DISCONNECTED,
      currentUser: null,
      scheduleId: null
    };
  }
};

// Save state to localStorage
const saveStateToStorage = (user: User | null, scheduleId: string | null): void => {
  if (typeof window === 'undefined') return;
  
  try {
    if (user) {
      localStorage.setItem(COLLABORATION_STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(COLLABORATION_STORAGE_KEYS.USER);
    }
    
    if (scheduleId) {
      localStorage.setItem(COLLABORATION_STORAGE_KEYS.SCHEDULE_ID, scheduleId);
    } else {
      localStorage.removeItem(COLLABORATION_STORAGE_KEYS.SCHEDULE_ID);
    }
  } catch (error) {
    console.error('Error saving collaboration state to localStorage:', error);
  }
};

interface CollaborationProviderProps {
  children: ReactNode;
}

/**
 * CollaborationProvider component that manages real-time collaboration state
 * including WebSocket connections, user presence, and schedule changes.
 * Provides comprehensive real-time collaboration features for the FlexTime scheduling system.
 */
export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({ children }) => {
  // Initialize state from localStorage
  const [state, setState] = useState<CollaborationState>(getInitialState);
  
  // WebSocket manager instance
  const wsManager = useRef<WebSocketManager>(new WebSocketManager());
  
  // Event callback storage for subscriptions
  const eventCallbacks = useRef<{
    scheduleChange: ((change: ScheduleChange) => void)[];
    conflictDetected: ((conflict: ConflictResolution) => void)[];
    userPresenceChange: ((users: PresenceUser[]) => void)[];
  }>({
    scheduleChange: [],
    conflictDetected: [],
    userPresenceChange: []
  });

  // Setup WebSocket event handlers
  useEffect(() => {
    const ws = wsManager.current;
    
    ws.onConnectionStateChange = (connectionStatus: ConnectionStatus) => {
      setState(prev => ({ ...prev, connectionStatus }));
    };
    
    ws.onUsersChange = (users: PresenceUser[]) => {
      setState(prev => ({ ...prev, activeUsers: users }));
      eventCallbacks.current.userPresenceChange.forEach(callback => callback(users));
    };
    
    ws.onMessage = handleWebSocketMessage;
    
    return () => {
      ws.disconnect();
    };
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'schedule_change':
        const change = message.data as ScheduleChange;
        setState(prev => ({
          ...prev,
          liveChanges: [...prev.liveChanges, change]
        }));
        eventCallbacks.current.scheduleChange.forEach(callback => callback(change));
        break;
        
      case 'conflict_detected':
        const conflict = message.data as ConflictResolution;
        setState(prev => ({
          ...prev,
          conflictResolution: conflict
        }));
        eventCallbacks.current.conflictDetected.forEach(callback => callback(conflict));
        break;
        
      case 'user_joined':
        const joinedUser = message.data.user as PresenceUser;
        setState(prev => ({
          ...prev,
          activeUsers: [...prev.activeUsers.filter(u => u.id !== joinedUser.id), joinedUser]
        }));
        break;
        
      case 'user_left':
        const leftUserId = message.data.userId as string;
        setState(prev => ({
          ...prev,
          activeUsers: prev.activeUsers.filter(u => u.id !== leftUserId)
        }));
        break;
        
      default:
        console.log('Unhandled message type:', message.type);
    }
  }, []);

  // Connect to collaboration session
  const connect = useCallback((scheduleId: string, user: User) => {
    setState(prev => ({
      ...prev,
      currentUser: user,
      scheduleId,
      connectionStatus: ConnectionStatus.CONNECTING
    }));
    
    saveStateToStorage(user, scheduleId);
    wsManager.current.connect(scheduleId, user);
  }, []);

  // Disconnect from collaboration session
  const disconnect = useCallback(() => {
    wsManager.current.disconnect();
    setState(prev => ({
      ...prev,
      currentUser: null,
      scheduleId: null,
      activeUsers: [],
      liveChanges: [],
      conflictResolution: null,
      connectionStatus: ConnectionStatus.DISCONNECTED
    }));
    
    saveStateToStorage(null, null);
  }, []);

  // Send schedule change to other users
  const sendScheduleChange = useCallback((change: Omit<ScheduleChange, 'id' | 'userId' | 'timestamp'>) => {
    if (!state.currentUser) return;
    
    const fullChange: ScheduleChange = {
      ...change,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: state.currentUser.id,
      timestamp: new Date()
    };
    
    wsManager.current.send({
      type: 'schedule_change',
      userId: state.currentUser.id,
      data: fullChange
    });
  }, [state.currentUser]);

  // Acknowledge and clear current conflict
  const acknowledgeConflict = useCallback(() => {
    setState(prev => ({
      ...prev,
      conflictResolution: null
    }));
  }, []);

  // Update cursor position for other users
  const updateCursor = useCallback((x: number, y: number) => {
    if (!state.currentUser) return;
    
    wsManager.current.send({
      type: 'cursor_move',
      userId: state.currentUser.id,
      data: { x, y }
    });
  }, [state.currentUser]);

  // Subscribe to schedule change events
  const onScheduleChange = useCallback((callback: (change: ScheduleChange) => void) => {
    eventCallbacks.current.scheduleChange.push(callback);
    return () => {
      eventCallbacks.current.scheduleChange = eventCallbacks.current.scheduleChange.filter(cb => cb !== callback);
    };
  }, []);

  // Subscribe to conflict detection events
  const onConflictDetected = useCallback((callback: (conflict: ConflictResolution) => void) => {
    eventCallbacks.current.conflictDetected.push(callback);
    return () => {
      eventCallbacks.current.conflictDetected = eventCallbacks.current.conflictDetected.filter(cb => cb !== callback);
    };
  }, []);

  // Subscribe to user presence change events
  const onUserPresenceChange = useCallback((callback: (users: PresenceUser[]) => void) => {
    eventCallbacks.current.userPresenceChange.push(callback);
    return () => {
      eventCallbacks.current.userPresenceChange = eventCallbacks.current.userPresenceChange.filter(cb => cb !== callback);
    };
  }, []);

  // Create the context value with memoization for performance
  const contextValue = useMemo((): CollaborationContextType => ({
    state,
    connect,
    disconnect,
    sendScheduleChange,
    acknowledgeConflict,
    updateCursor,
    onScheduleChange,
    onConflictDetected,
    onUserPresenceChange,
    ws: wsManager.current.getWebSocket()
  }), [
    state,
    connect,
    disconnect,
    sendScheduleChange,
    acknowledgeConflict,
    updateCursor,
    onScheduleChange,
    onConflictDetected,
    onUserPresenceChange
  ]);

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};

/**
 * Custom hook to use the collaboration context
 * @returns CollaborationContextType containing all collaboration state and functions
 * @throws Error if used outside of CollaborationProvider
 */
export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

/**
 * Convenience hook for accessing connection status
 * @returns Current connection status and boolean isConnected flag
 */
export const useCollaborationConnection = () => {
  const { state } = useCollaboration();
  return {
    connectionStatus: state.connectionStatus,
    isConnected: state.connectionStatus === ConnectionStatus.CONNECTED
  };
};

/**
 * Convenience hook for accessing active users
 * @returns Array of currently active users
 */
export const useActiveUsers = () => {
  const { state } = useCollaboration();
  return state.activeUsers;
};

/**
 * Convenience hook for accessing live changes
 * @returns Array of recent schedule changes
 */
export const useLiveChanges = () => {
  const { state } = useCollaboration();
  return state.liveChanges;
};

/**
 * Convenience hook for accessing current conflict
 * @returns Current conflict resolution object or null
 */
export const useCurrentConflict = () => {
  const { state, acknowledgeConflict } = useCollaboration();
  return {
    conflict: state.conflictResolution,
    acknowledgeConflict
  };
};

// Export all types for external use
export type {
  CollaborationState,
  CollaborationContextType,
  WebSocketMessage
};

// Export the ConnectionStatus enum
export { ConnectionStatus };

export default CollaborationProvider;