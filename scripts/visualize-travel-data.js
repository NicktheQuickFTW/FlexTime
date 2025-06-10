/**
 * Travel Data Visualization Script
 * 
 * Generates visual analysis of Big 12 travel distances and cost optimization
 * Run with: node scripts/visualize-travel-data.js
 */

const fs = require('fs');
const path = require('path');

// Big 12 School Coordinates (from our Supabase data)
const BIG12_SCHOOLS = {
  'Arizona': { lat: 32.2319, lon: -110.9501, code: 'ARIZ', tier: 'TIER_2' },
  'Arizona State': { lat: 33.4242, lon: -111.9281, code: 'ASU', tier: 'TIER_2' },
  'Baylor': { lat: 31.5489, lon: -97.1131, code: 'BAY', tier: 'TIER_2' },
  'BYU': { lat: 40.2518, lon: -111.6493, code: 'BYU', tier: 'TIER_2' },
  'Cincinnati': { lat: 39.1032, lon: -84.5120, code: 'CIN', tier: 'TIER_2' },
  'Colorado': { lat: 40.0076, lon: -105.2659, code: 'COL', tier: 'TIER_2' },
  'Houston': { lat: 29.7604, lon: -95.3698, code: 'HOU', tier: 'TIER_2' },
  'Iowa State': { lat: 42.0308, lon: -93.6319, code: 'ISU', tier: 'TIER_2' },
  'Kansas': { lat: 38.9717, lon: -95.2353, code: 'KU', tier: 'TIER_2' },
  'Kansas State': { lat: 39.1836, lon: -96.5717, code: 'KSU', tier: 'TIER_2' },
  'Oklahoma State': { lat: 36.1156, lon: -97.0583, code: 'OSU', tier: 'TIER_2' },
  'TCU': { lat: 32.7297, lon: -97.2909, code: 'TCU', tier: 'TIER_2' },
  'Texas Tech': { lat: 33.5779, lon: -101.8552, code: 'TTU', tier: 'TIER_2' },
  'UCF': { lat: 28.6024, lon: -81.2001, code: 'UCF', tier: 'TIER_2' },
  'Utah': { lat: 40.7649, lon: -111.8421, code: 'UTAH', tier: 'TIER_2' },
  'West Virginia': { lat: 39.6295, lon: -79.9559, code: 'WVU', tier: 'TIER_2' }
};

// Transportation Cost Configuration (Tier 2)
const TRANSPORT_COSTS = {
  CHARTER_BUS: {
    baseCost: 1500,
    costPerMile: 2.8,
    maxDistance: 600,
    capacity: 56,
    comfortRating: 0.7
  },
  CHARTER_FLIGHT: {
    baseCost: 24000,
    maxCost: 50000,
    costPerMile: 30,
    minDistance: 300,
    capacity: 120,
    comfortRating: 0.95
  },
  COMMERCIAL_FLIGHT: {
    costPerPerson: 400,
    groupDiscount: 0.85,
    minDistance: 800,
    comfortRating: 0.6
  }
};

// Travel Partner Configurations
const TRAVEL_PARTNERS = {
  'Arizona/Arizona State': { efficiency: 0.89, distance: 120 },
  'BYU/Utah': { efficiency: 0.84, distance: 45 },
  'Baylor/TCU': { efficiency: 0.92, distance: 100 },
  'Kansas/Kansas State': { efficiency: 0.87, distance: 80 },
  'Cincinnati/West Virginia': { efficiency: 0.76, distance: 320 },
  'Colorado/Texas Tech': { efficiency: 0.71, distance: 350 },
  'Iowa State/Houston': { efficiency: 0.83, distance: 550 },
  'Oklahoma State/UCF': { efficiency: 0.68, distance: 850 }
};

/**
 * Calculate haversine distance between two points
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate optimal transportation mode and cost
 */
