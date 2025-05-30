/**
 * Optimized SQL Queries for Constraint System
 * High-performance queries for common constraint operations
 */

export const ConstraintQueries = {
  /**
   * Get all active constraints for a schedule with full details
   */
  getActiveConstraintsWithDetails: `
    WITH active_constraints AS (
      SELECT 
        ci.*,
        ct.name as template_name,
        ct.type as constraint_type,
        ct.evaluation_type,
        ct.evaluation_logic,
        cc.name as category_name,
        cc.color as category_color,
        cc.icon as category_icon
      FROM constraint_instances ci
      INNER JOIN constraint_templates ct ON ci.template_id = ct.template_id
      LEFT JOIN constraint_categories cc ON ct.category_id = cc.category_id
      WHERE ci.schedule_id = $1
        AND ci.is_active = true
        AND ci.is_overridden = false
        AND (ci.valid_from IS NULL OR ci.valid_from <= CURRENT_DATE)
        AND (ci.valid_until IS NULL OR ci.valid_until >= CURRENT_DATE)
    ),
    latest_evaluations AS (
      SELECT 
        ce.instance_id,
        ce.is_satisfied,
        ce.satisfaction_score,
        ce.evaluation_time_ms,
        ce.evaluated_at
      FROM constraint_evaluations ce
      WHERE ce.is_latest = true
        AND ce.schedule_id = $1
    ),
    active_conflicts AS (
      SELECT 
        cc.constraint_1_id,
        cc.constraint_2_id,
        cc.conflict_type,
        cc.severity,
        cc.status
      FROM constraint_conflicts cc
      WHERE cc.schedule_id = $1
        AND cc.status NOT IN ('resolved', 'ignored')
    )
    SELECT 
      ac.*,
      le.is_satisfied,
      le.satisfaction_score,
      le.evaluation_time_ms,
      le.evaluated_at,
      COALESCE(
        (SELECT COUNT(*) 
         FROM active_conflicts 
         WHERE constraint_1_id = ac.instance_id 
            OR constraint_2_id = ac.instance_id
        ), 0
      ) as conflict_count
    FROM active_constraints ac
    LEFT JOIN latest_evaluations le ON ac.instance_id = le.instance_id
    ORDER BY ac.priority DESC, ac.weight DESC;
  `,

  /**
   * Get constraint evaluation summary by category
   */
  getEvaluationSummaryByCategory: `
    SELECT 
      cc.category_id,
      cc.name as category_name,
      cc.color,
      cc.icon,
      COUNT(DISTINCT ci.instance_id) as constraint_count,
      COUNT(DISTINCT ce.evaluation_id) as evaluation_count,
      AVG(ce.satisfaction_score) as avg_satisfaction,
      SUM(CASE WHEN ce.is_satisfied THEN 1 ELSE 0 END) as satisfied_count,
      SUM(CASE WHEN NOT ce.is_satisfied THEN 1 ELSE 0 END) as violated_count,
      AVG(ce.evaluation_time_ms) as avg_eval_time_ms
    FROM constraint_categories cc
    INNER JOIN constraint_templates ct ON cc.category_id = ct.category_id
    INNER JOIN constraint_instances ci ON ct.template_id = ci.template_id
    LEFT JOIN constraint_evaluations ce ON ci.instance_id = ce.instance_id AND ce.is_latest = true
    WHERE ci.schedule_id = $1
      AND ci.is_active = true
    GROUP BY cc.category_id, cc.name, cc.color, cc.icon
    ORDER BY cc.display_order;
  `,

  /**
   * Get conflict clusters for a schedule
   */
  getConflictClusters: `
    WITH RECURSIVE conflict_graph AS (
      -- Base case: all active conflicts
      SELECT 
        cc.conflict_id,
        cc.constraint_1_id,
        cc.constraint_2_id,
        cc.conflict_type,
        cc.severity,
        cc.conflict_group_id,
        ARRAY[cc.conflict_id] as path,
        1 as depth
      FROM constraint_conflicts cc
      WHERE cc.schedule_id = $1
        AND cc.status NOT IN ('resolved', 'ignored')
      
      UNION ALL
      
      -- Recursive case: find connected conflicts
      SELECT 
        cc.conflict_id,
        cc.constraint_1_id,
        cc.constraint_2_id,
        cc.conflict_type,
        cc.severity,
        cg.conflict_group_id,
        cg.path || cc.conflict_id,
        cg.depth + 1
      FROM constraint_conflicts cc
      INNER JOIN conflict_graph cg ON (
        cc.constraint_1_id IN (cg.constraint_1_id, cg.constraint_2_id)
        OR cc.constraint_2_id IN (cg.constraint_1_id, cg.constraint_2_id)
      )
      WHERE cc.schedule_id = $1
        AND cc.status NOT IN ('resolved', 'ignored')
        AND NOT (cc.conflict_id = ANY(cg.path))
        AND cg.depth < 10  -- Prevent infinite recursion
    )
    SELECT 
      conflict_group_id,
      COUNT(DISTINCT conflict_id) as conflict_count,
      COUNT(DISTINCT constraint_1_id) + COUNT(DISTINCT constraint_2_id) as involved_constraints,
      MAX(CASE 
        WHEN severity = 'critical' THEN 4
        WHEN severity = 'high' THEN 3
        WHEN severity = 'medium' THEN 2
        WHEN severity = 'low' THEN 1
      END) as max_severity_level,
      ARRAY_AGG(DISTINCT conflict_type) as conflict_types
    FROM conflict_graph
    GROUP BY conflict_group_id
    ORDER BY max_severity_level DESC, conflict_count DESC;
  `,

  /**
   * Get constraint performance metrics over time
   */
  getPerformanceMetrics: `
    SELECT 
      date_trunc($2, cm.period_start) as time_bucket,
      cm.metric_type,
      AVG(cm.value) as avg_value,
      MIN(cm.value) as min_value,
      MAX(cm.value) as max_value,
      STDDEV(cm.value) as stddev_value,
      SUM(cm.count) as total_count,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY cm.value) as median_value,
      PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY cm.value) as p95_value
    FROM constraint_metrics cm
    WHERE cm.metric_type = ANY($3::text[])
      AND cm.period_start >= $4
      AND cm.period_end <= $5
      AND ($6::integer IS NULL OR cm.schedule_id = $6)
    GROUP BY time_bucket, cm.metric_type
    ORDER BY time_bucket, cm.metric_type;
  `,

  /**
   * Get resolution effectiveness analysis
   */
  getResolutionEffectiveness: `
    SELECT 
      cr.resolution_type,
      cr.resolution_strategy,
      COUNT(*) as usage_count,
      AVG(cr.quality_score) as avg_quality,
      SUM(CASE WHEN cr.was_successful THEN 1 ELSE 0 END) as success_count,
      AVG(CASE WHEN cr.was_successful THEN 1 ELSE 0 END) as success_rate,
      AVG(EXTRACT(EPOCH FROM (cr.implemented_at - cr.created_at))/60) as avg_implementation_minutes,
      AVG(CARDINALITY(cr.games_affected)) as avg_games_affected,
      JSONB_OBJECT_AGG(
        COALESCE(stakeholder_key, 'overall'),
        AVG(CAST(stakeholder_value AS FLOAT))
      ) as avg_stakeholder_satisfaction
    FROM constraint_resolutions cr
    CROSS JOIN LATERAL jsonb_each_text(cr.stakeholder_satisfaction) AS s(stakeholder_key, stakeholder_value)
    WHERE cr.created_at >= $1
      AND cr.created_at <= $2
      AND ($3::text IS NULL OR cr.resolution_type = $3)
    GROUP BY cr.resolution_type, cr.resolution_strategy
    ORDER BY success_rate DESC, usage_count DESC;
  `,

  /**
   * Get constraint impact analysis
   */
  getConstraintImpactAnalysis: `
    WITH constraint_impacts AS (
      SELECT 
        ci.instance_id,
        ct.name as constraint_name,
        ct.type as constraint_type,
        ci.weight,
        ci.priority,
        AVG(ce.satisfaction_score) as avg_satisfaction,
        COUNT(ce.evaluation_id) as evaluation_count,
        COUNT(DISTINCT CASE 
          WHEN cc1.conflict_id IS NOT NULL OR cc2.conflict_id IS NOT NULL 
          THEN COALESCE(cc1.conflict_id, cc2.conflict_id) 
        END) as conflict_count,
        AVG(ce.evaluation_time_ms) as avg_eval_time,
        -- Calculate impact score
        (ci.weight / 100.0) * 
        (1.0 - COALESCE(AVG(ce.satisfaction_score), 0.5)) * 
        (1.0 + COUNT(DISTINCT COALESCE(cc1.conflict_id, cc2.conflict_id)) * 0.1) as impact_score
      FROM constraint_instances ci
      INNER JOIN constraint_templates ct ON ci.template_id = ct.template_id
      LEFT JOIN constraint_evaluations ce ON ci.instance_id = ce.instance_id AND ce.is_latest = true
      LEFT JOIN constraint_conflicts cc1 ON ci.instance_id = cc1.constraint_1_id 
        AND cc1.status NOT IN ('resolved', 'ignored')
      LEFT JOIN constraint_conflicts cc2 ON ci.instance_id = cc2.constraint_2_id 
        AND cc2.status NOT IN ('resolved', 'ignored')
      WHERE ci.schedule_id = $1
        AND ci.is_active = true
      GROUP BY ci.instance_id, ct.name, ct.type, ci.weight, ci.priority
    )
    SELECT 
      *,
      RANK() OVER (ORDER BY impact_score DESC) as impact_rank,
      CASE 
        WHEN impact_score >= 0.7 THEN 'critical'
        WHEN impact_score >= 0.5 THEN 'high'
        WHEN impact_score >= 0.3 THEN 'medium'
        ELSE 'low'
      END as impact_level
    FROM constraint_impacts
    ORDER BY impact_score DESC
    LIMIT $2;
  `,

  /**
   * Get cache hit rates and performance
   */
  getCachePerformance: `
    SELECT 
      cache_type,
      COUNT(*) as total_entries,
      SUM(hit_count) as total_hits,
      AVG(hit_count) as avg_hits_per_entry,
      AVG(computation_time_ms) as avg_computation_time,
      SUM(CASE WHEN is_stale = false AND expires_at > NOW() THEN 1 ELSE 0 END) as valid_entries,
      SUM(CASE WHEN is_stale = true THEN 1 ELSE 0 END) as stale_entries,
      SUM(CASE WHEN expires_at <= NOW() THEN 1 ELSE 0 END) as expired_entries,
      -- Calculate hit rate for valid entries
      CASE 
        WHEN SUM(CASE WHEN is_stale = false AND expires_at > NOW() THEN 1 ELSE 0 END) > 0
        THEN SUM(CASE WHEN is_stale = false AND expires_at > NOW() THEN hit_count ELSE 0 END)::FLOAT / 
             SUM(CASE WHEN is_stale = false AND expires_at > NOW() THEN 1 ELSE 0 END)
        ELSE 0
      END as valid_entry_hit_rate,
      -- Memory estimation (rough)
      SUM(pg_column_size(cached_value)) / 1024 as total_size_kb
    FROM constraint_cache
    GROUP BY cache_type
    ORDER BY total_hits DESC;
  `,

  /**
   * Get suggested constraint relaxations
   */
  getSuggestedRelaxations: `
    WITH low_satisfaction_constraints AS (
      SELECT 
        ci.instance_id,
        ct.name as constraint_name,
        ct.type as constraint_type,
        ci.weight,
        AVG(ce.satisfaction_score) as avg_satisfaction,
        COUNT(DISTINCT cc.conflict_id) as conflict_count
      FROM constraint_instances ci
      INNER JOIN constraint_templates ct ON ci.template_id = ct.template_id
      INNER JOIN constraint_evaluations ce ON ci.instance_id = ce.instance_id AND ce.is_latest = true
      LEFT JOIN (
        SELECT constraint_1_id as constraint_id, conflict_id FROM constraint_conflicts
        UNION ALL
        SELECT constraint_2_id as constraint_id, conflict_id FROM constraint_conflicts
      ) cc ON ci.instance_id = cc.constraint_id
      WHERE ci.schedule_id = $1
        AND ci.is_active = true
        AND ct.type IN ('soft', 'preference')
        AND ce.satisfaction_score < 0.5
      GROUP BY ci.instance_id, ct.name, ct.type, ci.weight
      HAVING AVG(ce.satisfaction_score) < 0.5
    )
    SELECT 
      instance_id,
      constraint_name,
      constraint_type,
      weight,
      avg_satisfaction,
      conflict_count,
      CASE 
        WHEN weight > 50 THEN weight * 0.8  -- Reduce high weights by 20%
        WHEN weight > 20 THEN weight * 0.9  -- Reduce medium weights by 10%
        ELSE weight  -- Keep low weights
      END as suggested_weight,
      CASE 
        WHEN conflict_count > 5 THEN 'High conflict rate - consider relaxing parameters'
        WHEN avg_satisfaction < 0.3 THEN 'Very low satisfaction - review constraint necessity'
        ELSE 'Low satisfaction - adjust weight or parameters'
      END as recommendation
    FROM low_satisfaction_constraints
    ORDER BY avg_satisfaction ASC, conflict_count DESC
    LIMIT 10;
  `
};

