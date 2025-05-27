const { useState, useEffect } = React;


function TeamCard({ team, index }) {
  return React.createElement('div', {
    className: 'team-card',
    style: { animationDelay: `${index * 0.1}s` }
  }, [
    React.createElement('div', { className: 'team-logo', key: 'logo' }, [
      React.createElement('img', {
        src: team.logo,
        alt: `${team.name} logo`,
        key: 'img',
        onError: (e) => {
          e.target.src = '/assets/logos/conferences/big_12_primary.svg';
        }
      })
    ]),
    React.createElement('h3', { key: 'name' }, team.name),
    React.createElement('p', { className: 'team-abbr', key: 'abbr' }, team.abbreviation)
  ]);
}

function StandingsSection() {
  const [currentSport, setCurrentSport] = useState(0);
  
  const sportsData = [
    {
      name: 'SOFTBALL',
      standings: [
        { rank: 1, team: 'Texas Tech', abbr: 'TTU', conf: '20-4', overall: '50-12' },
        { rank: 2, team: 'Arizona', abbr: 'ARIZ', conf: '17-7', overall: '48-13' },
        { rank: 3, team: 'Iowa State', abbr: 'ISU', conf: '15-9', overall: '31-23' },
        { rank: 4, team: 'Oklahoma State', abbr: 'OKST', conf: '13-9', overall: '35-20' },
        { rank: 5, team: 'Arizona State', abbr: 'ASU', conf: '14-10', overall: '35-21' },
        { rank: 6, team: 'BYU', abbr: 'BYU', conf: '13-11', overall: '32-17' },
        { rank: 7, team: 'UCF', abbr: 'UCF', conf: '12-12', overall: '35-24-1' },
        { rank: 8, team: 'Baylor', abbr: 'BAY', conf: '11-13', overall: '27-27' },
        { rank: 9, team: 'Kansas', abbr: 'KU', conf: '6-18', overall: '22-28' },
        { rank: 10, team: 'Utah', abbr: 'UTAH', conf: '5-19', overall: '13-40' },
        { rank: 11, team: 'Houston', abbr: 'HOU', conf: '4-18', overall: '22-25' }
      ]
    },
    {
      name: 'BASEBALL',
      standings: [
        { rank: 1, team: 'Arizona', abbr: 'ARIZ', conf: '18-6', overall: '42-15' },
        { rank: 2, team: 'TCU', abbr: 'TCU', conf: '17-7', overall: '40-17' },
        { rank: 3, team: 'Texas Tech', abbr: 'TTU', conf: '16-8', overall: '38-19' },
        { rank: 4, team: 'West Virginia', abbr: 'WVU', conf: '15-9', overall: '35-22' },
        { rank: 5, team: 'Oklahoma State', abbr: 'OKST', conf: '14-10', overall: '33-24' },
        { rank: 6, team: 'BYU', abbr: 'BYU', conf: '13-11', overall: '30-25' },
        { rank: 7, team: 'Kansas', abbr: 'KU', conf: '12-12', overall: '28-27' },
        { rank: 8, team: 'Baylor', abbr: 'BAY', conf: '11-13', overall: '26-29' },
        { rank: 9, team: 'Cincinnati', abbr: 'CIN', conf: '10-14', overall: '24-31' },
        { rank: 10, team: 'Houston', abbr: 'HOU', conf: '9-15', overall: '22-33' },
        { rank: 11, team: 'UCF', abbr: 'UCF', conf: '8-16', overall: '20-35' },
        { rank: 12, team: 'Kansas State', abbr: 'KSU', conf: '7-17', overall: '18-37' },
        { rank: 13, team: 'Iowa State', abbr: 'ISU', conf: '6-18', overall: '16-39' },
        { rank: 14, team: 'Utah', abbr: 'UTAH', conf: '5-19', overall: '14-41' }
      ]
    },
    {
      name: 'BASKETBALL',
      standings: [
        { rank: 1, team: 'Houston', abbr: 'HOU', conf: '15-3', overall: '32-5' },
        { rank: 2, team: 'Iowa State', abbr: 'ISU', conf: '14-4', overall: '29-8' },
        { rank: 3, team: 'Kansas', abbr: 'KU', conf: '13-5', overall: '28-9' },
        { rank: 4, team: 'Baylor', abbr: 'BAY', conf: '12-6', overall: '26-11' },
        { rank: 5, team: 'TCU', abbr: 'TCU', conf: '11-7', overall: '24-13' },
        { rank: 6, team: 'Texas Tech', abbr: 'TTU', conf: '10-8', overall: '23-14' },
        { rank: 7, team: 'Oklahoma State', abbr: 'OKST', conf: '9-9', overall: '22-15' },
        { rank: 8, team: 'BYU', abbr: 'BYU', conf: '8-10', overall: '21-16' },
        { rank: 9, team: 'Cincinnati', abbr: 'CIN', conf: '7-11', overall: '20-17' },
        { rank: 10, team: 'Kansas State', abbr: 'KSU', conf: '6-12', overall: '19-18' },
        { rank: 11, team: 'West Virginia', abbr: 'WVU', conf: '5-13', overall: '18-19' },
        { rank: 12, team: 'UCF', abbr: 'UCF', conf: '4-14', overall: '17-20' },
        { rank: 13, team: 'Colorado', abbr: 'COL', conf: '3-15', overall: '16-21' },
        { rank: 14, team: 'Arizona', abbr: 'ARIZ', conf: '2-16', overall: '15-22' },
        { rank: 15, team: 'Arizona State', abbr: 'ASU', conf: '1-17', overall: '14-23' },
        { rank: 16, team: 'Utah', abbr: 'UTAH', conf: '0-18', overall: '13-24' }
      ]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSport(prev => (prev + 1) % sportsData.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return React.createElement('div', { className: 'standings-section-compact' }, [
    React.createElement('h3', { className: 'standings-title', key: 'title' }, 'STANDINGS'),
    React.createElement('div', { className: 'standings-scroll-container', key: 'scroll-container' }, [
      React.createElement('div', { 
        className: 'standings-scroll-track', 
        key: 'scroll-track',
        style: { transform: `translateX(-${currentSport * 33.333}%)` }
      }, 
        sportsData.map((sport, index) =>
          React.createElement('div', { 
            className: 'standings-sport-card', 
            key: sport.name 
          }, [
            React.createElement('div', { className: 'sport-header', key: 'header' }, [
              React.createElement('h4', { className: 'sport-name', key: 'name' }, sport.name),
              React.createElement('div', { className: 'sport-indicators', key: 'indicators' }, 
                sportsData.map((_, dotIndex) => 
                  React.createElement('div', {
                    key: dotIndex,
                    className: `sport-dot ${dotIndex === currentSport ? 'active' : ''}`,
                    onClick: () => setCurrentSport(dotIndex)
                  })
                )
              )
            ]),
            React.createElement('div', { className: 'standings-compact-container', key: 'container' }, [
              React.createElement('div', { className: 'standings-compact-table', key: 'table' },
                sport.standings.map(team =>
                  React.createElement('div', { 
                    className: `standings-row ${team.rank === 1 ? 'first-place' : ''}`, 
                    key: team.rank 
                  }, [
                    React.createElement('span', { className: 'rank', key: 'rank' }, team.rank),
                    React.createElement('div', { className: 'team-info', key: 'team' }, [
                      React.createElement('span', { className: 'team-abbr', key: 'abbr' }, team.abbr),
                      React.createElement('span', { className: 'team-name', key: 'name' }, team.team)
                    ]),
                    React.createElement('span', { className: 'record', key: 'conf' }, team.conf),
                    React.createElement('span', { className: 'record overall', key: 'overall' }, team.overall)
                  ])
                )
              )
            ])
          ])
        )
      )
    ])
  ]);
}

function RecentScoresSection() {
  const [scrollIndex, setScrollIndex] = React.useState(0);
  const recentScores = [
    { team1: 'Arizona', team1Abbr: 'ARIZ', score1: '8', team2: 'TCU', team2Abbr: 'TCU', score2: '3', sport: 'Baseball', status: 'Final' },
    { team1: 'Texas Tech', team1Abbr: 'TTU', score1: '6', team2: 'Baylor', team2Abbr: 'BAY', score2: '2', sport: 'Softball', status: 'Final' },
    { team1: 'Houston', team1Abbr: 'HOU', score1: '78', team2: 'Kansas', team2Abbr: 'KU', score2: '65', sport: 'Basketball', status: 'Final' },
    { team1: 'Iowa State', team1Abbr: 'ISU', score1: '4', team2: 'Oklahoma State', team2Abbr: 'OKST', score2: '1', sport: 'Baseball', status: 'Final' },
    { team1: 'BYU', team1Abbr: 'BYU', score1: '2', team2: 'Utah', team2Abbr: 'UTAH', score2: '5', sport: 'Softball', status: 'Final' },
    { team1: 'West Virginia', team1Abbr: 'WVU', score1: '91', team2: 'Cincinnati', team2Abbr: 'CIN', score2: '88', sport: 'Basketball', status: 'Final' }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setScrollIndex(prev => (prev + 1) % recentScores.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return React.createElement('div', { className: 'scores-section' }, [
    React.createElement('h3', { className: 'scores-title', key: 'title' }, 'RECENT SCORES'),
    React.createElement('div', { className: 'scores-container', key: 'container' }, [
      React.createElement('div', { className: 'scores-list', key: 'list' },
        recentScores.slice(scrollIndex, scrollIndex + 4).concat(
          scrollIndex + 4 > recentScores.length ? recentScores.slice(0, (scrollIndex + 4) % recentScores.length) : []
        ).map((game, index) =>
          React.createElement('div', { className: 'score-item-compact', key: index }, [
            React.createElement('div', { className: 'score-teams-compact', key: 'teams' }, [
              React.createElement('div', { className: 'team-score-compact', key: 'team1' }, [
                React.createElement('span', { className: 'team-abbr-tiny', key: 'abbr1' }, game.team1Abbr),
                React.createElement('span', { className: 'score-tiny', key: 'score1' }, game.score1)
              ]),
              React.createElement('span', { className: 'vs-tiny', key: 'vs' }, 'vs'),
              React.createElement('div', { className: 'team-score-compact', key: 'team2' }, [
                React.createElement('span', { className: 'team-abbr-tiny', key: 'abbr2' }, game.team2Abbr),
                React.createElement('span', { className: 'score-tiny', key: 'score2' }, game.score2)
              ])
            ]),
            React.createElement('div', { className: 'game-info-compact', key: 'info' }, [
              React.createElement('span', { className: 'sport-tag-tiny', key: 'sport' }, game.sport),
              React.createElement('span', { className: 'game-status-tiny', key: 'status' }, game.status)
            ])
          ])
        )
      )
    ])
  ]);
}

function UpcomingGamesSection() {
  const [scrollIndex, setScrollIndex] = React.useState(0);
  const upcomingGames = [
    { team1: 'Kansas State', team1Abbr: 'KSU', team2: 'Colorado', team2Abbr: 'COL', sport: 'Baseball', status: '7:00 PM', date: 'Today' },
    { team1: 'Arizona State', team1Abbr: 'ASU', team2: 'UCF', team2Abbr: 'UCF', sport: 'Basketball', status: '8:30 PM', date: 'Today' },
    { team1: 'Oklahoma State', team1Abbr: 'OKST', team2: 'Kansas', team2Abbr: 'KU', sport: 'Softball', status: '6:30 PM', date: 'Tomorrow' },
    { team1: 'Baylor', team1Abbr: 'BAY', team2: 'Texas Tech', team2Abbr: 'TTU', sport: 'Baseball', status: '7:30 PM', date: 'Tomorrow' },
    { team1: 'Cincinnati', team1Abbr: 'CIN', team2: 'Houston', team2Abbr: 'HOU', sport: 'Basketball', status: '9:00 PM', date: 'Tomorrow' },
    { team1: 'Utah', team1Abbr: 'UTAH', team2: 'Arizona', team2Abbr: 'ARIZ', sport: 'Softball', status: '5:00 PM', date: 'Wed' }
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setScrollIndex(prev => (prev + 1) % upcomingGames.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return React.createElement('div', { className: 'upcoming-section' }, [
    React.createElement('h3', { className: 'upcoming-title', key: 'title' }, 'UPCOMING GAMES'),
    React.createElement('div', { className: 'upcoming-container', key: 'container' }, [
      React.createElement('div', { className: 'upcoming-list', key: 'list' },
        upcomingGames.slice(scrollIndex, scrollIndex + 4).concat(
          scrollIndex + 4 > upcomingGames.length ? upcomingGames.slice(0, (scrollIndex + 4) % upcomingGames.length) : []
        ).map((game, index) =>
          React.createElement('div', { className: 'upcoming-item-compact', key: index }, [
            React.createElement('div', { className: 'upcoming-teams-compact', key: 'teams' }, [
              React.createElement('span', { className: 'team-abbr-tiny', key: 'abbr1' }, game.team1Abbr),
              React.createElement('span', { className: 'vs-tiny', key: 'vs' }, 'vs'),
              React.createElement('span', { className: 'team-abbr-tiny', key: 'abbr2' }, game.team2Abbr)
            ]),
            React.createElement('div', { className: 'upcoming-info-compact', key: 'info' }, [
              React.createElement('span', { className: 'sport-tag-tiny', key: 'sport' }, game.sport),
              React.createElement('span', { className: 'game-time-tiny', key: 'time' }, game.status),
              React.createElement('span', { className: 'game-date-tiny', key: 'date' }, game.date)
            ])
          ])
        )
      )
    ])
  ]);
}

function AgentStatusIndicator() {
  const [generationProgress, setGenerationProgress] = React.useState(null);

  // Make the progress state available globally
  React.useEffect(() => {
    window.setScheduleGenerationProgress = setGenerationProgress;
    return () => {
      delete window.setScheduleGenerationProgress;
    };
  }, []);

  return React.createElement('div', { className: 'agent-status-bar' }, [
    React.createElement('div', { className: 'status-content', key: 'content' }, [
      // Schedule Generation Progress
      generationProgress && React.createElement('div', { className: 'status-item progress-item', key: 'progress' }, [
        React.createElement('div', { className: 'status-dot processing', key: 'dot' }),
        React.createElement('span', { className: 'progress-text', key: 'text' }, generationProgress.message),
        React.createElement('div', { className: 'progress-bar', key: 'bar' }, [
          React.createElement('div', { 
            className: 'progress-fill',
            style: { width: `${generationProgress.percentage}%` },
            key: 'fill'
          }),
          React.createElement('span', { className: 'progress-percentage', key: 'percent' }, `${generationProgress.percentage}%`)
        ])
      ]),
      
      // Default status items (only show when not generating)
      !generationProgress && React.createElement('div', { className: 'status-item', key: 'item1' }, [
        React.createElement('div', { className: 'status-dot active', key: 'dot1' }),
        React.createElement('span', { key: 'text1' }, 'AI Scheduling Agent: Ready')
      ]),
      !generationProgress && React.createElement('div', { className: 'status-item', key: 'item2' }, [
        React.createElement('div', { className: 'status-dot active', key: 'dot2' }),
        React.createElement('span', { key: 'text2' }, 'Multi-agent AI system continuously optimizing schedules across all Big 12 sports')
      ])
    ])
  ]);
}

function SettingsPage({ user }) {
  const [settings, setSettings] = React.useState({
    // General Settings
    theme: 'dark',
    autoSave: true,
    notifications: true,
    compactView: false,
    
    // Database Settings
    dbConnectionTimeout: 30,
    cacheEnabled: true,
    cacheExpiry: 3600,
    
    // Scheduling Settings
    defaultSport: 'football',
    defaultSeason: '2024',
    maxGamesPerDay: 8,
    minRestDays: 1,
    
    // AI Settings
    aiAssistance: true,
    autoOptimization: false,
    suggestionConfidence: 75,
    
    // Export Settings
    defaultExportFormat: 'pdf',
    includeLogos: true,
    includeStats: true,
    
    // Advanced Settings
    debugMode: false,
    apiTimeout: 10000,
    batchSize: 100
  });

  const [activeTab, setActiveTab] = React.useState('general');
  const [hasChanges, setHasChanges] = React.useState(false);

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
    
    // Apply theme change immediately
    if (key === 'theme') {
      document.documentElement.setAttribute('data-theme', value);
    }
  };

  const saveSettings = async () => {
    try {
      // Save to database if user is authenticated
      if (user) {
        const response = await fetch('/api/user/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(settings)
        });

        if (response.ok) {
          setHasChanges(false);
          console.log('✅ Settings saved to database');
          return;
        }
      }
      
      // Fallback to localStorage if not authenticated or database failed
      localStorage.setItem('flextime-settings', JSON.stringify(settings));
      setHasChanges(false);
      console.log('📱 Settings saved to localStorage');
    } catch (error) {
      console.error('Error saving settings:', error);
      // Fallback to localStorage on error
      localStorage.setItem('flextime-settings', JSON.stringify(settings));
      setHasChanges(false);
      console.log('⚠️ Settings saved to localStorage (database error)');
    }
  };

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      autoSave: true,
      notifications: true,
      compactView: false,
      dbConnectionTimeout: 30,
      cacheEnabled: true,
      cacheExpiry: 3600,
      defaultSport: 'football',
      defaultSeason: '2024',
      maxGamesPerDay: 8,
      minRestDays: 1,
      aiAssistance: true,
      autoOptimization: false,
      suggestionConfidence: 75,
      defaultExportFormat: 'pdf',
      includeLogos: true,
      includeStats: true,
      debugMode: false,
      apiTimeout: 10000,
      batchSize: 100
    };
    setSettings(defaultSettings);
    setHasChanges(true);
  };

  // Load settings on component mount
  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        // Try to load from database if user is authenticated
        if (user) {
          const response = await fetch('/api/user/settings', {
            credentials: 'include'
          });
          if (response.ok) {
            const userSettings = await response.json();
            setSettings(userSettings);
            // Apply theme immediately
            document.documentElement.setAttribute('data-theme', userSettings.theme || 'dark');
            console.log('✅ Settings loaded from database');
            return;
          }
        }
        
        // Fallback to localStorage
        const savedSettings = localStorage.getItem('flextime-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setSettings(parsedSettings);
          // Apply theme immediately
          document.documentElement.setAttribute('data-theme', parsedSettings.theme || 'dark');
          console.log('📱 Settings loaded from localStorage');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        // Fallback to localStorage on error
        const savedSettings = localStorage.getItem('flextime-settings');
        if (savedSettings) {
          try {
            setSettings(JSON.parse(savedSettings));
          } catch (parseError) {
            console.error('Error parsing saved settings:', parseError);
          }
        }
      }
    };
    
    loadSettings();
  }, [user]);

  return React.createElement('div', { className: 'content-section settings-section' }, [
    React.createElement('div', { className: 'section-header', key: 'header' }, [
      React.createElement('h1', { className: 'section-title', key: 'title' }, 'Settings'),
      React.createElement('p', { className: 'section-description', key: 'desc' }, 'Configure FlexTime preferences and system settings')
    ]),

    React.createElement('div', { className: 'settings-container', key: 'container' }, [
      // Settings Navigation
      React.createElement('div', { className: 'settings-nav', key: 'nav' }, [
        React.createElement('button', {
          className: `settings-nav-btn ${activeTab === 'general' ? 'active' : ''}`,
          onClick: () => setActiveTab('general'),
          key: 'general'
        }, [
          React.createElement('span', { key: 'icon' }, '⚙️'),
          React.createElement('span', { key: 'text' }, 'General')
        ]),
        React.createElement('button', {
          className: `settings-nav-btn ${activeTab === 'database' ? 'active' : ''}`,
          onClick: () => setActiveTab('database'),
          key: 'database'
        }, [
          React.createElement('span', { key: 'icon' }, '🗄️'),
          React.createElement('span', { key: 'text' }, 'Database')
        ]),
        React.createElement('button', {
          className: `settings-nav-btn ${activeTab === 'scheduling' ? 'active' : ''}`,
          onClick: () => setActiveTab('scheduling'),
          key: 'scheduling'
        }, [
          React.createElement('span', { key: 'icon' }, '📅'),
          React.createElement('span', { key: 'text' }, 'Scheduling')
        ]),
        React.createElement('button', {
          className: `settings-nav-btn ${activeTab === 'ai' ? 'active' : ''}`,
          onClick: () => setActiveTab('ai'),
          key: 'ai'
        }, [
          React.createElement('span', { key: 'icon' }, '🤖'),
          React.createElement('span', { key: 'text' }, 'AI & Automation')
        ]),
        React.createElement('button', {
          className: `settings-nav-btn ${activeTab === 'export' ? 'active' : ''}`,
          onClick: () => setActiveTab('export'),
          key: 'export'
        }, [
          React.createElement('span', { key: 'icon' }, '📤'),
          React.createElement('span', { key: 'text' }, 'Export')
        ]),
        React.createElement('button', {
          className: `settings-nav-btn ${activeTab === 'advanced' ? 'active' : ''}`,
          onClick: () => setActiveTab('advanced'),
          key: 'advanced'
        }, [
          React.createElement('span', { key: 'icon' }, '⚡'),
          React.createElement('span', { key: 'text' }, 'Advanced')
        ])
      ]),

      // Settings Content
      React.createElement('div', { className: 'settings-content', key: 'content' }, [
        
        // General Settings
        activeTab === 'general' && React.createElement('div', { className: 'settings-panel', key: 'general' }, [
          React.createElement('h2', { className: 'panel-title', key: 'title' }, 'General Settings'),
          
          React.createElement(SettingGroup, {
            key: 'appearance',
            title: 'Appearance',
            children: [
              React.createElement(SettingToggle, {
                key: 'theme',
                label: 'Dark Mode',
                description: 'Use dark theme for better viewing in low light',
                value: settings.theme === 'dark',
                onChange: (value) => updateSetting('theme', value ? 'dark' : 'light')
              }),
              React.createElement(SettingToggle, {
                key: 'compact',
                label: 'Compact View',
                description: 'Show more information in less space',
                value: settings.compactView,
                onChange: (value) => updateSetting('compactView', value)
              })
            ]
          }),

          React.createElement(SettingGroup, {
            key: 'behavior',
            title: 'Behavior',
            children: [
              React.createElement(SettingToggle, {
                key: 'autosave',
                label: 'Auto Save',
                description: 'Automatically save changes as you work',
                value: settings.autoSave,
                onChange: (value) => updateSetting('autoSave', value)
              }),
              React.createElement(SettingToggle, {
                key: 'notifications',
                label: 'Notifications',
                description: 'Show system notifications and alerts',
                value: settings.notifications,
                onChange: (value) => updateSetting('notifications', value)
              })
            ]
          })
        ]),

        // Database Settings
        activeTab === 'database' && React.createElement('div', { className: 'settings-panel', key: 'database' }, [
          React.createElement('h2', { className: 'panel-title', key: 'title' }, 'Database Settings'),
          
          React.createElement(SettingGroup, {
            key: 'connection',
            title: 'Connection',
            children: [
              React.createElement(SettingSlider, {
                key: 'timeout',
                label: 'Connection Timeout',
                description: 'Database connection timeout in seconds',
                value: settings.dbConnectionTimeout,
                min: 5,
                max: 120,
                unit: 'seconds',
                onChange: (value) => updateSetting('dbConnectionTimeout', value)
              })
            ]
          }),

          React.createElement(SettingGroup, {
            key: 'caching',
            title: 'Caching',
            children: [
              React.createElement(SettingToggle, {
                key: 'cache',
                label: 'Enable Caching',
                description: 'Cache database results for better performance',
                value: settings.cacheEnabled,
                onChange: (value) => updateSetting('cacheEnabled', value)
              }),
              React.createElement(SettingSlider, {
                key: 'expiry',
                label: 'Cache Expiry',
                description: 'How long to keep cached data',
                value: settings.cacheExpiry,
                min: 300,
                max: 7200,
                unit: 'seconds',
                onChange: (value) => updateSetting('cacheExpiry', value)
              })
            ]
          })
        ]),

        // Scheduling Settings
        activeTab === 'scheduling' && React.createElement('div', { className: 'settings-panel', key: 'scheduling' }, [
          React.createElement('h2', { className: 'panel-title', key: 'title' }, 'Scheduling Settings'),
          
          React.createElement(SettingGroup, {
            key: 'defaults',
            title: 'Defaults',
            children: [
              React.createElement(SettingDropdown, {
                key: 'sport',
                label: 'Default Sport',
                description: 'Sport to show when opening the scheduler',
                value: settings.defaultSport,
                options: [
                  { value: 'football', label: 'Football' },
                  { value: 'basketball', label: 'Basketball' },
                  { value: 'baseball', label: 'Baseball' },
                  { value: 'soccer', label: 'Soccer' }
                ],
                onChange: (value) => updateSetting('defaultSport', value)
              }),
              React.createElement(SettingDropdown, {
                key: 'season',
                label: 'Default Season',
                description: 'Season to show by default',
                value: settings.defaultSeason,
                options: [
                  { value: '2024', label: '2024-25' },
                  { value: '2025', label: '2025-26' },
                  { value: '2026', label: '2026-27' }
                ],
                onChange: (value) => updateSetting('defaultSeason', value)
              })
            ]
          }),

          React.createElement(SettingGroup, {
            key: 'constraints',
            title: 'Scheduling Constraints',
            children: [
              React.createElement(SettingSlider, {
                key: 'maxgames',
                label: 'Max Games Per Day',
                description: 'Maximum number of games scheduled on a single day',
                value: settings.maxGamesPerDay,
                min: 1,
                max: 16,
                unit: 'games',
                onChange: (value) => updateSetting('maxGamesPerDay', value)
              }),
              React.createElement(SettingSlider, {
                key: 'restdays',
                label: 'Minimum Rest Days',
                description: 'Minimum days of rest between games for teams',
                value: settings.minRestDays,
                min: 0,
                max: 7,
                unit: 'days',
                onChange: (value) => updateSetting('minRestDays', value)
              })
            ]
          })
        ]),

        // AI Settings
        activeTab === 'ai' && React.createElement('div', { className: 'settings-panel', key: 'ai' }, [
          React.createElement('h2', { className: 'panel-title', key: 'title' }, 'AI & Automation Settings'),
          
          React.createElement(SettingGroup, {
            key: 'assistance',
            title: 'AI Assistance',
            children: [
              React.createElement(SettingToggle, {
                key: 'ai',
                label: 'Enable AI Assistance',
                description: 'Use AI to help with scheduling decisions',
                value: settings.aiAssistance,
                onChange: (value) => updateSetting('aiAssistance', value)
              }),
              React.createElement(SettingToggle, {
                key: 'auto',
                label: 'Auto Optimization',
                description: 'Automatically optimize schedules in the background',
                value: settings.autoOptimization,
                onChange: (value) => updateSetting('autoOptimization', value)
              })
            ]
          }),

          React.createElement(SettingGroup, {
            key: 'suggestions',
            title: 'Suggestions',
            children: [
              React.createElement(SettingSlider, {
                key: 'confidence',
                label: 'Suggestion Confidence Threshold',
                description: 'Minimum confidence level for showing AI suggestions',
                value: settings.suggestionConfidence,
                min: 50,
                max: 95,
                unit: '%',
                onChange: (value) => updateSetting('suggestionConfidence', value)
              })
            ]
          })
        ]),

        // Export Settings
        activeTab === 'export' && React.createElement('div', { className: 'settings-panel', key: 'export' }, [
          React.createElement('h2', { className: 'panel-title', key: 'title' }, 'Export Settings'),
          
          React.createElement(SettingGroup, {
            key: 'format',
            title: 'Default Format',
            children: [
              React.createElement(SettingDropdown, {
                key: 'format',
                label: 'Export Format',
                description: 'Default format for schedule exports',
                value: settings.defaultExportFormat,
                options: [
                  { value: 'pdf', label: 'PDF Document' },
                  { value: 'excel', label: 'Excel Spreadsheet' },
                  { value: 'csv', label: 'CSV File' },
                  { value: 'json', label: 'JSON Data' }
                ],
                onChange: (value) => updateSetting('defaultExportFormat', value)
              })
            ]
          }),

          React.createElement(SettingGroup, {
            key: 'content',
            title: 'Export Content',
            children: [
              React.createElement(SettingToggle, {
                key: 'logos',
                label: 'Include Team Logos',
                description: 'Add team logos to exported schedules',
                value: settings.includeLogos,
                onChange: (value) => updateSetting('includeLogos', value)
              }),
              React.createElement(SettingToggle, {
                key: 'stats',
                label: 'Include Statistics',
                description: 'Add schedule statistics and analytics',
                value: settings.includeStats,
                onChange: (value) => updateSetting('includeStats', value)
              })
            ]
          })
        ]),

        // Advanced Settings
        activeTab === 'advanced' && React.createElement('div', { className: 'settings-panel', key: 'advanced' }, [
          React.createElement('h2', { className: 'panel-title', key: 'title' }, 'Advanced Settings'),
          
          React.createElement(SettingGroup, {
            key: 'development',
            title: 'Development',
            children: [
              React.createElement(SettingToggle, {
                key: 'debug',
                label: 'Debug Mode',
                description: 'Enable detailed logging and debug information',
                value: settings.debugMode,
                onChange: (value) => updateSetting('debugMode', value)
              })
            ]
          }),

          React.createElement(SettingGroup, {
            key: 'performance',
            title: 'Performance',
            children: [
              React.createElement(SettingSlider, {
                key: 'timeout',
                label: 'API Timeout',
                description: 'Timeout for API requests in milliseconds',
                value: settings.apiTimeout,
                min: 5000,
                max: 30000,
                unit: 'ms',
                onChange: (value) => updateSetting('apiTimeout', value)
              }),
              React.createElement(SettingSlider, {
                key: 'batch',
                label: 'Batch Size',
                description: 'Number of items to process in each batch',
                value: settings.batchSize,
                min: 10,
                max: 500,
                unit: 'items',
                onChange: (value) => updateSetting('batchSize', value)
              })
            ]
          })
        ])
      ]),

      // Settings Actions
      React.createElement('div', { className: 'settings-actions', key: 'actions' }, [
        React.createElement('button', {
          className: 'btn-reset',
          onClick: resetSettings,
          key: 'reset'
        }, 'Reset to Defaults'),
        React.createElement('button', {
          className: `btn-save ${hasChanges ? 'has-changes' : ''}`,
          onClick: saveSettings,
          disabled: !hasChanges,
          key: 'save'
        }, hasChanges ? 'Save Changes' : 'No Changes')
      ])
    ])
  ]);
}

