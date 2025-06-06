/**
 * Analyze 2025-26 Big 12 Campus Conflicts
 * 
 * Parse and analyze campus-specific scheduling conflicts
 */

const fs = require('fs');
const csv = require('csv-parser');

async function analyzeCampusConflicts() {
  const conflictsFile = '/Users/nickw/Desktop/Schedules/2025-26 Big 12 Campus Conflicts.csv';
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
  console.log('📅 Analyzing 2025-26 Big 12 Campus Conflicts');
  console.log('===========================================\n');
  
  try {
    const conflicts = await analyzeCampusConflicts();
    
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
    console.log('🏫 Conflicts by School:');
    console.log('=====================');
    
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
    
    // Look for sport-specific conflicts
    console.log('\n\n🏃 Sport-Specific Conflicts:');
    console.log('==========================');
    
    const sportConflicts = {};
    conflicts.forEach(row => {
      // Look for sport mentions in any field
      Object.entries(row).forEach(([key, value]) => {
        if (value) {
          const lowerValue = value.toLowerCase();
          const sports = [
            'tennis', 'men\'s tennis', 'women\'s tennis', 'mten', 'wten',
            'basketball', 'football', 'baseball', 'softball', 'gymnastics',
            'soccer', 'volleyball', 'lacrosse', 'wrestling', 'track',
            'swimming', 'golf', 'cross country'
          ];
          
          sports.forEach(sport => {
            if (lowerValue.includes(sport)) {
              if (!sportConflicts[sport]) {
                sportConflicts[sport] = [];
              }
              sportConflicts[sport].push({
                school: row.School || row.Institution || row.University || '',
                detail: `${key}: ${value}`
              });
            }
          });
        }
      });
    });
    
    Object.entries(sportConflicts).forEach(([sport, conflicts]) => {
      console.log(`\n${sport}:`);
      conflicts.forEach(conflict => {
        console.log(`  - ${conflict.school}: ${conflict.detail}`);
      });
    });
    
    // Look for date-specific conflicts
    console.log('\n\n📆 Date-Specific Conflicts:');
    console.log('=========================');
    
    const dateConflicts = [];
    conflicts.forEach(row => {
      Object.entries(row).forEach(([key, value]) => {
        if (value) {
          // Look for date patterns
          const datePatterns = [
            /\d{1,2}\/\d{1,2}\/\d{2,4}/,  // MM/DD/YYYY
            /\d{1,2}-\d{1,2}-\d{2,4}/,     // MM-DD-YYYY
            /(January|February|March|April|May|June|July|August|September|October|November|December)/i,
            /week\s*\d+/i,
            /spring break/i,
            /final exam/i,
            /graduation/i,
            /easter/i
          ];
          
          datePatterns.forEach(pattern => {
            if (pattern.test(value)) {
              dateConflicts.push({
                school: row.School || row.Institution || row.University || '',
                conflict: `${key}: ${value}`
              });
            }
          });
        }
      });
    });
    
    if (dateConflicts.length > 0) {
      dateConflicts.forEach(conflict => {
        console.log(`  - ${conflict.school}: ${conflict.conflict}`);
      });
    }
    
    // Summary
    console.log('\n\n📊 Summary:');
    console.log('==========');
    console.log(`Total schools with conflicts: ${Object.keys(conflictsBySchool).length}`);
    console.log(`Total conflicts recorded: ${conflicts.length}`);
    console.log(`Sports mentioned: ${Object.keys(sportConflicts).length}`);
    console.log(`Date-specific conflicts: ${dateConflicts.length}`);
    
  } catch (error) {
    console.error('Error analyzing conflicts:', error);
  }
}

// Run analysis
if (require.main === module) {
  displayConflicts()
    .then(() => {
      console.log('\n✅ Campus conflicts analysis complete!');
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { analyzeCampusConflicts };