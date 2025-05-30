/**
 * FlexTime FT Builder - Custom Sidebar Component
 * Built from scratch to match FlexTime's design patterns
 */

function FlexTimeSidebar({ 
  selectedSport, 
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
      
      // Always use light logos for the scheduling sidebar
      const logoTheme = 'light';
      const logoSuffix = '-light';
      
      return `/assets/logos/teams/${logoTheme}/${logoName}${logoSuffix}.svg`;
    };

    return React.createElement('div', {
      key: team.id,
      className: 'sidebar-team-item',
      draggable: true,
      onDragStart: (e) => onTeamDragStart(e, team),
      title: team.name
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
        key: 'abbr',
        className: 'team-abbreviation'
      }, team.abbr),
      React.createElement('span', {
        key: 'name',
        className: 'team-full-name'
      }, team.name)
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
    
    // Sidebar Header
    React.createElement('div', { className: 'sidebar-header', key: 'header' }, [
      React.createElement('span', {
        key: 'icon',
        className: 'sidebar-header-icon'
      }, '⚙'),
      React.createElement('h3', {
        key: 'title',
        className: 'sidebar-header-title'
      }, 'Schedule Tools')
    ]),

    // Sidebar Content
    React.createElement('div', { className: 'sidebar-content', key: 'content' }, [
      
      // Teams Section
      React.createElement('div', { className: 'sidebar-section', key: 'teams' }, [
        React.createElement('div', { className: 'sidebar-section-header', key: 'teams-header' }, [
          React.createElement('span', {
            key: 'icon',
            className: 'sidebar-section-icon'
          }, getSportIcon(selectedSport)),
          React.createElement('h4', {
            key: 'title',
            className: 'sidebar-section-title'
          }, `${selectedSport.toUpperCase()} TEAMS`)
        ]),
        React.createElement('div', { className: 'sidebar-teams-grid', key: 'teams-grid' }, 
          teams.map(team => renderTeamItem(team))
        )
      ]),

      // Constraints Section
      React.createElement('div', { className: 'sidebar-section', key: 'constraints' }, [
        React.createElement('div', { className: 'sidebar-section-header', key: 'constraints-header' }, [
          React.createElement('span', {
            key: 'icon',
            className: 'sidebar-section-icon'
          }, '⚖'),
          React.createElement('h4', {
            key: 'title',
            className: 'sidebar-section-title'
          }, 'CONSTRAINTS')
        ]),
        React.createElement('div', { className: 'sidebar-constraints', key: 'constraints-grid' }, [
          renderConstraintToggle('homeAwayBalance', 'Home/Away Balance', constraints.homeAwayBalance),
          renderConstraintToggle('rivalryProtection', 'Rivalry Protection', constraints.rivalryProtection),
          renderConstraintToggle('travelOptimization', 'Travel Optimization', constraints.travelOptimization),
          renderConstraintToggle('tvWindows', 'TV Window Compliance', constraints.tvWindows),
          renderConstraintToggle('weatherConsiderations', 'Weather Considerations', constraints.weatherConsiderations)
        ])
      ]),

      // AI Analytics Section
      React.createElement('div', { className: 'sidebar-section', key: 'analytics' }, [
        React.createElement('div', { className: 'sidebar-section-header', key: 'analytics-header' }, [
          React.createElement('span', {
            key: 'icon',
            className: 'sidebar-section-icon'
          }, '◆'),
          React.createElement('h4', {
            key: 'title',
            className: 'sidebar-section-title'
          }, 'AI INSIGHTS')
        ]),
        React.createElement('div', { className: 'sidebar-constraints', key: 'insights' }, [
          React.createElement('div', { className: 'constraint-control', key: 'compass' }, [
            React.createElement('span', { className: 'constraint-label', key: 'label' }, 'COMPASS Score'),
            React.createElement('span', { 
              className: 'constraint-label', 
              key: 'value',
              style: { color: 'var(--color-silver-primary)', fontWeight: 'bold' }
            }, '87.5')
          ]),
          React.createElement('div', { className: 'constraint-control', key: 'conflicts' }, [
            React.createElement('span', { className: 'constraint-label', key: 'label' }, 'Conflicts'),
            React.createElement('span', { 
              className: 'constraint-label', 
              key: 'value',
              style: { color: '#ff4444', fontWeight: 'bold' }
            }, '3')
          ]),
          React.createElement('div', { className: 'constraint-control', key: 'optimization' }, [
            React.createElement('span', { className: 'constraint-label', key: 'label' }, 'Optimization'),
            React.createElement('span', { 
              className: 'constraint-label', 
              key: 'value',
              style: { color: '#00ff7f', fontWeight: 'bold' }
            }, '92%')
          ])
        ])
      ])
    ]),

    // Sidebar Actions
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

// Export for use in main ft builder
window.FlexTimeSidebar = FlexTimeSidebar;