function calculateOptimalTransport(distance, travelPartySize = 110) {
  const options = [];
  
  // Charter Bus Option
  if (distance <= TRANSPORT_COSTS.CHARTER_BUS.maxDistance) {
    const busesNeeded = Math.ceil(travelPartySize / TRANSPORT_COSTS.CHARTER_BUS.capacity);
    const busCost = (TRANSPORT_COSTS.CHARTER_BUS.costPerMile * distance + TRANSPORT_COSTS.CHARTER_BUS.baseCost) * busesNeeded;
    
    options.push({
      mode: 'CHARTER_BUS',
      cost: busCost,
      time: distance / 55, // 55 mph average
      comfort: TRANSPORT_COSTS.CHARTER_BUS.comfortRating,
      vehicles: busesNeeded
    });
  }
  
  // Charter Flight Option
  if (distance >= TRANSPORT_COSTS.CHARTER_FLIGHT.minDistance) {
    const aircraftNeeded = Math.ceil(travelPartySize / TRANSPORT_COSTS.CHARTER_FLIGHT.capacity);
    const baseCost = TRANSPORT_COSTS.CHARTER_FLIGHT.baseCost * aircraftNeeded;
    const distanceCost = Math.max(0, distance - 500) * TRANSPORT_COSTS.CHARTER_FLIGHT.costPerMile * aircraftNeeded;
    const flightCost = Math.min(baseCost + distanceCost, TRANSPORT_COSTS.CHARTER_FLIGHT.maxCost * aircraftNeeded);
    
    options.push({
      mode: 'CHARTER_FLIGHT',
      cost: flightCost,
      time: 2.5, // Fixed flight time including airport
      comfort: TRANSPORT_COSTS.CHARTER_FLIGHT.comfortRating,
      aircraft: aircraftNeeded
    });
  }
  
  // Commercial Flight Option
  if (distance >= TRANSPORT_COSTS.COMMERCIAL_FLIGHT.minDistance) {
    const ticketCost = TRANSPORT_COSTS.COMMERCIAL_FLIGHT.costPerPerson * travelPartySize * TRANSPORT_COSTS.COMMERCIAL_FLIGHT.groupDiscount;
    
    options.push({
      mode: 'COMMERCIAL_FLIGHT',
      cost: ticketCost,
      time: 3.5, // Longer due to connections
      comfort: TRANSPORT_COSTS.COMMERCIAL_FLIGHT.comfortRating,
      complexity: 'High'
    });
  }
  
  // Score options (cost 40%, time 30%, comfort 30%)
  const scoredOptions = options.map(option => ({
    ...option,
    score: (1 / (option.cost / 10000)) * 0.4 + (1 / option.time) * 0.3 + option.comfort * 0.3
  }));
  
  return scoredOptions.sort((a, b) => b.score - a.score);
}

/**
 * Categorize trip distance
 */
function categorizeTripDistance(distance) {
  if (distance < 300) return 'Regional';
  if (distance < 600) return 'Conference';
  if (distance < 1200) return 'Cross-Regional';
  return 'Cross-Country';
}

/**
 * Generate comprehensive travel analysis
 */
