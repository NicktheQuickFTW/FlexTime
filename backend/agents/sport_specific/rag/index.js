/**
 * Sport-Specific RAG Agents
 * 
 * This module exports specialized Retrieval-Augmented Generation (RAG) agents
 * for various sports.
 */

const BaseSportRagAgent = require('./base_sport_rag_agent');
const MensBasketballRagAgent = require('./mens_basketball_rag_agent');
const WomensBasketballRagAgent = require('./womens_basketball_rag_agent');
const FootballRagAgent = require('./football_rag_agent');
const SoccerRagAgent = require('./soccer_rag_agent');
const WrestlingRagAgent = require('./wrestling_rag_agent');

// Add other sport-specific agents as they are implemented
// const VolleyballRagAgent = require('./volleyball_rag_agent');
// const BaseballRagAgent = require('./baseball_rag_agent');
// const SoftballRagAgent = require('./softball_rag_agent');
// const MensTennisRagAgent = require('./mens_tennis_rag_agent');
// const WomensTennisRagAgent = require('./womens_tennis_rag_agent');

module.exports = {
  BaseSportRagAgent,
  MensBasketballRagAgent,
  WomensBasketballRagAgent,
  FootballRagAgent,
  SoccerRagAgent,
  WrestlingRagAgent,
  // VolleyballRagAgent,
  // BaseballRagAgent, 
  // SoftballRagAgent,
  // MensTennisRagAgent,
  // WomensTennisRagAgent
};