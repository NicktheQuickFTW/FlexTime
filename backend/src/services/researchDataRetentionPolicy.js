/**
 * Research Data Retention Policy
 * 
 * Defines which data is permanent vs temporary and manages retention rules
 */

const moment = require('moment');

class ResearchDataRetentionPolicy {
  constructor() {
    // Define data categories and their retention policies
    this.policies = {
      // PERMANENT DATA - Never deleted
      permanent: {
        tables: [
          'teams',
          'schools', 
          'sports',
          'compass_ratings',             // Historical COMPASS ratings
          'transfer_portal_activity',    // Historical transfer records
          'coaching_changes',            // Historical coaching changes
          'facility_investments',        // Infrastructure investments
          'nil_program_tracking',        // NIL program evolution
          'performance_benchmarks'       // Historical performance data
        ],
        description: 'Core data and historical records that provide long-term value',
        retention: 'permanent',
        exceptions: []
      },

      // SEMI-PERMANENT DATA - Retained for extended periods (2-5 years)
      semiPermanent: {
        tables: [
          'comprehensive_research_data', // Research snapshots (archival)
          'research_job_history',        // Keep for analysis and auditing
          'research_conflicts',          // Important for understanding data quality
          'research_feedback_adjustments' // System learning history
        ],
        description: 'Operational data useful for long-term analysis',
        retention: {
          comprehensive_research_data: 180, // 6 months before archival
          research_job_history: 730,     // 2 years
          research_conflicts: 1095,      // 3 years  
          research_feedback_adjustments: 1825 // 5 years
        }
      },

      // TEMPORARY DATA - Short retention (7-90 days)
      temporary: {
        tables: [
          'research_validations',        // Validation results
          'research_errors',            // Error logs
          'research_jobs',              // Job history
          'research_api_usage',         // API usage tracking
          'research_performance_metrics' // Performance metrics
        ],
        description: 'Operational data for monitoring and debugging',
        retention: {
          research_validations: 30,      // 30 days
          research_errors: 90,          // 90 days (unless unresolved)
          research_jobs: 90,            // 90 days
          research_api_usage: 7,        // 7 days
          research_performance_metrics: 30 // 30 days
        }
      },

      // CACHE DATA - Very short retention (1-7 days)
      cache: {
        tables: [
          'research_cache',             // Cached API responses
          'research_temp_results'       // Temporary processing results
        ],
        description: 'Cached data for performance optimization',
        retention: {
          research_cache: 1,            // 1 day
          research_temp_results: 3      // 3 days
        }
      }
    };

    // Special retention rules
    this.specialRules = {
      // Keep unresolved errors indefinitely
      keepUnresolvedErrors: true,
      
      // Keep data for championship/tournament seasons longer
      extendedRetentionForChampionships: true,
      
      // Keep data that resulted in major decisions (coaching changes, etc)
      preserveDecisionData: true,
      
      // Archive old data instead of deleting (move to cold storage)
      archiveBeforeDelete: true
    };
  }

  /**
   * Determine if data should be retained based on policy
   */
  shouldRetainData(tableName, record, recordAge) {
    // Check if table is permanent
    if (this.isPermanentData(tableName)) {
      return { retain: true, reason: 'permanent_data' };
    }

    // Get retention policy for table
    const retentionDays = this.getRetentionDays(tableName);
    if (retentionDays === null) {
      return { retain: true, reason: 'no_policy_defined' };
    }

    // Check age
    const ageInDays = moment().diff(moment(record.created_at), 'days');
    if (ageInDays <= retentionDays) {
      return { retain: true, reason: 'within_retention_period' };
    }

    // Apply special rules
    const specialRetention = this.applySpecialRules(tableName, record);
    if (specialRetention.retain) {
      return specialRetention;
    }

    return { retain: false, reason: 'exceeded_retention_period' };
  }

  /**
   * Check if table contains permanent data
   */
  isPermanentData(tableName) {
    return this.policies.permanent.tables.includes(tableName);
  }

  /**
   * Get retention period in days for a table
   */
  getRetentionDays(tableName) {
    // Check each policy category
    for (const [category, policy] of Object.entries(this.policies)) {
      if (category === 'permanent') continue;
      
      if (typeof policy.retention === 'object' && tableName in policy.retention) {
        return policy.retention[tableName];
      }
    }
    
    return null; // No policy defined
  }

  /**
   * Apply special retention rules
   */
  applySpecialRules(tableName, record) {
    // Keep unresolved errors
    if (tableName === 'research_errors' && 
        this.specialRules.keepUnresolvedErrors && 
        !record.resolved) {
      return { retain: true, reason: 'unresolved_error' };
    }

    // Keep championship season data longer
    if (this.specialRules.extendedRetentionForChampionships && 
        record.metadata && 
        (record.metadata.championship || record.metadata.tournament)) {
      return { retain: true, reason: 'championship_data' };
    }

    // Keep data related to major decisions
    if (this.specialRules.preserveDecisionData && 
        record.metadata && 
        record.metadata.decision_impact === 'high') {
      return { retain: true, reason: 'decision_data' };
    }

    // Check if data references permanent records
    if (this.hasReferencesToPermanentData(record)) {
      return { retain: true, reason: 'references_permanent_data' };
    }

    return { retain: false };
  }

