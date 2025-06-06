/**
 * Knowledge Graph Model for FlexTime
 * 
 * This module provides the core graph data structure for the Knowledge Graph Agent,
 * supporting entity and relationship management with persistence capabilities.
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require("../../lib/logger");;

/**
 * Graph Model class
 * Implements a property graph model for knowledge representation
 */
class GraphModel {
  /**
   * Create a new Graph Model
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      persist: process.env.PERSIST_KNOWLEDGE_GRAPH !== 'false',
      persistPath: process.env.KNOWLEDGE_GRAPH_PATH || './data/knowledge_graph',
      persistInterval: parseInt(process.env.KNOWLEDGE_GRAPH_PERSIST_INTERVAL || '300000', 10), // 5 minutes
      ...config
    };
    
    // Initialize graph storage
    this.nodes = new Map(); // Map of node ID -> node object
    this.relationships = new Map(); // Map of relationship ID -> relationship object
    this.nodeIndices = new Map(); // Map of node type -> Map of property -> Set of node IDs
    this.relationshipIndices = new Map(); // Map of relationship type -> Map of property -> Set of relationship IDs
    
    // Track changes for persistence
    this.changedSinceLastPersist = false;
    this.persistTimer = null;
    
    logger.info(`Graph Model initialized (persistence: ${this.config.persist})`);
  }
  
  /**
   * Initialize the graph model
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      // Load persisted data if available and persistence is enabled
      if (this.config.persist) {
        await this._ensurePersistDirectory();
        await this._loadPersistedData();
        
        // Set up persistence timer
        this.persistTimer = setInterval(() => {
          if (this.changedSinceLastPersist) {
            this._persistData().catch(error => {
              logger.error(`Failed to persist graph data: ${error.message}`);
            });
          }
        }, this.config.persistInterval);
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Graph Model: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Ensure the persistence directory exists
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _ensurePersistDirectory() {
    try {
      if (!fs.existsSync(this.config.persistPath)) {
        fs.mkdirSync(this.config.persistPath, { recursive: true });
        logger.info(`Created persistence directory: ${this.config.persistPath}`);
      }
    } catch (error) {
      logger.error(`Failed to create persistence directory: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Load persisted graph data
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _loadPersistedData() {
    try {
      const nodesPath = path.join(this.config.persistPath, 'nodes.json');
      const relationshipsPath = path.join(this.config.persistPath, 'relationships.json');
      
      // Load nodes if file exists
      if (fs.existsSync(nodesPath)) {
        const nodesData = JSON.parse(fs.readFileSync(nodesPath, 'utf8'));
        
        for (const [id, node] of Object.entries(nodesData)) {
          this.nodes.set(id, node);
          this._indexNode(node);
        }
        
        logger.info(`Loaded ${this.nodes.size} nodes from persistence`);
      }
      
      // Load relationships if file exists
      if (fs.existsSync(relationshipsPath)) {
        const relationshipsData = JSON.parse(fs.readFileSync(relationshipsPath, 'utf8'));
        
        for (const [id, relationship] of Object.entries(relationshipsData)) {
          this.relationships.set(id, relationship);
          this._indexRelationship(relationship);
        }
        
        logger.info(`Loaded ${this.relationships.size} relationships from persistence`);
      }
      
      this.changedSinceLastPersist = false;
    } catch (error) {
      logger.error(`Failed to load persisted graph data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Persist graph data to disk
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _persistData() {
    try {
      if (!this.config.persist) {
        return;
      }
      
      const nodesPath = path.join(this.config.persistPath, 'nodes.json');
      const relationshipsPath = path.join(this.config.persistPath, 'relationships.json');
      
      // Convert Maps to Objects for serialization
      const nodesObject = Object.fromEntries(this.nodes);
      const relationshipsObject = Object.fromEntries(this.relationships);
      
      // Write to temporary files then rename to avoid partial writes
      const nodesTempPath = `${nodesPath}.tmp`;
      const relationshipsTempPath = `${relationshipsPath}.tmp`;
      
      fs.writeFileSync(nodesTempPath, JSON.stringify(nodesObject));
      fs.writeFileSync(relationshipsTempPath, JSON.stringify(relationshipsObject));
      
      fs.renameSync(nodesTempPath, nodesPath);
      fs.renameSync(relationshipsTempPath, relationshipsPath);
      
      this.changedSinceLastPersist = false;
      logger.debug(`Persisted graph data (${this.nodes.size} nodes, ${this.relationships.size} relationships)`);
    } catch (error) {
      logger.error(`Failed to persist graph data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Index a node for faster lookups
   * 
   * @private
   * @param {Object} node - Node to index
   */
  _indexNode(node) {
    const { type, properties } = node;
    
    // Create index for node type if it doesn't exist
    if (!this.nodeIndices.has(type)) {
      this.nodeIndices.set(type, new Map());
    }
    
    const typeIndex = this.nodeIndices.get(type);
    
    // Index each property
    for (const [key, value] of Object.entries(properties)) {
      if (!typeIndex.has(key)) {
        typeIndex.set(key, new Map());
      }
      
      const propertyIndex = typeIndex.get(key);
      const stringValue = String(value);
      
      if (!propertyIndex.has(stringValue)) {
        propertyIndex.set(stringValue, new Set());
      }
      
      propertyIndex.get(stringValue).add(node.id);
    }
  }
  
