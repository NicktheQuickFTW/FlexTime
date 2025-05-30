/**
 * Test Data Generator
 * 
 * Generates comprehensive test scenarios for migration validation
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const config = require('../config/test.config');
const logger = require('../utilities/logger');

class TestScenarioGenerator {
  constructor() {
    this.outputDir = config.testData.generatedDataPath;
    this.ensureOutputDirectory();
    
    // Big 12 Conference teams
    this.teams = [
      { id: 'arizona', name: 'Arizona', mascot: 'Wildcats', city: 'Tucson', state: 'AZ' },
      { id: 'arizona_state', name: 'Arizona State', mascot: 'Sun Devils', city: 'Tempe', state: 'AZ' },
      { id: 'baylor', name: 'Baylor', mascot: 'Bears', city: 'Waco', state: 'TX' },
      { id: 'byu', name: 'BYU', mascot: 'Cougars', city: 'Provo', state: 'UT' },
      { id: 'cincinnati', name: 'Cincinnati', mascot: 'Bearcats', city: 'Cincinnati', state: 'OH' },
      { id: 'colorado', name: 'Colorado', mascot: 'Buffaloes', city: 'Boulder', state: 'CO' },
      { id: 'houston', name: 'Houston', mascot: 'Cougars', city: 'Houston', state: 'TX' },
      { id: 'iowa_state', name: 'Iowa State', mascot: 'Cyclones', city: 'Ames', state: 'IA' },
      { id: 'kansas', name: 'Kansas', mascot: 'Jayhawks', city: 'Lawrence', state: 'KS' },
      { id: 'kansas_state', name: 'Kansas State', mascot: 'Wildcats', city: 'Manhattan', state: 'KS' },
      { id: 'oklahoma_state', name: 'Oklahoma State', mascot: 'Cowboys', city: 'Stillwater', state: 'OK' },
      { id: 'tcu', name: 'TCU', mascot: 'Horned Frogs', city: 'Fort Worth', state: 'TX' },
      { id: 'texas_tech', name: 'Texas Tech', mascot: 'Red Raiders', city: 'Lubbock', state: 'TX' },
      { id: 'ucf', name: 'UCF', mascot: 'Knights', city: 'Orlando', state: 'FL' },
      { id: 'utah', name: 'Utah', mascot: 'Utes', city: 'Salt Lake City', state: 'UT' },
      { id: 'west_virginia', name: 'West Virginia', mascot: 'Mountaineers', city: 'Morgantown', state: 'WV' }
    ];

    this.sports = [
      { id: 'football', name: 'Football', season: 'Fall', gameLength: 180, teams: 16 },
      { id: 'mens_basketball', name: 'Men\'s Basketball', season: 'Winter', gameLength: 120, teams: 16 },
      { id: 'womens_basketball', name: 'Women\'s Basketball', season: 'Winter', gameLength: 120, teams: 16 },
      { id: 'baseball', name: 'Baseball', season: 'Spring', gameLength: 180, teams: 14 },
      { id: 'softball', name: 'Softball', season: 'Spring', gameLength: 120, teams: 11 },
      { id: 'soccer', name: 'Soccer', season: 'Fall', gameLength: 110, teams: 16 },
      { id: 'volleyball', name: 'Volleyball', season: 'Fall', gameLength: 120, teams: 15 }
    ];

    this.venues = this.generateVenues();
    this.constraints = this.generateConstraints();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate all test scenarios
   */
  async generateAllScenarios() {
    logger.info('Starting test scenario generation');
    
    const scenarios = {
      basic: await this.generateBasicScenarios(),
      complex: await this.generateComplexScenarios(),
      edge: await this.generateEdgeCaseScenarios(),
      performance: await this.generatePerformanceScenarios(),
      regression: await this.generateRegressionScenarios()
    };

    // Save master scenario index
    const indexFile = path.join(this.outputDir, 'scenario-index.json');
    fs.writeFileSync(indexFile, JSON.stringify(scenarios, null, 2));
    
    logger.info('Test scenario generation completed', { 
      totalScenarios: Object.values(scenarios).flat().length,
      outputDir: this.outputDir 
    });

    return scenarios;
  }

  /**
   * Generate basic test scenarios
   */
  async generateBasicScenarios() {
    logger.info('Generating basic test scenarios');
    
    const scenarios = [];
    
    // Basic football schedule
    scenarios.push(await this.generateBasicFootballScenario());
    
    // Basic basketball schedule
    scenarios.push(await this.generateBasicBasketballScenario());
    
    // Small team set scenarios
    scenarios.push(await this.generateSmallTeamScenario());
    
    return scenarios;
  }

  /**
   * Generate complex test scenarios
   */
  async generateComplexScenarios() {
    logger.info('Generating complex test scenarios');
    
    const scenarios = [];
    
    // Multi-sport scheduling
    scenarios.push(await this.generateMultiSportScenario());
    
    // High constraint density
    scenarios.push(await this.generateHighConstraintScenario());
    
    // Championship tournament integration
    scenarios.push(await this.generateChampionshipScenario());
    
    return scenarios;
  }

  /**
   * Generate edge case scenarios
   */
  async generateEdgeCaseScenarios() {
    logger.info('Generating edge case scenarios');
    
    const scenarios = [];
    
    // Minimal viable schedule
    scenarios.push(await this.generateMinimalScenario());
    
    // Maximum constraint scenario
    scenarios.push(await this.generateMaxConstraintScenario());
    
    // Conflicting constraints
    scenarios.push(await this.generateConflictingConstraintScenario());
    
    return scenarios;
  }

  /**
   * Generate performance test scenarios
   */
  async generatePerformanceScenarios() {
    logger.info('Generating performance test scenarios');
    
    const scenarios = [];
    
    // Large team set
    scenarios.push(await this.generateLargeTeamScenario());
    
    // High game density
    scenarios.push(await this.generateHighDensityScenario());
    
    // Complex constraint matrix
    scenarios.push(await this.generateComplexConstraintScenario());
    
    return scenarios;
  }

  /**
   * Generate regression test scenarios
   */
  async generateRegressionScenarios() {
    logger.info('Generating regression test scenarios');
    
    const scenarios = [];
    
    // Historical problematic scenarios
    scenarios.push(await this.generateHistoricalIssueScenario());
    
    // Data migration edge cases
    scenarios.push(await this.generateDataMigrationScenario());
    
    return scenarios;
  }

  /**
   * Generate basic football scenario
   */
  async generateBasicFootballScenario() {
    const scenarioId = `basic_football_${uuidv4().substr(0, 8)}`;
    const sport = this.sports.find(s => s.id === 'football');
    const selectedTeams = this.teams.slice(0, 8); // 8 teams for simplicity
    
    const scenario = {
      id: scenarioId,
      name: 'Basic Football Schedule',
      description: 'Simple football scheduling scenario with 8 teams',
      type: 'basic',
      sport: sport,
      season: '2025-26',
      teams: selectedTeams,
      venues: this.getVenuesForTeams(selectedTeams),
      constraints: this.getBasicConstraints('football'),
      expectedGames: this.calculateExpectedGames(selectedTeams.length, 'round_robin'),
      parameters: {
        algorithm: 'round_robin',
        homeAndAway: true,
        seasonStart: '2025-09-01',
        seasonEnd: '2025-12-15',
        gameWeeks: 16
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }

  /**
   * Generate basic basketball scenario
   */
  async generateBasicBasketballScenario() {
    const scenarioId = `basic_basketball_${uuidv4().substr(0, 8)}`;
    const sport = this.sports.find(s => s.id === 'mens_basketball');
    const selectedTeams = this.teams.slice(0, 12); // 12 teams
    
    const scenario = {
      id: scenarioId,
      name: 'Basic Men\'s Basketball Schedule',
      description: 'Standard basketball scheduling scenario with 12 teams',
      type: 'basic',
      sport: sport,
      season: '2025-26',
      teams: selectedTeams,
      venues: this.getVenuesForTeams(selectedTeams),
      constraints: this.getBasicConstraints('mens_basketball'),
      expectedGames: this.calculateExpectedGames(selectedTeams.length, 'double_round_robin'),
      parameters: {
        algorithm: 'double_round_robin',
        homeAndAway: true,
        seasonStart: '2025-11-01',
        seasonEnd: '2026-03-15',
        gameWeeks: 20
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }

  /**
   * Generate small team scenario
   */
  async generateSmallTeamScenario() {
    const scenarioId = `small_team_${uuidv4().substr(0, 8)}`;
    const sport = this.sports.find(s => s.id === 'volleyball');
    const selectedTeams = this.teams.slice(0, 4); // Minimal team set
    
    const scenario = {
      id: scenarioId,
      name: 'Small Team Set',
      description: 'Minimal viable scheduling scenario with 4 teams',
      type: 'basic',
      sport: sport,
      season: '2025-26',
      teams: selectedTeams,
      venues: this.getVenuesForTeams(selectedTeams),
      constraints: this.getMinimalConstraints(),
      expectedGames: this.calculateExpectedGames(selectedTeams.length, 'round_robin'),
      parameters: {
        algorithm: 'round_robin',
        homeAndAway: false,
        seasonStart: '2025-09-01',
        seasonEnd: '2025-11-30',
        gameWeeks: 12
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }

  /**
   * Generate multi-sport scenario
   */
  async generateMultiSportScenario() {
    const scenarioId = `multi_sport_${uuidv4().substr(0, 8)}`;
    
    const scenario = {
      id: scenarioId,
      name: 'Multi-Sport Scheduling',
      description: 'Complex scenario with multiple sports sharing venues and dates',
      type: 'complex',
      sports: [
        this.sports.find(s => s.id === 'football'),
        this.sports.find(s => s.id === 'soccer'),
        this.sports.find(s => s.id === 'volleyball')
      ],
      season: '2025-26',
      teams: this.teams,
      venues: this.venues,
      constraints: this.getMultiSportConstraints(),
      parameters: {
        sharedVenues: true,
        seasonOverlap: true,
        priorityOrder: ['football', 'soccer', 'volleyball']
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }

  /**
   * Generate high constraint scenario
   */
  async generateHighConstraintScenario() {
    const scenarioId = `high_constraint_${uuidv4().substr(0, 8)}`;
    const sport = this.sports.find(s => s.id === 'football');
    
    const scenario = {
      id: scenarioId,
      name: 'High Constraint Density',
      description: 'Schedule with many overlapping constraints',
      type: 'complex',
      sport: sport,
      season: '2025-26',
      teams: this.teams,
      venues: this.venues,
      constraints: this.getHighDensityConstraints(),
      parameters: {
        constraintDensity: 'high',
        conflictResolution: 'strict',
        optimizationLevel: 'maximum'
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }

  /**
   * Generate venues for teams
   */
  generateVenues() {
    return this.teams.map(team => ({
      id: `${team.id}_stadium`,
      name: `${team.name} Stadium`,
      teamId: team.id,
      city: team.city,
      state: team.state,
      capacity: 50000 + Math.floor(Math.random() * 50000),
      type: 'primary',
      availability: this.generateVenueAvailability()
    }));
  }

  /**
   * Generate venue availability
   */
  generateVenueAvailability() {
    const availability = [];
    const startDate = moment('2025-08-01');
    const endDate = moment('2026-05-31');
    
    for (let date = startDate.clone(); date.isBefore(endDate); date.add(1, 'day')) {
      if (Math.random() > 0.1) { // 90% availability
        availability.push({
          date: date.format('YYYY-MM-DD'),
          available: true,
          timeSlots: ['morning', 'afternoon', 'evening']
        });
      }
    }
    
    return availability;
  }

  /**
   * Generate basic constraints
   */
  generateConstraints() {
    return {
      basic: {
        football: [
          {
            id: 'no_back_to_back_games',
            type: 'temporal',
            description: 'Teams cannot play games on consecutive days',
            rule: 'minimum_rest_days >= 6'
          },
          {
            id: 'home_away_balance',
            type: 'venue',
            description: 'Teams should have balanced home/away games',
            rule: 'home_games_percentage between 40 and 60'
          }
        ],
        basketball: [
          {
            id: 'minimum_rest',
            type: 'temporal',
            description: 'Minimum 1 day rest between games',
            rule: 'minimum_rest_days >= 1'
          },
          {
            id: 'venue_availability',
            type: 'venue',
            description: 'Venue must be available for game time',
            rule: 'venue_available = true'
          }
        ]
      }
    };
  }

  /**
   * Get venues for specific teams
   */
  getVenuesForTeams(teams) {
    return this.venues.filter(venue => 
      teams.some(team => team.id === venue.teamId)
    );
  }

  /**
   * Get basic constraints for sport
   */
  getBasicConstraints(sport) {
    return this.constraints.basic[sport] || [];
  }

  /**
   * Get minimal constraints
   */
  getMinimalConstraints() {
    return [
      {
        id: 'venue_availability',
        type: 'venue',
        description: 'Basic venue availability',
        rule: 'venue_available = true'
      }
    ];
  }

  /**
   * Get multi-sport constraints
   */
  getMultiSportConstraints() {
    return [
      {
        id: 'venue_conflict_prevention',
        type: 'multi_sport',
        description: 'Prevent venue conflicts between sports',
        rule: 'no_simultaneous_venue_usage'
      },
      {
        id: 'priority_scheduling',
        type: 'multi_sport',
        description: 'Football has priority over other sports',
        rule: 'football_priority = 1'
      }
    ];
  }

  /**
   * Get high density constraints
   */
  getHighDensityConstraints() {
    return [
      ...this.getBasicConstraints('football'),
      {
        id: 'travel_optimization',
        type: 'travel',
        description: 'Minimize total travel distance',
        rule: 'minimize_total_travel_distance'
      },
      {
        id: 'rivalry_games',
        type: 'special',
        description: 'Rivalry games must be scheduled at specific times',
        rule: 'rivalry_games_timing = specified'
      },
      {
        id: 'tv_broadcast_windows',
        type: 'media',
        description: 'Prime time games must be in specific windows',
        rule: 'prime_time_games in broadcast_windows'
      }
    ];
  }

  /**
   * Calculate expected number of games
   */
  calculateExpectedGames(teamCount, algorithm) {
    switch (algorithm) {
      case 'round_robin':
        return (teamCount * (teamCount - 1)) / 2;
      case 'double_round_robin':
        return teamCount * (teamCount - 1);
      default:
        return teamCount * 10; // Default estimate
    }
  }

  /**
   * Save scenario to file
   */
  async saveScenario(scenario) {
    const filename = path.join(this.outputDir, `${scenario.id}.json`);
    fs.writeFileSync(filename, JSON.stringify(scenario, null, 2));
    logger.debug(`Scenario saved: ${filename}`);
  }

  /**
   * Generate historical issue scenario
   */
  async generateHistoricalIssueScenario() {
    const scenarioId = `historical_issue_${uuidv4().substr(0, 8)}`;
    
    const scenario = {
      id: scenarioId,
      name: 'Historical Issue Regression Test',
      description: 'Scenario based on previously identified scheduling issues',
      type: 'regression',
      sport: this.sports.find(s => s.id === 'football'),
      season: '2025-26',
      teams: this.teams.slice(0, 10),
      venues: this.getVenuesForTeams(this.teams.slice(0, 10)),
      constraints: [
        {
          id: 'championship_constraint_conflict',
          type: 'temporal',
          description: 'Reproduces championship date scheduling conflict',
          rule: 'no_games_during_championship_week'
        }
      ],
      parameters: {
        issueType: 'championship_date_conflict',
        expectedBehavior: 'should_resolve_gracefully',
        regressionTest: true
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }

  /**
   * Generate data migration scenario
   */
  async generateDataMigrationScenario() {
    const scenarioId = `data_migration_${uuidv4().substr(0, 8)}`;
    
    const scenario = {
      id: scenarioId,
      name: 'Data Migration Edge Case',
      description: 'Tests edge cases in data migration between systems',
      type: 'regression',
      sport: this.sports.find(s => s.id === 'mens_basketball'),
      season: '2025-26',
      teams: this.teams,
      venues: this.venues,
      constraints: this.getBasicConstraints('mens_basketball'),
      parameters: {
        migrationTest: true,
        dataIntegrityCheck: true,
        legacyFormatSupport: true
      }
    };
    
    await this.saveScenario(scenario);
    return scenario;
  }
}

// CLI interface
if (require.main === module) {
  async function main() {
    const generator = new TestScenarioGenerator();
    
    try {
      const scenarios = await generator.generateAllScenarios();
      console.log('✅ Test scenario generation completed successfully');
      console.log(`📁 Scenarios saved to: ${generator.outputDir}`);
      console.log(`📊 Total scenarios generated: ${Object.values(scenarios).flat().length}`);
    } catch (error) {
      console.error('❌ Error generating test scenarios:', error);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = TestScenarioGenerator;