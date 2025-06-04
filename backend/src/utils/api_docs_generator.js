/**
 * API Documentation Generator
 * 
 * Generates OpenAPI/Swagger documentation for the Context7-enhanced APIs
 * in the FlexTime system.
 */

const fs = require('fs');
const path = require('path');
const logger = require("../utils/logger");

/**
 * API Documentation Generator
 */
class ApiDocsGenerator {
  /**
   * Create a new API Documentation Generator
   * 
   * @param {Object} config - Configuration options
   */
  constructor(config = {}) {
    this.config = {
      title: 'FlexTime API Documentation',
      description: 'API documentation for the FlexTime scheduling system with Context7 enhancements',
      version: '1.0.0',
      outputPath: path.resolve(__dirname, '../api/docs'),
      apiBasePath: '/api',
      ...config
    };
    
    this.apiPaths = {};
    this.schemas = {};
    
    logger.info('API Documentation Generator created');
  }
  
  /**
   * Generate base OpenAPI specification
   * 
   * @returns {Object} Base OpenAPI specification
   */
  generateBaseSpec() {
    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        description: this.config.description,
        version: this.config.version,
        contact: {
          name: 'FlexTime Development Team'
        }
      },
      servers: [
        {
          url: this.config.apiBasePath,
          description: 'API Server'
        }
      ],
      paths: {},
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  }
  
  /**
   * Register API routes for documentation
   * 
   * @param {Object} routeDefinitions - Route definitions
   * @returns {ApiDocsGenerator} This instance for chaining
   */
  registerRoutes(routeDefinitions) {
    if (!routeDefinitions || typeof routeDefinitions !== 'object') {
      logger.warn('Invalid route definitions for API documentation');
      return this;
    }
    
    // Process each route definition
    Object.entries(routeDefinitions).forEach(([path, methods]) => {
      const routePath = path.startsWith('/') ? path : `/${path}`;
      
      if (!this.apiPaths[routePath]) {
        this.apiPaths[routePath] = {};
      }
      
      // Process each HTTP method for this path
      Object.entries(methods).forEach(([method, definition]) => {
        this.apiPaths[routePath][method.toLowerCase()] = {
          tags: definition.tags || ['default'],
          summary: definition.summary || '',
          description: definition.description || '',
          operationId: definition.operationId || `${method.toLowerCase()}${routePath.replace(/[\/\-{}]/g, '_')}`,
          parameters: definition.parameters || [],
          requestBody: definition.requestBody,
          responses: definition.responses || {
            '200': {
              description: 'Successful operation'
            },
            '400': {
              description: 'Bad request'
            },
            '500': {
              description: 'Internal server error'
            }
          },
          security: definition.security
        };
      });
    });
    
    return this;
  }
  
  /**
   * Register schemas for documentation
   * 
   * @param {Object} schemaDefinitions - Schema definitions
   * @returns {ApiDocsGenerator} This instance for chaining
   */
  registerSchemas(schemaDefinitions) {
    if (!schemaDefinitions || typeof schemaDefinitions !== 'object') {
      logger.warn('Invalid schema definitions for API documentation');
      return this;
    }
    
    // Process each schema definition
    Object.entries(schemaDefinitions).forEach(([name, schema]) => {
      this.schemas[name] = schema;
    });
    
    return this;
  }
  
  /**
   * Generate OpenAPI documentation
   * 
   * @returns {Object} OpenAPI specification
   */
  generateDocs() {
    // Create base specification
    const spec = this.generateBaseSpec();
    
    // Add paths
    spec.paths = this.apiPaths;
    
    // Add schemas
    spec.components.schemas = this.schemas;
    
    return spec;
  }
  
  /**
   * Save documentation to file
   * 
   * @param {string} [outputPath] - Optional path to save the documentation
   * @returns {boolean} Whether the save was successful
   */
  saveDocs(outputPath) {
    try {
      // Generate documentation
      const docs = this.generateDocs();
      
      // Determine output path
      const filePath = outputPath || path.join(this.config.outputPath, 'openapi.json');
      
      // Ensure directory exists
      const directory = path.dirname(filePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }
      
      // Write file
      fs.writeFileSync(filePath, JSON.stringify(docs, null, 2));
      
      logger.info(`API documentation saved to: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Failed to save API documentation: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Generate documentation for the Context7-enhanced API
   * 
   * @returns {boolean} Whether generation was successful
   */
  generateC7ApiDocs() {
    try {
      // Define route schemas
      this.registerSchemas({
        'NLQuery': {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query text'
            },
            context: {
              type: 'object',
              description: 'Additional context for the query',
              properties: {
                scheduleId: {
                  type: 'string',
                  description: 'ID of the schedule for context'
                }
              }
            }
          },
          required: ['query']
        },
        'NLQueryResponse': {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the query was successful'
            },
            response: {
              type: 'string',
              description: 'Natural language response'
            },
            confidence: {
              type: 'number',
              description: 'Confidence score of the response'
            },
            data: {
              type: 'object',
              description: 'Structured data related to the response'
            }
          }
        },
        'RecommendationRequest': {
          type: 'object',
          properties: {
            scheduleId: {
              type: 'string',
              description: 'ID of the schedule to generate recommendations for'
            },
            options: {
              type: 'object',
              description: 'Options for recommendation generation'
            }
          },
          required: ['scheduleId']
        },
        'RecommendationResponse': {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the recommendation generation was successful'
            },
            recommendations: {
              type: 'array',
              description: 'List of recommendations',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Recommendation ID'
                  },
                  type: {
                    type: 'string',
                    description: 'Recommendation type'
                  },
                  description: {
                    type: 'string',
                    description: 'Human-readable description'
                  },
                  changes: {
                    type: 'array',
                    description: 'Proposed changes',
                    items: {
                      type: 'object'
                    }
                  },
                  confidence: {
                    type: 'number',
                    description: 'Confidence score'
                  }
                }
              }
            }
          }
        },
        'ConflictResolutionRequest': {
          type: 'object',
          properties: {
            scheduleId: {
              type: 'string',
              description: 'ID of the schedule with conflicts'
            },
            conflicts: {
              type: 'array',
              description: 'List of conflicts to resolve',
              items: {
                type: 'object'
              }
            }
          },
          required: ['scheduleId']
        },
        'GraphQueryRequest': {
          type: 'object',
          properties: {
            query: {
              type: 'object',
              description: 'Knowledge graph query parameters'
            }
          },
          required: ['query']
        }
      });
      
      // Define API routes
      this.registerRoutes({
        // Natural Language Interface
        '/nl/query': {
          post: {
            tags: ['Natural Language'],
            summary: 'Process a natural language query',
            description: 'Process a natural language query about schedules and return a response',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/NLQuery'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Successful query',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/NLQueryResponse'
                    }
                  }
                }
              }
            },
            security: [{ bearerAuth: [] }]
          }
        },
        
        // Recommendation Engine
        '/recommendations/generate': {
          post: {
            tags: ['Recommendations'],
            summary: 'Generate schedule recommendations',
            description: 'Generate optimization recommendations for a schedule',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/RecommendationRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Recommendations generated',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/RecommendationResponse'
                    }
                  }
                }
              }
            },
            security: [{ bearerAuth: [] }]
          }
        },
        '/recommendations/conflicts/resolve': {
          post: {
            tags: ['Recommendations'],
            summary: 'Generate conflict resolutions',
            description: 'Generate recommendations to resolve schedule conflicts',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ConflictResolutionRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Conflict resolutions generated',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/RecommendationResponse'
                    }
                  }
                }
              }
            },
            security: [{ bearerAuth: [] }]
          }
        },
        
        // Knowledge Graph
        '/kg/query': {
          post: {
            tags: ['Knowledge Graph'],
            summary: 'Query the knowledge graph',
            description: 'Query the knowledge graph for entities and relationships',
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/GraphQueryRequest'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Query results',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: {
                          type: 'boolean'
                        },
                        results: {
                          type: 'array',
                          items: {
                            type: 'object'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            security: [{ bearerAuth: [] }]
          }
        },
        '/kg/entities/{entityType}': {
          get: {
            tags: ['Knowledge Graph'],
            summary: 'Get entities by type',
            description: 'Get all entities of a specific type from the knowledge graph',
            parameters: [
              {
                name: 'entityType',
                in: 'path',
                description: 'Type of entity to retrieve',
                required: true,
                schema: {
                  type: 'string'
                }
              }
            ],
            responses: {
              '200': {
                description: 'List of entities',
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        success: {
                          type: 'boolean'
                        },
                        entities: {
                          type: 'array',
                          items: {
                            type: 'object'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            security: [{ bearerAuth: [] }]
          }
        }
      });
      
      // Save the documentation
      this.saveDocs(path.join(this.config.outputPath, 'c7-api-docs.json'));
      
      logger.info('Generated Context7-enhanced API documentation');
      return true;
    } catch (error) {
      logger.error(`Failed to generate C7 API documentation: ${error.message}`);
      return false;
    }
  }
}

module.exports = ApiDocsGenerator;
