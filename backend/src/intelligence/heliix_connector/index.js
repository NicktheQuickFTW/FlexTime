/**
 * HELiiX Connector Agents
 * 
 * This module exports agents that connect the FlexTime JavaScript agent system
 * with the HELiiX Intelligence Engine Python backend.
 */

const HELiiXIntelligenceConnectorAgent = require('./heliix_intelligence_connector_agent');

/**
 * Create a HELiiX Intelligence Connector Agent
 * 
 * @param {Object} config - Agent configuration
 * @param {Object} mcpConnector - MCP connector for model interactions
 * @returns {HELiiXIntelligenceConnectorAgent} Intelligence Connector agent instance
 */
function createIntelligenceConnectorAgent(config, mcpConnector) {
  return new HELiiXIntelligenceConnectorAgent(config, mcpConnector);
}

module.exports = {
  HELiiXIntelligenceConnectorAgent,
  createIntelligenceConnectorAgent
};