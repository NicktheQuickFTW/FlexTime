/**
 * FlexTime School Data RAG Agent
 * 
 * This agent uses Retrieval-Augmented Generation (RAG) to source and analyze
 * data from schools to assist with scheduling and analytics.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
const AIAdapter = require('../../adapters/ai-adapter');

class SchoolDataAgent {
  /**
   * Create a new School Data RAG Agent
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      dataDirectory: path.join(__dirname, '../../data/school_data'),
      cacheExpiration: 24 * 60 * 60 * 1000, // 24 hours
      modelName: 'claude-3-sonnet-20240229',
      embeddingModel: 'text-embedding-ada-002',
      searchResultLimit: 10,
      ...options
    };
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.options.dataDirectory)) {
      fs.mkdirSync(this.options.dataDirectory, { recursive: true });
    }
    
    // Initialize AI adapter
    this.ai = new AIAdapter();
    
    // Initialize data sources and vector store
    this.dataSources = {};
    this.vectorStore = {};
    this.dataCache = {};
    
    logger.info('School Data RAG Agent initialized');
  }
  
  /**
   * Initialize the agent with school data
   * @param {Array<Object>} schools - List of schools to initialize
   * @returns {Promise<boolean>} Success indicator
   */
  async initialize(schools) {
    try {
      logger.info(`Initializing School Data RAG Agent with ${schools.length} schools`);
      
      // Process each school
      for (const school of schools) {
        await this.addSchool(school);
      }
      
      logger.info('School Data RAG Agent initialization complete');
      return true;
    } catch (error) {
      logger.error(`Error initializing School Data RAG Agent: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Add a school to the agent
   * @param {Object} school - School to add
   * @returns {Promise<boolean>} Success indicator
   */
  async addSchool(school) {
    try {
      const schoolId = school.id || school.team_id;
      
      if (!schoolId) {
        throw new Error('School ID is required');
      }
      
      // Create school data structure
      this.dataSources[schoolId] = {
        id: schoolId,
        name: school.name || (school.institution ? school.institution.name : 'Unknown School'),
        data: {},
        lastUpdated: {}
      };
      
      // Create school data directory
      const schoolDir = path.join(this.options.dataDirectory, schoolId);
      if (!fs.existsSync(schoolDir)) {
        fs.mkdirSync(schoolDir, { recursive: true });
      }
      
      logger.info(`Added school: ${this.dataSources[schoolId].name}`);
      return true;
    } catch (error) {
      logger.error(`Error adding school: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Query school data
   * @param {string} query - Natural language query
   * @param {Array<string>} schoolIds - School IDs to query (optional)
   * @param {string} dataType - Data type to query (optional)
   * @returns {Promise<Object>} Query results
   */
  async query(query, schoolIds = [], dataType = null) {
    try {
      logger.info(`Querying school data: "${query}"`);
      
      // Validate schools
      let targetSchools = schoolIds;
      if (!targetSchools || targetSchools.length === 0) {
        targetSchools = Object.keys(this.dataSources);
      }
      
      if (targetSchools.length === 0) {
        throw new Error('No schools available for querying');
      }
      
      // Get vector embedding for query
      const queryEmbedding = await this._getEmbedding(query);
      
      // Search for relevant documents
      const searchResults = await this._searchDocuments(
        queryEmbedding, 
        targetSchools, 
        dataType
      );
      
      // Generate response with RAG
      const response = await this._generateResponse(query, searchResults);
      
      return {
        query,
        response,
        sources: searchResults.map(result => ({
          schoolId: result.schoolId,
          schoolName: this.dataSources[result.schoolId].name,
          dataType: result.dataType,
          relevance: result.similarity
        }))
      };
    } catch (error) {
      logger.error(`Error querying school data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Update school data from source
   * @param {string} schoolId - School ID
   * @param {string} dataType - Data type
   * @param {string} source - Data source URL or identifier
   * @returns {Promise<boolean>} Success indicator
   */
  async updateSchoolData(schoolId, dataType, source) {
    try {
      // Verify school exists
      if (!this.dataSources[schoolId]) {
        throw new Error(`School not found: ${schoolId}`);
      }
      
      logger.info(`Updating ${dataType} data for school ${schoolId} from ${source}`);
      
      // Fetch data from source
      let data;
      if (source.startsWith('http')) {
        // Web source
        const response = await axios.get(source);
        data = response.data;
      } else if (source.startsWith('file://')) {
        // Local file
        const filePath = source.replace('file://', '');
        data = await fs.promises.readFile(filePath, 'utf8');
        data = JSON.parse(data);
      } else {
        // Mock data for testing
        data = this._generateMockData(schoolId, dataType);
      }
      
      // Process and store data
      await this._processSchoolData(schoolId, dataType, data);
      
      // Update last updated timestamp
      this.dataSources[schoolId].lastUpdated[dataType] = new Date().toISOString();
      
      logger.info(`Successfully updated ${dataType} data for school ${schoolId}`);
      return true;
    } catch (error) {
      logger.error(`Error updating school data: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Process and store school data
   * @param {string} schoolId - School ID
   * @param {string} dataType - Data type
   * @param {Object} data - Data to process
   * @returns {Promise<void>}
   * @private
   */
  async _processSchoolData(schoolId, dataType, data) {
    try {
      // Store data
      this.dataSources[schoolId].data[dataType] = data;
      
      // Save to disk
      const dataDir = path.join(this.options.dataDirectory, schoolId);
      const dataPath = path.join(dataDir, `${dataType}.json`);
      
      await fs.promises.writeFile(
        dataPath,
        JSON.stringify(data, null, 2),
        'utf8'
      );
      
      // Process for vector store
      await this._indexDataForSearch(schoolId, dataType, data);
    } catch (error) {
      logger.error(`Error processing school data: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Index data for vector search
   * @param {string} schoolId - School ID
   * @param {string} dataType - Data type
   * @param {Object} data - Data to index
   * @returns {Promise<void>}
   * @private
   */
  async _indexDataForSearch(schoolId, dataType, data) {
    try {
      // Initialize vector store for school if needed
      if (!this.vectorStore[schoolId]) {
        this.vectorStore[schoolId] = {};
      }
      
      // Convert data to chunks for indexing
      const chunks = this._chunkData(data, dataType);
      
      // Get embeddings for chunks
      const embeddingPromises = chunks.map(chunk => 
        this._getEmbedding(chunk.text)
      );
      
      const embeddings = await Promise.all(embeddingPromises);
      
      // Create vector entries
      const vectors = chunks.map((chunk, i) => ({
        id: chunk.id,
        text: chunk.text,
        metadata: chunk.metadata,
        embedding: embeddings[i]
      }));
      
      // Store vectors
      this.vectorStore[schoolId][dataType] = vectors;
      
      logger.info(`Indexed ${vectors.length} chunks for ${schoolId} ${dataType}`);
    } catch (error) {
      logger.error(`Error indexing data for search: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Chunk data into searchable text segments
   * @param {Object} data - Data to chunk
   * @param {string} dataType - Data type
   * @returns {Array<Object>} Chunked data
   * @private
   */
  _chunkData(data, dataType) {
    const chunks = [];
    
    // Different chunking strategies based on data type
    switch (dataType) {
      case 'team_info':
        chunks.push({
          id: uuidv4(),
          text: `Team Information: ${JSON.stringify(data)}`,
          metadata: { type: 'team_info', section: 'overview' }
        });
        break;
        
      case 'schedule':
        // Chunk each game
        if (data.games && Array.isArray(data.games)) {
          for (let i = 0; i < data.games.length; i += 5) {
            const gameGroup = data.games.slice(i, i + 5);
            chunks.push({
              id: uuidv4(),
              text: `Schedule Games ${i+1}-${i+gameGroup.length}: ${JSON.stringify(gameGroup)}`,
              metadata: { type: 'schedule', section: `games_${i+1}` }
            });
          }
        }
        
        // Overall schedule info
        chunks.push({
          id: uuidv4(),
          text: `Schedule Overview: ${JSON.stringify({
            name: data.name,
            sport: data.sport,
            season: data.season,
            startDate: data.startDate,
            endDate: data.endDate
          })}`,
          metadata: { type: 'schedule', section: 'overview' }
        });
        break;
        
      case 'venue_availability':
        // Chunk by month
        const availabilityByMonth = {};
        
        if (data.availabilities && Array.isArray(data.availabilities)) {
          for (const availability of data.availabilities) {
            const date = new Date(availability.date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()+1}`;
            
            if (!availabilityByMonth[monthKey]) {
              availabilityByMonth[monthKey] = [];
            }
            
            availabilityByMonth[monthKey].push(availability);
          }
          
          for (const [month, availabilities] of Object.entries(availabilityByMonth)) {
            chunks.push({
              id: uuidv4(),
              text: `Venue Availability for ${month}: ${JSON.stringify(availabilities)}`,
              metadata: { type: 'venue_availability', section: month }
            });
          }
        }
        
        // Venue overview
        chunks.push({
          id: uuidv4(),
          text: `Venue Overview: ${JSON.stringify({
            venues: data.venues,
            defaultVenue: data.defaultVenue
          })}`,
          metadata: { type: 'venue_availability', section: 'overview' }
        });
        break;
        
      case 'constraints':
        // Chunk by constraint type
        const constraintsByType = {};
        
        if (data.constraints && Array.isArray(data.constraints)) {
          for (const constraint of data.constraints) {
            const type = constraint.type || 'general';
            
            if (!constraintsByType[type]) {
              constraintsByType[type] = [];
            }
            
            constraintsByType[type].push(constraint);
          }
          
          for (const [type, constraints] of Object.entries(constraintsByType)) {
            chunks.push({
              id: uuidv4(),
              text: `${type} Constraints: ${JSON.stringify(constraints)}`,
              metadata: { type: 'constraints', section: type }
            });
          }
        }
        
        // Constraints overview
        chunks.push({
          id: uuidv4(),
          text: `Constraints Overview: ${JSON.stringify({
            count: data.constraints ? data.constraints.length : 0,
            priority: data.priority,
            types: Object.keys(constraintsByType)
          })}`,
          metadata: { type: 'constraints', section: 'overview' }
        });
        break;
        
      case 'preferences':
        // Chunk by preference category
        for (const [category, preferences] of Object.entries(data)) {
          chunks.push({
            id: uuidv4(),
            text: `${category} Preferences: ${JSON.stringify(preferences)}`,
            metadata: { type: 'preferences', section: category }
          });
        }
        
        // Preferences overview
        chunks.push({
          id: uuidv4(),
          text: `Preferences Overview: ${JSON.stringify(Object.keys(data))}`,
          metadata: { type: 'preferences', section: 'overview' }
        });
        break;
        
      default:
        // Default chunking for unknown data types
        chunks.push({
          id: uuidv4(),
          text: `${dataType} Data: ${JSON.stringify(data)}`,
          metadata: { type: dataType, section: 'all' }
        });
    }
    
    return chunks;
  }
  
  /**
   * Get embedding for text
   * @param {string} text - Text to embed
   * @returns {Promise<Array<number>>} Embedding vector
   * @private
   */
  async _getEmbedding(text) {
    try {
      // Check cache
      const cacheKey = `embed_${text.substring(0, 100)}`;
      if (this.dataCache[cacheKey]) {
        return this.dataCache[cacheKey];
      }
      
      // Use AI adapter to get embedding
      const embedding = await this.ai.getEmbedding(text);
      
      // Cache the result
      this.dataCache[cacheKey] = embedding;
      
      return embedding;
    } catch (error) {
      logger.error(`Error getting embedding: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Search documents using vector similarity
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {Array<string>} schoolIds - School IDs to search
   * @param {string} dataType - Data type to filter by
   * @returns {Promise<Array<Object>>} Search results
   * @private
   */
  async _searchDocuments(queryEmbedding, schoolIds, dataType = null) {
    try {
      const results = [];
      
      // Search each school's vector store
      for (const schoolId of schoolIds) {
        // Skip if school doesn't exist
        if (!this.vectorStore[schoolId]) {
          continue;
        }
        
        // Determine which data types to search
        let dataTypes = Object.keys(this.vectorStore[schoolId]);
        if (dataType) {
          dataTypes = dataTypes.filter(dt => dt === dataType);
        }
        
        // Search each data type
        for (const dt of dataTypes) {
          const vectors = this.vectorStore[schoolId][dt];
          
          // Skip if no vectors
          if (!vectors || vectors.length === 0) {
            continue;
          }
          
          // Calculate similarity for each vector
          for (const vector of vectors) {
            const similarity = this._cosineSimilarity(queryEmbedding, vector.embedding);
            
            results.push({
              schoolId,
              dataType: dt,
              chunkId: vector.id,
              text: vector.text,
              metadata: vector.metadata,
              similarity
            });
          }
        }
      }
      
      // Sort by similarity (highest first)
      results.sort((a, b) => b.similarity - a.similarity);
      
      // Return top results
      return results.slice(0, this.options.searchResultLimit);
    } catch (error) {
      logger.error(`Error searching documents: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   * @param {Array<number>} vec1 - First vector
   * @param {Array<number>} vec2 - Second vector
   * @returns {number} Cosine similarity (-1 to 1)
   * @private
   */
  _cosineSimilarity(vec1, vec2) {
    try {
      if (vec1.length !== vec2.length) {
        throw new Error('Vectors must have the same length');
      }
      
      let dotProduct = 0;
      let mag1 = 0;
      let mag2 = 0;
      
      for (let i = 0; i < vec1.length; i++) {
        dotProduct += vec1[i] * vec2[i];
        mag1 += vec1[i] * vec1[i];
        mag2 += vec2[i] * vec2[i];
      }
      
      mag1 = Math.sqrt(mag1);
      mag2 = Math.sqrt(mag2);
      
      if (mag1 === 0 || mag2 === 0) {
        return 0;
      }
      
      return dotProduct / (mag1 * mag2);
    } catch (error) {
      logger.error(`Error calculating cosine similarity: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Generate response with RAG
   * @param {string} query - Original query
   * @param {Array<Object>} searchResults - Search results
   * @returns {Promise<string>} Generated response
   * @private
   */
  async _generateResponse(query, searchResults) {
    try {
      // Extract context from search results
      const context = searchResults.map(result => result.text).join('\n\n');
      
      // Prepare the prompt for the LLM
      const systemPrompt = `You are an AI assistant for college athletic scheduling. Your role is to answer questions about 
      team information, schedules, venue availability, constraints, and preferences based on the provided data.
      When responding:
      - Be concise and direct
      - Organize your response logically by data type if multiple types are present
      - Cite specific facts from the data
      - If the data doesn't contain an answer, say so clearly
      - Format numbers and dates clearly
      - Use bullet points for lists
      - Don't include internal metadata or IDs in your response`;
      
      // Construct a prompt with the retrieved context
      const userPrompt = `Question: ${query}\n\nRelevant Data (${searchResults.length} sources):\n${context}`;
      
      // Group results by school and data type for additional context
      const sourceInfo = {};
      for (const result of searchResults) {
        if (!sourceInfo[result.schoolId]) {
          sourceInfo[result.schoolId] = {
            name: this.dataSources[result.schoolId].name,
            dataTypes: new Set()
          };
        }
        sourceInfo[result.schoolId].dataTypes.add(result.dataType);
      }
      
      // Add source information to the prompt
      let sourceSummary = "Sources included:\n";
      for (const [schoolId, info] of Object.entries(sourceInfo)) {
        sourceSummary += `- ${info.name}: ${Array.from(info.dataTypes).join(', ')}\n`;
      }
      
      const assistantInstructions = `Based on the above data, please answer the question. Organize your answer logically,
      citing specific information from the provided data. If the data doesn't contain enough information to answer fully,
      acknowledge this limitation.
      
      ${sourceSummary}`;
      
      // Generate response using AI adapter
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: assistantInstructions }
      ];
      
      const response = await this.ai.generateText(messages, {
        temperature: 0.5, // Lower temperature for more factual responses
        max_tokens: 1024 // Reasonable length for a detailed response
      });
      
      // If no search results were found, add a note
      if (searchResults.length === 0) {
        return "I don't have enough information in my database to answer this question. Please try asking about team information, schedules, venue availability, constraints, or preferences.";
      }
      
      return response;
    } catch (error) {
      logger.error(`Error generating response: ${error.message}`);
      return `I couldn't generate a response due to an error: ${error.message}`;
    }
  }
  
  /**
   * Generate mock data for testing
   * @param {string} schoolId - School ID
   * @param {string} dataType - Data type
   * @returns {Object} Mock data
   * @private
   */
  _generateMockData(schoolId, dataType) {
    try {
      const schoolName = this.dataSources[schoolId].name;
      
      switch (dataType) {
        case 'team_info':
          return {
            id: schoolId,
            name: schoolName,
            mascot: `${schoolName} Wildcats`,
            colors: ['Blue', 'Gold'],
            sport: 'Basketball',
            conference: 'Big 12',
            division: 'Division I',
            coach: 'John Smith',
            homeVenue: 'Memorial Arena',
            capacity: 15000,
            location: {
              city: 'Springfield',
              state: 'IL',
              latitude: 39.78,
              longitude: -89.65
            }
          };
          
        case 'schedule':
          const games = [];
          const startDate = new Date('2025-11-01');
          
          // Generate 20 games
          for (let i = 0; i < 20; i++) {
            const gameDate = new Date(startDate);
            gameDate.setDate(gameDate.getDate() + i * 3 + Math.floor(Math.random() * 3));
            
            games.push({
              id: `game_${i}`,
              date: gameDate.toISOString(),
              homeTeam: i % 2 === 0 ? schoolName : `Opponent ${i}`,
              awayTeam: i % 2 === 0 ? `Opponent ${i}` : schoolName,
              venue: i % 2 === 0 ? 'Memorial Arena' : `Away Venue ${i}`,
              type: i < 5 ? 'Non-Conference' : 'Conference'
            });
          }
          
          return {
            id: `schedule_${schoolId}`,
            name: `${schoolName} 2025-2026 Schedule`,
            sport: 'Basketball',
            season: '2025-2026',
            startDate: startDate.toISOString(),
            endDate: new Date('2026-03-01').toISOString(),
            games
          };
          
        case 'venue_availability':
          const venues = [
            {
              id: 'venue_1',
              name: 'Memorial Arena',
              capacity: 15000,
              surface: 'Hardwood',
              isDefault: true
            },
            {
              id: 'venue_2',
              name: 'Practice Facility',
              capacity: 2000,
              surface: 'Hardwood',
              isDefault: false
            }
          ];
          
          const availabilities = [];
          const startDateVenue = new Date('2025-10-01');
          
          // Generate 60 days of availability
          for (let i = 0; i < 60; i++) {
            const date = new Date(startDateVenue);
            date.setDate(date.getDate() + i);
            
            // Example unavailability pattern
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isUnavailable = isWeekend && Math.random() < 0.7;
            
            if (isUnavailable) {
              availabilities.push({
                date: date.toISOString(),
                venueId: 'venue_1',
                isAvailable: false,
                reason: Math.random() < 0.5 ? 'Other Event' : 'Maintenance'
              });
            }
          }
          
          return {
            venues,
            defaultVenue: 'venue_1',
            availabilities
          };
          
        case 'constraints':
          return {
            priority: 'high',
            constraints: [
              {
                id: 'constraint_1',
                type: 'date',
                description: 'No games during final exams',
                startDate: '2025-12-10',
                endDate: '2025-12-20',
                severity: 'hard'
              },
              {
                id: 'constraint_2',
                type: 'venue',
                description: 'Memorial Arena unavailable',
                dates: ['2025-11-15', '2025-11-16'],
                venueId: 'venue_1',
                severity: 'hard'
              },
              {
                id: 'constraint_3',
                type: 'travel',
                description: 'Prefer no more than 2 consecutive away games',
                maxConsecutiveAwayGames: 2,
                severity: 'soft',
                weight: 0.8
              },
              {
                id: 'constraint_4',
                type: 'rest',
                description: 'At least 2 days between games',
                minRestDays: 2,
                severity: 'soft',
                weight: 0.9
              }
            ]
          };
          
        case 'preferences':
          return {
            scheduling: {
              preferredGameDays: ['Friday', 'Saturday'],
              preferredGameTimes: ['19:00', '20:00'],
              avoidDays: ['Sunday', 'Monday'],
              homeGameSpacing: 'Even throughout season',
              conferenceGamesStart: 'After December 15'
            },
            travel: {
              preferredTravelDays: ['Thursday', 'Friday'],
              maxConsecutiveRoadGames: 3,
              regionPreferences: 'Minimize cross-country travel',
              airportPreferences: ['Springfield Regional', 'Capital City International']
            },
            opponents: {
              preferredNonConferenceOpponents: ['Rival University', 'State College'],
              avoidedOpponents: ['Far Away University'],
              strengthOfOpponents: 'Balanced, with 2-3 top-25 teams'
            },
            venues: {
              preferredHomeVenue: 'Memorial Arena',
              alternateVenues: ['Practice Facility'],
              requirementsForVenue: 'Hardwood surface, minimum capacity 10,000'
            }
          };
          
        default:
          return {
            id: `${dataType}_${schoolId}`,
            name: `${schoolName} ${dataType}`,
            generatedAt: new Date().toISOString(),
            note: 'This is mock data for testing the School Data RAG Agent'
          };
      }
    } catch (error) {
      logger.error(`Error generating mock data: ${error.message}`);
      return { error: error.message };
    }
  }
  
  /**
   * Get all available data types for a school
   * @param {string} schoolId - School ID
   * @returns {Array<string>} Data types
   */
  getAvailableDataTypes(schoolId) {
    if (!this.dataSources[schoolId]) {
      return [];
    }
    
    return Object.keys(this.dataSources[schoolId].data);
  }
  
  /**
   * Get raw data for a school
   * @param {string} schoolId - School ID
   * @param {string} dataType - Data type
   * @returns {Object} Raw data
   */
  getRawData(schoolId, dataType) {
    if (!this.dataSources[schoolId] || !this.dataSources[schoolId].data[dataType]) {
      return null;
    }
    
    return this.dataSources[schoolId].data[dataType];
  }
  
  /**
   * Get all schools in the agent
   * @returns {Array<Object>} Schools
   */
  getSchools() {
    return Object.values(this.dataSources).map(source => ({
      id: source.id,
      name: source.name,
      dataTypes: Object.keys(source.data),
      lastUpdated: source.lastUpdated
    }));
  }
  
  /**
   * Get school by ID
   * @param {string} schoolId - School ID
   * @returns {Object} School info
   */
  getSchool(schoolId) {
    if (!this.dataSources[schoolId]) {
      return null;
    }
    
    const source = this.dataSources[schoolId];
    return {
      id: source.id,
      name: source.name,
      dataTypes: Object.keys(source.data),
      lastUpdated: source.lastUpdated
    };
  }
  
  /**
   * Delete school data
   * @param {string} schoolId - School ID
   * @param {string} dataType - Data type
   * @returns {boolean} Success indicator
   */
  deleteSchoolData(schoolId, dataType) {
    try {
      if (!this.dataSources[schoolId]) {
        return false;
      }
      
      // Remove from memory
      if (this.dataSources[schoolId].data[dataType]) {
        delete this.dataSources[schoolId].data[dataType];
      }
      
      if (this.dataSources[schoolId].lastUpdated[dataType]) {
        delete this.dataSources[schoolId].lastUpdated[dataType];
      }
      
      if (this.vectorStore[schoolId] && this.vectorStore[schoolId][dataType]) {
        delete this.vectorStore[schoolId][dataType];
      }
      
      // Remove from disk
      const dataPath = path.join(
        this.options.dataDirectory,
        schoolId,
        `${dataType}.json`
      );
      
      if (fs.existsSync(dataPath)) {
        fs.unlinkSync(dataPath);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error deleting school data: ${error.message}`);
      return false;
    }
  }
}

module.exports = SchoolDataAgent;