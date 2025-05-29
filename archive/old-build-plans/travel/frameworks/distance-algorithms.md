# Distance Calculation Algorithms

## Overview

Accurate distance calculation is fundamental to travel cost estimation. This document outlines the algorithms and methodologies used in FlexTime for calculating travel distances.

## Distance Calculation Methods

### 1. Great Circle Distance (Haversine Formula)

For air travel and initial distance estimates:

```javascript
function calculateGreatCircleDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

### 2. Road Distance Calculation

For bus travel, apply road factor adjustments:

```javascript
function calculateRoadDistance(originLat, originLon, destLat, destLon) {
  const greatCircleDistance = calculateGreatCircleDistance(originLat, originLon, destLat, destLon);
  const roadFactor = getRoadFactor(greatCircleDistance);
  return greatCircleDistance * roadFactor;
}

function getRoadFactor(distance) {
  // Road factor increases for shorter distances due to less direct routes
  if (distance < 100) return 1.35;
  if (distance < 300) return 1.25;
  if (distance < 500) return 1.20;
  if (distance < 1000) return 1.15;
  return 1.10;
}
```

## Big 12 Conference Venue Coordinates

### Primary Football/Basketball Venues

```javascript
const BIG12_VENUES = {
  arizona: { lat: 32.2319, lon: -110.9501, city: "Tucson, AZ" },
  arizona_state: { lat: 33.4255, lon: -111.9400, city: "Tempe, AZ" },
  baylor: { lat: 31.5804, lon: -97.1139, city: "Waco, TX" },
  byu: { lat: 40.2518, lon: -111.6493, city: "Provo, UT" },
  cincinnati: { lat: 39.1329, lon: -84.5150, city: "Cincinnati, OH" },
  colorado: { lat: 40.0076, lon: -105.2659, city: "Boulder, CO" },
  houston: { lat: 29.7174, lon: -95.4018, city: "Houston, TX" },
  iowa_state: { lat: 42.0308, lon: -93.6319, city: "Ames, IA" },
  kansas: { lat: 38.9543, lon: -95.2558, city: "Lawrence, KS" },
  kansas_state: { lat: 39.1955, lon: -96.5847, city: "Manhattan, KS" },
  oklahoma_state: { lat: 36.1156, lon: -97.0683, city: "Stillwater, OK" },
  tcu: { lat: 32.7096, lon: -97.3677, city: "Fort Worth, TX" },
  texas_tech: { lat: 33.5906, lon: -101.8227, city: "Lubbock, TX" },
  ucf: { lat: 28.6024, lon: -81.2001, city: "Orlando, FL" },
  utah: { lat: 40.7649, lon: -111.8421, city: "Salt Lake City, UT" },
  west_virginia: { lat: 39.6295, lon: -79.9559, city: "Morgantown, WV" }
};
```

## Distance Matrix Pre-calculation

For optimization efficiency, pre-calculate common routes:

```javascript
function generateDistanceMatrix() {
  const venues = Object.keys(BIG12_VENUES);
  const matrix = {};
  
  venues.forEach(origin => {
    matrix[origin] = {};
    venues.forEach(destination => {
      if (origin !== destination) {
        const originCoords = BIG12_VENUES[origin];
        const destCoords = BIG12_VENUES[destination];
        
        matrix[origin][destination] = {
          air: calculateGreatCircleDistance(
            originCoords.lat, originCoords.lon,
            destCoords.lat, destCoords.lon
          ),
          road: calculateRoadDistance(
            originCoords.lat, originCoords.lon,
            destCoords.lat, destCoords.lon
          )
        };
      }
    });
  });
  
  return matrix;
}
```

## Airport Proximity Calculations

For charter flights, factor in airport distances:

```javascript
const AIRPORT_DISTANCES = {
  // Distance from campus to nearest suitable charter airport
  arizona: 10,      // TUS
  arizona_state: 15, // PHX
  baylor: 90,       // ACT
  byu: 45,          // SLC
  cincinnati: 15,   // CVG
  colorado: 25,     // DEN
  houston: 8,       // HOU
  iowa_state: 35,   // DSM
  kansas: 40,       // MCI
  kansas_state: 90, // MCI
  oklahoma_state: 65, // OKC
  tcu: 25,          // DFW
  texas_tech: 8,    // LBB
  ucf: 15,          // MCO
  utah: 45,         // SLC
  west_virginia: 25  // CKB
};

function addAirportTransfer(baseDistance, origin, destination) {
  return baseDistance + AIRPORT_DISTANCES[origin] + AIRPORT_DISTANCES[destination];
}
```

## Validation and Testing

### Distance Accuracy Validation

```javascript
function validateDistanceCalculations() {
  const knownDistances = {
    'texas_tech_to_west_virginia': { expected: 1247, tolerance: 50 },
    'arizona_to_ucf': { expected: 1850, tolerance: 75 },
    'byu_to_cincinnati': { expected: 1456, tolerance: 60 }
  };
  
  // Test calculations against known distances
  Object.entries(knownDistances).forEach(([route, data]) => {
    const calculated = calculateDistance(route);
    const error = Math.abs(calculated - data.expected);
    console.assert(error <= data.tolerance, `Distance calculation error for ${route}`);
  });
}
```

## Integration with Cost Models

```javascript
function getDistanceForCostCalculation(origin, destination, transportMode) {
  const coords1 = BIG12_VENUES[origin];
  const coords2 = BIG12_VENUES[destination];
  
  if (transportMode === 'charter_flight') {
    return addAirportTransfer(
      calculateGreatCircleDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon),
      origin, destination
    );
  } else {
    return calculateRoadDistance(coords1.lat, coords1.lon, coords2.lat, coords2.lon);
  }
}
```

## Related Files

- [Base Cost Model](base-cost-model.md)
- [Venue Data](../data/venue-coordinates.json)
- [Distance Matrix](../data/distance-matrix.json)