/**
 * Query parameter types for TypeScript
 */
export interface QueryParams {
  getActiveConstraintsWithDetails: [scheduleId: number];
  getEvaluationSummaryByCategory: [scheduleId: number];
  getConflictClusters: [scheduleId: number];
  getPerformanceMetrics: [
    scheduleId: number,
    granularity: string,
    metricTypes: string[],
    startDate: Date,
    endDate: Date,
    scheduleIdFilter: number | null
  ];
  getResolutionEffectiveness: [
    startDate: Date,
    endDate: Date,
    resolutionType: string | null
  ];
  getConstraintImpactAnalysis: [scheduleId: number, limit: number];
  getCachePerformance: [];
  getSuggestedRelaxations: [scheduleId: number];
}

/**
 * Prepared statement manager for performance
 */
export class ConstraintQueryManager {
  private preparedStatements: Map<string, any> = new Map();

  constructor(private db: any) {}

  async prepare() {
    for (const [name, sql] of Object.entries(ConstraintQueries)) {
      // Prepare statements for better performance
      this.preparedStatements.set(name, sql);
    }
  }

  async execute<K extends keyof QueryParams>(
    queryName: K,
    params: QueryParams[K]
  ): Promise<any[]> {
    const sql = this.preparedStatements.get(queryName);
    if (!sql) {
      throw new Error(`Query ${queryName} not found`);
    }

    return await this.db.query(sql, params);
  }

  async executeWithExplain<K extends keyof QueryParams>(
    queryName: K,
    params: QueryParams[K]
  ): Promise<{ results: any[], plan: any[] }> {
    const sql = this.preparedStatements.get(queryName);
    if (!sql) {
      throw new Error(`Query ${queryName} not found`);
    }

    const explainSql = `EXPLAIN (ANALYZE, BUFFERS) ${sql}`;
    const plan = await this.db.query(explainSql, params);
    const results = await this.db.query(sql, params);

    return { results, plan };
  }
}