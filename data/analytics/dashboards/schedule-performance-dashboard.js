/**
 * Schedule Performance Dashboard
 * Real-time analytics dashboard for Big 12 sports scheduling
 */

class SchedulePerformanceDashboard {
  constructor(config) {
    this.config = config;
    this.dataSource = config.dataSource;
    this.refreshInterval = config.refreshInterval || 30000; // 30 seconds
    this.charts = {};
    this.filters = {
      sport: 'all',
      team: 'all',
      dateRange: 'current_season',
      venue: 'all'
    };
  }

  /**
   * Initialize the dashboard
   */
  async initialize() {
    try {
      await this.setupLayout();
      await this.loadInitialData();
      await this.renderCharts();
      this.startAutoRefresh();
      this.setupEventListeners();
      
      console.log('Schedule Performance Dashboard initialized successfully');
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup dashboard layout and containers
   */
  async setupLayout() {
    const dashboardContainer = document.getElementById('dashboard-container');
    
    dashboardContainer.innerHTML = `
      <div class="dashboard-header">
        <h1>Big 12 Schedule Performance Analytics</h1>
        <div class="dashboard-filters">
          <select id="sport-filter" class="filter-select">
            <option value="all">All Sports</option>
            <option value="football">Football</option>
            <option value="basketball">Basketball</option>
            <option value="baseball">Baseball</option>
            <option value="softball">Softball</option>
          </select>
          
          <select id="team-filter" class="filter-select">
            <option value="all">All Teams</option>
          </select>
          
          <select id="date-range-filter" class="filter-select">
            <option value="current_season">Current Season</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="year_to_date">Year to Date</option>
          </select>
          
          <button id="refresh-btn" class="refresh-button">Refresh</button>
        </div>
      </div>

      <div class="dashboard-kpis">
        <div class="kpi-card">
          <h3>Schedule Quality</h3>
          <div class="kpi-value" id="schedule-quality">--</div>
          <div class="kpi-trend" id="quality-trend">--</div>
        </div>
        
        <div class="kpi-card">
          <h3>Constraint Satisfaction</h3>
          <div class="kpi-value" id="constraint-satisfaction">--</div>
          <div class="kpi-trend" id="satisfaction-trend">--</div>
        </div>
        
        <div class="kpi-card">
          <h3>Travel Efficiency</h3>
          <div class="kpi-value" id="travel-efficiency">--</div>
          <div class="kpi-trend" id="efficiency-trend">--</div>
        </div>
        
        <div class="kpi-card">
          <h3>Venue Utilization</h3>
          <div class="kpi-value" id="venue-utilization">--</div>
          <div class="kpi-trend" id="utilization-trend">--</div>
        </div>
      </div>

      <div class="dashboard-charts">
        <div class="chart-row">
          <div class="chart-container">
            <h3>Schedule Quality Trends</h3>
            <canvas id="quality-trends-chart"></canvas>
          </div>
          
          <div class="chart-container">
            <h3>Constraint Violations by Type</h3>
            <canvas id="violations-chart"></canvas>
          </div>
        </div>
        
        <div class="chart-row">
          <div class="chart-container">
            <h3>Travel Cost Analysis</h3>
            <canvas id="travel-cost-chart"></canvas>
          </div>
          
          <div class="chart-container">
            <h3>Venue Performance</h3>
            <canvas id="venue-performance-chart"></canvas>
          </div>
        </div>
        
        <div class="chart-row">
          <div class="chart-container full-width">
            <h3>Real-time Schedule Status</h3>
            <div id="schedule-status-table"></div>
          </div>
        </div>
      </div>

      <div class="dashboard-alerts">
        <h3>Active Alerts</h3>
        <div id="alerts-container"></div>
      </div>
    `;
  }

  /**
   * Load initial data for dashboard
   */
  async loadInitialData() {
    try {
      const [kpiData, trendsData, violationsData, travelData, venueData, alertsData] = await Promise.all([
        this.fetchKPIData(),
        this.fetchQualityTrends(),
        this.fetchConstraintViolations(),
        this.fetchTravelAnalysis(),
        this.fetchVenuePerformance(),
        this.fetchActiveAlerts()
      ]);

      this.data = {
        kpis: kpiData,
        trends: trendsData,
        violations: violationsData,
        travel: travelData,
        venues: venueData,
        alerts: alertsData
      };

      await this.populateTeamFilter();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      throw error;
    }
  }

  /**
   * Fetch KPI data from analytics API
   */
  async fetchKPIData() {
    const response = await fetch(`${this.config.apiBase}/analytics/kpis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.filters)
    });
    
    if (!response.ok) {
      throw new Error(`KPI fetch failed: ${response.statusText}`);
    }
    
    return await response.json();
  }

  /**
   * Fetch quality trends data
   */
  async fetchQualityTrends() {
    const response = await fetch(`${this.config.apiBase}/analytics/quality-trends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.filters)
    });
    
    return await response.json();
  }

