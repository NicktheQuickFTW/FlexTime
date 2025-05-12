/**
 * Big 12 Teams Database Model
 * 
 * This module defines the MongoDB schema for Big 12 conference teams
 * and provides methods for accessing and managing team data.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;
const { LocationSchema } = require('./db-venue');

/**
 * Schema for Big 12 teams
 */
const Big12TeamSchema = new Schema({
  teamId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  nickname: {
    type: String,
    required: true
  },
  primaryVenueId: {
    type: String,
    required: true,
    ref: 'Venue'
  },
  location: {
    type: LocationSchema,
    required: true
  },
  conference: {
    type: String,
    default: 'Big 12'
  },
  division: {
    type: String,
    default: null
  },
  colors: {
    primary: String,
    secondary: String
  },
  logo: {
    type: String
  },
  website: {
    type: String
  },
  active: {
    type: Boolean,
    default: true
  },
  metadata: {
    type: Map,
    of: Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
Big12TeamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

/**
 * Convert database model to Team object
 */
Big12TeamSchema.methods.toTeamObject = function() {
  const Team = require('./team');
  const Venue = require('./venue');
  const Location = require('./location');
  
  // Create location object
  const location = new Location(
    this.location.name,
    this.location.city,
    this.location.state,
    this.location.latitude,
    this.location.longitude
  );
  
  // Create venue object (primary venue will be populated separately)
  const venue = new Venue(
    this.primaryVenueId,
    `${this.name} Stadium`,
    location,
    25000 // Default capacity
  );
  
  // Create team object
  return new Team(
    this.teamId,
    this.name,
    this.nickname,
    venue,
    location,
    this.conference
  );
};

/**
 * Static method to get all Big 12 teams
 */
Big12TeamSchema.statics.getAllTeams = async function() {
  const teams = await this.find({ active: true }).sort('name');
  return teams;
};

/**
 * Static method to get teams by sport
 */
Big12TeamSchema.statics.getTeamsBySport = async function(sport) {
  const teams = await this.find({ 
    active: true,
    [`metadata.sports.${sport}`]: { $exists: true }
  }).sort('name');
  
  return teams;
};

// Create and export the model
const Big12Team = mongoose.model('Big12Team', Big12TeamSchema);
module.exports = Big12Team;