function generateTravelAnalysis() {
  const schools = Object.keys(BIG12_SCHOOLS);
  const distanceMatrix = {};
  const transportationAnalysis = {};
  const tripCategorization = { Regional: 0, Conference: 0, 'Cross-Regional': 0, 'Cross-Country': 0 };
  
  console.log('🏈 BIG 12 CONFERENCE TRAVEL ANALYSIS');
  console.log('=====================================\n');
  
  // Calculate all school-to-school distances
  schools.forEach(origin => {
    distanceMatrix[origin] = {};
    schools.forEach(destination => {
      if (origin !== destination) {
        const distance = calculateDistance(
          BIG12_SCHOOLS[origin].lat, BIG12_SCHOOLS[origin].lon,
          BIG12_SCHOOLS[destination].lat, BIG12_SCHOOLS[destination].lon
        );
        
        distanceMatrix[origin][destination] = Math.round(distance);
        
        // Categorize trip
        const category = categorizeTripDistance(distance);
        tripCategorization[category]++;
        
        // Calculate optimal transportation
        const transportOptions = calculateOptimalTransport(distance);
        transportationAnalysis[`${origin} → ${destination}`] = {
          distance: Math.round(distance),
          category,
          optimal: transportOptions[0],
          alternatives: transportOptions.slice(1)
        };
      }
    });
  });
  
  // Display Travel Partner Analysis
  console.log('🤝 TRAVEL PARTNER EFFICIENCY');
  console.log('─────────────────────────────');
  Object.entries(TRAVEL_PARTNERS).forEach(([partnership, data]) => {
    console.log(`${partnership.padEnd(25)} | Distance: ${data.distance}mi | Efficiency: ${(data.efficiency * 100).toFixed(1)}%`);
  });
  
  // Display Distance Categories
  console.log('\n📊 TRIP CATEGORIZATION');
  console.log('──────────────────────');
  Object.entries(tripCategorization).forEach(([category, count]) => {
    const percentage = ((count / (schools.length * (schools.length - 1))) * 100).toFixed(1);
    console.log(`${category.padEnd(15)} | ${count.toString().padStart(3)} trips | ${percentage}%`);
  });
  
  // Find extreme distances
  const allDistances = Object.values(transportationAnalysis).map(t => t.distance);
  const maxDistance = Math.max(...allDistances);
  const minDistance = Math.min(...allDistances);
  
  const longestTrip = Object.entries(transportationAnalysis).find(([_, data]) => data.distance === maxDistance);
  const shortestTrip = Object.entries(transportationAnalysis).find(([_, data]) => data.distance === minDistance);
  
  console.log('\n🛣️  DISTANCE EXTREMES');
  console.log('───────────────────');
  console.log(`Longest:  ${longestTrip[0]} (${longestTrip[1].distance} miles)`);
  console.log(`Shortest: ${shortestTrip[0]} (${shortestTrip[1].distance} miles)`);
  
  // Cost Analysis Sample
  console.log('\n💰 COST ANALYSIS EXAMPLES');
  console.log('─────────────────────────');
  
  const sampleTrips = [
    'Baylor → TCU',              // Regional
    'Kansas → Kansas State',     // Regional
    'Iowa State → Houston',      // Cross-Regional
    'West Virginia → Arizona'    // Cross-Country
  ];
  
  sampleTrips.forEach(trip => {
    const analysis = transportationAnalysis[trip];
    if (analysis) {
      console.log(`\n${trip} (${analysis.distance} miles - ${analysis.category})`);
      console.log(`  Optimal: ${analysis.optimal.mode} - $${analysis.optimal.cost.toLocaleString()} - ${analysis.optimal.time.toFixed(1)}hrs`);
      analysis.alternatives.forEach(alt => {
        console.log(`  Alt:     ${alt.mode} - $${alt.cost.toLocaleString()} - ${alt.time.toFixed(1)}hrs`);
      });
    }
  });
  
  // Geographic Pod Analysis
  console.log('\n🗺️  GEOGRAPHIC PODS');
  console.log('──────────────────');
  
  const pods = {
    'Western Corridor': ['Arizona', 'Arizona State', 'BYU', 'Utah'],
    'Texas/Mountain': ['Baylor', 'TCU', 'Texas Tech', 'Colorado'],
    'Central Plains': ['Kansas', 'Kansas State', 'Iowa State', 'Oklahoma State'],
    'Southern/Eastern': ['Houston', 'UCF', 'Cincinnati', 'West Virginia']
  };
  
  Object.entries(pods).forEach(([podName, podSchools]) => {
    console.log(`\n${podName}:`);
    podSchools.forEach(school => {
      console.log(`  - ${school} (${BIG12_SCHOOLS[school].code})`);
    });
    
    // Calculate internal pod distances
    const internalDistances = [];
    for (let i = 0; i < podSchools.length; i++) {
      for (let j = i + 1; j < podSchools.length; j++) {
        const distance = distanceMatrix[podSchools[i]][podSchools[j]];
        internalDistances.push(distance);
      }
    }
    
    const avgInternalDistance = internalDistances.reduce((sum, d) => sum + d, 0) / internalDistances.length;
    console.log(`  Average internal distance: ${Math.round(avgInternalDistance)} miles`);
  });
  
  // Season Cost Projection
  console.log('\n📈 SEASON COST PROJECTIONS (Tier 2)');
  console.log('──────────────────────────────────');
  
  const sports = [
    { name: 'Football', awayGames: 4, travelParty: 130 },
    { name: 'Men\'s Basketball', awayGames: 10, travelParty: 25 },
    { name: 'Women\'s Basketball', awayGames: 9, travelParty: 23 },
    { name: 'Baseball', awayGames: 5, travelParty: 45 },
    { name: 'Volleyball', awayGames: 7, travelParty: 20 }
  ];
  
  sports.forEach(sport => {
    // Estimate average trip cost for the sport
    const sampleDistances = [400, 600, 800, 1200, 300]; // Representative distances
    const avgCosts = sampleDistances.map(distance => {
      const options = calculateOptimalTransport(distance, sport.travelParty);
      return options[0].cost;
    });
    const avgCostPerTrip = avgCosts.reduce((sum, cost) => sum + cost, 0) / avgCosts.length;
    const seasonCost = avgCostPerTrip * sport.awayGames;
    
    console.log(`${sport.name.padEnd(18)} | ${sport.awayGames} away games | $${seasonCost.toLocaleString().padStart(9)} season`);
  });
  
  return {
    distanceMatrix,
    transportationAnalysis,
    tripCategorization,
    pods,
    extremes: { longest: longestTrip, shortest: shortestTrip }
  };
}

