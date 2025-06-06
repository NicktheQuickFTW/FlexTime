/**
 * Migration Worker Thread
 * Executes database migrations in parallel
 * Part of the 100-worker migration system
 */

const { parentPort, workerData } = require('worker_threads');
const { Pool } = require('pg');
const Redis = require('ioredis');
const fs = require('fs').promises;
const path = require('path');

// Worker configuration
const workerId = workerData.workerId;
const databaseUrl = workerData.databaseUrl;
const redisUrl = workerData.redisUrl;

// Initialize connections
const db = new Pool({ connectionString: databaseUrl });
const redis = new Redis(redisUrl);

// Logging helper
function log(message, level = 'info') {
  parentPort.postMessage({
    type: 'log',
    level,
    message: `[Worker ${workerId}] ${message}`
  });
}

// Execute a single migration task
async function executeMigration(task) {
  const startTime = Date.now();
  let result = { success: false, error: null, affectedRows: 0 };
  
  try {
    log(`Starting migration: ${task.migration.id}`);
    
    // Begin transaction
    const client = await db.connect();
    
    try {
      await client.query('BEGIN');
      
      // Record migration start
      await client.query(
        `INSERT INTO migration_executions 
         (migration_id, worker_id, status, started_at, metadata) 
         VALUES ($1, $2, 'running', CURRENT_TIMESTAMP, $3)`,
        [task.migration.id, workerId, { directory: task.migration.directory }]
      );
      
      // Execute migration SQL
      const migrationSql = task.migration.content;
      const statements = splitSqlStatements(migrationSql);
      
      let totalAffectedRows = 0;
      
      for (const statement of statements) {
        if (statement.trim()) {
          log(`Executing statement: ${statement.substring(0, 50)}...`);
          const queryResult = await client.query(statement);
          
          if (queryResult.rowCount) {
            totalAffectedRows += queryResult.rowCount;
          }
          
          // Report progress
          parentPort.postMessage({
            type: 'progress',
            progress: {
              taskId: task.id,
              currentStatement: statements.indexOf(statement) + 1,
              totalStatements: statements.length
            }
          });
        }
      }
      
      // Commit transaction
      await client.query('COMMIT');
      
      // Update migration status
      await client.query(
        `UPDATE migration_executions 
         SET status = 'completed', 
             completed_at = CURRENT_TIMESTAMP,
             affected_rows = $1
         WHERE migration_id = $2 AND worker_id = $3`,
        [totalAffectedRows, task.migration.id, workerId]
      );
      
      result = {
        success: true,
        affectedRows: totalAffectedRows,
        duration: Date.now() - startTime
      };
      
      log(`Completed migration: ${task.migration.id} (${result.duration}ms, ${result.affectedRows} rows affected)`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    log(`Migration failed: ${task.migration.id} - ${error.message}`, 'error');
    result.error = error;
    
    // Record failure
    await db.query(
      `UPDATE migration_executions 
       SET status = 'failed', 
           completed_at = CURRENT_TIMESTAMP,
           error_message = $1
       WHERE migration_id = $2 AND worker_id = $3`,
      [error.message, task.migration.id, workerId]
    );
  }
  
  return result;
}

// Split SQL content into individual statements
function splitSqlStatements(sql) {
  // Remove comments and split by semicolons
  // This is a simplified version - production would need more robust parsing
  const cleanSql = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
  
  const statements = [];
  let currentStatement = '';
  let inString = false;
  let stringDelimiter = '';
  
  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];
    const prevChar = i > 0 ? cleanSql[i - 1] : '';
    
    // Handle string literals
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringDelimiter = char;
      } else if (char === stringDelimiter) {
        inString = false;
      }
    }
    
    currentStatement += char;
    
    // Split on semicolon if not in string
    if (char === ';' && !inString) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // Add any remaining statement
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements;
}

