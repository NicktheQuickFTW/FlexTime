/**
 * FlexTime Schedule Builder - Additional View Components
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
    React.createElement('div', { className: 'metrics-grid', key: 'metrics' }, [
      React.createElement('div', { className: 'metric-card', key: 'compass' }, [
        React.createElement('div', { className: 'metric-value', key: 'value' }, analytics.compassScore),
        React.createElement('div', { className: 'metric-label', key: 'label' }, 'COMPASS Score'),
        React.createElement('div', { className: 'metric-trend', key: 'trend' }, 
          analytics.compassScore >= 85 ? '↗ Excellent' : analytics.compassScore >= 70 ? '→ Good' : '↘ Needs Work'
        )
      ]),
      React.createElement('div', { className: 'metric-card', key: 'games' }, [
        React.createElement('div', { className: 'metric-value', key: 'value' }, analytics.totalGames),
        React.createElement('div', { className: 'metric-label', key: 'label' }, 'Total Games'),
        React.createElement('div', { className: 'metric-trend', key: 'trend' }, `${analytics.averageGamesPerTeam} avg/team`)
      ]),
      React.createElement('div', { className: 'metric-card', key: 'conflicts' }, [
        React.createElement('div', { 
          className: 'metric-value',
          style: { color: analytics.conflicts > 0 ? '#ff4444' : '#44ff44' },
          key: 'value'
        }, analytics.conflicts),
        React.createElement('div', { className: 'metric-label', key: 'label' }, 'Conflicts'),
        React.createElement('div', { className: 'metric-trend', key: 'trend' }, 
          analytics.conflicts === 0 ? '✓ Clean' : '⚠ Review Required'
        )
      ]),
      React.createElement('div', { className: 'metric-card', key: 'venues' }, [
        React.createElement('div', { className: 'metric-value', key: 'value' }, `${analytics.venueUtilization}%`),
        React.createElement('div', { className: 'metric-label', key: 'label' }, 'Venue Usage'),
        React.createElement('div', { className: 'metric-trend', key: 'trend' }, 
          analytics.venueUtilization >= 80 ? 'Optimal' : 'Can Improve'
        )
      ]),
      travelMetrics && React.createElement('div', { className: 'metric-card travel-cost', key: 'travel-cost' }, [
        React.createElement('div', { className: 'metric-value', key: 'value' }, 
          travelMetrics.summary?.totalCost ? `$${Math.round(travelMetrics.summary.totalCost / 1000)}K` : 'N/A'
        ),
        React.createElement('div', { className: 'metric-label', key: 'label' }, 'Travel Cost'),
        React.createElement('div', { className: 'metric-trend', key: 'trend' }, 
          travelMetrics.summary?.savings ? `↓ $${Math.round(travelMetrics.summary.savings / 1000)}K saved` : 'Optimized'
        )
      ]),
      travelMetrics && React.createElement('div', { className: 'metric-card travel-efficiency', key: 'travel-efficiency' }, [
        React.createElement('div', { className: 'metric-value', key: 'value' }, 
          travelMetrics.summary?.efficiency ? `${Math.round(travelMetrics.summary.efficiency)}%` : 'N/A'
        ),
        React.createElement('div', { className: 'metric-label', key: 'label' }, 'Travel Efficiency'),
        React.createElement('div', { className: 'metric-trend', key: 'trend' }, 
          travelMetrics.summary?.recommendation || 'Optimized'
        )
      ])
    ].filter(Boolean))
  ]);

  const renderDistributionTab = () => React.createElement('div', { className: 'analytics-distribution' }, [
    React.createElement('div', { className: 'distribution-section', key: 'sports' }, [
      React.createElement('h4', { key: 'title' }, 'Sport Distribution'),
      React.createElement('div', { className: 'distribution-chart', key: 'chart' },
        Object.entries(analytics.sportDistribution).map(([sport, count]) =>
          React.createElement('div', { className: 'distribution-item', key: sport }, [
            React.createElement('span', { className: 'sport-name', key: 'name' }, sport),
            React.createElement('div', { className: 'sport-bar', key: 'bar' }, [
              React.createElement('div', { 
                className: 'sport-bar-fill',
                style: { width: `${(count / analytics.totalGames) * 100}%` },
                key: 'fill'
              })
            ]),
            React.createElement('span', { className: 'sport-count', key: 'count' }, count)
          ])
        )
      )
    ]),
    React.createElement('div', { className: 'distribution-section', key: 'weekly' }, [
      React.createElement('h4', { key: 'title' }, 'Weekly Load'),
      React.createElement('div', { className: 'weekly-chart', key: 'chart' },
        Object.entries(analytics.weeklyDistribution)
          .sort(([a], [b]) => new Date(a) - new Date(b))
          .slice(0, 10)
          .map(([week, count]) =>
            React.createElement('div', { className: 'week-item', key: week }, [
              React.createElement('div', { className: 'week-date', key: 'date' }, 
                new Date(week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              ),
              React.createElement('div', { 
                className: 'week-bar',
                style: { height: `${Math.min((count / 10) * 100, 100)}%` },
                key: 'bar'
              }),
              React.createElement('div', { className: 'week-count', key: 'count' }, count)
            ])
          )
      )
    ])
  ]);

  const renderActionsTab = () => React.createElement('div', { className: 'analytics-actions' }, [
    React.createElement('div', { className: 'action-section', key: 'analysis' }, [
      React.createElement('h4', { key: 'title' }, 'Schedule Analysis'),
      React.createElement('p', { key: 'desc' }, 'Run comprehensive analysis to identify optimization opportunities.'),
      React.createElement('button', {
        className: `action-button ${analysisRunning ? 'running' : ''}`,
        onClick: handleRunAnalysis,
        disabled: analysisRunning,
        key: 'button'
      }, analysisRunning ? 'Analyzing...' : 'Run Analysis')
    ]),
    React.createElement('div', { className: 'action-section', key: 'travel-optimization' }, [
      React.createElement('h4', { key: 'title' }, 'Travel Cost Optimization'),
      React.createElement('p', { key: 'desc' }, 'Optimize travel costs using AI-powered agents for transportation, circuits, and shared charters.'),
      React.createElement('button', {
        className: `action-button travel-optimize ${travelOptimizing ? 'running' : ''}`,
        onClick: () => handleTravelOptimization(),
        disabled: travelOptimizing,
        key: 'travel-button'
      }, travelOptimizing ? 'Optimizing Travel...' : 'Optimize Travel Costs'),
      travelMetrics && React.createElement('div', { className: 'travel-results', key: 'results' }, [
        React.createElement('div', { className: 'travel-summary', key: 'summary' }, [
          React.createElement('h5', { key: 'title' }, 'Optimization Results'),
          React.createElement('ul', { key: 'list' }, [
            React.createElement('li', { key: 'cost' }, 
              `Total Cost: $${travelMetrics.summary?.totalCost ? Math.round(travelMetrics.summary.totalCost).toLocaleString() : 'N/A'}`
            ),
            travelMetrics.summary?.savings && React.createElement('li', { key: 'savings' }, 
              `Savings: $${Math.round(travelMetrics.summary.savings).toLocaleString()}`
            ),
            React.createElement('li', { key: 'recommendation' }, 
              `Recommendation: ${travelMetrics.summary?.recommendation || 'Optimization complete'}`
            )
          ].filter(Boolean))
        ])
      ])
    ]),
    React.createElement('div', { className: 'action-section', key: 'export' }, [
      React.createElement('h4', { key: 'title' }, 'Export Schedule'),
      React.createElement('div', { className: 'export-controls', key: 'controls' }, [
        React.createElement('select', {
          value: exportFormat,
          onChange: (e) => setExportFormat(e.target.value),
          className: 'export-format-select',
          key: 'select'
        }, [
          React.createElement('option', { value: 'pdf', key: 'pdf' }, 'PDF Report'),
          React.createElement('option', { value: 'csv', key: 'csv' }, 'CSV Data'),
          React.createElement('option', { value: 'json', key: 'json' }, 'JSON Format'),
          React.createElement('option', { value: 'ical', key: 'ical' }, 'Calendar (iCal)')
        ]),
        React.createElement('button', {
          className: 'action-button',
          onClick: handleExport,
          key: 'export'
        }, 'Export')
      ])
    ])
  ]);

  const renderTravelTab = () => React.createElement('div', { className: 'analytics-travel' }, [
    !travelMetrics && React.createElement('div', { className: 'travel-placeholder', key: 'placeholder' }, [
      React.createElement('h4', { key: 'title' }, 'Travel Cost Optimization'),
      React.createElement('p', { key: 'desc' }, 'Run travel optimization to see detailed cost analysis and recommendations.'),
      React.createElement('button', {
        className: `action-button travel-optimize ${travelOptimizing ? 'running' : ''}`,
        onClick: () => handleTravelOptimization(),
        disabled: travelOptimizing,
        key: 'button'
      }, travelOptimizing ? 'Optimizing Travel...' : 'Optimize Travel Costs')
    ]),
    
    travelMetrics && React.createElement('div', { className: 'travel-detailed-results', key: 'detailed' }, [
      React.createElement('div', { className: 'travel-metrics-grid', key: 'grid' }, [
        React.createElement('div', { className: 'travel-metric-card', key: 'total-cost' }, [
          React.createElement('h4', { key: 'title' }, 'Total Travel Cost'),
          React.createElement('div', { className: 'travel-metric-value', key: 'value' }, 
            `$${travelMetrics.summary?.totalCost ? Math.round(travelMetrics.summary.totalCost).toLocaleString() : 'N/A'}`
          ),
          React.createElement('div', { className: 'travel-metric-breakdown', key: 'breakdown' }, [
            React.createElement('div', { key: 'transport' }, 
              `Transportation: $${travelMetrics.breakdown?.transportation ? Math.round(travelMetrics.breakdown.transportation).toLocaleString() : '0'}`
            ),
            React.createElement('div', { key: 'accommodation' }, 
              `Accommodation: $${travelMetrics.breakdown?.accommodation ? Math.round(travelMetrics.breakdown.accommodation).toLocaleString() : '0'}`
            ),
            React.createElement('div', { key: 'meals' }, 
              `Meals: $${travelMetrics.breakdown?.meals ? Math.round(travelMetrics.breakdown.meals).toLocaleString() : '0'}`
            )
          ])
        ]),
        
        travelMetrics.summary?.savings && React.createElement('div', { className: 'travel-metric-card savings', key: 'savings' }, [
          React.createElement('h4', { key: 'title' }, 'Estimated Savings'),
          React.createElement('div', { className: 'travel-metric-value', key: 'value' }, 
            `$${Math.round(travelMetrics.summary.savings).toLocaleString()}`
          ),
          React.createElement('div', { className: 'travel-metric-note', key: 'note' }, 
            'Compared to non-optimized travel arrangements'
          )
        ]),
        
        React.createElement('div', { className: 'travel-metric-card', key: 'efficiency' }, [
          React.createElement('h4', { key: 'title' }, 'Travel Efficiency'),
          React.createElement('div', { className: 'travel-metric-value', key: 'value' }, 
            `${travelMetrics.summary?.efficiency ? Math.round(travelMetrics.summary.efficiency) : 85}%`
          ),
          React.createElement('div', { className: 'travel-metric-note', key: 'note' }, 
            'Route optimization and scheduling efficiency'
          )
        ])
      ]),
      
      React.createElement('div', { className: 'travel-recommendations', key: 'recommendations' }, [
        React.createElement('h4', { key: 'title' }, 'Optimization Recommendations'),
        React.createElement('ul', { key: 'list' }, [
          React.createElement('li', { key: 'main' }, travelMetrics.summary?.recommendation || 'Travel optimization complete'),
          travelMetrics.agents?.transport_mode_optimization && React.createElement('li', { key: 'transport' }, 
            `Transport: ${travelMetrics.agents.transport_mode_optimization.recommendation || 'Bus vs flight optimization applied'}`
          ),
          travelMetrics.agents?.circuit_optimization && React.createElement('li', { key: 'circuit' }, 
            `Circuit: ${travelMetrics.agents.circuit_optimization.recommendation || 'Geographic route clustering optimized'}`
          ),
          travelMetrics.agents?.seasonal_pricing && React.createElement('li', { key: 'seasonal' }, 
            `Timing: ${travelMetrics.agents.seasonal_pricing.recommendation || 'Seasonal pricing factors applied'}`
          )
        ].filter(Boolean))
      ])
    ])
  ]);

  return React.createElement('div', { className: 'schedule-analytics-panel' }, [
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

// Export components
window.CalendarScheduleView = CalendarScheduleView;
window.GanttScheduleView = GanttScheduleView;
window.MatrixScheduleView = MatrixScheduleView;
window.ScheduleAnalyticsPanel = ScheduleAnalyticsPanel;