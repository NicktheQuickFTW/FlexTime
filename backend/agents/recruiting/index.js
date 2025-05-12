/**
 * Recruiting Agents
 * 
 * This module exports all recruiting agent implementations.
 */

const BaseRecruitingAgent = require('./base_recruiting_agent');
const MensBasketballRecruitingAgent = require('./mens_basketball_recruiting_agent');
const WomensBasketballRecruitingAgent = require('./womens_basketball_recruiting_agent');
const FootballRecruitingAgent = require('./football_recruiting_agent');
const WrestlingRecruitingAgent = require('./wrestling_recruiting_agent');

/**
 * Create a sport-specific recruiting agent
 * 
 * @param {string} sportCode - Sport code (e.g., 'MBB', 'FBB', 'WBB', 'WRES')
 * @param {Object} config - Agent configuration
 * @param {Object} mcpConnector - MCP connector for model interactions
 * @returns {BaseRecruitingAgent} Sport-specific recruiting agent
 */
function createRecruitingAgent(sportCode, config, mcpConnector) {
  switch (sportCode.toUpperCase()) {
    case 'MBB':
      return new MensBasketballRecruitingAgent(config, mcpConnector);
      
    case 'WBB':
      return new WomensBasketballRecruitingAgent(config, mcpConnector);
      
    case 'FBB':
      return new FootballRecruitingAgent(config, mcpConnector);
      
    case 'WRES':
      return new WrestlingRecruitingAgent(config, mcpConnector);
      
    default:
      throw new Error(`Unsupported sport code: ${sportCode}`);
  }
}

module.exports = {
  BaseRecruitingAgent,
  MensBasketballRecruitingAgent,
  WomensBasketballRecruitingAgent,
  FootballRecruitingAgent,
  WrestlingRecruitingAgent,
  createRecruitingAgent
};