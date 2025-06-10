-- FlexTime Constraints V2 Database Functions
-- Migration: 002_create_constraint_functions.sql
-- Description: Create stored procedures and functions for constraint operations

-- Function to validate constraint parameters against schema
CREATE OR REPLACE FUNCTION validate_constraint_parameters(
    p_parameters JSONB,
    p_schema JSONB
) RETURNS BOOLEAN AS $$
DECLARE
    v_is_valid BOOLEAN := true;
BEGIN
    -- Basic validation - ensure all required fields are present
    -- This is a simplified version; in production, use a full JSON Schema validator
    IF p_schema IS NOT NULL AND p_schema ? 'required' THEN
        FOR i IN 0..jsonb_array_length(p_schema->'required') - 1 LOOP
            IF NOT p_parameters ? (p_schema->'required'->i)::TEXT THEN
                v_is_valid := false;
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RETURN v_is_valid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate constraint satisfaction score
CREATE OR REPLACE FUNCTION calculate_satisfaction_score(
    p_constraint_type VARCHAR,
    p_evaluation_data JSONB
) RETURNS DECIMAL AS $$
DECLARE
    v_score DECIMAL(5,4) := 0.0;
BEGIN
    -- Base calculation logic (to be extended based on constraint type)
    CASE p_constraint_type
        WHEN 'hard' THEN
            -- Hard constraints are binary: 1.0 or 0.0
            v_score := CASE 
                WHEN (p_evaluation_data->>'is_satisfied')::BOOLEAN THEN 1.0 
                ELSE 0.0 
            END;
        WHEN 'soft' THEN
            -- Soft constraints can have partial satisfaction
            v_score := COALESCE((p_evaluation_data->>'score')::DECIMAL, 0.5);
        WHEN 'preference' THEN
            -- Preferences use weighted scoring
            v_score := COALESCE((p_evaluation_data->>'weighted_score')::DECIMAL, 0.7);
        ELSE
            v_score := 0.5; -- Default middle score
    END CASE;
    
    -- Ensure score is within bounds
    v_score := GREATEST(0.0, LEAST(1.0, v_score));
    
    RETURN v_score;
END;
$$ LANGUAGE plpgsql;

-- Function to detect constraint conflicts
CREATE OR REPLACE FUNCTION detect_constraint_conflicts(
    p_schedule_id INTEGER
) RETURNS TABLE(
    constraint_1_id UUID,
    constraint_2_id UUID,
    conflict_type VARCHAR,
    severity VARCHAR,
    conflict_details JSONB
) AS $$
BEGIN
    -- This is a simplified conflict detection
    -- In practice, this would use more sophisticated logic
    RETURN QUERY
    WITH active_constraints AS (
        SELECT 
            ci.instance_id,
            ci.template_id,
            ci.parameters,
            ci.scope_type,
            ci.scope_data,
            ct.type,
            ct.category_id
        FROM constraint_instances ci
        JOIN constraint_templates ct ON ci.template_id = ct.template_id
        WHERE ci.schedule_id = p_schedule_id
          AND ci.is_active = true
    ),
    potential_conflicts AS (
        SELECT 
            c1.instance_id AS constraint_1,
            c2.instance_id AS constraint_2,
            CASE 
                WHEN c1.scope_data ?| ARRAY['team_ids'] 
                 AND c2.scope_data ?| ARRAY['team_ids']
                 AND c1.scope_data->'team_ids' ?| ARRAY(
                     SELECT jsonb_array_elements_text(c2.scope_data->'team_ids')
                 ) THEN 'team_overlap'
                WHEN c1.scope_data ?| ARRAY['venue_ids'] 
                 AND c2.scope_data ?| ARRAY['venue_ids']
                 AND c1.scope_data->'venue_ids' ?| ARRAY(
                     SELECT jsonb_array_elements_text(c2.scope_data->'venue_ids')
                 ) THEN 'venue_conflict'
                ELSE 'scope_conflict'
            END AS conflict_type,
            CASE 
                WHEN c1.type = 'hard' AND c2.type = 'hard' THEN 'critical'
                WHEN c1.type = 'hard' OR c2.type = 'hard' THEN 'high'
                ELSE 'medium'
            END AS severity
        FROM active_constraints c1
        CROSS JOIN active_constraints c2
        WHERE c1.instance_id < c2.instance_id  -- Avoid duplicates
          AND (
              -- Check for overlapping scopes
              (c1.scope_type = c2.scope_type AND c1.scope_type != 'global')
              OR (c1.scope_type = 'global' OR c2.scope_type = 'global')
          )
    )
    SELECT 
        pc.constraint_1,
        pc.constraint_2,
        pc.conflict_type,
        pc.severity,
        jsonb_build_object(
            'detected_at', CURRENT_TIMESTAMP,
            'auto_detected', true
        ) AS conflict_details
    FROM potential_conflicts pc;
