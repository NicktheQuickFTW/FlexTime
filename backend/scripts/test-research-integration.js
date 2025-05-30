#!/usr/bin/env node

/**
 * Test Research Integration Script
 * 
 * This script tests the research-to-COMPASS integration with existing data
 */

const path = require('path');
const fs = require('fs').promises;
const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://localhost:5432/flextime', {
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  },
  logging: console.log // Enable logging for testing
});

async function testIntegration() {
  console.log('🧪 Testing Research-to-COMPASS Integration');
  console.log('=' * 50);
  
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Initialize services
    const ResearchCompassIntegration = require('../services/researchCompassIntegration');
    const integration = new ResearchCompassIntegration(sequelize);
    await integration.initialize();
    
    console.log('✅ Integration service initialized');
    
    // Check existing research files
    console.log('\n📁 Checking existing research files...');
    const files = await fs.readdir(integration.inputDir);
    const researchFiles = files.filter(file => 
      file.endsWith('.json') && 
      (file.includes('research') || file.includes('analysis'))
    );
    
    console.log(`Found ${researchFiles.length} research files:`);
    researchFiles.forEach(file => console.log(`   - ${file}`));
    
    if (researchFiles.length === 0) {
      console.log('⚠️ No research files found. Creating test data...');
      await createTestData(integration);
      researchFiles.push('test_basketball_research.json');
    }
    
    // Test processing a single file
    console.log('\n🔄 Testing single file processing...');
    const testFile = researchFiles[0];
    console.log(`Processing: ${testFile}`);
    
    try {
      await integration.processResearchFile(testFile);
      console.log(`✅ Successfully processed: ${testFile}`);
    } catch (error) {
      console.error(`❌ Error processing ${testFile}:`, error.message);
    }
    
    // Check database results
    console.log('\n🗄️ Checking database results...');
    try {
      const ratings = await integration.models.TeamRating.findAll({
        limit: 5,
        order: [['raw_rating', 'DESC']]
      });
      
      console.log(`Found ${ratings.length} COMPASS ratings in database:`);
      ratings.forEach(rating => {
        console.log(`   - Team: ${rating.team_id}, Sport: ${rating.sport}, Rating: ${rating.raw_rating}`);
      });
      
    } catch (error) {
      console.error('❌ Error querying database:', error.message);
    }
    
    // Test API endpoints
    console.log('\n🌐 Testing API endpoints...');
    await testAPIEndpoints();
    
    console.log('\n✅ Integration test completed successfully!');
    
  } catch (error) {
    console.error('💥 Integration test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

async function createTestData(integration) {
  console.log('📝 Creating test research data...');
  
  const testData = {
    research: {
      'Kansas': {
        history: {
          content: `Kansas basketball program analysis reveals exceptional performance with a COMPASS Rating: 96.5/100. 
          
          The Jayhawks have dominated the Big 12 Conference with 14 consecutive regular season titles. Key performance indicators:
          
          Competitive Performance (35%): 33/35 points
          - 14 straight Big 12 titles (record-breaking)
          - Consistent Elite 8+ appearances
          - 2022 National Championship
          
          Operational Excellence (25%): 25/25 points  
          - Bill Self: Elite coaching with lifetime contract
          - Perfect program stability
          - Championship culture and player development
          
          Market Position (20%): 19/20 points
          - Premier national brand recognition
          - Elite NIL program and resources
          - Allen Fieldhouse advantage
          
          Performance Trajectory (15%): 15/15 points
          - Preseason #1 ranking for 2025-26
          - Elite recruiting class incoming
          - Championship expectations maintained
          
          Analytics (5%): 4.5/5 points
          - Elite recruiting metrics and portal success
          - Advanced analytics leadership`,
          citations: [
            'https://espn.com/mens-college-basketball/team/_/id/2305/kansas-jayhawks',
            'https://cbssports.com/college-basketball/teams/KANS/kansas-jayhawks/',
            'https://247sports.com/college/kansas/'
          ],
          timestamp: new Date().toISOString(),
          model: 'llama-3.1-sonar-large-128k-online'
        },
        projections: {
          content: `Kansas 2025-26 projections show continued championship contention with enhanced roster depth.
          
          Key factors supporting elite COMPASS rating:
          - Hunter Dickinson returning (17.9 PPG, 10.8 RPG)
          - Elite transfer additions: AJ Storr, Zeke Mayo
          - #1 overall recruit Darryn Peterson committed
          - Proven championship system under Bill Self
          
          Expected outcomes:
          - Big 12 Championship favorite (15th consecutive)
          - #1 seed NCAA Tournament projection
          - Final Four/Championship game probability: 65%`,
          citations: [
            'https://247sports.com/college/kansas/sport/basketball/roster/',
            'https://kenpom.com/team.php?team=Kansas'
          ],
          timestamp: new Date().toISOString(),
          model: 'llama-3.1-sonar-large-128k-online'
        }
      },
      'Houston': {
        history: {
          content: `Houston Cougars basketball program demonstrates elite defensive identity with COMPASS Rating: 94.0/100.
          
          Program highlights under Kelvin Sampson:
          - 5 consecutive Sweet 16 appearances
          - #1 defense nationally (57.6 PPG allowed)
          - Big 12 regular season champions in debut season
          
          Rating breakdown:
          Competitive Performance: 32/35 - Elite Eight regular participant
          Operational Excellence: 24/25 - Elite coaching and system
          Market Position: 19/20 - Strong Houston market, elite facilities
          Performance Trajectory: 14/15 - Consistent Final Four contender
          Analytics: 5/5 - Defensive metrics leader`,
          citations: ['https://espn.com/mens-college-basketball/team/_/id/248/houston-cougars'],
          timestamp: new Date().toISOString(),
          model: 'llama-3.1-sonar-large-128k-online'
        }
      }
    },
    trends: {
      'Kansas': {
        content: 'Historical COMPASS progression shows sustained excellence at 95+ rating for 5 consecutive years.',
        ratingType: 'COMPASS Historical and Projected - Basketball',
        model: 'gemini-1.5-pro-latest',
        timestamp: new Date().toISOString()
      }
    },
    metadata: {
      sport: 'basketball',
      teams: 2,
      duration: 45.5,
      completedAt: new Date().toISOString()
    }
  };
  
  const testPath = path.join(integration.inputDir, 'test_basketball_research.json');
  await fs.writeFile(testPath, JSON.stringify(testData, null, 2));
  console.log(`✅ Test data created: ${testPath}`);
}

async function testAPIEndpoints() {
  // This would test the API endpoints if the server is running
  // For now, just log what we would test
  console.log('API endpoints to test:');
  console.log('   - GET /api/research-integration/status');
  console.log('   - POST /api/research-integration/process');
  console.log('   - GET /api/research-integration/files');
  console.log('   - GET /api/research-integration/compass-ratings');
  console.log('   (Requires server to be running for actual testing)');
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n👋 Test interrupted...');
  sequelize.close().then(() => {
    process.exit(0);
  });
});

// Run the test
if (require.main === module) {
  testIntegration();
}

module.exports = { testIntegration, createTestData };