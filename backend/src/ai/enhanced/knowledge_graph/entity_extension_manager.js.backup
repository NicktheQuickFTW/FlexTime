/**
 * Entity Extension Manager for Knowledge Graph
 * 
 * This module provides tools for extending the Knowledge Graph with new entity types,
 * relationship types, and schema definitions, enabling the Knowledge Graph to evolve
 * over time with new capabilities.
 */

const logger = require("../utils/logger");
// FlexTime AI client
// const { createFlexTimeClient } = require('../../../utils/flextime_ai_client');

/**
 * Entity Extension Manager for Knowledge Graph
 */
class EntityExtensionManager {
  /**
   * Create a new Entity Extension Manager
   * 
   * @param {Object} config - Configuration options
   * @param {Object} knowledgeGraphAgent - Knowledge Graph Agent instance
   */
  constructor(knowledgeGraphAgent, config = {}) {
    this.knowledgeGraphAgent = knowledgeGraphAgent;
    // FlexTime AI client
    this.flexTimeClient = null;
    
    this.config = {
      allowDynamicExtension: process.env.ALLOW_DYNAMIC_KG_EXTENSION === 'true',
      validateNewEntities: true,
      ...config
    };
    
    // Standard entity types with their schemas
    this.standardEntityTypes = {
      team: {
        properties: {
          name: { type: 'string', required: true },
          sportType: { type: 'string', required: true },
          conference: { type: 'string' },
          location: { type: 'string' },
          abbreviation: { type: 'string' }
        }
      },
      venue: {
        properties: {
          name: { type: 'string', required: true },
          location: { type: 'string' },
          capacity: { type: 'number' },
          indoorOutdoor: { type: 'string', enum: ['indoor', 'outdoor', 'both'] },
          sportTypes: { type: 'array', items: { type: 'string' } }
        }
      },
      game: {
        properties: {
          date: { type: 'string', format: 'date', required: true },
          startTime: { type: 'string', format: 'time' },
          endTime: { type: 'string', format: 'time' },
          homeTeam: { type: 'string', required: true },
          awayTeam: { type: 'string', required: true },
          venue: { type: 'string' }
        }
      },
      schedule: {
        properties: {
          name: { type: 'string', required: true },
          season: { type: 'string' },
          sportType: { type: 'string', required: true },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      constraint: {
        properties: {
          type: { type: 'string', required: true },
          target: { type: 'string', required: true },
          rule: { type: 'string', required: true },
          parameters: { type: 'object' }
        }
      }
    };
    
    // Standard relationship types with their schemas
    this.standardRelationshipTypes = {
      contains: {
        sourceTypes: ['schedule'],
        targetTypes: ['game'],
        properties: {}
      },
      plays_at: {
        sourceTypes: ['team'],
        targetTypes: ['venue'],
        properties: {
          isHomeVenue: { type: 'boolean' }
        }
      },
      hosts: {
        sourceTypes: ['venue'],
        targetTypes: ['game'],
        properties: {}
      },
      participates_in: {
        sourceTypes: ['team'],
        targetTypes: ['game'],
        properties: {
          isHome: { type: 'boolean', required: true }
        }
      },
      constrains: {
        sourceTypes: ['constraint'],
        targetTypes: ['team', 'venue', 'game', 'schedule'],
        properties: {}
      },
      belongs_to: {
        sourceTypes: ['team'],
        targetTypes: ['conference'],
        properties: {}
      }
    };
    
    // Custom entity types (will be populated at runtime)
    this.customEntityTypes = {};
    
    // Custom relationship types (will be populated at runtime)
    this.customRelationshipTypes = {};
    
    logger.info('Entity Extension Manager created');
  }
  
  /**
   * Initialize the Entity Extension Manager
   * 
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize() {
    try {
      logger.info('Initializing Entity Extension Manager');
      
      // Load any persisted custom entity/relationship types
      await this._loadCustomTypes();
      
      logger.info('Entity Extension Manager initialized');
      return true;
    } catch (error) {
      logger.error(`Failed to initialize Entity Extension Manager: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Register a new entity type
   * 
   * @param {string} entityType - Name of the entity type
   * @param {Object} schema - Schema definition for the entity type
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Whether registration was successful
   */
  async registerEntityType(entityType, schema, options = {}) {
    try {
      if (!entityType || typeof entityType !== 'string') {
        throw new Error('Entity type name must be a string');
      }
      
      // Check if entity type already exists
      if (this.standardEntityTypes[entityType] || this.customEntityTypes[entityType]) {
        throw new Error(`Entity type "${entityType}" already exists`);
      }
      
      // Validate schema
      if (!schema || typeof schema !== 'object' || !schema.properties) {
        throw new Error('Invalid schema definition');
      }
      
      // Enrich schema with FlexTime AI if available and enabled
      let enrichedSchema = schema;
      if (this.flexTimeClient && options.enrichWithFlexTimeAI !== false) {
        enrichedSchema = await this._enrichSchemaWithFlexTimeAI(entityType, schema);
      }
      
      // Register with Knowledge Graph Agent if available
      if (this.knowledgeGraphAgent && typeof this.knowledgeGraphAgent.registerEntityType === 'function') {
        await this.knowledgeGraphAgent.registerEntityType(entityType, enrichedSchema);
      }
      
      // Store in custom types
      this.customEntityTypes[entityType] = enrichedSchema;
      
      // Persist changes if requested
      if (options.persist !== false) {
        await this._persistCustomTypes();
      }
      
      logger.info(`Registered new entity type: ${entityType}`);
      return true;
    } catch (error) {
      logger.error(`Failed to register entity type "${entityType}": ${error.message}`);
      return false;
    }
  }
  
  /**
   * Register a new relationship type
   * 
   * @param {string} relationshipType - Name of the relationship type
   * @param {Object} schema - Schema definition for the relationship type
   * @param {Object} options - Additional options
   * @returns {Promise<boolean>} Whether registration was successful
   */
  async registerRelationshipType(relationshipType, schema, options = {}) {
    try {
      if (!relationshipType || typeof relationshipType !== 'string') {
        throw new Error('Relationship type name must be a string');
      }
      
      // Check if relationship type already exists
      if (this.standardRelationshipTypes[relationshipType] || this.customRelationshipTypes[relationshipType]) {
        throw new Error(`Relationship type "${relationshipType}" already exists`);
      }
      
      // Validate schema
      if (!schema || typeof schema !== 'object') {
        throw new Error('Invalid schema definition');
      }
      
      if (!Array.isArray(schema.sourceTypes) || schema.sourceTypes.length === 0) {
        throw new Error('Relationship schema must define sourceTypes array');
      }
      
      if (!Array.isArray(schema.targetTypes) || schema.targetTypes.length === 0) {
        throw new Error('Relationship schema must define targetTypes array');
      }
      
      // Validate that referenced entity types exist
      for (const entityType of [...schema.sourceTypes, ...schema.targetTypes]) {
        if (!this.entityTypeExists(entityType)) {
          throw new Error(`Referenced entity type "${entityType}" does not exist`);
        }
      }
      
      // Enrich schema with FlexTime AI if available and enabled
      let enrichedSchema = schema;
      if (this.flexTimeClient && options.enrichWithFlexTimeAI !== false) {
        enrichedSchema = await this._enrichSchemaWithFlexTimeAI(relationshipType, schema, true);
      }
      
      // Register with Knowledge Graph Agent if available
      if (this.knowledgeGraphAgent && typeof this.knowledgeGraphAgent.registerRelationshipType === 'function') {
        await this.knowledgeGraphAgent.registerRelationshipType(relationshipType, enrichedSchema);
      }
      
      // Store in custom types
      this.customRelationshipTypes[relationshipType] = enrichedSchema;
      
      // Persist changes if requested
      if (options.persist !== false) {
        await this._persistCustomTypes();
      }
      
      logger.info(`Registered new relationship type: ${relationshipType}`);
      return true;
    } catch (error) {
      logger.error(`Failed to register relationship type "${relationshipType}": ${error.message}`);
      return false;
    }
  }
  
  /**
   * Check if an entity type exists
   * 
   * @param {string} entityType - Name of the entity type
   * @returns {boolean} Whether the entity type exists
   */
  entityTypeExists(entityType) {
    return Boolean(
      this.standardEntityTypes[entityType] || 
      this.customEntityTypes[entityType]
    );
  }
  
  /**
   * Check if a relationship type exists
   * 
   * @param {string} relationshipType - Name of the relationship type
   * @returns {boolean} Whether the relationship type exists
   */
  relationshipTypeExists(relationshipType) {
    return Boolean(
      this.standardRelationshipTypes[relationshipType] || 
      this.customRelationshipTypes[relationshipType]
    );
  }
  
  /**
   * Get all entity types
   * 
   * @param {Object} options - Options for filtering
   * @returns {Object} Map of entity types to their schemas
   */
  getAllEntityTypes(options = {}) {
    const result = {};
    
    // Include standard types if not excluded
    if (options.standardOnly !== false) {
      Object.entries(this.standardEntityTypes).forEach(([key, value]) => {
        result[key] = value;
      });
    }
    
    // Include custom types if not excluded
    if (options.customOnly !== false) {
      Object.entries(this.customEntityTypes).forEach(([key, value]) => {
        result[key] = value;
      });
    }
    
    return result;
  }
  
  /**
   * Get all relationship types
   * 
   * @param {Object} options - Options for filtering
   * @returns {Object} Map of relationship types to their schemas
   */
  getAllRelationshipTypes(options = {}) {
    const result = {};
    
    // Include standard types if not excluded
    if (options.standardOnly !== false) {
      Object.entries(this.standardRelationshipTypes).forEach(([key, value]) => {
        result[key] = value;
      });
    }
    
    // Include custom types if not excluded
    if (options.customOnly !== false) {
      Object.entries(this.customRelationshipTypes).forEach(([key, value]) => {
        result[key] = value;
      });
    }
    
    return result;
  }
  
  /**
   * Get schema for an entity type
   * 
   * @param {string} entityType - Name of the entity type
   * @returns {Object|null} Schema for the entity type or null if not found
   */
  getEntityTypeSchema(entityType) {
    return this.standardEntityTypes[entityType] || 
           this.customEntityTypes[entityType] || 
           null;
  }
  
  /**
   * Get schema for a relationship type
   * 
   * @param {string} relationshipType - Name of the relationship type
   * @returns {Object|null} Schema for the relationship type or null if not found
   */
  getRelationshipTypeSchema(relationshipType) {
    return this.standardRelationshipTypes[relationshipType] || 
           this.customRelationshipTypes[relationshipType] || 
           null;
  }
  
  /**
   * Validate an entity against its schema
   * 
   * @param {string} entityType - Type of the entity
   * @param {Object} entityData - Entity data to validate
   * @returns {Object} Validation result with success and errors
   */
  validateEntity(entityType, entityData) {
    try {
      const schema = this.getEntityTypeSchema(entityType);
      
      if (!schema) {
        return {
          success: false,
          errors: [`Unknown entity type: ${entityType}`]
        };
      }
      
      const errors = [];
      
      // Check required properties
      Object.entries(schema.properties).forEach(([propName, propSchema]) => {
        if (propSchema.required && (entityData[propName] === undefined || entityData[propName] === null)) {
          errors.push(`Missing required property: ${propName}`);
          return;
        }
        
        if (entityData[propName] !== undefined && entityData[propName] !== null) {
          // Type validation
          if (propSchema.type === 'string' && typeof entityData[propName] !== 'string') {
            errors.push(`Property ${propName} must be a string`);
          } else if (propSchema.type === 'number' && typeof entityData[propName] !== 'number') {
            errors.push(`Property ${propName} must be a number`);
          } else if (propSchema.type === 'boolean' && typeof entityData[propName] !== 'boolean') {
            errors.push(`Property ${propName} must be a boolean`);
          } else if (propSchema.type === 'array' && !Array.isArray(entityData[propName])) {
            errors.push(`Property ${propName} must be an array`);
          } else if (propSchema.type === 'object' && (typeof entityData[propName] !== 'object' || entityData[propName] === null)) {
            errors.push(`Property ${propName} must be an object`);
          }
          
          // Enum validation
          if (propSchema.enum && !propSchema.enum.includes(entityData[propName])) {
            errors.push(`Property ${propName} must be one of: ${propSchema.enum.join(', ')}`);
          }
          
          // Format validation (basic)
          if (propSchema.format === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(entityData[propName])) {
            errors.push(`Property ${propName} must be a valid date in YYYY-MM-DD format`);
          } else if (propSchema.format === 'time' && !/^\d{2}:\d{2}(:\d{2})?$/.test(entityData[propName])) {
            errors.push(`Property ${propName} must be a valid time in HH:MM:SS or HH:MM format`);
          } else if (propSchema.format === 'date-time' && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(entityData[propName])) {
            errors.push(`Property ${propName} must be a valid ISO date-time`);
          }
        }
      });
      
      return {
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }
  
  /**
   * Validate a relationship against its schema
   * 
   * @param {string} relationshipType - Type of the relationship
   * @param {Object} relationshipData - Relationship data to validate
   * @returns {Object} Validation result with success and errors
   */
  validateRelationship(relationshipType, relationshipData) {
    try {
      const schema = this.getRelationshipTypeSchema(relationshipType);
      
      if (!schema) {
        return {
          success: false,
          errors: [`Unknown relationship type: ${relationshipType}`]
        };
      }
      
      const errors = [];
      
      // Check source and target entities
      if (!relationshipData.source) {
        errors.push('Missing source entity');
      }
      
      if (!relationshipData.target) {
        errors.push('Missing target entity');
      }
      
      if (relationshipData.source && relationshipData.sourceType) {
        if (!schema.sourceTypes.includes(relationshipData.sourceType)) {
          errors.push(`Invalid source type: ${relationshipData.sourceType}. Must be one of: ${schema.sourceTypes.join(', ')}`);
        }
      }
      
      if (relationshipData.target && relationshipData.targetType) {
        if (!schema.targetTypes.includes(relationshipData.targetType)) {
          errors.push(`Invalid target type: ${relationshipData.targetType}. Must be one of: ${schema.targetTypes.join(', ')}`);
        }
      }
      
      // Check required properties
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([propName, propSchema]) => {
          if (propSchema.required && (relationshipData[propName] === undefined || relationshipData[propName] === null)) {
            errors.push(`Missing required property: ${propName}`);
          }
        });
      }
      
      return {
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }
  
  /**
   * Load custom entity and relationship types from persistent storage
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _loadCustomTypes() {
    try {
      if (!this.knowledgeGraphAgent || typeof this.knowledgeGraphAgent.loadCustomTypes !== 'function') {
        return;
      }
      
      const customTypes = await this.knowledgeGraphAgent.loadCustomTypes();
      
      if (customTypes && customTypes.entityTypes) {
        this.customEntityTypes = customTypes.entityTypes;
      }
      
      if (customTypes && customTypes.relationshipTypes) {
        this.customRelationshipTypes = customTypes.relationshipTypes;
      }
      
      logger.info(`Loaded ${Object.keys(this.customEntityTypes).length} custom entity types and ${Object.keys(this.customRelationshipTypes).length} custom relationship types`);
    } catch (error) {
      logger.error(`Failed to load custom types: ${error.message}`);
    }
  }
  
  /**
   * Persist custom entity and relationship types to storage
   * 
   * @private
   * @returns {Promise<void>}
   */
  async _persistCustomTypes() {
    try {
      if (!this.knowledgeGraphAgent || typeof this.knowledgeGraphAgent.saveCustomTypes !== 'function') {
        return;
      }
      
      await this.knowledgeGraphAgent.saveCustomTypes({
        entityTypes: this.customEntityTypes,
        relationshipTypes: this.customRelationshipTypes
      });
      
      logger.info('Persisted custom entity and relationship types');
    } catch (error) {
      logger.error(`Failed to persist custom types: ${error.message}`);
    }
  }
  
  /**
   * Enrich schema with FlexTime AI insights
   * 
   * @private
   * @param {string} typeName - Entity or relationship type name
   * @param {Object} schema - Original schema
   * @param {boolean} isRelationship - Whether this is a relationship schema
   * @returns {Promise<Object>} Enriched schema
   */
  async _enrichSchemaWithFlexTimeAI(typeName, schema, isRelationship = false) {
    try {
      if (!this.flexTimeClient || !this.flexTimeClient.enabled) {
        return schema;
      }
      
      // Create a deep copy of the schema
      const enrichedSchema = JSON.parse(JSON.stringify(schema));
      
      // Process the schema with FlexTime AI
      const result = await this.flexTimeClient.processTask({
        task: 'enrich_schema',
        parameters: {
          typeName,
          schema,
          isRelationship
        }
      });
      
      if (!result.success || !result.enrichedSchema) {
        logger.warn(`FlexTime AI schema enrichment failed for ${typeName}`);
        return schema;
      }
      
      logger.info(`Enriched schema for ${typeName} with FlexTime AI`);
      return result.enrichedSchema;
    } catch (error) {
      logger.error(`Failed to enrich schema with FlexTime AI: ${error.message}`);
      return schema;
    }
  }
  
  /**
   * Generate a new entity type based on example data
   * 
   * @param {string} entityTypeName - Name for the new entity type
   * @param {Array<Object>} examples - Example entity data
   * @param {Object} options - Options for generation
   * @returns {Promise<Object>} Generated schema
   */
  async generateEntityTypeFromExamples(entityTypeName, examples, options = {}) {
    try {
      if (!Array.isArray(examples) || examples.length === 0) {
        throw new Error('Examples must be a non-empty array');
      }
      
      // If FlexTime AI is available, use it for generation
      if (this.flexTimeClient && this.flexTimeClient.enabled) {
        const result = await this.flexTimeClient.processTask({
          task: 'generate_schema_from_examples',
          parameters: {
            typeName: entityTypeName,
            examples,
            isRelationship: false,
            options
          }
        });
        
        if (result.success && result.schema) {
          // Register the new entity type
          if (options.autoRegister !== false) {
            await this.registerEntityType(entityTypeName, result.schema, {
              enrichWithFlexTimeAI: false, // Already enriched by FlexTime AI
              persist: options.persist
            });
          }
          
          return result.schema;
        }
      }
      
      // Fallback to basic schema generation
      const schema = this._generateBasicSchemaFromExamples(examples);
      
      // Register the new entity type
      if (options.autoRegister !== false) {
        await this.registerEntityType(entityTypeName, schema, {
          persist: options.persist
        });
      }
      
      return schema;
    } catch (error) {
      logger.error(`Failed to generate entity type from examples: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate basic schema from examples
   * 
   * @private
   * @param {Array<Object>} examples - Example data
   * @returns {Object} Generated schema
   */
  _generateBasicSchemaFromExamples(examples) {
    const properties = {};
    const firstExample = examples[0];
    
    // Analyze first example for property types
    Object.entries(firstExample).forEach(([key, value]) => {
      let type = typeof value;
      
      if (Array.isArray(value)) {
        type = 'array';
      } else if (value === null) {
        type = 'null';
      }
      
      properties[key] = { type };
      
      // Set required for non-null primitives in the first example
      if (value !== null && value !== undefined && type !== 'object' && type !== 'array') {
        properties[key].required = true;
      }
    });
    
    // Check other examples to refine schema
    for (let i = 1; i < examples.length; i++) {
      const example = examples[i];
      
      // Check each property in the schema
      Object.keys(properties).forEach(key => {
        // If property is missing or null in this example, it's not required
        if (example[key] === undefined || example[key] === null) {
          if (properties[key].required) {
            delete properties[key].required;
          }
        }
        
        // Check if type is consistent
        if (example[key] !== undefined && example[key] !== null) {
          const exampleType = Array.isArray(example[key]) ? 'array' : typeof example[key];
          
          if (properties[key].type !== exampleType) {
            // Type mismatch, use more generic type or union
            properties[key].type = 'mixed';
          }
        }
      });
      
      // Check for properties in this example that aren't in the schema
      Object.keys(example).forEach(key => {
        if (!properties[key]) {
          const value = example[key];
          let type = typeof value;
          
          if (Array.isArray(value)) {
            type = 'array';
          } else if (value === null) {
            type = 'null';
          }
          
          properties[key] = { type };
        }
      });
    }
    
    return {
      properties
    };
  }
}

module.exports = EntityExtensionManager;
