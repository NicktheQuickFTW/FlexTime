/**
 * FlexTime FT Builder - Sidebar and Analytics Components
 * Advanced constraint management and real-time analytics
 */

// Left Sidebar - AI Controls & Constraints Management
function FTBuilderSidebar({ 
  selectedSport, 
  sportsConfig, 
  conflicts, 
  aiSuggestions, 
  compassScores,
  onConstraintChange,
  onApplySuggestion 
}) {
  const [activeTab, setActiveTab] = React.useState('constraints');
  const [generationProgress, setGenerationProgress] = React.useState(null);
  const [constraints, setConstraints] = React.useState({
    maxConsecutiveHome: 2,
    maxConsecutiveAway: 2,
    restDaysBetweenGames: 1,
    travelOptimization: true,
    homeAwayBalance: 0.5,
    rivalryProtection: true,
    tvWindowPreference: 'flexible',
    venueAvailability: 'auto'
  });

  const sportConfig = sportsConfig[selectedSport];

  return React.createElement('div', { className: 'schedule-builder-sidebar' }, [
    
    // Tab Navigation
    React.createElement('div', { className: 'sidebar-tabs', key: 'tabs' }, [
      React.createElement('button', {
        className: `tab-btn ${activeTab === 'constraints' ? 'active' : ''}`,
        onClick: () => setActiveTab('constraints'),
        key: 'constraints-tab'
      }, [
        React.createElement('span', { key: 'icon' }, '⚙'),
        React.createElement('span', { key: 'text' }, 'Constraints')
      ]),
      React.createElement('button', {
        className: `tab-btn ${activeTab === 'ai' ? 'active' : ''}`,
        onClick: () => setActiveTab('ai'),
        key: 'ai-tab'
      }, [
        React.createElement('span', { key: 'icon' }, '■'),
        React.createElement('span', { key: 'text' }, 'AI Control')
      ]),
      React.createElement('button', {
        className: `tab-btn ${activeTab === 'conflicts' ? 'active' : ''}`,
        onClick: () => setActiveTab('conflicts'),
        key: 'conflicts-tab'
      }, [
        React.createElement('span', { key: 'icon' }, '⚠'),
        React.createElement('span', { key: 'text' }, 'Issues'),
        (conflicts?.length || 0) > 0 && React.createElement('span', { className: 'tab-badge', key: 'badge' }, conflicts?.length || 0)
      ])
    ]),

    // Tab Content
    React.createElement('div', { className: 'sidebar-content', key: 'content' }, [
      
      // Constraints Tab
      activeTab === 'constraints' && React.createElement('div', { className: 'constraints-panel', key: 'constraints' }, [
        React.createElement('h3', { className: 'panel-title', key: 'title' }, [
          React.createElement('span', { key: 'icon' }, '⚙'),
          React.createElement('span', { key: 'text' }, `${sportConfig.name} Constraints`)
        ]),

        React.createElement('div', { className: 'constraint-groups', key: 'groups' }, [
          
          // Game Balance Constraints
          React.createElement('div', { className: 'constraint-group', key: 'balance' }, [
            React.createElement('h4', { className: 'group-title', key: 'title' }, 'Game Balance'),
            
            React.createElement(ConstraintSlider, {
              key: 'consecutive-home',
              label: 'Max Consecutive Home Games',
              value: constraints.maxConsecutiveHome,
              min: 1,
              max: 4,
              onChange: (value) => updateConstraint('maxConsecutiveHome', value)
            }),
            
            React.createElement(ConstraintSlider, {
              key: 'consecutive-away', 
              label: 'Max Consecutive Away Games',
              value: constraints.maxConsecutiveAway,
              min: 1,
              max: 4,
              onChange: (value) => updateConstraint('maxConsecutiveAway', value)
            }),
            
            React.createElement(ConstraintSlider, {
              key: 'home-away-balance',
              label: 'Home/Away Balance',
              value: constraints.homeAwayBalance,
              min: 0.3,
              max: 0.7,
              step: 0.1,
              format: (val) => `${Math.round(val * 100)}%`,
              onChange: (value) => updateConstraint('homeAwayBalance', value)
            })
          ]),

          // Rest and Recovery Constraints
          React.createElement('div', { className: 'constraint-group', key: 'rest' }, [
            React.createElement('h4', { className: 'group-title', key: 'title' }, 'Rest & Recovery'),
            
            React.createElement(ConstraintSlider, {
              key: 'rest-days',
              label: 'Minimum Rest Days',
              value: constraints.restDaysBetweenGames,
              min: 0,
              max: 7,
              onChange: (value) => updateConstraint('restDaysBetweenGames', value)
            })
          ]),

          // Travel Optimization
          React.createElement('div', { className: 'constraint-group', key: 'travel' }, [
            React.createElement('h4', { className: 'group-title', key: 'title' }, 'Travel & Logistics'),
            
            React.createElement(ConstraintToggle, {
              key: 'travel-optimization',
              label: 'AI Travel Optimization',
              description: 'Minimize total travel distance and costs',
              value: constraints.travelOptimization,
              onChange: (value) => updateConstraint('travelOptimization', value)
            }),
            
            React.createElement(ConstraintDropdown, {
              key: 'venue-availability',
              label: 'Venue Availability',
              value: constraints.venueAvailability,
              options: [
                { value: 'auto', label: 'Auto-detect' },
                { value: 'manual', label: 'Manual override' },
                { value: 'flexible', label: 'Flexible scheduling' }
              ],
              onChange: (value) => updateConstraint('venueAvailability', value)
            })
          ]),

          // Sport-Specific Constraints
          sportConfig.constraints && React.createElement('div', { className: 'constraint-group', key: 'sport-specific' }, [
            React.createElement('h4', { className: 'group-title', key: 'title' }, 'Sport-Specific Rules'),
            
            sportConfig.constraints.rivalryProtection && React.createElement(ConstraintToggle, {
              key: 'rivalry-protection',
              label: 'Rivalry Game Protection',
              description: 'Preserve traditional rivalry matchups',
              value: constraints.rivalryProtection,
              onChange: (value) => updateConstraint('rivalryProtection', value)
            }),
            
            sportConfig.constraints.tvWindows && React.createElement(ConstraintDropdown, {
              key: 'tv-windows',
              label: 'TV Window Preference',
              value: constraints.tvWindowPreference,
              options: [
                { value: 'flexible', label: 'Flexible' },
                { value: 'prime', label: 'Prime Time Preferred' },
                { value: 'afternoon', label: 'Afternoon Preferred' },
                { value: 'manual', label: 'Manual Assignment' }
              ],
              onChange: (value) => updateConstraint('tvWindowPreference', value)
            })
          ])
        ]),

        // Apply Constraints Button
        React.createElement('button', {
          className: 'btn-apply-constraints',
          onClick: handleApplyConstraints,
          key: 'apply'
        }, [
          React.createElement('span', { key: 'icon' }, '✓'),
          React.createElement('span', { key: 'text' }, 'Apply Constraints')
        ])
      ]),

      // AI Control Tab
      activeTab === 'ai' && React.createElement('div', { className: 'ai-control-panel', key: 'ai' }, [
        React.createElement('h3', { className: 'panel-title', key: 'title' }, [
          React.createElement('span', { key: 'icon' }, '■'),
          React.createElement('span', { key: 'text' }, 'AI Assistant')
        ]),

        // AI Suggestions
        React.createElement('div', { className: 'ai-suggestions-section', key: 'suggestions' }, [
          React.createElement('h4', { className: 'section-title', key: 'title' }, 'Smart Suggestions'),
          React.createElement('div', { className: 'suggestions-list', key: 'list' },
            (aiSuggestions?.length || 0) > 0 ? aiSuggestions.map((suggestion, index) =>
              React.createElement('div', { className: 'suggestion-card', key: index }, [
                React.createElement('div', { className: 'suggestion-header', key: 'header' }, [
                  React.createElement('span', { className: 'suggestion-type', key: 'type' }, suggestion.type),
                  React.createElement('span', { className: 'suggestion-confidence', key: 'confidence' }, `${suggestion.confidence}%`)
                ]),
                React.createElement('p', { className: 'suggestion-description', key: 'desc' }, suggestion.description),
                React.createElement('div', { className: 'suggestion-actions', key: 'actions' }, [
                  React.createElement('button', {
                    className: 'btn-apply-suggestion',
                    onClick: () => onApplySuggestion(suggestion),
                    key: 'apply'
                  }, 'Apply'),
                  React.createElement('button', {
                    className: 'btn-dismiss-suggestion',
                    onClick: () => dismissSuggestion(suggestion.id),
                    key: 'dismiss'
                  }, 'Dismiss')
                ])
              ])
            ) : React.createElement('div', { className: 'no-suggestions', key: 'empty' }, [
              React.createElement('span', { key: 'icon' }, '○'),
              React.createElement('span', { key: 'text' }, 'No suggestions available')
            ])
          )
        ]),

        // AI Actions
        React.createElement('div', { className: 'ai-actions-section', key: 'actions' }, [
          React.createElement('h4', { className: 'section-title', key: 'title' }, 'AI Actions'),
          React.createElement('div', { className: 'ai-action-buttons', key: 'buttons' }, [
            React.createElement('div', { className: 'generate-schedule-container', key: 'generate-container' }, [
              React.createElement('button', { 
                className: 'ai-action-btn primary', 
                key: 'generate',
                onClick: handleGenerateSchedule,
                disabled: generationProgress !== null
              }, [
                React.createElement('span', { key: 'icon' }, '◇'),
                React.createElement('span', { key: 'text' }, generationProgress ? 'Generating...' : 'Generate Schedule')
              ]),
              
              // Local progress bar for this button
              generationProgress && React.createElement('div', { className: 'button-progress-bar', key: 'progress' }, [
                React.createElement('div', { className: 'progress-track', key: 'track' }, [
                  React.createElement('div', { 
                    className: 'progress-fill-local',
                    style: { width: `${generationProgress.percentage}%` },
                    key: 'fill'
                  })
                ]),
                React.createElement('span', { className: 'progress-text-local', key: 'text' }, 
                  `${generationProgress.percentage}% - ${generationProgress.message}`
                )
              ])
            ]),
            React.createElement('button', { className: 'ai-action-btn secondary', key: 'optimize' }, [
              React.createElement('span', { key: 'icon' }, '●'),
              React.createElement('span', { key: 'text' }, 'Optimize Current')
            ]),
            React.createElement('button', { className: 'ai-action-btn secondary', key: 'analyze' }, [
              React.createElement('span', { key: 'icon' }, '▦'),
              React.createElement('span', { key: 'text' }, 'Analyze Quality')
            ]),
            React.createElement('button', { className: 'ai-action-btn secondary', key: 'predict' }, [
              React.createElement('span', { key: 'icon' }, '◇'),
              React.createElement('span', { key: 'text' }, 'Predict Outcomes')
            ])
          ])
        ])
      ]),

      // Conflicts Tab
      activeTab === 'conflicts' && React.createElement('div', { className: 'conflicts-panel', key: 'conflicts' }, [
        React.createElement('h3', { className: 'panel-title', key: 'title' }, [
          React.createElement('span', { key: 'icon' }, '⚠'),
          React.createElement('span', { key: 'text' }, 'Schedule Issues'),
          (conflicts?.length || 0) > 0 && React.createElement('span', { className: 'issue-count', key: 'count' }, conflicts?.length || 0)
        ]),

        React.createElement('div', { className: 'conflicts-list', key: 'list' },
          (conflicts?.length || 0) > 0 ? (conflicts || []).map((conflict, index) =>
            React.createElement('div', { className: `conflict-item ${conflict.severity}`, key: index }, [
              React.createElement('div', { className: 'conflict-header', key: 'header' }, [
                React.createElement('span', { className: 'conflict-icon', key: 'icon' }, 
                  conflict.severity === 'critical' ? '🚨' : 
                  conflict.severity === 'warning' ? '⚠️' : 'ℹ️'
                ),
                React.createElement('span', { className: 'conflict-type', key: 'type' }, conflict.type)
              ]),
              React.createElement('p', { className: 'conflict-description', key: 'desc' }, conflict.description),
              React.createElement('div', { className: 'conflict-details', key: 'details' }, [
                React.createElement('span', { className: 'conflict-teams', key: 'teams' }, 
                  `${conflict.teams.join(' vs ')}`
                ),
                React.createElement('span', { className: 'conflict-date', key: 'date' }, 
                  new Date(conflict.date).toLocaleDateString()
                )
              ]),
              React.createElement('div', { className: 'conflict-actions', key: 'actions' }, [
                React.createElement('button', {
                  className: 'btn-resolve-conflict',
                  onClick: () => resolveConflict(conflict.id),
                  key: 'resolve'
                }, 'Auto-Resolve'),
                React.createElement('button', {
                  className: 'btn-ignore-conflict',
                  onClick: () => ignoreConflict(conflict.id),
                  key: 'ignore'
                }, 'Ignore')
              ])
            ])
          ) : React.createElement('div', { className: 'no-conflicts', key: 'empty' }, [
            React.createElement('span', { key: 'icon' }, '✓'),
            React.createElement('span', { key: 'text' }, 'No conflicts detected')
          ])
        )
      ])
    ])
  ]);

  function updateConstraint(key, value) {
    const newConstraints = { ...constraints, [key]: value };
    setConstraints(newConstraints);
    onConstraintChange(key, value);
  }

  function handleApplyConstraints() {
    // Apply all constraints to the scheduling engine
    console.log('Applying constraints:', constraints);
  }

  async function handleGenerateSchedule() {
    try {
      // Start local progress
      setGenerationProgress({
        percentage: 0,
        message: 'Initializing schedule generation...'
      });

      // Also update global progress if available
      if (window.setScheduleGenerationProgress) {
        window.setScheduleGenerationProgress({
          percentage: 0,
          message: 'Initializing schedule generation...'
        });
      }

      // Step 1: Load team data
      const step1 = {
        percentage: 10,
        message: 'Loading team data and constraints...'
      };
      setGenerationProgress(step1);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(step1);
      await new Promise(resolve => setTimeout(resolve, 500));

      const teams = window.big12Teams || [
        'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
        'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
        'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
      ];

      // Step 2: Generate schedule matrix
      const step2 = {
        percentage: 25,
        message: 'Generating initial schedule matrix...'
      };
      setGenerationProgress(step2);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(step2);
      await new Promise(resolve => setTimeout(resolve, 800));

      const schedule = generateRoundRobinSchedule(teams, selectedSport);

      // Step 3: Optimize schedule
      const step3 = {
        percentage: 60,
        message: 'Optimizing travel distances and constraints...'
      };
      setGenerationProgress(step3);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(step3);
      await new Promise(resolve => setTimeout(resolve, 1000));

      const optimizedSchedule = optimizeSchedule(schedule, constraints);

      // Step 4: Apply constraints
      const step4 = {
        percentage: 90,
        message: 'Applying final constraints...'
      };
      setGenerationProgress(step4);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(step4);
      await new Promise(resolve => setTimeout(resolve, 700));

      // Step 5: Save to database
      const step5 = {
        percentage: 100,
        message: 'Saving schedule to database...'
      };
      setGenerationProgress(step5);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(step5);

      // Save to Neon DB if available
      if (window.NeonDB && window.NeonDB.isConnected) {
        await window.NeonDB.saveSchedule(selectedSport, '2024', optimizedSchedule);
      }

      // Update the active schedule in the ft builder
      if (window.updateActiveSchedule) {
        window.updateActiveSchedule(optimizedSchedule);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
      
      const finalStep = {
        percentage: 100,
        message: `Generated ${optimizedSchedule.length} games for ${selectedSport}!`
      };
      setGenerationProgress(finalStep);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(finalStep);

      // Clear progress after completion
      setTimeout(() => {
        setGenerationProgress(null);
        if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(null);
      }, 2000);

    } catch (error) {
      console.error('Schedule generation failed:', error);
      const errorStep = {
        percentage: 0,
        message: 'Schedule generation failed. Please try again.'
      };
      setGenerationProgress(errorStep);
      if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(errorStep);
      
      setTimeout(() => {
        setGenerationProgress(null);
        if (window.setScheduleGenerationProgress) window.setScheduleGenerationProgress(null);
      }, 3000);
    }
  }

  // Generate round-robin schedule
  function generateRoundRobinSchedule(teams, sport) {
    const games = [];
    const startDate = new Date('2024-09-01');
    let currentDate = new Date(startDate);
    
    // Generate all possible matchups
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        const homeTeam = teams[i];
        const awayTeam = teams[j];
        
        // Create home game
        games.push({
          id: `${homeTeam}-vs-${awayTeam}-${currentDate.toISOString().split('T')[0]}`,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          date: new Date(currentDate),
          time: getRandomGameTime(sport),
          venue: `${homeTeam} Stadium`,
          tv: getRandomTVNetwork(),
          week: Math.ceil(games.length / 8) + 1
        });
        
        // Advance date by 3-7 days
        currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 5) + 3);
        
        // Return game (away team hosts)
        games.push({
          id: `${awayTeam}-vs-${homeTeam}-${currentDate.toISOString().split('T')[0]}`,
          homeTeam: awayTeam,
          awayTeam: homeTeam,
          date: new Date(currentDate),
          time: getRandomGameTime(sport),
          venue: `${awayTeam} Stadium`,
          tv: getRandomTVNetwork(),
          week: Math.ceil(games.length / 8) + 1
        });
        
        currentDate.setDate(currentDate.getDate() + Math.floor(Math.random() * 5) + 3);
      }
    }
    
    return games;
  }

  // Optimize schedule based on constraints
  function optimizeSchedule(games, constraints) {
    let optimized = [...games];
    
    // Sort by date
    optimized.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Apply rest day constraints
    if (constraints.restDaysBetweenGames > 0) {
      optimized = applyRestDayConstraints(optimized, constraints.restDaysBetweenGames);
    }
    
    // Apply home/away balance
    if (constraints.homeAwayBalance) {
      optimized = balanceHomeAwayGames(optimized);
    }
    
    return optimized;
  }

  function applyRestDayConstraints(games, minRestDays) {
    // Simple implementation - ensure minimum rest between games for each team
    const teamLastGame = {};
    
    return games.filter(game => {
      const gameDate = new Date(game.date);
      const homeLastGame = teamLastGame[game.homeTeam];
      const awayLastGame = teamLastGame[game.awayTeam];
      
      let validGame = true;
      
      if (homeLastGame) {
        const daysDiff = (gameDate - homeLastGame) / (1000 * 60 * 60 * 24);
        if (daysDiff < minRestDays) validGame = false;
      }
      
      if (awayLastGame) {
        const daysDiff = (gameDate - awayLastGame) / (1000 * 60 * 60 * 24);
        if (daysDiff < minRestDays) validGame = false;
      }
      
      if (validGame) {
        teamLastGame[game.homeTeam] = gameDate;
        teamLastGame[game.awayTeam] = gameDate;
      }
      
      return validGame;
    });
  }

  function balanceHomeAwayGames(games) {
    // Simple rebalancing - alternate home/away when possible
    const teamStats = {};
    
    games.forEach(game => {
      if (!teamStats[game.homeTeam]) teamStats[game.homeTeam] = { home: 0, away: 0 };
      if (!teamStats[game.awayTeam]) teamStats[game.awayTeam] = { home: 0, away: 0 };
      
      teamStats[game.homeTeam].home++;
      teamStats[game.awayTeam].away++;
    });
    
    return games;
  }

  function getRandomGameTime(sport) {
    const times = {
      football: ['12:00 PM', '3:00 PM', '7:00 PM', '8:00 PM'],
      basketball: ['7:00 PM', '8:00 PM', '9:00 PM'],
      baseball: ['1:00 PM', '3:00 PM', '6:00 PM', '7:00 PM']
    };
    
    const sportTimes = times[sport.toLowerCase()] || times.football;
    return sportTimes[Math.floor(Math.random() * sportTimes.length)];
  }

  function getRandomTVNetwork() {
    const networks = ['ESPN', 'Fox', 'ABC', 'CBS', 'FS1', 'ESPN2', 'ESPNU'];
    return networks[Math.floor(Math.random() * networks.length)];
  }
}

