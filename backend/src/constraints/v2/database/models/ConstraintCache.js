/**
 * Constraint Cache Model
 * Performance cache for expensive constraint computations
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const ConstraintCache = sequelize.define('ConstraintCache', {
    cache_key: {
      type: DataTypes.STRING(255),
      primaryKey: true,
      allowNull: false
    },
    cache_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of cached data (evaluation, conflict, resolution, etc.)'
    },
    cached_value: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: 'The cached computation result'
    },
    computation_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Time taken to compute the cached value'
    },
    hit_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: 'Number of times this cache entry was accessed'
    },
    last_hit_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Last time this cache entry was accessed'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When this cache entry expires'
    },
    is_stale: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: 'Whether this entry has been invalidated'
    },
    depends_on_constraints: {
      type: DataTypes.ARRAY(DataTypes.UUID),
      defaultValue: [],
      comment: 'Constraint instance IDs this cache depends on'
    },
    depends_on_games: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      comment: 'Game IDs this cache depends on'
    },
    depends_on_teams: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      defaultValue: [],
      comment: 'Team IDs this cache depends on'
    }
  }, {
    tableName: 'constraint_cache',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['cache_type']
      },
      {
        fields: ['expires_at']
      },
      {
        fields: ['is_stale', 'expires_at']
      },
      {
        fields: ['depends_on_constraints'],
        using: 'GIN'
      },
      {
        fields: ['depends_on_games'],
        using: 'GIN'
      },
      {
        fields: ['depends_on_teams'],
        using: 'GIN'
      }
    ]
  });

  // Instance methods
  ConstraintCache.prototype.recordHit = async function() {
    this.hit_count += 1;
    this.last_hit_at = new Date();
    await this.save();
  };

  ConstraintCache.prototype.isExpired = function() {
    return this.is_stale || new Date() > this.expires_at;
  };

  ConstraintCache.prototype.invalidate = async function() {
    this.is_stale = true;
    await this.save();
  };

  // Class methods
  ConstraintCache.get = async function(key, computeFunction = null) {
    const cached = await this.findByPk(key);
    
    if (cached && !cached.isExpired()) {
      // Record cache hit
      await cached.recordHit();
      return cached.cached_value;
    }
    
    // Cache miss or expired
    if (computeFunction) {
      const startTime = Date.now();
      const value = await computeFunction();
      const computationTime = Date.now() - startTime;
      
      // Store in cache
      await this.set(key, value, {
        computation_time_ms: computationTime
      });
      
      return value;
    }
    
    return null;
  };

  ConstraintCache.set = async function(key, value, options = {}) {
    const cacheData = {
      cache_key: key,
      cache_type: options.type || 'general',
      cached_value: value,
      computation_time_ms: options.computation_time_ms,
      expires_at: options.expires_at || new Date(Date.now() + (options.ttl || 3600000)), // Default 1 hour
      depends_on_constraints: options.depends_on_constraints || [],
      depends_on_games: options.depends_on_games || [],
      depends_on_teams: options.depends_on_teams || [],
      is_stale: false
    };
    
    return await this.upsert(cacheData);
  };

  ConstraintCache.invalidateByDependencies = async function(dependencies) {
    const conditions = [];
    
    if (dependencies.constraints && dependencies.constraints.length > 0) {
      conditions.push({
        depends_on_constraints: {
          [Op.overlap]: dependencies.constraints
        }
      });
    }
    
    if (dependencies.games && dependencies.games.length > 0) {
      conditions.push({
        depends_on_games: {
          [Op.overlap]: dependencies.games
        }
      });
    }
    
    if (dependencies.teams && dependencies.teams.length > 0) {
      conditions.push({
        depends_on_teams: {
          [Op.overlap]: dependencies.teams
        }
      });
    }
    
    if (conditions.length > 0) {
      const result = await this.update(
        { is_stale: true },
        {
          where: {
            [Op.or]: conditions,
            is_stale: false
          }
        }
      );
      
      return result[0]; // Number of rows affected
    }
    
    return 0;
  };

  ConstraintCache.cleanupExpired = async function() {
    const result = await this.destroy({
      where: {
        [Op.or]: [
          { expires_at: { [Op.lt]: new Date() } },
          { is_stale: true }
        ]
      }
    });
    
    return result; // Number of rows deleted
  };

  ConstraintCache.getStats = async function() {
    const stats = await this.findAll({
      attributes: [
        'cache_type',
        [sequelize.fn('COUNT', sequelize.col('cache_key')), 'entry_count'],
        [sequelize.fn('SUM', sequelize.col('hit_count')), 'total_hits'],
        [sequelize.fn('AVG', sequelize.col('hit_count')), 'avg_hits'],
        [sequelize.fn('AVG', sequelize.col('computation_time_ms')), 'avg_computation_time'],
        [sequelize.fn('SUM', 
          sequelize.literal('CASE WHEN is_stale = false AND expires_at > NOW() THEN 1 ELSE 0 END')
        ), 'valid_entries']
      ],
      group: ['cache_type']
    });
    
    const overall = await this.findOne({
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('cache_key')), 'total_entries'],
        [sequelize.fn('SUM', sequelize.col('hit_count')), 'total_hits'],
        [sequelize.fn('SUM', 
          sequelize.literal('CASE WHEN is_stale = false AND expires_at > NOW() THEN 1 ELSE 0 END')
        ), 'valid_entries']
      ]
    });
    
    return {
      by_type: stats.map(s => ({
        type: s.cache_type,
        entries: parseInt(s.dataValues.entry_count),
        hits: parseInt(s.dataValues.total_hits) || 0,
        avg_hits: parseFloat(s.dataValues.avg_hits) || 0,
        avg_computation_ms: parseFloat(s.dataValues.avg_computation_time) || 0,
        valid_entries: parseInt(s.dataValues.valid_entries) || 0
      })),
      overall: {
        total_entries: parseInt(overall.dataValues.total_entries) || 0,
        total_hits: parseInt(overall.dataValues.total_hits) || 0,
        valid_entries: parseInt(overall.dataValues.valid_entries) || 0,
        hit_rate: overall.dataValues.total_entries > 0 
          ? (overall.dataValues.total_hits / overall.dataValues.total_entries).toFixed(2)
          : 0
      }
    };
  };

  ConstraintCache.generateKey = function(type, params) {
    // Generate a consistent cache key based on type and parameters
    const sortedParams = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
    return `${type}:${sortedParams}`;
  };

  return ConstraintCache;
};