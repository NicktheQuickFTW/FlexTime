/**
 * Constraint Metric Model
 * Metrics for monitoring constraint system performance
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintMetric = sequelize.define('ConstraintMetric', {
    metric_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    metric_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of metric (evaluation_time, satisfaction_score, conflict_count, etc.)'
    },
    metric_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Specific metric name'
    },
    period_start: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Start of measurement period'
    },
    period_end: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'End of measurement period'
    },
    value: {
      type: DataTypes.DECIMAL(15, 4),
      allowNull: false,
      comment: 'Metric value'
    },
    count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: 'Number of measurements in this aggregation'
    },
    dimensions: {
      type: DataTypes.JSONB,
      defaultValue: {},
      comment: 'Additional dimensions for slicing data'
    },
    constraint_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'constraint_instances',
        key: 'instance_id'
      }
    },
    template_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'constraint_templates',
        key: 'template_id'
      }
    },
    schedule_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    tableName: 'constraint_metrics',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        fields: ['metric_type', 'period_start', 'period_end']
      },
      {
        fields: ['constraint_id']
      },
      {
        fields: ['template_id']
      },
      {
        fields: ['schedule_id']
      },
      {
        fields: ['dimensions'],
        using: 'GIN'
      }
    ]
  });

  ConstraintMetric.associate = (models) => {
    // Belongs to constraint instance
    ConstraintMetric.belongsTo(models.ConstraintInstance, {
      foreignKey: 'constraint_id',
      as: 'constraint'
    });
    
    // Belongs to constraint template
    ConstraintMetric.belongsTo(models.ConstraintTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
  };

  // Class methods
  ConstraintMetric.recordMetric = async function(metricData) {
    const {
      type,
      name,
      value,
      dimensions = {},
      constraint_id = null,
      template_id = null,
      schedule_id = null
    } = metricData;
    
    const now = new Date();
    const period_start = metricData.period_start || now;
    const period_end = metricData.period_end || now;
    
    return await this.create({
      metric_type: type,
      metric_name: name,
      period_start,
      period_end,
      value,
      dimensions,
      constraint_id,
      template_id,
      schedule_id
    });
  };

  ConstraintMetric.recordBatch = async function(metrics) {
    const records = metrics.map(m => ({
      metric_type: m.type,
      metric_name: m.name,
      period_start: m.period_start || new Date(),
      period_end: m.period_end || new Date(),
      value: m.value,
      count: m.count || 1,
      dimensions: m.dimensions || {},
      constraint_id: m.constraint_id || null,
      template_id: m.template_id || null,
      schedule_id: m.schedule_id || null
    }));
    
    return await this.bulkCreate(records);
  };

  ConstraintMetric.getTimeSeries = async function(metricType, options = {}) {
    const {
      start_date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Default 7 days
      end_date = new Date(),
      granularity = 'hour',
      dimensions = {},
      constraint_id = null,
      template_id = null
    } = options;
    
    const where = {
      metric_type: metricType,
      period_start: { [Op.gte]: start_date },
      period_end: { [Op.lte]: end_date }
    };
    
    if (constraint_id) where.constraint_id = constraint_id;
    if (template_id) where.template_id = template_id;
    
    // Add dimension filters
    Object.entries(dimensions).forEach(([key, value]) => {
      where[`dimensions.${key}`] = value;
    });
    
    const metrics = await this.findAll({
      where,
      order: [['period_start', 'ASC']]
    });
    
    // Aggregate by time bucket
    const buckets = {};
    metrics.forEach(metric => {
      const bucket = this.getTimeBucket(metric.period_start, granularity);
      if (!buckets[bucket]) {
        buckets[bucket] = {
          time: bucket,
          sum: 0,
          count: 0,
          min: Infinity,
          max: -Infinity
        };
      }
      
      buckets[bucket].sum += parseFloat(metric.value);
      buckets[bucket].count += metric.count;
      buckets[bucket].min = Math.min(buckets[bucket].min, parseFloat(metric.value));
      buckets[bucket].max = Math.max(buckets[bucket].max, parseFloat(metric.value));
    });
    
    // Convert to array and calculate averages
    return Object.values(buckets).map(b => ({
      time: b.time,
      value: b.sum / b.count,
      count: b.count,
      min: b.min,
      max: b.max
    }));
  };

  ConstraintMetric.getAggregates = async function(metricType, options = {}) {
    const {
      start_date,
      end_date,
      group_by = [],
      constraint_id,
      template_id
    } = options;
    
    const where = { metric_type: metricType };
    
    if (start_date) where.period_start = { [Op.gte]: start_date };
    if (end_date) where.period_end = { [Op.lte]: end_date };
    if (constraint_id) where.constraint_id = constraint_id;
    if (template_id) where.template_id = template_id;
    
    const attributes = [
      [sequelize.fn('AVG', sequelize.col('value')), 'avg_value'],
      [sequelize.fn('MIN', sequelize.col('value')), 'min_value'],
      [sequelize.fn('MAX', sequelize.col('value')), 'max_value'],
      [sequelize.fn('SUM', sequelize.col('value')), 'sum_value'],
      [sequelize.fn('SUM', sequelize.col('count')), 'total_count']
    ];
    
    // Add group by fields
    const groupFields = [];
    group_by.forEach(field => {
      if (field.startsWith('dimensions.')) {
        const dimKey = field.substring(11);
        attributes.push([
          sequelize.literal(`dimensions->>'${dimKey}'`),
          dimKey
        ]);
        groupFields.push(sequelize.literal(`dimensions->>'${dimKey}'`));
      } else {
        attributes.push(field);
        groupFields.push(field);
      }
    });
    
    const result = await this.findAll({
      where,
      attributes,
      group: groupFields.length > 0 ? groupFields : undefined,
      raw: true
    });
    
    return result.map(r => ({
      ...r,
      avg_value: parseFloat(r.avg_value),
      min_value: parseFloat(r.min_value),
      max_value: parseFloat(r.max_value),
      sum_value: parseFloat(r.sum_value),
      total_count: parseInt(r.total_count)
    }));
  };

  ConstraintMetric.getTopPerformers = async function(metricType, options = {}) {
    const {
      limit = 10,
      order = 'DESC',
      period_days = 7
    } = options;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - period_days);
    
    const results = await this.findAll({
      where: {
        metric_type: metricType,
        period_start: { [Op.gte]: startDate },
        constraint_id: { [Op.ne]: null }
      },
      attributes: [
        'constraint_id',
        [sequelize.fn('AVG', sequelize.col('value')), 'avg_value'],
        [sequelize.fn('COUNT', sequelize.col('metric_id')), 'measurement_count']
      ],
      group: ['constraint_id'],
      order: [[sequelize.literal('avg_value'), order]],
      limit,
      include: [{
        model: sequelize.models.ConstraintInstance,
        as: 'constraint',
        include: [{
          model: sequelize.models.ConstraintTemplate,
          as: 'template',
          attributes: ['name', 'type']
        }]
      }]
    });
    
    return results.map(r => ({
      constraint_id: r.constraint_id,
      constraint_name: r.constraint?.template?.name,
      constraint_type: r.constraint?.template?.type,
      avg_value: parseFloat(r.dataValues.avg_value),
      measurement_count: parseInt(r.dataValues.measurement_count)
    }));
  };

  ConstraintMetric.cleanup = async function(retentionDays = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const result = await this.destroy({
      where: {
        period_end: { [Op.lt]: cutoffDate }
      }
    });
    
    return result; // Number of records deleted
  };

  // Helper method
  ConstraintMetric.getTimeBucket = function(date, granularity) {
    const d = new Date(date);
    
    switch (granularity) {
      case 'minute':
        d.setSeconds(0, 0);
        break;
      case 'hour':
        d.setMinutes(0, 0, 0);
        break;
      case 'day':
        d.setHours(0, 0, 0, 0);
        break;
      case 'week':
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - d.getDay());
        break;
      case 'month':
        d.setHours(0, 0, 0, 0);
        d.setDate(1);
        break;
    }
    
    return d.toISOString();
  };

  return ConstraintMetric;
};