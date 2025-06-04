import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { LiveIndicators, User, CursorPosition, UserActivity } from './LiveIndicators';
import { useCollaboration, CollaborationProvider } from './CollaborationContext';
import { useThemeContext } from '../../contexts/ThemeContext';

// ============================================================================
// Collaboration Integration Example
// ============================================================================

interface CollaborationExampleProps {
  className?: string;
}

const CollaborationExampleInner: React.FC<CollaborationExampleProps> = ({ className = '' }) => {
  const {
    isConnected,
    currentUser,
    activeUsers,
    activities,
    settings,
    connect,
    disconnect,
    throttledCursorUpdate,
    addActivity,
    setCurrentUserLocation,
    updateSettings
  } = useCollaboration();

  const { theme } = useThemeContext();
  const [isInitialized, setIsInitialized] = useState(false);

  // ============================================================================
  // Mock User Data for Demo
  // ============================================================================

  const mockUsers: User[] = useMemo(() => [
    {
      id: 'user_1',
      name: 'Alex Thompson',
      email: 'alex.thompson@example.com',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      color: '#FF6B6B',
      status: 'online',
      lastActive: new Date(),
      currentLocation: 'Schedule Matrix',
      permissions: ['view', 'edit']
    },
    {
      id: 'user_2',
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b890?w=150&h=150&fit=crop&crop=face',
      color: '#4ECDC4',
      status: 'online',
      lastActive: new Date(),
      currentLocation: 'Constraint Editor',
      permissions: ['view', 'edit', 'admin']
    },
    {
      id: 'user_3',
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      color: '#45B7D1',
      status: 'away',
      lastActive: new Date(Date.now() - 300000), // 5 minutes ago
      currentLocation: 'Reports',
      permissions: ['view']
    },
    {
      id: 'user_4',
      name: 'Emily Rodriguez',
      email: 'emily.rodriguez@example.com',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      color: '#FFA726',
      status: 'busy',
      lastActive: new Date(),
      currentLocation: 'Analytics Dashboard',
      permissions: ['view', 'edit']
    },
    {
      id: 'user_5',
      name: 'David Kim',
      email: 'david.kim@example.com',
      color: '#AB47BC',
      status: 'online',
      lastActive: new Date(),
      currentLocation: 'Team Management',
      permissions: ['view', 'edit']
    }
  ], []);

  // ============================================================================
  // Initialization
  // ============================================================================

  useEffect(() => {
    if (!isInitialized && !isConnected) {
      // Initialize with a mock current user
      const mockCurrentUser: User = {
        id: 'current_user',
        name: 'John Doe',
        email: 'john.doe@example.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        color: '#26A69A',
        status: 'online',
        lastActive: new Date(),
        currentLocation: 'Schedule Builder',
        permissions: ['view', 'edit', 'admin']
      };

      connect(mockCurrentUser).then(() => {
        setIsInitialized(true);
        
        // Simulate other users joining over time
        setTimeout(() => {
          mockUsers.forEach((user, index) => {
            setTimeout(() => {
              // Add user through activity simulation
              addActivity({
                userId: user.id,
                action: 'join'
              });
            }, index * 2000);
          });
        }, 1000);
      });
    }
  }, [isInitialized, isConnected, connect, addActivity, mockUsers]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleUserClick = useCallback((user: User) => {
    console.log('User clicked:', user);
    // Could show user profile, start chat, etc.
  }, []);

  const handleCursorMove = useCallback((position: CursorPosition) => {
    if (currentUser) {
      throttledCursorUpdate(position);
    }
  }, [currentUser, throttledCursorUpdate]);

  // ============================================================================
  // Demo Actions
  // ============================================================================

  const simulateActivity = useCallback(() => {
    if (!currentUser) return;

    const actions: UserActivity['action'][] = ['edit', 'comment', 'move'];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    
    const locations = ['Schedule Matrix', 'Constraint Editor', 'Analytics Dashboard', 'Team Management', 'Reports'];
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];

    addActivity({
      userId: currentUser.id,
      action: randomAction,
      details: randomAction === 'move' ? { location: randomLocation } : undefined
    });

    if (randomAction === 'move') {
      setCurrentUserLocation(randomLocation);
    }
  }, [currentUser, addActivity, setCurrentUserLocation]);

  const toggleConnection = useCallback(() => {
    if (isConnected) {
      disconnect();
      setIsInitialized(false);
    } else {
      setIsInitialized(false); // This will trigger re-initialization
    }
  }, [isConnected, disconnect]);

  // ============================================================================
  // Settings Controls
  // ============================================================================

  const SettingsPanel = () => (
    <motion.div
      className="ft-collaboration-settings p-4 rounded-lg border backdrop-blur-sm"
      style={{
        backgroundColor: theme.mode === 'dark' 
          ? 'rgba(0,0,0,0.3)' 
          : 'rgba(255,255,255,0.3)',
        borderColor: theme.mode === 'dark' 
          ? 'rgba(255,255,255,0.1)' 
          : 'rgba(0,0,0,0.1)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h3 className="text-lg font-semibold mb-4">Collaboration Settings</h3>
      
      <div className="space-y-3">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.showCursors}
            onChange={(e) => updateSettings({ showCursors: e.target.checked })}
            className="rounded"
          />
          Show Live Cursors
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.showActivity}
            onChange={(e) => updateSettings({ showActivity: e.target.checked })}
            className="rounded"
          />
          Show Activity Feed
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enableNotifications}
            onChange={(e) => updateSettings({ enableNotifications: e.target.checked })}
            className="rounded"
          />
          Enable Notifications
        </label>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={settings.enableAudioCues}
            onChange={(e) => updateSettings({ enableAudioCues: e.target.checked })}
            className="rounded"
          />
          Enable Audio Cues
        </label>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Max Avatars: {settings.maxAvatars}
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={settings.maxAvatars}
            onChange={(e) => updateSettings({ maxAvatars: parseInt(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>
    </motion.div>
  );

  // ============================================================================
  // Demo Controls
  // ============================================================================

  const DemoControls = () => (
    <motion.div
      className="ft-demo-controls p-4 rounded-lg border backdrop-blur-sm"
      style={{
        backgroundColor: theme.mode === 'dark' 
          ? 'rgba(0,0,0,0.3)' 
          : 'rgba(255,255,255,0.3)',
        borderColor: theme.mode === 'dark' 
          ? 'rgba(255,255,255,0.1)' 
          : 'rgba(0,0,0,0.1)'
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <h3 className="text-lg font-semibold mb-4">Demo Controls</h3>
      
      <div className="space-y-2">
        <button
          onClick={toggleConnection}
          className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200"
          style={{
            backgroundColor: isConnected ? '#EF4444' : '#10B981',
            color: '#ffffff'
          }}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
        
        <button
          onClick={simulateActivity}
          disabled={!isConnected}
          className="w-full px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50"
          style={{
            backgroundColor: '#3B82F6',
            color: '#ffffff'
          }}
        >
          Simulate Activity
        </button>
      </div>
      
      <div className="mt-4 text-sm space-y-1">
        <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
        <div>Active Users: {activeUsers.length}</div>
        <div>Recent Activities: {activities.slice(0, 5).length}</div>
      </div>
    </motion.div>
  );

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`ft-collaboration-example ${className}`}>
      {/* Live Indicators */}
      {isConnected && currentUser && (
        <LiveIndicators
          activeUsers={[currentUser, ...mockUsers]}
          currentUser={currentUser}
          showCursors={settings.showCursors}
          showActivity={settings.showActivity}
          maxAvatars={settings.maxAvatars}
          onUserClick={handleUserClick}
          onCursorMove={handleCursorMove}
          activityFeed={activities}
          className="fixed top-4 right-4 z-50"
        />
      )}

      {/* Demo Content Area */}
      <div className="ft-demo-content min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <motion.h1
            className="text-4xl font-bold mb-8 text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            FlexTime Collaboration System
          </motion.h1>

          <motion.p
            className="text-lg text-center mb-12 opacity-75"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Experience real-time collaboration with live user presence, cursor tracking, and activity feeds.
          </motion.p>

          {/* Demo Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <SettingsPanel />
            <DemoControls />
          </div>

          {/* Interactive Demo Area */}
          <motion.div
            className="ft-interactive-area h-96 rounded-lg border-2 border-dashed p-8 text-center"
            style={{
              borderColor: theme.mode === 'dark' 
                ? 'rgba(255,255,255,0.2)' 
                : 'rgba(0,0,0,0.2)'
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            data-component="interactive-demo"
          >
            <h3 className="text-2xl font-semibold mb-4">Interactive Demo Area</h3>
            <p className="text-lg opacity-75 mb-8">
              Move your mouse around this area to see cursor tracking in action.
              {isConnected ? ' Other users will see your cursor movement in real-time.' : ' Connect to enable cursor tracking.'}
            </p>
            
            {isConnected && (
              <motion.div
                className="inline-block px-6 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: currentUser?.color || '#3B82F6',
                  color: '#ffffff'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={simulateActivity}
              >
                Click to generate activity
              </motion.div>
            )}
          </motion.div>

          {/* Feature Highlights */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="text-center p-6">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Live Presence</h3>
              <p className="opacity-75">See who's online and what they're working on in real-time.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-2">Cursor Tracking</h3>
              <p className="opacity-75">Follow other users' cursors and see their interactions live.</p>
            </div>
            
            <div className="text-center p-6">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-semibold mb-2">Activity Feed</h3>
              <p className="opacity-75">Stay updated with a real-time feed of user activities.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Example Component with Provider
// ============================================================================

const CollaborationExample: React.FC<CollaborationExampleProps> = (props) => {
  return (
    <CollaborationProvider>
      <CollaborationExampleInner {...props} />
    </CollaborationProvider>
  );
};

export default CollaborationExample;