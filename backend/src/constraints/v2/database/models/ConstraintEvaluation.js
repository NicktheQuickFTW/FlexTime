/**
 * Constraint Evaluation Model
 * Results of constraint satisfaction checks
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintEvaluation = sequelize.define('ConstraintEvaluation', {
    evaluation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    instance_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'constraint_instances',
        key: 'instance_id'
      }
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Schedule being evaluated'
    },
    game_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Specific game if constraint is game-level'
    },
    is_satisfied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      comment: 'Whether the constraint is satisfied'
    },
    satisfaction_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Satisfaction score between 0 and 1'
    },
    evaluation_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Detailed evaluation results and metrics'
    },
    evaluation_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time taken to evaluate in milliseconds'
    },
    memory_usage_kb: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Memory used during evaluation in KB'
    },
    evaluated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    evaluation_context: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Context at evaluation time (season, weather, etc.)'
    },
    evaluation_version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    is_latest: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether this is the latest evaluation for this constraint'
    }
  }, {
    tableName: 'constraint_evaluations',
    timestamps: false,
    indexes: [
      {
        fields: ['instance_id', 'is_latest']
      },
      {
        fields: ['schedule_id']
      },
      {
        fields: ['game_id']
      },
      {
        fields: ['is_satisfied', 'satisfaction_score']
      },
      {
        fields: ['evaluated_at']
      },
      {
        fields: ['evaluation_data'],
        using: 'GIN'
      }
    ]
  });

  ConstraintEvaluation.associate = (models) => {
    // Belongs to constraint instance
    ConstraintEvaluation.belongsTo(models.ConstraintInstance, {
      foreignKey: 'instance_id',
      as: 'constraintInstance'
    });
  };

  // Instance methods
  ConstraintEvaluation.prototype.getViolationDetails = function() {
    if (this.is_satisfied) {
      return null;
    }
    
    return {
      constraint_id: this.instance_id,
      game_id: this.game_id,
      violation_type: this.evaluation_data.violation_type || 'unknown',
      severity: this.evaluation_data.severity || 'medium',
      details: this.evaluation_data.details || {},
      suggestions: this.evaluation_data.suggestions || []
    };
  };

  ConstraintEvaluation.prototype.compareWith = async function(otherEvaluationId) {
    const other = await ConstraintEvaluation.findByPk(otherEvaluationId);
    if (!other) return null;
    
    return {
      satisfaction_change: this.satisfaction_score - other.satisfaction_score,
      status_change: this.is_satisfied !== other.is_satisfied,
      performance_change: {
        time_ms: this.evaluation_time_ms - other.evaluation_time_ms,
        memory_kb: this.memory_usage_kb - other.memory_usage_kb
      }
    };
  };

  // Class methods
  ConstraintEvaluation.createEvaluation = async function(constraintInstance, evaluationResult) {
    // Mark previous evaluations as not latest
    await this.update(
      { is_latest: false },
      {
        where: {
          instance_id: constraintInstance.instance_id,
          is_latest: true
        }
      }
    );
    
    // Get the latest version number
    const latestVersion = await this.max('evaluation_version', {
      where: { instance_id: constraintInstance.instance_id }
    }) || 0;
    
    // Create new evaluation
    return await this.create({
      instance_id: constraintInstance.instance_id,
      schedule_id: evaluationResult.schedule_id,
      game_id: evaluationResult.game_id,
      is_satisfied: evaluationResult.is_satisfied,
      satisfaction_score: evaluationResult.satisfaction_score,
      evaluation_data: evaluationResult.data || {},
      evaluation_time_ms: evaluationResult.time_ms,
      memory_usage_kb: evaluationResult.memory_kb,
      evaluation_context: evaluationResult.context || {},
      evaluation_version: latestVersion + 1,
      is_latest: true
    });
  };

  ConstraintEvaluation.getScheduleSummary = async function(scheduleId) {
    const evaluations = await this.findAll({
      where: {
        schedule_id: scheduleId,
        is_latest: true
      },
      include: [{
        model: sequelize.models.ConstraintInstance,
        as: 'constraintInstance',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template',
          attributes: ['name', 'type', 'category_id']
        }]
      }],
      order: [['satisfaction_score', 'ASC']]
    });
    
    const summary = {
      total_constraints: evaluations.length,
      satisfied_count: 0,
      violated_count: 0,
      partial_count: 0,
      average_satisfaction: 0,
      by_type: {
        hard: { total: 0, satisfied: 0, average_score: 0 },
        soft: { total: 0, satisfied: 0, average_score: 0 },
        preference: { total: 0, satisfied: 0, average_score: 0 }
      },
      violations: [],
      worst_constraints: []
    };
    
    let totalScore = 0;
    
    evaluations.forEach(eval => {
      const type = eval.constraintInstance.template.type;
      summary.by_type[type].total++;
      
      if (eval.is_satisfied) {
        summary.satisfied_count++;
        summary.by_type[type].satisfied++;
      } else if (eval.satisfaction_score < 0.5) {
        summary.violated_count++;
        summary.violations.push({
          constraint_name: eval.constraintInstance.template.name,
          satisfaction_score: eval.satisfaction_score,
          details: eval.getViolationDetails()
        });
      } else {
        summary.partial_count++;
      }
      
      totalScore += eval.satisfaction_score;
      summary.by_type[type].average_score += eval.satisfaction_score;
    });
    
    // Calculate averages
    if (evaluations.length > 0) {
      summary.average_satisfaction = totalScore / evaluations.length;
      
      Object.keys(summary.by_type).forEach(type => {
        if (summary.by_type[type].total > 0) {
          summary.by_type[type].average_score /= summary.by_type[type].total;
        }
      });
      
      // Get worst performing constraints
      summary.worst_constraints = evaluations
        .slice(0, 5)
        .map(eval => ({
          name: eval.constraintInstance.template.name,
          type: eval.constraintInstance.template.type,
          satisfaction_score: eval.satisfaction_score,
          instance_id: eval.instance_id
        }));
    }
    
    return summary;
  };

  ConstraintEvaluation.getHistoricalTrend = async function(instanceId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const evaluations = await this.findAll({
      where: {
        instance_id: instanceId,
        evaluated_at: { [Op.gte]: startDate }
      },
      attributes: [
        'evaluated_at',
        'satisfaction_score',
        'is_satisfied',
        'evaluation_time_ms'
      ],
      order: [['evaluated_at', 'ASC']]
    });
    
    return evaluations.map(eval => ({
      date: eval.evaluated_at,
      score: eval.satisfaction_score,
      satisfied: eval.is_satisfied,
      performance_ms: eval.evaluation_time_ms
    }));
  };

  return ConstraintEvaluation;
};