// Constraint Input Components
function ConstraintSlider({ label, value, min, max, step = 1, format, onChange }) {
  const displayValue = format ? format(value) : value;
  
  return React.createElement('div', { className: 'constraint-slider' }, [
    React.createElement('div', { className: 'slider-header', key: 'header' }, [
      React.createElement('label', { className: 'slider-label', key: 'label' }, label),
      React.createElement('span', { className: 'slider-value', key: 'value' }, displayValue)
    ]),
    React.createElement('input', {
      type: 'range',
      min: min,
      max: max,
      step: step,
      value: value,
      onChange: (e) => onChange(parseFloat(e.target.value)),
      className: 'slider-input',
      key: 'input'
    })
  ]);
}

function ConstraintToggle({ label, description, value, onChange }) {
  return React.createElement('div', { className: 'constraint-toggle' }, [
    React.createElement('div', { className: 'toggle-content', key: 'content' }, [
      React.createElement('label', { className: 'toggle-label', key: 'label' }, label),
      description && React.createElement('p', { className: 'toggle-description', key: 'desc' }, description)
    ]),
    React.createElement('button', {
      className: `toggle-switch ${value ? 'active' : ''}`,
      onClick: () => onChange(!value),
      key: 'switch'
    }, [
      React.createElement('span', { className: 'toggle-slider', key: 'slider' })
    ])
  ]);
}