/**
 * Export data for Supabase integration
 */
function exportSupabaseData(analysisData) {
  const supabaseExport = {
    schools: Object.entries(BIG12_SCHOOLS).map(([name, data], index) => ({
      id: index + 1,
      school_name: name,
      school_code: data.code,
      latitude: data.lat,
      longitude: data.lon,
      tier: data.tier
    })),
    
    travel_costs: Object.entries(TRANSPORT_COSTS).flatMap(([mode, config], index) => 
      mode === 'COMMERCIAL_FLIGHT' ? [{
        id: index + 1,
        tier: 'TIER_2',
        transport_mode: mode.toLowerCase(),
        cost_per_person: config.costPerPerson,
        min_distance: config.minDistance,
        comfort_rating: config.comfortRating
      }] : [{
        id: index + 1,
        tier: 'TIER_2',
        transport_mode: mode.toLowerCase(),
        base_cost: config.baseCost,
        cost_per_mile: config.costPerMile,
        max_distance: config.maxDistance || null,
        min_distance: config.minDistance || 0,
        capacity: config.capacity,
        comfort_rating: config.comfortRating
      }]
    ),
    
    travel_partners: Object.entries(TRAVEL_PARTNERS).map(([partnership, data], index) => {
      const [school1, school2] = partnership.split('/');
      return {
        id: index + 1,
        school_1: school1,
        school_2: school2,
        efficiency_rating: data.efficiency,
        distance_between: data.distance,
        partnership_type: 'geographic'
      };
    })
  };
  
  // Write to file
  const outputPath = path.join(__dirname, '..', 'data', 'big12-travel-export.json');
  fs.writeFileSync(outputPath, JSON.stringify(supabaseExport, null, 2));
  console.log(`\n📁 Data exported to: ${outputPath}`);
}

// Main execution
if (require.main === module) {
  console.log('Starting Big 12 Travel Analysis...\n');
  
  const analysisData = generateTravelAnalysis();
  exportSupabaseData(analysisData);
  
  console.log('\n✅ Analysis complete! Travel mileage data is ready for Supabase integration.');
  console.log('\nNext steps:');
  console.log('1. Run the populate-travel-data.sql script in Supabase');
  console.log('2. Verify distance calculations with the haversine function');
  console.log('3. Test travel optimization algorithms with real data');
}

module.exports = {
  BIG12_SCHOOLS,
  TRANSPORT_COSTS,
  TRAVEL_PARTNERS,
  calculateDistance,
  calculateOptimalTransport,
  generateTravelAnalysis
};