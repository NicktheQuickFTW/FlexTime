const { useState, useEffect } = React;

// Function to get theme-appropriate logo path
const getThemedLogo = (logoFileName) => {
  const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
  const themeFolder = isDarkTheme ? 'dark' : 'light';
  return `/assets/logos/teams/${themeFolder}/${logoFileName}`;
};

// Big 12 teams data
const big12Teams = [
  { name: 'Arizona', abbreviation: 'ARIZ', logo: 'arizona.svg' },
  { name: 'Arizona State', abbreviation: 'ASU', logo: 'arizona_state.svg' },
  { name: 'Baylor', abbreviation: 'BAY', logo: 'baylor.svg' },
  { name: 'BYU', abbreviation: 'BYU', logo: 'byu.svg' },
  { name: 'Cincinnati', abbreviation: 'CIN', logo: 'cincinnati.svg' },
  { name: 'Colorado', abbreviation: 'COL', logo: 'colorado.svg' },
  { name: 'Houston', abbreviation: 'HOU', logo: 'houston.svg' },
  { name: 'Iowa State', abbreviation: 'ISU', logo: 'iowa_state.svg' },
  { name: 'Kansas', abbreviation: 'KU', logo: 'kansas.svg' },
  { name: 'Kansas State', abbreviation: 'KSU', logo: 'kansas_state.svg' },
  { name: 'Oklahoma State', abbreviation: 'OKST', logo: 'oklahoma_state.svg' },
  { name: 'TCU', abbreviation: 'TCU', logo: 'tcu.svg' },
  { name: 'Texas Tech', abbreviation: 'TTU', logo: 'texas_tech.svg' },
  { name: 'UCF', abbreviation: 'UCF', logo: 'ucf.svg' },
  { name: 'Utah', abbreviation: 'UTAH', logo: 'utah.svg' },
  { name: 'West Virginia', abbreviation: 'WVU', logo: 'west_virginia.svg' }
];

