/**
 * Constraint Category Model
 * Hierarchical categorization of constraints for organization
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintCategory = sequelize.define('ConstraintCategory', {
    category_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parent_category_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'constraint_categories',
        key: 'category_id'
      }
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Icon identifier for UI display'
    },
    color: {
      type: DataTypes.STRING(7),
      allowNull: true,
      validate: {
        is: /^#[0-9A-F]{6}$/i
      },
      comment: 'Hex color code for UI display'
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'constraint_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['name']
      },
      {
        fields: ['parent_category_id']
      },
      {
        fields: ['is_active', 'display_order']
      }
    ]
  });

  ConstraintCategory.associate = (models) => {
    // Self-referential relationship for hierarchy
    ConstraintCategory.belongsTo(models.ConstraintCategory, {
      as: 'parent',
      foreignKey: 'parent_category_id'
    });
    
    ConstraintCategory.hasMany(models.ConstraintCategory, {
      as: 'children',
      foreignKey: 'parent_category_id'
    });
    
    // Has many templates
    ConstraintCategory.hasMany(models.ConstraintTemplate, {
      foreignKey: 'category_id',
      as: 'templates'
    });
  };

  // Instance methods
  ConstraintCategory.prototype.getFullPath = async function() {
    const path = [this.name];
    let current = this;
    
    while (current.parent_category_id) {
      current = await ConstraintCategory.findByPk(current.parent_category_id);
      if (current) {
        path.unshift(current.name);
      }
    }
    
    return path.join(' > ');
  };

  // Class methods
  ConstraintCategory.getCategoryTree = async function() {
    const categories = await this.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['name', 'ASC']],
      include: [{
        model: this,
        as: 'children',
        required: false,
        where: { is_active: true }
      }]
    });
    
    // Build tree structure
    const rootCategories = categories.filter(cat => !cat.parent_category_id);
    return rootCategories;
  };

  return ConstraintCategory;
};