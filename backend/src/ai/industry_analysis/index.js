/**
 * Industry Analysis Module
 * 
 * This module exports agents responsible for analyzing sports industry trends,
 * regulations, and emerging technologies.
 */

const IndustryAnalysisAgent = require('./industry_analysis_agent');

/**
 * Create an industry analysis agent
 * 
 * @param {Object} config - Agent configuration
 * @param {Object} mcpConnector - MCP connector for model interactions
 * @returns {IndustryAnalysisAgent} Industry analysis agent instance
 */
function createIndustryAnalysisAgent(config, mcpConnector) {
  return new IndustryAnalysisAgent(config, mcpConnector);
}

module.exports = {
  IndustryAnalysisAgent,
  createIndustryAnalysisAgent
};