function TeamCard({ team, index }) {
  return React.createElement('div', {
    className: 'team-card',
    style: { animationDelay: `${index * 0.1}s` }
  }, [
    React.createElement('div', { className: 'team-logo', key: 'logo' }, [
      React.createElement('img', {
        src: getThemedLogo(team.logo),
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

function AgentStatusIndicator({ status }) {
  return React.createElement('div', {
    className: `agent-status ${status}`
  }, [
    React.createElement('div', { className: 'status-dot', key: 'dot' }),
    React.createElement('span', { key: 'text' }, 
      `AI Scheduling Agent: ${status.charAt(0).toUpperCase() + status.slice(1)}`
    )
  ]);
}


function FlexTimeApp() {
  const [agentStatus, setAgentStatus] = useState('active');
  const [stats] = useState({
    totalSchedules: 156,
    optimizationRate: 94.2,
    travelSavings: 28.5,
    conflictResolution: 99.1
  });

  useEffect(() => {
    // Simulate agent activity
    const interval = setInterval(() => {
      setAgentStatus(prev => {
        const statuses = ['active', 'processing', 'optimizing'];
        const currentIndex = statuses.indexOf(prev);
        return statuses[(currentIndex + 1) % statuses.length];
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return React.createElement('div', { className: 'modern-app' }, [
    // Modern Header
    React.createElement('header', { className: 'modern-header', key: 'header' }, [
      React.createElement('div', { className: 'header-container', key: 'container' }, [
        React.createElement('div', { className: 'logo-section', key: 'logo-section' }, [
          React.createElement('img', {
            src: '/assets/logos/conferences/big_12_primary_white.svg',
            alt: 'Big 12',
            className: 'big12-logo-small',
            key: 'img'
          }),
          React.createElement('h1', { className: 'title-metallic', key: 'title' }, 'FLEXTIME')
        ]),
        React.createElement('nav', { className: 'nav-links-modern', key: 'nav' }, [
          React.createElement('a', { href: '#dashboard', className: 'nav-link-modern active', key: 'dash' }, 'DASHBOARD'),
          React.createElement('a', { href: '#schedule', className: 'nav-link-modern', key: 'sched' }, 'SCHEDULE BUILDER'),
          React.createElement('a', { href: '#analytics', className: 'nav-link-modern', key: 'analytics' }, 'ANALYTICS'),
          React.createElement('a', { href: '#teams', className: 'nav-link-modern', key: 'teams' }, 'TEAMS')
        ])
      ])
    ]),

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
            React.createElement('button', { className: 'btn-primary-glow metallic-button-enhanced', key: 'create' }, [
              React.createElement('span', { key: 'text' }, 'CREATE SCHEDULE'),
              React.createElement('span', { className: 'btn-arrow', key: 'arrow' }, '→')
            ]),
            React.createElement('button', { className: 'btn-secondary-glass', key: 'view' }, 'VIEW ANALYTICS DASHBOARD')
          ])
        ])
      ])
    ]),

    // Stats Section
    React.createElement('section', { className: 'stats-section', key: 'stats' }, [
      React.createElement('div', { className: 'stats-grid', key: 'grid' }, [
        React.createElement('div', { className: 'stat-card floating-card', key: 'schedules' }, [
          React.createElement('div', { className: 'stat-icon', key: 'icon' }, '📅'),
          React.createElement('div', { className: 'stat-number', key: 'number' }, stats.totalSchedules),
          React.createElement('div', { className: 'stat-label', key: 'label' }, 'Schedules Generated')
        ]),
        React.createElement('div', { className: 'stat-card floating-card', key: 'optimization' }, [
          React.createElement('div', { className: 'stat-icon', key: 'icon' }, '🎯'),
          React.createElement('div', { className: 'stat-number', key: 'number' }, `${stats.optimizationRate}%`),
          React.createElement('div', { className: 'stat-label', key: 'label' }, 'Optimization Rate')
        ]),
        React.createElement('div', { className: 'stat-card floating-card', key: 'travel' }, [
          React.createElement('div', { className: 'stat-icon', key: 'icon' }, '✈️'),
          React.createElement('div', { className: 'stat-number', key: 'number' }, `${stats.travelSavings}%`),
          React.createElement('div', { className: 'stat-label', key: 'label' }, 'Travel Cost Savings')
        ]),
        React.createElement('div', { className: 'stat-card floating-card', key: 'conflict' }, [
          React.createElement('div', { className: 'stat-icon', key: 'icon' }, '⚖️'),
          React.createElement('div', { className: 'stat-number', key: 'number' }, `${stats.conflictResolution}%`),
          React.createElement('div', { className: 'stat-label', key: 'label' }, 'Conflict Resolution')
        ])
      ])
    ]),

    // Agent Status
    React.createElement('section', { className: 'agent-section', key: 'agent' }, [
      React.createElement('div', { className: 'agent-container', key: 'container' }, [
        React.createElement(AgentStatusIndicator, { status: agentStatus, key: 'status' }),
        React.createElement('p', { className: 'agent-description', key: 'desc' }, 
          'Multi-agent AI system continuously optimizing schedules across all Big 12 sports'
        )
      ])
    ]),

    // Feature Cards Section (for analytics page)
    React.createElement('section', { className: 'features-section', key: 'features' }, [
      React.createElement('div', { className: 'features-grid', key: 'grid' }, [
        React.createElement('div', { className: 'feature-card floating-card', key: 'travel' }, [
          React.createElement('div', { className: 'feature-icon', key: 'icon' }, 'TO'),
          React.createElement('h3', { className: 'feature-title', key: 'title' }, 'TRAVEL OPTIMIZATION'),
          React.createElement('p', { className: 'feature-description', key: 'desc' }, 
            'Advanced algorithms minimize travel distances and costs while respecting venue availability.'
          ),
          React.createElement('button', { className: 'feature-button', key: 'btn' }, 'View Heat Map →')
        ]),
        React.createElement('div', { className: 'feature-card floating-card', key: 'balance' }, [
          React.createElement('div', { className: 'feature-icon', key: 'icon' }, 'CB'),
          React.createElement('h3', { className: 'feature-title', key: 'title' }, 'COMPETITIVE BALANCE'),
          React.createElement('p', { className: 'feature-description', key: 'desc' }, 
            'Ensures fair distribution of home/away games and optimal rest periods between competitions.'
          ),
          React.createElement('button', { className: 'feature-button', key: 'btn' }, 'View Analysis →')
        ]),
        React.createElement('div', { className: 'feature-card floating-card', key: 'championship' }, [
          React.createElement('div', { className: 'feature-icon', key: 'icon' }, 'CA'),
          React.createElement('h3', { className: 'feature-title', key: 'title' }, 'CHAMPIONSHIP ALIGNMENT'),
          React.createElement('p', { className: 'feature-description', key: 'desc' }, 
            'Schedules are optimized to maximize opportunities for NCAA tournament success.'
          ),
          React.createElement('button', { className: 'feature-button', key: 'btn' }, 'View Projections →')
        ])
      ])
    ]),


  ]);
}

// Render the app
ReactDOM.render(React.createElement(FlexTimeApp), document.getElementById('root'));