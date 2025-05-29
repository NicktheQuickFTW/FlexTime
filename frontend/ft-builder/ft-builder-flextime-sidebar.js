/**
 * FlexTime Schedule Builder - Custom Sidebar Component
 * Built from scratch to match FlexTime's design patterns
 */

function FlexTimeSidebar({ 
  selectedSport, 
  setSelectedSport,
  teams, 
  onTeamDragStart, 
  constraints, 
  onConstraintChange,
  onGenerateSchedule,
  onOptimizeSchedule 
}) {
  const [activeSection, setActiveSection] = React.useState('teams');

  // Get sport-specific icon (monochrome Unicode symbols)
  function getSportIcon(sport) {
    switch(sport.toLowerCase()) {
      case 'football': return '🏈︎';    // American football (text presentation)
      case 'soccer': return '⚽︎';      // Soccer ball (text presentation)
      case 'basketball':
      case 'basketball-women': return '🏀︎'; // Basketball (text presentation)
      case 'baseball': return '⚾︎';     // Baseball (text presentation)
      case 'softball': return '🥎︎';     // Softball (text presentation)
      case 'volleyball': return '🏐︎';   // Volleyball (text presentation)
      default: return '⚽︎';             // Default to soccer ball
    }
  }

  // Render team item with FlexTime styling
  function renderTeamItem(team) {
    // Get current theme from document attribute or default to dark
    const getCurrentTheme = () => {
      return document.documentElement.getAttribute('data-theme') || 'dark';
    };

    // Convert team name to logo filename format with theme support
    const getLogoPath = (teamName) => {
      const logoName = teamName.toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      
      // Always use dark logos for the scheduling sidebar
      const logoTheme = 'dark';
      const logoSuffix = '-dark';
      
      return `/assets/logos/teams/${logoTheme}/${logoName}${logoSuffix}.svg`;
    };
    
    // Combine team name and mascot
    const getFullTeamName = (team) => {
      return team.mascot ? `${team.name} ${team.mascot}` : team.name;
    };

    return React.createElement('div', {
      key: team.id,
      className: 'sidebar-team-item',
      draggable: true,
      onDragStart: (e) => onTeamDragStart(e, team),
      title: getFullTeamName(team)
    }, [
      React.createElement('img', {
        key: 'logo',
        className: 'team-logo-small',
        src: getLogoPath(team.name),
        alt: `${team.name} logo`,
        onError: (e) => {
          e.target.style.display = 'none';
        }
      }),
      React.createElement('span', {
        key: 'name',
        className: 'team-full-name'
      }, getFullTeamName(team))
    ]);
  }

  // Render constraint toggle
  function renderConstraintToggle(key, label, value) {
    return React.createElement('div', {
      key: key,
      className: 'constraint-control'
    }, [
      React.createElement('span', {
        key: 'label',
        className: 'constraint-label'
      }, label),
      React.createElement('button', {
        key: 'toggle',
        className: `constraint-toggle ${value ? 'active' : ''}`,
        onClick: () => onConstraintChange(key, !value)
      }, [
        React.createElement('div', {
          key: 'slider',
          className: 'toggle-slider'
        })
      ])
    ]);
  }

  return React.createElement('div', { className: 'flextime-sidebar' }, [
    
    // Sidebar Header with Sport Selector
    React.createElement('div', { className: 'sidebar-header', key: 'header' }, [
      React.createElement('select', {
        key: 'sport-selector',
        className: 'sport-selector glass-dropdown sidebar-sport-selector',
        value: selectedSport,
        onChange: (e) => setSelectedSport(e.target.value)
      }, [
        // Men's Sports
        React.createElement('optgroup', { label: 'Men\'s Sports', key: 'mens-sports' }, [
          React.createElement('option', { value: 'football', key: 'football' }, 'Football (16 teams)'),
          React.createElement('option', { value: 'basketball', key: 'basketball' }, 'Men\'s Basketball (16 teams)'),
          React.createElement('option', { value: 'baseball', key: 'baseball' }, 'Baseball (14 teams)'),
          React.createElement('option', { value: 'wrestling', key: 'wrestling' }, 'Wrestling (14 teams)'),
          React.createElement('option', { value: 'tennis-men', key: 'tennis-men' }, 'Men\'s Tennis (9 teams)')
        ]),
        // Women's Sports
        React.createElement('optgroup', { label: 'Women\'s Sports', key: 'womens-sports' }, [
          React.createElement('option', { value: 'basketball-women', key: 'basketball-women' }, 'Women\'s Basketball (16 teams)'),
          React.createElement('option', { value: 'soccer', key: 'soccer' }, 'Soccer (16 teams)'),
          React.createElement('option', { value: 'volleyball', key: 'volleyball' }, 'Volleyball (15 teams)'),
          React.createElement('option', { value: 'softball', key: 'softball' }, 'Softball (11 teams)'),
          React.createElement('option', { value: 'gymnastics', key: 'gymnastics' }, 'Gymnastics (7 teams)'),
          React.createElement('option', { value: 'lacrosse', key: 'lacrosse' }, 'Lacrosse (6 teams)'),
          React.createElement('option', { value: 'tennis-women', key: 'tennis-women' }, 'Women\'s Tennis (16 teams)')
        ])
      ])
    ]),

    // Sidebar Content
    React.createElement('div', { className: 'sidebar-content', key: 'content' }, [
      
      // Teams Section
      React.createElement('div', { className: 'sidebar-section', key: 'teams' }, [
        React.createElement('div', { className: 'sidebar-section-header', key: 'teams-header' }, [
          React.createElement('h4', {
            key: 'title',
            className: 'sidebar-section-title'
          }, `${selectedSport.toUpperCase()} TEAMS`)
        ]),
        React.createElement('div', { className: 'sidebar-teams-grid', key: 'teams-grid' }, 
          teams.map(team => renderTeamItem(team))
        )
      ])
    ]),

    // Parameters Section (Moved up)
    React.createElement('div', { className: 'sidebar-section', key: 'constraints' }, [
      React.createElement('div', { className: 'sidebar-section-header', key: 'constraints-header' }, [
        React.createElement('h4', {
          key: 'title',
          className: 'sidebar-section-title'
        }, 'PARAMETERS')
      ]),
      React.createElement('div', { className: 'sidebar-constraints', key: 'constraints-grid' }, [
        renderConstraintToggle('homeAwayBalance', 'Home/Away Balance', constraints.homeAwayBalance),
        renderConstraintToggle('rivalryProtection', 'Rivalry Protection', constraints.rivalryProtection),
        renderConstraintToggle('travelOptimization', 'Travel Optimization', constraints.travelOptimization),
        renderConstraintToggle('tvWindows', 'TV Window Compliance', constraints.tvWindows),
        renderConstraintToggle('weatherConsiderations', 'Weather Considerations', constraints.weatherConsiderations)
      ])
    ]),

    // AI Analytics Section - Moved to ScheduleAnalyticsPanel

    // Sidebar Actions (Now at the bottom after all sections)
    React.createElement('div', { className: 'sidebar-actions', key: 'actions' }, [
      React.createElement('button', {
        key: 'generate',
        className: 'sidebar-action-btn primary',
        onClick: onGenerateSchedule
      }, [
        React.createElement('span', { key: 'icon' }, '▶'),
        React.createElement('span', { key: 'text' }, 'Generate Schedule')
      ]),
      React.createElement('button', {
        key: 'optimize',
        className: 'sidebar-action-btn',
        onClick: onOptimizeSchedule
      }, [
        React.createElement('span', { key: 'icon' }, '▲'),
        React.createElement('span', { key: 'text' }, 'Optimize Current')
      ])
    ])
  ]);
}

// Export for use in main schedule builder
window.FlexTimeSidebar = FlexTimeSidebar;