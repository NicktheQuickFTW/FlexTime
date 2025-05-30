/**
 * Constraint Template Model
 * Reusable constraint definitions with parameterized logic
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintTemplate = sequelize.define('ConstraintTemplate', {
    template_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'constraint_categories',
        key: 'category_id'
      }
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 200]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('hard', 'soft', 'preference'),
      allowNull: false,
      comment: 'Constraint type: hard (must satisfy), soft (should satisfy), preference (nice to have)'
    },
    sport: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Sport-specific constraint, NULL means applicable to all sports'
    },
    parameter_schema: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: 'JSON Schema for validating constraint parameters'
    },
    default_parameters: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Default values for parameters'
    },
    evaluation_type: {
      type: DataTypes.ENUM('simple', 'complex', 'ml_based', 'custom'),
      allowNull: false,
      comment: 'Type of evaluation logic'
    },
    evaluation_logic: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Custom evaluation function name or expression'
    },
    ml_model_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'ML model identifier if evaluation is ML-based'
    },
    ml_model_version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'ML model version'
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      defaultValue: [],
      comment: 'Tags for categorization and search'
    },
    is_system_template: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'System templates cannot be modified by users'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    },
    usage_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of times this template has been used'
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false
    },
    previous_version_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'constraint_templates',
        key: 'template_id'
      }
    },
    created_by: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'constraint_templates',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['category_id']
      },
      {
        fields: ['type', 'sport']
      },
      {
        fields: ['is_active', 'is_system_template']
      },
      {
        fields: ['tags'],
        using: 'GIN'
      },
      {
        fields: ['parameter_schema'],
        using: 'GIN'
      }
    ]
  });

  ConstraintTemplate.associate = (models) => {
    // Belongs to category
    ConstraintTemplate.belongsTo(models.ConstraintCategory, {
      foreignKey: 'category_id',
      as: 'category'
    });
    
    // Has many instances
    ConstraintTemplate.hasMany(models.ConstraintInstance, {
      foreignKey: 'template_id',
      as: 'instances'
    });
    
    // Self-referential for versioning
    ConstraintTemplate.belongsTo(models.ConstraintTemplate, {
      as: 'previousVersion',
      foreignKey: 'previous_version_id'
    });
    
    ConstraintTemplate.hasMany(models.ConstraintTemplate, {
      as: 'versions',
      foreignKey: 'previous_version_id'
    });
    
    // Has many metrics
    ConstraintTemplate.hasMany(models.ConstraintMetric, {
      foreignKey: 'template_id',
      as: 'metrics'
    });
  };

  // Instance methods
  ConstraintTemplate.prototype.incrementUsage = async function() {
    this.usage_count += 1;
    this.last_used_at = new Date();
    await this.save();
  };

  ConstraintTemplate.prototype.createNewVersion = async function(updates, userId) {
    const newVersion = await ConstraintTemplate.create({
      ...this.toJSON(),
      ...updates,
      template_id: undefined, // Let it generate a new ID
      version: this.version + 1,
      previous_version_id: this.template_id,
      created_by: userId,
      usage_count: 0,
      last_used_at: null
    });
    
    return newVersion;
  };

  ConstraintTemplate.prototype.validateParameters = function(parameters) {
    // In a real implementation, this would use a JSON Schema validator
    // For now, basic validation
    if (!this.parameter_schema.required) return true;
    
    for (const required of this.parameter_schema.required) {
      if (!parameters[required]) {
        throw new Error(`Missing required parameter: ${required}`);
      }
    }
    
    return true;
  };

  // Class methods
  ConstraintTemplate.getPopularTemplates = async function(limit = 10) {
    return await this.findAll({
      where: { 
        is_active: true,
        usage_count: { [sequelize.Op.gt]: 0 }
      },
      order: [['usage_count', 'DESC'], ['last_used_at', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.ConstraintCategory,
        as: 'category',
        attributes: ['name', 'color', 'icon']
      }]
    });
  };

  ConstraintTemplate.searchTemplates = async function(query, filters = {}) {
    const where = {
      is_active: true,
      [sequelize.Op.or]: [
        { name: { [sequelize.Op.iLike]: `%${query}%` } },
        { description: { [sequelize.Op.iLike]: `%${query}%` } },
        { tags: { [sequelize.Op.contains]: [query.toLowerCase()] } }
      ]
    };
    
    if (filters.type) where.type = filters.type;
    if (filters.sport) where.sport = filters.sport;
    if (filters.category_id) where.category_id = filters.category_id;
    
    return await this.findAll({
      where,
      include: [{
        model: sequelize.models.ConstraintCategory,
        as: 'category'
      }],
      order: [['usage_count', 'DESC']]
    });
  };

  return ConstraintTemplate;
};