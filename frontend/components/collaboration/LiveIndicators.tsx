import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useReducedMotion from '../../hooks/useReducedMotion';
import { useThemeContext } from '../../contexts/ThemeContext';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  color: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastActive: Date;
  currentLocation?: string; // e.g., "Schedule Matrix", "Constraint Editor"
  permissions: ('view' | 'edit' | 'admin')[];
}

export interface CursorPosition {
  x: number;
  y: number;
  timestamp: Date;
  component?: string; // Which component the cursor is over
  action?: 'hover' | 'click' | 'drag' | 'select';
}

export interface UserActivity {
  userId: string;
  action: 'join' | 'leave' | 'edit' | 'comment' | 'move';
  timestamp: Date;
  details?: Record<string, any>;
}

interface LiveIndicatorsProps {
  activeUsers: User[];
  currentUser: User;
  showCursors?: boolean;
  showActivity?: boolean;
  maxAvatars?: number;
  onUserClick?: (user: User) => void;
  onCursorMove?: (position: CursorPosition) => void;
  activityFeed?: UserActivity[];
  className?: string;
}

// ============================================================================
// Live Cursor Component
// ============================================================================

interface LiveCursorProps {
  user: User;
  position: CursorPosition;
  isCurrentUser?: boolean;
}

const LiveCursor: React.FC<LiveCursorProps> = ({ 
  user, 
  position, 
  isCurrentUser = false 
}) => {
  const prefersReducedMotion = useReducedMotion();
  const { theme } = useThemeContext();

  // Don't show cursor for current user
  if (isCurrentUser) return null;

  const cursorVariants = {
    initial: { 
      scale: 0, 
      opacity: 0,
      x: position.x,
      y: position.y
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      x: position.x,
      y: position.y,
      transition: {
        type: prefersReducedMotion ? 'tween' : 'spring',
        stiffness: prefersReducedMotion ? 100 : 500,
        damping: prefersReducedMotion ? 20 : 30,
        duration: prefersReducedMotion ? 0.1 : undefined
      }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const labelVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { 
      opacity: 1, 
      y: 0,
      transition: { delay: 0.1 }
    },
    exit: { opacity: 0, y: 10 }
  };

  return (
    <motion.div
      className="ft-live-cursor"
      variants={cursorVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        color: user.color
      }}
    >
      {/* Cursor SVG */}
      <motion.svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24"
        className="drop-shadow-lg"
      >
        <path 
          d="M5.65 2L20 16.35L13.77 18.54L9.23 23.08L7.82 21.67L12.36 17.13L5.65 2Z" 
          fill={user.color}
          stroke={theme.mode === 'dark' ? '#ffffff' : '#000000'}
          strokeWidth="1"
        />
      </motion.svg>

      {/* User label */}
      <motion.div
        className="ft-cursor-label"
        variants={labelVariants}
        style={{
          position: 'absolute',
          left: '20px',
          top: '0px',
          backgroundColor: user.color,
          color: theme.mode === 'dark' ? '#ffffff' : '#000000',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: '500',
          whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          backdropFilter: 'blur(8px)'
        }}
      >
        {user.name}
        {position.action && (
          <span className="ml-1 text-xs opacity-75">
            {position.action}
          </span>
        )}
      </motion.div>

      {/* Action indicator */}
      {position.action && position.action !== 'hover' && (
        <motion.div
          className="ft-cursor-action"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
          style={{
            position: 'absolute',
            left: '12px',
            top: '12px',
            width: '8px',
            height: '8px',
            backgroundColor: user.color,
            borderRadius: '50%',
            boxShadow: `0 0 10px ${user.color}`
          }}
        />
      )}
    </motion.div>
  );
};

