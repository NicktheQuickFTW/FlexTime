/**
 * Big 12 Director Agent
 * 
 * This agent acts as the orchestrator for the entire Big 12 data pipeline.
 * It coordinates the RAG agent and validation agent, implements feedback loops,
 * tracks performance metrics, and ensures continuous improvement through learning.
 */

const Agent = require('../agent');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const logger = require('../scripts/logger");
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

class Big12DirectorAgent extends Agent {
  /**
   * Initialize a new Big12DirectorAgent.
   * 
   * @param {object} config - Configuration object
   * @param {object} mcpConnector - MCP connector for LLM interaction
   */
  constructor(config, mcpConnector) {
    super('big12_director', 'director', mcpConnector);
    
    this.config = config;
    this.neonConnection = config.neonConnection || process.env.NEON_DB_CONNECTION_STRING;
    this.currentUser = null;
    this.dbClient = null;
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    
    // Will store references to subordinate agents
    this.ragAgent = null;
    this.validationAgent = null;
    
    logger.info('Big12DirectorAgent initialized');
  }
  
  /**
   * Start the agent and initialize necessary systems
   */
  async start() {
    try {
      await this.connectToNeonDB();
      await this.initializeMemorySystem();
      await super.start();
      
      logger.info(`Big12DirectorAgent started with connection to Neon DB as user ${this.currentUser}`);
    } catch (error) {
      logger.error(`Error starting Big12DirectorAgent: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Stop the agent and cleanup resources
   */
  async stop() {
    try {
      if (this.dbClient) {
        await this.dbClient.end();
        this.dbClient = null;
      }
      
      await super.stop();
      logger.info('Big12DirectorAgent stopped');
    } catch (error) {
      logger.error(`Error stopping Big12DirectorAgent: ${error.message}`);
    }
  }
  
  /**
   * Connect to the Neon DB
   */
  async connectToNeonDB() {
    this.dbClient = new Client(this.neonConnection);
    await this.dbClient.connect();
    
    // Get the current user
    const userResult = await this.dbClient.query('SELECT current_user;');
    this.currentUser = userResult.rows[0].current_user;
    
    // Set the search path to use the user's schema
    await this.dbClient.query(`SET search_path TO ${this.currentUser}, public;`);
    
    logger.info(`Connected to Neon DB as user ${this.currentUser}`);
  }
  
  /**
   * Initialize the agent memory system
   */
  async initializeMemorySystem() {
    try {
      // Create a table for storing agent memory if it doesn't exist
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.currentUser}.agent_memory (
          memory_id SERIAL PRIMARY KEY,
          agent_name VARCHAR(50) NOT NULL,
          memory_type VARCHAR(50) NOT NULL,
          memory_key VARCHAR(255) NOT NULL,
          memory_value JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          access_count INTEGER DEFAULT 0,
          UNIQUE(agent_name, memory_type, memory_key)
        );
      `);
      
      // Create a table for storing agent performance metrics
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.currentUser}.agent_metrics (
          metric_id SERIAL PRIMARY KEY,
          agent_name VARCHAR(50) NOT NULL,
          run_id VARCHAR(50) NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          status VARCHAR(20),
          success_rate FLOAT,
          error_count INTEGER DEFAULT 0,
          items_processed INTEGER DEFAULT 0,
          metrics JSONB,
          UNIQUE(agent_name, run_id)
        );
      `);
      
      // Create a table for storing agent feedback
      await this.dbClient.query(`
        CREATE TABLE IF NOT EXISTS ${this.currentUser}.agent_feedback (
          feedback_id SERIAL PRIMARY KEY,
          from_agent VARCHAR(50) NOT NULL,
          to_agent VARCHAR(50) NOT NULL,
          feedback_type VARCHAR(50) NOT NULL,
          feedback_content TEXT NOT NULL,
          related_data JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(20) DEFAULT 'pending',
          resolution TEXT
        );
      `);
      
      logger.info('Agent memory system initialized successfully');
    } catch (error) {
      logger.error(`Error initializing memory system: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Store a memory for an agent
   */
  async storeAgentMemory(agentName, memoryType, memoryKey, memoryValue) {
    try {
      await this.dbClient.query(`
        INSERT INTO ${this.currentUser}.agent_memory 
          (agent_name, memory_type, memory_key, memory_value)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (agent_name, memory_type, memory_key)
        DO UPDATE SET 
          memory_value = $4,
          updated_at = CURRENT_TIMESTAMP,
          access_count = ${this.currentUser}.agent_memory.access_count + 1;
      `, [agentName, memoryType, memoryKey, JSON.stringify(memoryValue)]);
      
      logger.info(`Stored memory for ${agentName}: ${memoryType}/${memoryKey}`);
    } catch (error) {
      logger.error(`Error storing memory for ${agentName}: ${error.message}`);
    }
  }
  
  /**
   * Retrieve a memory for an agent
   */
  async retrieveAgentMemory(agentName, memoryType, memoryKey) {
    try {
      const result = await this.dbClient.query(`
        UPDATE ${this.currentUser}.agent_memory
        SET access_count = access_count + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE agent_name = $1 AND memory_type = $2 AND memory_key = $3
        RETURNING memory_value;
      `, [agentName, memoryType, memoryKey]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0].memory_value;
    } catch (error) {
      logger.error(`Error retrieving memory for ${agentName}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Start a new agent run and record metrics
   */
  async startAgentRun(agentName) {
    try {
      const runId = `${agentName}-${Date.now()}`;
      
      await this.dbClient.query(`
        INSERT INTO ${this.currentUser}.agent_metrics 
          (agent_name, run_id, start_time, status)
        VALUES ($1, $2, CURRENT_TIMESTAMP, 'running');
      `, [agentName, runId]);
      
      logger.info(`Started run ${runId} for ${agentName}`);
      return runId;
    } catch (error) {
      logger.error(`Error starting run for ${agentName}: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Complete an agent run and update metrics
   */
  async completeAgentRun(agentName, runId, status, metrics) {
    try {
      await this.dbClient.query(`
        UPDATE ${this.currentUser}.agent_metrics
        SET 
          end_time = CURRENT_TIMESTAMP,
          status = $3,
          success_rate = $4,
          error_count = $5,
          items_processed = $6,
          metrics = $7
        WHERE agent_name = $1 AND run_id = $2;
      `, [
        agentName, 
        runId, 
        status, 
        metrics.successRate || 0, 
        metrics.errorCount || 0, 
        metrics.itemsProcessed || 0, 
        JSON.stringify(metrics)
      ]);
      
      logger.info(`Completed run ${runId} for ${agentName} with status ${status}`);
    } catch (error) {
      logger.error(`Error completing run for ${agentName}: ${error.message}`);
    }
  }
  
  /**
   * Record feedback between agents
   */
  async recordAgentFeedback(fromAgent, toAgent, feedbackType, content, relatedData) {
    try {
      await this.dbClient.query(`
        INSERT INTO ${this.currentUser}.agent_feedback 
          (from_agent, to_agent, feedback_type, feedback_content, related_data)
        VALUES ($1, $2, $3, $4, $5);
      `, [fromAgent, toAgent, feedbackType, content, JSON.stringify(relatedData)]);
      
      logger.info(`Recorded ${feedbackType} feedback from ${fromAgent} to ${toAgent}`);
    } catch (error) {
      logger.error(`Error recording feedback: ${error.message}`);
    }
  }
  
  /**
   * Process feedback and learn from it
   */
  async processFeedback(agentName) {
    try {
      // Get pending feedback for this agent
      const result = await this.dbClient.query(`
        SELECT * FROM ${this.currentUser}.agent_feedback
        WHERE to_agent = $1 AND status = 'pending'
        ORDER BY created_at;
      `, [agentName]);
      
      if (result.rows.length === 0) {
        logger.info(`No pending feedback for ${agentName}`);
        return;
      }
      
      logger.info(`Processing ${result.rows.length} feedback items for ${agentName}`);
      
      for (const feedback of result.rows) {
        // Use Claude to analyze the feedback and generate learning
        const response = await this.anthropic.messages.create({
          model: "claude-3-opus-20240229",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are the learning component of an AI agent named ${agentName}. 
              You've received feedback from another agent named ${feedback.from_agent}.
              
              Feedback type: ${feedback.feedback_type}
              Feedback content: ${feedback.feedback_content}
              
              Related data: ${JSON.stringify(feedback.related_data, null, 2)}
              
              Please analyze this feedback and:
              1. Determine what can be learned from it
              2. Suggest specific improvements to the agent's behavior
              3. Identify any patterns if this feedback is similar to previous feedback
              4. Provide a concise resolution that can be stored in the system
              
              Format your response as a JSON object with the following structure:
              {
                "learning_points": [list of strings],
                "improvement_suggestions": [list of strings],
                "patterns_identified": [list of strings] or null,
                "resolution": "concise summary of what was learned and how it will be applied"
              }`
            }
          ],
          temperature: 0.2,
        });
        
        // Parse the learning
        const learning = JSON.parse(response.content[0].text);
        
        // Store the learning as a memory
        await this.storeAgentMemory(
          agentName, 
          'learning', 
          `feedback-${feedback.feedback_id}`, 
          learning
        );
        
        // Update the feedback status
        await this.dbClient.query(`
          UPDATE ${this.currentUser}.agent_feedback
          SET status = 'processed', resolution = $1
          WHERE feedback_id = $2;
        `, [learning.resolution, feedback.feedback_id]);
        
        logger.info(`Processed feedback ${feedback.feedback_id} for ${agentName}`);
      }
    } catch (error) {
      logger.error(`Error processing feedback for ${agentName}: ${error.message}`);
    }
  }
  
  /**
   * Generate a comprehensive report of the entire pipeline run
   */
  async generatePipelineReport(ragResults, validationResults) {
    try {
      // Use Claude to generate a comprehensive report
      const response = await this.anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are the reporting component of a Big 12 data pipeline director agent.
            
            Generate a comprehensive report on the latest pipeline run with the following data:
            
            RAG Agent Results:
            ${JSON.stringify(ragResults, null, 2)}
            
            Validation Agent Results:
            ${JSON.stringify(validationResults, null, 2)}
            
            Include the following sections:
            1. Executive Summary
            2. Data Collection Statistics
            3. Data Quality Assessment
            4. Issues Requiring Attention
            5. Improvement Recommendations
            6. Next Steps
            
            Format the report in Markdown.`
          }
        ],
        temperature: 0.2,
      });
      
      const report = response.content[0].text;
      
      // Save the report to a file
      const reportDir = path.join(__dirname, '../../reports');
      
      // Create reports directory if it doesn't exist
      try {
        await fs.mkdir(reportDir, { recursive: true });
      } catch (error) {
        // Ignore if directory already exists
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportPath = path.join(reportDir, `pipeline-report-${timestamp}.md`);
      
      await fs.writeFile(reportPath, report);
      
      logger.info(`Generated pipeline report at ${reportPath}`);
      return reportPath;
    } catch (error) {
      logger.error(`Error generating pipeline report: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Process a task.
   * Implements the abstract method from the base Agent class.
   * 
   * @param {object} task - The task to process
   * @returns {Promise<any>} Task result
   */
  async _processTask(task) {
    logger.info(`Processing task ${task.taskId}: ${task.description}`);
    
    switch (task.taskType) {
      case 'run_pipeline':
        return await this.runPipeline(task.parameters);
      
      case 'process_feedback':
        return await this.processFeedback(task.parameters.agentName);
      
      case 'generate_report':
        return await this.generatePipelineReport(
          task.parameters.ragResults,
          task.parameters.validationResults
        );
      
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }
  }
  
  /**
   * Run the entire data pipeline with RAG and validation
   */
  async runPipeline(parameters = {}) {
    logger.info('Starting Big 12 data pipeline...');
    
    try {
      // Run the RAG agent with feedback loop
      const ragAgentName = 'rag-agent';
      const ragRunId = await this.startAgentRun(ragAgentName);
      
      // Process any pending feedback before running
      await this.processFeedback(ragAgentName);
      
      // Create subtask for RAG agent
      const ragTask = this.createTask(
        'run_rag_agent',
        'Collect schedule data from Big 12 institutions',
        parameters
      );
      
      // Delegate task to RAG agent (we'd need a proper RAG agent class for this)
      // For now, we'll use the direct function call
      const { runRagAgent } = require('../../scripts/big12-rag-agent');
      const ragResults = await runRagAgent();
      
      // Store the results as a memory
      await this.storeAgentMemory(
        ragAgentName, 
        'run_results', 
        ragRunId, 
        ragResults
      );
      
      // Complete the run with metrics
      await this.completeAgentRun(
        ragAgentName, 
        ragRunId, 
        'completed', 
        {
          successRate: ragResults.successRate || 100,
          errorCount: ragResults.errorCount || 0,
          itemsProcessed: ragResults.itemsProcessed || 0
        }
      );
      
      // Run the validation agent with feedback loop
      const validationAgentName = 'validation-agent';
      const validationRunId = await this.startAgentRun(validationAgentName);
      
      // Process any pending feedback before running
      await this.processFeedback(validationAgentName);
      
      // Create subtask for validation agent
      const validationTask = this.createTask(
        'run_validation_agent',
        'Validate collected Big 12 schedule data',
        { ragResults, ...parameters }
      );
      
      // Delegate task to validation agent (we'd need a proper validation agent class for this)
      // For now, we'll use the direct function call
      const { runValidationAgent } = require('../../scripts/big12-validation-agent');
      const validationResults = await runValidationAgent();
      
      // Store the results as a memory
      await this.storeAgentMemory(
        validationAgentName, 
        'run_results', 
        validationRunId, 
        validationResults
      );
      
      // Complete the run with metrics
      await this.completeAgentRun(
        validationAgentName, 
        validationRunId, 
        'completed', 
        {
          successRate: validationResults.successRate || 100,
          errorCount: validationResults.errorCount || 0,
          itemsProcessed: validationResults.itemsProcessed || 0
        }
      );
      
      // Provide feedback to the RAG agent based on validation results
      if (validationResults && validationResults.teamValidations) {
        for (const [teamId, validation] of Object.entries(validationResults.teamValidations)) {
          if (validation.validation_summary.overall_confidence < 80) {
            // Record feedback for low confidence data
            await this.recordAgentFeedback(
              'validation-agent',
              'rag-agent',
              'data_quality',
              `Low confidence (${validation.validation_summary.overall_confidence}%) for team ${teamId} data`,
              {
                teamId,
                validation_summary: validation.validation_summary,
                problem_games: validation.game_validations.filter(g => g.confidence_score < 70)
              }
            );
          }
        }
      }
      
      // Generate a pipeline report
      const reportPath = await this.generatePipelineReport(ragResults, validationResults);
      
      // Return the results
      return {
        ragResults,
        validationResults,
        reportPath,
        summary: 'Pipeline completed successfully'
      };
    } catch (error) {
      logger.error(`Error running pipeline: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Schedule the agent to run on a recurring basis
   */
  scheduleRuns(cronExpression = '0 3 * * *') {
    // Default: Schedule the agent to run at 3:00 AM every day
    const job = cron.schedule(cronExpression, async () => {
      logger.info(`Running scheduled Big12DirectorAgent at ${new Date().toISOString()}`);
      
      const task = this.createTask(
        'run_pipeline',
        'Scheduled run of the Big 12 data pipeline',
        { scheduled: true, timestamp: new Date().toISOString() }
      );
      
      this.submitTask(task);
    });
    
    logger.info(`Big12DirectorAgent scheduled to run with cron expression: ${cronExpression}`);
    return job;
  }
}

module.exports = Big12DirectorAgent;