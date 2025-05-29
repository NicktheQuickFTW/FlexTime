/**
 * Evolution Agents
 * 
 * This module exports agents responsible for platform evolution,
 * including analysis, insight generation, and new agent development.
 */

const BaseEvolutionAgent = require('./base_evolution_agent');
const PlatformAnalyzerAgent = require('./platform_analyzer_agent');
const AgentGeneratorAgent = require('./agent_generator_agent');

/**
 * Create a specific evolution agent
 * 
 * @param {string} evolutionType - Type of evolution agent to create
 * @param {Object} config - Agent configuration
 * @param {Object} mcpConnector - MCP connector for model interactions
 * @returns {BaseEvolutionAgent} Evolution agent instance
 */
function createEvolutionAgent(evolutionType, config, mcpConnector) {
  switch (evolutionType.toLowerCase()) {
    case 'platform_analyzer':
      return new PlatformAnalyzerAgent(config, mcpConnector);
      
    case 'agent_generator':
      return new AgentGeneratorAgent(config, mcpConnector);
      
    default:
      throw new Error(`Unsupported evolution type: ${evolutionType}`);
  }
}

module.exports = {
  BaseEvolutionAgent,
  PlatformAnalyzerAgent,
  AgentGeneratorAgent,
  createEvolutionAgent
};