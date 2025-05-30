/**
 * FlexTime FT Builder - Main Application Integration
 * Complete integration with FlexTime's existing architecture
 */

// AI Floating Action Button Component
function AIFloatingActionButton({ 
  agentStatus, 
  onQuickOptimize, 
  onAskAI, 
  onAutoResolveConflicts 
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [showAIChat, setShowAIChat] = React.useState(false);

  return React.createElement('div', { className: 'ai-fab-container' }, [
    
    // Main FAB Button
    React.createElement('button', {
      className: `ai-fab-main ${isExpanded ? 'expanded' : ''}`,
      onClick: () => setIsExpanded(!isExpanded),
      key: 'main-fab'
    }, [
      React.createElement('span', { className: 'fab-icon', key: 'icon' }, '■'),
      React.createElement('span', { className: 'fab-label', key: 'label' }, 'AI Assistant')
    ]),

    // Expanded Action Menu
    isExpanded && React.createElement('div', { className: 'ai-fab-menu', key: 'menu' }, [
      React.createElement('button', {
        className: 'fab-action-btn',
        onClick: onQuickOptimize,
        disabled: agentStatus.optimizer === 'optimizing',
        key: 'optimize'
      }, [
        React.createElement('span', { className: 'action-icon', key: 'icon' }, '▲'),
        React.createElement('span', { className: 'action-label', key: 'label' }, 'Quick Optimize')
      ]),
      
      React.createElement('button', {
        className: 'fab-action-btn',
        onClick: () => setShowAIChat(true),
        key: 'chat'
      }, [
        React.createElement('span', { className: 'action-icon', key: 'icon' }, '✉'),
        React.createElement('span', { className: 'action-label', key: 'label' }, 'Ask AI')
      ]),
      
      React.createElement('button', {
        className: 'fab-action-btn',
        onClick: onAutoResolveConflicts,
        key: 'resolve'
      }, [
        React.createElement('span', { className: 'action-icon', key: 'icon' }, '⚙'),
        React.createElement('span', { className: 'action-label', key: 'label' }, 'Auto-Resolve')
      ])
    ]),

    // AI Chat Modal
    showAIChat && React.createElement(AIChatModal, {
      key: 'chat-modal',
      onClose: () => setShowAIChat(false),
      onSendMessage: handleAIChatMessage
    })
  ]);

  function handleAIChatMessage(message) {
    // Integrate with FlexTime's AI chat system
    console.log('AI Chat Message:', message);
  }
}

// AI Chat Modal Component
function AIChatModal({ onClose, onSendMessage }) {
  const [message, setMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState([
    {
      type: 'ai',
      content: 'Hello! I\'m your FlexTime AI assistant. I can help you optimize schedules, resolve conflicts, and answer questions about your Big 12 Conference scheduling. What would you like to know?',
      timestamp: new Date()
    }
  ]);

  const handleSend = () => {
    if (!message.trim()) return;

    setChatHistory(prev => [...prev, {
      type: 'user',
      content: message,
      timestamp: new Date()
    }]);

    onSendMessage(message);
    setMessage('');

    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        type: 'ai',
        content: `I understand you're asking about "${message}". Let me analyze your current schedule and provide recommendations...`,
        timestamp: new Date()
      }]);
    }, 1000);
  };

  return React.createElement('div', { className: 'ai-chat-modal-overlay', onClick: onClose }, [
    React.createElement('div', { 
      className: 'ai-chat-modal',
      onClick: (e) => e.stopPropagation(),
      key: 'modal'
    }, [
      
      // Header
      React.createElement('div', { className: 'chat-modal-header', key: 'header' }, [
        React.createElement('h3', { key: 'title' }, [
          React.createElement('span', { key: 'icon' }, '■'),
          React.createElement('span', { key: 'text' }, 'FlexTime AI Assistant')
        ]),
        React.createElement('button', {
          className: 'close-btn',
          onClick: onClose,
          key: 'close'
        }, '×')
      ]),

      // Chat History
      React.createElement('div', { className: 'chat-history', key: 'history' },
        chatHistory.map((msg, index) =>
          React.createElement('div', { 
            className: `chat-message ${msg.type}`,
            key: index
          }, [
            React.createElement('div', { className: 'message-content', key: 'content' }, msg.content),
            React.createElement('div', { className: 'message-time', key: 'time' }, 
              msg.timestamp.toLocaleTimeString()
            )
          ])
        )
      ),

      // Input Area
      React.createElement('div', { className: 'chat-input-area', key: 'input' }, [
        React.createElement('input', {
          type: 'text',
          value: message,
          onChange: (e) => setMessage(e.target.value),
          onKeyPress: (e) => e.key === 'Enter' && handleSend(),
          placeholder: 'Ask me about scheduling optimization, conflicts, or analysis...',
          className: 'chat-input',
          key: 'text-input'
        }),
        React.createElement('button', {
          onClick: handleSend,
          className: 'send-btn',
          key: 'send'
        }, '→')
      ])
    ])
  ]);
}

