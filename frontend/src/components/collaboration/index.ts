// ============================================================================
// FlexTime Collaboration System - Main Exports
// ============================================================================

// Core Components
export { default as LiveIndicators, UserAvatar, LiveCursor, ActivityFeed } from './LiveIndicators';
export type { User, CursorPosition, UserActivity } from './LiveIndicators';

// Realtime Collaboration Component
export { RealtimeCollaboration } from './RealtimeCollaboration';
export type { 
  User as RealtimeUser,
  ScheduleChange,
  ConflictResolution,
  CollaborationMessage 
} from './RealtimeCollaboration';

// Context and Provider
export { 
  default as CollaborationProvider, 
  useCollaboration 
} from './CollaborationContext';
export type { 
  CollaborationSettings, 
  CollaborationState, 
  CollaborationActions 
} from './CollaborationContext';

// Example/Demo Component
export { default as CollaborationExample } from './CollaborationExample';

// Utility Functions and Hooks
export const collaborationUtils = {
  /**
   * Generate a unique user ID
   */
  generateUserId: (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Generate a random user color
   */
  generateUserColor: (): string => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#AB47BC',
      '#26A69A', '#FF7043', '#66BB6A', '#42A5F5', '#EC407A',
      '#8BC34A', '#FFCA28', '#26C6DA', '#7E57C2', '#FF8A65'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  /**
   * Generate user initials from name
   */
  getUserInitials: (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  /**
   * Format relative time for activity timestamps
   */
  formatRelativeTime: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  },

  /**
   * Check if user is considered active
   */
  isUserActive: (user: { lastActive: Date }, thresholdMs: number = 300000): boolean => {
    const now = new Date();
    return now.getTime() - user.lastActive.getTime() < thresholdMs;
  },

  /**
   * Get user status color
   */
  getStatusColor: (status: 'online' | 'away' | 'busy' | 'offline'): string => {
    const colors = {
      online: '#10B981',   // green-500
      away: '#F59E0B',     // amber-500
      busy: '#EF4444',     // red-500
      offline: '#6B7280'   // gray-500
    };
    return colors[status];
  },

  /**
   * Throttle function for cursor updates
   */
  throttle: <T extends (...args: any[]) => void>(
    func: T, 
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean;
    return function (this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Debounce function for activity updates
   */
  debounce: <T extends (...args: any[]) => void>(
    func: T, 
    delay: number
  ): ((...args: Parameters<T>) => void) => {
    let timeoutId: NodeJS.Timeout;
    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }
};

// CSS Styles
import './LiveIndicators.css';

// ============================================================================
// Re-export commonly used types for convenience
// ============================================================================

export interface CollaborationConfig {
  enableWebSocket?: boolean;
  websocketUrl?: string;
  enableNotifications?: boolean;
  enableAudioCues?: boolean;
  maxUsers?: number;
  cursorUpdateThrottle?: number;
  activityRetentionTime?: number;
}

// ============================================================================
// Default Export - Main LiveIndicators Component
// ============================================================================

export { default } from './LiveIndicators';