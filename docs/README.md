# FlexTime Documentation Portal

Welcome to the comprehensive FlexTime Scheduling System documentation! This portal provides everything you need to use, develop, deploy, and maintain FlexTime effectively.

## 🚀 Quick Start

**New to FlexTime?** Start here:
1. **[5-Minute Overview](./user-guides/system-overview.md)** - Understand what FlexTime does
2. **[Quick Start Guide](./user-guides/quick-start.md)** - Create your first schedule
3. **[Video Tutorials](./user-guides/videos/README.md)** - Learn through guided videos

**Need Help?** Check our **[Troubleshooting Guide](./troubleshooting/README.md)** for common solutions.

## 📚 Documentation Sections

### 👥 For End Users
**[User Guides](./user-guides/README.md)**
- Complete guides for using FlexTime effectively
- Step-by-step tutorials and best practices
- Video walkthroughs and interactive examples
- FAQ and common use cases

### 💻 For Developers
**[Developer Documentation](./developer-docs/README.md)**
- Comprehensive API documentation
- SDK guides for JavaScript, Python, C#, and Go
- Integration patterns and best practices
- Code examples and sample applications

### 🏢 For Administrators
**[Administration Guides](./admin-guides/README.md)**
- System administration and configuration
- User management and security
- Monitoring and performance optimization
- Backup and recovery procedures

### 🏗️ For Architects
**[System Architecture](./architecture/README.md)**
- Technical architecture and design decisions
- Component relationships and data flows
- Scalability and performance patterns
- Security architecture and considerations

### 🚀 For DevOps
**[Deployment Guides](./deployment/README.md)**
- Complete deployment instructions
- Infrastructure as Code templates
- CI/CD pipeline configurations
- Production best practices

### 🔧 For Support Teams
**[Troubleshooting](./troubleshooting/README.md)**
- Common issues and solutions
- Diagnostic tools and procedures
- Emergency response protocols
- Performance optimization guides

## 🎯 Interactive Features

### 🔍 Smart Search
Our documentation includes intelligent search capabilities:

```html
<!-- Search Widget (Implementation Ready) -->
<div id="docs-search">
  <input type="text" 
         placeholder="Search documentation..." 
         id="search-input"
         autocomplete="off">
  <div id="search-results"></div>
</div>

<script>
// Advanced search with fuzzy matching and context
const searchIndex = {
  'schedule creation': {
    path: './user-guides/schedule-creation.md',
    context: 'Creating and managing schedules',
    tags: ['beginner', 'tutorial', 'schedules']
  },
  'api authentication': {
    path: './developer-docs/api/authentication.md',
    context: 'API security and token management',
    tags: ['developer', 'api', 'security']
  },
  'deployment kubernetes': {
    path: './deployment/kubernetes-deployment.md',
    context: 'Deploying FlexTime on Kubernetes',
    tags: ['devops', 'kubernetes', 'deployment']
  }
  // ... more search entries
};

function performSearch(query) {
  const results = [];
  const queryLower = query.toLowerCase();
  
  for (const [key, value] of Object.entries(searchIndex)) {
    if (key.includes(queryLower) || 
        value.context.toLowerCase().includes(queryLower) ||
        value.tags.some(tag => tag.includes(queryLower))) {
      results.push({
        title: key,
        ...value,
        relevance: calculateRelevance(query, key, value)
      });
    }
  }
  
  return results.sort((a, b) => b.relevance - a.relevance);
}
</script>
```

### 📹 Video Learning Paths

**Beginner Path** (2 hours total)
1. **[FlexTime Overview](./user-guides/videos/overview.md)** (5 min)
2. **[First Schedule Creation](./user-guides/videos/first-schedule.md)** (10 min)
3. **[Basic Constraints](./user-guides/videos/constraint-basics.md)** (8 min)
4. **[Schedule Optimization](./user-guides/videos/optimization-basics.md)** (12 min)

**Developer Path** (3 hours total)
1. **[API Introduction](./developer-docs/videos/api-intro.md)** (15 min)
2. **[SDK Usage](./developer-docs/videos/sdk-usage.md)** (20 min)
3. **[Integration Patterns](./developer-docs/videos/integration-patterns.md)** (25 min)
4. **[Advanced Features](./developer-docs/videos/advanced-features.md)** (30 min)

