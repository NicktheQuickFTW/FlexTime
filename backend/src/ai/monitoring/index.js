/**
 * Monitoring Agents
 *
 * This module exports all monitoring agent implementations.
 */

const BaseMonitoringAgent = require('./base_monitoring_agent');
const DataIntegrityAgent = require('./data_integrity_agent');
const PerformanceMonitoringAgent = require('./performance_monitoring_agent');

/**
 * Create a specific monitoring agent
 *
 * @param {string} monitoringType - Type of monitoring agent to create
 * @param {Object} config - Agent configuration
 * @param {Object} mcpConnector - MCP connector for model interactions
 * @returns {BaseMonitoringAgent} Monitoring agent instance
 */
function createMonitoringAgent(monitoringType, config, mcpConnector) {
  switch (monitoringType.toLowerCase()) {
    case 'data_integrity':
      return new DataIntegrityAgent(config, mcpConnector);

    case 'performance':
      return new PerformanceMonitoringAgent(config, mcpConnector);

    default:
      throw new Error(`Unsupported monitoring type: ${monitoringType}`);
  }
}

module.exports = {
  BaseMonitoringAgent,
  DataIntegrityAgent,
  PerformanceMonitoringAgent,
  createMonitoringAgent
};