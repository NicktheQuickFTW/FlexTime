/**
 * FlexTime FT Builder - Additional View Components
 * Placeholder components for calendar, gantt, matrix views and analytics panel
 */

// Calendar Schedule View
function CalendarScheduleView({ 
  schedule, 
  teams, 
  sportConfig, 
  onDateSelect, 
  onGameMove 
}) {
  console.log('CalendarScheduleView rendering with:', { schedule, teams, sportConfig });
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [viewMode, setViewMode] = React.useState('month'); // month, week, day

  // Generate calendar data
  const generateCalendarData = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const calendar = [];
    const weeks = [];
    
    // Previous month padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendar.push(null);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const gamesOnDate = schedule?.filter(game => {
        const gameDate = new Date(game.date);
        return gameDate.toDateString() === date.toDateString();
      }) || [];
      
      calendar.push({
        date,
        day,
        games: gamesOnDate,
        isToday: date.toDateString() === new Date().toDateString(),
        isSelected: selectedDate && date.toDateString() === selectedDate.toDateString()
      });
    }
    
    // Group into weeks
    for (let i = 0; i < calendar.length; i += 7) {
      weeks.push(calendar.slice(i, i + 7));
    }
    
    return weeks;
  };

  const calendarWeeks = generateCalendarData();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return React.createElement('div', { className: 'calendar-schedule-view' }, [
    // Calendar Header
    React.createElement('div', { className: 'calendar-header', key: 'header' }, [
      React.createElement('div', { className: 'calendar-nav', key: 'nav' }, [
        React.createElement('button', {
          className: 'calendar-nav-btn',
          onClick: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)),
          key: 'prev'
        }, '‹'),
        React.createElement('h3', { className: 'calendar-month-title', key: 'title' }, 
          `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
        ),
        React.createElement('button', {
          className: 'calendar-nav-btn',
          onClick: () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)),
          key: 'next'
        }, '›')
      ]),
      React.createElement('div', { className: 'calendar-view-toggle', key: 'toggle' }, [
        React.createElement('button', {
          className: `view-toggle-btn ${viewMode === 'month' ? 'active' : ''}`,
          onClick: () => setViewMode('month'),
          key: 'month'
        }, 'Month'),
        React.createElement('button', {
          className: `view-toggle-btn ${viewMode === 'week' ? 'active' : ''}`,
          onClick: () => setViewMode('week'),
          key: 'week'
        }, 'Week'),
        React.createElement('button', {
          className: `view-toggle-btn ${viewMode === 'day' ? 'active' : ''}`,
          onClick: () => setViewMode('day'),
          key: 'day'
        }, 'Day')
      ])
    ]),

    // Calendar Grid
    React.createElement('div', { className: 'calendar-grid', key: 'grid' }, [
      // Day headers
      React.createElement('div', { className: 'calendar-day-headers', key: 'day-headers' },
        dayNames.map(day => 
          React.createElement('div', { className: 'calendar-day-header', key: day }, day)
        )
      ),

      // Calendar weeks
      ...calendarWeeks.map((week, weekIndex) =>
        React.createElement('div', { className: 'calendar-week', key: weekIndex },
          week.map((dayData, dayIndex) => 
            React.createElement('div', { 
              className: `calendar-day ${dayData ? 'active' : 'inactive'} ${dayData?.isToday ? 'today' : ''} ${dayData?.isSelected ? 'selected' : ''}`,
              key: dayIndex,
              onClick: () => {
                if (dayData) {
                  setSelectedDate(dayData.date);
                  onDateSelect && onDateSelect(dayData.date);
                }
              }
            }, dayData ? [
              React.createElement('div', { className: 'calendar-day-number', key: 'number' }, dayData.day),
              React.createElement('div', { className: 'calendar-day-games', key: 'games' },
                dayData.games.slice(0, 3).map((game, gameIndex) =>
                  React.createElement('div', { 
                    className: 'calendar-game-indicator',
                    key: gameIndex,
                    title: `${game.homeTeam} vs ${game.awayTeam}`,
                    style: { backgroundColor: teams.find(t => t.id === game.homeTeam)?.primaryColor || '#0066ff' }
                  }, game.time || '')
                ).concat(
                  dayData.games.length > 3 ? [
                    React.createElement('div', { className: 'calendar-game-overflow', key: 'overflow' }, `+${dayData.games.length - 3}`)
                  ] : []
                )
              )
            ] : null)
          )
        )
      )
    ]),

    // Selected Date Details
    selectedDate && React.createElement('div', { className: 'calendar-date-details', key: 'details' }, [
      React.createElement('h4', { key: 'date-title' }, 
        `Games on ${selectedDate.toLocaleDateString()}`
      ),
      React.createElement('div', { className: 'calendar-date-games', key: 'date-games' },
        (schedule?.filter(game => {
          const gameDate = new Date(game.date);
          return gameDate.toDateString() === selectedDate.toDateString();
        }) || []).map((game, index) =>
          React.createElement('div', { className: 'calendar-game-detail', key: index }, [
            React.createElement('div', { className: 'game-teams', key: 'teams' }, 
              `${teams.find(t => t.id === game.awayTeam)?.name || game.awayTeam} @ ${teams.find(t => t.id === game.homeTeam)?.name || game.homeTeam}`
            ),
            React.createElement('div', { className: 'game-time', key: 'time' }, game.time || 'TBD'),
            React.createElement('div', { className: 'game-venue', key: 'venue' }, game.venue || 'TBD')
          ])
        )
      )
    ])
  ]);
}

// Gantt Schedule View
function GanttScheduleView({ 
  schedule, 
  teams, 
  sportConfig, 
  onTaskUpdate, 
  onDependencyCreate 
}) {
  console.log('GanttScheduleView rendering with:', { schedule, teams, sportConfig });
  const [timeRange, setTimeRange] = React.useState(30); // days
  const [selectedTeam, setSelectedTeam] = React.useState(null);
  const [zoomLevel, setZoomLevel] = React.useState('week'); // day, week, month

  // Get team logo SVG from assets
  const getTeamLogoSVG = (teamName, teamAbbr, primaryColor) => {
    const logoFileMap = {
      'Arizona': 'arizona.svg',
      'Arizona State': 'arizona_state.svg',
      'Baylor': 'baylor.svg',
      'BYU': 'byu.svg',
      'Cincinnati': 'cincinnati.svg',
      'Colorado': 'colorado.svg',
      'Houston': 'houston.svg',
      'Iowa State': 'iowa_state.svg',
      'Kansas': 'kansas.svg',
      'Kansas State': 'kansas_state.svg',
      'Oklahoma State': 'oklahoma_state.svg',
      'TCU': 'tcu.svg',
      'Texas Tech': 'texas_tech.svg',
      'UCF': 'ucf.svg',
      'Utah': 'utah.svg',
      'West Virginia': 'west_virginia.svg'
    };
    
    const logoFile = logoFileMap[teamName];
    // Detect current theme and use appropriate logo set
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    const themeFolder = isDarkTheme ? 'dark' : 'light';
    const logoPath = logoFile ? `/assets/logos/teams/${themeFolder}/${logoFile}` : null;
    
    if (logoPath) {
      return React.createElement('img', {
        src: logoPath,
        alt: `${teamName} logo`,
        className: 'team-logo-image',
        onError: (e) => {
          // Fallback to initials if image fails to load
          e.target.style.display = 'none';
          const fallback = e.target.parentNode.querySelector('.team-logo-fallback');
          if (fallback) fallback.style.display = 'flex';
        }
      });
    }
    
    // Fallback element
    return React.createElement('div', {
      className: 'team-logo-fallback',
      style: {
        width: '28px',
        height: '28px',
        backgroundColor: primaryColor || '#666',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        color: 'white',
        fontWeight: 'bold',
        marginRight: '10px',
        border: `2px solid ${primaryColor || '#666'}`,
        flexShrink: 0
      }
    }, teamAbbr?.charAt(0) || teamName?.charAt(0) || '?');
  };

  // Generate timeline data
  const generateTimelineData = () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + timeRange);
    
    const timeUnits = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      timeUnits.push(new Date(currentDate));
      if (zoomLevel === 'day') {
        currentDate.setDate(currentDate.getDate() + 1);
      } else if (zoomLevel === 'week') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
    }
    
    return timeUnits;
  };

  // Generate team timeline tasks
  const generateTeamTasks = () => {
    return teams.map(team => {
      const teamGames = schedule?.filter(game => 
        game.homeTeam === team.id || game.awayTeam === team.id
      ) || [];
      
      const tasks = teamGames.map(game => ({
        id: `${game.id || Math.random()}`,
        name: `vs ${game.homeTeam === team.id ? 
          teams.find(t => t.id === game.awayTeam)?.abbr : 
          teams.find(t => t.id === game.homeTeam)?.abbr}`,
        start: new Date(game.date),
        duration: 1,
        isHome: game.homeTeam === team.id,
        opponent: game.homeTeam === team.id ? game.awayTeam : game.homeTeam,
        venue: game.venue,
        time: game.time
      }));
      
      return {
        teamId: team.id,
        teamName: team.name,
        teamAbbr: team.abbr,
        teamColor: team.primaryColor,
        tasks
      };
    });
  };

  const timeUnits = generateTimelineData();
  const teamTasks = generateTeamTasks();

  return React.createElement('div', { className: 'gantt-schedule-view' }, [
    // Gantt Header
    React.createElement('div', { className: 'gantt-header', key: 'header' }, [
      React.createElement('div', { className: 'gantt-controls', key: 'controls' }, [
        React.createElement('div', { className: 'gantt-zoom-controls', key: 'zoom' }, [
          React.createElement('label', { key: 'label' }, 'Zoom:'),
          React.createElement('select', {
            value: zoomLevel,
            onChange: (e) => setZoomLevel(e.target.value),
            className: 'gantt-select',
            key: 'select'
          }, [
            React.createElement('option', { value: 'day', key: 'day' }, 'Daily'),
            React.createElement('option', { value: 'week', key: 'week' }, 'Weekly'),
            React.createElement('option', { value: 'month', key: 'month' }, 'Monthly')
          ])
        ]),
        React.createElement('div', { className: 'gantt-range-controls', key: 'range' }, [
          React.createElement('label', { key: 'label' }, 'Range:'),
          React.createElement('select', {
            value: timeRange,
            onChange: (e) => setTimeRange(parseInt(e.target.value)),
            className: 'gantt-select',
            key: 'select'
          }, [
            React.createElement('option', { value: 30, key: '30' }, '30 Days'),
            React.createElement('option', { value: 60, key: '60' }, '60 Days'),
            React.createElement('option', { value: 90, key: '90' }, '90 Days'),
            React.createElement('option', { value: 120, key: '120' }, 'Full Season')
          ])
        ])
      ])
    ]),

    // Gantt Chart Container
    React.createElement('div', { className: 'gantt-container', key: 'container' }, [
      // Timeline Header
      React.createElement('div', { className: 'gantt-timeline-header', key: 'timeline-header' }, [
        React.createElement('div', { className: 'gantt-team-header', key: 'team-col' }, 'Teams'),
        React.createElement('div', { className: 'gantt-timeline-units', key: 'timeline-units' },
          timeUnits.map((date, index) =>
            React.createElement('div', { 
              className: 'gantt-time-unit',
              key: index
            }, zoomLevel === 'day' ? 
              date.getDate() : 
              zoomLevel === 'week' ? 
                `Week ${index + 1}` :
                date.toLocaleDateString('en-US', { month: 'short' })
            )
          )
        )
      ]),

      // Gantt Rows
      React.createElement('div', { className: 'gantt-rows', key: 'rows' },
        teamTasks.map(teamData =>
          React.createElement('div', { 
            className: `gantt-row ${selectedTeam === teamData.teamId ? 'selected' : ''}`,
            key: teamData.teamId,
            onClick: () => setSelectedTeam(teamData.teamId === selectedTeam ? null : teamData.teamId)
          }, [
            // Team Name Column with Logo
            React.createElement('div', { className: 'gantt-team-cell', key: 'team' }, [
              React.createElement('div', { className: 'team-logo-container', key: 'logo-container' }, [
                getTeamLogoSVG(teamData.teamName, teamData.teamAbbr, teamData.teamColor)
              ]),
              React.createElement('div', { className: 'team-name-container', key: 'name-container' }, [
                React.createElement('span', { className: 'team-full-name', key: 'name' }, teamData.teamName),
                React.createElement('span', { className: 'team-abbr-small', key: 'abbr' }, teamData.teamAbbr)
              ])
            ]),

            // Timeline Column
            React.createElement('div', { className: 'gantt-timeline-cell', key: 'timeline' }, [
              // Background grid
              React.createElement('div', { className: 'gantt-timeline-grid', key: 'grid' },
                timeUnits.map((date, index) =>
                  React.createElement('div', { 
                    className: 'gantt-grid-cell',
                    key: index
                  })
                )
              ),

              // Task bars
              React.createElement('div', { className: 'gantt-task-layer', key: 'tasks' },
                teamData.tasks.map((task, taskIndex) => {
                  const taskStart = new Date(task.start);
                  const startOffset = timeUnits.findIndex(unit => {
                    if (zoomLevel === 'day') return unit.toDateString() === taskStart.toDateString();
                    if (zoomLevel === 'week') return Math.abs(unit - taskStart) < 7 * 24 * 60 * 60 * 1000;
                    return unit.getMonth() === taskStart.getMonth();
                  });
                  
                  if (startOffset === -1) return null;
                  
                  return React.createElement('div', {
                    className: `gantt-task ${task.isHome ? 'home-game' : 'away-game'}`,
                    key: taskIndex,
                    style: {
                      left: `${(startOffset / timeUnits.length) * 100}%`,
                      width: `${(task.duration / timeUnits.length) * 100}%`,
                      backgroundColor: task.isHome ? teamData.teamColor : 'transparent',
                      border: task.isHome ? 'none' : `2px solid ${teamData.teamColor}`
                    },
                    title: `${task.name} - ${task.start.toLocaleDateString()} ${task.time || ''}`
                  }, [
                    React.createElement('span', { className: 'task-label', key: 'label' }, task.name)
                  ]);
                })
              )
            ])
          ])
        )
      )
    ]),

    // Selected Team Details
    selectedTeam && React.createElement('div', { className: 'gantt-team-details', key: 'details' }, [
      React.createElement('h4', { key: 'title' }, 
        `${teamTasks.find(t => t.teamId === selectedTeam)?.teamName} Schedule`
      ),
      React.createElement('div', { className: 'gantt-team-games', key: 'games' },
        teamTasks.find(t => t.teamId === selectedTeam)?.tasks.map((task, index) =>
          React.createElement('div', { className: 'gantt-game-detail', key: index }, [
            React.createElement('div', { className: 'game-indicator', key: 'indicator' }, 
              task.isHome ? 'HOME' : 'AWAY'
            ),
            React.createElement('div', { className: 'game-details', key: 'details' }, [
              React.createElement('div', { className: 'game-opponent', key: 'opponent' }, task.name),
              React.createElement('div', { className: 'game-datetime', key: 'datetime' }, 
                `${task.start.toLocaleDateString()} ${task.time || 'TBD'}`
              ),
              React.createElement('div', { className: 'game-venue', key: 'venue' }, task.venue || 'TBD')
            ])
          ])
        ) || []
      )
    ])
  ]);
}

// Matrix Schedule View
function MatrixScheduleView({ 
  schedule, 
  teams, 
  sportConfig, 
  onCellSelect, 
  onGameAssign 
}) {
  const [selectedCell, setSelectedCell] = React.useState(null);
  const [showConflicts, setShowConflicts] = React.useState(false);
  const [filterSport, setFilterSport] = React.useState('all');
  const [viewMode, setViewMode] = React.useState('games'); // games, conflicts, venues

  // Create matrix data structure
  const matrixData = React.useMemo(() => {
    const matrix = {};
    teams.forEach(team1 => {
      matrix[team1.id] = {};
      teams.forEach(team2 => {
        if (team1.id !== team2.id) {
          const games = schedule?.filter(game => {
            const isMatch = (game.homeTeam === team1.id && game.awayTeam === team2.id) ||
                           (game.homeTeam === team2.id && game.awayTeam === team1.id);
            const sportMatch = filterSport === 'all' || game.sport === filterSport;
            return isMatch && sportMatch;
          }) || [];
          matrix[team1.id][team2.id] = games;
        }
      });
    });
    return matrix;
  }, [schedule, teams, filterSport]);

  // Get unique sports
  const sports = React.useMemo(() => {
    const sportSet = new Set(schedule?.map(game => game.sport) || []);
    return ['all', ...Array.from(sportSet)];
  }, [schedule]);

  // Check for scheduling conflicts
  const getConflictLevel = (games) => {
    if (games.length === 0) return 'none';
    if (games.length === 1) return 'single';
    
    // Check for date conflicts
    const dates = games.map(g => new Date(g.date).toDateString());
    const uniqueDates = new Set(dates);
    if (dates.length > uniqueDates.size) return 'conflict';
    
    return 'multiple';
  };

  const getCellClass = (games) => {
    const conflictLevel = getConflictLevel(games);
    let className = 'matrix-cell';
    
    if (conflictLevel === 'conflict' && showConflicts) {
      className += ' conflict';
    } else if (conflictLevel === 'multiple') {
      className += ' multiple-games';
    } else if (conflictLevel === 'single') {
      className += ' single-game';
    } else {
      className += ' no-games';
    }
    
    return className;
  };

  const getCellContent = (games, team1, team2) => {
    if (viewMode === 'conflicts') {
      const conflictLevel = getConflictLevel(games);
      return conflictLevel === 'conflict' ? '⚠' : games.length || '';
    }
    if (viewMode === 'venues') {
      const venues = [...new Set(games.map(g => g.venue).filter(Boolean))];
      return venues.length > 0 ? venues.length : '';
    }
    return games.length || '';
  };

  const handleCellClick = (team1Id, team2Id) => {
    const games = matrixData[team1Id][team2Id];
    setSelectedCell({ team1Id, team2Id, games });
    onCellSelect && onCellSelect({ team1Id, team2Id, games });
  };

  return React.createElement('div', { className: 'matrix-schedule-view' }, [
    // Matrix Controls
    React.createElement('div', { className: 'matrix-controls', key: 'controls' }, [
      React.createElement('div', { className: 'matrix-filters', key: 'filters' }, [
        React.createElement('select', {
          value: filterSport,
          onChange: (e) => setFilterSport(e.target.value),
          className: 'sport-filter',
          key: 'sport-filter'
        }, sports.map(sport => 
          React.createElement('option', { key: sport, value: sport },
            sport === 'all' ? 'All Sports' : sport.charAt(0).toUpperCase() + sport.slice(1)
          )
        )),
        React.createElement('select', {
          value: viewMode,
          onChange: (e) => setViewMode(e.target.value),
          className: 'view-mode-filter',
          key: 'view-mode'
        }, [
          React.createElement('option', { value: 'games', key: 'games' }, 'Games Count'),
          React.createElement('option', { value: 'conflicts', key: 'conflicts' }, 'Conflicts'),
          React.createElement('option', { value: 'venues', key: 'venues' }, 'Venues')
        ]),
        React.createElement('label', { className: 'matrix-control', key: 'conflicts-toggle' }, [
          React.createElement('input', {
            type: 'checkbox',
            checked: showConflicts,
            onChange: (e) => setShowConflicts(e.target.checked),
            key: 'checkbox'
          }),
          'Highlight conflicts'
        ])
      ])
    ]),
    
    // Matrix Container
    React.createElement('div', { className: 'matrix-container', key: 'container' }, [
      React.createElement('div', { className: 'matrix-grid', key: 'grid' }, [
        // Header row
        React.createElement('div', { className: 'matrix-header-corner', key: 'corner' }, ''),
        ...teams.map(team => 
          React.createElement('div', { 
            key: `header-${team.id}`, 
            className: 'matrix-header',
            title: team.name
          }, team.abbr || team.name.substring(0, 3).toUpperCase())
        ),
        
        // Data rows
        ...teams.map(team1 => [
          React.createElement('div', { 
            key: `row-${team1.id}`, 
            className: 'matrix-row-header',
            title: team1.name
          }, team1.abbr || team1.name.substring(0, 3).toUpperCase()),
          
          ...teams.map(team2 => {
            if (team1.id === team2.id) {
              return React.createElement('div', { 
                key: `${team1.id}-${team2.id}`, 
                className: 'matrix-cell diagonal' 
              }, '—');
            }
            
            const games = matrixData[team1.id][team2.id];
            return React.createElement('div', {
              key: `${team1.id}-${team2.id}`,
              className: getCellClass(games),
              onClick: () => handleCellClick(team1.id, team2.id),
              title: `${team1.name} vs ${team2.name}: ${games.length} games`
            }, getCellContent(games, team1, team2));
          })
        ]).flat()
      ])
    ]),

    // Legend
    React.createElement('div', { className: 'matrix-legend', key: 'legend' }, [
      React.createElement('h4', { key: 'title' }, 'Legend'),
      React.createElement('div', { className: 'legend-items', key: 'items' }, [
        React.createElement('div', { className: 'legend-item', key: 'no-games' }, [
          React.createElement('div', { className: 'legend-color no-games', key: 'color' }),
          'No games scheduled'
        ]),
        React.createElement('div', { className: 'legend-item', key: 'single-game' }, [
          React.createElement('div', { className: 'legend-color single-game', key: 'color' }),
          'Single game'
        ]),
        React.createElement('div', { className: 'legend-item', key: 'multiple-games' }, [
          React.createElement('div', { className: 'legend-color multiple-games', key: 'color' }),
          'Multiple games'
        ]),
        showConflicts && React.createElement('div', { className: 'legend-item', key: 'conflict' }, [
          React.createElement('div', { className: 'legend-color conflict', key: 'color' }),
          'Scheduling conflict'
        ])
      ].filter(Boolean))
    ]),

    // Cell details panel
    selectedCell && React.createElement('div', { className: 'matrix-details-panel', key: 'details' }, [
      React.createElement('div', { className: 'panel-header', key: 'header' }, [
        React.createElement('h3', { key: 'title' }, 
          `${teams.find(t => t.id === selectedCell.team1Id)?.name} vs ${teams.find(t => t.id === selectedCell.team2Id)?.name}`
        ),
        React.createElement('button', {
          className: 'close-button',
          onClick: () => setSelectedCell(null),
          key: 'close'
        }, '×')
      ]),
      React.createElement('div', { className: 'panel-content', key: 'content' }, [
        selectedCell.games.length === 0 
          ? React.createElement('p', { key: 'no-games' }, 'No games scheduled between these teams.')
          : selectedCell.games.map((game, index) => 
              React.createElement('div', { key: index, className: 'game-detail' }, [
                React.createElement('div', { className: 'game-info', key: 'info' }, [
                  React.createElement('span', { className: 'game-sport', key: 'sport' }, game.sport),
                  React.createElement('span', { className: 'game-date', key: 'date' }, 
                    new Date(game.date).toLocaleDateString()
                  ),
                  React.createElement('span', { className: 'game-time', key: 'time' }, game.time),
                  game.venue && React.createElement('span', { className: 'game-venue', key: 'venue' }, game.venue)
                ])
              ])
            ),
        selectedCell.games.length > 0 && React.createElement('button', {
          className: 'add-game-button',
          onClick: () => onGameAssign && onGameAssign(selectedCell.team1Id, selectedCell.team2Id),
          key: 'add-game'
        }, 'Add New Game')
      ])
    ])
  ]);
}

// Schedule Analytics Panel
function ScheduleAnalyticsPanel({ 
  schedule, 
  compassScores, 
  optimizationMetrics, 
  onExportSchedule, 
  onRunAnalysis 
}) {
  const [activeTab, setActiveTab] = React.useState('overview');
  const [analysisRunning, setAnalysisRunning] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState('pdf');
  const [travelOptimizing, setTravelOptimizing] = React.useState(false);
  const [travelMetrics, setTravelMetrics] = React.useState(null);

  // Calculate analytics from schedule data
  const analytics = React.useMemo(() => {
    if (!schedule || schedule.length === 0) {
      return {
        totalGames: 0,
        conflicts: 0,
        venueUtilization: 0,
        averageGamesPerTeam: 0,
        sportDistribution: {},
        weeklyDistribution: {},
        compassScore: 0
      };
    }

    const totalGames = schedule.length;
    
    // Calculate conflicts (same date/time conflicts)
    const conflicts = schedule.reduce((count, game, index) => {
      const sameDateTime = schedule.slice(index + 1).filter(otherGame => 
        game.date === otherGame.date && game.time === otherGame.time &&
        (game.venue === otherGame.venue || 
         game.homeTeam === otherGame.homeTeam || game.awayTeam === otherGame.awayTeam ||
         game.homeTeam === otherGame.awayTeam || game.awayTeam === otherGame.homeTeam)
      );
      return count + sameDateTime.length;
    }, 0);

    // Sport distribution
    const sportDistribution = schedule.reduce((acc, game) => {
      acc[game.sport] = (acc[game.sport] || 0) + 1;
      return acc;
    }, {});

    // Weekly distribution
    const weeklyDistribution = schedule.reduce((acc, game) => {
      const week = new Date(game.date).toISOString().slice(0, 10);
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {});

    // Venue utilization
    const venues = new Set(schedule.map(game => game.venue).filter(Boolean));
    const venueUtilization = Math.round((venues.size / Math.max(totalGames * 0.8, 1)) * 100);

    // Games per team
    const teamGames = schedule.reduce((acc, game) => {
      acc[game.homeTeam] = (acc[game.homeTeam] || 0) + 1;
      acc[game.awayTeam] = (acc[game.awayTeam] || 0) + 1;
      return acc;
    }, {});
    const averageGamesPerTeam = Object.keys(teamGames).length > 0 ? 
      Math.round(Object.values(teamGames).reduce((a, b) => a + b, 0) / Object.keys(teamGames).length) : 0;

    // Mock COMPASS score calculation
    const compassScore = compassScores?.overall || Math.max(0, 100 - conflicts * 5 - Math.max(0, 80 - venueUtilization));

    return {
      totalGames,
      conflicts,
      venueUtilization,
      averageGamesPerTeam,
      sportDistribution,
      weeklyDistribution,
      compassScore: Math.round(compassScore * 10) / 10
    };
  }, [schedule, compassScores]);

  const handleRunAnalysis = async () => {
    setAnalysisRunning(true);
    try {
      await onRunAnalysis?.();
    } finally {
      setTimeout(() => setAnalysisRunning(false), 2000);
    }
  };

  const handleExport = () => {
    onExportSchedule?.(exportFormat);
  };

  const handleTravelOptimization = async () => {
    setTravelOptimizing(true);
    try {
      // Create travel request from schedule
      const travelRequest = {
        scheduleId: 'current',
        season: new Date().getFullYear(),
        sport: 'basketball',
        games: schedule || [],
        preferences: {
          budgetConstraint: 'moderate',
          timePreference: 'balanced',
          comfortLevel: 'standard'
        }
      };

      // Call travel optimization API
      const response = await fetch('/api/travel-optimization/comprehensive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(travelRequest)
      });

      if (response.ok) {
        const result = await response.json();
        setTravelMetrics(result);
        console.log('Travel optimization completed:', result);
      } else {
        console.error('Travel optimization failed:', response.statusText);
      }
    } catch (error) {
      console.error('Travel optimization error:', error);
    } finally {
      setTimeout(() => setTravelOptimizing(false), 2000);
    }
  };

  const renderOverviewTab = () => React.createElement('div', { className: 'analytics-overview' }, [
    // Combined metrics grid with stats and quality metrics
    React.createElement('div', { className: 'combined-metrics-grid', key: 'combined-metrics' }, [
      // First row - COMPASS and key metrics
      React.createElement('div', { className: 'metric-card compass-card', key: 'compass' }, [
        React.createElement('div', { className: 'metric-header', key: 'header' }, [
          React.createElement('span', { className: 'metric-value', key: 'value' }, analytics.compassScore),
          React.createElement('span', { className: 'metric-label', key: 'label' }, 'COMPASS')
        ]),
        React.createElement('div', { className: 'metric-indicator', key: 'indicator' }, 
          analytics.compassScore >= 85 ? '↗ Excellent' : analytics.compassScore >= 70 ? '→ Good' : '↘ Needs Work'
        ),
        React.createElement('div', { className: 'metric-details', key: 'details' }, [
          React.createElement('div', { className: 'detail-item', key: 'games' }, [
            React.createElement('span', { className: 'detail-value' }, analytics.totalGames),
            React.createElement('span', { className: 'detail-label' }, 'Games')
          ]),
          React.createElement('div', { className: 'detail-item', key: 'teams' }, [
            React.createElement('span', { className: 'detail-value' }, analytics.averageGamesPerTeam),
            React.createElement('span', { className: 'detail-label' }, 'Per Team')
          ])
        ])
      ]),
      
      // Travel Efficiency
      React.createElement('div', { className: 'metric-card quality-metric blue', key: 'travel' }, [
        React.createElement('div', { className: 'metric-info', key: 'info' }, [
          React.createElement('span', { className: 'metric-value' }, '85%'),
          React.createElement('span', { className: 'metric-label' }, 'Travel Efficiency')
        ]),
        React.createElement('div', { className: 'metric-progress' }, [
          React.createElement('div', { className: 'progress-fill', style: { width: '85%' } })
        ])
      ]),
      
      // Home/Away Balance
      React.createElement('div', { className: 'metric-card quality-metric green', key: 'balance' }, [
        React.createElement('div', { className: 'metric-info', key: 'info' }, [
          React.createElement('span', { className: 'metric-value' }, '92%'),
          React.createElement('span', { className: 'metric-label' }, 'Home/Away Balance')
        ]),
        React.createElement('div', { className: 'metric-progress' }, [
          React.createElement('div', { className: 'progress-fill', style: { width: '92%' } })
        ])
      ]),
      
      // Conflict Resolution
      React.createElement('div', { className: 'metric-card quality-metric red', key: 'conflicts' }, [
        React.createElement('div', { className: 'metric-info', key: 'info' }, [
          React.createElement('span', { 
            className: 'metric-value',
            style: { color: analytics.conflicts > 0 ? '#ff4444' : '#44ff44' }
          }, analytics.conflicts > 0 ? `${analytics.conflicts}` : '0'),
          React.createElement('span', { className: 'metric-label' }, 'Conflicts')
        ]),
        React.createElement('div', { className: 'metric-progress' }, [
          React.createElement('div', { 
            className: 'progress-fill', 
            style: { 
              width: analytics.conflicts > 0 ? '60%' : '100%',
              background: analytics.conflicts > 0 ? 'linear-gradient(90deg, #ff4444, #ff8c66)' : 'linear-gradient(90deg, #44ff44, #66ff88)'
            } 
          })
        ])
      ]),
      
      // Venue Utilization
      React.createElement('div', { className: 'metric-card quality-metric', key: 'venues' }, [
        React.createElement('div', { className: 'metric-info', key: 'info' }, [
          React.createElement('span', { className: 'metric-value' }, `${analytics.venueUtilization}%`),
          React.createElement('span', { className: 'metric-label' }, 'Venue Utilization')
        ]),
        React.createElement('div', { className: 'metric-progress' }, [
          React.createElement('div', { 
            className: 'progress-fill', 
            style: { 
              width: `${analytics.venueUtilization}%`,
              background: analytics.venueUtilization >= 80 ? 'linear-gradient(90deg, #00bfff, #1e90ff)' : 'linear-gradient(90deg, #ffcc00, #ffaa00)'
            } 
          })
        ])
      ])
    ]),
    
    // Travel metrics row (if available)
    travelMetrics && React.createElement('div', { className: 'travel-metrics-row', key: 'travel' }, [
      React.createElement('div', { className: 'metric-card compact travel', key: 'cost' }, [
        React.createElement('div', { className: 'metric-header', key: 'header' }, [
          React.createElement('span', { className: 'metric-value', key: 'value' }, 
            travelMetrics.summary?.totalCost ? `$${Math.round(travelMetrics.summary.totalCost / 1000)}K` : 'N/A'
          ),
          React.createElement('span', { className: 'metric-label', key: 'label' }, 'Travel Cost')
        ]),
        React.createElement('div', { className: 'metric-indicator', key: 'indicator' }, 
          travelMetrics.summary?.savings ? `↓ $${Math.round(travelMetrics.summary.savings / 1000)}K saved` : 'Optimized'
        )
      ]),
      React.createElement('div', { className: 'metric-card compact travel', key: 'efficiency' }, [
        React.createElement('div', { className: 'metric-header', key: 'header' }, [
          React.createElement('span', { className: 'metric-value', key: 'value' }, 
            travelMetrics.summary?.efficiency ? `${Math.round(travelMetrics.summary.efficiency)}%` : 'N/A'
          ),
          React.createElement('span', { className: 'metric-label', key: 'label' }, 'Efficiency')
        ]),
        React.createElement('div', { className: 'metric-indicator', key: 'indicator' }, 
          travelMetrics.summary?.recommendation?.split(' ').slice(0, 2).join(' ') || 'Optimized'
        )
      ])
    ]),

    // Inline distribution summaries
    React.createElement('div', { className: 'distribution-summary', key: 'dist-summary' }, [
      React.createElement('div', { className: 'summary-section', key: 'sports' }, [
        React.createElement('h5', { key: 'title' }, `Sports (${Object.keys(analytics.sportDistribution).length})`),
        React.createElement('div', { className: 'summary-items', key: 'items' },
          Object.entries(analytics.sportDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 4)
            .map(([sport, count]) =>
              React.createElement('span', { className: 'summary-item', key: sport }, `${sport}: ${count}`)
            )
        )
      ]),
      React.createElement('div', { className: 'summary-section', key: 'weeks' }, [
        React.createElement('h5', { key: 'title' }, `Peak Weeks`),
        React.createElement('div', { className: 'summary-items', key: 'items' },
          Object.entries(analytics.weeklyDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([week, count]) =>
              React.createElement('span', { className: 'summary-item', key: week }, 
                `${new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${count}`
              )
            )
        )
      ])
    ])
  ]);

  const renderDistributionTab = () => React.createElement('div', { className: 'analytics-distribution' }, [
    React.createElement('div', { className: 'distribution-grid', key: 'grid' }, [
      // Sport distribution - compact
      React.createElement('div', { className: 'distribution-card', key: 'sports' }, [
        React.createElement('h4', { key: 'title' }, `Sports (${Object.keys(analytics.sportDistribution).length})`),
        React.createElement('div', { className: 'distribution-compact', key: 'chart' },
          Object.entries(analytics.sportDistribution)
            .sort(([,a], [,b]) => b - a)
            .map(([sport, count]) =>
              React.createElement('div', { className: 'distribution-item compact', key: sport }, [
                React.createElement('span', { className: 'item-label', key: 'name' }, sport),
                React.createElement('div', { className: 'item-bar', key: 'bar' }, [
                  React.createElement('div', { 
                    className: 'item-bar-fill',
                    style: { width: `${(count / analytics.totalGames) * 100}%` },
                    key: 'fill'
                  })
                ]),
                React.createElement('span', { className: 'item-count', key: 'count' }, count)
              ])
            )
        )
      ]),
      
      // Weekly distribution - compact
      React.createElement('div', { className: 'distribution-card', key: 'weekly' }, [
        React.createElement('h4', { key: 'title' }, 'Weekly Schedule Load'),
        React.createElement('div', { className: 'weekly-chart-compact', key: 'chart' },
          Object.entries(analytics.weeklyDistribution)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .slice(0, 8)
            .map(([week, count]) =>
              React.createElement('div', { className: 'week-item compact', key: week }, [
                React.createElement('div', { className: 'week-date', key: 'date' }, 
                  new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                ),
                React.createElement('div', { 
                  className: 'week-bar',
                  style: { 
                    height: `${Math.min((count / Math.max(...Object.values(analytics.weeklyDistribution))) * 60, 60)}px`,
                    backgroundColor: count > 5 ? '#ff6b6b' : count > 3 ? '#feca57' : '#48dbfb'
                  },
                  key: 'bar'
                }),
                React.createElement('div', { className: 'week-count', key: 'count' }, count)
              ])
            )
        )
      ])
    ]),
    
    // Summary insights
    React.createElement('div', { className: 'distribution-insights', key: 'insights' }, [
      React.createElement('div', { className: 'insight-item', key: 'busiest-sport' }, [
        React.createElement('span', { className: 'insight-label', key: 'label' }, 'Busiest Sport:'),
        React.createElement('span', { className: 'insight-value', key: 'value' }, 
          Object.entries(analytics.sportDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'
        )
      ]),
      React.createElement('div', { className: 'insight-item', key: 'peak-week' }, [
        React.createElement('span', { className: 'insight-label', key: 'label' }, 'Peak Week:'),
        React.createElement('span', { className: 'insight-value', key: 'value' }, 
          Object.entries(analytics.weeklyDistribution).sort(([,a], [,b]) => b - a)[0] ? 
          new Date(Object.entries(analytics.weeklyDistribution).sort(([,a], [,b]) => b - a)[0][0])
            .toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'
        )
      ]),
      React.createElement('div', { className: 'insight-item', key: 'avg-weekly' }, [
        React.createElement('span', { className: 'insight-label', key: 'label' }, 'Avg Weekly:'),
        React.createElement('span', { className: 'insight-value', key: 'value' }, 
          Object.keys(analytics.weeklyDistribution).length > 0 ? 
          Math.round(Object.values(analytics.weeklyDistribution).reduce((a, b) => a + b, 0) / Object.keys(analytics.weeklyDistribution).length) : 0
        )
      ])
    ])
  ]);

  const renderActionsTab = () => React.createElement('div', { className: 'analytics-actions' }, [
    React.createElement('div', { className: 'actions-grid', key: 'grid' }, [
      React.createElement('div', { className: 'action-card', key: 'analysis' }, [
        React.createElement('div', { className: 'action-header', key: 'header' }, [
          React.createElement('h4', { key: 'title' }, 'Analysis'),
          React.createElement('span', { className: 'action-desc', key: 'desc' }, 'Run optimization analysis')
        ]),
        React.createElement('button', {
          className: `action-button primary ${analysisRunning ? 'running' : ''}`,
          onClick: handleRunAnalysis,
          disabled: analysisRunning,
          key: 'button'
        }, analysisRunning ? 'Analyzing...' : 'Run Analysis')
      ]),
      
      React.createElement('div', { className: 'action-card', key: 'travel' }, [
        React.createElement('div', { className: 'action-header', key: 'header' }, [
          React.createElement('h4', { key: 'title' }, 'Travel Optimization'),
          React.createElement('span', { className: 'action-desc', key: 'desc' }, 'AI-powered cost optimization')
        ]),
        React.createElement('button', {
          className: `action-button travel ${travelOptimizing ? 'running' : ''}`,
          onClick: () => handleTravelOptimization(),
          disabled: travelOptimizing,
          key: 'button'
        }, travelOptimizing ? 'Optimizing...' : 'Optimize Travel'),
        travelMetrics && React.createElement('div', { className: 'optimization-badge', key: 'badge' }, 
          `$${Math.round((travelMetrics.summary?.savings || 0) / 1000)}K saved`
        )
      ]),
      
      React.createElement('div', { className: 'action-card', key: 'export' }, [
        React.createElement('div', { className: 'action-header', key: 'header' }, [
          React.createElement('h4', { key: 'title' }, 'Export'),
          React.createElement('select', {
            value: exportFormat,
            onChange: (e) => setExportFormat(e.target.value),
            className: 'export-format-select compact',
            key: 'select'
          }, [
            React.createElement('option', { value: 'pdf', key: 'pdf' }, 'PDF'),
            React.createElement('option', { value: 'csv', key: 'csv' }, 'CSV'),
            React.createElement('option', { value: 'json', key: 'json' }, 'JSON'),
            React.createElement('option', { value: 'ical', key: 'ical' }, 'iCal')
          ])
        ]),
        React.createElement('button', {
          className: 'action-button export',
          onClick: handleExport,
          key: 'button'
        }, 'Export Schedule')
      ])
    ]),
    
    // Travel optimization results (compact)
    travelMetrics && React.createElement('div', { className: 'travel-results-compact', key: 'travel-results' }, [
      React.createElement('h5', { key: 'title' }, 'Travel Optimization Results'),
      React.createElement('div', { className: 'results-summary', key: 'summary' }, [
        React.createElement('span', { className: 'result-item', key: 'cost' }, 
          `Cost: $${travelMetrics.summary?.totalCost ? Math.round(travelMetrics.summary.totalCost / 1000) : 'N/A'}K`
        ),
        travelMetrics.summary?.savings && React.createElement('span', { className: 'result-item savings', key: 'savings' }, 
          `Saved: $${Math.round(travelMetrics.summary.savings / 1000)}K`
        ),
        React.createElement('span', { className: 'result-item', key: 'efficiency' }, 
          `Efficiency: ${travelMetrics.summary?.efficiency ? Math.round(travelMetrics.summary.efficiency) : 85}%`
        )
      ].filter(Boolean))
    ])
  ]);

  const renderTravelTab = () => React.createElement('div', { className: 'analytics-travel' }, [
    !travelMetrics && React.createElement('div', { className: 'travel-placeholder', key: 'placeholder' }, [
      React.createElement('h4', { key: 'title' }, 'Travel Cost Optimization'),
      React.createElement('p', { key: 'desc' }, 'Run travel optimization for detailed cost analysis.'),
      React.createElement('button', {
        className: `action-button travel-optimize ${travelOptimizing ? 'running' : ''}`,
        onClick: () => handleTravelOptimization(),
        disabled: travelOptimizing,
        key: 'button'
      }, travelOptimizing ? 'Optimizing...' : 'Optimize Travel')
    ]),
    
    travelMetrics && React.createElement('div', { className: 'travel-compact-results', key: 'compact' }, [
      // Key metrics in compact grid
      React.createElement('div', { className: 'travel-metrics-compact', key: 'metrics' }, [
        React.createElement('div', { className: 'travel-metric-item', key: 'cost' }, [
          React.createElement('div', { className: 'metric-number', key: 'number' }, 
            `$${travelMetrics.summary?.totalCost ? Math.round(travelMetrics.summary.totalCost / 1000) : 'N/A'}K`
          ),
          React.createElement('div', { className: 'metric-label', key: 'label' }, 'Total Cost')
        ]),
        travelMetrics.summary?.savings && React.createElement('div', { className: 'travel-metric-item savings', key: 'savings' }, [
          React.createElement('div', { className: 'metric-number', key: 'number' }, 
            `$${Math.round(travelMetrics.summary.savings / 1000)}K`
          ),
          React.createElement('div', { className: 'metric-label', key: 'label' }, 'Savings')
        ]),
        React.createElement('div', { className: 'travel-metric-item', key: 'efficiency' }, [
          React.createElement('div', { className: 'metric-number', key: 'number' }, 
            `${travelMetrics.summary?.efficiency ? Math.round(travelMetrics.summary.efficiency) : 85}%`
          ),
          React.createElement('div', { className: 'metric-label', key: 'label' }, 'Efficiency')
        ])
      ]),
      
      // Compact breakdown
      React.createElement('div', { className: 'travel-breakdown-compact', key: 'breakdown' }, [
        React.createElement('h5', { key: 'title' }, 'Cost Breakdown'),
        React.createElement('div', { className: 'breakdown-items', key: 'items' }, [
          React.createElement('span', { className: 'breakdown-item', key: 'transport' }, 
            `Transport: $${travelMetrics.breakdown?.transportation ? Math.round(travelMetrics.breakdown.transportation / 1000) : '0'}K`
          ),
          React.createElement('span', { className: 'breakdown-item', key: 'accommodation' }, 
            `Hotels: $${travelMetrics.breakdown?.accommodation ? Math.round(travelMetrics.breakdown.accommodation / 1000) : '0'}K`
          ),
          React.createElement('span', { className: 'breakdown-item', key: 'meals' }, 
            `Meals: $${travelMetrics.breakdown?.meals ? Math.round(travelMetrics.breakdown.meals / 1000) : '0'}K`
          )
        ])
      ]),
      
      // Streamlined recommendations
      React.createElement('div', { className: 'travel-recommendations-compact', key: 'recommendations' }, [
        React.createElement('h5', { key: 'title' }, 'Optimization Summary'),
        React.createElement('div', { className: 'recommendation-items', key: 'items' }, [
          React.createElement('div', { className: 'recommendation-main', key: 'main' }, 
            travelMetrics.summary?.recommendation || 'Travel optimization complete'
          ),
          travelMetrics.agents?.transport_mode_optimization && React.createElement('div', { className: 'recommendation-detail', key: 'transport' }, 
            `🚌 ${travelMetrics.agents.transport_mode_optimization.recommendation?.split(' ').slice(0, 6).join(' ') || 'Transport modes optimized'}`
          ),
          travelMetrics.agents?.circuit_optimization && React.createElement('div', { className: 'recommendation-detail', key: 'circuit' }, 
            `🗺️ ${travelMetrics.agents.circuit_optimization.recommendation?.split(' ').slice(0, 6).join(' ') || 'Route clustering optimized'}`
          )
        ].filter(Boolean))
      ])
    ])
  ]);

  return React.createElement('div', { className: 'schedule-analytics-panel' }, [
    // Stats Overview Section - Moved from FlexTimeSidebar
    React.createElement('div', { className: 'analytics-stats-overview', key: 'stats-overview' }, [
      React.createElement('div', { className: 'stat-card blue', key: 'compass' }, [
        React.createElement('div', { className: 'stat-value' }, '87.5'),
        React.createElement('div', { className: 'stat-label' }, 'COMPASS Score')
      ]),
      React.createElement('div', { className: 'stat-card red', key: 'conflicts' }, [
        React.createElement('div', { className: 'stat-value' }, '3'),
        React.createElement('div', { className: 'stat-label' }, 'Conflicts')
      ]),
      React.createElement('div', { className: 'stat-card green', key: 'optimization' }, [
        React.createElement('div', { className: 'stat-value' }, '92%'),
        React.createElement('div', { className: 'stat-label' }, 'Optimization')
      ])
    ]),
    
    React.createElement('div', { className: 'analytics-header', key: 'header' }, [
      React.createElement('h3', { key: 'title' }, 'Schedule Analytics'),
      React.createElement('div', { className: 'analytics-tabs', key: 'tabs' }, [
        React.createElement('button', {
          className: `tab-button ${activeTab === 'overview' ? 'active' : ''}`,
          onClick: () => setActiveTab('overview'),
          key: 'overview'
        }, 'Overview'),
        React.createElement('button', {
          className: `tab-button ${activeTab === 'distribution' ? 'active' : ''}`,
          onClick: () => setActiveTab('distribution'),
          key: 'distribution'
        }, 'Distribution'),
        React.createElement('button', {
          className: `tab-button ${activeTab === 'actions' ? 'active' : ''}`,
          onClick: () => setActiveTab('actions'),
          key: 'actions'
        }, 'Actions'),
        React.createElement('button', {
          className: `tab-button ${activeTab === 'travel' ? 'active' : ''}`,
          onClick: () => setActiveTab('travel'),
          key: 'travel'
        }, 'Travel')
      ])
    ]),

    React.createElement('div', { className: 'analytics-content', key: 'content' }, [
      activeTab === 'overview' && renderOverviewTab(),
      activeTab === 'distribution' && renderDistributionTab(),
      activeTab === 'actions' && renderActionsTab(),
      activeTab === 'travel' && renderTravelTab()
    ].filter(Boolean))
  ]);
}

// Enhanced Schedule Generation Wizard Component - Next Generation
function ScheduleGenerationWizard({ 
  isOpen, 
  onClose, 
  onGenerateSchedule,
  selectedSport, 
  setSelectedSport,
  availableTeams = [],
  existingConstraints = {},
  stakeholders = [], // New: Support for stakeholder input
  currentUser = null  // New: User context for workflow
}) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [wizardConfig, setWizardConfig] = React.useState({
    strategicGoals: {
      tournament: 'net-primary',
      priorities: {
        competitive: 8,
        travel: 6,
        fan: 7
      },
      nonConference: {
        enabled: false,
        strategy: 'compass-tiered', // compass-tiered, aggressive, conservative
        targetWinPercentage: {
          topTier: 0.65,     // Top teams: maintain current approach
          middleTier: 0.80,  // Middle teams: 80% win rate target
          bottomTier: 0.90   // Bottom teams: maximize wins
        },
        compassThresholds: {
          topTier: 85,       // COMPASS score 85+
          middleTier: 70,    // COMPASS score 70-84
          bottomTier: 69     // COMPASS score <70
        }
      }
    },
    collaboration: {
      realTimeUpdates: true,
      requireApproval: false
    },
    newStakeholder: {
      role: '',
      email: '',
      institution: ''
    },
    seasonStart: '',
    seasonEnd: '',
    selectedTeams: [],
    constraints: {},
    advanced: {
      multiAgentSystem: true,
      realTimeReoptimization: true,
      scenarioModeling: true,
      stakeholderCollaboration: true,
      impactAnalysis: true
    }
  });

  const [generationConfig, setGenerationConfig] = React.useState({
    strategic: {
      primaryGoal: 'maximize-ncaa-bids',
      targetBids: 8,
      revenueWeight: 0.3,
      competitiveWeight: 0.5,
      logisticsWeight: 0.2,
      netFocus: true
    },
    stakeholders: {
      approvers: [],
      inputCollected: false,
      feedback: {},
      conflicts: []
    },
    basic: {
      sport: selectedSport || 'basketball',
      name: '',
      season: '2025-26',
      division: 'Big 12 Conference'
    },
    teams: {
      selectedTeams: [],
      teamCount: 16,
      autoSelectAll: true,
      projectedStrengths: {}
    },
    schedule: {
      startDate: '',
      endDate: '',
      gameFormat: 'double-round-robin',
      venueBalance: 'home-away-balanced',
      weekdayPreferences: ['Saturday', 'Sunday', 'Tuesday', 'Wednesday']
    },
    constraints: {
      netOptimization: true,
      quadrant1Minimums: true,
      rivalryProtection: true,
      travelOptimization: true,
      homeAwayBalance: true,
      tvWindows: true,
      strengthOfSchedule: true,
      byeWeeks: false,
      restDays: 2
    },
    advanced: {
      multiAgentSystem: true,
      realTimeReoptimization: true,
      scenarioModeling: true,
      stakeholderCollaboration: true,
      impactAnalysis: true
    }
  });

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [generationProgress, setGenerationProgress] = React.useState(0);
  const [generationStep, setGenerationStep] = React.useState('');

  const steps = [
    { id: 1, title: 'Strategic Goals', desc: 'NCAA tournament & revenue objectives' },
    { id: 2, title: 'Stakeholders', desc: 'Collaborative input collection' },
    { id: 3, title: 'Smart Setup', desc: 'Teams, dates, and intelligent defaults' },
    { id: 4, title: 'Constraints', desc: 'NET-centric rules and trade-offs' },
    { id: 5, title: 'Validation', desc: 'Impact preview and approval' },
    { id: 6, title: 'Generate', desc: 'Multi-agent AI optimization' }
  ];

  // Sport configurations
  const sportsConfig = {
    football: {
      name: 'Football',
      season: { start: 'August', end: 'December' },
      maxTeams: 16,
      defaultFormat: 'single-round-robin',
      requiresByeWeeks: true,
      typicalDays: ['Saturday', 'Friday'],
      gameLength: '3 hours'
    },
    basketball: {
      name: 'Men\'s Basketball', 
      season: { start: 'November', end: 'March' },
      maxTeams: 16,
      defaultFormat: 'double-round-robin',
      requiresByeWeeks: false,
      typicalDays: ['Saturday', 'Sunday', 'Tuesday', 'Wednesday'],
      gameLength: '2 hours'
    },
    baseball: {
      name: 'Baseball',
      season: { start: 'February', end: 'May' },
      maxTeams: 14,
      defaultFormat: 'series-based',
      requiresByeWeeks: false,
      typicalDays: ['Friday', 'Saturday', 'Sunday'],
      gameLength: '3 hours'
    },
    soccer: {
      name: 'Soccer',
      season: { start: 'August', end: 'November' },
      maxTeams: 16,
      defaultFormat: 'single-round-robin',
      requiresByeWeeks: false,
      typicalDays: ['Friday', 'Saturday', 'Sunday'],
      gameLength: '2 hours'
    }
  };

  React.useEffect(() => {
    if (selectedSport && sportsConfig[selectedSport]) {
      setGenerationConfig(prev => ({
        ...prev,
        basic: { ...prev.basic, sport: selectedSport },
        schedule: { 
          ...prev.schedule, 
          gameFormat: sportsConfig[selectedSport].defaultFormat,
          weekdayPreferences: sportsConfig[selectedSport].typicalDays
        },
        constraints: {
          ...prev.constraints,
          byeWeeks: sportsConfig[selectedSport].requiresByeWeeks
        }
      }));
    }
  }, [selectedSport]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) { // -1 because Generate is the final step
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setCurrentStep(6); // Move to generate step
    
    try {
      // Enhanced generation process with multi-agent simulation
      const generationSteps = [
        'Initializing strategic objectives...',
        'Loading Big 12 team data and NET histories...',
        'Deploying multi-agent optimization system...',
        'Agent negotiation: Travel vs Competition balance...',
        'Generating NCAA tournament-optimized base schedule...',
        'Applying NET-centric constraint analysis...',
        'Multi-stakeholder validation and conflict resolution...',
        'COMPASS ML model evaluation and SoS optimization...',
        'Real-time scenario modeling and impact analysis...',
        'Finalizing optimized Big 12 schedule...'
      ];

      for (let i = 0; i < generationSteps.length; i++) {
        setGenerationStep(generationSteps[i]);
        setGenerationProgress(((i + 1) / generationSteps.length) * 100);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Call the actual generation function with enhanced config
      await onGenerateSchedule?.(generationConfig);
      
      // Success
      setGenerationStep('Next-generation schedule optimization complete!');
      setTimeout(() => {
        onClose?.();
        setIsGenerating(false);
        setCurrentStep(1);
        setGenerationProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Generation failed:', error);
      setGenerationStep('Generation failed. Please try again.');
      setIsGenerating(false);
    }
  };

  const updateConfig = (section, field, value) => {
    setGenerationConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStrategicGoalsStep();
      case 2:
        return renderStakeholdersStep();
      case 3:
        return renderSmartSetupStep();
      case 4:
        return renderConstraintsStep();
      case 5:
        return renderValidationStep();
      case 6:
        return renderGenerateStep();
      default:
        return null;
    }
  };

  const renderBasicInfoStep = () => React.createElement('div', { className: 'wizard-step-content' }, [
    React.createElement('div', { className: 'step-header', key: 'header' }, [
      React.createElement('h3', { key: 'title' }, 'Basic Information'),
      React.createElement('p', { key: 'desc' }, 'Set up the fundamental details for your schedule')
    ]),

    React.createElement('div', { className: 'form-grid', key: 'form' }, [
      React.createElement('div', { className: 'form-group', key: 'sport' }, [
        React.createElement('label', { key: 'label' }, 'Sport'),
        React.createElement('select', {
          value: generationConfig.basic.sport,
          onChange: (e) => {
            updateConfig('basic', 'sport', e.target.value);
            setSelectedSport?.(e.target.value);
          },
          className: 'form-select',
          key: 'select'
        }, Object.entries(sportsConfig).map(([key, config]) =>
          React.createElement('option', { value: key, key }, config.name)
        ))
      ]),

      React.createElement('div', { className: 'form-group', key: 'name' }, [
        React.createElement('label', { key: 'label' }, 'Schedule Name'),
        React.createElement('input', {
          type: 'text',
          value: generationConfig.basic.name,
          onChange: (e) => updateConfig('basic', 'name', e.target.value),
          placeholder: `${sportsConfig[generationConfig.basic.sport]?.name || 'Sport'} ${generationConfig.basic.season}`,
          className: 'form-input',
          key: 'input'
        })
      ]),

      React.createElement('div', { className: 'form-group', key: 'season' }, [
        React.createElement('label', { key: 'label' }, 'Season'),
        React.createElement('select', {
          value: generationConfig.basic.season,
          onChange: (e) => updateConfig('basic', 'season', e.target.value),
          className: 'form-select',
          key: 'select'
        }, [
          React.createElement('option', { value: '2024-25', key: '2024' }, '2024-25'),
          React.createElement('option', { value: '2025-26', key: '2025' }, '2025-26'),
          React.createElement('option', { value: '2026-27', key: '2026' }, '2026-27')
        ])
      ]),

      React.createElement('div', { className: 'form-group full-width', key: 'division' }, [
        React.createElement('label', { key: 'label' }, 'Conference/Division'),
        React.createElement('input', {
          type: 'text',
          value: generationConfig.basic.division,
          onChange: (e) => updateConfig('basic', 'division', e.target.value),
          className: 'form-input',
          key: 'input'
        })
      ])
    ]),

    React.createElement('div', { className: 'sport-info-card', key: 'info' }, [
      React.createElement('h4', { key: 'title' }, `${sportsConfig[generationConfig.basic.sport]?.name || 'Sport'} Configuration`),
      React.createElement('div', { className: 'info-items', key: 'items' }, [
        React.createElement('div', { className: 'info-item', key: 'season' }, [
          React.createElement('span', { className: 'info-label', key: 'label' }, 'Season:'),
          React.createElement('span', { className: 'info-value', key: 'value' }, 
            `${sportsConfig[generationConfig.basic.sport]?.season.start} - ${sportsConfig[generationConfig.basic.sport]?.season.end}`
          )
        ]),
        React.createElement('div', { className: 'info-item', key: 'teams' }, [
          React.createElement('span', { className: 'info-label', key: 'label' }, 'Max Teams:'),
          React.createElement('span', { className: 'info-value', key: 'value' }, 
            sportsConfig[generationConfig.basic.sport]?.maxTeams || 16
          )
        ]),
        React.createElement('div', { className: 'info-item', key: 'days' }, [
          React.createElement('span', { className: 'info-label', key: 'label' }, 'Typical Days:'),
          React.createElement('span', { className: 'info-value', key: 'value' }, 
            sportsConfig[generationConfig.basic.sport]?.typicalDays.join(', ') || 'Various'
          )
        ])
      ])
    ])
  ]);

  const renderTeamsStep = () => React.createElement('div', { className: 'wizard-step-content' }, [
    React.createElement('div', { className: 'step-header', key: 'header' }, [
      React.createElement('h3', { key: 'title' }, 'Team Selection'),
      React.createElement('p', { key: 'desc' }, `Select teams for ${sportsConfig[generationConfig.basic.sport]?.name || 'your sport'} schedule`)
    ]),

    React.createElement('div', { className: 'teams-config', key: 'config' }, [
      React.createElement('div', { className: 'team-count-control', key: 'count' }, [
        React.createElement('label', { key: 'label' }, 'Number of Teams'),
        React.createElement('div', { className: 'count-selector', key: 'selector' }, [
          React.createElement('button', {
            onClick: () => updateConfig('teams', 'teamCount', Math.max(4, generationConfig.teams.teamCount - 1)),
            className: 'count-btn',
            key: 'minus'
          }, '−'),
          React.createElement('span', { className: 'count-display', key: 'display' }, generationConfig.teams.teamCount),
          React.createElement('button', {
            onClick: () => updateConfig('teams', 'teamCount', Math.min(
              sportsConfig[generationConfig.basic.sport]?.maxTeams || 16, 
              generationConfig.teams.teamCount + 1
            )),
            className: 'count-btn',
            key: 'plus'
          }, '+')
        ])
      ]),

      React.createElement('div', { className: 'team-selection-options', key: 'options' }, [
        React.createElement('label', { className: 'checkbox-label', key: 'auto' }, [
          React.createElement('input', {
            type: 'checkbox',
            checked: generationConfig.teams.autoSelectAll,
            onChange: (e) => updateConfig('teams', 'autoSelectAll', e.target.checked),
            key: 'checkbox'
          }),
          React.createElement('span', { key: 'text' }, 'Auto-select all Big 12 teams')
        ])
      ])
    ]),

    React.createElement('div', { className: 'teams-grid', key: 'teams' }, 
      availableTeams.slice(0, generationConfig.teams.teamCount).map(team =>
        React.createElement('div', { className: 'team-card selected', key: team.id || team.name }, [
          React.createElement('div', { className: 'team-logo', key: 'logo' }, team.name.charAt(0)),
          React.createElement('div', { className: 'team-info', key: 'info' }, [
            React.createElement('div', { className: 'team-name', key: 'name' }, team.name),
            React.createElement('div', { className: 'team-conference', key: 'conf' }, 'Big 12')
          ])
        ])
      )
    )
  ]);

  const renderScheduleStep = () => React.createElement('div', { className: 'wizard-step-content' }, [
    React.createElement('div', { className: 'step-header', key: 'header' }, [
      React.createElement('h3', { key: 'title' }, 'Schedule Configuration'),
      React.createElement('p', { key: 'desc' }, 'Configure dates, format, and scheduling preferences')
    ]),

    React.createElement('div', { className: 'form-grid', key: 'form' }, [
      React.createElement('div', { className: 'form-group', key: 'start-date' }, [
        React.createElement('label', { key: 'label' }, 'Season Start Date'),
        React.createElement('input', {
          type: 'date',
          value: generationConfig.schedule.startDate,
          onChange: (e) => updateConfig('schedule', 'startDate', e.target.value),
          className: 'form-input',
          key: 'input'
        })
      ]),

      React.createElement('div', { className: 'form-group', key: 'end-date' }, [
        React.createElement('label', { key: 'label' }, 'Season End Date'),
        React.createElement('input', {
          type: 'date',
          value: generationConfig.schedule.endDate,
          onChange: (e) => updateConfig('schedule', 'endDate', e.target.value),
          className: 'form-input',
          key: 'input'
        })
      ]),

      React.createElement('div', { className: 'form-group', key: 'format' }, [
        React.createElement('label', { key: 'label' }, 'Game Format'),
        React.createElement('select', {
          value: generationConfig.schedule.gameFormat,
          onChange: (e) => updateConfig('schedule', 'gameFormat', e.target.value),
          className: 'form-select',
          key: 'select'
        }, [
          React.createElement('option', { value: 'single-round-robin', key: 'single' }, 'Single Round-Robin'),
          React.createElement('option', { value: 'double-round-robin', key: 'double' }, 'Double Round-Robin'),
          React.createElement('option', { value: 'series-based', key: 'series' }, 'Series-Based'),
          React.createElement('option', { value: 'custom', key: 'custom' }, 'Custom Format')
        ])
      ]),

      React.createElement('div', { className: 'form-group', key: 'venue' }, [
        React.createElement('label', { key: 'label' }, 'Venue Balance'),
        React.createElement('select', {
          value: generationConfig.schedule.venueBalance,
          onChange: (e) => updateConfig('schedule', 'venueBalance', e.target.value),
          className: 'form-select',
          key: 'select'
        }, [
          React.createElement('option', { value: 'home-away-balanced', key: 'balanced' }, 'Balanced Home/Away'),
          React.createElement('option', { value: 'home-heavy', key: 'home' }, 'Home Heavy'),
          React.createElement('option', { value: 'neutral-sites', key: 'neutral' }, 'Include Neutral Sites'),
          React.createElement('option', { value: 'flexible', key: 'flexible' }, 'Flexible')
        ])
      ])
    ]),

    React.createElement('div', { className: 'weekday-preferences', key: 'weekdays' }, [
      React.createElement('label', { key: 'label' }, 'Preferred Game Days'),
      React.createElement('div', { className: 'weekday-grid', key: 'grid' }, 
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day =>
          React.createElement('label', { className: 'weekday-option', key: day }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.schedule.weekdayPreferences.includes(day),
              onChange: (e) => {
                const current = generationConfig.schedule.weekdayPreferences;
                const updated = e.target.checked
                  ? [...current, day]
                  : current.filter(d => d !== day);
                updateConfig('schedule', 'weekdayPreferences', updated);
              },
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, day.substring(0, 3))
          ])
        )
      )
    ])
  ]);

  const renderConstraintsStep = () => React.createElement('div', { className: 'wizard-step-content' }, [
    React.createElement('div', { className: 'step-header', key: 'header' }, [
      React.createElement('h3', { key: 'title' }, 'Constraints & Optimization'),
      React.createElement('p', { key: 'desc' }, 'Configure scheduling rules and AI optimization settings')
    ]),

    React.createElement('div', { className: 'constraints-grid', key: 'constraints' }, [
      React.createElement('div', { className: 'constraint-section', key: 'basic' }, [
        React.createElement('h4', { key: 'title' }, 'Basic Constraints'),
        React.createElement('div', { className: 'constraint-options', key: 'options' }, [
          React.createElement('label', { className: 'checkbox-label', key: 'rivalry' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.constraints.rivalryProtection,
              onChange: (e) => updateConfig('constraints', 'rivalryProtection', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'Rivalry Protection'),
            React.createElement('small', { key: 'desc' }, 'Protect traditional rivalry games')
          ]),
          React.createElement('label', { className: 'checkbox-label', key: 'balance' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.constraints.homeAwayBalance,
              onChange: (e) => updateConfig('constraints', 'homeAwayBalance', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'Home/Away Balance'),
            React.createElement('small', { key: 'desc' }, 'Ensure fair home/away distribution')
          ]),
          React.createElement('label', { className: 'checkbox-label', key: 'bye' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.constraints.byeWeeks,
              onChange: (e) => updateConfig('constraints', 'byeWeeks', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'Bye Weeks'),
            React.createElement('small', { key: 'desc' }, 'Include bye weeks in schedule')
          ])
        ])
      ]),

      React.createElement('div', { className: 'constraint-section', key: 'optimization' }, [
        React.createElement('h4', { key: 'title' }, 'Optimization'),
        React.createElement('div', { className: 'constraint-options', key: 'options' }, [
          React.createElement('label', { className: 'checkbox-label', key: 'travel' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.constraints.travelOptimization,
              onChange: (e) => updateConfig('constraints', 'travelOptimization', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'Travel Optimization'),
            React.createElement('small', { key: 'desc' }, 'Minimize travel costs and distance')
          ]),
          React.createElement('label', { className: 'checkbox-label', key: 'tv' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.constraints.tvWindows,
              onChange: (e) => updateConfig('constraints', 'tvWindows', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'TV Windows'),
            React.createElement('small', { key: 'desc' }, 'Consider TV broadcast windows')
          ]),
          React.createElement('label', { className: 'checkbox-label', key: 'weather' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.constraints.weatherConsiderations,
              onChange: (e) => updateConfig('constraints', 'weatherConsiderations', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'Weather Considerations'),
            React.createElement('small', { key: 'desc' }, 'Account for seasonal weather patterns')
          ])
        ])
      ]),

      React.createElement('div', { className: 'constraint-section', key: 'ai' }, [
        React.createElement('h4', { key: 'title' }, 'AI Features'),
        React.createElement('div', { className: 'constraint-options', key: 'options' }, [
          React.createElement('label', { className: 'checkbox-label', key: 'ai' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.advanced.aiOptimization,
              onChange: (e) => updateConfig('advanced', 'aiOptimization', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'AI Optimization'),
            React.createElement('small', { key: 'desc' }, 'Use multi-agent AI system')
          ]),
          React.createElement('label', { className: 'checkbox-label', key: 'compass' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.advanced.compassIntegration,
              onChange: (e) => updateConfig('advanced', 'compassIntegration', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'COMPASS Integration'),
            React.createElement('small', { key: 'desc' }, 'Use ML models for prediction')
          ]),
          React.createElement('label', { className: 'checkbox-label', key: 'realtime' }, [
            React.createElement('input', {
              type: 'checkbox',
              checked: generationConfig.advanced.realTimeUpdates,
              onChange: (e) => updateConfig('advanced', 'realTimeUpdates', e.target.checked),
              key: 'checkbox'
            }),
            React.createElement('span', { key: 'text' }, 'Real-time Updates'),
            React.createElement('small', { key: 'desc' }, 'Live progress and optimization')
          ])
        ])
      ])
    ])
  ]);

  function renderValidationStep() {
    return React.createElement('div', { className: 'wizard-step-content validation' }, [
      React.createElement('h3', { key: 'title' }, 'Validation & Impact Preview'),
      React.createElement('div', { className: 'validation-grid', key: 'grid' }, [
        React.createElement('div', { className: 'validation-section', key: 'impact' }, [
          React.createElement('h4', { key: 'title' }, 'Projected Impact'),
          React.createElement('div', { className: 'impact-metrics', key: 'metrics' }, [
            React.createElement('div', { className: 'impact-metric', key: 'net' }, [
              React.createElement('div', { className: 'metric-header', key: 'header' }, [
                React.createElement('span', { className: 'metric-label', key: 'label' }, 'Projected NET Ranking'),
                React.createElement('span', { className: 'metric-value projected', key: 'value' }, '#12-18')
              ]),
              React.createElement('div', { className: 'metric-desc', key: 'desc' }, 'Based on strength of schedule optimization')
            ]),
            React.createElement('div', { className: 'impact-metric', key: 'bids' }, [
              React.createElement('div', { className: 'metric-header', key: 'header' }, [
                React.createElement('span', { className: 'metric-label', key: 'label' }, 'NCAA Tournament Bids'),
                React.createElement('span', { className: 'metric-value projected', key: 'value' }, '7-9 teams')
              ]),
              React.createElement('div', { className: 'metric-desc', key: 'desc' }, 'Projected based on competitive balance')
            ]),
            React.createElement('div', { className: 'impact-metric', key: 'revenue' }, [
              React.createElement('div', { className: 'metric-header', key: 'header' }, [
                React.createElement('span', { className: 'metric-label', key: 'label' }, 'Travel Cost Efficiency'),
                React.createElement('span', { className: 'metric-value projected', key: 'value' }, '85%')
              ]),
              React.createElement('div', { className: 'metric-desc', key: 'desc' }, 'Optimized routing and circuit scheduling')
            ])
          ])
        ]),
        React.createElement('div', { className: 'validation-section', key: 'conflicts' }, [
          React.createElement('h4', { key: 'title' }, 'Potential Conflicts'),
          React.createElement('div', { className: 'conflict-list', key: 'list' }, [
            React.createElement('div', { className: 'conflict-item resolved', key: 'venue' }, [
              React.createElement('span', { className: 'conflict-icon', key: 'icon' }, '✓'),
              React.createElement('div', { className: 'conflict-content', key: 'content' }, [
                React.createElement('strong', { key: 'title' }, 'Venue Availability'),
                React.createElement('p', { key: 'desc' }, 'All venues checked and conflicts automatically resolved')
              ])
            ]),
            React.createElement('div', { className: 'conflict-item warning', key: 'rivalry' }, [
              React.createElement('span', { className: 'conflict-icon', key: 'icon' }, '⚠'),
              React.createElement('div', { className: 'conflict-content', key: 'content' }, [
                React.createElement('strong', { key: 'title' }, 'Rivalry Games'),
                React.createElement('p', { key: 'desc' }, 'Kansas vs K-State scheduled during neutral week as requested')
              ])
            ]),
            React.createElement('div', { className: 'conflict-item resolved', key: 'travel' }, [
              React.createElement('span', { className: 'conflict-icon', key: 'icon' }, '✓'),
              React.createElement('div', { className: 'conflict-content', key: 'content' }, [
                React.createElement('strong', { key: 'title' }, 'Travel Optimization'),
                React.createElement('p', { key: 'desc' }, 'Circuit scheduling reduced travel by 23% vs traditional approach')
              ])
            ])
          ])
        ]),
        React.createElement('div', { className: 'validation-section', key: 'approval' }, [
          React.createElement('h4', { key: 'title' }, 'Stakeholder Approval'),
          React.createElement('div', { className: 'approval-status', key: 'status' }, [
            React.createElement('div', { className: 'approval-summary', key: 'summary' }, [
              React.createElement('span', { className: 'approval-count', key: 'count' }, '3 of 4'),
              React.createElement('span', { className: 'approval-label', key: 'label' }, 'stakeholders approved')
            ]),
            wizardConfig.collaboration.requireApproval && React.createElement('div', { className: 'approval-note', key: 'note' }, 
              'Waiting for final approval before generation can proceed'
            )
          ]),
          React.createElement('div', { className: 'stakeholder-approvals', key: 'approvals' }, 
            stakeholders.slice(0, 4).map((stakeholder, index) => 
              React.createElement('div', { className: 'approval-item', key: index }, [
                React.createElement('span', { 
                  className: `approval-status-icon ${index < 3 ? 'approved' : 'pending'}`, 
                  key: 'icon' 
                }, index < 3 ? '✓' : '⏳'),
                React.createElement('span', { className: 'stakeholder-name', key: 'name' }, 
                  stakeholder.name || `${stakeholder.role} - ${stakeholder.institution}`
                )
              ])
            )
          )
        ])
      ]),
      React.createElement('div', { className: 'validation-actions', key: 'actions' }, [
        React.createElement('button', {
          className: 'action-button secondary',
          onClick: () => {
            // Simulate running impact analysis
            console.log('Running detailed impact analysis...');
          },
          key: 'analyze'
        }, 'Run Detailed Analysis'),
        wizardConfig.collaboration.requireApproval && React.createElement('button', {
          className: 'action-button primary',
          onClick: () => {
            // Simulate requesting final approvals
            console.log('Requesting final stakeholder approvals...');
          },
          key: 'request'
        }, 'Request Final Approvals')
      ].filter(Boolean))
    ]);
  }

  const renderGenerateStep = () => React.createElement('div', { className: 'wizard-step-content generate-step' }, [
    React.createElement('div', { className: 'step-header', key: 'header' }, [
      React.createElement('h3', { key: 'title' }, isGenerating ? 'Generating Schedule...' : 'Ready to Generate'),
      React.createElement('p', { key: 'desc' }, isGenerating ? 'AI agents are creating your optimized schedule' : 'Review your configuration and start generation')
    // AI Analytics Section - Moved to ScheduleAnalyticsPanel  React.createElement('div', { className: 'summary-card', key: 'constraints' }, [
        React.createElement('h4', { key: 'title' }, 'Active Constraints'),
        React.createElement('div', { className: 'constraint-badges', key: 'badges' }, 
          Object.entries(generationConfig.constraints)
            .filter(([, enabled]) => enabled)
            .map(([key]) =>
{{ ... }}
                key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
              )
            )
        )
      ])
    ]),

    isGenerating && React.createElement('div', { className: 'generation-progress', key: 'progress' }, [
      React.createElement('div', { className: 'progress-visualization', key: 'viz' }, [
        React.createElement('div', { className: 'progress-circle', key: 'circle' }, [
          React.createElement('div', { className: 'progress-number', key: 'number' }, `${Math.round(generationProgress)}%`)
        ]),
        React.createElement('div', { className: 'progress-details', key: 'details' }, [
          React.createElement('div', { className: 'current-step', key: 'step' }, generationStep),
          React.createElement('div', { className: 'progress-bar', key: 'bar' }, [
            React.createElement('div', { 
              className: 'progress-fill',
              style: { width: `${generationProgress}%` },
              key: 'fill'
            })
          ])
        ])
      ])
    ])
  ]);

  if (!isOpen) return null;

  return React.createElement('div', { className: 'schedule-wizard-overlay' }, [
    React.createElement('div', { className: 'schedule-wizard-modal', key: 'modal' }, [
      React.createElement('div', { className: 'wizard-header', key: 'header' }, [
        React.createElement('h2', { key: 'title' }, 'Schedule Generation Wizard'),
        React.createElement('button', {
          className: 'wizard-close',
          onClick: onClose,
          key: 'close'
        }, '×')
      ]),

      React.createElement('div', { className: 'wizard-progress', key: 'progress' }, 
        steps.map(step =>
          React.createElement('div', { 
            className: `progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`,
            key: step.id 
          }, [
            React.createElement('div', { className: 'step-number', key: 'number' }, step.id),
            React.createElement('div', { className: 'step-info', key: 'info' }, [
              React.createElement('div', { className: 'step-title', key: 'title' }, step.title),
              React.createElement('div', { className: 'step-desc', key: 'desc' }, step.desc)
            ])
          ])
        )
      ),

      React.createElement('div', { className: 'wizard-content', key: 'content' }, [
        renderStepContent()
      ]),

      React.createElement('div', { className: 'wizard-actions', key: 'actions' }, [
        currentStep > 1 && !isGenerating && React.createElement('button', {
          className: 'wizard-btn secondary',
          onClick: handlePrevious,
          key: 'prev'
        }, 'Previous'),
        
        currentStep < 5 && React.createElement('button', {
          className: 'wizard-btn primary',
          onClick: handleNext,
          key: 'next'
        }, 'Next'),
        
        currentStep === 5 && React.createElement('button', {
          className: 'wizard-btn primary',
          onClick: handleGenerate,
          disabled: isGenerating,
          key: 'generate'
        }, 'Generate Schedule'),

        isGenerating && React.createElement('div', { className: 'generation-status', key: 'status' }, [
          React.createElement('div', { className: 'progress-bar', key: 'bar' }, [
            React.createElement('div', { 
              className: 'progress-fill',
              style: { width: `${generationProgress}%` },
              key: 'fill'
            })
          ]),
          React.createElement('div', { className: 'progress-text', key: 'text' }, generationStep)
        ])
      ])
    ])
  ]);
}

// Export components
window.CalendarScheduleView = CalendarScheduleView;
window.GanttScheduleView = GanttScheduleView;
window.MatrixScheduleView = MatrixScheduleView;
window.ScheduleAnalyticsPanel = ScheduleAnalyticsPanel;
window.ScheduleGenerationWizard = ScheduleGenerationWizard;