**Administrator Path** (4 hours total)
1. **[System Setup](./admin-guides/videos/system-setup.md)** (30 min)
2. **[User Management](./admin-guides/videos/user-management.md)** (20 min)
3. **[Monitoring Setup](./admin-guides/videos/monitoring-setup.md)** (25 min)
4. **[Troubleshooting](./admin-guides/videos/troubleshooting.md)** (35 min)

### 🧪 Interactive Examples

#### Live API Explorer
```html
<!-- Interactive API Testing Widget -->
<div id="api-explorer">
  <div class="api-section">
    <h3>Try the FlexTime API</h3>
    <select id="endpoint-selector">
      <option value="GET /schedules">List Schedules</option>
      <option value="POST /schedules">Create Schedule</option>
      <option value="GET /teams">List Teams</option>
      <option value="POST /constraints">Add Constraint</option>
    </select>
    
    <div id="request-builder">
      <label>API Token:</label>
      <input type="password" id="api-token" placeholder="Enter your API token">
      
      <label>Request Body:</label>
      <textarea id="request-body" rows="10">{
  "name": "2025 Basketball Season",
  "sport": "basketball",
  "teams": ["kansas", "kansas-state", "baylor"]
}</textarea>
      
      <button onclick="executeRequest()">Send Request</button>
    </div>
    
    <div id="response-display">
      <h4>Response:</h4>
      <pre id="response-content"></pre>
    </div>
  </div>
</div>

<script>
async function executeRequest() {
  const endpoint = document.getElementById('endpoint-selector').value;
  const token = document.getElementById('api-token').value;
  const body = document.getElementById('request-body').value;
  
  const [method, path] = endpoint.split(' ');
  
  try {
    const response = await fetch(`https://api.flextime.big12.org/v1${path}`, {
      method: method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: method !== 'GET' ? body : undefined
    });
    
    const data = await response.json();
    document.getElementById('response-content').textContent = 
      JSON.stringify(data, null, 2);
  } catch (error) {
    document.getElementById('response-content').textContent = 
      `Error: ${error.message}`;
  }
}
</script>
```

#### Schedule Builder Demo
```html
<!-- Interactive Schedule Builder -->
<div id="schedule-builder-demo">
  <h3>Interactive Schedule Builder</h3>
  
  <div class="builder-controls">
    <div class="control-group">
      <label>Sport:</label>
      <select id="demo-sport">
        <option value="basketball">Basketball</option>
        <option value="football">Football</option>
        <option value="baseball">Baseball</option>
      </select>
    </div>
    
    <div class="control-group">
      <label>Teams:</label>
      <div id="team-selector">
        <label><input type="checkbox" value="kansas"> Kansas</label>
        <label><input type="checkbox" value="kansas-state"> Kansas State</label>
        <label><input type="checkbox" value="baylor"> Baylor</label>
        <label><input type="checkbox" value="tcu"> TCU</label>
        <label><input type="checkbox" value="texas-tech"> Texas Tech</label>
      </div>
    </div>
    
    <div class="control-group">
      <label>Games per Team:</label>
      <input type="number" id="games-per-team" value="18" min="10" max="30">
    </div>
    
    <button onclick="generateDemoSchedule()">Generate Schedule</button>
  </div>
  
  <div id="demo-schedule-output">
    <h4>Generated Schedule Preview:</h4>
    <div id="schedule-grid"></div>
  </div>
</div>

<script>
function generateDemoSchedule() {
  const sport = document.getElementById('demo-sport').value;
  const selectedTeams = Array.from(
    document.querySelectorAll('#team-selector input:checked')
  ).map(input => input.value);
  const gamesPerTeam = parseInt(document.getElementById('games-per-team').value);
  
  // Simulate schedule generation
  const schedule = generateSimulatedSchedule(selectedTeams, gamesPerTeam);
  displayScheduleGrid(schedule);
}

function generateSimulatedSchedule(teams, gamesPerTeam) {
  // Simple round-robin algorithm for demo
  const games = [];
  let gameId = 1;
  
  for (let round = 0; round < gamesPerTeam / (teams.length - 1); round++) {
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        games.push({
          id: gameId++,
          home: teams[i],
          away: teams[j],
          date: new Date(2025, 10, round * 7 + (gameId % 7)),
          time: '19:00'
        });
      }
    }
  }
  
  return games.slice(0, teams.length * gamesPerTeam / 2);
}