  /**
   * Index a relationship for faster lookups
   * 
   * @private
   * @param {Object} relationship - Relationship to index
   */
  _indexRelationship(relationship) {
    const { type, properties } = relationship;
    
    // Create index for relationship type if it doesn't exist
    if (!this.relationshipIndices.has(type)) {
      this.relationshipIndices.set(type, new Map());
    }
    
    const typeIndex = this.relationshipIndices.get(type);
    
    // Index each property
    for (const [key, value] of Object.entries(properties)) {
      if (!typeIndex.has(key)) {
        typeIndex.set(key, new Map());
      }
      
      const propertyIndex = typeIndex.get(key);
      const stringValue = String(value);
      
      if (!propertyIndex.has(stringValue)) {
        propertyIndex.set(stringValue, new Set());
      }
      
      propertyIndex.get(stringValue).add(relationship.id);
    }
  }
  
  /**
   * Add a node to the graph
   * 
   * @param {string} type - Node type
   * @param {Object} properties - Node properties
   * @returns {Object} Created node
   */
  addNode(type, properties = {}) {
    // Generate a UUID if id is not provided
    const id = properties.id || uuidv4();
    
    // Create node object
    const node = {
      id,
      type,
      properties: { ...properties, id },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to nodes map
    this.nodes.set(id, node);
    
    // Index the node
    this._indexNode(node);
    
    // Mark as changed for persistence
    this.changedSinceLastPersist = true;
    
    return node;
  }
  
  /**
   * Add a relationship between nodes
   * 
   * @param {string} sourceId - Source node ID
   * @param {string} type - Relationship type
   * @param {string} targetId - Target node ID
   * @param {Object} properties - Relationship properties
   * @returns {Object} Created relationship
   */
  addRelationship(sourceId, type, targetId, properties = {}) {
    // Validate that nodes exist
    if (!this.nodes.has(sourceId)) {
      throw new Error(`Source node ${sourceId} does not exist`);
    }
    
    if (!this.nodes.has(targetId)) {
      throw new Error(`Target node ${targetId} does not exist`);
    }
    
    // Generate relationship ID
    const id = uuidv4();
    
    // Create relationship object
    const relationship = {
      id,
      type,
      sourceId,
      targetId,
      properties,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to relationships map
    this.relationships.set(id, relationship);
    
    // Index the relationship
    this._indexRelationship(relationship);
    
    // Mark as changed for persistence
    this.changedSinceLastPersist = true;
    
    return relationship;
  }
  
  /**
   * Get a node by ID
   * 
   * @param {string} id - Node ID
   * @returns {Object|null} Node or null if not found
   */
  getNode(id) {
    return this.nodes.get(id) || null;
  }
  
  /**
   * Get a relationship by ID
   * 
   * @param {string} id - Relationship ID
   * @returns {Object|null} Relationship or null if not found
   */
  getRelationship(id) {
    return this.relationships.get(id) || null;
  }
  
  /**
   * Find nodes by type and property values
   * 
   * @param {string} type - Node type
   * @param {Object} properties - Property values to match
   * @returns {Array} Matching nodes
   */
  findNodes(type, properties = {}) {
    // Check if we have an index for this type
    if (!this.nodeIndices.has(type)) {
      return [];
    }
    
    const typeIndex = this.nodeIndices.get(type);
    
    // If no properties specified, return all nodes of this type
    if (Object.keys(properties).length === 0) {
      return Array.from(this.nodes.values())
        .filter(node => node.type === type);
    }
    
    // Find node IDs that match all properties
    let matchingIds = null;
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip if we don't have an index for this property
      if (!typeIndex.has(key)) {
        return [];
      }
      
      const propertyIndex = typeIndex.get(key);
      const stringValue = String(value);
      
      // Skip if we don't have a value for this property
      if (!propertyIndex.has(stringValue)) {
        return [];
      }
      
      const ids = propertyIndex.get(stringValue);
      
      // Initialize matchingIds with the first property's matches
      if (matchingIds === null) {
        matchingIds = new Set(ids);
      } else {
        // Intersect with subsequent properties' matches
        matchingIds = new Set(
          [...matchingIds].filter(id => ids.has(id))
        );
      }
      
      // Short-circuit if no matches
      if (matchingIds.size === 0) {
        return [];
      }
    }
    
    // Convert matching IDs to nodes
    return Array.from(matchingIds)
      .map(id => this.nodes.get(id))
      .filter(Boolean);
  }
  
  /**
   * Find relationships by type and property values
   * 
   * @param {string} type - Relationship type
   * @param {Object} properties - Property values to match
   * @returns {Array} Matching relationships
   */
  findRelationships(type, properties = {}) {
    // Check if we have an index for this type
    if (!this.relationshipIndices.has(type)) {
      return [];
    }
    
    const typeIndex = this.relationshipIndices.get(type);
    
    // If no properties specified, return all relationships of this type
    if (Object.keys(properties).length === 0) {
      return Array.from(this.relationships.values())
        .filter(relationship => relationship.type === type);
    }
    
    // Find relationship IDs that match all properties
    let matchingIds = null;
    
    for (const [key, value] of Object.entries(properties)) {
      // Skip if we don't have an index for this property
      if (!typeIndex.has(key)) {
        return [];
      }
      
      const propertyIndex = typeIndex.get(key);
      const stringValue = String(value);
      
      // Skip if we don't have a value for this property
      if (!propertyIndex.has(stringValue)) {
        return [];
      }
      
      const ids = propertyIndex.get(stringValue);
      
      // Initialize matchingIds with the first property's matches
      if (matchingIds === null) {
        matchingIds = new Set(ids);
      } else {
        // Intersect with subsequent properties' matches
        matchingIds = new Set(
          [...matchingIds].filter(id => ids.has(id))
        );
      }
      
      // Short-circuit if no matches
      if (matchingIds.size === 0) {
        return [];
      }
    }
    
    // Convert matching IDs to relationships
    return Array.from(matchingIds)
      .map(id => this.relationships.get(id))
      .filter(Boolean);
  }
  
  /**
   * Find relationships that connect to a node
   * 
   * @param {string} nodeId - Node ID
   * @param {Object} options - Search options
   * @returns {Object} Connected relationships
   */
  findConnectedRelationships(nodeId, options = {}) {
    const {
      direction = 'both', // 'outgoing', 'incoming', or 'both'
      types = null, // null for any type, or array of relationship types
      properties = {} // property filters
    } = options;
    
    // Find outgoing relationships
    const outgoing = direction === 'outgoing' || direction === 'both'
      ? Array.from(this.relationships.values()).filter(rel => {
          if (rel.sourceId !== nodeId) return false;
          if (types && !types.includes(rel.type)) return false;
          
          // Check properties
          for (const [key, value] of Object.entries(properties)) {
            if (rel.properties[key] !== value) return false;
          }
          
          return true;
        })
      : [];
    
    // Find incoming relationships
    const incoming = direction === 'incoming' || direction === 'both'
      ? Array.from(this.relationships.values()).filter(rel => {
          if (rel.targetId !== nodeId) return false;
          if (types && !types.includes(rel.type)) return false;
          
          // Check properties
          for (const [key, value] of Object.entries(properties)) {
            if (rel.properties[key] !== value) return false;
          }
          
          return true;
        })
      : [];
    
    return { outgoing, incoming };
  }
  
  /**
   * Execute a traversal from a starting node
   * 
   * @param {string} startNodeId - Starting node ID
   * @param {Object} options - Traversal options
   * @returns {Object} Traversal results
   */
  traverseFrom(startNodeId, options = {}) {
    const {
      maxDepth = 3,
      direction = 'outgoing',
      relationshipTypes = null,
      nodeTypes = null,
      uniqueNodes = true,
      includeStartNode = true
    } = options;
    
    // Check that start node exists
    if (!this.nodes.has(startNodeId)) {
      throw new Error(`Start node ${startNodeId} does not exist`);
    }
    
    // Initialize traversal data
    const visited = new Set();
    const result = {
      nodes: [],
      relationships: [],
      paths: []
    };
    
    // Queue of nodes to visit: [nodeId, depth, path]
    const queue = [[startNodeId, 0, []]];
    
    // Include start node if requested
    if (includeStartNode) {
      const startNode = this.nodes.get(startNodeId);
      result.nodes.push(startNode);
    }
    
    // Process queue
    while (queue.length > 0) {
      const [currentId, depth, path] = queue.shift();
      
      // Skip if we've seen this node and want unique nodes
      if (uniqueNodes && visited.has(currentId)) {
        continue;
      }
      
      // Mark as visited
      visited.add(currentId);
      
      // Stop if we've reached max depth
      if (depth >= maxDepth) {
        continue;
      }
      
      // Find connected relationships
      const { outgoing, incoming } = this.findConnectedRelationships(currentId, {
        direction,
        types: relationshipTypes
      });
      
      // Process relationships based on direction
      const relationships = direction === 'outgoing' ? outgoing
        : direction === 'incoming' ? incoming
        : [...outgoing, ...incoming];
      
      // Add each relationship and connected node
      for (const rel of relationships) {
        // Add relationship to results
        result.relationships.push(rel);
        
        // Determine connected node ID based on direction
        const connectedId = direction === 'incoming' ? rel.sourceId
          : direction === 'outgoing' ? rel.targetId
          : rel.sourceId === currentId ? rel.targetId : rel.sourceId;
        
        // Skip if we've seen this node and want unique nodes
        if (uniqueNodes && visited.has(connectedId)) {
          continue;
        }
        
        // Get connected node
        const connectedNode = this.nodes.get(connectedId);
        
        // Skip if node doesn't match filter
        if (nodeTypes && !nodeTypes.includes(connectedNode.type)) {
          continue;
        }
        
        // Add node to results
        result.nodes.push(connectedNode);
        
        // Add path
        const newPath = [...path, rel.id, connectedId];
        result.paths.push(newPath);
        
        // Add to queue
        queue.push([connectedId, depth + 1, newPath]);
      }
    }
    
    return result;
  }
  
  /**
   * Export the entire graph or a subgraph
   * 
   * @param {Array<string>} nodeTypes - Node types to include (null for all)
   * @param {string} startNodeId - Optional starting node for subgraph
   * @returns {Object} Exported graph data
   */
  export(nodeTypes = null, startNodeId = null) {
    // Filter nodes by type
    const filteredNodes = nodeTypes
      ? Array.from(this.nodes.values()).filter(node => nodeTypes.includes(node.type))
      : Array.from(this.nodes.values());
    
    // Get node IDs
    const nodeIds = new Set(filteredNodes.map(node => node.id));
    
    // Filter relationships that connect to included nodes
    const filteredRelationships = Array.from(this.relationships.values())
      .filter(rel => nodeIds.has(rel.sourceId) && nodeIds.has(rel.targetId));
    
    // If start node provided, extract subgraph
    if (startNodeId) {
      // Traverse from start node
      const { nodes, relationships } = this.traverseFrom(startNodeId, {
        maxDepth: 10,
        direction: 'both',
        nodeTypes,
        uniqueNodes: true
      });
      
      return {
        nodes,
        relationships,
        exportedAt: new Date().toISOString()
      };
    }
    
    // Return full (filtered) graph
    return {
      nodes: filteredNodes,
      relationships: filteredRelationships,
      exportedAt: new Date().toISOString()
    };
  }
  
  /**
   * Export a specific subgraph centered around a node
   * 
   * @param {Array<string>} nodeTypes - Node types to include
   * @param {string} centerId - Center node ID
   * @returns {Object} Exported subgraph
   */
  exportSubgraph(nodeTypes, centerId) {
    return this.export(nodeTypes, centerId);
  }
  
  /**
   * Clear the graph
   * 
   * @returns {boolean} Whether clear was successful
   */
  clear() {
    this.nodes.clear();
    this.relationships.clear();
    this.nodeIndices.clear();
    this.relationshipIndices.clear();
    
    this.changedSinceLastPersist = true;
    
    return true;
  }
  
  /**
   * Shutdown the graph model
   * 
   * @returns {Promise<boolean>} Whether shutdown was successful
   */
  async shutdown() {
    try {
      // Clear persistence timer
      if (this.persistTimer) {
        clearInterval(this.persistTimer);
        this.persistTimer = null;
      }
      
      // Persist data if changed
      if (this.config.persist && this.changedSinceLastPersist) {
        await this._persistData();
      }
      
      return true;
    } catch (error) {
      logger.error(`Failed to shutdown Graph Model: ${error.message}`);
      return false;
    }
  }
}

module.exports = { GraphModel };
