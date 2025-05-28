/**
 * FlexTime Schedule Builder - UI Components
 * Advanced React components with glassmorphic design and AI integration
 */

// Header Component with AI Status and Collaboration
function ScheduleBuilderHeader({ 
  currentView, 
  setCurrentView, 
  selectedSport, 
  setSelectedSport, 
  agentStatus, 
  activeUsers,
  onGenerateSchedule,
  onOptimizeSchedule 
}) {
  return React.createElement('header', { className: 'schedule-builder-header' }, [
    
    // Left Section - Brand and Sport Selection
    React.createElement('div', { className: 'header-left', key: 'left' }, [
      React.createElement('div', { className: 'brand-section', key: 'brand' }, [
        React.createElement('img', { 
          className: 'flextime-logo', 
          src: 'assets/logos/flextime/flextime-white64x64.svg', 
          alt: 'FlexTime Logo',
          key: 'logo',
          onError: (e) => {
            console.log('FT Builder logo failed to load:', e.target.src);
            e.target.src = 'assets/logos/flextime/flextime-white.svg';
          }
        }),
        React.createElement('div', { className: 'brand-text', key: 'brand-text' }, [
          React.createElement('h1', { className: 'app-title', key: 'title' }, [
            React.createElement('span', { className: 'title-main', key: 'main' }, 'FLEXTIME'),
            React.createElement('span', { className: 'title-sub', key: 'sub' }, 'SCHEDULE BUILDER')
          ]),
          React.createElement('div', { className: 'big12-badge', key: 'badge' }, 'BIG 12 CONFERENCE')
        ])
      ]),
      
      React.createElement('div', { className: 'sport-selector-container', key: 'sport-selector' }, [
        React.createElement('label', { className: 'sport-label', key: 'label' }, 'SPORT'),
        React.createElement('select', {
          className: 'sport-selector glass-dropdown',
          value: selectedSport,
          onChange: (e) => setSelectedSport(e.target.value),
          key: 'select'
        }, [
          React.createElement('option', { value: 'football', key: 'football' }, 'Football'),
          React.createElement('option', { value: 'basketball', key: 'basketball' }, 'Men\'s Basketball'),
          React.createElement('option', { value: 'basketball-women', key: 'basketball-women' }, 'Women\'s Basketball'),
          React.createElement('option', { value: 'baseball', key: 'baseball' }, 'Baseball'),
          React.createElement('option', { value: 'softball', key: 'softball' }, 'Softball'),
          React.createElement('option', { value: 'soccer', key: 'soccer' }, 'Soccer'),
          React.createElement('option', { value: 'volleyball', key: 'volleyball' }, 'Volleyball')
        ])
      ])
    ]),

    // Center Section - AI Status Indicators
    React.createElement('div', { className: 'header-center', key: 'center' }, [
      React.createElement('div', { className: 'ai-status-grid', key: 'status-grid' }, [
        React.createElement(AIAgentIndicator, {
          key: 'scheduler',
          name: 'AI Scheduler',
          status: agentStatus.scheduler,
          icon: '⚙'
        }),
        React.createElement(AIAgentIndicator, {
          key: 'optimizer',
          name: 'Optimizer',
          status: agentStatus.optimizer,
          icon: '▲'
        }),
        React.createElement(AIAgentIndicator, {
          key: 'analyzer',
          name: 'COMPASS Analyzer',
          status: agentStatus.analyzer,
          icon: '↔'
        }),
        React.createElement(AIAgentIndicator, {
          key: 'predictor',
          name: 'ML Predictor',
          status: agentStatus.ml_predictor,
          icon: '⚙'
        })
      ])
    ]),

    // Right Section - Actions and Collaboration
    React.createElement('div', { className: 'header-right', key: 'right' }, [
      React.createElement('div', { className: 'collaboration-indicators', key: 'collaboration' }, [
        React.createElement('div', { className: 'active-users', key: 'users' }, [
          React.createElement('span', { className: 'users-label', key: 'label' }, `${activeUsers.length} Online`),
          React.createElement('div', { className: 'user-avatars', key: 'avatars' },
            activeUsers.slice(0, 3).map((user, index) =>
              React.createElement('div', {
                className: 'user-avatar',
                key: user.id,
                style: { backgroundColor: user.color },
                title: user.name
              }, user.initials)
            )
          )
        ])
      ]),
      
      React.createElement('div', { className: 'action-buttons', key: 'actions' }, [
        React.createElement('button', {
          className: 'btn-primary-ai',
          onClick: onGenerateSchedule,
          disabled: agentStatus.scheduler === 'generating',
          key: 'generate'
        }, [
          React.createElement('span', { className: 'btn-icon', key: 'icon' }, '◆'),
          React.createElement('span', { key: 'text' }, 'AI Generate')
        ]),
        React.createElement('button', {
          className: 'btn-secondary-ai',
          onClick: onOptimizeSchedule,
          disabled: agentStatus.optimizer === 'optimizing',
          key: 'optimize'
        }, [
          React.createElement('span', { className: 'btn-icon', key: 'icon' }, '●'),
          React.createElement('span', { key: 'text' }, 'Optimize')
        ])
      ])
    ])
  ]);
}