  /**
   * Check if record has references to permanent data
   */
  hasReferencesToPermanentData(record) {
    // Check for foreign key references to permanent tables
    const permanentRefs = ['team_id', 'school_id', 'sport_id', 'coach_id'];
    
    for (const ref of permanentRefs) {
      if (record[ref] !== null && record[ref] !== undefined) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Generate cleanup queries based on retention policies
   */
  generateCleanupQueries() {
    const queries = [];
    
    // Process temporary data tables
    for (const [tableName, retentionDays] of Object.entries(this.policies.temporary.retention)) {
      queries.push({
        table: tableName,
        query: `
          DELETE FROM ${tableName}
          WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
          ${tableName === 'research_errors' ? 'AND resolved = true' : ''}
        `,
        description: `Delete ${tableName} records older than ${retentionDays} days`
      });
    }
    
    // Process cache data tables
    for (const [tableName, retentionDays] of Object.entries(this.policies.cache.retention)) {
      queries.push({
        table: tableName,
        query: `
          DELETE FROM ${tableName}
          WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
        `,
        description: `Delete ${tableName} records older than ${retentionDays} days`
      });
    }
    
    // Process semi-permanent data with archival
    if (this.specialRules.archiveBeforeDelete) {
      for (const [tableName, retentionDays] of Object.entries(this.policies.semiPermanent.retention)) {
        // Archive query
        queries.push({
          table: tableName,
          query: `
            INSERT INTO ${tableName}_archive
            SELECT * FROM ${tableName}
            WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
            ON CONFLICT DO NOTHING
          `,
          description: `Archive ${tableName} records older than ${retentionDays} days`,
          type: 'archive'
        });
        
        // Delete query (after archival)
        queries.push({
          table: tableName,
          query: `
            DELETE FROM ${tableName}
            WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
            AND EXISTS (
              SELECT 1 FROM ${tableName}_archive 
              WHERE ${tableName}_archive.id = ${tableName}.id
            )
          `,
          description: `Delete archived ${tableName} records`,
          type: 'delete_archived'
        });
      }
    }
    
    return queries;
  }

  /**
   * Get data statistics by retention category
   */
  async getDataStatistics(sequelize) {
    const stats = {
      permanent: {},
      semiPermanent: {},
      temporary: {},
      cache: {}
    };
    
    // Count records in each category
    for (const [category, policy] of Object.entries(this.policies)) {
      if (category === 'permanent') {
        // Just count total records for permanent tables
        for (const table of policy.tables) {
          try {
            const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
            stats.permanent[table] = parseInt(result[0].count);
          } catch (error) {
            stats.permanent[table] = 'N/A';
          }
        }
      } else if (policy.retention && typeof policy.retention === 'object') {
        // Count records by age for other categories
        for (const [table, days] of Object.entries(policy.retention)) {
          try {
            const [total] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
            const [eligible] = await sequelize.query(`
              SELECT COUNT(*) as count FROM ${table}
              WHERE created_at < NOW() - INTERVAL '${days} days'
            `);
            
            stats[category][table] = {
              total: parseInt(total[0].count),
              eligibleForDeletion: parseInt(eligible[0].count),
              retentionDays: days
            };
          } catch (error) {
            stats[category][table] = 'N/A';
          }
        }
      }
    }
    
    return stats;
  }

  /**
   * Generate retention policy report
   */
  generateReport() {
    const report = {
      timestamp: new Date(),
      policies: {}
    };
    
    // Summarize each policy category
    for (const [category, policy] of Object.entries(this.policies)) {
      report.policies[category] = {
        description: policy.description,
        tables: policy.tables || Object.keys(policy.retention),
        retention: policy.retention === 'permanent' ? 'permanent' : policy.retention
      };
    }
    
    report.specialRules = this.specialRules;
    
    return report;
  }

  /**
   * Validate that a proposed deletion adheres to retention policies
   */
  validateDeletion(tableName, filters = {}) {
    // Check if trying to delete from permanent table
    if (this.isPermanentData(tableName)) {
      return {
        allowed: false,
        reason: 'Cannot delete from permanent data tables',
        tableName,
        policy: 'permanent'
      };
    }
    
    // Check if filters are appropriate
    const retentionDays = this.getRetentionDays(tableName);
    if (retentionDays && filters.olderThan) {
      const requestedDays = moment().diff(moment(filters.olderThan), 'days');
      if (requestedDays < retentionDays) {
        return {
          allowed: false,
          reason: `Minimum retention period is ${retentionDays} days, requested ${requestedDays} days`,
          tableName,
          policy: retentionDays
        };
      }
    }
    
    return {
      allowed: true,
      tableName,
      filters
    };
  }
}

module.exports = ResearchDataRetentionPolicy;