  /**
   * Fetch constraint violations data
   */
  async fetchConstraintViolations() {
    const response = await fetch(`${this.config.apiBase}/analytics/constraint-violations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.filters)
    });
    
    return await response.json();
  }

  /**
   * Fetch travel analysis data
   */
  async fetchTravelAnalysis() {
    const response = await fetch(`${this.config.apiBase}/analytics/travel-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.filters)
    });
    
    return await response.json();
  }

  /**
   * Fetch venue performance data
   */
  async fetchVenuePerformance() {
    const response = await fetch(`${this.config.apiBase}/analytics/venue-performance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.filters)
    });
    
    return await response.json();
  }

  /**
   * Fetch active alerts
   */
  async fetchActiveAlerts() {
    const response = await fetch(`${this.config.apiBase}/analytics/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.filters)
    });
    
    return await response.json();
  }

  /**
   * Render all dashboard charts
   */
  async renderCharts() {
    this.updateKPIs();
    this.renderQualityTrendsChart();
    this.renderViolationsChart();
    this.renderTravelCostChart();
    this.renderVenuePerformanceChart();
    this.renderScheduleStatusTable();
    this.renderAlerts();
  }

  /**
   * Update KPI displays
   */
  updateKPIs() {
    const kpis = this.data.kpis;
    
    document.getElementById('schedule-quality').textContent = `${kpis.schedule_quality.toFixed(1)}%`;
    document.getElementById('quality-trend').textContent = this.formatTrend(kpis.schedule_quality_trend);
    
    document.getElementById('constraint-satisfaction').textContent = `${kpis.constraint_satisfaction.toFixed(1)}%`;
    document.getElementById('satisfaction-trend').textContent = this.formatTrend(kpis.constraint_satisfaction_trend);
    
    document.getElementById('travel-efficiency').textContent = `${kpis.travel_efficiency.toFixed(1)}%`;
    document.getElementById('efficiency-trend').textContent = this.formatTrend(kpis.travel_efficiency_trend);
    
    document.getElementById('venue-utilization').textContent = `${kpis.venue_utilization.toFixed(1)}%`;
    document.getElementById('utilization-trend').textContent = this.formatTrend(kpis.venue_utilization_trend);
  }

  /**
   * Render quality trends line chart
   */
  renderQualityTrendsChart() {
    const ctx = document.getElementById('quality-trends-chart').getContext('2d');
    
    if (this.charts.qualityTrends) {
      this.charts.qualityTrends.destroy();
    }
    
    this.charts.qualityTrends = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data.trends.dates,
        datasets: [
          {
            label: 'Schedule Quality',
            data: this.data.trends.quality_scores,
            borderColor: '#007bff',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            tension: 0.4
          },
          {
            label: 'Constraint Satisfaction',
            data: this.data.trends.satisfaction_rates,
            borderColor: '#28a745',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: function(value) {
                return value + '%';
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  /**
   * Render constraint violations doughnut chart
   */
  renderViolationsChart() {
    const ctx = document.getElementById('violations-chart').getContext('2d');
    
    if (this.charts.violations) {
      this.charts.violations.destroy();
    }
    
    this.charts.violations = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.data.violations.types,
        datasets: [{
          data: this.data.violations.counts,
          backgroundColor: [
            '#dc3545',
            '#fd7e14',
            '#ffc107',
            '#28a745',
            '#17a2b8',
            '#6f42c1'
          ]
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  /**
   * Render travel cost bar chart
   */
  renderTravelCostChart() {
    const ctx = document.getElementById('travel-cost-chart').getContext('2d');
    
    if (this.charts.travelCost) {
      this.charts.travelCost.destroy();
    }
    
    this.charts.travelCost = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.data.travel.teams,
        datasets: [
          {
            label: 'Actual Cost',
            data: this.data.travel.actual_costs,
            backgroundColor: '#dc3545'
          },
          {
            label: 'Optimized Cost',
            data: this.data.travel.optimized_costs,
            backgroundColor: '#28a745'
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return '$' + value.toLocaleString();
              }
            }
          }
        },
        plugins: {
          legend: {
            position: 'top'
          }
        }
      }
    });
  }

  /**
   * Render venue performance radar chart
   */
  renderVenuePerformanceChart() {
    const ctx = document.getElementById('venue-performance-chart').getContext('2d');
    
    if (this.charts.venuePerformance) {
      this.charts.venuePerformance.destroy();
    }
    
    this.charts.venuePerformance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Utilization', 'Quality Score', 'Fan Satisfaction', 'Revenue', 'Efficiency'],
        datasets: this.data.venues.map((venue, index) => ({
          label: venue.name,
          data: venue.scores,
          borderColor: this.getColorForIndex(index),
          backgroundColor: this.getColorForIndex(index, 0.2),
          pointBackgroundColor: this.getColorForIndex(index)
        }))
      },
      options: {
        responsive: true,
        scales: {
          r: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  /**
   * Render schedule status table
   */
  renderScheduleStatusTable() {
    const container = document.getElementById('schedule-status-table');
    
    const tableHTML = `
      <table class="status-table">
        <thead>
          <tr>
            <th>Sport</th>
            <th>Team</th>
            <th>Next Game</th>
            <th>Status</th>
            <th>Constraints</th>
            <th>Quality Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${this.data.kpis.recent_schedules.map(schedule => `
            <tr class="status-row ${schedule.status.toLowerCase()}">
              <td>${schedule.sport}</td>
              <td>${schedule.team}</td>
              <td>${new Date(schedule.next_game).toLocaleDateString()}</td>
              <td>
                <span class="status-badge ${schedule.status.toLowerCase()}">
                  ${schedule.status}
                </span>
              </td>
              <td>
                <span class="constraint-count ${schedule.constraint_violations > 0 ? 'has-violations' : ''}">
                  ${schedule.constraints_satisfied}/${schedule.total_constraints}
                </span>
              </td>
              <td>
                <span class="quality-score score-${this.getScoreClass(schedule.quality_score)}">
                  ${schedule.quality_score.toFixed(1)}%
                </span>
              </td>
              <td>
                <button class="action-btn view-btn" onclick="viewScheduleDetails('${schedule.id}')">
                  View
                </button>
                ${schedule.status === 'needs_review' ? 
                  `<button class="action-btn edit-btn" onclick="editSchedule('${schedule.id}')">
                    Edit
                  </button>` : ''
                }
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    container.innerHTML = tableHTML;
  }

  /**
   * Render active alerts
   */
  renderAlerts() {
    const container = document.getElementById('alerts-container');
    
    if (this.data.alerts.length === 0) {
      container.innerHTML = '<p class="no-alerts">No active alerts</p>';
      return;
    }
    
    const alertsHTML = this.data.alerts.map(alert => `
      <div class="alert alert-${alert.severity}">
        <div class="alert-header">
          <span class="alert-title">${alert.title}</span>
          <span class="alert-time">${new Date(alert.created_at).toLocaleString()}</span>
        </div>
        <div class="alert-message">${alert.message}</div>
        <div class="alert-actions">
          <button class="alert-btn resolve-btn" onclick="resolveAlert('${alert.id}')">
            Resolve
          </button>
          <button class="alert-btn details-btn" onclick="viewAlertDetails('${alert.id}')">
            Details
          </button>
        </div>
      </div>
    `).join('');
    
    container.innerHTML = alertsHTML;
  }

  /**
   * Setup event listeners for filters and controls
   */
  setupEventListeners() {
    document.getElementById('sport-filter').addEventListener('change', (e) => {
      this.filters.sport = e.target.value;
      this.refreshData();
    });
    
    document.getElementById('team-filter').addEventListener('change', (e) => {
      this.filters.team = e.target.value;
      this.refreshData();
    });
    
    document.getElementById('date-range-filter').addEventListener('change', (e) => {
      this.filters.dateRange = e.target.value;
      this.refreshData();
    });
    
    document.getElementById('refresh-btn').addEventListener('click', () => {
      this.refreshData();
    });
  }

  /**
   * Populate team filter options based on selected sport
   */
  async populateTeamFilter() {
    const teamFilter = document.getElementById('team-filter');
    const currentSport = this.filters.sport;
    
    // Clear existing options except "All Teams"
    teamFilter.innerHTML = '<option value="all">All Teams</option>';
    
    if (currentSport !== 'all') {
      const teams = await this.fetchTeamsForSport(currentSport);
      teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.id;
        option.textContent = team.name;
        teamFilter.appendChild(option);
      });
    }
  }

  /**
   * Fetch teams for specific sport
   */
  async fetchTeamsForSport(sport) {
    const response = await fetch(`${this.config.apiBase}/teams?sport=${sport}`);
    return await response.json();
  }

  /**
   * Start auto-refresh timer
   */
  startAutoRefresh() {
    this.refreshTimer = setInterval(() => {
      this.refreshData();
    }, this.refreshInterval);
  }

  /**
   * Refresh dashboard data
   */
  async refreshData() {
    try {
      await this.loadInitialData();
      await this.renderCharts();
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh dashboard data:', error);
    }
  }

  /**
   * Utility methods
   */
  formatTrend(trend) {
    const arrow = trend > 0 ? '↗' : trend < 0 ? '↘' : '→';
    const color = trend > 0 ? 'green' : trend < 0 ? 'red' : 'gray';
    return `<span style="color: ${color}">${arrow} ${Math.abs(trend).toFixed(1)}%</span>`;
  }

  getScoreClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 60) return 'fair';
    return 'poor';
  }

  getColorForIndex(index, opacity = 1) {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107',
      '#17a2b8', '#6f42c1', '#fd7e14', '#e83e8c'
    ];
    const color = colors[index % colors.length];
    
    if (opacity < 1) {
      const rgb = this.hexToRgb(color);
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
    }
    
    return color;
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Cleanup dashboard resources
   */
  destroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy();
    });
    
    this.charts = {};
  }
}

// Global functions for table actions
window.viewScheduleDetails = function(scheduleId) {
  console.log('Viewing schedule details for:', scheduleId);
  // Implement schedule details modal
};

window.editSchedule = function(scheduleId) {
  console.log('Editing schedule:', scheduleId);
  // Implement schedule editing interface
};

window.resolveAlert = function(alertId) {
  console.log('Resolving alert:', alertId);
  // Implement alert resolution
};

window.viewAlertDetails = function(alertId) {
  console.log('Viewing alert details:', alertId);
  // Implement alert details modal
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SchedulePerformanceDashboard;
}