// Settings Components
function SettingGroup({ title, children }) {
  return React.createElement('div', { className: 'setting-group' }, [
    React.createElement('h3', { className: 'group-title', key: 'title' }, title),
    React.createElement('div', { className: 'group-content', key: 'content' }, children)
  ]);
}

function SettingToggle({ label, description, value, onChange }) {
  return React.createElement('div', { className: 'setting-item toggle-setting' }, [
    React.createElement('div', { className: 'setting-info', key: 'info' }, [
      React.createElement('label', { className: 'setting-label', key: 'label' }, label),
      React.createElement('p', { className: 'setting-description', key: 'desc' }, description)
    ]),
    React.createElement('button', {
      className: `toggle-switch ${value ? 'active' : ''}`,
      onClick: () => onChange(!value),
      key: 'toggle'
    }, [
      React.createElement('span', { className: 'toggle-slider', key: 'slider' })
    ])
  ]);
}

function SettingSlider({ label, description, value, min, max, unit, onChange }) {
  return React.createElement('div', { className: 'setting-item slider-setting' }, [
    React.createElement('div', { className: 'setting-info', key: 'info' }, [
      React.createElement('label', { className: 'setting-label', key: 'label' }, label),
      React.createElement('p', { className: 'setting-description', key: 'desc' }, description),
      React.createElement('span', { className: 'setting-value', key: 'value' }, `${value} ${unit}`)
    ]),
    React.createElement('input', {
      type: 'range',
      min: min,
      max: max,
      value: value,
      onChange: (e) => onChange(parseInt(e.target.value)),
      className: 'setting-slider',
      key: 'slider'
    })
  ]);
}

