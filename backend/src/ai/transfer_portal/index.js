/**
 * Transfer Portal Agents
 * 
 * This module exports all transfer portal agent implementations.
 */

const BaseTransferPortalAgent = require('./base_transfer_portal_agent');
const MensBasketballTransferPortalAgent = require('./mens_basketball_transfer_portal_agent');
const WomensBasketballTransferPortalAgent = require('./womens_basketball_transfer_portal_agent');
const FootballTransferPortalAgent = require('./football_transfer_portal_agent');
const WrestlingTransferPortalAgent = require('./wrestling_transfer_portal_agent');
const SoccerTransferPortalAgent = require('./soccer_transfer_portal_agent');

/**
 * Create a sport-specific transfer portal agent
 * 
 * @param {string} sportCode - Sport code (e.g., 'MBB', 'FBB', 'WBB', 'WRES', 'SOC', 'WSOC')
 * @param {Object} config - Agent configuration
 * @param {Object} mcpConnector - MCP connector for model interactions
 * @returns {BaseTransferPortalAgent} Sport-specific transfer portal agent
 */
function createTransferPortalAgent(sportCode, config, mcpConnector) {
  switch (sportCode.toUpperCase()) {
    case 'MBB':
      return new MensBasketballTransferPortalAgent(config, mcpConnector);
      
    case 'WBB':
      return new WomensBasketballTransferPortalAgent(config, mcpConnector);
      
    case 'FBB':
      return new FootballTransferPortalAgent(config, mcpConnector);
      
    case 'WRES':
      return new WrestlingTransferPortalAgent(config, mcpConnector);
      
    case 'SOC':
      return new SoccerTransferPortalAgent(config, mcpConnector, false);
      
    case 'WSOC':
      return new SoccerTransferPortalAgent(config, mcpConnector, true);
      
    default:
      throw new Error(`Unsupported sport code: ${sportCode}`);
  }
}

module.exports = {
  BaseTransferPortalAgent,
  MensBasketballTransferPortalAgent,
  WomensBasketballTransferPortalAgent,
  FootballTransferPortalAgent,
  WrestlingTransferPortalAgent,
  SoccerTransferPortalAgent,
  createTransferPortalAgent
};