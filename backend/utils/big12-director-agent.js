/**
 * Big 12 Director Agent
 * 
 * This script acts as the orchestrator for the entire Big 12 data pipeline.
 * It coordinates the RAG agent and validation agent, implements feedback loops,
 * tracks performance metrics, and ensures continuous improvement through learning.
 */

require('dotenv').config();
const { Client } = require('pg');
const logger = require('../scripts/logger');
const { Anthropic } = require('@anthropic-ai/sdk');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');

// Import agent modules
const { runRagAgent } = require('./big12-rag-agent');
const { runValidationAgent } = require('./big12-validation-agent');

// Initialize Anthropic client for Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Connect to the Neon DB
 */
async function connectToNeonDB() {
  const client = new Client(process.env.NEON_DB_CONNECTION_STRING);
  await client.connect();
  
  // Get the current user
  const userResult = await client.query('SELECT current_user;');
  const currentUser = userResult.rows[0].current_user;
  
  // Set the search path to use the user's schema
  await client.query(`SET search_path TO ${currentUser}, public;`);
  
  return { client, currentUser };
}

/**
 * Initialize the agent memory system
 */
async function initializeMemorySystem(client, currentUser) {
  try {
    // Create a table for storing agent memory if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${currentUser}.agent_memory (
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${currentUser}.agent_metrics (
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
    await client.query(`
      CREATE TABLE IF NOT EXISTS ${currentUser}.agent_feedback (
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
async function storeAgentMemory(client, currentUser, agentName, memoryType, memoryKey, memoryValue) {
  try {
    await client.query(`
      INSERT INTO ${currentUser}.agent_memory 
        (agent_name, memory_type, memory_key, memory_value)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (agent_name, memory_type, memory_key)
      DO UPDATE SET 
        memory_value = $4,
        updated_at = CURRENT_TIMESTAMP,
        access_count = ${currentUser}.agent_memory.access_count + 1;
    `, [agentName, memoryType, memoryKey, JSON.stringify(memoryValue)]);
    
    logger.info(`Stored memory for ${agentName}: ${memoryType}/${memoryKey}`);
  } catch (error) {
    logger.error(`Error storing memory for ${agentName}: ${error.message}`);
  }
}

/**
 * Retrieve a memory for an agent
 */
async function retrieveAgentMemory(client, currentUser, agentName, memoryType, memoryKey) {
  try {
    const result = await client.query(`
      UPDATE ${currentUser}.agent_memory
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
async function startAgentRun(client, currentUser, agentName) {
  try {
    const runId = `${agentName}-${Date.now()}`;
    
    await client.query(`
      INSERT INTO ${currentUser}.agent_metrics 
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
async function completeAgentRun(client, currentUser, agentName, runId, status, metrics) {
  try {
    await client.query(`
      UPDATE ${currentUser}.agent_metrics
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
async function recordAgentFeedback(client, currentUser, fromAgent, toAgent, feedbackType, content, relatedData) {
  try {
    await client.query(`
      INSERT INTO ${currentUser}.agent_feedback 
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
async function processFeedback(client, currentUser, agentName) {
  try {
    // Get pending feedback for this agent
    const result = await client.query(`
      SELECT * FROM ${currentUser}.agent_feedback
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
      const response = await anthropic.messages.create({
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
      await storeAgentMemory(
        client, 
        currentUser, 
        agentName, 
        'learning', 
        `feedback-${feedback.feedback_id}`, 
        learning
      );
      
      // Update the feedback status
      await client.query(`
        UPDATE ${currentUser}.agent_feedback
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
 * Run the RAG agent with Claude and feedback loop
 */
async function runRagAgentWithFeedback(client, currentUser) {
  const agentName = 'rag-agent';
  const runId = await startAgentRun(client, currentUser, agentName);
  
  if (!runId) {
    return;
  }
  
  try {
    // Process any pending feedback before running
    await processFeedback(client, currentUser, agentName);
    
    // Retrieve agent memories to inform this run
    const learningMemories = await client.query(`
      SELECT memory_key, memory_value FROM ${currentUser}.agent_memory
      WHERE agent_name = $1 AND memory_type = 'learning'
      ORDER BY updated_at DESC LIMIT 10;
    `, [agentName]);
    
    const previousRunMemories = await client.query(`
      SELECT memory_key, memory_value FROM ${currentUser}.agent_memory
      WHERE agent_name = $1 AND memory_type = 'run_results'
      ORDER BY updated_at DESC LIMIT 5;
    `, [agentName]);
    
    // Log the memories being used
    logger.info(`Running ${agentName} with ${learningMemories.rows.length} learning memories and ${previousRunMemories.rows.length} previous run memories`);
    
    // Run the RAG agent (this would need to be modified to accept the memories)
    const ragResults = await runRagAgent();
    
    // Store the results as a memory
    await storeAgentMemory(
      client, 
      currentUser, 
      agentName, 
      'run_results', 
      runId, 
      ragResults
    );
    
    // Complete the run with metrics
    await completeAgentRun(
      client, 
      currentUser, 
      agentName, 
      runId, 
      'completed', 
      {
        successRate: ragResults.successRate || 100,
        errorCount: ragResults.errorCount || 0,
        itemsProcessed: ragResults.itemsProcessed || 0
      }
    );
    
    return ragResults;
  } catch (error) {
    logger.error(`Error running ${agentName}: ${error.message}`);
    
    // Complete the run with error status
    await completeAgentRun(
      client, 
      currentUser, 
      agentName, 
      runId, 
      'failed', 
      {
        successRate: 0,
        errorCount: 1,
        itemsProcessed: 0,
        error: error.message
      }
    );
    
    return null;
  }
}

/**
 * Run the validation agent with feedback loop
 */
async function runValidationAgentWithFeedback(client, currentUser, ragResults) {
  const agentName = 'validation-agent';
  const runId = await startAgentRun(client, currentUser, agentName);
  
  if (!runId) {
    return;
  }
  
  try {
    // Process any pending feedback before running
    await processFeedback(client, currentUser, agentName);
    
    // Retrieve agent memories to inform this run
    const learningMemories = await client.query(`
      SELECT memory_key, memory_value FROM ${currentUser}.agent_memory
      WHERE agent_name = $1 AND memory_type = 'learning'
      ORDER BY updated_at DESC LIMIT 10;
    `, [agentName]);
    
    const previousRunMemories = await client.query(`
      SELECT memory_key, memory_value FROM ${currentUser}.agent_memory
      WHERE agent_name = $1 AND memory_type = 'run_results'
      ORDER BY updated_at DESC LIMIT 5;
    `, [agentName]);
    
    // Log the memories being used
    logger.info(`Running ${agentName} with ${learningMemories.rows.length} learning memories and ${previousRunMemories.rows.length} previous run memories`);
    
    // Run the validation agent (this would need to be modified to accept the memories)
    const validationResults = await runValidationAgent();
    
    // Store the results as a memory
    await storeAgentMemory(
      client, 
      currentUser, 
      agentName, 
      'run_results', 
      runId, 
      validationResults
    );
    
    // Complete the run with metrics
    await completeAgentRun(
      client, 
      currentUser, 
      agentName, 
      runId, 
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
          await recordAgentFeedback(
            client,
            currentUser,
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
    
    return validationResults;
  } catch (error) {
    logger.error(`Error running ${agentName}: ${error.message}`);
    
    // Complete the run with error status
    await completeAgentRun(
      client, 
      currentUser, 
      agentName, 
      runId, 
      'failed', 
      {
        successRate: 0,
        errorCount: 1,
        itemsProcessed: 0,
        error: error.message
      }
    );
    
    return null;
  }
}

/**
 * Generate a comprehensive report of the entire pipeline run
 */
async function generatePipelineReport(client, currentUser, ragResults, validationResults) {
  try {
    // Use Claude to generate a comprehensive report
    const response = await anthropic.messages.create({
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
    const reportDir = path.join(__dirname, '../reports');
    
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
 * Main function to run the director agent
 */
async function runDirectorAgent() {
  logger.info('Starting Big 12 Director Agent...');
  
  let client;
  
  try {
    // Connect to the Neon DB
    const { client: dbClient, currentUser } = await connectToNeonDB();
    client = dbClient;
    
    // Initialize the memory system
    await initializeMemorySystem(client, currentUser);
    
    // Run the RAG agent with feedback loop
    const ragResults = await runRagAgentWithFeedback(client, currentUser);
    
    // Run the validation agent with feedback loop
    const validationResults = await runValidationAgentWithFeedback(client, currentUser, ragResults);
    
    // Generate a comprehensive pipeline report
    await generatePipelineReport(client, currentUser, ragResults, validationResults);
    
    logger.info('Big 12 Director Agent completed successfully');
  } catch (error) {
    logger.error(`Error running Big 12 Director Agent: ${error.message}`);
  } finally {
    // Close the database connection
    if (client) {
      await client.end();
    }
  }
}

/**
 * Schedule the director agent to run overnight
 */
function scheduleDirectorAgent() {
  // Schedule the agent to run at 3:00 AM every day (after the RAG agent at 2:00 AM)
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running scheduled Big 12 Director Agent...');
    await runDirectorAgent();
  });
  
  logger.info('Big 12 Director Agent scheduled to run at 3:00 AM daily');
}

// Run the agent if executed directly
if (require.main === module) {
  if (process.argv.includes('--schedule')) {
    // Schedule the agent to run overnight
    scheduleDirectorAgent();
  } else {
    // Run the agent immediately
    runDirectorAgent()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        logger.error(`Unexpected error: ${error.message}`);
        process.exit(1);
      });
  }
}

module.exports = {
  runDirectorAgent,
  scheduleDirectorAgent
};
