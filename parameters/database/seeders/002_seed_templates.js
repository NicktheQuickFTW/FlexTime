/**
 * Seed Constraint Templates
 * Creates initial constraint templates for common scheduling rules
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, get category IDs
    const categories = await queryInterface.sequelize.query(
      `SELECT category_id, name FROM constraint_categories`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const getCategoryId = (name) => categories.find(c => c.name === name)?.category_id;

    const templates = [
      // Rest Day Constraints
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Rest Days'),
        name: 'Minimum Rest Between Games',
        description: 'Ensures teams have adequate rest between consecutive games',
        type: 'hard',
        sport: null,
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['min_days'],
          properties: {
            min_days: {
              type: 'integer',
              minimum: 1,
              maximum: 7,
              description: 'Minimum days between games'
            },
            exemptions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tournament or special event exemptions'
            }
          }
        }),
        default_parameters: JSON.stringify({
          min_days: 2,
          exemptions: ['conference_tournament', 'ncaa_tournament']
        }),
        evaluation_type: 'simple',
        evaluation_logic: 'check_rest_days',
        tags: ['rest', 'player-welfare', 'mandatory'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Travel Constraints
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Distance Limits'),
        name: 'Maximum Single Trip Distance',
        description: 'Limits the distance for single game trips',
        type: 'soft',
        sport: null,
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['max_miles'],
          properties: {
            max_miles: {
              type: 'integer',
              minimum: 100,
              maximum: 3000,
              description: 'Maximum distance in miles'
            },
            weight_per_mile_over: {
              type: 'number',
              minimum: 0,
              maximum: 1,
              description: 'Penalty weight per mile over limit'
            }
          }
        }),
        default_parameters: JSON.stringify({
          max_miles: 1000,
          weight_per_mile_over: 0.001
        }),
        evaluation_type: 'simple',
        evaluation_logic: 'check_travel_distance',
        tags: ['travel', 'cost', 'optimization'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Venue Constraints
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Venue'),
        name: 'Venue Availability',
        description: 'Ensures games are scheduled when venues are available',
        type: 'hard',
        sport: null,
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['venue_id'],
          properties: {
            venue_id: {
              type: 'integer',
              description: 'Venue identifier'
            },
            blackout_dates: {
              type: 'array',
              items: { type: 'string', format: 'date' },
              description: 'Dates when venue is unavailable'
            },
            preferred_days: {
              type: 'array',
              items: { type: 'string' },
              description: 'Preferred days of week'
            }
          }
        }),
        default_parameters: JSON.stringify({
          preferred_days: ['Friday', 'Saturday', 'Sunday']
        }),
        evaluation_type: 'complex',
        evaluation_logic: 'check_venue_availability',
        tags: ['venue', 'availability', 'scheduling'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Broadcast Constraints
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Broadcast'),
        name: 'TV Window Requirement',
        description: 'Schedules games in specific broadcast windows',
        type: 'soft',
        sport: null,
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['windows'],
          properties: {
            windows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'string' },
                  start_time: { type: 'string', format: 'time' },
                  end_time: { type: 'string', format: 'time' },
                  network: { type: 'string' }
                }
              },
              description: 'Available broadcast windows'
            },
            priority: {
              type: 'integer',
              minimum: 1,
              maximum: 10,
              description: 'Broadcast priority level'
            }
          }
        }),
        default_parameters: JSON.stringify({
          windows: [
            { day: 'Saturday', start_time: '12:00', end_time: '23:00', network: 'ESPN' }
          ],
          priority: 5
        }),
        evaluation_type: 'complex',
        evaluation_logic: 'check_broadcast_windows',
        tags: ['broadcast', 'tv', 'revenue'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Academic Constraints
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Academic'),
        name: 'Finals Week Restriction',
        description: 'Prevents games during finals week',
        type: 'hard',
        sport: null,
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['finals_start', 'finals_end'],
          properties: {
            finals_start: {
              type: 'string',
              format: 'date',
              description: 'Start of finals period'
            },
            finals_end: {
              type: 'string',
              format: 'date',
              description: 'End of finals period'
            },
            allow_travel_day: {
              type: 'boolean',
              description: 'Allow travel on day before finals'
            }
          }
        }),
        default_parameters: JSON.stringify({
          allow_travel_day: false
        }),
        evaluation_type: 'simple',
        evaluation_logic: 'check_academic_calendar',
        tags: ['academic', 'student-athlete', 'welfare'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Competitive Balance
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Competitive Balance'),
        name: 'Home/Away Balance',
        description: 'Ensures fair distribution of home and away games',
        type: 'soft',
        sport: null,
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['target_ratio'],
          properties: {
            target_ratio: {
              type: 'number',
              minimum: 0.4,
              maximum: 0.6,
              description: 'Target home game ratio'
            },
            tolerance: {
              type: 'number',
              minimum: 0,
              maximum: 0.1,
              description: 'Acceptable deviation from target'
            },
            consecutive_limit: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
              description: 'Max consecutive home or away games'
            }
          }
        }),
        default_parameters: JSON.stringify({
          target_ratio: 0.5,
          tolerance: 0.05,
          consecutive_limit: 3
        }),
        evaluation_type: 'complex',
        evaluation_logic: 'check_home_away_balance',
        tags: ['balance', 'fairness', 'competitive'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Football-specific
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Football'),
        name: 'Football Bye Week',
        description: 'Ensures proper bye week scheduling for football',
        type: 'hard',
        sport: 'Football',
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['earliest_week', 'latest_week'],
          properties: {
            earliest_week: {
              type: 'integer',
              minimum: 4,
              maximum: 8,
              description: 'Earliest week for bye'
            },
            latest_week: {
              type: 'integer',
              minimum: 8,
              maximum: 12,
              description: 'Latest week for bye'
            },
            preferred_week: {
              type: 'integer',
              description: 'Preferred bye week'
            }
          }
        }),
        default_parameters: JSON.stringify({
          earliest_week: 5,
          latest_week: 11
        }),
        evaluation_type: 'simple',
        evaluation_logic: 'check_football_bye_week',
        tags: ['football', 'bye-week', 'rest'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Basketball-specific
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Basketball'),
        name: 'Basketball Back-to-Back Games',
        description: 'Limits consecutive day games in basketball',
        type: 'soft',
        sport: 'Basketball',
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['max_back_to_backs'],
          properties: {
            max_back_to_backs: {
              type: 'integer',
              minimum: 0,
              maximum: 10,
              description: 'Maximum back-to-back games per season'
            },
            min_rest_after: {
              type: 'integer',
              minimum: 1,
              maximum: 3,
              description: 'Days rest after back-to-back'
            }
          }
        }),
        default_parameters: JSON.stringify({
          max_back_to_backs: 4,
          min_rest_after: 2
        }),
        evaluation_type: 'complex',
        evaluation_logic: 'check_basketball_back_to_backs',
        tags: ['basketball', 'rest', 'player-welfare'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      },

      // Baseball-specific
      {
        template_id: uuidv4(),
        category_id: getCategoryId('Baseball/Softball'),
        name: 'Weekend Series Pattern',
        description: 'Maintains traditional weekend series format',
        type: 'preference',
        sport: 'Baseball',
        parameter_schema: JSON.stringify({
          type: 'object',
          required: ['series_days'],
          properties: {
            series_days: {
              type: 'array',
              items: { type: 'string' },
              description: 'Days for series games'
            },
            games_per_series: {
              type: 'integer',
              minimum: 2,
              maximum: 4,
              description: 'Number of games in series'
            }
          }
        }),
        default_parameters: JSON.stringify({
          series_days: ['Friday', 'Saturday', 'Sunday'],
          games_per_series: 3
        }),
        evaluation_type: 'simple',
        evaluation_logic: 'check_series_pattern',
        tags: ['baseball', 'series', 'tradition'],
        is_system_template: true,
        created_by: 'system',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('constraint_templates', templates);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('constraint_templates', null, {});
  }
};