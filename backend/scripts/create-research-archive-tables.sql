-- Research Archive Tables
-- For storing archived semi-permanent data before deletion

-- Archive table for research job history
CREATE TABLE IF NOT EXISTS research_job_history_archive (
    LIKE research_job_history INCLUDING ALL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archive table for research conflicts
CREATE TABLE IF NOT EXISTS research_conflicts_archive (
    LIKE research_conflicts INCLUDING ALL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Archive table for feedback adjustments
CREATE TABLE IF NOT EXISTS research_feedback_adjustments_archive (
    LIKE research_feedback_adjustments INCLUDING ALL,
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for archive tables
CREATE INDEX idx_research_job_history_archive_archived ON research_job_history_archive(archived_at);
CREATE INDEX idx_research_conflicts_archive_archived ON research_conflicts_archive(archived_at);
CREATE INDEX idx_research_feedback_adjustments_archive_archived ON research_feedback_adjustments_archive(archived_at);

-- Create a view to see all historical job data (current + archived)
CREATE OR REPLACE VIEW v_all_research_job_history AS
SELECT *, 'current' as source FROM research_job_history
UNION ALL
SELECT *, 'archive' as source FROM research_job_history_archive;

-- Create a view to see all historical conflicts (current + archived)
CREATE OR REPLACE VIEW v_all_research_conflicts AS
SELECT *, 'current' as source FROM research_conflicts
UNION ALL
SELECT *, 'archive' as source FROM research_conflicts_archive;

-- Create a view to see all historical adjustments (current + archived)
CREATE OR REPLACE VIEW v_all_research_feedback_adjustments AS
SELECT *, 'current' as source FROM research_feedback_adjustments
UNION ALL
SELECT *, 'archive' as source FROM research_feedback_adjustments_archive;

-- Function to get research history for a specific team across all time
CREATE OR REPLACE FUNCTION get_team_research_history(
    p_team_id INTEGER,
    p_sport VARCHAR(50) DEFAULT NULL
)
RETURNS TABLE (
    research_date DATE,
    research_type VARCHAR(50),
    sport VARCHAR(50),
    confidence DECIMAL(3,2),
    compass_rating DECIMAL(5,2),
    data_source VARCHAR(20)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(crd.created_at) as research_date,
        'comprehensive' as research_type,
        crd.sport,
        crd.research_confidence as confidence,
        t.compass_rating,
        'permanent' as data_source
    FROM comprehensive_research_data crd
    JOIN teams t ON crd.team_id = t.team_id
    WHERE crd.team_id = p_team_id
    AND (p_sport IS NULL OR crd.sport = p_sport)
    
    UNION ALL
    
    SELECT 
        DATE(rjh.scheduled_at) as research_date,
        rjh.job_type as research_type,
        rjh.sport,
        NULL as confidence,
        NULL as compass_rating,
        'job_history' as data_source
    FROM v_all_research_job_history rjh
    WHERE rjh.team_name = (SELECT short_display FROM schools s JOIN teams t ON s.school_id = t.school_id WHERE t.team_id = p_team_id LIMIT 1)
    AND (p_sport IS NULL OR rjh.sport = p_sport)
    
    ORDER BY research_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to archive old data (to be called by maintenance process)
CREATE OR REPLACE FUNCTION archive_old_research_data()
RETURNS TABLE (
    table_name TEXT,
    rows_archived BIGINT
) AS $$
DECLARE
    v_job_history_count BIGINT;
    v_conflicts_count BIGINT;
    v_adjustments_count BIGINT;
BEGIN
    -- Archive job history older than 2 years
    WITH archived AS (
        INSERT INTO research_job_history_archive
        SELECT *, NOW() FROM research_job_history
        WHERE created_at < NOW() - INTERVAL '730 days'
        ON CONFLICT DO NOTHING
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_job_history_count FROM archived;
    
    -- Archive conflicts older than 3 years
    WITH archived AS (
        INSERT INTO research_conflicts_archive
        SELECT *, NOW() FROM research_conflicts
        WHERE created_at < NOW() - INTERVAL '1095 days'
        ON CONFLICT DO NOTHING
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_conflicts_count FROM archived;
    
    -- Archive adjustments older than 5 years
    WITH archived AS (
        INSERT INTO research_feedback_adjustments_archive
        SELECT *, NOW() FROM research_feedback_adjustments
        WHERE created_at < NOW() - INTERVAL '1825 days'
        ON CONFLICT DO NOTHING
        RETURNING 1
    )
    SELECT COUNT(*) INTO v_adjustments_count FROM archived;
    
    -- Return summary
    RETURN QUERY
    SELECT 'research_job_history'::TEXT, v_job_history_count
    UNION ALL
    SELECT 'research_conflicts'::TEXT, v_conflicts_count
    UNION ALL
    SELECT 'research_feedback_adjustments'::TEXT, v_adjustments_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining data retention strategy
COMMENT ON TABLE comprehensive_research_data IS 
'PERMANENT TABLE - Historical research snapshots that provide long-term value. Never delete records from this table.';

COMMENT ON TABLE transfer_portal_activity IS
'PERMANENT TABLE - Historical transfer records. Never delete records from this table.';

COMMENT ON TABLE coaching_changes IS
'PERMANENT TABLE - Historical coaching changes. Never delete records from this table.';

COMMENT ON TABLE research_validations IS
'TEMPORARY TABLE - Validation results kept for 30 days for debugging and quality monitoring.';

COMMENT ON TABLE research_errors IS
'TEMPORARY TABLE - Error logs kept for 90 days (or indefinitely if unresolved).';

COMMENT ON TABLE research_api_usage IS
'TEMPORARY TABLE - API usage tracking kept for 7 days for rate limit monitoring.';