function ConstraintDropdown({ label, value, options, onChange }) {
  return React.createElement('div', { className: 'constraint-dropdown' }, [
    React.createElement('label', { className: 'dropdown-label', key: 'label' }, label),
    React.createElement('select', {
      value: value,
      onChange: (e) => onChange(e.target.value),
      className: 'dropdown-select',
      key: 'select'
    }, options.map(option =>
      React.createElement('option', { value: option.value, key: option.value }, option.label)
    ))
  ]);
}

// Right Panel - Analytics & Optimization
function ScheduleAnalyticsPanel({ 
  schedule, 
  teams, 
  compassScores, 
  optimizationMetrics, 
  conflicts,
  onRunAnalysis,
  onExportSchedule 
}) {
  const [activeAnalytics, setActiveAnalytics] = React.useState('overview');

  return React.createElement('div', { className: 'schedule-analytics-panel' }, [
    
    // Analytics Tabs
    React.createElement('div', { className: 'analytics-tabs', key: 'tabs' }, [
      React.createElement('button', {
        className: `analytics-tab ${activeAnalytics === 'overview' ? 'active' : ''}`,
        onClick: () => setActiveAnalytics('overview'),
        key: 'overview'
      }, 'Overview'),
      React.createElement('button', {
        className: `analytics-tab ${activeAnalytics === 'compass' ? 'active' : ''}`,
        onClick: () => setActiveAnalytics('compass'),
        key: 'compass'
      }, 'COMPASS'),
      React.createElement('button', {
        className: `analytics-tab ${activeAnalytics === 'export' ? 'active' : ''}`,
        onClick: () => setActiveAnalytics('export'),
        key: 'export'
      }, 'Export')
    ]),

    // Analytics Content
    React.createElement('div', { className: 'analytics-content', key: 'content' }, [
      
      // Overview Tab
      activeAnalytics === 'overview' && React.createElement('div', { className: 'overview-analytics', key: 'overview' }, [
        React.createElement('h3', { className: 'analytics-title', key: 'title' }, 'Schedule Quality'),
        
        // Quality Metrics
        React.createElement('div', { className: 'quality-metrics', key: 'metrics' }, [
          React.createElement(QualityMetric, {
            key: 'travel',
            label: 'Travel Efficiency',
            value: optimizationMetrics.travelEfficiency || 0,
            color: 'blue'
          }),
          React.createElement(QualityMetric, {
            key: 'balance',
            label: 'Home/Away Balance',
            value: optimizationMetrics.homeAwayBalance || 0,
            color: 'green'
          }),
          React.createElement(QualityMetric, {
            key: 'conflicts',
            label: 'Conflict Resolution',
            value: Math.max(0, 100 - ((conflicts?.length || 0) * 10)),
            color: (conflicts?.length || 0) > 0 ? 'red' : 'green'
          })
        ]),

        // Schedule Statistics
        React.createElement('div', { className: 'schedule-stats', key: 'stats' }, [
          React.createElement('h4', { className: 'stats-title', key: 'title' }, 'Statistics'),
          React.createElement('div', { className: 'stats-grid', key: 'grid' }, [
            React.createElement('div', { className: 'stat-item', key: 'games' }, [
              React.createElement('span', { className: 'stat-value', key: 'value' }, schedule?.games?.length || 0),
              React.createElement('span', { className: 'stat-label', key: 'label' }, 'Total Games')
            ]),
            React.createElement('div', { className: 'stat-item', key: 'weeks' }, [
              React.createElement('span', { className: 'stat-value', key: 'value' }, schedule?.duration || 0),
              React.createElement('span', { className: 'stat-label', key: 'label' }, 'Weeks')
            ]),
            React.createElement('div', { className: 'stat-item', key: 'venues' }, [
              React.createElement('span', { className: 'stat-value', key: 'value' }, teams?.length || 0),
              React.createElement('span', { className: 'stat-label', key: 'label' }, 'Venues')
            ])
          ])
        ])
      ]),

      // COMPASS Tab
      activeAnalytics === 'compass' && React.createElement('div', { className: 'compass-analytics', key: 'compass' }, [
        React.createElement('h3', { className: 'analytics-title', key: 'title' }, 'COMPASS Analysis'),
        
        React.createElement('div', { className: 'compass-scores', key: 'scores' },
          Object.entries(compassScores || {}).map(([team, scores]) =>
            React.createElement('div', { className: 'team-compass-card', key: team }, [
              React.createElement('div', { className: 'team-header', key: 'header' }, [
                React.createElement('span', { className: 'team-name', key: 'name' }, 
                  (teams || []).find(t => t.id === team)?.name || team
                ),
                React.createElement('span', { className: 'overall-score', key: 'score' }, 
                  Math.round(scores.overall || 0)
                )
              ]),
              React.createElement('div', { className: 'compass-breakdown', key: 'breakdown' }, [
                React.createElement('div', { className: 'compass-metric', key: 'performance' }, [
                  React.createElement('span', { key: 'label' }, 'Performance'),
                  React.createElement('span', { key: 'value' }, Math.round(scores.performance || 0))
                ]),
                React.createElement('div', { className: 'compass-metric', key: 'resources' }, [
                  React.createElement('span', { key: 'label' }, 'Resources'),
                  React.createElement('span', { key: 'value' }, Math.round(scores.resources || 0))
                ]),
                React.createElement('div', { className: 'compass-metric', key: 'balance' }, [
                  React.createElement('span', { key: 'label' }, 'Balance'),
                  React.createElement('span', { key: 'value' }, Math.round(scores.balance || 0))
                ])
              ])
            ])
          )
        )
      ]),

      // Export Tab
      activeAnalytics === 'export' && React.createElement('div', { className: 'export-analytics', key: 'export' }, [
        React.createElement('h3', { className: 'analytics-title', key: 'title' }, 'Export Schedule'),
        
        React.createElement('div', { className: 'export-options', key: 'options' }, [
          React.createElement('button', {
            className: 'export-btn',
            onClick: () => onExportSchedule('pdf'),
            key: 'pdf'
          }, [
            React.createElement('span', { key: 'icon' }, '▫'),
            React.createElement('span', { key: 'text' }, 'PDF Report')
          ]),
          React.createElement('button', {
            className: 'export-btn',
            onClick: () => onExportSchedule('excel'),
            key: 'excel'
          }, [
            React.createElement('span', { key: 'icon' }, '▦'),
            React.createElement('span', { key: 'text' }, 'Excel Spreadsheet')
          ]),
          React.createElement('button', {
            className: 'export-btn',
            onClick: () => onExportSchedule('calendar'),
            key: 'calendar'
          }, [
            React.createElement('span', { key: 'icon' }, '■'),
            React.createElement('span', { key: 'text' }, 'Calendar (ICS)')
          ]),
          React.createElement('button', {
            className: 'export-btn',
            onClick: () => onExportSchedule('json'),
            key: 'json'
          }, [
            React.createElement('span', { key: 'icon' }, '◇'),
            React.createElement('span', { key: 'text' }, 'JSON API')
          ])
        ])
      ])
    ])
  ]);
}

function QualityMetric({ label, value, icon, color }) {
  return React.createElement('div', { className: `quality-metric ${color}` }, [
    React.createElement('div', { className: 'metric-info', key: 'info' }, [
      React.createElement('span', { className: 'metric-value', key: 'value' }, `${Math.round(value)}%`),
      React.createElement('span', { className: 'metric-label', key: 'label' }, label)
    ]),
    React.createElement('div', { className: 'metric-progress', key: 'progress' }, [
      React.createElement('div', { 
        className: 'progress-fill',
        style: { width: `${value}%` },
        key: 'fill'
      })
    ])
  ]);
}

// Export components
window.FTBuilderSidebar = FTBuilderSidebar;
window.ScheduleAnalyticsPanel = ScheduleAnalyticsPanel;
window.ConstraintSlider = ConstraintSlider;
window.ConstraintToggle = ConstraintToggle;
window.ConstraintDropdown = ConstraintDropdown;
window.QualityMetric = QualityMetric;