function displayScheduleGrid(games) {
  const grid = document.getElementById('schedule-grid');
  grid.innerHTML = games.slice(0, 10).map(game => `
    <div class="game-card">
      <div class="game-teams">${game.away} @ ${game.home}</div>
      <div class="game-datetime">${game.date.toDateString()} ${game.time}</div>
    </div>
  `).join('');
}
</script>

<style>
.game-card {
  border: 1px solid #ddd;
  padding: 10px;
  margin: 5px 0;
  border-radius: 5px;
  background: #f9f9f9;
}

.game-teams {
  font-weight: bold;
  color: #333;
}

.game-datetime {
  font-size: 0.9em;
  color: #666;
}

.control-group {
  margin: 10px 0;
}

.control-group label {
  display: block;
  margin: 5px 0;
}

#team-selector label {
  display: inline-block;
  margin-right: 15px;
}
</style>
```

### 📊 Live System Status
```html
<!-- Real-time System Status Dashboard -->
<div id="system-status-dashboard">
  <h3>FlexTime System Status</h3>
  
  <div class="status-grid">
    <div class="status-item">
      <div class="status-indicator" id="api-status">🟢</div>
      <div class="status-label">API Service</div>
      <div class="status-detail" id="api-detail">Response: 145ms</div>
    </div>
    
    <div class="status-item">
      <div class="status-indicator" id="db-status">🟢</div>
      <div class="status-label">Database</div>
      <div class="status-detail" id="db-detail">Query time: 23ms</div>
    </div>
    
    <div class="status-item">
      <div class="status-indicator" id="cache-status">🟢</div>
      <div class="status-label">Cache</div>
      <div class="status-detail" id="cache-detail">Hit rate: 89%</div>
    </div>
    
    <div class="status-item">
      <div class="status-indicator" id="optimization-status">🟢</div>
      <div class="status-label">Optimization</div>
      <div class="status-detail" id="optimization-detail">Queue: 2 jobs</div>
    </div>
  </div>
  
  <div class="metrics-chart">
    <canvas id="response-time-chart" width="400" height="200"></canvas>
  </div>
</div>

<script>
// Real-time status updates
async function updateSystemStatus() {
  try {
    const response = await fetch('https://status.flextime.big12.org/api/status');
    const status = await response.json();
    
    updateStatusIndicator('api-status', status.api.healthy);
    updateStatusIndicator('db-status', status.database.healthy);
    updateStatusIndicator('cache-status', status.cache.healthy);
    updateStatusIndicator('optimization-status', status.optimization.healthy);
    
    document.getElementById('api-detail').textContent = 
      `Response: ${status.api.response_time}ms`;
    document.getElementById('db-detail').textContent = 
      `Query time: ${status.database.avg_query_time}ms`;
    document.getElementById('cache-detail').textContent = 
      `Hit rate: ${status.cache.hit_rate}%`;
    document.getElementById('optimization-detail').textContent = 
      `Queue: ${status.optimization.queue_size} jobs`;
      
  } catch (error) {
    console.error('Failed to fetch status:', error);
  }
}

function updateStatusIndicator(elementId, healthy) {
  const indicator = document.getElementById(elementId);
  indicator.textContent = healthy ? '🟢' : '🔴';
}

// Update every 30 seconds
setInterval(updateSystemStatus, 30000);
updateSystemStatus(); // Initial load
</script>

