/**
 * Constraint Conflict Model
 * Detected conflicts between multiple constraints
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintConflict = sequelize.define('ConstraintConflict', {
    conflict_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Schedule where conflict was detected'
    },
    constraint_1_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'constraint_instances',
        key: 'instance_id'
      }
    },
    constraint_2_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'constraint_instances',
        key: 'instance_id'
      }
    },
    conflict_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of conflict (e.g., team_overlap, venue_conflict, time_conflict)'
    },
    severity: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'medium'
    },
    conflict_data: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Detailed conflict information and context'
    },
    affected_games: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      comment: 'Game IDs affected by this conflict'
    },
    status: {
      type: DataTypes.ENUM('detected', 'analyzing', 'resolved', 'ignored', 'escalated'),
      defaultValue: 'detected',
      allowNull: false
    },
    predicted_impact_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'ML-predicted impact score'
    },
    confidence_score: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      validate: {
        min: 0,
        max: 1
      },
      comment: 'Confidence in the conflict detection'
    },
    detected_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    conflict_group_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For grouping related conflicts'
    },
    is_root_conflict: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether this is the root cause of a conflict group'
    }
  }, {
    tableName: 'constraint_conflicts',
    timestamps: false,
    indexes: [
      {
        fields: ['schedule_id']
      },
      {
        fields: ['constraint_1_id', 'constraint_2_id']
      },
      {
        fields: ['status', 'severity']
      },
      {
        fields: ['conflict_group_id']
      },
      {
        fields: ['detected_at']
      },
      {
        fields: ['conflict_data'],
        using: 'GIN'
      }
    ],
    validate: {
      constraintOrder() {
        // Ensure consistent ordering to avoid duplicate conflicts
        if (this.constraint_1_id > this.constraint_2_id) {
          const temp = this.constraint_1_id;
          this.constraint_1_id = this.constraint_2_id;
          this.constraint_2_id = temp;
        }
      }
    }
  });

  ConstraintConflict.associate = (models) => {
    // Belongs to first constraint
    ConstraintConflict.belongsTo(models.ConstraintInstance, {
      foreignKey: 'constraint_1_id',
      as: 'constraint1'
    });
    
    // Belongs to second constraint
    ConstraintConflict.belongsTo(models.ConstraintInstance, {
      foreignKey: 'constraint_2_id',
      as: 'constraint2'
    });
    
    // Has many resolutions
    ConstraintConflict.hasMany(models.ConstraintResolution, {
      foreignKey: 'conflict_id',
      as: 'resolutions'
    });
  };

  // Instance methods
  ConstraintConflict.prototype.getImpact = function() {
    return {
      severity: this.severity,
      predicted_impact: this.predicted_impact_score,
      affected_games_count: this.affected_games.length,
      status: this.status,
      time_unresolved: this.resolved_at 
        ? null 
        : Math.floor((new Date() - this.detected_at) / 1000 / 60) // minutes
    };
  };

  ConstraintConflict.prototype.markResolved = async function(resolutionId) {
    this.status = 'resolved';
    this.resolved_at = new Date();
    
    if (resolutionId) {
      this.conflict_data = {
        ...this.conflict_data,
        resolution_id: resolutionId
      };
    }
    
    await this.save();
  };

  ConstraintConflict.prototype.escalate = async function(reason) {
    this.status = 'escalated';
    this.conflict_data = {
      ...this.conflict_data,
      escalation_reason: reason,
      escalated_at: new Date()
    };
    
    await this.save();
  };

  ConstraintConflict.prototype.getSimilarConflicts = async function() {
    return await ConstraintConflict.findAll({
      where: {
        conflict_type: this.conflict_type,
        schedule_id: this.schedule_id,
        conflict_id: { [Op.ne]: this.conflict_id }
      },
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
    });
  };

  // Class methods
  ConstraintConflict.detectConflicts = async function(scheduleId, constraintInstances) {
    const conflicts = [];
    
    // Check each pair of constraints
    for (let i = 0; i < constraintInstances.length; i++) {
      for (let j = i + 1; j < constraintInstances.length; j++) {
        const conflict = await this.checkPairConflict(
          constraintInstances[i],
          constraintInstances[j],
          scheduleId
        );
        
        if (conflict) {
          conflicts.push(conflict);
        }
      }
    }
    
    // Group related conflicts
    const conflictGroups = this.groupRelatedConflicts(conflicts);
    
    // Save all conflicts
    const savedConflicts = [];
    for (const group of conflictGroups) {
      const groupId = sequelize.fn('uuid_generate_v4');
      
      for (let i = 0; i < group.length; i++) {
        const conflictData = {
          ...group[i],
          conflict_group_id: groupId,
          is_root_conflict: i === 0
        };
        
        const savedConflict = await this.create(conflictData);
        savedConflicts.push(savedConflict);
      }
    }
    
    return savedConflicts;
  };

  ConstraintConflict.checkPairConflict = async function(constraint1, constraint2, scheduleId) {
    // Basic conflict detection logic
    // This would be expanded based on specific constraint types
    
    if (constraint1.scope_type === 'venue' && constraint2.scope_type === 'venue') {
      const venues1 = constraint1.scope_data?.venue_ids || [];
      const venues2 = constraint2.scope_data?.venue_ids || [];
      
      const overlap = venues1.filter(v => venues2.includes(v));
      if (overlap.length > 0) {
        return {
          schedule_id: scheduleId,
          constraint_1_id: constraint1.instance_id,
          constraint_2_id: constraint2.instance_id,
          conflict_type: 'venue_conflict',
          severity: 'high',
          conflict_data: {
            overlapping_venues: overlap
          }
        };
      }
    }
    
    // Add more conflict detection logic here
    
    return null;
  };

  ConstraintConflict.groupRelatedConflicts = function(conflicts) {
    // Simple grouping by shared constraints
    const groups = [];
    const processed = new Set();
    
    conflicts.forEach(conflict => {
      if (processed.has(conflict)) return;
      
      const group = [conflict];
      processed.add(conflict);
      
      // Find all conflicts that share a constraint with this one
      conflicts.forEach(other => {
        if (processed.has(other)) return;
        
        if (conflict.constraint_1_id === other.constraint_1_id ||
            conflict.constraint_1_id === other.constraint_2_id ||
            conflict.constraint_2_id === other.constraint_1_id ||
            conflict.constraint_2_id === other.constraint_2_id) {
          group.push(other);
          processed.add(other);
        }
      });
      
      groups.push(group);
    });
    
    return groups;
  };

  ConstraintConflict.getActiveConflicts = async function(scheduleId, options = {}) {
    const where = {
      schedule_id: scheduleId,
      status: { [Op.notIn]: ['resolved', 'ignored'] }
    };
    
    if (options.severity) {
      where.severity = options.severity;
    }
    
    if (options.type) {
      where.conflict_type = options.type;
    }
    
    return await this.findAll({
      where,
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
      }],
      order: [
        ['severity', 'DESC'],
        ['detected_at', 'ASC']
      ]
    });
  };

  return ConstraintConflict;
};