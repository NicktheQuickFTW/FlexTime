/**
 * Base Agent Class
 * 
 * Provides the foundational structure and common functionality for all
 * FlexTime agents including logging, lifecycle management, and communication.
 */

class Agent {
  constructor(options = {}) {
    this.name = options.name || 'Agent';
    this.role = options.role || 'general';
    this.capabilities = options.capabilities || [];
    this.status = 'inactive';
    this.lastActivity = null;
    this.config = options.systemConfig || {};
    this.schedulingService = options.schedulingService;
    
    // Bind logging methods
    this.log = this.log.bind(this);
  }

  /**
   * Log a message with appropriate level and context
   */
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      agent: this.name,
      level,
      message,
      data
    };

    // Use console for now - in production, integrate with proper logging system
    const logMethod = console[level] || console.log;
    logMethod(`[${timestamp}] ${this.name}: ${message}`, data || '');

    this.lastActivity = timestamp;
  }

  /**
   * Initialize the agent
   * Override in subclasses for specific initialization logic
   */
  async initialize() {
    this.log('info', `${this.name} initializing`);
    this.status = 'ready';
    return true;
  }

  /**
   * Shutdown the agent
   * Override in subclasses for specific cleanup logic
   */
  async shutdown() {
    this.log('info', `${this.name} shutting down`);
    this.status = 'inactive';
    return true;
  }

  /**
   * Get agent status information
   */
  getStatus() {
    return {
      name: this.name,
      role: this.role,
      status: this.status,
      capabilities: this.capabilities,
      lastActivity: this.lastActivity
    };
  }

  /**
   * Execute a task
   * Override in subclasses for specific task execution
   */
  async executeTask(task, context = {}) {
    this.log('info', `Executing task: ${task.type || 'unknown'}`);
    throw new Error('executeTask must be implemented by subclass');
  }

  /**
   * Store experience for learning
   */
  async storeExperience(experience, metadata = {}) {
    if (this.schedulingService && typeof this.schedulingService.storeFeedback === 'function') {
      try {
        const experienceData = {
          content: experience,
          agentId: this.name,
          type: metadata.type || 'general',
          tags: metadata.tags || [],
          timestamp: new Date().toISOString()
        };
        
        await this.schedulingService.storeFeedback(experienceData);
        this.log('debug', 'Experience stored successfully');
      } catch (error) {
        this.log('warn', `Failed to store experience: ${error.message}`);
      }
    }
  }

  /**
   * Validate required parameters
   */
  validateParameters(params, required) {
    const missing = required.filter(param => !(param in params) || params[param] === undefined);
    if (missing.length > 0) {
      throw new Error(`Missing required parameters: ${missing.join(', ')}`);
    }
  }

  /**
   * Create standardized error response
   */
  createErrorResponse(message, code = 'AGENT_ERROR', details = null) {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        agent: this.name,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create standardized success response
   */
  createSuccessResponse(data, message = null) {
    return {
      success: true,
      data,
      message,
      agent: this.name,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { Agent };