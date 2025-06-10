/**
 * Seed Constraint Categories
 * Creates the initial category hierarchy for organizing constraints
 */

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const categories = [
      // Root categories
      {
        category_id: uuidv4(),
        name: 'Scheduling',
        description: 'Core scheduling constraints',
        icon: 'calendar',
        color: '#2563eb',
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Travel',
        description: 'Travel and logistics constraints',
        icon: 'airplane',
        color: '#10b981',
        display_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Venue',
        description: 'Venue availability and capacity constraints',
        icon: 'building',
        color: '#8b5cf6',
        display_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Broadcast',
        description: 'TV and streaming requirements',
        icon: 'tv',
        color: '#f59e0b',
        display_order: 4,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Academic',
        description: 'Academic calendar constraints',
        icon: 'academic-cap',
        color: '#ef4444',
        display_order: 5,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Competitive Balance',
        description: 'Fair competition and balance constraints',
        icon: 'scale',
        color: '#06b6d4',
        display_order: 6,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Sport-Specific',
        description: 'Constraints specific to individual sports',
        icon: 'trophy',
        color: '#ec4899',
        display_order: 7,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('constraint_categories', categories);

    // Get category IDs for subcategories
    const schedulingCat = categories.find(c => c.name === 'Scheduling');
    const travelCat = categories.find(c => c.name === 'Travel');
    const sportCat = categories.find(c => c.name === 'Sport-Specific');

    // Subcategories
    const subcategories = [
      // Scheduling subcategories
      {
        category_id: uuidv4(),
        name: 'Rest Days',
        description: 'Minimum rest between games',
        parent_category_id: schedulingCat.category_id,
        icon: 'clock',
        color: '#3b82f6',
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Date Restrictions',
        description: 'Blackout dates and required dates',
        parent_category_id: schedulingCat.category_id,
        icon: 'calendar-x',
        color: '#3b82f6',
        display_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Season Structure',
        description: 'Conference vs non-conference scheduling',
        parent_category_id: schedulingCat.category_id,
        icon: 'chart-bar',
        color: '#3b82f6',
        display_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Travel subcategories
      {
        category_id: uuidv4(),
        name: 'Distance Limits',
        description: 'Maximum travel distance constraints',
        parent_category_id: travelCat.category_id,
        icon: 'map',
        color: '#10b981',
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Travel Partners',
        description: 'Efficient travel pairings',
        parent_category_id: travelCat.category_id,
        icon: 'users',
        color: '#10b981',
        display_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },

      // Sport-specific subcategories
      {
        category_id: uuidv4(),
        name: 'Football',
        description: 'Football-specific constraints',
        parent_category_id: sportCat.category_id,
        icon: 'football',
        color: '#dc2626',
        display_order: 1,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Basketball',
        description: 'Basketball-specific constraints',
        parent_category_id: sportCat.category_id,
        icon: 'basketball',
        color: '#ea580c',
        display_order: 2,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        category_id: uuidv4(),
        name: 'Baseball/Softball',
        description: 'Baseball and softball constraints',
        parent_category_id: sportCat.category_id,
        icon: 'baseball',
        color: '#84cc16',
        display_order: 3,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('constraint_categories', subcategories);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('constraint_categories', null, {});
  }
};