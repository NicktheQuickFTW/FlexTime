const fs = require('fs');

// School name to ID mapping
const schoolMapping = {
  'Arizona': 1, 'Arizona State': 2, 'Baylor': 3, 'BYU': 4, 'UCF': 5, 
  'Cincinnati': 6, 'Colorado': 7, 'Houston': 8, 'Iowa State': 9, 
  'Kansas': 10, 'Kansas State': 11, 'Oklahoma State': 12, 'TCU': 13, 
  'Texas Tech': 14, 'Utah': 15, 'West Virginia': 16
};

// Sport name to sport_id mapping for the 12 FlexTime-managed sports
const sportMapping = {
  'Baseball': 1,
  'Men\'s Basketball': 2,
  'Women\'s Basketball': 3,
  'Football': 8,
  'Gymnastics': 11,
  'Lacrosse': 12,
  'Soccer': 14,
  'Softball': 15,
  'Men\'s Tennis': 18,
  'Women\'s Tennis': 19,
  'Volleyball': 24,
  'Wrestling': 25
};

// Read the CSV file
const csvContent = fs.readFileSync('docs/XII Conference Contacts 13779839c200819db58bd3f239672f9a_all.csv', 'utf8');
const lines = csvContent.split('\n');

// Parse CSV and extract school-sport relationships
const sportParticipation = {};

// Initialize sport arrays
Object.values(sportMapping).forEach(sportId => {
  sportParticipation[sportId] = [];
});

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Parse CSV line (handling commas in quoted fields)
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(currentField.trim());
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField.trim());
  
  if (fields.length < 6) continue;
  
  const schoolName = fields[0]?.replace(/﻿/g, ''); // Remove BOM
  const sport = fields[5];
  const memberStatus = fields[6];
  
  // Only process Legacy members (actual Big 12 schools)
  if (memberStatus !== 'Legacy') continue;
  
  // Check if school is in our mapping
  const schoolId = schoolMapping[schoolName];
  if (!schoolId) continue;
  
  // Parse sports (can be multiple sports separated by commas)
  if (sport) {
    const sports = sport.split(',').map(s => s.trim());
    
    sports.forEach(sportName => {
      const sportId = sportMapping[sportName];
      if (sportId && !sportParticipation[sportId].includes(schoolId)) {
        sportParticipation[sportId].push(schoolId);
      }
    });
  }
}

// Sort school IDs in each sport
Object.keys(sportParticipation).forEach(sportId => {
  sportParticipation[sportId].sort((a, b) => a - b);
});

// Output the result
console.log('Big 12 Sport Participation Mapping:');
console.log('===================================');
console.log();

const sportNames = {
  1: 'Baseball', 2: 'Men\'s Basketball', 3: 'Women\'s Basketball', 8: 'Football',
  11: 'Gymnastics', 12: 'Lacrosse', 14: 'Soccer', 15: 'Softball',
  18: 'Men\'s Tennis', 19: 'Women\'s Tennis', 24: 'Volleyball', 25: 'Wrestling'
};

const schoolNames = Object.fromEntries(Object.entries(schoolMapping).map(([name, id]) => [id, name]));

Object.entries(sportParticipation).forEach(([sportId, schools]) => {
  const schoolNamesList = schools.map(id => schoolNames[id]).join(', ');
  console.log(`${sportNames[sportId]} (sport_id: ${sportId}): [${schools.join(', ')}]`);
  console.log(`  Schools: ${schoolNamesList}`);
  console.log(`  Count: ${schools.length} teams`);
  console.log();
});

// Output JavaScript object format
console.log('JavaScript Object:');
console.log('==================');
console.log(JSON.stringify(sportParticipation, null, 2));