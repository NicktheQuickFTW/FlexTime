/**
 * Analyze 2024-25 Big 12 Campus Conflicts
 * 
 * Parse and analyze campus-specific scheduling conflicts for reference
 */

const fs = require('fs');
const csv = require('csv-parser');

async function analyzeCampusConflicts2024() {
  const conflictsFile = '/Users/nickw/Desktop/Schedules/2024-25 Big 12 Campus Conflicts.csv';
  const conflicts = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(conflictsFile)
      .pipe(csv())
      .on('data', (row) => {
        // Clean up the row data
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          // Remove BOM and clean keys
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          cleanRow[cleanKey] = row[key] ? row[key].trim() : '';
        });
        
        if (cleanRow.School || cleanRow.Institution || cleanRow.University) {
          conflicts.push(cleanRow);
        }
      })
      .on('end', () => {
        resolve(conflicts);
      })
      .on('error', reject);
  });
}

async function displayConflicts() {
  console.log('📅 Analyzing 2024-25 Big 12 Campus Conflicts (Reference Year)');
  console.log('==========================================================\n');
  
  try {
    const conflicts = await analyzeCampusConflicts2024();
    
    console.log(`Total rows found: ${conflicts.length}\n`);
    
    // Display headers to understand structure
    if (conflicts.length > 0) {
      console.log('Column headers found:');
      console.log(Object.keys(conflicts[0]).join(', '));
      console.log('\n');
    }
    
    // Group conflicts by school
    const conflictsBySchool = {};
    
    conflicts.forEach(row => {
      // Try different possible column names for school
      const school = row.School || row.Institution || row.University || row.Team || '';
      if (school) {
        if (!conflictsBySchool[school]) {
          conflictsBySchool[school] = [];
        }
        conflictsBySchool[school].push(row);
      }
    });
    
    // Display conflicts by school
    console.log('🏫 2024-25 Conflicts by School:');
    console.log('==============================');
    
    Object.entries(conflictsBySchool).forEach(([school, schoolConflicts]) => {
      console.log(`\n${school}:`);
      console.log('-'.repeat(school.length + 1));
      
      schoolConflicts.forEach((conflict, idx) => {
        console.log(`\nConflict ${idx + 1}:`);
        Object.entries(conflict).forEach(([key, value]) => {
          if (value && key !== 'School' && key !== 'Institution' && key !== 'University') {
            console.log(`  ${key}: ${value}`);
          }
        });
      });
    });
    
    // Look for patterns in dates
    console.log('\n\n📆 Common Date Patterns (2024-25):');
    console.log('=================================');
    
    const graduationDates = [];
    const examPreferences = [];
    const facilityConflicts = [];
    
    conflicts.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (value) {
          // Look for graduation dates
          if (key.toLowerCase().includes('graduation')) {
            graduationDates.push({
              school: row.School || row.Institution || '',
              date: value
            });
          }
          
          // Look for exam preferences
          if (key.toLowerCase().includes('exam') && value.toLowerCase().includes('home')) {
            examPreferences.push({
              school: row.School || row.Institution || '',
              sport: key,
              preference: value
            });
          }
          
          // Look for facility conflicts
          if (value.toLowerCase().includes('cannot host') || 
              value.toLowerCase().includes('closed') ||
              value.toLowerCase().includes('unavailable')) {
            facilityConflicts.push({
              school: row.School || row.Institution || '',
              conflict: value
            });
          }
        }
      });
    });
    
    if (graduationDates.length > 0) {
      console.log('\nGraduation Dates:');
      graduationDates.forEach(g => {
        console.log(`  - ${g.school}: ${g.date}`);
      });
    }
    
    if (examPreferences.length > 0) {
      console.log('\nExam Period Preferences:');
      examPreferences.forEach(e => {
        console.log(`  - ${e.school}: ${e.preference}`);
      });
    }
    
    if (facilityConflicts.length > 0) {
      console.log('\nFacility Conflicts:');
      facilityConflicts.forEach(f => {
        console.log(`  - ${f.school}: ${f.conflict}`);
      });
    }
    
    // Compare patterns between years
    console.log('\n\n🔄 Year-over-Year Patterns:');
    console.log('==========================');
    console.log('Common patterns to look for:');
    console.log('- Graduation dates typically in early to mid-May');
    console.log('- Baseball/Softball teams prefer home games during exams');
    console.log('- BYU consistently has Sunday/General Conference restrictions');
    console.log('- Arena closures for graduation ceremonies in December');
    console.log('- Football game conflicts for soccer/volleyball');
    
  } catch (error) {
    console.error('Error analyzing conflicts:', error);
  }
}

// Run analysis
if (require.main === module) {
  displayConflicts()
    .then(() => {
      console.log('\n✅ 2024-25 campus conflicts analysis complete!');
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { analyzeCampusConflicts2024 };