END;
$$ LANGUAGE plpgsql;

-- Function to get constraint evaluation history
CREATE OR REPLACE FUNCTION get_constraint_evaluation_history(
    p_instance_id UUID,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    evaluation_id UUID,
    is_satisfied BOOLEAN,
    satisfaction_score DECIMAL,
    evaluated_at TIMESTAMP WITH TIME ZONE,
    evaluation_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ce.evaluation_id,
        ce.is_satisfied,
        ce.satisfaction_score,
        ce.evaluated_at,
        ce.evaluation_data
    FROM constraint_evaluations ce
    WHERE ce.instance_id = p_instance_id
    ORDER BY ce.evaluated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate constraint impact score
CREATE OR REPLACE FUNCTION calculate_constraint_impact(
    p_instance_id UUID
) RETURNS DECIMAL AS $$
DECLARE
    v_impact_score DECIMAL(5,4);
    v_evaluation_count INTEGER;
    v_satisfaction_avg DECIMAL(5,4);
    v_conflict_count INTEGER;
    v_weight DECIMAL(5,2);
BEGIN
    -- Get constraint weight
    SELECT weight INTO v_weight
    FROM constraint_instances
    WHERE instance_id = p_instance_id;
    
    -- Get evaluation statistics
    SELECT 
        COUNT(*),
        AVG(satisfaction_score)
    INTO v_evaluation_count, v_satisfaction_avg
    FROM constraint_evaluations
    WHERE instance_id = p_instance_id
      AND is_latest = true;
    
    -- Get conflict count
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM constraint_conflicts
    WHERE (constraint_1_id = p_instance_id OR constraint_2_id = p_instance_id)
      AND status != 'resolved';
    
    -- Calculate impact score
    -- Higher weight, lower satisfaction, and more conflicts = higher impact
    v_impact_score := (v_weight / 100.0) * 
                      (1.0 - COALESCE(v_satisfaction_avg, 0.5)) * 
                      (1.0 + (v_conflict_count * 0.1));
    
    -- Normalize to 0-1 range
    v_impact_score := GREATEST(0.0, LEAST(1.0, v_impact_score));
    
    RETURN v_impact_score;
END;
$$ LANGUAGE plpgsql;

-- Function to suggest constraint resolutions
CREATE OR REPLACE FUNCTION suggest_constraint_resolution(
    p_conflict_id UUID
) RETURNS TABLE(
    strategy VARCHAR,
    confidence DECIMAL,
    suggested_changes JSONB
) AS $$
DECLARE
    v_constraint_1_id UUID;
    v_constraint_2_id UUID;
    v_conflict_type VARCHAR;
BEGIN
    -- Get conflict details
    SELECT 
        constraint_1_id,
        constraint_2_id,
        conflict_type
    INTO v_constraint_1_id, v_constraint_2_id, v_conflict_type
    FROM constraint_conflicts
    WHERE conflict_id = p_conflict_id;
    
    -- Generate resolution suggestions based on conflict type
    RETURN QUERY
    SELECT 
        'priority_based' AS strategy,
        0.8 AS confidence,
        jsonb_build_object(
            'action', 'prioritize_higher_weight',
            'keep_constraint', 
            CASE 
                WHEN c1.weight >= c2.weight THEN v_constraint_1_id 
                ELSE v_constraint_2_id 
            END
        ) AS suggested_changes
    FROM constraint_instances c1, constraint_instances c2
    WHERE c1.instance_id = v_constraint_1_id
      AND c2.instance_id = v_constraint_2_id
    
    UNION ALL
    
    SELECT 
        'time_shift' AS strategy,
        0.6 AS confidence,
        jsonb_build_object(
            'action', 'adjust_time_windows',
            'shift_amount', '2 hours'
        ) AS suggested_changes
    WHERE v_conflict_type IN ('venue_conflict', 'team_overlap')
    
    UNION ALL
    
    SELECT 
        'relaxation' AS strategy,
        0.5 AS confidence,
        jsonb_build_object(
            'action', 'relax_soft_constraint',
            'target_constraint', v_constraint_2_id
        ) AS suggested_changes
    FROM constraint_instances c1, constraint_instances c2, 
         constraint_templates t1, constraint_templates t2
    WHERE c1.instance_id = v_constraint_1_id
      AND c2.instance_id = v_constraint_2_id
      AND t1.template_id = c1.template_id
      AND t2.template_id = c2.template_id
      AND t1.type = 'hard' 
      AND t2.type = 'soft';
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache() RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM constraint_cache
    WHERE expires_at < CURRENT_TIMESTAMP
       OR is_stale = true;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to invalidate cache based on dependencies
CREATE OR REPLACE FUNCTION invalidate_constraint_cache(
    p_constraint_ids UUID[],
    p_game_ids INTEGER[],
    p_team_ids INTEGER[]
) RETURNS INTEGER AS $$
DECLARE
    v_invalidated_count INTEGER;
BEGIN
    UPDATE constraint_cache
    SET is_stale = true
    WHERE (
        (p_constraint_ids IS NOT NULL AND depends_on_constraints && p_constraint_ids)
        OR (p_game_ids IS NOT NULL AND depends_on_games && p_game_ids)
        OR (p_team_ids IS NOT NULL AND depends_on_teams && p_team_ids)
    )
    AND is_stale = false;
    
    GET DIAGNOSTICS v_invalidated_count = ROW_COUNT;
    
    RETURN v_invalidated_count;
END;
$$ LANGUAGE plpgsql;

-- Function to aggregate constraint metrics
CREATE OR REPLACE FUNCTION aggregate_constraint_metrics(
    p_metric_type VARCHAR,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_group_by VARCHAR DEFAULT 'hour'
) RETURNS TABLE(
    period TIMESTAMP WITH TIME ZONE,
    avg_value DECIMAL,
    min_value DECIMAL,
    max_value DECIMAL,
    total_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH time_buckets AS (
        SELECT 
            date_trunc(p_group_by, period_start) AS bucket,
            value,
            count
        FROM constraint_metrics
        WHERE metric_type = p_metric_type
          AND period_start >= p_start_time
          AND period_end <= p_end_time
    )
    SELECT 
        bucket AS period,
        AVG(value) AS avg_value,
        MIN(value) AS min_value,
        MAX(value) AS max_value,
        SUM(count)::INTEGER AS total_count
    FROM time_buckets
    GROUP BY bucket
    ORDER BY bucket;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for frequently accessed constraint statistics
CREATE MATERIALIZED VIEW constraint_statistics AS
SELECT 
    ct.template_id,
    ct.name AS template_name,
    ct.type AS constraint_type,
    COUNT(DISTINCT ci.instance_id) AS instance_count,
    COUNT(DISTINCT ci.schedule_id) AS schedule_count,
    AVG(ci.weight) AS avg_weight,
    COUNT(DISTINCT ce.evaluation_id) AS evaluation_count,
    AVG(ce.satisfaction_score) AS avg_satisfaction,
    COUNT(DISTINCT cc.conflict_id) AS conflict_count,
    MAX(ci.updated_at) AS last_updated
FROM constraint_templates ct
LEFT JOIN constraint_instances ci ON ct.template_id = ci.template_id
LEFT JOIN constraint_evaluations ce ON ci.instance_id = ce.instance_id AND ce.is_latest = true
LEFT JOIN constraint_conflicts cc ON ci.instance_id IN (cc.constraint_1_id, cc.constraint_2_id)
GROUP BY ct.template_id, ct.name, ct.type;

-- Create index on materialized view
CREATE INDEX idx_constraint_statistics_template ON constraint_statistics(template_id);

-- Add refresh function for materialized view
CREATE OR REPLACE FUNCTION refresh_constraint_statistics() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY constraint_statistics;
END;
$$ LANGUAGE plpgsql;