// Execute constraint validation in parallel
async function executeConstraintValidation(task) {
  const startTime = Date.now();
  
  try {
    log(`Starting constraint validation batch: ${task.id}`);
    
    const constraints = task.constraints;
    const results = [];
    
    for (const constraint of constraints) {
      const validationResult = await db.query(
        `SELECT * FROM constraint_validation.validate_constraint_parallel($1, $2, $3)`,
        [constraint.id, task.scheduleData, workerId]
      );
      
      results.push({
        constraintId: constraint.id,
        result: validationResult.rows[0]
      });
    }
    
    return {
      success: true,
      results,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    log(`Constraint validation failed: ${error.message}`, 'error');
    return { success: false, error };
  }
}

// Execute schedule generation chunk
async function executeScheduleGeneration(task) {
  const startTime = Date.now();
  
  try {
    log(`Starting schedule generation chunk: ${task.chunkId}`);
    
    const { jobId, chunkId, teamIds, dateRange } = task;
    
    // Update chunk status
    await db.query(
      `UPDATE schedule_generation.processing_chunks 
       SET status = 'processing', 
           processing_start = CURRENT_TIMESTAMP,
           worker_id = $1
       WHERE job_id = $2 AND chunk_id = $3`,
      [workerId, jobId, chunkId]
    );
    
    // Generate games for this chunk
    let gamesGenerated = 0;
    
    // This is a simplified example - real implementation would be more complex
    for (let i = 0; i < teamIds.length; i++) {
      for (let j = i + 1; j < teamIds.length; j++) {
        // Generate game between team i and team j
        gamesGenerated++;
        
        // Report progress periodically
        if (gamesGenerated % 10 === 0) {
          parentPort.postMessage({
            type: 'progress',
            progress: {
              chunkId,
              gamesGenerated,
              totalTeams: teamIds.length
            }
          });
        }
      }
    }
    
    // Update chunk completion
    await db.query(
      `UPDATE schedule_generation.processing_chunks 
       SET status = 'completed', 
           processing_end = CURRENT_TIMESTAMP,
           games_generated = $1
       WHERE job_id = $2 AND chunk_id = $3`,
      [gamesGenerated, jobId, chunkId]
    );
    
    return {
      success: true,
      gamesGenerated,
      duration: Date.now() - startTime
    };
    
  } catch (error) {
    log(`Schedule generation failed: ${error.message}`, 'error');
    
    await db.query(
      `UPDATE schedule_generation.processing_chunks 
       SET status = 'failed', 
           error_message = $1
       WHERE job_id = $2 AND chunk_id = $3`,
      [error.message, task.jobId, task.chunkId]
    );
    
    return { success: false, error };
  }
}

// Main message handler
parentPort.on('message', async (message) => {
  try {
    switch (message.type) {
      case 'execute_task':
        const task = message.task;
        let result;
        
        switch (task.type) {
          case 'migration':
            result = await executeMigration(task);
            break;
          case 'constraint_validation':
            result = await executeConstraintValidation(task);
            break;
          case 'schedule_generation':
            result = await executeScheduleGeneration(task);
            break;
          default:
            throw new Error(`Unknown task type: ${task.type}`);
        }
        
        if (result.success) {
          parentPort.postMessage({
            type: 'task_completed',
            taskId: task.id,
            result
          });
        } else {
          parentPort.postMessage({
            type: 'task_failed',
            taskId: task.id,
            error: result.error
          });
        }
        break;
        
      case 'health_check':
        parentPort.postMessage({
          type: 'health_response',
          workerId,
          status: 'healthy',
          uptime: process.uptime()
        });
        break;
        
      case 'shutdown':
        log('Received shutdown signal');
        await cleanup();
        process.exit(0);
        break;
        
      default:
        log(`Unknown message type: ${message.type}`, 'warn');
    }
  } catch (error) {
    log(`Worker error: ${error.message}`, 'error');
    parentPort.postMessage({
      type: 'worker_error',
      workerId,
      error: error.message
    });
  }
});

// Cleanup function
async function cleanup() {
  try {
    await db.end();
    await redis.quit();
    log('Worker cleanup completed');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'error');
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  cleanup().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at: ${promise}, reason: ${reason}`, 'error');
  cleanup().then(() => process.exit(1));
});

// Initialize worker
log('Worker initialized and ready');
parentPort.postMessage({
  type: 'worker_ready',
  workerId
});