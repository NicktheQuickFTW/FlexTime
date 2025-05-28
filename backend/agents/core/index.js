/**
 * FlexTime Agent System Core Index
 * 
 * This module provides the entry point for the refactored FlexTime agent system,
 * exposing the core components and maintaining backward compatibility.
 */

const AgentSystem = require('./agent_system');
const SchedulingAgentSystem = require('./scheduling_agent_system');
const AgentFactory = require('./agent_factory');

// Export the core components
module.exports = {
  AgentSystem,
  SchedulingAgentSystem,
  AgentFactory,
  
  // Factory method for creating a scheduling agent system
  createSchedulingAgentSystem: (config = {}) => {
    return new SchedulingAgentSystem(config);
  }
};
