/**
 * Fix missing schedules table in FlexTime database
 */

const { Sequelize } = require('sequelize');
const path = require('path');

async function fixSchedulesTables() {
  console.log('FlexTime Database Schema Fix - Creating missing tables');
  
  try {
    // Connect to database using environment variables
    const sequelize = new Sequelize(process.env.POSTGRES_URI, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' && !process.env.POSTGRES_URI.includes('@postgres:') ? {
          require: true,
          rejectUnauthorized: false
        } : false
      }
    });
    
    // Authenticate connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Create missing schedules table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "schedules" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "sport_id" INTEGER REFERENCES "sports" ("id"),
        "season" VARCHAR(255),
        "status" VARCHAR(255) DEFAULT 'draft',
        "metadata" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created "schedules" table if it didn\'t exist');
    
    // Create missing games table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "games" (
        "id" SERIAL PRIMARY KEY,
        "schedule_id" INTEGER REFERENCES "schedules" ("id") ON DELETE CASCADE,
        "home_team_id" INTEGER REFERENCES "teams" ("id"),
        "away_team_id" INTEGER REFERENCES "teams" ("id"),
        "venue_id" INTEGER REFERENCES "venues" ("id"),
        "start_date" TIMESTAMP WITH TIME ZONE,
        "end_date" TIMESTAMP WITH TIME ZONE,
        "status" VARCHAR(255) DEFAULT 'scheduled',
        "metadata" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created "games" table if it didn\'t exist');
    
    // Create missing schedule_constraints table if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "schedule_constraints" (
        "id" SERIAL PRIMARY KEY,
        "schedule_id" INTEGER REFERENCES "schedules" ("id") ON DELETE CASCADE,
        "type" VARCHAR(255) NOT NULL,
        "priority" VARCHAR(255) DEFAULT 'medium',
        "team_id" INTEGER REFERENCES "teams" ("id"),
        "data" JSONB,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('Created "schedule_constraints" table if it didn\'t exist');
    
    console.log('Database schema fix completed successfully');
    
  } catch (error) {
    console.error('Error fixing database schema:', error);
    process.exit(1);
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixSchedulesTables()
    .then(() => {
      console.log('Database fix completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixSchedulesTables };
