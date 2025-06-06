/**
 * Debug script to see what fields are in team objects
 */

const BIG12_DATA = require('../../BIG12_COMPLETE_DATA');

// Get one team to see its structure
const teams = BIG12_DATA.generateBig12Teams();
const lacrosseTeam = teams.find(t => t.sport_id === 13);

console.log('Sample lacrosse team object:');
console.log(JSON.stringify(lacrosseTeam, null, 2));