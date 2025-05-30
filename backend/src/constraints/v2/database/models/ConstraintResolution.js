/**
 * Constraint Resolution Model
 * How constraint conflicts were resolved
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintResolution = sequelize.define('ConstraintResolution', {
    resolution_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    conflict_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'constraint_conflicts',
        key: 'conflict_id'
      }
    },
    resolution_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of resolution applied'
    },
    resolution_strategy: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Specific strategy used (e.g., priority_based, time_shift, relaxation)'
    },
    winning_constraint_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'constraint_instances',
        key: 'instance_id'
      },
      comment: 'Which constraint took precedence, if applicable'
    },
    resolution_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Detailed resolution information'
    },
    schedule_changes: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Changes made to the schedule'
    },
    games_affected: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      comment: 'Game IDs that were modified'
    },
    quality_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Quality measure of the resolution'
    },
    stakeholder_satisfaction: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Satisfaction scores by stakeholder type'
    },
    resolved_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'User who resolved or "system" for automatic resolution'
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    was_successful: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      comment: 'Whether the resolution was ultimately successful'
    },
    feedback_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Feedback for ML training'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    implemented_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the resolution was actually applied'
    }
  }, {
    tableName: 'constraint_resolutions',
    timestamps: false,
    indexes: [
      {
        fields: ['conflict_id']
      },
      {
        fields: ['resolution_type']
      },
      {
        fields: ['winning_constraint_id']
      },
      {
        fields: ['created_at']
      },
      {
        fields: ['resolution_data'],
        using: 'GIN'
      }
    ]
  });

  ConstraintResolution.associate = (models) => {
    // Belongs to conflict
    ConstraintResolution.belongsTo(models.ConstraintConflict, {
      foreignKey: 'conflict_id',
      as: 'conflict'
    });
    
    // Belongs to winning constraint (optional)
    ConstraintResolution.belongsTo(models.ConstraintInstance, {
      foreignKey: 'winning_constraint_id',
      as: 'winningConstraint'
    });
  };

  // Instance methods
  ConstraintResolution.prototype.implement = async function() {
    if (this.implemented_at) {
      throw new Error('Resolution already implemented');
    }
    
    // Here you would implement the actual schedule changes
    // This is a placeholder for the implementation logic
    
    this.implemented_at = new Date();
    await this.save();
    
    // Mark the conflict as resolved
    const conflict = await sequelize.models.ConstraintConflict.findByPk(this.conflict_id);
    if (conflict) {
      await conflict.markResolved(this.resolution_id);
    }
    
    return true;
  };

  ConstraintResolution.prototype.calculateEffectiveness = async function() {
    // Calculate how effective this resolution was
    const metrics = {
      games_modified: this.games_affected.length,
      stakeholder_avg_satisfaction: 0,
      quality_score: this.quality_score || 0,
      implementation_time: null
    };
    
    // Calculate average stakeholder satisfaction
    const satisfactionScores = Object.values(this.stakeholder_satisfaction || {});
    if (satisfactionScores.length > 0) {
      metrics.stakeholder_avg_satisfaction = 
        satisfactionScores.reduce((a, b) => a + b, 0) / satisfactionScores.length;
    }
    
    // Calculate implementation time
    if (this.implemented_at) {
      metrics.implementation_time = 
        Math.floor((this.implemented_at - this.created_at) / 1000 / 60); // minutes
    }
    
    // Overall effectiveness score
    metrics.effectiveness = (
      (metrics.quality_score * 0.4) +
      (metrics.stakeholder_avg_satisfaction * 0.4) +
      ((10 - Math.min(metrics.games_modified, 10)) / 10 * 0.2) // Fewer changes is better
    );
    
    return metrics;
  };

  ConstraintResolution.prototype.recordFeedback = async function(feedback) {
    this.feedback_data = {
      ...this.feedback_data,
      ...feedback,
      recorded_at: new Date()
    };
    
    // Update success status based on feedback
    if (feedback.was_successful !== undefined) {
      this.was_successful = feedback.was_successful;
    }
    
    await this.save();
  };

  // Class methods
  ConstraintResolution.createResolution = async function(conflictId, resolutionData) {
    const conflict = await sequelize.models.ConstraintConflict.findByPk(conflictId, {
      include: [{
        model: sequelize.models.ConstraintInstance,
        as: 'constraint1',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template'
        }]
      }, {
        model: sequelize.models.ConstraintInstance,
        as: 'constraint2',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template'
        }]
      }]
    });
    
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    // Determine winning constraint based on resolution type
    let winningConstraintId = null;
    if (resolutionData.resolution_type === 'priority_based') {
      winningConstraintId = conflict.constraint1.priority > conflict.constraint2.priority
        ? conflict.constraint1.instance_id
        : conflict.constraint2.instance_id;
    }
    
    const resolution = await this.create({
      conflict_id: conflictId,
      ...resolutionData,
      winning_constraint_id: winningConstraintId || resolutionData.winning_constraint_id
    });
    
    return resolution;
  };

  ConstraintResolution.getSuccessfulStrategies = async function(conflictType, limit = 5) {
    const resolutions = await this.findAll({
      where: {
        was_successful: true
      },
      include: [{
        model: sequelize.models.ConstraintConflict,
        as: 'conflict',
        where: {
          conflict_type: conflictType
        },
        attributes: ['conflict_type', 'severity']
      }],
      attributes: [
        'resolution_strategy',
        [sequelize.fn('COUNT', sequelize.col('resolution_id')), 'count'],
        [sequelize.fn('AVG', sequelize.col('quality_score')), 'avg_quality']
      ],
      group: ['resolution_strategy', 'conflict.conflict_id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit
    });
    
    return resolutions.map(r => ({
      strategy: r.resolution_strategy,
      usage_count: parseInt(r.dataValues.count),
      average_quality: parseFloat(r.dataValues.avg_quality) || 0
    }));
  };

  ConstraintResolution.getResolutionHistory = async function(scheduleId, options = {}) {
    const include = [{
      model: sequelize.models.ConstraintConflict,
      as: 'conflict',
      where: { schedule_id: scheduleId },
      include: [{
        model: sequelize.models.ConstraintInstance,
        as: 'constraint1',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template',
          attributes: ['name', 'type']
        }]
      }, {
        model: sequelize.models.ConstraintInstance,
        as: 'constraint2',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template',
          attributes: ['name', 'type']
        }]
      }]
    }];
    
    if (options.includeWinning) {
      include.push({
        model: sequelize.models.ConstraintInstance,
        as: 'winningConstraint',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template',
          attributes: ['name']
        }]
      });
    }
    
    const where = {};
    if (options.successfulOnly) {
      where.was_successful = true;
    }
    
    return await this.findAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: options.limit || 50
    });
  };

  return ConstraintResolution;
};