// ============================================================================
// User Avatar Component
// ============================================================================

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  showTooltip?: boolean;
  onClick?: () => void;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  showStatus = true,
  showTooltip = true,
  onClick 
}) => {
  const [showTooltipState, setShowTooltipState] = useState(false);
  const { theme } = useThemeContext();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  const statusColors = {
    online: '#10B981', // green-500
    away: '#F59E0B',   // amber-500
    busy: '#EF4444',   // red-500
    offline: '#6B7280' // gray-500
  };

  const avatarVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    },
    exit: { 
      scale: 0, 
      opacity: 0,
      transition: { duration: 0.2 }
    },
    hover: { 
      scale: 1.1,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className={`ft-user-avatar relative ${sizeClasses[size]} ${onClick ? 'cursor-pointer' : ''}`}
      variants={avatarVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      whileHover={onClick ? "hover" : undefined}
      onClick={onClick}
      onMouseEnter={() => showTooltip && setShowTooltipState(true)}
      onMouseLeave={() => setShowTooltipState(false)}
    >
      {/* Avatar image or initials */}
      <div 
        className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white/20 backdrop-blur-sm`}
        style={{ backgroundColor: user.color }}
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white font-semibold">
            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>

      {/* Status indicator */}
      {showStatus && (
        <motion.div
          className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white"
          style={{ backgroundColor: statusColors[user.status] }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && showTooltipState && (
          <motion.div
            className="ft-user-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div 
              className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap"
              style={{
                backgroundColor: theme.mode === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.9)'
              }}
            >
              <div className="font-semibold">{user.name}</div>
              <div className="text-xs opacity-75">{user.status}</div>
              {user.currentLocation && (
                <div className="text-xs opacity-75">@ {user.currentLocation}</div>
              )}
              {/* Tooltip arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                <div className="border-4 border-transparent border-t-black/80"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ============================================================================
// Activity Feed Component
// ============================================================================

interface ActivityFeedProps {
  activities: UserActivity[];
  users: User[];
  maxItems?: number;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ 
  activities, 
  users, 
  maxItems = 5 
}) => {
  const { theme } = useThemeContext();

  const getUserById = (userId: string) => users.find(u => u.id === userId);

  const getActivityMessage = (activity: UserActivity) => {
    const user = getUserById(activity.userId);
    const userName = user?.name || 'Unknown User';

    switch (activity.action) {
      case 'join':
        return `${userName} joined the session`;
      case 'leave':
        return `${userName} left the session`;
      case 'edit':
        return `${userName} made an edit`;
      case 'comment':
        return `${userName} added a comment`;
      case 'move':
        return `${userName} moved to ${activity.details?.location || 'another area'}`;
      default:
        return `${userName} performed an action`;
    }
  };

  const getActivityIcon = (action: UserActivity['action']) => {
    switch (action) {
      case 'join':
        return '👋';
      case 'leave':
        return '👋';
      case 'edit':
        return '✏️';
      case 'comment':
        return '💬';
      case 'move':
        return '🔄';
      default:
        return '🔔';
    }
  };

  const recentActivities = activities
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, maxItems);

  return (
    <div className="ft-activity-feed">
      <AnimatePresence>
        {recentActivities.map((activity, index) => (
          <motion.div
            key={`${activity.userId}-${activity.timestamp.getTime()}`}
            className="ft-activity-item flex items-center gap-2 p-2 rounded-lg"
            style={{
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(255,255,255,0.05)' 
                : 'rgba(0,0,0,0.05)'
            }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-lg">{getActivityIcon(activity.action)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">
                {getActivityMessage(activity)}
              </div>
              <div className="text-xs opacity-60">
                {activity.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// Main LiveIndicators Component
// ============================================================================

export const LiveIndicators: React.FC<LiveIndicatorsProps> = ({ 
  activeUsers, 
  currentUser, 
  showCursors = true,
  showActivity = true,
  maxAvatars = 5,
  onUserClick,
  onCursorMove,
  activityFeed = [],
  className = ''
}) => {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const { theme } = useThemeContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const prefersReducedMotion = useReducedMotion();

  // Filter out current user from active users for display
  const otherUsers = useMemo(() => 
    activeUsers.filter(user => user.id !== currentUser.id),
    [activeUsers, currentUser.id]
  );

  // Handle mouse movement for cursor tracking
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!onCursorMove) return;

    const position: CursorPosition = {
      x: event.clientX,
      y: event.clientY,
      timestamp: new Date(),
      component: (event.target as HTMLElement)?.closest('[data-component]')?.getAttribute('data-component'),
      action: 'hover'
    };

    onCursorMove(position);
  }, [onCursorMove]);

  // Set up mouse tracking
  useEffect(() => {
    if (showCursors && onCursorMove) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [showCursors, onCursorMove, handleMouseMove]);

  // Update cursor positions
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const updateCursorPosition = useCallback((userId: string, position: CursorPosition) => {
    setCursors(prev => new Map(prev.set(userId, position)));
  }, []);

  // Clean up stale cursors
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = new Date();
      setCursors(prev => {
        const newCursors = new Map(prev);
        for (const [userId, position] of newCursors) {
          if (now.getTime() - position.timestamp.getTime() > 5000) { // 5 seconds
            newCursors.delete(userId);
          }
        }
        return newCursors;
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className={`ft-live-indicators ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* User Avatars Section */}
      <div className="ft-user-avatars flex items-center gap-2">
        <AnimatePresence>
          {otherUsers.slice(0, maxAvatars).map(user => (
            <UserAvatar
              key={user.id}
              user={user}
              onClick={() => onUserClick?.(user)}
            />
          ))}
        </AnimatePresence>

        {/* Overflow indicator */}
        {otherUsers.length > maxAvatars && (
          <motion.div
            className="ft-user-count flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold"
            style={{
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.1)',
              color: theme.mode === 'dark' ? '#ffffff' : '#000000'
            }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
          >
            +{otherUsers.length - maxAvatars}
          </motion.div>
        )}

        {/* Activity indicator */}
        {showActivity && activityFeed.length > 0 && (
          <motion.button
            className="ft-activity-toggle ml-4 p-2 rounded-full"
            style={{
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.1)'
            }}
            onClick={() => setShowActivityFeed(!showActivityFeed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">🔔</span>
            {activityFeed.length > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
              >
                {Math.min(activityFeed.length, 9)}
              </motion.div>
            )}
          </motion.button>
        )}
      </div>

      {/* Activity Feed */}
      <AnimatePresence>
        {showActivity && showActivityFeed && (
          <motion.div
            className="ft-activity-panel absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-lg border backdrop-blur-sm z-50"
            style={{
              backgroundColor: theme.mode === 'dark' 
                ? 'rgba(0,0,0,0.8)' 
                : 'rgba(255,255,255,0.9)',
              borderColor: theme.mode === 'dark' 
                ? 'rgba(255,255,255,0.1)' 
                : 'rgba(0,0,0,0.1)'
            }}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <ActivityFeed activities={activityFeed} users={activeUsers} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Cursors */}
      {showCursors && (
        <div className="ft-live-cursors">
          <AnimatePresence>
            {Array.from(cursors.entries()).map(([userId, position]) => {
              const user = activeUsers.find(u => u.id === userId);
              if (!user || user.id === currentUser.id) return null;

              return (
                <LiveCursor
                  key={userId}
                  user={user}
                  position={position}
                  isCurrentUser={user.id === currentUser.id}
                />
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Connection Status */}
      <div className="ft-connection-status absolute bottom-0 right-0 mb-4 mr-4">
        <motion.div
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm backdrop-blur-sm"
          style={{
            backgroundColor: theme.mode === 'dark' 
              ? 'rgba(0,0,0,0.6)' 
              : 'rgba(255,255,255,0.8)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <span>
            {otherUsers.length === 0 
              ? 'You are alone'
              : `${otherUsers.length} ${otherUsers.length === 1 ? 'person' : 'people'} online`
            }
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default LiveIndicators;
export { UserAvatar, LiveCursor, ActivityFeed };
export type { User, CursorPosition, UserActivity };