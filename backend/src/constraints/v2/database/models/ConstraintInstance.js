/**
 * Constraint Instance Model
 * Actual constraints applied to specific schedules
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintInstance = sequelize.define('ConstraintInstance', {
    instance_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'constraint_templates',
        key: 'template_id'
      }
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'References the main schedules table'
    },
    parameters: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'Instance-specific parameter values'
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1.0,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Relative importance weight (0-100)'
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      allowNull: false,
      validate: {
        min: 1,
        max: 10
      },
      comment: 'Priority level (1-10, 10 being highest)'
    },
    scope_type: {
      type: DataTypes.ENUM('global', 'sport', 'team', 'venue', 'date_range'),
      allowNull: true,
      comment: 'Scope of constraint application'
    },
    scope_data: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: 'Scope details: sport_id, team_ids, venue_ids, date ranges, etc.'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    is_overridden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    override_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    valid_from: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Start date of constraint validity'
    },
    valid_until: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'End date of constraint validity'
    },
    applied_by: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'User who applied this constraint or "system"'
    },
    applied_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Tags for organization and filtering'
    }
  }, {
    tableName: 'constraint_instances',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['template_id']
      },
      {
        fields: ['schedule_id']
      },
      {
        fields: ['scope_type', 'is_active']
      },
      {
        fields: ['valid_from', 'valid_until']
      },
      {
        fields: ['scope_data'],
        using: 'GIN'
      },
      {
        fields: ['parameters'],
        using: 'GIN'
      }
    ]
  });

  ConstraintInstance.associate = (models) => {
    // Belongs to template
    ConstraintInstance.belongsTo(models.ConstraintTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
    
    // Has many evaluations
    ConstraintInstance.hasMany(models.ConstraintEvaluation, {
      foreignKey: 'instance_id',
      as: 'evaluations'
    });
    
    // Has many conflicts (as constraint 1)
    ConstraintInstance.hasMany(models.ConstraintConflict, {
      foreignKey: 'constraint_1_id',
      as: 'conflictsAsFirst'
    });
    
    // Has many conflicts (as constraint 2)
    ConstraintInstance.hasMany(models.ConstraintConflict, {
      foreignKey: 'constraint_2_id',
      as: 'conflictsAsSecond'
    });
    
    // Has many resolutions (as winning constraint)
    ConstraintInstance.hasMany(models.ConstraintResolution, {
      foreignKey: 'winning_constraint_id',
      as: 'wonResolutions'
    });
    
    // Has many metrics
    ConstraintInstance.hasMany(models.ConstraintMetric, {
      foreignKey: 'constraint_id',
      as: 'metrics'
    });
  };

  // Instance methods
  ConstraintInstance.prototype.isValidForDate = function(date) {
    const checkDate = new Date(date);
    
    if (this.valid_from && checkDate < new Date(this.valid_from)) {
      return false;
    }
    
    if (this.valid_until && checkDate > new Date(this.valid_until)) {
      return false;
    }
    
    return true;
  };

  ConstraintInstance.prototype.appliesTo = function(entityType, entityId) {
    if (!this.scope_type || this.scope_type === 'global') {
      return true;
    }
    
    if (!this.scope_data) {
      return false;
    }
    
    switch (this.scope_type) {
      case 'sport':
        return this.scope_data.sport_id === entityId;
      
      case 'team':
        return this.scope_data.team_ids && 
               this.scope_data.team_ids.includes(entityId);
      
      case 'venue':
        return this.scope_data.venue_ids && 
               this.scope_data.venue_ids.includes(entityId);
      
      default:
        return false;
    }
  };

  ConstraintInstance.prototype.getLatestEvaluation = async function() {
    return await sequelize.models.ConstraintEvaluation.findOne({
      where: {
        instance_id: this.instance_id,
        is_latest: true
      },
      order: [['evaluated_at', 'DESC']]
    });
  };

  ConstraintInstance.prototype.getActiveConflicts = async function() {
    return await sequelize.models.ConstraintConflict.findAll({
      where: {
        [Op.or]: [
          { constraint_1_id: this.instance_id },
          { constraint_2_id: this.instance_id }
        ],
        status: { [Op.ne]: 'resolved' }
      },
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
  };

  // Class methods
  ConstraintInstance.getActiveForSchedule = async function(scheduleId, options = {}) {
    const where = {
      schedule_id: scheduleId,
      is_active: true,
      is_overridden: false
    };
    
    if (options.date) {
      where[Op.and] = [
        {
          [Op.or]: [
            { valid_from: null },
            { valid_from: { [Op.lte]: options.date } }
          ]
        },
        {
          [Op.or]: [
            { valid_until: null },
            { valid_until: { [Op.gte]: options.date } }
          ]
        }
      ];
    }
    
    if (options.scopeType) {
      where.scope_type = options.scopeType;
    }
    
    return await this.findAll({
      where,
      include: [{
        model: sequelize.models.ConstraintTemplate,
        as: 'template',
        include: [{
          model: sequelize.models.ConstraintCategory,
          as: 'category'
        }]
      }],
      order: [['priority', 'DESC'], ['weight', 'DESC']]
    });
  };

  ConstraintInstance.createFromTemplate = async function(templateId, data) {
    const template = await sequelize.models.ConstraintTemplate.findByPk(templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    
    // Merge default parameters with provided parameters
    const parameters = {
      ...template.default_parameters,
      ...data.parameters
    };
    
    // Validate parameters against schema
    template.validateParameters(parameters);
    
    // Create instance
    const instance = await this.create({
      template_id: templateId,
      ...data,
      parameters
    });
    
    // Increment template usage
    await template.incrementUsage();
    
    return instance;
  };

  return ConstraintInstance;
};