// AI Agent Status Indicator Component
function AIAgentIndicator({ name, status, icon }) {
  const statusConfig = {
    idle: { color: '#666666', pulse: false, text: 'Ready' },
    processing: { color: '#00bfff', pulse: true, text: 'Working' },
    generating: { color: '#00bfff', pulse: true, text: 'Generating' },
    optimizing: { color: '#ffa500', pulse: true, text: 'Optimizing' },
    analyzing: { color: '#9370db', pulse: true, text: 'Analyzing' },
    complete: { color: '#00ff7f', pulse: false, text: 'Complete' },
    error: { color: '#ff4444', pulse: false, text: 'Error' }
  };

  const config = statusConfig[status] || statusConfig.idle;

  return React.createElement('div', { className: `ai-agent-indicator ${config.pulse ? 'pulsing' : ''}` }, [
    React.createElement('div', { className: 'agent-icon', key: 'icon' }, icon),
    React.createElement('div', { className: 'agent-info', key: 'info' }, [
      React.createElement('div', { className: 'agent-name', key: 'name' }, name),
      React.createElement('div', { 
        className: 'agent-status',
        style: { color: config.color },
        key: 'status'
      }, config.text)
    ]),
    React.createElement('div', { 
      className: 'status-dot',
      style: { backgroundColor: config.color },
      key: 'dot'
    })
  ]);
}

// View Toggle Component with Optimization Metrics
function ScheduleViewToggle({ currentView, setCurrentView, optimizationMetrics }) {
  const views = [
    { id: 'timeline', name: 'Timeline', icon: '─', description: 'Drag-drop timeline view' },
    { id: 'calendar', name: 'Calendar', icon: '☷', description: 'Monthly calendar view' },
    { id: 'gantt', name: 'Gantt', icon: '═', description: 'Project timeline view' },
    { id: 'matrix', name: 'Matrix', icon: '█', description: 'Team matchup matrix' }
  ];

  return React.createElement('div', { className: 'schedule-view-toggle' }, [
    React.createElement('div', { className: 'view-buttons', key: 'buttons' },
      views.map(view =>
        React.createElement('button', {
          className: `view-btn ${currentView === view.id ? 'active' : ''}`,
          onClick: () => setCurrentView(view.id),
          key: view.id,
          title: view.description
        }, [
          React.createElement('span', { className: 'view-icon', key: 'icon' }, view.icon),
          React.createElement('span', { className: 'view-name', key: 'name' }, view.name)
        ])
      )
    ),
    
    React.createElement('div', { className: 'optimization-metrics-bar', key: 'metrics' }, [
      React.createElement('div', { className: 'metric-item', key: 'travel' }, [
        React.createElement('span', { className: 'metric-label', key: 'label' }, 'Travel'),
        React.createElement('span', { className: 'metric-value', key: 'value' }, `${optimizationMetrics.travelEfficiency || 0}%`)
      ]),
      React.createElement('div', { className: 'metric-item', key: 'balance' }, [
        React.createElement('span', { className: 'metric-label', key: 'label' }, 'Balance'),
        React.createElement('span', { className: 'metric-value', key: 'value' }, `${optimizationMetrics.homeAwayBalance || 0}%`)
      ]),
      React.createElement('div', { className: 'metric-item', key: 'conflicts' }, [
        React.createElement('span', { className: 'metric-label', key: 'label' }, 'Conflicts'),
        React.createElement('span', { className: 'metric-value error', key: 'value' }, optimizationMetrics.conflicts || 0)
      ])
    ])
  ]);
}

