/**
 * Verify Teams Before Cleanup Script
 * 
 * This script checks the current state of teams in the database
 * and identifies which ones would be removed by the cleanup script.
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const { BIG12_SPORT_SPONSORSHIPS } = require('./clean-teams-table');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Initialize Sequelize connection
const sequelize = new Sequelize(
  process.env.NEON_DB_DATABASE || 'HELiiX',
  process.env.NEON_DB_USER || 'xii-os_owner',
  process.env.NEON_DB_PASSWORD || 'npg_4qYJFR0lneIg',
  {
    host: process.env.NEON_DB_HOST || 'ep-wandering-sea-aa01qr2o-pooler.westus3.azure.neon.tech',
    port: parseInt(process.env.NEON_DB_PORT) || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false
  }
);

// Load models
const defineModels = () => {
  const School = require('../models/db-school')(sequelize);
  const Sport = require('../models/db-sport')(sequelize);
  const Season = require('../models/db-season')(sequelize);
  const Team = require('../models/db-team')(sequelize);
  const Schedule = require('../models/db-schedule')(sequelize);
  const Game = require('../models/db-game')(sequelize);
  const ScheduleConstraint = require('../models/db-constraint')(sequelize);
  const Venue = require('../models/db-venue')(sequelize);
  const VenueUnavailability = require('../models/db-venue-unavailability')(sequelize);

  const models = {
    School,
    Sport,
    Season,
    Team,
    Schedule,
    Game,
    ScheduleConstraint,
    Venue,
    VenueUnavailability
  };

  // Initialize associations
  Object.keys(models).forEach(modelName => {
    if (models[modelName].associate) {
      models[modelName].associate(models);
    }
  });

  return models;
};

async function verifyTeamsBeforeCleanup() {
  console.log('🔍 Verifying Teams Table Before Cleanup...\n');
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    // Define models
    const models = defineModels();
    const { Team, Sport, School } = models;
    
    // Get counts
    const totalTeams = await Team.count();
    const totalSports = await Sport.count();
    const totalSchools = await School.count();
    
    console.log('📊 Database Statistics:');
    console.log(`  - Total Teams: ${totalTeams}`);
    console.log(`  - Total Sports: ${totalSports}`);
    console.log(`  - Total Schools: ${totalSchools}\n`);
    
    // Get all teams with their relationships
    const allTeams = await Team.findAll({
      include: [
        { model: School, as: 'school' },
        { model: models.Season, as: 'season', include: [{ model: Sport, as: 'sport' }] }
      ],
      order: [
        [{ model: models.Season, as: 'season' }, { model: Sport, as: 'sport' }, 'sport_name', 'ASC'],
        [{ model: School, as: 'school' }, 'school', 'ASC']
      ]
    });
    
    // Analyze teams by sport
    const teamsBySport = {};
    const teamsToRemove = [];
    
    allTeams.forEach(team => {
      const sportName = team.season?.sport?.sport_name || 'Unknown Sport';
      const schoolName = team.school?.school || 'Unknown School';
      
      if (!teamsBySport[sportName]) {
        teamsBySport[sportName] = {
          total: 0,
          schools: [],
          toRemove: []
        };
      }
      
      teamsBySport[sportName].total++;
      teamsBySport[sportName].schools.push(schoolName);
      
      // Check if this team should be removed
      const sponsoringSchools = BIG12_SPORT_SPONSORSHIPS[sportName] || [];
      if (sponsoringSchools.length > 0 && !sponsoringSchools.includes(schoolName)) {
        teamsBySport[sportName].toRemove.push(schoolName);
        teamsToRemove.push({
          team_id: team.team_id,
          school: schoolName,
          sport: sportName
        });
      }
    });
    
    // Display analysis
    console.log('🏈 Teams by Sport:\n');
    
    Object.entries(teamsBySport).forEach(([sport, data]) => {
      console.log(`${sport}:`);
      console.log(`  Total teams: ${data.total}`);
      
      const sponsoringSchools = BIG12_SPORT_SPONSORSHIPS[sport] || [];
      if (sponsoringSchools.length > 0) {
        console.log(`  Schools that should have teams: ${sponsoringSchools.length}`);
        console.log(`  Teams to remove: ${data.toRemove.length}`);
        
        if (data.toRemove.length > 0) {
          console.log(`  ❌ Teams that will be removed:`);
          data.toRemove.forEach(school => {
            console.log(`     - ${school}`);
          });
        }
      } else {
        console.log(`  ⚠️  No sponsorship data available for this sport`);
      }
      console.log();
    });
    
    // Summary
    console.log('='.repeat(60));
    console.log('📋 CLEANUP PREVIEW SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total teams in database: ${totalTeams}`);
    console.log(`Teams that will be removed: ${teamsToRemove.length}`);
    console.log(`Teams that will remain: ${totalTeams - teamsToRemove.length}`);
    
    if (teamsToRemove.length > 0) {
      console.log('\n⚠️  The following teams will be removed when you run the cleanup script:');
      
      // Group by school for easier reading
      const removeBySchool = teamsToRemove.reduce((acc, team) => {
        if (!acc[team.school]) acc[team.school] = [];
        acc[team.school].push(team.sport);
        return acc;
      }, {});
      
      Object.entries(removeBySchool).forEach(([school, sports]) => {
        console.log(`\n  ${school}:`);
        sports.forEach(sport => {
          console.log(`    - ${sport}`);
        });
      });
    } else {
      console.log('\n✅ No teams need to be removed. All teams match their school\'s sport sponsorships.');
    }
    
  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the verification if this script is executed directly
if (require.main === module) {
  verifyTeamsBeforeCleanup()
    .then(() => {
      console.log('\n✅ Verification completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyTeamsBeforeCleanup };