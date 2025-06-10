/**
 * Parameter Repository
 * Data access layer for parameter operations
 */

const { Op } = require('sequelize');
const {
  sequelize,
  ParameterCategory,
  ParameterTemplate,
  ParameterInstance,
  ParameterEvaluation,
  ParameterConflict,
  ParameterResolution,
  ParameterCache,
  ParameterMetric
} = require('../models');

class ParameterRepository {
  /**
   * Category Operations
   */
  async createCategory(categoryData) {
    return await ConstraintCategory.create(categoryData);
  }

  async getCategoryTree() {
    return await ConstraintCategory.getCategoryTree();
  }

  async getCategoryById(categoryId) {
    return await ConstraintCategory.findByPk(categoryId, {
      include: [{
        model: ConstraintCategory,
        as: 'parent'
      }, {
        model: ConstraintCategory,
        as: 'children'
      }]
    });
  }

  /**
   * Template Operations
   */
  async createTemplate(templateData) {
    return await ConstraintTemplate.create(templateData);
  }

  async getTemplateById(templateId) {
    return await ConstraintTemplate.findByPk(templateId, {
      include: [{
        model: ConstraintCategory,
        as: 'category'
      }]
    });
  }

  async searchTemplates(query, filters = {}) {
    return await ConstraintTemplate.searchTemplates(query, filters);
  }

  async getPopularTemplates(limit = 10) {
    return await ConstraintTemplate.getPopularTemplates(limit);
  }

  async createTemplateVersion(templateId, updates, userId) {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    return await template.createNewVersion(updates, userId);
  }

  /**
   * Instance Operations
   */
  async createInstance(instanceData) {
    if (instanceData.template_id) {
      return await ConstraintInstance.createFromTemplate(
        instanceData.template_id,
        instanceData
      );
    }
    return await ConstraintInstance.create(instanceData);
  }

  async getInstanceById(instanceId, includeRelations = false) {
    const options = { where: { instance_id: instanceId } };
    
    if (includeRelations) {
      options.include = [{
        model: ConstraintTemplate,
        as: 'template',
        include: [{
          model: ConstraintCategory,
          as: 'category'
        }]
      }];
    }
    
    return await ConstraintInstance.findOne(options);
  }

  async getActiveConstraintsForSchedule(scheduleId, options = {}) {
    return await ConstraintInstance.getActiveForSchedule(scheduleId, options);
  }

  async updateInstance(instanceId, updates) {
    const instance = await this.getInstanceById(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }
    
    await instance.update(updates);
    return instance;
  }

  async toggleInstanceActive(instanceId) {
    const instance = await this.getInstanceById(instanceId);
    if (!instance) {
      throw new Error('Instance not found');
    }
    
    instance.is_active = !instance.is_active;
    await instance.save();
    return instance;
  }

  async overrideInstance(instanceId, reason, userId) {
    return await this.updateInstance(instanceId, {
      is_overridden: true,
      override_reason: reason,
      applied_by: userId
    });
  }

  /**
   * Evaluation Operations
   */
  async createEvaluation(constraintInstanceId, evaluationResult) {
    const instance = await this.getInstanceById(constraintInstanceId);
    if (!instance) {
      throw new Error('Constraint instance not found');
    }
    
    return await ConstraintEvaluation.createEvaluation(instance, evaluationResult);
  }

  async getLatestEvaluation(instanceId) {
    return await ConstraintEvaluation.findOne({
      where: {
        instance_id: instanceId,
        is_latest: true
      }
    });
  }

  async getEvaluationHistory(instanceId, limit = 10) {
    return await ConstraintEvaluation.findAll({
      where: { instance_id: instanceId },
      order: [['evaluated_at', 'DESC']],
      limit
    });
  }

  async getScheduleSummary(scheduleId) {
    return await ConstraintEvaluation.getScheduleSummary(scheduleId);
  }

  /**
   * Conflict Operations
   */
  async detectAndSaveConflicts(scheduleId) {
    const constraints = await this.getActiveConstraintsForSchedule(scheduleId);
    return await ConstraintConflict.detectConflicts(scheduleId, constraints);
  }

  async getActiveConflicts(scheduleId, options = {}) {
    return await ConstraintConflict.getActiveConflicts(scheduleId, options);
  }

  async getConflictById(conflictId, includeRelations = true) {
    const options = { where: { conflict_id: conflictId } };
    
    if (includeRelations) {
      options.include = [{
        model: ConstraintInstance,
        as: 'constraint1',
        include: [{
          model: ConstraintTemplate,
          as: 'template'
        }]
      }, {
        model: ConstraintInstance,
        as: 'constraint2',
        include: [{
          model: ConstraintTemplate,
          as: 'template'
        }]
      }];
    }
    
    return await ConstraintConflict.findOne(options);
  }

  async updateConflictStatus(conflictId, status) {
    const conflict = await this.getConflictById(conflictId, false);
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    conflict.status = status;
    await conflict.save();
    return conflict;
  }

  /**
   * Resolution Operations
   */
  async createResolution(conflictId, resolutionData) {
    return await ConstraintResolution.createResolution(conflictId, resolutionData);
  }

  async implementResolution(resolutionId) {
    const resolution = await ConstraintResolution.findByPk(resolutionId);
    if (!resolution) {
      throw new Error('Resolution not found');
    }
    
    return await resolution.implement();
  }

  async getResolutionHistory(scheduleId, options = {}) {
    return await ConstraintResolution.getResolutionHistory(scheduleId, options);
  }

  async recordResolutionFeedback(resolutionId, feedback) {
    const resolution = await ConstraintResolution.findByPk(resolutionId);
    if (!resolution) {
      throw new Error('Resolution not found');
    }
    
    return await resolution.recordFeedback(feedback);
  }

  /**
   * Cache Operations
   */
  async getCached(key, computeFunction = null) {
    return await ConstraintCache.get(key, computeFunction);
  }

  async setCached(key, value, options = {}) {
    return await ConstraintCache.set(key, value, options);
  }

  async invalidateCache(dependencies) {
    return await ConstraintCache.invalidateByDependencies(dependencies);
  }

  async cleanupCache() {
    return await ConstraintCache.cleanupExpired();
  }

  async getCacheStats() {
    return await ConstraintCache.getStats();
  }

  /**
   * Metrics Operations
   */
  async recordMetric(metricData) {
    return await ConstraintMetric.recordMetric(metricData);
  }

  async recordMetricBatch(metrics) {
    return await ConstraintMetric.recordBatch(metrics);
  }

  async getMetricTimeSeries(metricType, options = {}) {
    return await ConstraintMetric.getTimeSeries(metricType, options);
  }

  async getMetricAggregates(metricType, options = {}) {
    return await ConstraintMetric.getAggregates(metricType, options);
  }

  async getTopPerformingConstraints(metricType, options = {}) {
    return await ConstraintMetric.getTopPerformers(metricType, options);
  }

  async cleanupOldMetrics(retentionDays = 90) {
    return await ConstraintMetric.cleanup(retentionDays);
  }

  /**
   * Bulk Operations
   */
  async bulkCreateInstances(instances) {
    return await sequelize.transaction(async (t) => {
      const created = [];
      
      for (const instanceData of instances) {
        const instance = await this.createInstance(instanceData);
        created.push(instance);
      }
      
      return created;
    });
  }

  async bulkEvaluateConstraints(scheduleId, gameIds = null) {
    const constraints = await this.getActiveConstraintsForSchedule(scheduleId);
    const evaluations = [];
    
    await sequelize.transaction(async (t) => {
      for (const constraint of constraints) {
        // This would call the actual evaluation logic
        const result = {
          schedule_id: scheduleId,
          is_satisfied: true, // Placeholder
          satisfaction_score: 0.8, // Placeholder
          data: {},
          time_ms: 10,
          context: {}
        };
        
        const evaluation = await this.createEvaluation(
          constraint.instance_id,
          result
        );
        evaluations.push(evaluation);
      }
    });
    
    return evaluations;
  }

  /**
   * Analysis Operations
   */
  async analyzeConstraintPerformance(scheduleId) {
    const summary = await this.getScheduleSummary(scheduleId);
    const conflicts = await this.getActiveConflicts(scheduleId);
    const metrics = await this.getMetricAggregates('evaluation_time', {
      constraint_id: scheduleId
    });
    
    return {
      summary,
      active_conflicts: conflicts.length,
      performance_metrics: metrics,
      recommendations: this.generateRecommendations(summary, conflicts)
    };
  }

  generateRecommendations(summary, conflicts) {
    const recommendations = [];
    
    if (summary.average_satisfaction < 0.7) {
      recommendations.push({
        type: 'warning',
        message: 'Overall constraint satisfaction is low',
        action: 'Consider relaxing some soft constraints'
      });
    }
    
    if (conflicts.length > 10) {
      recommendations.push({
        type: 'critical',
        message: 'High number of active conflicts',
        action: 'Review and resolve critical conflicts'
      });
    }
    
    return recommendations;
  }

  /**
   * Database Functions
   */
  async callStoredProcedure(procedureName, params = {}) {
    const paramString = Object.entries(params)
      .map(([key, value]) => `${key} => ${sequelize.escape(value)}`)
      .join(', ');
    
    const query = `SELECT ${procedureName}(${paramString})`;
    return await sequelize.query(query, {
      type: sequelize.QueryTypes.SELECT
    });
  }

  async refreshMaterializedView() {
    await sequelize.query('SELECT refresh_constraint_statistics()', {
      type: sequelize.QueryTypes.SELECT
    });
  }
}

module.exports = new ConstraintRepository();