// Timeline Schedule View - Advanced Drag-Drop Interface
function TimelineScheduleView({ 
  schedule, 
  teams, 
  sportConfig, 
  onGameDrag, 
  onGameDrop, 
  conflicts, 
  aiSuggestions 
}) {
  const [dragOverDate, setDragOverDate] = React.useState(null);
  const [selectedWeek, setSelectedWeek] = React.useState(0);

  // Generate season timeline
  const seasonWeeks = generateSeasonTimeline(sportConfig);

  return React.createElement('div', { className: 'timeline-schedule-view' }, [
    
    // Timeline Navigation
    React.createElement('div', { className: 'timeline-navigation', key: 'navigation' }, [
      React.createElement('button', {
        className: 'nav-btn',
        onClick: () => setSelectedWeek(Math.max(0, selectedWeek - 1)),
        disabled: selectedWeek === 0,
        key: 'prev'
      }, '◀ Previous Week'),
      
      React.createElement('div', { className: 'week-selector', key: 'selector' }, [
        React.createElement('span', { className: 'week-label', key: 'label' }, 'Week'),
        React.createElement('select', {
          value: selectedWeek,
          onChange: (e) => setSelectedWeek(parseInt(e.target.value)),
          className: 'week-dropdown',
          key: 'dropdown'
        }, seasonWeeks.map((week, index) =>
          React.createElement('option', { value: index, key: index }, `${index + 1}: ${week.label}`)
        ))
      ]),
      
      React.createElement('button', {
        className: 'nav-btn',
        onClick: () => setSelectedWeek(Math.min(seasonWeeks.length - 1, selectedWeek + 1)),
        disabled: selectedWeek === seasonWeeks.length - 1,
        key: 'next'
      }, 'Next Week ▶')
    ]),

    // Timeline Grid
    React.createElement('div', { className: 'timeline-grid', key: 'grid' }, [
      
      // Team Rows
      teams.map(team =>
        React.createElement('div', { className: 'timeline-row', key: team.id }, [
          
          // Team Header
          React.createElement('div', { className: 'team-header', key: 'header' }, [
            React.createElement('div', { 
              className: 'team-color-bar',
              style: { backgroundColor: team.primaryColor },
              key: 'color'
            }),
            React.createElement('span', { className: 'team-abbr', key: 'abbr' }, team.abbr),
            React.createElement('span', { className: 'team-name', key: 'name' }, team.name)
          ]),

          // Timeline Slots
          React.createElement('div', { className: 'timeline-slots', key: 'slots' },
            seasonWeeks[selectedWeek].dates.map(date =>
              React.createElement(TimelineSlot, {
                key: date,
                date: date,
                team: team,
                game: findGameForTeamAndDate(schedule, team.id, date),
                conflicts: getConflictsForDate(conflicts, date),
                aiSuggestion: getAISuggestionForDate(aiSuggestions, team.id, date),
                onDrop: (game) => onGameDrop(game, { team: team.id, date }),
                onDragOver: () => setDragOverDate(date),
                isDropTarget: dragOverDate === date
              })
            )
          )
        ])
      )
    ]),

    // AI Suggestions Panel (floating)
    aiSuggestions.length > 0 && React.createElement('div', { className: 'ai-suggestions-floating', key: 'suggestions' }, [
      React.createElement('h4', { key: 'title' }, '◆ AI Suggestions'),
      React.createElement('div', { className: 'suggestions-list', key: 'list' },
        aiSuggestions.slice(0, 3).map((suggestion, index) =>
          React.createElement('div', { className: 'suggestion-item', key: index }, [
            React.createElement('span', { className: 'suggestion-text', key: 'text' }, suggestion.description),
            React.createElement('button', { 
              className: 'suggestion-apply-btn',
              onClick: () => applySuggestion(suggestion),
              key: 'apply'
            }, 'Apply')
          ])
        )
      )
    ])
  ]);
}

