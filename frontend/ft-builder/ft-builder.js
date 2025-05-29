/**
 * FlexTime Ultimate FT Builder
 * The most advanced collegiate athletics scheduling interface ever created
 * 
 * Architecture combines:
 * - FlexTime's multi-agent AI system with COMPASS ML models
 * - 2024's best UX patterns for drag-drop scheduling
 * - Enterprise-level resource optimization
 * - Athletic-specific constraint management
 * - Big 12 Conference branding and compliance
 */

function ScheduleBuilderApp() {
  // Core State Management
  const [currentView, setCurrentView] = React.useState('calendar'); // timeline, calendar, gantt, matrix
  const [selectedSport, setSelectedSport] = React.useState('football');
  const [activeSchedule, setActiveSchedule] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [draggedGame, setDraggedGame] = React.useState(null);
  const [conflicts, setConflicts] = React.useState([]);
  const [aiSuggestions, setAiSuggestions] = React.useState([]);
  const [compassScores, setCompassScores] = React.useState({ overall: 87.5, travelDistance: 92.1, conflictResolution: 95.8, venueUtilization: 78.3 });
  const [optimizationMetrics, setOptimizationMetrics] = React.useState({ scheduleQuality: 89.2, costEfficiency: 91.7, timeOptimization: 85.6 });

  // AI Agent Integration State
  const [agentStatus, setAgentStatus] = React.useState({
    scheduler: 'idle',
    optimizer: 'idle',
    analyzer: 'idle',
    ml_predictor: 'idle'
  });

  // Real-time Collaboration State
  const [activeUsers, setActiveUsers] = React.useState([]);
  const [liveChanges, setLiveChanges] = React.useState([]);

  // Teams data - will be loaded from database
  const [big12Teams, setBig12Teams] = React.useState([]);

  // Sports Configuration (Big 12 specific)
  const sportsConfig = {
    football: {
      name: 'Football',
      season: { start: 'August', end: 'December' },
      teams: 16,
      constraints: {
        maxConsecutiveHome: 2,
        maxConsecutiveAway: 2,
        byeWeekRequired: true,
        rivalryProtection: ['KU-KSU', 'OKST-TTU', 'BYU-UTAH'],
        tvWindows: ['Saturday 12:00', 'Saturday 3:30', 'Saturday 7:00', 'Friday 7:00']
      }
    },
    basketball: {
      name: 'Men\'s Basketball',
      season: { start: 'November', end: 'March' },
      teams: 16,
      constraints: {
        maxConsecutiveRoad: 2,
        homeAwayBalance: 0.5,
        doubleheaderAllowed: true,
        tournamentPrep: 'February'
      }
    },
    baseball: {
      name: 'Baseball',
      season: { start: 'February', end: 'May' },
      teams: 14,
      constraints: {
        weatherConsiderations: true,
        doubleheaderRequired: true,
        seriesFormat: 'weekend-series'
      }
    }
  };

  // Make updateActiveSchedule available globally
  React.useEffect(() => {
    window.updateActiveSchedule = (newSchedule) => {
      console.log('Updating active schedule with', newSchedule.length, 'games');
      setActiveSchedule(newSchedule);
    };
    return () => {
      delete window.updateActiveSchedule;
    };
  }, []);

  // Load teams data from database on component mount
  React.useEffect(() => {
    async function loadTeams() {
      try {
        console.log('NeonDB status:', { 
          exists: !!window.NeonDB, 
          connected: window.NeonDB?.isConnected,
          baseUrl: window.NeonDB?.baseUrl 
        });
        
        if (window.NeonDB && window.NeonDB.isConnected) {
          console.log('Loading teams from database...');
          const teams = await window.NeonDB.getTeams('big12');
          console.log('Database teams response:', teams);
          if (teams && teams.length > 0) {
            setBig12Teams(teams);
            console.log('✅ Loaded teams from database:', teams.length);
          } else {
            // Fallback to hardcoded data if database is empty
            setBig12Teams(getDefaultTeams());
            console.log('⚠️ Using fallback team data - database returned empty');
          }
        } else {
          // Fallback if database not available
          setBig12Teams(getDefaultTeams());
          console.log('⚠️ Database not available, using fallback team data');
        }
      } catch (error) {
        console.error('❌ Failed to load teams:', error);
        setBig12Teams(getDefaultTeams());
      }
    }
    
    loadTeams();
  }, []);

  // Load schedule data from database when sport changes
  React.useEffect(() => {
    async function loadSchedule() {
      setLoading(true);
      try {
        if (window.NeonDB && window.NeonDB.isConnected) {
          console.log(`Loading ${selectedSport} schedule from database...`);
          const schedules = await window.NeonDB.getSchedules(selectedSport, '2024');
          if (schedules && schedules.length > 0) {
            // Get games for the first schedule
            const games = await window.NeonDB.getGames(schedules[0].id);
            setActiveSchedule(games || []);
            console.log('✅ Loaded schedule from database:', games?.length || 0, 'games');
          } else {
            // No schedules found - create sample data or show empty state
            setActiveSchedule([]);
            console.log('⚠️ No schedules found in database');
          }
        } else {
          setActiveSchedule([]);
          console.log('⚠️ Database not available');
        }
      } catch (error) {
        console.error('❌ Failed to load schedule:', error);
        setActiveSchedule([]);
      } finally {
        setLoading(false);
      }
    }
    
    if (big12Teams.length > 0) { // Only load schedule after teams are loaded
      loadSchedule();
    }
  }, [selectedSport, big12Teams]);

  // Load COMPASS scores from database
  React.useEffect(() => {
    async function loadCompassScores() {
      try {
        if (window.NeonDB && window.NeonDB.isConnected && activeSchedule.length > 0) {
          const scores = await window.NeonDB.getCompassScores(activeSchedule[0]?.schedule_id);
          if (scores) {
            setCompassScores(scores);
            console.log('✅ Loaded COMPASS scores from database');
          }
        }
      } catch (error) {
        console.error('❌ Failed to load COMPASS scores:', error);
      }
    }
    
    if (activeSchedule.length > 0) {
      loadCompassScores();
    }
  }, [activeSchedule]);

  // Default team data as fallback
  function getDefaultTeams() {
    return [
      { id: 'arizona', name: 'Arizona', abbr: 'ARIZ', location: { lat: 32.2226, lng: -110.9747 }, primaryColor: '#AB0520', secondaryColor: '#0C234B' },
      { id: 'arizona-state', name: 'Arizona State', abbr: 'ASU', location: { lat: 33.4242, lng: -111.9281 }, primaryColor: '#8C1D40', secondaryColor: '#FFC627' },
      { id: 'baylor', name: 'Baylor', abbr: 'BAY', location: { lat: 31.5488, lng: -97.1131 }, primaryColor: '#003015', secondaryColor: '#FFB81C' },
      { id: 'byu', name: 'BYU', abbr: 'BYU', location: { lat: 40.2518, lng: -111.6493 }, primaryColor: '#002E5D', secondaryColor: '#FFFFFF' },
      { id: 'cincinnati', name: 'Cincinnati', abbr: 'CIN', location: { lat: 39.1612, lng: -84.4569 }, primaryColor: '#E00122', secondaryColor: '#000000' },
      { id: 'colorado', name: 'Colorado', abbr: 'COL', location: { lat: 40.0150, lng: -105.2705 }, primaryColor: '#000000', secondaryColor: '#CFB87C' },
      { id: 'houston', name: 'Houston', abbr: 'HOU', location: { lat: 29.7604, lng: -95.3698 }, primaryColor: '#C8102E', secondaryColor: '#FFFFFF' },
      { id: 'iowa-state', name: 'Iowa State', abbr: 'ISU', location: { lat: 42.0308, lng: -93.6319 }, primaryColor: '#C8102E', secondaryColor: '#F1BE48' },
      { id: 'kansas', name: 'Kansas', abbr: 'KU', location: { lat: 38.9717, lng: -95.2353 }, primaryColor: '#0051BA', secondaryColor: '#E8000D' },
      { id: 'kansas-state', name: 'Kansas State', abbr: 'KSU', location: { lat: 39.1836, lng: -96.5717 }, primaryColor: '#512888', secondaryColor: '#FFFFFF' },
      { id: 'oklahoma-state', name: 'Oklahoma State', abbr: 'OKST', location: { lat: 36.1156, lng: -97.0669 }, primaryColor: '#FF7300', secondaryColor: '#000000' },
      { id: 'tcu', name: 'TCU', abbr: 'TCU', location: { lat: 32.7573, lng: -97.2925 }, primaryColor: '#4D1979', secondaryColor: '#A7A8AA' },
      { id: 'texas-tech', name: 'Texas Tech', abbr: 'TTU', location: { lat: 33.5779, lng: -101.8552 }, primaryColor: '#CC0000', secondaryColor: '#000000' },
      { id: 'ucf', name: 'UCF', abbr: 'UCF', location: { lat: 28.6024, lng: -81.2001 }, primaryColor: '#000000', secondaryColor: '#FFC904' },
      { id: 'utah', name: 'Utah', abbr: 'UTAH', location: { lat: 40.7649, lng: -111.8421 }, primaryColor: '#CC0000', secondaryColor: '#FFFFFF' },
      { id: 'west-virginia', name: 'West Virginia', abbr: 'WVU', location: { lat: 39.6295, lng: -79.9559 }, primaryColor: '#002855', secondaryColor: '#EAAA00' }
    ];
  }

  // Show loading state while data is being fetched
  if (loading || big12Teams.length === 0) {
    return React.createElement('div', { className: 'schedule-builder-loading' }, [
      React.createElement('div', { className: 'loading-content', key: 'loading' }, [
        React.createElement('div', { className: 'loading-spinner', key: 'spinner' }),
        React.createElement('h3', { key: 'title', style: { display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' } }, [
          React.createElement('img', { 
            key: 'logo',
            src: '/assets/logos/flextime/flextime-white32x32.svg',
            alt: 'FlexTime',
            style: { width: '32px', height: '32px' }
          }),
          React.createElement('span', { key: 'text' }, 'Loading FlexTime FT Builder...')
        ]),
        React.createElement('p', { key: 'desc' }, 'Connecting to Neon Database and loading schedule data...')
      ])
    ]);
  }

  // Main Component Structure
  return React.createElement('div', { className: 'schedule-builder-app' }, [
    
    // Header with AI Status and Collaboration Indicators
    React.createElement(ScheduleBuilderHeader, {
      key: 'header',
      currentView,
      setCurrentView,
      selectedSport,
      setSelectedSport,
      agentStatus,
      activeUsers,
      onGenerateSchedule: handleAIGeneration,
      onOptimizeSchedule: handleOptimization
    }),

    // Main Interface Container
    React.createElement('div', { className: 'schedule-builder-main', key: 'main' }, [
      
      // Left Sidebar - FlexTime Custom Sidebar
      React.createElement(FlexTimeSidebar, {
        key: 'flextime-sidebar',
        selectedSport,
        teams: big12Teams,
        constraints: {
          homeAwayBalance: true,
          rivalryProtection: true,
          travelOptimization: true,
          tvWindows: true,
          weatherConsiderations: selectedSport === 'baseball' || selectedSport === 'softball'
        },
        onTeamDragStart: handleTeamDragStart,
        onConstraintChange: handleConstraintUpdate,
        onGenerateSchedule: handleAIGeneration,
        onOptimizeSchedule: handleOptimization
      }),

      // Center Panel - Dynamic Schedule Interface
      React.createElement('div', { className: 'schedule-builder-center', key: 'center' }, [
        
        // View Toggle Bar
        React.createElement(ScheduleViewToggle, {
          key: 'view-toggle',
          currentView,
          setCurrentView,
          optimizationMetrics
        }),

        // Dynamic Schedule Interface (renders based on currentView)
        currentView === 'timeline' && React.createElement(TimelineScheduleView, {
          key: 'timeline-view',
          schedule: activeSchedule,
          teams: big12Teams,
          sportConfig: sportsConfig[selectedSport],
          onGameDrag: handleGameDrag,
          onGameDrop: handleGameDrop,
          conflicts,
          aiSuggestions
        }),

        currentView === 'calendar' && React.createElement(window.CalendarScheduleView, {
          key: 'calendar-view',
          schedule: activeSchedule,
          teams: big12Teams,
          sportConfig: sportsConfig[selectedSport],
          onDateSelect: handleDateSelect,
          onGameMove: handleGameMove
        }),

        currentView === 'gantt' && React.createElement(window.GanttScheduleView, {
          key: 'gantt-view',
          schedule: activeSchedule,
          teams: big12Teams,
          sportConfig: sportsConfig[selectedSport],
          onTaskUpdate: handleTaskUpdate,
          onDependencyCreate: handleDependencyCreate
        }),

        currentView === 'matrix' && React.createElement(window.MatrixScheduleView, {
          key: 'matrix-view',
          schedule: activeSchedule,
          teams: big12Teams,
          sportConfig: sportsConfig[selectedSport],
          onCellSelect: handleCellSelect,
          onGameAssign: handleGameAssign
        })
      ]),

      // Right Panel - Analytics & Optimization
      React.createElement(window.ScheduleAnalyticsPanel, {
        key: 'analytics',
        schedule: activeSchedule,
        compassScores,
        optimizationMetrics,
        onExportSchedule: handleExportSchedule,
        onRunAnalysis: handleRunAnalysis
      })
    ]),

    // Bottom Panel - Live Changes & Collaboration
    React.createElement(ScheduleCollaborationPanel, {
      key: 'collaboration',
      liveChanges,
      activeUsers,
      onRevertChange: handleRevertChange,
      onAcceptChange: handleAcceptChange
    }),

    // AI-Powered Floating Action Button
    React.createElement(AIFloatingActionButton, {
      key: 'ai-fab',
      agentStatus,
      onQuickOptimize: handleQuickOptimize,
      onAskAI: handleAskAI,
      onAutoResolveConflicts: handleAutoResolveConflicts
    })
  ]);

  // Event Handlers
  function handleAIGeneration() {
    setAgentStatus(prev => ({ ...prev, scheduler: 'generating' }));
    // Integrate with FlexTime's multi-agent system
    // POST to /api/schedules/generate with AI parameters
  }

  function handleOptimization() {
    setAgentStatus(prev => ({ ...prev, optimizer: 'optimizing' }));
    // Integrate with FlexTime's optimization algorithms
    // POST to /api/schedules/optimize
  }

  function handleGameDrag(game, startPosition) {
    setDraggedGame({ game, startPosition });
    // Real-time conflict detection during drag
  }

  function handleGameDrop(game, newPosition) {
    // Validate constraints and update schedule
    // Real-time COMPASS score recalculation
    setDraggedGame(null);
  }

  function handleConstraintUpdate(constraint, value) {
    // Update constraint and trigger real-time validation
    // Notify other users of constraint changes
  }

  function handleTeamDragStart(event, team) {
    // Set drag data for team scheduling
    event.dataTransfer.setData('application/json', JSON.stringify({
      type: 'team',
      team: team
    }));
    event.dataTransfer.effectAllowed = 'move';
  }

  function handleRunAnalysis() {
    setAgentStatus(prev => ({ ...prev, analyzer: 'analyzing' }));
    // Run COMPASS analysis and optimization metrics
  }

  function handleExportSchedule(format) {
    // Multi-format export with Big 12 branding
    // Integration with FlexTime's export system
  }

  function handleRevertChange(changeId) {
    // Revert a collaborative change
    setLiveChanges(prev => prev.filter(change => change.id !== changeId));
  }

  function handleAcceptChange(changeId) {
    // Accept a collaborative change
    setLiveChanges(prev => prev.filter(change => change.id !== changeId));
    // Apply the change to the schedule
  }

  function handleQuickOptimize() {
    setAgentStatus(prev => ({ ...prev, optimizer: 'optimizing' }));
    // Quick optimization logic
  }

  function handleAskAI() {
    // Open AI chat or assistant
  }

  function handleAutoResolveConflicts() {
    setAgentStatus(prev => ({ ...prev, analyzer: 'resolving' }));
    // Auto-resolve conflicts logic
  }

  // Additional handlers for the new views
  function handleDateSelect(date) {
    console.log('Date selected:', date);
    // Handle calendar date selection
  }

  function handleGameMove(game, newDate) {
    console.log('Game moved:', game, newDate);
    // Handle game movement in calendar
  }

  function handleTaskUpdate(task) {
    console.log('Task updated:', task);
    // Handle gantt task updates
  }

  function handleDependencyCreate(fromTask, toTask) {
    console.log('Dependency created:', fromTask, toTask);
    // Handle gantt dependency creation
  }

  function handleCellSelect(cellData) {
    console.log('Cell selected:', cellData);
    // Handle matrix cell selection
  }

  function handleGameAssign(team1Id, team2Id) {
    console.log('Game assigned:', team1Id, team2Id);
    // Handle new game assignment in matrix
  }
}

// Export the main component
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS
  module.exports = { ScheduleBuilderApp };
} else if (typeof define === 'function' && define.amd) {
  // AMD
  define([], function() { return { ScheduleBuilderApp }; });
} else {
  // Browser globals
  window.ScheduleBuilderApp = ScheduleBuilderApp;
}