function SettingDropdown({ label, description, value, options, onChange }) {
  return React.createElement('div', { className: 'setting-item dropdown-setting' }, [
    React.createElement('div', { className: 'setting-info', key: 'info' }, [
      React.createElement('label', { className: 'setting-label', key: 'label' }, label),
      React.createElement('p', { className: 'setting-description', key: 'desc' }, description)
    ]),
    React.createElement('select', {
      value: value,
      onChange: (e) => onChange(e.target.value),
      className: 'setting-dropdown',
      key: 'dropdown'
    }, options.map(option =>
      React.createElement('option', { value: option.value, key: option.value }, option.label)
    ))
  ]);
}

function TeamsManagement() {
  const [selectedConference, setSelectedConference] = useState('big12');
  const [selectedSport, setSelectedSport] = useState('all');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [viewMode, setViewMode] = useState('grid');

  const big12Teams = [
    { 
      id: 'arizona', 
      name: 'Arizona Wildcats', 
      abbreviation: 'ARIZ', 
      location: 'Tucson, AZ',
      founded: 1885,
      colors: ['#003366', '#CC0000'],
      mascot: 'Wilbur & Wilma Wildcat',
      stadium: 'Arizona Stadium',
      capacity: 56000,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Softball'],
      achievements: {
        nationalTitles: 4,
        conferenceChampionships: 12,
        bowlGames: 15
      },
      currentRankings: {
        football: '--',
        mensBasketball: 18,
        womensBasketball: 12,
        baseball: 8
      }
    },
    { 
      id: 'arizona-state', 
      name: 'Arizona State Sun Devils', 
      abbreviation: 'ASU', 
      location: 'Tempe, AZ',
      founded: 1885,
      colors: ['#8C1538', '#FFC627'],
      mascot: 'Sparky',
      stadium: 'Sun Devil Stadium',
      capacity: 53599,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Wrestling'],
      achievements: {
        nationalTitles: 23,
        conferenceChampionships: 24,
        bowlGames: 22
      },
      currentRankings: {
        football: '--',
        mensBasketball: 25,
        womensBasketball: '--',
        baseball: 15
      }
    },
    { 
      id: 'baylor', 
      name: 'Baylor Bears', 
      abbreviation: 'BAY', 
      location: 'Waco, TX',
      founded: 1845,
      colors: ['#003015', '#FFB81C'],
      mascot: 'Bruiser & Marigold',
      stadium: 'McLane Stadium',
      capacity: 45140,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis'],
      achievements: {
        nationalTitles: 3,
        conferenceChampionships: 15,
        bowlGames: 18
      },
      currentRankings: {
        football: 22,
        mensBasketball: 7,
        womensBasketball: 4,
        baseball: 12
      }
    },
    { 
      id: 'byu', 
      name: 'BYU Cougars', 
      abbreviation: 'BYU', 
      location: 'Provo, UT',
      founded: 1875,
      colors: ['#002E5D', '#FFFFFF'],
      mascot: 'Cosmo the Cougar',
      stadium: 'LaVell Edwards Stadium',
      capacity: 63470,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Volleyball'],
      achievements: {
        nationalTitles: 11,
        conferenceChampionships: 23,
        bowlGames: 38
      },
      currentRankings: {
        football: 19,
        mensBasketball: 14,
        womensBasketball: 16,
        baseball: 21
      }
    },
    { 
      id: 'cincinnati', 
      name: 'Cincinnati Bearcats', 
      abbreviation: 'CIN', 
      location: 'Cincinnati, OH',
      founded: 1819,
      colors: ['#000000', '#E00122'],
      mascot: 'The Bearcat',
      stadium: 'Nippert Stadium',
      capacity: 40000,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer'],
      achievements: {
        nationalTitles: 2,
        conferenceChampionships: 8,
        bowlGames: 14
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'colorado', 
      name: 'Colorado Buffaloes', 
      abbreviation: 'COL', 
      location: 'Boulder, CO',
      founded: 1876,
      colors: ['#000000', '#CFB87C'],
      mascot: 'Ralphie',
      stadium: 'Folsom Field',
      capacity: 50183,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Soccer'],
      achievements: {
        nationalTitles: 1,
        conferenceChampionships: 8,
        bowlGames: 27
      },
      currentRankings: {
        football: 16,
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'houston', 
      name: 'Houston Cougars', 
      abbreviation: 'HOU', 
      location: 'Houston, TX',
      founded: 1927,
      colors: ['#C8102E', '#FFFFFF'],
      mascot: 'Shasta',
      stadium: 'TDECU Stadium',
      capacity: 40000,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Golf'],
      achievements: {
        nationalTitles: 5,
        conferenceChampionships: 16,
        bowlGames: 24
      },
      currentRankings: {
        football: '--',
        mensBasketball: 1,
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'iowa-state', 
      name: 'Iowa State Cyclones', 
      abbreviation: 'ISU', 
      location: 'Ames, IA',
      founded: 1858,
      colors: ['#C8102E', '#F1BE48'],
      mascot: 'Cy',
      stadium: 'Jack Trice Stadium',
      capacity: 61500,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Wrestling'],
      achievements: {
        nationalTitles: 2,
        conferenceChampionships: 9,
        bowlGames: 18
      },
      currentRankings: {
        football: '--',
        mensBasketball: 3,
        womensBasketball: 8,
        baseball: '--'
      }
    },
    { 
      id: 'kansas', 
      name: 'Kansas Jayhawks', 
      abbreviation: 'KU', 
      location: 'Lawrence, KS',
      founded: 1865,
      colors: ['#0051BA', '#E8000D'],
      mascot: 'Big Jay & Baby Jay',
      stadium: 'David Booth Kansas Memorial Stadium',
      capacity: 50071,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer'],
      achievements: {
        nationalTitles: 6,
        conferenceChampionships: 62,
        bowlGames: 12
      },
      currentRankings: {
        football: '--',
        mensBasketball: 2,
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'kansas-state', 
      name: 'Kansas State Wildcats', 
      abbreviation: 'KSU', 
      location: 'Manhattan, KS',
      founded: 1863,
      colors: ['#512888', '#FFFFFF'],
      mascot: 'Willie the Wildcat',
      stadium: 'Bill Snyder Family Stadium',
      capacity: 50000,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer'],
      achievements: {
        nationalTitles: 0,
        conferenceChampionships: 6,
        bowlGames: 25
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'oklahoma-state', 
      name: 'Oklahoma State Cowboys', 
      abbreviation: 'OKST', 
      location: 'Stillwater, OK',
      founded: 1890,
      colors: ['#FF7300', '#000000'],
      mascot: 'Pistol Pete',
      stadium: 'Boone Pickens Stadium',
      capacity: 60218,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Wrestling', 'Golf'],
      achievements: {
        nationalTitles: 52,
        conferenceChampionships: 143,
        bowlGames: 31
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: 5
      }
    },
    { 
      id: 'tcu', 
      name: 'TCU Horned Frogs', 
      abbreviation: 'TCU', 
      location: 'Fort Worth, TX',
      founded: 1873,
      colors: ['#4D1979', '#FFFFFF'],
      mascot: 'SuperFrog',
      stadium: 'Amon G. Carter Stadium',
      capacity: 50307,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis'],
      achievements: {
        nationalTitles: 2,
        conferenceChampionships: 18,
        bowlGames: 37
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: 3
      }
    },
    { 
      id: 'texas-tech', 
      name: 'Texas Tech Red Raiders', 
      abbreviation: 'TTU', 
      location: 'Lubbock, TX',
      founded: 1923,
      colors: ['#CC0000', '#000000'],
      mascot: 'Raider Red',
      stadium: 'Jones AT&T Stadium',
      capacity: 60454,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Tennis'],
      achievements: {
        nationalTitles: 1,
        conferenceChampionships: 14,
        bowlGames: 37
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'ucf', 
      name: 'UCF Knights', 
      abbreviation: 'UCF', 
      location: 'Orlando, FL',
      founded: 1963,
      colors: ['#000000', '#B3A369'],
      mascot: 'Knightro',
      stadium: 'FBC Mortgage Stadium',
      capacity: 48000,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer'],
      achievements: {
        nationalTitles: 1,
        conferenceChampionships: 13,
        bowlGames: 14
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'utah', 
      name: 'Utah Utes', 
      abbreviation: 'UTAH', 
      location: 'Salt Lake City, UT',
      founded: 1850,
      colors: ['#CC0000', '#FFFFFF'],
      mascot: 'Swoop',
      stadium: 'Rice-Eccles Stadium',
      capacity: 51444,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Gymnastics'],
      achievements: {
        nationalTitles: 24,
        conferenceChampionships: 29,
        bowlGames: 28
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    },
    { 
      id: 'west-virginia', 
      name: 'West Virginia Mountaineers', 
      abbreviation: 'WVU', 
      location: 'Morgantown, WV',
      founded: 1867,
      colors: ['#002855', '#EAAA00'],
      mascot: 'The Mountaineer',
      stadium: 'Milan Puskar Stadium',
      capacity: 60000,
      conference: 'Big 12',
      sports: ['Football', 'Basketball', 'Baseball', 'Soccer', 'Wrestling'],
      achievements: {
        nationalTitles: 15,
        conferenceChampionships: 15,
        bowlGames: 35
      },
      currentRankings: {
        football: '--',
        mensBasketball: '--',
        womensBasketball: '--',
        baseball: '--'
      }
    }
  ];

  const filteredTeams = selectedSport === 'all' 
    ? big12Teams 
    : big12Teams.filter(team => team.sports.includes(selectedSport));

  return React.createElement('section', { className: 'teams-section' }, [
    React.createElement('div', { className: 'container', key: 'container' }, [
      React.createElement('h2', { className: 'section-title title-metallic', key: 'title' }, 'TEAM MANAGEMENT'),
      
      // Control Panel
      React.createElement('div', { className: 'teams-controls', key: 'controls' }, [
        React.createElement('div', { className: 'control-group', key: 'conference' }, [
          React.createElement('label', { key: 'label' }, 'Conference:'),
          React.createElement('select', {
            value: selectedConference,
            onChange: (e) => setSelectedConference(e.target.value),
            className: 'teams-select',
            key: 'select'
          }, [
            React.createElement('option', { value: 'big12', key: 'big12' }, 'Big 12'),
            React.createElement('option', { value: 'all', key: 'all' }, 'All Conferences')
          ])
        ]),
        React.createElement('div', { className: 'control-group', key: 'sport' }, [
          React.createElement('label', { key: 'label' }, 'Sport:'),
          React.createElement('select', {
            value: selectedSport,
            onChange: (e) => setSelectedSport(e.target.value),
            className: 'teams-select',
            key: 'select'
          }, [
            React.createElement('option', { value: 'all', key: 'all' }, 'All Sports'),
            React.createElement('option', { value: 'Football', key: 'football' }, 'Football'),
            React.createElement('option', { value: 'Basketball', key: 'basketball' }, 'Basketball'),
            React.createElement('option', { value: 'Baseball', key: 'baseball' }, 'Baseball'),
            React.createElement('option', { value: 'Soccer', key: 'soccer' }, 'Soccer')
          ])
        ]),
        React.createElement('div', { className: 'control-group', key: 'view' }, [
          React.createElement('label', { key: 'label' }, 'View:'),
          React.createElement('div', { className: 'view-toggle', key: 'toggle' }, [
            React.createElement('button', {
              className: `view-btn ${viewMode === 'grid' ? 'active' : ''}`,
              onClick: () => setViewMode('grid'),
              key: 'grid'
            }, '⊞ Grid'),
            React.createElement('button', {
              className: `view-btn ${viewMode === 'list' ? 'active' : ''}`,
              onClick: () => setViewMode('list'),
              key: 'list'
            }, '☰ List')
          ])
        ])
      ]),

      // Teams Display
      !selectedTeam && React.createElement('div', { className: `teams-display ${viewMode}`, key: 'display' }, [
        viewMode === 'grid' ? React.createElement('div', { className: 'teams-grid', key: 'grid' },
          filteredTeams.map(team =>
            React.createElement('div', { 
              className: 'team-card-full', 
              key: team.id,
              onClick: () => setSelectedTeam(team)
            }, [
              React.createElement('div', { className: 'team-header', key: 'header' }, [
                React.createElement('img', {
                  src: `/assets/logos/teams/${team.id.replace(/-/g, '_')}.svg`,
                  alt: `${team.name} logo`,
                  className: 'team-logo-image',
                  key: 'logo',
                  onError: (e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }
                }),
                React.createElement('div', { 
                  className: 'team-logo-placeholder', 
                  key: 'fallback',
                  style: { display: 'none' }
                }, team.abbreviation),
                React.createElement('div', { className: 'team-info-header', key: 'info' }, [
                  React.createElement('h3', { className: 'team-name-full', key: 'name' }, team.name),
                  React.createElement('p', { className: 'team-location', key: 'location' }, team.location)
                ])
              ]),
              React.createElement('div', { className: 'team-stats', key: 'stats' }, [
                React.createElement('div', { className: 'stat-item-small', key: 'founded' }, [
                  React.createElement('span', { className: 'stat-label-small', key: 'label' }, 'Founded'),
                  React.createElement('span', { className: 'stat-value-small', key: 'value' }, team.founded)
                ]),
                React.createElement('div', { className: 'stat-item-small', key: 'capacity' }, [
                  React.createElement('span', { className: 'stat-label-small', key: 'label' }, 'Stadium'),
                  React.createElement('span', { className: 'stat-value-small', key: 'value' }, team.capacity.toLocaleString())
                ])
              ]),
              React.createElement('div', { className: 'team-sports', key: 'sports' }, 
                team.sports.slice(0, 3).map(sport =>
                  React.createElement('span', { className: 'sport-tag', key: sport }, sport)
                ).concat(
                  team.sports.length > 3 ? [React.createElement('span', { className: 'sport-tag more', key: 'more' }, `+${team.sports.length - 3}`)] : []
                )
              )
            ])
          )
        ) : React.createElement('div', { className: 'teams-list', key: 'list' },
          filteredTeams.map(team =>
            React.createElement('div', { 
              className: 'team-row', 
              key: team.id,
              onClick: () => setSelectedTeam(team)
            }, [
              React.createElement('div', { className: 'team-basic-info', key: 'basic' }, [
                React.createElement('div', { className: 'team-logo-container-small', key: 'logo-container' }, [
                  React.createElement('img', {
                    src: `/assets/logos/teams/${team.id.replace(/-/g, '_')}.svg`,
                    alt: `${team.name} logo`,
                    className: 'team-logo-image-small',
                    key: 'logo',
                    onError: (e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }
                  }),
                  React.createElement('div', { 
                    className: 'team-logo-small', 
                    key: 'fallback',
                    style: { display: 'none' }
                  }, team.abbreviation)
                ]),
                React.createElement('div', { className: 'team-details', key: 'details' }, [
                  React.createElement('h4', { key: 'name' }, team.name),
                  React.createElement('p', { key: 'location' }, team.location)
                ])
              ]),
              React.createElement('div', { className: 'team-quick-stats', key: 'stats' }, [
                React.createElement('span', { className: 'stadium-name', key: 'stadium' }, team.stadium),
                React.createElement('span', { className: 'capacity-num', key: 'capacity' }, team.capacity.toLocaleString()),
                React.createElement('span', { className: 'sports-count', key: 'sports' }, `${team.sports.length} Sports`)
              ])
            ])
          )
        )
      ]),

      // Team Detail View
      selectedTeam && React.createElement('div', { className: 'team-detail-view', key: 'detail' }, [
        React.createElement('button', { 
          className: 'back-button',
          onClick: () => setSelectedTeam(null),
          key: 'back'
        }, '← Back to Teams'),
        
        React.createElement('div', { className: 'team-detail-header', key: 'header' }, [
          React.createElement('div', { className: 'team-logo-container-large', key: 'logo-container' }, [
            React.createElement('img', {
              src: `/assets/logos/teams/${selectedTeam.id.replace(/-/g, '_')}.svg`,
              alt: `${selectedTeam.name} logo`,
              className: 'team-logo-image-large',
              key: 'logo',
              onError: (e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }
            }),
            React.createElement('div', { 
              className: 'team-logo-large', 
              key: 'fallback',
              style: { display: 'none' }
            }, selectedTeam.abbreviation)
          ]),
          React.createElement('div', { className: 'team-detail-info', key: 'info' }, [
            React.createElement('h2', { className: 'team-name-large', key: 'name' }, selectedTeam.name),
            React.createElement('p', { className: 'team-location-large', key: 'location' }, selectedTeam.location),
            React.createElement('div', { className: 'team-colors', key: 'colors' },
              selectedTeam.colors.map((color, index) =>
                React.createElement('div', { 
                  className: 'color-swatch',
                  style: { backgroundColor: color },
                  key: index
                })
              )
            )
          ])
        ]),

        React.createElement('div', { className: 'team-detail-content', key: 'content' }, [
          React.createElement('div', { className: 'detail-section', key: 'basic' }, [
            React.createElement('h3', { key: 'title' }, 'Basic Information'),
            React.createElement('div', { className: 'detail-grid', key: 'grid' }, [
              React.createElement('div', { className: 'detail-item', key: 'founded' }, [
                React.createElement('label', { key: 'label' }, 'Founded'),
                React.createElement('span', { key: 'value' }, selectedTeam.founded)
              ]),
              React.createElement('div', { className: 'detail-item', key: 'mascot' }, [
                React.createElement('label', { key: 'label' }, 'Mascot'),
                React.createElement('span', { key: 'value' }, selectedTeam.mascot)
              ]),
              React.createElement('div', { className: 'detail-item', key: 'stadium' }, [
                React.createElement('label', { key: 'label' }, 'Stadium'),
                React.createElement('span', { key: 'value' }, selectedTeam.stadium)
              ]),
              React.createElement('div', { className: 'detail-item', key: 'capacity' }, [
                React.createElement('label', { key: 'label' }, 'Capacity'),
                React.createElement('span', { key: 'value' }, selectedTeam.capacity.toLocaleString())
              ])
            ])
          ]),

          React.createElement('div', { className: 'detail-section', key: 'achievements' }, [
            React.createElement('h3', { key: 'title' }, 'Achievements'),
            React.createElement('div', { className: 'achievements-grid', key: 'grid' }, [
              React.createElement('div', { className: 'achievement-card', key: 'national' }, [
                React.createElement('div', { className: 'achievement-value', key: 'value' }, selectedTeam.achievements.nationalTitles),
                React.createElement('div', { className: 'achievement-label', key: 'label' }, 'National Titles')
              ]),
              React.createElement('div', { className: 'achievement-card', key: 'conference' }, [
                React.createElement('div', { className: 'achievement-value', key: 'value' }, selectedTeam.achievements.conferenceChampionships),
                React.createElement('div', { className: 'achievement-label', key: 'label' }, 'Conference Championships')
              ]),
              React.createElement('div', { className: 'achievement-card', key: 'bowls' }, [
                React.createElement('div', { className: 'achievement-value', key: 'value' }, selectedTeam.achievements.bowlGames),
                React.createElement('div', { className: 'achievement-label', key: 'label' }, 'Bowl Games')
              ])
            ])
          ]),

          React.createElement('div', { className: 'detail-section', key: 'rankings' }, [
            React.createElement('h3', { key: 'title' }, 'Current Rankings'),
            React.createElement('div', { className: 'rankings-grid', key: 'grid' }, [
              React.createElement('div', { className: 'ranking-item', key: 'football' }, [
                React.createElement('label', { key: 'label' }, 'Football'),
                React.createElement('span', { className: 'ranking-value', key: 'value' }, selectedTeam.currentRankings.football || '--')
              ]),
              React.createElement('div', { className: 'ranking-item', key: 'mens-bb' }, [
                React.createElement('label', { key: 'label' }, 'Men\'s Basketball'),
                React.createElement('span', { className: 'ranking-value', key: 'value' }, selectedTeam.currentRankings.mensBasketball || '--')
              ]),
              React.createElement('div', { className: 'ranking-item', key: 'womens-bb' }, [
                React.createElement('label', { key: 'label' }, 'Women\'s Basketball'),
                React.createElement('span', { className: 'ranking-value', key: 'value' }, selectedTeam.currentRankings.womensBasketball || '--')
              ]),
              React.createElement('div', { className: 'ranking-item', key: 'baseball' }, [
                React.createElement('label', { key: 'label' }, 'Baseball'),
                React.createElement('span', { className: 'ranking-value', key: 'value' }, selectedTeam.currentRankings.baseball || '--')
              ])
            ])
          ]),

          React.createElement('div', { className: 'detail-section', key: 'sports' }, [
            React.createElement('h3', { key: 'title' }, 'Sports Programs'),
            React.createElement('div', { className: 'sports-list-detail', key: 'list' },
              selectedTeam.sports.map(sport =>
                React.createElement('span', { className: 'sport-badge', key: sport }, sport)
              )
            )
          ])
        ])
      ])
    ])
  ]);
}

function AnalyticsDashboard() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('season');
  const [selectedSport, setSelectedSport] = useState('all');

  const analyticsData = {
    overview: {
      totalSchedules: 42,
      optimizationRate: 94.7,
      conflictResolutions: 156,
      travelSavings: 28.3,
      avgScheduleQuality: 92.1
    },
    performanceMetrics: [
      { metric: 'Schedule Efficiency', value: 94.7, trend: '+2.3%', status: 'up' },
      { metric: 'Conflict Resolution Rate', value: 99.2, trend: '+0.8%', status: 'up' },
      { metric: 'Travel Optimization', value: 87.5, trend: '+5.1%', status: 'up' },
      { metric: 'Venue Utilization', value: 91.3, trend: '-1.2%', status: 'down' },
      { metric: 'Fan Engagement', value: 88.9, trend: '+3.7%', status: 'up' },
      { metric: 'Revenue Optimization', value: 92.6, trend: '+1.9%', status: 'up' }
    ],
    scheduleQuality: [
      { sport: 'Football', quality: 96.8, schedules: 16, conflicts: 2 },
      { sport: 'Men\'s Basketball', quality: 94.2, schedules: 18, conflicts: 5 },
      { sport: 'Women\'s Basketball', quality: 93.7, schedules: 18, conflicts: 4 },
      { sport: 'Baseball', quality: 92.1, schedules: 14, conflicts: 8 },
      { sport: 'Softball', quality: 91.5, schedules: 11, conflicts: 6 },
      { sport: 'Soccer', quality: 89.8, schedules: 16, conflicts: 12 }
    ],
    agentPerformance: [
      { agent: 'Director Agent', tasks: 1247, success: 98.9, avgTime: '2.3s' },
      { agent: 'Scheduling Agent', tasks: 892, success: 96.4, avgTime: '45.7s' },
      { agent: 'Conflict Resolution', tasks: 445, success: 99.1, avgTime: '12.1s' },
      { agent: 'Travel Optimization', tasks: 334, success: 94.7, avgTime: '28.9s' },
      { agent: 'ML Learning Agent', tasks: 156, success: 91.2, avgTime: '2.1m' }
    ],
    recentActivity: [
      { timestamp: '2 mins ago', action: 'Football schedule optimized', agent: 'Scheduling Agent', status: 'success' },
      { timestamp: '5 mins ago', action: 'Conflict resolved in Basketball', agent: 'Conflict Resolution', status: 'success' },
      { timestamp: '8 mins ago', action: 'Travel route optimized', agent: 'Travel Optimization', status: 'success' },
      { timestamp: '12 mins ago', action: 'ML model training completed', agent: 'ML Learning Agent', status: 'success' },
      { timestamp: '15 mins ago', action: 'Venue allocation updated', agent: 'Resource Allocation', status: 'warning' }
    ]
  };

  return React.createElement('section', { className: 'analytics-section' }, [
    React.createElement('div', { className: 'container', key: 'container' }, [
      React.createElement('h2', { className: 'section-title title-metallic', key: 'title' }, 'ANALYTICS DASHBOARD'),
      
      // Dashboard Controls
      React.createElement('div', { className: 'dashboard-controls', key: 'controls' }, [
        React.createElement('div', { className: 'control-group', key: 'timeframe' }, [
          React.createElement('label', { key: 'label' }, 'Timeframe:'),
          React.createElement('select', {
            value: selectedTimeframe,
            onChange: (e) => setSelectedTimeframe(e.target.value),
            className: 'dashboard-select',
            key: 'select'
          }, [
            React.createElement('option', { value: 'week', key: 'week' }, 'Last Week'),
            React.createElement('option', { value: 'month', key: 'month' }, 'Last Month'),
            React.createElement('option', { value: 'season', key: 'season' }, 'Current Season'),
            React.createElement('option', { value: 'year', key: 'year' }, 'Last Year')
          ])
        ]),
        React.createElement('div', { className: 'control-group', key: 'sport' }, [
          React.createElement('label', { key: 'label' }, 'Sport:'),
          React.createElement('select', {
            value: selectedSport,
            onChange: (e) => setSelectedSport(e.target.value),
            className: 'dashboard-select',
            key: 'select'
          }, [
            React.createElement('option', { value: 'all', key: 'all' }, 'All Sports'),
            React.createElement('option', { value: 'football', key: 'football' }, 'Football'),
            React.createElement('option', { value: 'basketball', key: 'basketball' }, 'Basketball'),
            React.createElement('option', { value: 'baseball', key: 'baseball' }, 'Baseball'),
            React.createElement('option', { value: 'soccer', key: 'soccer' }, 'Soccer')
          ])
        ])
      ]),

      // Overview Stats
      React.createElement('div', { className: 'analytics-overview', key: 'overview' }, [
        React.createElement('h3', { className: 'subsection-title', key: 'title' }, 'System Overview'),
        React.createElement('div', { className: 'overview-grid', key: 'grid' }, [
          React.createElement('div', { className: 'overview-card', key: 'schedules' }, [
            React.createElement('div', { className: 'overview-icon monochrome', key: 'icon' }, '📅'),
            React.createElement('div', { className: 'overview-content', key: 'content' }, [
              React.createElement('h4', { key: 'value' }, analyticsData.overview.totalSchedules),
              React.createElement('p', { key: 'label' }, 'Total Schedules')
            ])
          ]),
          React.createElement('div', { className: 'overview-card', key: 'optimization' }, [
            React.createElement('div', { className: 'overview-icon monochrome', key: 'icon' }, '⚡'),
            React.createElement('div', { className: 'overview-content', key: 'content' }, [
              React.createElement('h4', { key: 'value' }, `${analyticsData.overview.optimizationRate}%`),
              React.createElement('p', { key: 'label' }, 'Optimization Rate')
            ])
          ]),
          React.createElement('div', { className: 'overview-card', key: 'conflicts' }, [
            React.createElement('div', { className: 'overview-icon monochrome', key: 'icon' }, '🛡️'),
            React.createElement('div', { className: 'overview-content', key: 'content' }, [
              React.createElement('h4', { key: 'value' }, analyticsData.overview.conflictResolutions),
              React.createElement('p', { key: 'label' }, 'Conflicts Resolved')
            ])
          ]),
          React.createElement('div', { className: 'overview-card', key: 'travel' }, [
            React.createElement('div', { className: 'overview-icon monochrome', key: 'icon' }, '✈️'),
            React.createElement('div', { className: 'overview-content', key: 'content' }, [
              React.createElement('h4', { key: 'value' }, `${analyticsData.overview.travelSavings}%`),
              React.createElement('p', { key: 'label' }, 'Travel Savings')
            ])
          ]),
          React.createElement('div', { className: 'overview-card', key: 'quality' }, [
            React.createElement('div', { className: 'overview-icon monochrome', key: 'icon' }, '🎯'),
            React.createElement('div', { className: 'overview-content', key: 'content' }, [
              React.createElement('h4', { key: 'value' }, `${analyticsData.overview.avgScheduleQuality}%`),
              React.createElement('p', { key: 'label' }, 'Avg Quality Score')
            ])
          ])
        ])
      ]),

      // Performance Metrics
      React.createElement('div', { className: 'performance-section', key: 'performance' }, [
        React.createElement('h3', { className: 'subsection-title', key: 'title' }, 'Performance Metrics'),
        React.createElement('div', { className: 'metrics-grid', key: 'grid' },
          analyticsData.performanceMetrics.map((metric, index) =>
            React.createElement('div', { className: 'metric-card', key: index }, [
              React.createElement('div', { className: 'metric-header', key: 'header' }, [
                React.createElement('h4', { className: 'metric-name', key: 'name' }, metric.metric),
                React.createElement('span', { 
                  className: `metric-trend ${metric.status}`, 
                  key: 'trend' 
                }, metric.trend)
              ]),
              React.createElement('div', { className: 'metric-value', key: 'value' }, `${metric.value}%`),
              React.createElement('div', { className: 'metric-bar', key: 'bar' }, [
                React.createElement('div', { 
                  className: 'metric-fill', 
                  style: { width: `${metric.value}%` },
                  key: 'fill'
                })
              ])
            ])
          )
        )
      ]),

      // Schedule Quality by Sport
      React.createElement('div', { className: 'quality-section', key: 'quality' }, [
        React.createElement('h3', { className: 'subsection-title', key: 'title' }, 'Schedule Quality by Sport'),
        React.createElement('div', { className: 'quality-table', key: 'table' }, [
          React.createElement('div', { className: 'table-header', key: 'header' }, [
            React.createElement('span', { key: 'sport' }, 'Sport'),
            React.createElement('span', { key: 'quality' }, 'Quality Score'),
            React.createElement('span', { key: 'schedules' }, 'Schedules'),
            React.createElement('span', { key: 'conflicts' }, 'Conflicts')
          ]),
          ...analyticsData.scheduleQuality.map((sport, index) =>
            React.createElement('div', { className: 'table-row', key: index }, [
              React.createElement('span', { className: 'sport-name', key: 'name' }, sport.sport),
              React.createElement('span', { className: 'quality-score', key: 'score' }, `${sport.quality}%`),
              React.createElement('span', { className: 'schedule-count', key: 'count' }, sport.schedules),
              React.createElement('span', { 
                className: `conflict-count ${sport.conflicts > 5 ? 'high' : sport.conflicts > 2 ? 'medium' : 'low'}`, 
                key: 'conflicts' 
              }, sport.conflicts)
            ])
          )
        ])
      ]),

      // Agent Performance
      React.createElement('div', { className: 'agent-performance-section', key: 'agent-perf' }, [
        React.createElement('h3', { className: 'subsection-title', key: 'title' }, 'AI Agent Performance'),
        React.createElement('div', { className: 'agent-perf-grid', key: 'grid' },
          analyticsData.agentPerformance.map((agent, index) =>
            React.createElement('div', { className: 'agent-perf-card', key: index }, [
              React.createElement('h4', { className: 'agent-perf-name', key: 'name' }, agent.agent),
              React.createElement('div', { className: 'agent-perf-stats', key: 'stats' }, [
                React.createElement('div', { className: 'stat-item', key: 'tasks' }, [
                  React.createElement('span', { className: 'stat-value', key: 'value' }, agent.tasks),
                  React.createElement('span', { className: 'stat-label', key: 'label' }, 'Tasks')
                ]),
                React.createElement('div', { className: 'stat-item', key: 'success' }, [
                  React.createElement('span', { className: 'stat-value', key: 'value' }, `${agent.success}%`),
                  React.createElement('span', { className: 'stat-label', key: 'label' }, 'Success')
                ]),
                React.createElement('div', { className: 'stat-item', key: 'time' }, [
                  React.createElement('span', { className: 'stat-value', key: 'value' }, agent.avgTime),
                  React.createElement('span', { className: 'stat-label', key: 'label' }, 'Avg Time')
                ])
              ])
            ])
          )
        )
      ]),

      // Recent Activity
      React.createElement('div', { className: 'activity-section', key: 'activity' }, [
        React.createElement('h3', { className: 'subsection-title', key: 'title' }, 'Recent Activity'),
        React.createElement('div', { className: 'activity-feed', key: 'feed' },
          analyticsData.recentActivity.map((activity, index) =>
            React.createElement('div', { className: 'activity-item', key: index }, [
              React.createElement('div', { className: `activity-status ${activity.status}`, key: 'status' }),
              React.createElement('div', { className: 'activity-content', key: 'content' }, [
                React.createElement('p', { className: 'activity-action', key: 'action' }, activity.action),
                React.createElement('div', { className: 'activity-meta', key: 'meta' }, [
                  React.createElement('span', { className: 'activity-agent', key: 'agent' }, activity.agent),
                  React.createElement('span', { className: 'activity-time', key: 'time' }, activity.timestamp)
                ])
              ])
            ])
          )
        )
      ])
    ])
  ]);
}

function AIMLControlCenter() {
  const [agents, setAgents] = useState([
    { 
      id: 'director', 
      name: 'Director Agent', 
      status: 'active', 
      task: 'Coordinating multi-agent scheduling', 
      performance: 96.8,
      trainingData: ['Agent coordination patterns', 'Task delegation strategies', 'System optimization metrics']
    },
    { 
      id: 'scheduling', 
      name: 'Scheduling Agent', 
      status: 'processing', 
      task: 'Optimizing Big 12 football schedule', 
      performance: 94.2,
      trainingData: ['Historical Big 12 schedules', 'Venue availability data', 'TV broadcast windows', 'Travel distance matrices']
    },
    { 
      id: 'conflict', 
      name: 'Conflict Resolution Agent', 
      status: 'active', 
      task: 'Monitoring schedule conflicts', 
      performance: 99.1,
      trainingData: ['Conflict resolution patterns', 'Schedule dependency graphs', 'Priority optimization rules']
    },
    { 
      id: 'travel', 
      name: 'Travel Optimization Agent', 
      status: 'idle', 
      task: 'Analyzing travel efficiency', 
      performance: 87.5,
      trainingData: ['Geographic data', 'Transportation costs', 'Climate patterns', 'Team logistics data']
    },
    { 
      id: 'ml', 
      name: 'ML Learning Agent', 
      status: 'processing', 
      task: 'Training COMPASS models', 
      performance: 91.3,
      trainingData: ['Team performance metrics', 'Game outcome predictions', 'Strength of schedule calculations', 'Player impact analytics']
    }
  ]);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [commandInput, setCommandInput] = useState('');

  const trainingDatasets = [
    {
      name: 'COMPASS Team Rating Model',
      data: ['Historical team performance', 'Win/loss records', 'Point differentials', 'Strength metrics', 'Conference standings']
    },
    {
      name: 'Game Prediction Engine',
      data: ['Past game outcomes', 'Weather conditions', 'Venue advantages', 'Player availability', 'Betting line data']
    },
    {
      name: 'Strength of Schedule Calculator',
      data: ['Opponent quality metrics', 'Conference strength indices', 'Non-conference performance', 'Ranking systems']
    },
    {
      name: 'Player Impact Analytics',
      data: ['Individual player statistics', 'Team performance with/without players', 'Injury reports', 'Transfer portal data']
    },
    {
      name: 'Travel Optimization Dataset',
      data: ['Airport locations', 'Flight schedules', 'Ground transportation', 'Hotel availability', 'Climate data']
    },
    {
      name: 'Conflict Resolution Matrix',
      data: ['TV broadcast conflicts', 'Venue double-bookings', 'Conference tournament dates', 'Holiday restrictions']
    }
  ];

  return React.createElement('section', { className: 'ai-ml-section' }, [
    React.createElement('div', { className: 'container', key: 'container' }, [
      React.createElement('h2', { className: 'section-title title-metallic', key: 'title' }, 'AI/ML AGENT CONTROL CENTER'),
      
      // Agent Grid
      React.createElement('div', { className: 'agent-grid', key: 'agent-grid' }, 
        agents.map(agent => 
          React.createElement('div', { 
            className: `agent-card ${agent.status} ${selectedAgent?.id === agent.id ? 'selected' : ''}`,
            key: agent.id,
            onClick: () => setSelectedAgent(agent)
          }, [
            React.createElement('div', { className: 'agent-header', key: 'header' }, [
              React.createElement('div', { className: `agent-status-dot ${agent.status}`, key: 'dot' }),
              React.createElement('h3', { className: 'agent-name', key: 'name' }, agent.name)
            ]),
            React.createElement('p', { className: 'agent-task', key: 'task' }, agent.task),
            React.createElement('div', { className: 'agent-performance', key: 'perf' }, [
              React.createElement('span', { className: 'perf-label', key: 'label' }, 'Performance:'),
              React.createElement('span', { className: 'perf-value', key: 'value' }, `${agent.performance}%`)
            ]),
            React.createElement('div', { className: 'agent-actions', key: 'actions' }, [
              React.createElement('button', { 
                className: 'btn-agent-action',
                key: 'start',
                onClick: (e) => { e.stopPropagation(); console.log('Start agent:', agent.id); }
              }, 'START'),
              React.createElement('button', { 
                className: 'btn-agent-action stop',
                key: 'stop',
                onClick: (e) => { e.stopPropagation(); console.log('Stop agent:', agent.id); }
              }, 'STOP')
            ])
          ])
        )
      ),

      // Agent Details Panel
      selectedAgent && React.createElement('div', { className: 'agent-details-panel', key: 'details' }, [
        React.createElement('h3', { className: 'panel-title', key: 'title' }, `${selectedAgent.name} Details`),
        React.createElement('div', { className: 'details-grid', key: 'grid' }, [
          React.createElement('div', { className: 'detail-card', key: 'status' }, [
            React.createElement('h4', { key: 'label' }, 'Status'),
            React.createElement('p', { className: `status-value ${selectedAgent.status}`, key: 'value' }, selectedAgent.status.toUpperCase())
          ]),
          React.createElement('div', { className: 'detail-card', key: 'task' }, [
            React.createElement('h4', { key: 'label' }, 'Current Task'),
            React.createElement('p', { key: 'value' }, selectedAgent.task)
          ]),
          React.createElement('div', { className: 'detail-card', key: 'performance' }, [
            React.createElement('h4', { key: 'label' }, 'Performance'),
            React.createElement('p', { className: 'performance-value', key: 'value' }, `${selectedAgent.performance}%`)
          ])
        ]),
        React.createElement('div', { className: 'agent-training-data', key: 'training' }, [
          React.createElement('h4', { key: 'title' }, 'Training Data Sources:'),
          React.createElement('ul', { className: 'training-data-list', key: 'list' },
            selectedAgent.trainingData.map((data, index) =>
              React.createElement('li', { key: index }, data)
            )
          )
        ])
      ]),

      // Training Datasets Overview
      React.createElement('div', { className: 'training-data-section', key: 'training-overview' }, [
        React.createElement('h3', { className: 'panel-title', key: 'title' }, 'ML Training Datasets & Models'),
        React.createElement('div', { className: 'training-data-grid', key: 'grid' },
          trainingDatasets.map((dataset, index) =>
            React.createElement('div', { className: 'training-data-card', key: index }, [
              React.createElement('h4', { key: 'name' }, dataset.name),
              React.createElement('ul', { className: 'training-data-list', key: 'data' },
                dataset.data.map((item, dataIndex) =>
                  React.createElement('li', { key: dataIndex }, item)
                )
              )
            ])
          )
        )
      ]),

      // Command Interface
      React.createElement('div', { className: 'command-interface', key: 'command' }, [
        React.createElement('h3', { className: 'command-title', key: 'title' }, 'Agent Command Interface'),
        React.createElement('div', { className: 'command-input-group', key: 'input-group' }, [
          React.createElement('input', {
            type: 'text',
            className: 'command-input',
            placeholder: selectedAgent ? `Enter command for ${selectedAgent.name}...` : 'Select an agent to send commands...',
            value: commandInput,
            onChange: (e) => setCommandInput(e.target.value),
            disabled: !selectedAgent,
            key: 'input'
          }),
          React.createElement('button', {
            className: 'btn-send-command',
            disabled: !selectedAgent || !commandInput.trim(),
            onClick: () => {
              console.log('Sending command to', selectedAgent?.name, ':', commandInput);
              setCommandInput('');
            },
            key: 'send'
          }, 'SEND COMMAND')
        ]),
        React.createElement('div', { className: 'command-suggestions', key: 'suggestions' }, [
          React.createElement('h4', { key: 'title' }, 'Quick Commands:'),
          React.createElement('div', { className: 'suggestion-buttons', key: 'buttons' }, [
            React.createElement('button', { 
              className: 'btn-suggestion',
              onClick: () => setCommandInput('Optimize current schedule'),
              key: 'optimize'
            }, 'Optimize Schedule'),
            React.createElement('button', { 
              className: 'btn-suggestion',
              onClick: () => setCommandInput('Check for conflicts'),
              key: 'conflicts'
            }, 'Check Conflicts'),
            React.createElement('button', { 
              className: 'btn-suggestion',
              onClick: () => setCommandInput('Generate travel report'),
              key: 'travel'
            }, 'Travel Report'),
            React.createElement('button', { 
              className: 'btn-suggestion',
              onClick: () => setCommandInput('Train ML models'),
              key: 'train'
            }, 'Train Models')
          ])
        ])
      ])
    ])
  ]);
}


// ==================== AUTHENTICATION COMPONENTS ====================

function LoginForm({ onLogin, onSwitchToRegister, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement('form', { onSubmit: handleSubmit, className: 'auth-form' }, [
    React.createElement('h2', { key: 'title' }, 'Welcome Back'),
    React.createElement('p', { key: 'subtitle' }, 'Sign in to your FlexTime account'),
    
    error && React.createElement('div', { className: 'error-message', key: 'error' }, error),
    
    React.createElement('div', { className: 'form-group', key: 'email-group' }, [
      React.createElement('label', { key: 'label' }, 'Email'),
      React.createElement('input', {
        type: 'email',
        value: email,
        onChange: (e) => setEmail(e.target.value),
        required: true,
        placeholder: 'Enter your email',
        key: 'input'
      })
    ]),
    
    React.createElement('div', { className: 'form-group', key: 'password-group' }, [
      React.createElement('label', { key: 'label' }, 'Password'),
      React.createElement('input', {
        type: 'password',
        value: password,
        onChange: (e) => setPassword(e.target.value),
        required: true,
        placeholder: 'Enter your password',
        key: 'input'
      })
    ]),
    
    React.createElement('button', {
      type: 'submit',
      disabled: isLoading,
      className: 'auth-button primary',
      key: 'submit'
    }, isLoading ? 'Signing in...' : 'Sign In'),
    
    React.createElement('div', { className: 'auth-footer', key: 'footer' }, [
      React.createElement('span', { key: 'text' }, "Don't have an account? "),
      React.createElement('button', {
        type: 'button',
        onClick: onSwitchToRegister,
        className: 'link-button',
        key: 'switch'
      }, 'Sign up')
    ])
  ]);
}

function RegisterForm({ onLogin, onSwitchToLogin, onClose }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return React.createElement('form', { onSubmit: handleSubmit, className: 'auth-form' }, [
    React.createElement('h2', { key: 'title' }, 'Join FlexTime'),
    React.createElement('p', { key: 'subtitle' }, 'Create your account to get started'),
    
    error && React.createElement('div', { className: 'error-message', key: 'error' }, error),
    
    React.createElement('div', { className: 'form-row', key: 'name-row' }, [
      React.createElement('div', { className: 'form-group half', key: 'first-name' }, [
        React.createElement('label', { key: 'label' }, 'First Name'),
        React.createElement('input', {
          type: 'text',
          value: formData.firstName,
          onChange: (e) => handleChange('firstName', e.target.value),
          placeholder: 'First name',
          key: 'input'
        })
      ]),
      React.createElement('div', { className: 'form-group half', key: 'last-name' }, [
        React.createElement('label', { key: 'label' }, 'Last Name'),
        React.createElement('input', {
          type: 'text',
          value: formData.lastName,
          onChange: (e) => handleChange('lastName', e.target.value),
          placeholder: 'Last name',
          key: 'input'
        })
      ])
    ]),
    
    React.createElement('div', { className: 'form-group', key: 'email-group' }, [
      React.createElement('label', { key: 'label' }, 'Email'),
      React.createElement('input', {
        type: 'email',
        value: formData.email,
        onChange: (e) => handleChange('email', e.target.value),
        required: true,
        placeholder: 'Enter your email',
        key: 'input'
      })
    ]),
    
    React.createElement('div', { className: 'form-group', key: 'password-group' }, [
      React.createElement('label', { key: 'label' }, 'Password'),
      React.createElement('input', {
        type: 'password',
        value: formData.password,
        onChange: (e) => handleChange('password', e.target.value),
        required: true,
        placeholder: 'At least 8 characters',
        key: 'input'
      })
    ]),
    
    React.createElement('div', { className: 'form-group', key: 'confirm-password-group' }, [
      React.createElement('label', { key: 'label' }, 'Confirm Password'),
      React.createElement('input', {
        type: 'password',
        value: formData.confirmPassword,
        onChange: (e) => handleChange('confirmPassword', e.target.value),
        required: true,
        placeholder: 'Confirm your password',
        key: 'input'
      })
    ]),
    
    React.createElement('button', {
      type: 'submit',
      disabled: isLoading,
      className: 'auth-button primary',
      key: 'submit'
    }, isLoading ? 'Creating account...' : 'Create Account'),
    
    React.createElement('div', { className: 'auth-footer', key: 'footer' }, [
      React.createElement('span', { key: 'text' }, 'Already have an account? '),
      React.createElement('button', {
        type: 'button',
        onClick: onSwitchToLogin,
        className: 'link-button',
        key: 'switch'
      }, 'Sign in')
    ])
  ]);
}

function AuthModal({ isOpen, mode, onLogin, onClose, onSwitchMode }) {
  if (!isOpen) return null;

  return React.createElement('div', { className: 'auth-modal-overlay', onClick: onClose }, [
    React.createElement('div', { 
      className: 'auth-modal',
      onClick: (e) => e.stopPropagation(),
      key: 'modal'
    }, [
      React.createElement('button', {
        className: 'close-button',
        onClick: onClose,
        key: 'close'
      }, '×'),
      
      mode === 'login' 
        ? React.createElement(LoginForm, {
            onLogin,
            onSwitchToRegister: () => onSwitchMode('register'),
            onClose,
            key: 'login-form'
          })
        : React.createElement(RegisterForm, {
            onLogin,
            onSwitchToLogin: () => onSwitchMode('login'),
            onClose,
            key: 'register-form'
          })
    ])
  ]);
}

function FlexTimeApp() {
  const [agentStatus, setAgentStatus] = useState('active');
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  
  // Initialize currentSection from URL hash or localStorage, default to 'dashboard'
  const getInitialSection = () => {
    // Check URL hash first (e.g., #schedule)
    const hash = window.location.hash.slice(1);
    if (hash && ['dashboard', 'schedule', 'ai-ml', 'analytics', 'teams', 'settings'].includes(hash)) {
      return hash;
    }
    
    // Check localStorage as fallback
    const saved = localStorage.getItem('flextime-current-section');
    if (saved && ['dashboard', 'schedule', 'ai-ml', 'analytics', 'teams', 'settings'].includes(saved)) {
      return saved;
    }
    
    return 'dashboard';
  };
  
  const [currentSection, setCurrentSection] = useState(getInitialSection());
  const [stats] = useState({
    totalSchedules: 156,
    optimizationRate: 94.2,
    travelSavings: 28.5,
    conflictResolution: 99.1
  });

  // Theme management
  useEffect(() => {
    const savedTheme = localStorage.getItem('flextime-settings');
    if (savedTheme) {
      try {
        const settings = JSON.parse(savedTheme);
        document.documentElement.setAttribute('data-theme', settings.theme || 'dark');
      } catch (error) {
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Check authentication status on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Simulate agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentStatus(prev => {
        const statuses = ['active', 'processing', 'optimizing'];
        const currentIndex = statuses.indexOf(prev);
        return statuses[(currentIndex + 1) % statuses.length];
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  // Persist current section to URL hash and localStorage
  useEffect(() => {
    // Update URL hash
    window.location.hash = currentSection;
    
    // Save to localStorage
    localStorage.setItem('flextime-current-section', currentSection);
  }, [currentSection]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['dashboard', 'schedule', 'ai-ml', 'analytics', 'teams', 'settings'].includes(hash)) {
        setCurrentSection(hash);
      }
    };

    window.addEventListener('hashchange', handleHashChange);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        console.log('✅ User authenticated:', userData.email);
      }
    } catch (error) {
      console.log('No active session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
    setShowAuthModal(false);
    console.log('✅ User logged in:', userData.email);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setUser(null);
      setCurrentSection('dashboard');
      console.log('✅ User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (isLoading) {
    return React.createElement('div', { className: 'loading-screen' }, [
      React.createElement('div', { className: 'loading-content', key: 'content' }, [
        React.createElement('div', { className: 'logo-section', key: 'logo' }, [
          React.createElement('h1', { key: 'title' }, 'FlexTime'),
          React.createElement('p', { key: 'subtitle' }, 'Intelligent Sports Scheduling')
        ]),
        React.createElement('div', { className: 'loading-spinner', key: 'spinner' }),
        React.createElement('p', { key: 'text' }, 'Loading...')
      ])
    ]);
  }

  return React.createElement('div', { className: 'modern-app' }, [
    // Modern Header
    React.createElement('header', { className: 'modern-header', key: 'header' }, [
      React.createElement('div', { className: 'header-container', key: 'container' }, [
        React.createElement('div', { 
          className: 'logo-section logo-clickable', 
          key: 'logo-section',
          onClick: () => setCurrentSection('dashboard'),
          style: { cursor: 'pointer' }
        }, [
          React.createElement('img', {
            src: 'flextime-white.svg',
            alt: 'FlexTime',
            className: 'flextime-logo-small',
            key: 'img'
          }),
          React.createElement('h1', { className: 'title-metallic', key: 'title' }, 'FLEXTIME')
        ]),
        React.createElement('nav', { className: 'nav-links-modern', key: 'nav' }, [
          React.createElement('a', { 
            href: '#schedule', 
            className: `nav-link-modern ${currentSection === 'schedule' ? 'active' : ''}`, 
            onClick: (e) => { e.preventDefault(); setCurrentSection('schedule'); },
            key: 'sched' 
          }, [
            React.createElement('svg', { 
              className: 'nav-icon', 
              key: 'icon',
              width: '18',
              height: '18',
              viewBox: '0 0 24 24',
              fill: 'currentColor'
            }, [
              React.createElement('path', {
                key: 'path',
                d: 'M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z'
              })
            ]),
            React.createElement('span', { key: 'text' }, 'SCHEDULE BUILDER')
          ]),
          React.createElement('a', { 
            href: '#ai-ml', 
            className: `nav-link-modern ${currentSection === 'ai-ml' ? 'active' : ''}`, 
            onClick: (e) => { e.preventDefault(); setCurrentSection('ai-ml'); },
            key: 'ai-ml' 
          }, [
            React.createElement('svg', { 
              className: 'nav-icon', 
              key: 'icon',
              width: '18',
              height: '18',
              viewBox: '0 0 24 24',
              fill: 'currentColor'
            }, [
              React.createElement('path', {
                key: 'path',
                d: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z'
              }),
              React.createElement('circle', {
                key: 'circle1',
                cx: '9',
                cy: '9',
                r: '2'
              }),
              React.createElement('circle', {
                key: 'circle2',
                cx: '15',
                cy: '9',
                r: '2'
              }),
              React.createElement('path', {
                key: 'path2',
                d: 'M12 14c-2 0-3.5-1-3.5-2.5h7c0 1.5-1.5 2.5-3.5 2.5z'
              })
            ]),
            React.createElement('span', { key: 'text' }, 'AI/ML AGENTS')
          ]),
          React.createElement('a', { 
            href: '#analytics', 
            className: `nav-link-modern ${currentSection === 'analytics' ? 'active' : ''}`, 
            onClick: (e) => { e.preventDefault(); setCurrentSection('analytics'); },
            key: 'analytics' 
          }, [
            React.createElement('svg', { 
              className: 'nav-icon', 
              key: 'icon',
              width: '18',
              height: '18',
              viewBox: '0 0 24 24',
              fill: 'currentColor'
            }, [
              React.createElement('path', {
                key: 'path',
                d: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z'
              })
            ]),
            React.createElement('span', { key: 'text' }, 'ANALYTICS')
          ]),
          React.createElement('a', { 
            href: '#teams', 
            className: `nav-link-modern ${currentSection === 'teams' ? 'active' : ''}`, 
            onClick: (e) => { e.preventDefault(); setCurrentSection('teams'); },
            key: 'teams' 
          }, [
            React.createElement('svg', { 
              className: 'nav-icon', 
              key: 'icon',
              width: '18',
              height: '18',
              viewBox: '0 0 24 24',
              fill: 'currentColor'
            }, [
              React.createElement('path', {
                key: 'path',
                d: 'M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A1.5 1.5 0 0 0 18.54 8H17c-.8 0-1.5.7-1.5 1.5v8.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5v-7H9v7c0 .83-.67 1.5-1.5 1.5S6 18.33 6 17.5V9C6 8.2 5.3 7.5 4.5 7.5H3c-.54 0-1.04.2-1.42.54L1 14.7l1.5 1v6H4V19h2v3H8V14h4v8h8z'
              })
            ]),
            React.createElement('span', { key: 'text' }, 'TEAMS')
          ]),
          React.createElement('a', { 
            href: '#settings', 
            className: `nav-link-modern nav-link-settings ${currentSection === 'settings' ? 'active' : ''}`, 
            onClick: (e) => { e.preventDefault(); setCurrentSection('settings'); },
            key: 'settings',
            title: 'Settings & Account'
          }, [
            React.createElement('svg', { 
              className: 'settings-icon', 
              key: 'icon',
              width: '20',
              height: '20',
              viewBox: '0 0 24 24',
              fill: 'currentColor'
            }, [
              React.createElement('path', {
                key: 'path',
                d: 'M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z'
              })
            ]),
            React.createElement('span', { className: 'settings-text', key: 'text' }, 'SETTINGS')
          ])
        ]),
        
        // User Authentication Section
        React.createElement('div', { className: 'auth-section', key: 'auth' }, [
          user ? [
            // User is logged in
            React.createElement('div', { className: 'user-info', key: 'user-info' }, [
              React.createElement('div', { className: 'user-avatar', key: 'avatar' }, 
                user.firstName ? user.firstName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()
              ),
              React.createElement('div', { className: 'user-details', key: 'details' }, [
                React.createElement('span', { className: 'user-name', key: 'name' }, 
                  user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user.email
                ),
                React.createElement('span', { className: 'user-email', key: 'email' }, user.email)
              ])
            ]),
            React.createElement('button', {
              className: 'auth-button logout',
              onClick: handleLogout,
              key: 'logout',
              title: 'Sign out'
            }, [
              React.createElement('svg', {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'currentColor',
                key: 'icon'
              }, [
                React.createElement('path', {
                  d: 'M16 17v-3H9v-4h7V7l5 5-5 5M14 2a2 2 0 012 2v2h-2V4H5v16h9v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h9z',
                  key: 'path'
                })
              ]),
              React.createElement('span', { key: 'text' }, 'Sign Out')
            ])
          ] : [
            // User is not logged in
            React.createElement('button', {
              className: 'auth-button login',
              onClick: () => {
                setAuthMode('login');
                setShowAuthModal(true);
              },
              key: 'login'
            }, [
              React.createElement('svg', {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'currentColor',
                key: 'icon'
              }, [
                React.createElement('path', {
                  d: 'M10 17v-3H3v-4h7V7l5 5-5 5M12 2a2 2 0 012 2v2h-2V4H5v16h7v-2h2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2h7z',
                  key: 'path'
                })
              ]),
              React.createElement('span', { key: 'text' }, 'Sign In')
            ]),
            React.createElement('button', {
              className: 'auth-button register',
              onClick: () => {
                setAuthMode('register');
                setShowAuthModal(true);
              },
              key: 'register'
            }, [
              React.createElement('svg', {
                width: '16',
                height: '16',
                viewBox: '0 0 24 24',
                fill: 'currentColor',
                key: 'icon'
              }, [
                React.createElement('path', {
                  d: 'M15 14c-2.67 0-8 1.33-8 4v2h16v-2c0-2.67-5.33-4-8-4zM15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z',
                  key: 'path'
                })
              ]),
              React.createElement('span', { key: 'text' }, 'Sign Up')
            ])
          ]
        ])
      ])
    ]),

    // Conditional Section Rendering
    currentSection === 'dashboard' && React.createElement('div', { key: 'dashboard-sections' }, [
      // Modern Hero Section
    React.createElement('section', { className: 'modern-hero', key: 'hero' }, [
      React.createElement('div', { className: 'hero-content-modern', key: 'content' }, [
        React.createElement('div', { className: 'hero-text-modern', key: 'text' }, [
          React.createElement('p', { className: 'hero-subtitle-glow', key: 'subtitle' }, '"WHAT\'S NEXT" IS HERE.'),
          React.createElement('h2', { className: 'hero-title-massive title-metallic', key: 'title' }, [
            'THE LANDSCAPE IS EVOLVING.',
            React.createElement('br', { key: 'br' }),
            React.createElement('span', { className: 'gradient-text-neon', key: 'span' }, 'SO SHOULD YOU.')
          ]),
          React.createElement('p', { className: 'hero-description-modern', key: 'desc' }, [
            'The competition has heightened — now every advantage counts.',
            React.createElement('br', { key: 'br' }),
            'Our AI ensures your schedule works as hard as your athletes.',
            React.createElement('br', { key: 'br2' }),
            React.createElement('span', { className: 'hero-actions-line', key: 'actions-line1' }, [
              React.createElement('span', { className: 'hero-action-bold action-1', key: 'action1' }, 'Optimize every matchup. '),
              React.createElement('span', { className: 'hero-action-bold action-2', key: 'action2' }, 'Minimize every obstacle.')
            ]),
            React.createElement('br', { key: 'br3' }),
            React.createElement('span', { className: 'hero-action-bold action-3', key: 'action3' }, 'Maximize every opportunity.')
          ]),
          React.createElement('div', { className: 'hero-actions-modern', key: 'actions' }, [
            React.createElement('button', { 
              className: 'btn-primary-glow metallic-button-enhanced', 
              key: 'create',
              onClick: () => setCurrentSection('schedule')
            }, [
              React.createElement('span', { key: 'text' }, 'CREATE SCHEDULE'),
              React.createElement('span', { className: 'btn-arrow', key: 'arrow' }, '→')
            ]),
            React.createElement('button', { 
              className: 'btn-secondary-glass', 
              key: 'view',
              onClick: () => setCurrentSection('analytics')
            }, 'VIEW ANALYTICS DASHBOARD')
          ])
        ])
      ])
    ]),

    // Hero Divider
    React.createElement('div', { className: 'hero-divider', key: 'hero-divider' }),

    // Big 12 News Feed Section
    React.createElement('section', { className: 'news-feed-section', key: 'news-feed' }, [
      React.createElement('h2', { className: 'section-title title-metallic', key: 'news-title' }, 'LATEST BIG 12 NEWS'),
      React.createElement('div', { className: 'news-scroll-container', key: 'news-container' }, [
        React.createElement('div', { className: 'news-scroll-track', key: 'news-track' }, [
          React.createElement('div', { className: 'news-item', key: 'news1' }, [
            React.createElement('div', { className: 'news-content', key: 'content1' }, [
              React.createElement('span', { className: 'news-category', key: 'cat1' }, 'BASEBALL'),
              React.createElement('a', { 
                href: 'https://big12sports.com/news/2025/5/25/arizonas-late-inning-heroics-claim-phillips-66-big-12-baseball-championship-title.aspx',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'news-headline-link',
                key: 'head1'
              }, [
                React.createElement('h3', { className: 'news-headline', key: 'headline1' }, 'Arizona Claims Phillips 66 Big 12 Baseball Championship')
              ]),
              React.createElement('p', { className: 'news-summary', key: 'sum1' }, 'Wildcats defeat TCU 2-1 in dramatic 10-inning finale to capture conference tournament title'),
              React.createElement('span', { className: 'news-date', key: 'date1' }, 'May 25, 2025')
            ])
          ]),
          React.createElement('div', { className: 'news-item', key: 'news2' }, [
            React.createElement('div', { className: 'news-content', key: 'content2' }, [
              React.createElement('span', { className: 'news-category', key: 'cat2' }, 'FOOTBALL'),
              React.createElement('a', { 
                href: 'https://big12sports.com/news/2025/2/4/big-12-conference-releases-2025-football-schedule.aspx',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'news-headline-link',
                key: 'head2'
              }, [
                React.createElement('h3', { className: 'news-headline', key: 'headline2' }, 'Big 12 Conference Releases 2025 Football Schedule')
              ]),
              React.createElement('p', { className: 'news-summary', key: 'sum2' }, 'All 16 programs will play nine league games as the Big 12 celebrates its 30th football season'),
              React.createElement('span', { className: 'news-date', key: 'date2' }, 'February 4, 2025')
            ])
          ]),
          React.createElement('div', { className: 'news-item', key: 'news3' }, [
            React.createElement('div', { className: 'news-content', key: 'content3' }, [
              React.createElement('span', { className: 'news-category', key: 'cat3' }, 'CHAMPIONSHIPS'),
              React.createElement('a', { 
                href: 'https://big12sports.com/news',
                target: '_blank',
                rel: 'noopener noreferrer',
                className: 'news-headline-link',
                key: 'head3'
              }, [
                React.createElement('h3', { className: 'news-headline', key: 'headline3' }, 'Big 12 Spring Championships Schedule Announced')
              ]),
              React.createElement('p', { className: 'news-summary', key: 'sum3' }, 'Conference reveals dates and locations for track & field, tennis, and golf championships'),
              React.createElement('span', { className: 'news-date', key: 'date3' }, 'March 15, 2025')
            ])
          ])
        ])
      ]),
      
      // Big 12 Radio Player Section
      React.createElement('div', { className: 'radio-section', key: 'radio-section' }, [
        React.createElement('h3', { className: 'radio-title', key: 'radio-title' }, 'BIG 12 RADIO LIVE'),
        React.createElement('iframe', {
          src: 'https://tunein.com/embed/player/s329464/',
          style: { width: '100%', height: '100px' },
          scrolling: 'no',
          frameBorder: 'no',
          key: 'radio-iframe'
        })
      ])
    ]),

    // Divider after news/radio section
    React.createElement('div', { className: 'hero-divider', key: 'news-radio-divider' }),

    // Big 12 Standings & Scores Section
    React.createElement('section', { className: 'standings-scores-section', key: 'standings-scores' }, [
      React.createElement('h2', { className: 'section-title title-metallic', key: 'section-title' }, 'BIG 12 SCORES & STANDINGS'),
      React.createElement('div', { className: 'standings-scores-grid', key: 'grid' }, [
        React.createElement(StandingsSection, { key: 'standings' }),
        React.createElement('div', { className: 'scores-upcoming-stack', key: 'scores-stack' }, [
          React.createElement(RecentScoresSection, { key: 'recent-scores' }),
          React.createElement(UpcomingGamesSection, { key: 'upcoming-games' })
        ])
      ])
    ]),

    // Divider after standings and scores section
    React.createElement('div', { className: 'hero-divider', key: 'standings-scores-divider' }),

    // Big 12 Conference Map Section
    React.createElement('section', { className: 'conference-map-section', key: 'conference-map' }, [
      React.createElement('h2', { className: 'section-title title-metallic', key: 'map-title' }, 'BIG 12 CONFERENCE MAP'),
      React.createElement('div', { className: 'map-container', key: 'map-container' }, [
        React.createElement('div', { className: 'map-stats', key: 'map-stats' }, [
          React.createElement('div', { className: 'stat-item', key: 'schools' }, [
            React.createElement('span', { className: 'stat-number', key: 'num' }, '16'),
            React.createElement('span', { className: 'stat-label', key: 'label' }, 'Member Schools')
          ]),
          React.createElement('div', { className: 'stat-item', key: 'states' }, [
            React.createElement('span', { className: 'stat-number', key: 'num' }, '11'),
            React.createElement('span', { className: 'stat-label', key: 'label' }, 'States')
          ]),
          React.createElement('div', { className: 'stat-item', key: 'miles' }, [
            React.createElement('span', { className: 'stat-number', key: 'num' }, '1,847'),
            React.createElement('span', { className: 'stat-label', key: 'label' }, 'Avg. Travel Miles')
          ])
        ])
      ])
    ])
    ]),

    // Schedule Builder Section
    currentSection === 'schedule' && React.createElement('div', { key: 'schedule-builder-section' }, [
      React.createElement(ScheduleBuilderApp, { key: 'schedule-builder' })
    ]),

    // AI/ML Agents Section
    currentSection === 'ai-ml' && React.createElement('div', { key: 'ai-ml-section' }, [
      React.createElement(AIMLControlCenter, { key: 'ai-ml-control' })
    ]),

    // Analytics Section
    currentSection === 'analytics' && React.createElement('div', { key: 'analytics-section' }, [
      React.createElement(AnalyticsDashboard, { key: 'analytics-dashboard' })
    ]),

    // Teams Section
    currentSection === 'teams' && React.createElement('div', { key: 'teams-section' }, [
      React.createElement(TeamsManagement, { key: 'teams-management' })
    ]),

    // Settings Section
    currentSection === 'settings' && React.createElement(SettingsPage, { key: 'settings', user: user }),

    // Fixed Bottom Status Bar
    React.createElement(AgentStatusIndicator, { key: 'bottom-status' }),

    // Authentication Modal
    React.createElement(AuthModal, {
      isOpen: showAuthModal,
      mode: authMode,
      onLogin: handleLogin,
      onClose: () => setShowAuthModal(false),
      onSwitchMode: setAuthMode,
      key: 'auth-modal'
    })

  ]);
}

// Render the app using React 18 createRoot
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(FlexTimeApp));