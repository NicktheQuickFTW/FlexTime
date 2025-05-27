# Base Travel Cost Model Framework

## Overview

This document defines the core travel cost calculation framework for FlexTime scheduling optimization, based on the comprehensive formula framework for collegiate athletics travel.

## Core Formula

**Total Travel Cost = Base Transportation Cost + Accommodation Cost + Meal Cost + Equipment Cost + Variable Adjustments**

## Transportation Cost Models

### Mode Selection Algorithm

```javascript
function selectTransportMode(distance, teamSize, budgetTier) {
  if (distance <= 200) return 'charter_bus';
  if (distance > 200 && distance <= 800) return 'regional_flight_or_bus';
  if (distance > 800) return 'charter_flight';
}
```

### Charter Bus Cost Calculation

```javascript
function calculateBusCost(distance, hours, teamSize, sport) {
  const hourlyRate = getBusHourlyRate(teamSize); // $120-150/hour
  const perMileRate = getBusPerMileRate(distance); // $2.50-3.50/mile
  const driverExpenses = calculateDriverExpenses(hours);
  const equipmentMultiplier = getEquipmentMultiplier(sport);
  
  const baseCost = (hourlyRate * Math.max(hours, 5)) + (perMileRate * distance) + driverExpenses;
  return baseCost * equipmentMultiplier;
}
```

### Charter Flight Cost Calculation

```javascript
function calculateFlightCost(distance, flightHours, teamSize, sport) {
  const aircraftRate = getAircraftHourlyRate(teamSize);
  const repositioningCost = aircraftRate * 0.5 * getDeadheadHours();
  const crewExpenses = calculateCrewExpenses(flightHours);
  const airportFees = getAirportFees();
  const equipmentMultiplier = getEquipmentMultiplier(sport);
  
  const baseCost = (aircraftRate * flightHours) + repositioningCost + crewExpenses + airportFees;
  return baseCost * equipmentMultiplier;
}
```

## Team Size and Equipment Factors

### Sport-Specific Team Sizes
```javascript
const TEAM_SIZES = {
  football: { min: 85, max: 105 },
  mens_basketball: { min: 25, max: 35 },
  womens_basketball: { min: 25, max: 35 },
  baseball: { min: 35, max: 45 },
  softball: { min: 25, max: 35 },
  olympic_sports: { min: 15, max: 30 }
};
```

### Equipment Multipliers
```javascript
const EQUIPMENT_MULTIPLIERS = {
  football: 1.4,
  baseball: 1.2,
  softball: 1.2,
  basketball: 1.1,
  olympic_sports: 1.15 // average
};
```

## Rate Tables

### Aircraft Hourly Rates (2024)
```javascript
const AIRCRAFT_RATES = {
  embraer_145: 7000,    // ≤50 passengers
  boeing_737: 10000,    // ≤150 passengers  
  boeing_757: 15000,    // ≤180 passengers
  boeing_767: 18000     // ≤200+ passengers
};
```

### Bus Rate Factors
```javascript
const BUS_SIZE_FACTORS = {
  minibus: 0.7,    // ≤20 passengers
  standard: 1.0,   // 21-45 passengers
  large: 1.3       // 46-56 passengers
};
```

## Implementation Notes

- All rates should be updated quarterly
- Distance calculations use great-circle distance with road factor adjustments
- Equipment multipliers account for additional cargo space/weight requirements
- Crew expenses include lodging and meals for overnight trips

## Related Files

- [Distance Algorithms](distance-algorithms.md)
- [Variable Adjustments](../data/adjustment-factors.json)
- [Rate Updates](../data/current-rates.json)