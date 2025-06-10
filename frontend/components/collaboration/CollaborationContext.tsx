import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { User, CursorPosition, UserActivity } from './LiveIndicators';

// ============================================================================
// Types and Interfaces
// ============================================================================

interface CollaborationSettings {
  showCursors: boolean;
  showActivity: boolean;
  maxAvatars: number;
  activityRetentionTime: number; // milliseconds
  cursorUpdateThrottle: number; // milliseconds
  enableNotifications: boolean;
  enableAudioCues: boolean;
}

interface CollaborationState {
  isConnected: boolean;
  currentUser?: User;
  activeUsers: User[];
  cursors: Map<string, CursorPosition>;
  activities: UserActivity[];
  settings: CollaborationSettings;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  lastHeartbeat?: Date;
}

interface CollaborationActions {
  // Connection management
  connect: (user: User) => Promise<boolean>;
  disconnect: () => void;
  setConnectionQuality: (quality: CollaborationState['connectionQuality']) => void;
  
  // User management
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  setCurrentUserLocation: (location: string) => void;
  
  // Cursor tracking
  updateCursor: (userId: string, position: CursorPosition) => void;
  clearCursor: (userId: string) => void;
  throttledCursorUpdate: (position: CursorPosition) => void;
  
  // Activity tracking
  addActivity: (activity: Omit<UserActivity, 'timestamp'>) => void;
  clearActivities: () => void;
  
  // Settings
  updateSettings: (settings: Partial<CollaborationSettings>) => void;
  resetSettings: () => void;
  
  // Notifications
  showNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  playAudioCue: (type: 'join' | 'leave' | 'edit' | 'notification') => void;
}

type CollaborationContextType = CollaborationState & CollaborationActions;

// ============================================================================
// Default Values
// ============================================================================

const DEFAULT_SETTINGS: CollaborationSettings = {
  showCursors: true,
  showActivity: true,
  maxAvatars: 5,
  activityRetentionTime: 300000, // 5 minutes
  cursorUpdateThrottle: 50, // 50ms
  enableNotifications: true,
  enableAudioCues: false
};

const DEFAULT_STATE: CollaborationState = {
  isConnected: false,
  activeUsers: [],
  cursors: new Map(),
  activities: [],
  settings: DEFAULT_SETTINGS,
  connectionQuality: 'disconnected'
};

// ============================================================================
// Context Creation
// ============================================================================

const CollaborationContext = createContext<CollaborationContextType | undefined>(undefined);

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  SETTINGS: 'flextime-collaboration-settings',
  USER: 'flextime-collaboration-user'
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save collaboration data to localStorage:', error);
  }
};

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn('Failed to load collaboration data from localStorage:', error);
    return defaultValue;
  }
};

const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateUserColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC',
    '#26A69A', '#FF7043', '#66BB6A', '#42A5F5', '#EC407A',
    '#8BC34A', '#FFCA28', '#26C6DA', '#7E57C2', '#FF8A65'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// ============================================================================
// Audio Cues
// ============================================================================

const AudioCues = {
  join: () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  },
  
  leave: () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  },
  
  edit: () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  },
  
  notification: () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1760, audioContext.currentTime + 0.05);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  }
};

// ============================================================================
// Provider Component
// ============================================================================

interface CollaborationProviderProps {
  children: ReactNode;
  websocketUrl?: string;
  enableWebSocket?: boolean;
}

