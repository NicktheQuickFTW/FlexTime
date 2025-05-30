/**
 * Clean Teams Table Script
 * 
 * This script removes teams from the database for sports that schools don't actually sponsor
 * based on the official Big 12 Conference sport sponsorships.
 */

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Big 12 Sport Sponsorships (from CLAUDE.md)
const BIG12_SPORT_SPONSORSHIPS = {
  'Baseball': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Houston', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Beach Volleyball': ['Arizona', 'Arizona State', 'TCU'],
  'Equestrian': ['Baylor', 'Oklahoma State', 'TCU'],
  'Football': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Gymnastics': ['Arizona', 'Arizona State', 'BYU', 'Iowa State', 'Utah', 'West Virginia'],
  'Lacrosse': ['Arizona State', 'Cincinnati', 'Colorado'],
  "Men's Basketball": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Men's Cross Country": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
  "Men's Golf": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Men's Indoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
  "Men's Outdoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech'],
  "Men's Swimming & Diving": ['Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'TCU', 'Utah', 'West Virginia'],
  "Men's Tennis": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah'],
  'Rowing': ['Kansas', 'Kansas State', 'UCF', 'West Virginia'],
  'Soccer': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Softball': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Houston', 'Iowa State', 'Kansas', 'Oklahoma State', 'Texas Tech', 'UCF', 'Utah'],
  'Volleyball': ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Basketball": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Cross Country": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Golf": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF'],
  "Women's Indoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Outdoor Track & Field": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  "Women's Swimming & Diving": ['Arizona', 'Arizona State', 'BYU', 'Cincinnati', 'Houston', 'Iowa State', 'Kansas', 'TCU', 'Utah', 'West Virginia'],
  "Women's Tennis": ['Arizona', 'Arizona State', 'BYU', 'Baylor', 'Cincinnati', 'Colorado', 'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State', 'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'],
  'Wrestling': ['Arizona State', 'Iowa State', 'Oklahoma State', 'West Virginia']
};

// School name mappings to ensure consistency
const SCHOOL_NAME_MAPPING = {
  'Arizona': 'Arizona',
  'Arizona State': 'Arizona State',
  'Baylor': 'Baylor',
  'BYU': 'BYU',
  'Cincinnati': 'Cincinnati',
  'Colorado': 'Colorado',
  'Houston': 'Houston',
  'Iowa State': 'Iowa State',
  'Kansas': 'Kansas',
  'Kansas State': 'Kansas State',
  'K-State': 'Kansas State', // Alternative name
  'Oklahoma State': 'Oklahoma State',
  'TCU': 'TCU',
  'Texas Tech': 'Texas Tech',
  'UCF': 'UCF',
  'Utah': 'Utah',
  'West Virginia': 'West Virginia'
};

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

async function cleanTeamsTable() {
  console.log('🧹 Starting Teams Table Cleanup...\n');
  
  const removedTeams = [];
  const errors = [];
  let totalRemoved = 0;
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.\n');
    
    // Define models
    const models = defineModels();
    const { Team, Sport, School } = models;
    
    // Create backup of teams table
    console.log('📦 Creating backup of teams table...');
    const backupPath = path.join(__dirname, `../data/backups/teams_backup_${new Date().toISOString().split('T')[0]}.json`);
    
    // Ensure backup directory exists
    await fs.mkdir(path.dirname(backupPath), { recursive: true });
    
    // Get all teams for backup
    const allTeams = await Team.findAll({
      include: [
        { model: School, as: 'school' },
        { model: models.Season, as: 'season', include: [{ model: Sport, as: 'sport' }] }
      ]
    });
    
    await fs.writeFile(backupPath, JSON.stringify(allTeams, null, 2));
    console.log(`✅ Backup created at: ${backupPath}\n`);
    
    // Get all sports and schools
    const sports = await Sport.findAll();
    const schools = await School.findAll();
    
    console.log(`Found ${sports.length} sports and ${schools.length} schools in the database.\n`);
    
    // Process each sport
    for (const sport of sports) {
      const sportName = sport.sport_name;
      console.log(`\n📊 Processing ${sportName}...`);
      
      // Get schools that sponsor this sport
      const sponsoringSchools = BIG12_SPORT_SPONSORSHIPS[sportName] || [];
      
      if (sponsoringSchools.length === 0) {
        console.log(`  ⚠️  No sponsorship data found for ${sportName}`);
        continue;
      }
      
      console.log(`  Schools that sponsor ${sportName}: ${sponsoringSchools.length}`);
      
      // Get all teams for this sport
      const teamsForSport = await Team.findAll({
        include: [
          { model: School, as: 'school' },
          { 
            model: models.Season, 
            as: 'season',
            where: { sport_id: sport.sport_id },
            include: [{ model: Sport, as: 'sport' }]
          }
        ]
      });
      
      console.log(`  Found ${teamsForSport.length} teams for ${sportName}`);
      
      // Check each team
      for (const team of teamsForSport) {
        const schoolName = team.school.school;
        
        // Normalize school name for comparison
        const normalizedSchoolName = SCHOOL_NAME_MAPPING[schoolName] || schoolName;
        
        // Check if this school sponsors this sport
        if (!sponsoringSchools.includes(normalizedSchoolName)) {
          // This team should be removed
          console.log(`  ❌ Removing: ${schoolName} ${sportName} (Team ID: ${team.team_id})`);
          
          try {
            // Delete the team
            await team.destroy();
            
            removedTeams.push({
              team_id: team.team_id,
              school: schoolName,
              sport: sportName,
              season: team.season?.year || 'Unknown'
            });
            
            totalRemoved++;
          } catch (error) {
            console.error(`  ⚠️  Error removing team ${team.team_id}:`, error.message);
            errors.push({
              team_id: team.team_id,
              school: schoolName,
              sport: sportName,
              error: error.message
            });
          }
        }
      }
    }
    
    // Generate summary report
    console.log('\n' + '='.repeat(60));
    console.log('📋 CLEANUP SUMMARY REPORT');
    console.log('='.repeat(60));
    console.log(`Total teams removed: ${totalRemoved}`);
    console.log(`Errors encountered: ${errors.length}`);
    
    if (removedTeams.length > 0) {
      console.log('\n🗑️  Removed Teams:');
      
      // Group by sport
      const removedBySport = removedTeams.reduce((acc, team) => {
        if (!acc[team.sport]) acc[team.sport] = [];
        acc[team.sport].push(team);
        return acc;
      }, {});
      
      Object.entries(removedBySport).forEach(([sport, teams]) => {
        console.log(`\n  ${sport}:`);
        teams.forEach(team => {
          console.log(`    - ${team.school} (ID: ${team.team_id})`);
        });
      });
    }
    
    if (errors.length > 0) {
      console.log('\n⚠️  Errors:');
      errors.forEach(error => {
        console.log(`  - ${error.school} ${error.sport}: ${error.error}`);
      });
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, `../data/reports/teams_cleanup_report_${new Date().toISOString().split('T')[0]}.json`);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalRemoved: totalRemoved,
        errorsCount: errors.length
      },
      removedTeams,
      errors,
      sportSponsorships: BIG12_SPORT_SPONSORSHIPS
    };
    
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('\n❌ Critical error during cleanup:', error);
    throw error;
  } finally {
    // Close database connection
    await sequelize.close();
    console.log('\n🔌 Database connection closed.');
  }
}

// Run the cleanup if this script is executed directly
if (require.main === module) {
  cleanTeamsTable()
    .then(() => {
      console.log('\n✅ Teams table cleanup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Teams table cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { cleanTeamsTable, BIG12_SPORT_SPONSORSHIPS };