// Collaboration Panel Component
function ScheduleCollaborationPanel({ 
  liveChanges, 
  activeUsers, 
  onRevertChange, 
  onAcceptChange 
}) {
  const [isMinimized, setIsMinimized] = React.useState(false);

  if (liveChanges.length === 0) return null;

  return React.createElement('div', { className: `collaboration-panel ${isMinimized ? 'minimized' : ''}` }, [
    
    // Header
    React.createElement('div', { className: 'collaboration-header', key: 'header' }, [
      React.createElement('h4', { key: 'title' }, [
        React.createElement('span', { key: 'icon' }, '👥'),
        React.createElement('span', { key: 'text' }, `${liveChanges.length} Live Changes`)
      ]),
      React.createElement('button', {
        className: 'minimize-btn',
        onClick: () => setIsMinimized(!isMinimized),
        key: 'minimize'
      }, isMinimized ? '▲' : '▼')
    ]),

    // Changes List
    !isMinimized && React.createElement('div', { className: 'changes-list', key: 'changes' },
      liveChanges.slice(0, 5).map((change, index) =>
        React.createElement('div', { className: 'change-item', key: index }, [
          React.createElement('div', { className: 'change-user', key: 'user' }, [
            React.createElement('div', { 
              className: 'user-avatar-small',
              style: { backgroundColor: change.user.color },
              key: 'avatar'
            }, change.user.initials),
            React.createElement('span', { className: 'user-name', key: 'name' }, change.user.name)
          ]),
          React.createElement('div', { className: 'change-content', key: 'content' }, [
            React.createElement('span', { className: 'change-description', key: 'desc' }, change.description),
            React.createElement('span', { className: 'change-time', key: 'time' }, 
              new Date(change.timestamp).toLocaleTimeString()
            )
          ]),
          React.createElement('div', { className: 'change-actions', key: 'actions' }, [
            React.createElement('button', {
              className: 'btn-accept-change',
              onClick: () => onAcceptChange(change.id),
              key: 'accept'
            }, '✓'),
            React.createElement('button', {
              className: 'btn-revert-change',
              onClick: () => onRevertChange(change.id),
              key: 'revert'
            }, '✗')
          ])
        ])
      )
    )
  ]);
}

// API Integration Functions
const FTBuilderAPI = {
  
  // Generate new schedule using AI
  async generateSchedule(sportId, constraints) {
    try {
      const response = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sport: sportId,
          constraints: constraints,
          conference: 'big12',
          season: '2024-2025'
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      throw error;
    }
  },

  // Optimize existing schedule
  async optimizeSchedule(scheduleId, optimizationType = 'full') {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/optimize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: optimizationType,
          preferences: {
            travelOptimization: true,
            balanceOptimization: true,
            conflictResolution: true
          }
        })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to optimize schedule:', error);
      throw error;
    }
  },

  // Get COMPASS scores
  async getCompassScores(scheduleId) {
    try {
      const response = await fetch(`/api/compass/analyze/${scheduleId}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get COMPASS scores:', error);
      throw error;
    }
  },

  // Real-time conflict detection
  async detectConflicts(schedule) {
    try {
      const response = await fetch('/api/schedules/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule })
      });
      return await response.json();
    } catch (error) {
      console.error('Failed to detect conflicts:', error);
      throw error;
    }
  },

  // Export schedule in various formats
  async exportSchedule(scheduleId, format) {
    try {
      const response = await fetch(`/api/schedules/${scheduleId}/export?format=${format}`);
      if (format === 'pdf' || format === 'excel') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `big12_schedule.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to export schedule:', error);
      throw error;
    }
  }
};

// Main FT Builder Page Component
function FTBuilderPage() {
  // Initialize with demo data for immediate functionality
  const [schedule, setSchedule] = React.useState({
    id: 'demo-football-2024',
    sport: 'football',
    season: '2024-2025',
    games: [
      {
        id: 'game-1',
        homeTeam: 'texas-tech',
        awayTeam: 'baylor',
        date: '2024-09-07',
        time: '7:00 PM',
        venue: 'Jones AT&T Stadium',
        tv: 'ESPN2'
      },
      {
        id: 'game-2',
        homeTeam: 'kansas',
        awayTeam: 'kansas-state',
        date: '2024-09-14',
        time: '3:30 PM',
        venue: 'Memorial Stadium',
        tv: 'FOX'
      }
    ]
  });

  const [isLoading, setIsLoading] = React.useState(false);

  // AI Integration Handlers
  const handleAIGeneration = async () => {
    setIsLoading(true);
    try {
      const newSchedule = await FTBuilderAPI.generateSchedule('football', {
        maxConsecutiveHome: 2,
        travelOptimization: true
      });
      setSchedule(newSchedule);
    } catch (error) {
      console.error('AI generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptimization = async () => {
    setIsLoading(true);
    try {
      const optimizedSchedule = await FTBuilderAPI.optimizeSchedule(schedule.id);
      setSchedule(optimizedSchedule);
    } catch (error) {
      console.error('Optimization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSchedule = async (format) => {
    try {
      await FTBuilderAPI.exportSchedule(schedule.id, format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return React.createElement('div', { className: 'schedule-builder-page' }, [
    React.createElement(FTBuilderApp, {
      key: 'main-app',
      initialSchedule: schedule,
      onScheduleChange: setSchedule,
      onAIGeneration: handleAIGeneration,
      onOptimization: handleOptimization,
      onExport: handleExportSchedule,
      isLoading: isLoading
    })
  ]);
}

// Navigation Integration - Add to main FlexTime app
function addFTBuilderToNavigation() {
  // This would integrate with FlexTime's existing navigation system
  const navItems = document.querySelectorAll('.nav-link-modern');
  if (navItems.length > 0) {
    const ftBuilderLink = document.createElement('a');
    ftBuilderLink.href = '/schedule-builder';
    ftBuilderLink.className = 'nav-link-modern';
    ftBuilderLink.innerHTML = '▲ FT BUILDER';
    ftBuilderLink.onclick = (e) => {
      e.preventDefault();
      showFTBuilder();
    };
    
    // Insert after the first nav item
    navItems[0].parentNode.insertBefore(ftBuilderLink, navItems[1]);
  }
}

// Show FT Builder Page
function showFTBuilder() {
  // Replace main content with FT builder
  const appContainer = document.getElementById('app');
  if (appContainer) {
    // Clear existing content
    appContainer.innerHTML = '';
    
    // Load FT builder styles
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = 'schedule-builder-styles.css';
    document.head.appendChild(styleLink);
    
    // Render FT builder
    ReactDOM.render(
      React.createElement(FTBuilderPage),
      appContainer
    );
  }
}

// Initialize FT Builder Integration
function initializeFTBuilder() {
  // Add navigation integration
  addFTBuilderToNavigation();
  
  // Add keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      showFTBuilder();
    }
  });
  
  // Add to global window object for external access
  window.FlexTimeFTBuilder = {
    show: showFTBuilder,
    API: FTBuilderAPI,
    components: {
      FTBuilderApp,
      FTBuilderPage,
      AIFloatingActionButton,
      AIChatModal,
      ScheduleCollaborationPanel
    }
  };
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFTBuilder);
} else {
  initializeFTBuilder();
}

// Export all components
window.FTBuilderPage = FTBuilderPage;
window.AIFloatingActionButton = AIFloatingActionButton;
window.AIChatModal = AIChatModal;
window.ScheduleCollaborationPanel = ScheduleCollaborationPanel;
window.FTBuilderAPI = FTBuilderAPI;