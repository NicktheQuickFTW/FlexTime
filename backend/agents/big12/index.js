/**
 * Big12 Agent System
 * 
 * This module exports the Big12 agent classes for use in the FlexTime multi-agent system.
 */

const Big12DirectorAgent = require('./big12_director_agent');
const Big12RagAgent = require('./big12_rag_agent');
const Big12ValidationAgent = require('./big12_validation_agent');

module.exports = {
  Big12DirectorAgent,
  Big12RagAgent,
  Big12ValidationAgent
};