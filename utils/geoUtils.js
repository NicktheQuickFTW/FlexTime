/**
 * Geographic Utility Functions
 * 
 * Provides geographic calculations for travel optimization
 * including haversine distance calculations and geographic clustering
 */

/**
 * Calculate the great circle distance between two points on Earth
 * using the Haversine formula
 * 
 * @param {number} lat1 - Latitude of first point in decimal degrees
 * @param {number} lon1 - Longitude of first point in decimal degrees
 * @param {number} lat2 - Latitude of second point in decimal degrees
 * @param {number} lon2 - Longitude of second point in decimal degrees
 * @returns {number} Distance in miles
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  
  // Convert degrees to radians
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const rLat1 = toRadians(lat1);
  const rLat2 = toRadians(lat2);
  
  // Haversine formula
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rLat1) * Math.cos(rLat2) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate driving distance estimate based on great circle distance
 * Applies correction factor for road networks
 * 
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point  
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Estimated driving distance in miles
 */
export function drivingDistanceEstimate(lat1, lon1, lat2, lon2) {
  const straightLineDistance = haversineDistance(lat1, lon1, lat2, lon2);
  
  // Apply correction factor for road networks (typically 1.2-1.4)
  // Use higher factor for longer distances due to interstate routing
  const correctionFactor = straightLineDistance > 500 ? 1.35 : 1.25;
  
  return straightLineDistance * correctionFactor;
}

/**
 * Big 12 Conference school coordinates
 * Used for accurate travel distance calculations
 */
export const BIG12_COORDINATES = {
  'Arizona': { latitude: 32.2319, longitude: -110.9501, city: 'Tucson', timezone: 'Mountain' },
  'Arizona State': { latitude: 33.4242, longitude: -111.9281, city: 'Tempe', timezone: 'Mountain' },
  'Baylor': { latitude: 31.5489, longitude: -97.1131, city: 'Waco', timezone: 'Central' },
  'BYU': { latitude: 40.2518, longitude: -111.6493, city: 'Provo', timezone: 'Mountain' },
  'Cincinnati': { latitude: 39.1612, longitude: -84.4569, city: 'Cincinnati', timezone: 'Eastern' },
  'Colorado': { latitude: 40.0150, longitude: -105.2705, city: 'Boulder', timezone: 'Mountain' },
  'Houston': { latitude: 29.7604, longitude: -95.3698, city: 'Houston', timezone: 'Central' },
  'Iowa State': { latitude: 42.0308, longitude: -93.6319, city: 'Ames', timezone: 'Central' },
  'Kansas': { latitude: 38.9717, longitude: -95.2353, city: 'Lawrence', timezone: 'Central' },
  'Kansas State': { latitude: 39.1836, longitude: -96.5717, city: 'Manhattan', timezone: 'Central' },
  'Oklahoma State': { latitude: 36.1156, longitude: -97.0583, city: 'Stillwater', timezone: 'Central' },
  'TCU': { latitude: 32.7767, longitude: -97.3298, city: 'Fort Worth', timezone: 'Central' },
  'Texas Tech': { latitude: 33.5779, longitude: -101.8552, city: 'Lubbock', timezone: 'Central' },
  'UCF': { latitude: 28.5383, longitude: -81.3792, city: 'Orlando', timezone: 'Eastern' },
  'Utah': { latitude: 40.7649, longitude: -111.8421, city: 'Salt Lake City', timezone: 'Mountain' },
  'West Virginia': { latitude: 39.6295, longitude: -79.9559, city: 'Morgantown', timezone: 'Eastern' }
};

/**
 * Calculate travel distance between two Big 12 schools
 * @param {string} school1 - Name of first school
 * @param {string} school2 - Name of second school
 * @returns {number} Distance in miles
 */
export function calculateBig12Distance(school1, school2) {
  const coord1 = BIG12_COORDINATES[school1];
  const coord2 = BIG12_COORDINATES[school2];
  
  if (!coord1 || !coord2) {
    throw new Error(`Coordinates not found for ${school1} or ${school2}`);
  }
  
  return haversineDistance(
    coord1.latitude, coord1.longitude,
    coord2.latitude, coord2.longitude
  );
}

/**
 * Calculate driving time estimate based on distance
 * @param {number} distance - Distance in miles
 * @returns {number} Estimated driving time in hours
 */
export function estimateDrivingTime(distance) {
  // Average speeds for different distance ranges
  if (distance < 100) {
    return distance / 45; // City/local driving
  } else if (distance < 500) {
    return distance / 60; // Highway driving
  } else {
    return distance / 65; // Interstate driving
  }
}

