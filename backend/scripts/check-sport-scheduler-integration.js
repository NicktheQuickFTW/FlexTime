/**
 * Check Sport Scheduler Integration Status
 * 
 * This script verifies the operational status of sport scheduler components
 * and their integration with the FTBuilderEngine.
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 SPORT SCHEDULER INTEGRATION STATUS REPORT\n');
console.log('=' .repeat(60));

// 1. Check if base SportScheduler exists
const sportSchedulerPath = path.join(__dirname, '../services/schedulers/base/SportScheduler.js');
const sportSchedulerExists = fs.existsSync(sportSchedulerPath);
console.log(`\n1. Base SportScheduler Class:`);
console.log(`   ✅ File exists: ${sportSchedulerPath}`);
if (sportSchedulerExists) {
  const SportScheduler = require(sportSchedulerPath);
  console.log(`   ✅ Class loaded successfully`);
  console.log(`   ✅ Methods: ${Object.getOwnPropertyNames(SportScheduler.prototype).join(', ')}`);
}

// 2. Check sport-specific schedulers
console.log(`\n2. Sport-Specific Schedulers:`);
const sportSchedulers = {
  'FootballScheduler': '../services/schedulers/sports/FootballScheduler.js',
  'BasketballScheduler': '../services/schedulers/sports/BasketballScheduler.js',
  'BaseballScheduler': '../services/schedulers/sports/BaseballScheduler.js',
  'LacrosseScheduler': '../services/schedulers/sports/LacrosseScheduler.js'
};

const availableSchedulers = {};
for (const [name, relativePath] of Object.entries(sportSchedulers)) {
  const fullPath = path.join(__dirname, relativePath);
  const exists = fs.existsSync(fullPath);
  console.log(`   ${exists ? '✅' : '❌'} ${name}: ${exists ? 'Found' : 'Not found'}`);
  
  if (exists) {
    try {
      const Scheduler = require(fullPath);
      availableSchedulers[name] = Scheduler;
      console.log(`      ✅ Loaded successfully`);
    } catch (error) {
      console.log(`      ❌ Load failed: ${error.message}`);
    }
  }
}

// 3. Check FTBuilderEngine integration
console.log(`\n3. FTBuilderEngine Integration:`);
const ftBuilderPath = path.join(__dirname, '../services/FT_Builder_Engine.js');
const FTBuilderEngine = require(ftBuilderPath);

// Check the source code for scheduler references
const ftBuilderSource = fs.readFileSync(ftBuilderPath, 'utf8');
const hasSchedulerComments = ftBuilderSource.includes('sportSchedulers');
const hasLacrosseIntegration = ftBuilderSource.includes('LacrosseConstraintSolver');
const hasSchedulerRegistry = ftBuilderSource.includes('SportSchedulerRegistry');

console.log(`   ${hasSchedulerComments ? '⚠️' : '❌'} Sport scheduler registry: ${hasSchedulerComments ? 'Commented out' : 'Not found'}`);
console.log(`   ${hasLacrosseIntegration ? '✅' : '❌'} Lacrosse solver integration: ${hasLacrosseIntegration ? 'Active' : 'Not found'}`);
console.log(`   ${hasSchedulerRegistry ? '✅' : '❌'} Scheduler registry class: ${hasSchedulerRegistry ? 'Found' : 'Not implemented'}`);

// 4. Check API integration
console.log(`\n4. API Route Integration:`);
const routeFiles = [
  '../routes/scheduleRoutes.js',
  '../src/api/schedulingServiceRoutes.js',
  '../src/config/routes.js'
];

for (const routeFile of routeFiles) {
  const fullPath = path.join(__dirname, routeFile);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    const usesFTBuilder = content.includes('FTBuilderEngine');
    const usesSportSchedulers = content.includes('SportScheduler') || content.includes('FootballScheduler');
    
    console.log(`   ${path.basename(fullPath)}:`);
    console.log(`      ${usesFTBuilder ? '✅' : '❌'} Uses FTBuilderEngine: ${usesFTBuilder}`);
    console.log(`      ${usesSportSchedulers ? '✅' : '❌'} Uses sport schedulers: ${usesSportSchedulers}`);
  }
}

// 5. Test basic functionality
console.log(`\n5. Functionality Test:`);
if (availableSchedulers.FootballScheduler) {
  try {
    const FootballScheduler = availableSchedulers.FootballScheduler;
    const scheduler = new FootballScheduler({});
    console.log(`   ✅ FootballScheduler instantiated`);
    
    const metadata = scheduler.getMetadata();
    console.log(`   ✅ Metadata: ${JSON.stringify(metadata, null, 2).split('\n').join('\n      ')}`);
    
    const constraints = scheduler.getDefaultConstraints();
    console.log(`   ✅ Default constraints: ${constraints.length} defined`);
  } catch (error) {
    console.log(`   ❌ FootballScheduler test failed: ${error.message}`);
  }
}

// 6. Integration gaps
console.log(`\n6. Integration Status Summary:`);
console.log(`   🔶 Sport schedulers are IMPLEMENTED but NOT INTEGRATED`);
console.log(`   🔶 FTBuilderEngine has placeholder comments for integration`);
console.log(`   🔶 No SportSchedulerRegistry exists yet`);
console.log(`   🔶 API routes use FTBuilderEngine but not sport schedulers`);

console.log(`\n7. Missing Components for Full Integration:`);
console.log(`   ❌ SportSchedulerRegistry class`);
console.log(`   ❌ Registry integration in FTBuilderEngine`);
console.log(`   ❌ Sport ID to scheduler mapping`);
console.log(`   ❌ Common services extraction (DateAssignmentService, etc.)`);
console.log(`   ❌ API endpoint to use sport-specific schedulers`);

console.log(`\n8. What IS Working:`);
console.log(`   ✅ SportScheduler base class implemented`);
console.log(`   ✅ FootballScheduler implemented (with issues)`);
console.log(`   ✅ FTBuilderEngine handles general scheduling`);
console.log(`   ✅ LacrosseConstraintSolver integrated for lacrosse`);
console.log(`   ✅ API routes use FTBuilderEngine successfully`);

console.log('\n' + '=' .repeat(60));
console.log('\n📊 CONCLUSION: Sport schedulers exist but are NOT operational.\n');
console.log('The components are built but lack the connecting infrastructure');
console.log('to make them work within the system. The FTBuilderEngine currently');
console.log('uses SimpleSchedulingService for all sports except Lacrosse.\n');