// Timeline Slot Component with Drag-Drop Support
function TimelineSlot({ 
  date, 
  team, 
  game, 
  conflicts, 
  aiSuggestion, 
  onDrop, 
  onDragOver, 
  isDropTarget 
}) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
    onDragOver();
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const gameData = JSON.parse(e.dataTransfer.getData('application/json'));
    onDrop(gameData);
  };

  const slotClasses = [
    'timeline-slot',
    game ? 'has-game' : 'empty',
    (conflicts?.length || 0) > 0 ? 'has-conflict' : '',
    aiSuggestion ? 'has-suggestion' : '',
    isDragOver ? 'drag-over' : '',
    isDropTarget ? 'drop-target' : ''
  ].filter(Boolean).join(' ');

  return React.createElement('div', {
    className: slotClasses,
    onDragOver: handleDragOver,
    onDragLeave: handleDragLeave,
    onDrop: handleDrop
  }, [
    
    // Game if exists
    game && React.createElement(GameCard, {
      key: 'game',
      game: game,
      conflicts: conflicts,
      draggable: true,
      onDragStart: (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify(game));
      }
    }),

    // AI Suggestion indicator
    aiSuggestion && React.createElement('div', { 
      className: 'ai-suggestion-indicator',
      title: aiSuggestion.reason,
      key: 'suggestion'
    }, '◆'),

    // Conflict indicator
    (conflicts?.length || 0) > 0 && React.createElement('div', {
      className: 'conflict-indicator',
      title: `${conflicts?.length || 0} conflicts`,
      key: 'conflict'
    }, '⚠️'),

    // Date label for empty slots
    !game && React.createElement('div', { className: 'date-label', key: 'date' }, 
      new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    )
  ]);
}

// Game Card Component with Rich Information
function GameCard({ game, conflicts, draggable, onDragStart }) {
  const hasConflicts = conflicts && (conflicts?.length || 0) > 0;
  
  return React.createElement('div', {
    className: `game-card ${hasConflicts ? 'has-conflicts' : ''}`,
    draggable: draggable,
    onDragStart: onDragStart
  }, [
    React.createElement('div', { className: 'game-teams', key: 'teams' }, [
      React.createElement('span', { className: 'team-abbr home', key: 'home' }, game.homeTeam),
      React.createElement('span', { className: 'vs', key: 'vs' }, 'vs'),
      React.createElement('span', { className: 'team-abbr away', key: 'away' }, game.awayTeam)
    ]),
    React.createElement('div', { className: 'game-details', key: 'details' }, [
      React.createElement('span', { className: 'game-time', key: 'time' }, game.time),
      game.venue && React.createElement('span', { className: 'game-venue', key: 'venue' }, game.venue),
      game.tv && React.createElement('span', { className: 'game-tv', key: 'tv' }, game.tv)
    ]),
    hasConflicts && React.createElement('div', { className: 'conflict-badge', key: 'conflicts' }, conflicts?.length || 0)
  ]);
}

// Helper Functions
function generateSeasonTimeline(sportConfig) {
  // Generate weekly timeline based on sport configuration
  const weeks = [];
  const startDate = new Date(`${sportConfig.season.start} 1, 2024`);
  const endDate = new Date(`${sportConfig.season.end} 31, 2024`);
  
  let current = new Date(startDate);
  let weekNumber = 1;
  
  while (current <= endDate) {
    const weekEnd = new Date(current);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weeks.push({
      label: `${current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      dates: Array.from({ length: 7 }, (_, i) => {
        const date = new Date(current);
        date.setDate(date.getDate() + i);
        return date.toISOString().split('T')[0];
      })
    });
    
    current.setDate(current.getDate() + 7);
    weekNumber++;
  }
  
  return weeks;
}

function findGameForTeamAndDate(schedule, teamId, date) {
  if (!schedule || !schedule.games) return null;
  return schedule.games.find(game => 
    (game.homeTeam === teamId || game.awayTeam === teamId) && 
    game.date === date
  );
}

function getConflictsForDate(conflicts, date) {
  return conflicts.filter(conflict => conflict.date === date) || [];
}

function getAISuggestionForDate(aiSuggestions, teamId, date) {
  return aiSuggestions.find(suggestion => 
    suggestion.teamId === teamId && 
    suggestion.date === date
  );
}

// Export components
window.ScheduleBuilderHeader = ScheduleBuilderHeader;
window.ScheduleViewToggle = ScheduleViewToggle;
window.TimelineScheduleView = TimelineScheduleView;
window.AIAgentIndicator = AIAgentIndicator;
window.GameCard = GameCard;