/**
 * Determine if a trip crosses time zones
 * @param {string} school1 - Name of first school
 * @param {string} school2 - Name of second school
 * @returns {object} Timezone information
 */
export function analyzeTimezoneImpact(school1, school2) {
  const coord1 = BIG12_COORDINATES[school1];
  const coord2 = BIG12_COORDINATES[school2];
  
  if (!coord1 || !coord2) {
    return { timezoneChange: false, hoursDifference: 0 };
  }
  
  const timezoneOffsets = {
    'Eastern': -5,
    'Central': -6,
    'Mountain': -7
  };
  
  const offset1 = timezoneOffsets[coord1.timezone];
  const offset2 = timezoneOffsets[coord2.timezone];
  const hoursDifference = Math.abs(offset1 - offset2);
  
  return {
    timezoneChange: hoursDifference > 0,
    hoursDifference,
    fromTimezone: coord1.timezone,
    toTimezone: coord2.timezone
  };
}

/**
 * Get geographic region for a school
 * @param {string} schoolName - Name of the school
 * @returns {string} Geographic region
 */
export function getSchoolRegion(schoolName) {
  const regions = {
    'Mountain West': ['Arizona', 'Arizona State', 'Colorado', 'Utah', 'BYU'],
    'Texas': ['Baylor', 'TCU', 'Texas Tech', 'Houston'],
    'Central Plains': ['Kansas', 'Kansas State', 'Iowa State', 'Oklahoma State'],
    'Eastern': ['Cincinnati', 'West Virginia', 'UCF']
  };
  
  for (const [region, schools] of Object.entries(regions)) {
    if (schools.includes(schoolName)) {
      return region;
    }
  }
  
  return 'Unknown';
}

/**
 * Calculate total travel distance for a team's schedule
 * @param {string} teamName - Name of the team
 * @param {Array} games - Array of game objects with opponent and venue info
 * @returns {object} Travel statistics
 */
export function calculateSeasonTravelStats(teamName, games) {
  let totalDistance = 0;
  let awayGames = 0;
  let crossCountryTrips = 0;
  let timezoneChanges = 0;
  const trips = [];
  
  games.forEach(game => {
    if (game.awayTeam === teamName) {
      const distance = calculateBig12Distance(teamName, game.homeTeam);
      const timezone = analyzeTimezoneImpact(teamName, game.homeTeam);
      
      totalDistance += distance * 2; // Round trip
      awayGames++;
      
      if (distance > 1000) {
        crossCountryTrips++;
      }
      
      if (timezone.timezoneChange) {
        timezoneChanges++;
      }
      
      trips.push({
        opponent: game.homeTeam,
        distance,
        roundTripDistance: distance * 2,
        drivingTime: estimateDrivingTime(distance),
        timezoneChange: timezone.timezoneChange,
        hoursDifference: timezone.hoursDifference
      });
    }
  });
  
  return {
    totalDistance,
    awayGames,
    averageDistance: awayGames > 0 ? totalDistance / awayGames : 0,
    crossCountryTrips,
    timezoneChanges,
    longestTrip: Math.max(...trips.map(t => t.distance), 0),
    trips
  };
}

/**
 * Find optimal travel partners based on geographic proximity
 * @param {Array} schools - Array of school names
 * @returns {Array} Array of travel partner pairs
 */
export function findOptimalTravelPartners(schools) {
  const pairs = [];
  const used = new Set();
  
  // Calculate distances between all school pairs
  const distances = [];
  for (let i = 0; i < schools.length; i++) {
    for (let j = i + 1; j < schools.length; j++) {
      const distance = calculateBig12Distance(schools[i], schools[j]);
      distances.push({
        school1: schools[i],
        school2: schools[j],
        distance
      });
    }
  }
  
  // Sort by distance and find closest pairs
  distances.sort((a, b) => a.distance - b.distance);
  
  distances.forEach(pair => {
    if (!used.has(pair.school1) && !used.has(pair.school2)) {
      pairs.push({
        schools: [pair.school1, pair.school2],
        distance: pair.distance,
        region: getSchoolRegion(pair.school1)
      });
      used.add(pair.school1);
      used.add(pair.school2);
    }
  });
  
  return pairs;
}

export default {
  haversineDistance,
  drivingDistanceEstimate,
  calculateBig12Distance,
  estimateDrivingTime,
  analyzeTimezoneImpact,
  getSchoolRegion,
  calculateSeasonTravelStats,
  findOptimalTravelPartners,
  BIG12_COORDINATES
};