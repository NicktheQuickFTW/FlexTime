/**
 * Unified Constraint Definition Language (UCDL) - Constraint Metadata
 * 
 * This module provides metadata management for constraints, including
 * versioning, documentation, dependencies, and usage tracking.
 */

/**
 * Constraint metadata manager
 */
class ConstraintMetadata {
  /**
   * Create constraint metadata
   * @param {Object} data - Metadata object
   */
  constructor(data = {}) {
    this.created = data.created || new Date().toISOString();
    this.lastModified = data.lastModified || new Date().toISOString();
    this.version = data.version || '1.0.0';
    this.author = data.author || 'system';
    this.description = data.description || '';
    this.documentation = data.documentation || '';
    this.tags = data.tags || [];
    this.category = data.category || 'general';
    this.sport = data.sport || 'all';
    this.conference = data.conference || 'all';
    
    // Dependency tracking
    this.dependencies = data.dependencies || [];
    this.dependents = data.dependents || [];
    this.conflicts = data.conflicts || [];
    
    // Usage statistics
    this.usageStats = {
      evaluationCount: 0,
      lastEvaluated: null,
      averageEvaluationTime: 0,
      successRate: 100,
      violationRate: 0,
      ...data.usageStats
    };
    
    // Validation rules
    this.validation = {
      required: data.validation?.required || [],
      optional: data.validation?.optional || [],
      deprecated: data.validation?.deprecated || [],
      ...data.validation
    };
    
    // Change history
    this.changeHistory = data.changeHistory || [];
    
    // Performance characteristics
    this.performance = {
      complexity: data.performance?.complexity || 'O(n)',
      estimatedExecutionTime: data.performance?.estimatedExecutionTime || 'fast',
      memoryUsage: data.performance?.memoryUsage || 'low',
      cacheability: data.performance?.cacheability || true,
      ...data.performance
    };
    
    // Quality attributes
    this.quality = {
      confidence: data.quality?.confidence || 'high',
      testCoverage: data.quality?.testCoverage || 0,
      reviewStatus: data.quality?.reviewStatus || 'pending',
      maintainer: data.quality?.maintainer || this.author,
      ...data.quality
    };
  }

  /**
   * Update metadata timestamp
   */
  touch() {
    this.lastModified = new Date().toISOString();
  }

  /**
   * Add a tag
   * @param {string} tag - Tag to add
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
      this.touch();
    }
  }

  /**
   * Remove a tag
   * @param {string} tag - Tag to remove
   */
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Add a dependency
   * @param {string} constraintId - ID of dependency
   * @param {string} type - Type of dependency (required, optional, conflicts)
   */
  addDependency(constraintId, type = 'required') {
    const dependency = { constraintId, type, addedAt: new Date().toISOString() };
    
    switch (type) {
      case 'required':
        if (!this.dependencies.find(d => d.constraintId === constraintId)) {
          this.dependencies.push(dependency);
        }
        break;
      case 'conflicts':
        if (!this.conflicts.find(d => d.constraintId === constraintId)) {
          this.conflicts.push(dependency);
        }
        break;
    }
    
    this.touch();
  }

  /**
   * Remove a dependency
   * @param {string} constraintId - ID of dependency to remove
   * @param {string} type - Type of dependency
   */
  removeDependency(constraintId, type = 'required') {
    let targetArray;
    switch (type) {
      case 'required':
        targetArray = this.dependencies;
        break;
      case 'conflicts':
        targetArray = this.conflicts;
        break;
      default:
        return;
    }
    
    const index = targetArray.findIndex(d => d.constraintId === constraintId);
    if (index > -1) {
      targetArray.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Record constraint evaluation
   * @param {Object} result - Evaluation result
   * @param {number} executionTime - Execution time in milliseconds
   */
  recordEvaluation(result, executionTime) {
    this.usageStats.evaluationCount++;
    this.usageStats.lastEvaluated = new Date().toISOString();
    
    // Update average execution time
    const currentAvg = this.usageStats.averageEvaluationTime;
    const count = this.usageStats.evaluationCount;
    this.usageStats.averageEvaluationTime = 
      ((currentAvg * (count - 1)) + executionTime) / count;
    
    // Update success/violation rates
    const isSuccess = result.status === 'satisfied';
    const isViolation = result.status === 'violated';
    
    const successCount = Math.round((this.usageStats.successRate / 100) * (count - 1));
    const violationCount = Math.round((this.usageStats.violationRate / 100) * (count - 1));
    
    this.usageStats.successRate = 
      ((successCount + (isSuccess ? 1 : 0)) / count) * 100;
    this.usageStats.violationRate = 
      ((violationCount + (isViolation ? 1 : 0)) / count) * 100;
  }

  /**
   * Add change to history
   * @param {string} description - Description of change
   * @param {string} author - Author of change
   * @param {string} oldVersion - Previous version
   * @param {string} newVersion - New version
   */
  addChange(description, author, oldVersion, newVersion) {
    this.changeHistory.push({
      description,
      author,
      oldVersion,
      newVersion,
      timestamp: new Date().toISOString()
    });
    
    this.version = newVersion;
    this.author = author;
    this.touch();
    
    // Keep only last 50 changes
    if (this.changeHistory.length > 50) {
      this.changeHistory = this.changeHistory.slice(-50);
    }
  }

  /**
   * Update performance characteristics
   * @param {Object} perfData - Performance data
   */
  updatePerformance(perfData) {
    Object.assign(this.performance, perfData);
    this.touch();
  }

  /**
   * Update quality attributes
   * @param {Object} qualityData - Quality data
   */
  updateQuality(qualityData) {
    Object.assign(this.quality, qualityData);
    this.touch();
  }

  /**
   * Check if constraint is compatible with another
   * @param {ConstraintMetadata} other - Other constraint metadata
   * @returns {Object} Compatibility information
   */
  checkCompatibility(other) {
    const result = {
      compatible: true,
      conflicts: [],
      warnings: [],
      suggestions: []
    };
    
    // Check for explicit conflicts
    const conflictIds = this.conflicts.map(c => c.constraintId);
    if (conflictIds.includes(other.id)) {
      result.compatible = false;
      result.conflicts.push(`Explicit conflict with constraint ${other.id}`);
    }
    
    // Check for same category conflicts (if configured)
    if (this.category === other.category && 
        this.tags.includes('exclusive') && 
        other.tags.includes('exclusive')) {
      result.compatible = false;
      result.conflicts.push(`Both constraints are exclusive in category ${this.category}`);
    }
    
    // Check for performance warnings
    if (this.performance.complexity === 'O(n²)' && 
        other.performance.complexity === 'O(n²)') {
      result.warnings.push('Both constraints have high complexity - consider optimization');
    }
    
    return result;
  }

  /**
   * Generate constraint documentation
   * @returns {string} Generated documentation
   */
  generateDocumentation() {
    let doc = `# ${this.description}\n\n`;
    
    doc += `**Version:** ${this.version}\n`;
    doc += `**Author:** ${this.author}\n`;
    doc += `**Category:** ${this.category}\n`;
    doc += `**Sport:** ${this.sport}\n`;
    doc += `**Conference:** ${this.conference}\n\n`;
    
    if (this.tags.length > 0) {
      doc += `**Tags:** ${this.tags.join(', ')}\n\n`;
    }
    
    if (this.documentation) {
      doc += `## Description\n${this.documentation}\n\n`;
    }
    
    if (this.dependencies.length > 0) {
      doc += `## Dependencies\n`;
      for (const dep of this.dependencies) {
        doc += `- ${dep.constraintId} (${dep.type})\n`;
      }
      doc += '\n';
    }
    
    if (this.conflicts.length > 0) {
      doc += `## Conflicts\n`;
      for (const conflict of this.conflicts) {
        doc += `- ${conflict.constraintId}\n`;
      }
      doc += '\n';
    }
    
    doc += `## Performance\n`;
    doc += `- **Complexity:** ${this.performance.complexity}\n`;
    doc += `- **Execution Time:** ${this.performance.estimatedExecutionTime}\n`;
    doc += `- **Memory Usage:** ${this.performance.memoryUsage}\n`;
    doc += `- **Cacheable:** ${this.performance.cacheability ? 'Yes' : 'No'}\n\n`;
    
    doc += `## Usage Statistics\n`;
    doc += `- **Evaluation Count:** ${this.usageStats.evaluationCount}\n`;
    doc += `- **Success Rate:** ${this.usageStats.successRate.toFixed(1)}%\n`;
    doc += `- **Violation Rate:** ${this.usageStats.violationRate.toFixed(1)}%\n`;
    if (this.usageStats.lastEvaluated) {
      doc += `- **Last Evaluated:** ${this.usageStats.lastEvaluated}\n`;
    }
    
    return doc;
  }

  /**
   * Export metadata as object
   * @returns {Object} Metadata object
   */
  toObject() {
    return {
      created: this.created,
      lastModified: this.lastModified,
      version: this.version,
      author: this.author,
      description: this.description,
      documentation: this.documentation,
      tags: [...this.tags],
      category: this.category,
      sport: this.sport,
      conference: this.conference,
      dependencies: [...this.dependencies],
      dependents: [...this.dependents],
      conflicts: [...this.conflicts],
      usageStats: { ...this.usageStats },
      validation: { ...this.validation },
      changeHistory: [...this.changeHistory],
      performance: { ...this.performance },
      quality: { ...this.quality }
    };
  }

  /**
   * Create metadata from object
   * @param {Object} obj - Metadata object
   * @returns {ConstraintMetadata} Metadata instance
   */
  static fromObject(obj) {
    return new ConstraintMetadata(obj);
  }
}

module.exports = ConstraintMetadata;