<style>
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.status-item {
  text-align: center;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.status-indicator {
  font-size: 2em;
  margin-bottom: 5px;
}

.status-label {
  font-weight: bold;
  color: #333;
}

.status-detail {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.metrics-chart {
  margin-top: 20px;
  text-align: center;
}
</style>
```

## 🏆 Certification Programs

### Available Certifications

#### FlexTime User Certification
**Duration**: 4 hours | **Cost**: Free
- Complete beginner and intermediate video paths
- Pass online assessment (80% required)
- Demonstrate schedule creation proficiency

#### FlexTime Developer Certification
**Duration**: 8 hours | **Cost**: $99
- Complete developer learning path
- Build and deploy integration project
- Pass technical assessment

#### FlexTime Administrator Certification
**Duration**: 12 hours | **Cost**: $199
- Complete administrator learning path
- Demonstrate system management skills
- Pass comprehensive exam

### Certification Benefits
- **Professional Recognition**: Industry-recognized credentials
- **Advanced Support**: Priority technical support access
- **Beta Access**: Early access to new features
- **Community**: Access to certified professional forums

## 🤝 Community and Support

### Community Resources
- **[Community Forum](https://community.flextime.big12.org)** - User discussions and tips
- **[GitHub Repository](https://github.com/big12/flextime)** - Open source contributions
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/flextime)** - Technical Q&A
- **[LinkedIn Group](https://linkedin.com/groups/flextime-users)** - Professional networking

### Support Channels
- **📧 General Support**: support@flextime.big12.org
- **💻 Developer Support**: dev-support@flextime.big12.org
- **🏢 Enterprise Support**: enterprise@flextime.big12.org
- **🚨 Emergency Hotline**: +1-555-FLEXTIME (24/7)

### Office Hours
- **User Office Hours**: Tuesdays 2-3 PM CT
- **Developer Office Hours**: Thursdays 3-4 PM CT
- **Administrator Office Hours**: First Friday of month 2-3 PM CT

## 📈 Documentation Metrics

This documentation portal includes analytics to continuously improve:

```javascript
// Documentation Analytics
const docAnalytics = {
  // Track page views and user journeys
  trackPageView: (page, userType) => {
    analytics.track('page_view', {
      page: page,
      user_type: userType,
      timestamp: new Date().toISOString()
    });
  },
  
  // Track search queries to improve content
  trackSearch: (query, results) => {
    analytics.track('search', {
      query: query,
      results_count: results.length,
      timestamp: new Date().toISOString()
    });
  },
  
  // Track user feedback on documentation
  trackFeedback: (page, rating, comment) => {
    analytics.track('feedback', {
      page: page,
      rating: rating,
      comment: comment,
      timestamp: new Date().toISOString()
    });
  }
};
```

### Help Us Improve
Rate this documentation:
⭐⭐⭐⭐⭐ (Click to rate)

**Feedback**: What would make this documentation more helpful?
[Feedback Form Link]

## 🔄 Recent Updates

### May 29, 2025
- ✅ Complete documentation portal launch
- ✅ Interactive API explorer added
- ✅ Video learning paths created
- ✅ Real-time system status dashboard
- ✅ Advanced search functionality

### Upcoming Features
- 🔄 Multi-language support (Spanish planned)
- 🔄 Mobile-optimized documentation app
- 🔄 Offline documentation downloads
- 🔄 AI-powered documentation assistant

## 📋 Quick Reference

### Essential Links
| Need | Link | Time |
|------|------|------|
| **Get Started** | [Quick Start Guide](./user-guides/quick-start.md) | 5 min |
| **Create Schedule** | [Schedule Creation](./user-guides/schedule-creation.md) | 15 min |
| **Use API** | [API Documentation](./developer-docs/api/README.md) | 30 min |
| **Deploy System** | [Deployment Guide](./deployment/README.md) | 60 min |
| **Fix Issues** | [Troubleshooting](./troubleshooting/README.md) | Variable |

### Emergency Contacts
| Issue Type | Contact | Response Time |
|------------|---------|---------------|
| **System Down** | +1-555-FLEXTIME | Immediate |
| **Security Issue** | security@flextime.big12.org | 1 hour |
| **Data Loss** | emergency@flextime.big12.org | 30 minutes |
| **General Support** | support@flextime.big12.org | 4 hours |

---

**Welcome to FlexTime!** 🎉

*This documentation is a living resource, continuously updated based on user feedback and system evolution. Your input helps make it better for everyone.*

*Last updated: May 29, 2025*
*Documentation Portal Version: 2.0*

<div style="text-align: center; margin-top: 40px; padding: 20px; background: #f0f8ff; border-radius: 10px;">
  <h3>🚀 Ready to get started?</h3>
  <p>Choose your path and begin your FlexTime journey!</p>
  <div style="display: flex; justify-content: center; gap: 20px; margin-top: 20px;">
    <a href="./user-guides/quick-start.md" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">👥 I'm a User</a>
    <a href="./developer-docs/README.md" style="padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px;">💻 I'm a Developer</a>
    <a href="./admin-guides/README.md" style="padding: 10px 20px; background: #dc3545; color: white; text-decoration: none; border-radius: 5px;">🏢 I'm an Admin</a>
  </div>
</div>