export const CollaborationProvider: React.FC<CollaborationProviderProps> = ({
  children,
  websocketUrl,
  enableWebSocket = false
}) => {
  // State management
  const [state, setState] = useState<CollaborationState>(() => ({
    ...DEFAULT_STATE,
    settings: loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  }));

  // WebSocket connection (optional)
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Throttled cursor update
  const [cursorUpdateTimeout, setCursorUpdateTimeout] = useState<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Connection Management
  // ============================================================================

  const connect = useCallback(async (user: User): Promise<boolean> => {
    try {
      // Ensure user has required fields
      const completeUser: User = {
        ...user,
        id: user.id || generateUserId(),
        color: user.color || generateUserColor(),
        status: user.status || 'online',
        lastActive: new Date(),
        permissions: user.permissions || ['view']
      };

      setState(prev => ({
        ...prev,
        currentUser: completeUser,
        isConnected: true,
        connectionQuality: 'excellent',
        lastHeartbeat: new Date()
      }));

      // Save user to storage
      saveToStorage(STORAGE_KEYS.USER, completeUser);

      // Connect to WebSocket if enabled
      if (enableWebSocket && websocketUrl) {
        const websocket = new WebSocket(websocketUrl);
        
        websocket.onopen = () => {
          console.log('WebSocket connected');
          setWs(websocket);
          
          // Send join message
          websocket.send(JSON.stringify({
            type: 'user_join',
            user: completeUser
          }));
        };

        websocket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            handleWebSocketMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        websocket.onclose = () => {
          console.log('WebSocket disconnected');
          setWs(null);
          setState(prev => ({
            ...prev,
            connectionQuality: 'disconnected'
          }));
        };

        websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          setState(prev => ({
            ...prev,
            connectionQuality: 'poor'
          }));
        };
      }

      // Add join activity
      addActivity({
        userId: completeUser.id,
        action: 'join'
      });

      // Play audio cue
      if (state.settings.enableAudioCues) {
        AudioCues.join();
      }

      return true;
    } catch (error) {
      console.error('Failed to connect:', error);
      return false;
    }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, [enableWebSocket, websocketUrl, state.settings.enableAudioCues, addActivity, handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
    }

    if (state.currentUser) {
      // Add leave activity
      addActivity({
        userId: state.currentUser.id,
        action: 'leave'
      });

      // Play audio cue
      if (state.settings.enableAudioCues) {
        AudioCues.leave();
      }
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      currentUser: undefined,
      connectionQuality: 'disconnected'
    }));

    // Clean up storage
    localStorage.removeItem(STORAGE_KEYS.USER);
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, [ws, state.currentUser, state.settings.enableAudioCues, addActivity]);

  // ============================================================================
  // WebSocket Message Handling
  // ============================================================================

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'user_join':
        addUser(message.user);
        break;
      case 'user_leave':
        removeUser(message.userId);
        break;
      case 'user_update':
        updateUser(message.userId, message.updates);
        break;
      case 'cursor_update':
        updateCursor(message.userId, message.position);
        break;
      case 'activity':
        addActivity(message.activity);
        break;
      default:
        console.warn('Unknown WebSocket message type:', message.type);
    }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, [addActivity, addUser, removeUser, updateCursor, updateUser]);

  // ============================================================================
  // User Management
  // ============================================================================

  const addUser = useCallback((user: User) => {
    setState(prev => {
      const existingUser = prev.activeUsers.find(u => u.id === user.id);
      if (existingUser) return prev;

      return {
        ...prev,
        activeUsers: [...prev.activeUsers, user]
      };
    });

    // Show notification
    if (state.settings.enableNotifications) {
      showNotification(`${user.name} joined the session`, 'info');
    }

    // Play audio cue
    if (state.settings.enableAudioCues) {
      AudioCues.join();
    }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, [state.settings.enableNotifications, state.settings.enableAudioCues, showNotification]);

  const removeUser = useCallback((userId: string) => {
    const user = state.activeUsers.find(u => u.id === userId);
    
    setState(prev => ({
      ...prev,
      activeUsers: prev.activeUsers.filter(u => u.id !== userId),
      cursors: new Map([...prev.cursors].filter(([id]) => id !== userId))
    }));

    // Show notification
    if (user && state.settings.enableNotifications) {
      showNotification(`${user.name} left the session`, 'info');
    }

    // Play audio cue
    if (state.settings.enableAudioCues) {
      AudioCues.leave();
    }
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, [state.activeUsers, state.settings.enableNotifications, state.settings.enableAudioCues, showNotification]);

  const updateUser = useCallback((userId: string, updates: Partial<User>) => {
    setState(prev => ({
      ...prev,
      activeUsers: prev.activeUsers.map(user =>
        user.id === userId ? { ...user, ...updates, lastActive: new Date() } : user
      ),
      currentUser: prev.currentUser?.id === userId 
        ? { ...prev.currentUser, ...updates, lastActive: new Date() }
        : prev.currentUser
    }));
  }, []);

  const setCurrentUserLocation = useCallback((location: string) => {
    if (!state.currentUser) return;

    const updates = { currentLocation: location };
    updateUser(state.currentUser.id, updates);

    // Send to WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'user_update',
        userId: state.currentUser.id,
        updates
      }));
    }

    // Add activity
    addActivity({
      userId: state.currentUser.id,
      action: 'move',
      details: { location }
    });
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  }, [state.currentUser, ws, updateUser, addActivity]);

  // ============================================================================
  // Cursor Management
  // ============================================================================

  const updateCursor = useCallback((userId: string, position: CursorPosition) => {
    setState(prev => ({
      ...prev,
      cursors: new Map(prev.cursors.set(userId, {
        ...position,
        timestamp: new Date()
      }))
    }));
  }, []);

  const clearCursor = useCallback((userId: string) => {
    setState(prev => {
      const newCursors = new Map(prev.cursors);
      newCursors.delete(userId);
      return {
        ...prev,
        cursors: newCursors
      };
    });
  }, []);

  const throttledCursorUpdate = useCallback((position: CursorPosition) => {
    if (!state.currentUser || !state.isConnected) return;

    // Clear existing timeout
    if (cursorUpdateTimeout) {
      clearTimeout(cursorUpdateTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      // Update local cursor
      updateCursor(state.currentUser!.id, position);

      // Send to WebSocket
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'cursor_update',
          userId: state.currentUser!.id,
          position
        }));
      }
    }, state.settings.cursorUpdateThrottle);

    setCursorUpdateTimeout(timeout);
  }, [state.currentUser, state.isConnected, state.settings.cursorUpdateThrottle, ws, cursorUpdateTimeout, updateCursor]);

  // ============================================================================
  // Activity Management
  // ============================================================================

  const addActivity = useCallback((activity: Omit<UserActivity, 'timestamp'>) => {
    const newActivity: UserActivity = {
      ...activity,
      timestamp: new Date()
    };

    setState(prev => ({
      ...prev,
      activities: [newActivity, ...prev.activities].slice(0, 100) // Keep last 100 activities
    }));

    // Send to WebSocket
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'activity',
        activity: newActivity
      }));
    }

    // Play audio cue for edits
    if (activity.action === 'edit' && state.settings.enableAudioCues) {
      AudioCues.edit();
    }
  }, [ws, state.settings.enableAudioCues]);

  const clearActivities = useCallback(() => {
    setState(prev => ({
      ...prev,
      activities: []
    }));
  }, []);

  // ============================================================================
  // Settings Management
  // ============================================================================

  const updateSettings = useCallback((newSettings: Partial<CollaborationSettings>) => {
    setState(prev => {
      const updatedSettings = { ...prev.settings, ...newSettings };
      saveToStorage(STORAGE_KEYS.SETTINGS, updatedSettings);
      return {
        ...prev,
        settings: updatedSettings
      };
    });
  }, []);

  const resetSettings = useCallback(() => {
    setState(prev => ({
      ...prev,
      settings: DEFAULT_SETTINGS
    }));
    saveToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }, []);

  // ============================================================================
  // Notifications
  // ============================================================================

  const showNotification = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    if (!state.settings.enableNotifications) return;

    // Use browser notifications if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('FlexTime Collaboration', {
        body: message,
        icon: '/favicon.ico',
        tag: 'collaboration'
      });
    } else {
      // Fallback to console or custom notification system
      console.log(`Collaboration ${type}:`, message);
    }
  }, [state.settings.enableNotifications]);

  const playAudioCue = useCallback((type: 'join' | 'leave' | 'edit' | 'notification') => {
    if (!state.settings.enableAudioCues) return;

    try {
      AudioCues[type]();
    } catch (error) {
      console.warn('Failed to play audio cue:', error);
    }
  }, [state.settings.enableAudioCues]);

  const setConnectionQuality = useCallback((quality: CollaborationState['connectionQuality']) => {
    setState(prev => ({
      ...prev,
      connectionQuality: quality
    }));
  }, []);

  // ============================================================================
  // Cleanup Effects
  // ============================================================================

  // Clean up old activities
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setState(prev => ({
        ...prev,
        activities: prev.activities.filter(
          activity => now.getTime() - activity.timestamp.getTime() < prev.settings.activityRetentionTime
        )
      }));
    }, 60000); // Clean up every minute

    return () => clearInterval(cleanup);
  }, []);

  // Clean up old cursors
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setState(prev => {
        const newCursors = new Map(prev.cursors);
        for (const [userId, position] of newCursors) {
          if (now.getTime() - position.timestamp.getTime() > 5000) { // 5 seconds
            newCursors.delete(userId);
          }
        }
        return {
          ...prev,
          cursors: newCursors
        };
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
      if (cursorUpdateTimeout) {
        clearTimeout(cursorUpdateTimeout);
      }
    };
  }, [ws, cursorUpdateTimeout]);

  // ============================================================================
  // Context Value
  // ============================================================================

  const contextValue = useMemo<CollaborationContextType>(() => ({
    ...state,
    connect,
    disconnect,
    setConnectionQuality,
    addUser,
    removeUser,
    updateUser,
    setCurrentUserLocation,
    updateCursor,
    clearCursor,
    throttledCursorUpdate,
    addActivity,
    clearActivities,
    updateSettings,
    resetSettings,
    showNotification,
    playAudioCue
  }), [
    state,
    connect,
    disconnect,
    setConnectionQuality,
    addUser,
    removeUser,
    updateUser,
    setCurrentUserLocation,
    updateCursor,
    clearCursor,
    throttledCursorUpdate,
    addActivity,
    clearActivities,
    updateSettings,
    resetSettings,
    showNotification,
    playAudioCue
  ]);

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
};

// ============================================================================
// Custom Hook
// ============================================================================

export const useCollaboration = (): CollaborationContextType => {
  const context = useContext(CollaborationContext);
  if (context === undefined) {
    throw new Error('useCollaboration must be used within a CollaborationProvider');
  }
  return context;
};

// ============================================================================
// Exports
// ============================================================================

export default CollaborationProvider;
export type { CollaborationSettings, CollaborationState, CollaborationActions };