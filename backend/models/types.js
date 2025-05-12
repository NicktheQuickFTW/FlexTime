/**
 * FlexTime Scheduling System - Type Definitions
 * 
 * This file contains the enumerations and type definitions used throughout
 * the FlexTime scheduling system.
 */

// Sport types supported by the scheduling system
const SportType = {
  FOOTBALL: 'Football',
  MENS_BASKETBALL: 'Men\'s Basketball',
  WOMENS_BASKETBALL: 'Women\'s Basketball',
  VOLLEYBALL: 'Volleyball',
  BASEBALL: 'Baseball',
  SOFTBALL: 'Softball',
  SOCCER: 'Soccer',
  MENS_TENNIS: 'Men\'s Tennis',
  WOMENS_TENNIS: 'Women\'s Tennis',
  WRESTLING: 'Wrestling',
  GYMNASTICS: 'Gymnastics',
  LACROSSE: 'Lacrosse'
};

// Constraint types for scheduling rules
const ConstraintType = {
  HARD: 'Hard', // Must be satisfied
  SOFT: 'Soft'  // Preference, can be violated with penalty
};

// Categories of scheduling constraints
const ConstraintCategory = {
  TRAVEL: 'Travel',
  REST: 'Rest',
  VENUE: 'Venue',
  BROADCAST: 'Broadcast',
  COMPETITIVE: 'Competitive',
  ACADEMIC: 'Academic',
  CUSTOM: 'Custom'
};

module.exports = {
  SportType,
  ConstraintType,
  ConstraintCategory
};
