-- ============================================
-- Standings Table for Team Records
-- Stores win-loss records and rankings for teams by season
-- ============================================

CREATE TABLE IF NOT EXISTS standings (
  standing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id INTEGER REFERENCES teams(team_id),
  school_id INTEGER REFERENCES schools(school_id),
  sport_id INTEGER REFERENCES sports(sport_id),
  season_year INTEGER NOT NULL,
  
  -- Overall Record
  overall_wins INTEGER DEFAULT 0,
  overall_losses INTEGER DEFAULT 0,
  
  -- Conference Record
  conference_wins INTEGER DEFAULT 0,
  conference_losses INTEGER DEFAULT 0,
  
  -- Location-based Records
  home_wins INTEGER DEFAULT 0,
  home_losses INTEGER DEFAULT 0,
  away_wins INTEGER DEFAULT 0,
  away_losses INTEGER DEFAULT 0,
  neutral_wins INTEGER DEFAULT 0,
  neutral_losses INTEGER DEFAULT 0,
  
  -- Rankings and Metrics
  net_ranking INTEGER,
  conference_ranking INTEGER,
  
  -- Additional Metrics (for basketball specifically)
  quadrant_1_wins INTEGER DEFAULT 0,
  quadrant_1_losses INTEGER DEFAULT 0,
  quadrant_2_wins INTEGER DEFAULT 0,
  quadrant_2_losses INTEGER DEFAULT 0,
  quadrant_3_wins INTEGER DEFAULT 0,
  quadrant_3_losses INTEGER DEFAULT 0,
  quadrant_4_wins INTEGER DEFAULT 0,
  quadrant_4_losses INTEGER DEFAULT 0,
  
  -- Strength of Schedule
  net_sos INTEGER,
  non_conference_sos INTEGER,
  rpi_ranking INTEGER,
  
  -- Calculated Fields
  overall_win_percentage DECIMAL(5,3) GENERATED ALWAYS AS (
    CASE 
      WHEN (overall_wins + overall_losses) > 0 
      THEN ROUND(overall_wins::DECIMAL / (overall_wins + overall_losses), 3)
      ELSE 0 
    END
  ) STORED,
  
  conference_win_percentage DECIMAL(5,3) GENERATED ALWAYS AS (
    CASE 
      WHEN (conference_wins + conference_losses) > 0 
      THEN ROUND(conference_wins::DECIMAL / (conference_wins + conference_losses), 3)
      ELSE 0 
    END
  ) STORED,
  
  -- Metadata
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(team_id, season_year),
  CONSTRAINT check_wins_losses CHECK (
    overall_wins >= 0 AND overall_losses >= 0 AND
    conference_wins >= 0 AND conference_losses >= 0 AND
    home_wins >= 0 AND home_losses >= 0 AND
    away_wins >= 0 AND away_losses >= 0 AND
    neutral_wins >= 0 AND neutral_losses >= 0
  ),
  CONSTRAINT check_conference_within_overall CHECK (
    (conference_wins + conference_losses) <= (overall_wins + overall_losses)
  )
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_standings_team_season ON standings(team_id, season_year);
CREATE INDEX IF NOT EXISTS idx_standings_school_sport_season ON standings(school_id, sport_id, season_year);
CREATE INDEX IF NOT EXISTS idx_standings_net_ranking ON standings(net_ranking);
CREATE INDEX IF NOT EXISTS idx_standings_conference_ranking ON standings(conference_ranking);
CREATE INDEX IF NOT EXISTS idx_standings_win_percentage ON standings(overall_win_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_standings_conference_win_percentage ON standings(conference_win_percentage DESC);

-- ============================================
-- Functions
-- ============================================

-- Function to update standings from games
CREATE OR REPLACE FUNCTION update_team_standings(p_team_id INTEGER, p_season_year INTEGER)
RETURNS VOID AS $$
DECLARE
  v_overall_wins INTEGER := 0;
  v_overall_losses INTEGER := 0;
  v_conference_wins INTEGER := 0;
  v_conference_losses INTEGER := 0;
  v_home_wins INTEGER := 0;
  v_home_losses INTEGER := 0;
  v_away_wins INTEGER := 0;
  v_away_losses INTEGER := 0;
  v_neutral_wins INTEGER := 0;
  v_neutral_losses INTEGER := 0;
BEGIN
  -- Calculate overall record as home team
  SELECT 
    COUNT(CASE WHEN home_score > away_score THEN 1 END),
    COUNT(CASE WHEN home_score < away_score THEN 1 END)
  INTO v_overall_wins, v_overall_losses
  FROM games g
  JOIN schedules s ON s.schedule_id = g.schedule_id
  WHERE g.home_team_id = p_team_id 
    AND s.season_year = p_season_year
    AND home_score IS NOT NULL 
    AND away_score IS NOT NULL;
    
  -- Add record as away team
  SELECT 
    v_overall_wins + COUNT(CASE WHEN away_score > home_score THEN 1 END),
    v_overall_losses + COUNT(CASE WHEN away_score < home_score THEN 1 END)
  INTO v_overall_wins, v_overall_losses
  FROM games g
  JOIN schedules s ON s.schedule_id = g.schedule_id
  WHERE g.away_team_id = p_team_id 
    AND s.season_year = p_season_year
    AND home_score IS NOT NULL 
    AND away_score IS NOT NULL;
    
  -- Calculate conference record (similar logic but with is_conference_game = true)
  -- Calculate home/away/neutral records
  -- ... (additional calculations)
  
  -- Insert or update standings
  INSERT INTO standings (
    team_id, 
    season_year, 
    overall_wins, 
    overall_losses,
    conference_wins,
    conference_losses,
    home_wins,
    home_losses,
    away_wins,
    away_losses,
    neutral_wins,
    neutral_losses
  ) VALUES (
    p_team_id,
    p_season_year,
    v_overall_wins,
    v_overall_losses,
    v_conference_wins,
    v_conference_losses,
    v_home_wins,
    v_home_losses,
    v_away_wins,
    v_away_losses,
    v_neutral_wins,
    v_neutral_losses
  )
  ON CONFLICT (team_id, season_year) 
  DO UPDATE SET
    overall_wins = EXCLUDED.overall_wins,
    overall_losses = EXCLUDED.overall_losses,
    conference_wins = EXCLUDED.conference_wins,
    conference_losses = EXCLUDED.conference_losses,
    home_wins = EXCLUDED.home_wins,
    home_losses = EXCLUDED.home_losses,
    away_wins = EXCLUDED.away_wins,
    away_losses = EXCLUDED.away_losses,
    neutral_wins = EXCLUDED.neutral_wins,
    neutral_losses = EXCLUDED.neutral_losses,
    last_updated = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views
-- ============================================

-- Conference standings view
CREATE OR REPLACE VIEW conference_standings_view AS
SELECT 
  st.*,
  s.short_display as school_name,
  sp.sport_name,
  t.name as team_name,
  RANK() OVER (
    PARTITION BY st.sport_id, st.season_year 
    ORDER BY st.conference_win_percentage DESC, st.overall_win_percentage DESC
  ) as conference_rank
FROM standings st
JOIN teams t ON t.team_id = st.team_id
JOIN schools s ON s.school_id = st.school_id
JOIN sports sp ON sp.sport_id = st.sport_id
ORDER BY st.sport_id, st.season_year, conference_rank;

-- NET rankings view
CREATE OR REPLACE VIEW net_rankings_view AS
SELECT 
  st.*,
  s.short_display as school_name,
  sp.sport_name,
  t.name as team_name,
  RANK() OVER (
    PARTITION BY st.sport_id, st.season_year 
    ORDER BY st.net_ranking ASC NULLS LAST
  ) as net_rank
FROM standings st
JOIN teams t ON t.team_id = st.team_id
JOIN schools s ON s.school_id = st.school_id
JOIN sports sp ON sp.sport_id = st.sport_id
WHERE st.net_ranking IS NOT NULL
ORDER BY st.sport_id, st.season_year, net_rank;

-- ============================================
-- Triggers
-- ============================================

-- Update timestamp trigger
CREATE TRIGGER update_standings_updated_at BEFORE UPDATE ON standings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security
-- ============================================

ALTER TABLE standings ENABLE ROW LEVEL SECURITY;

-- Public read access for standings
CREATE POLICY "Public read access" ON standings FOR SELECT USING (true);

-- Authenticated users can update standings
CREATE POLICY "Authenticated update" ON standings FOR UPDATE TO authenticated USING (true);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE standings IS 'Team win-loss records and rankings by season';
COMMENT ON COLUMN standings.team_id IS 'References teams table (school_id * 100 + sport_id)';
COMMENT ON COLUMN standings.quadrant_1_wins IS 'Basketball: wins vs NET 1-30 home, 1-50 neutral, 1-75 away';
COMMENT ON COLUMN standings.quadrant_2_wins IS 'Basketball: wins vs NET 31-75 home, 51-100 neutral, 76-135 away';
COMMENT ON COLUMN standings.net_ranking IS 'NCAA NET ranking (lower is better)';
COMMENT ON COLUMN standings.net_sos IS 'NET Strength of Schedule ranking';
COMMENT ON COLUMN standings.overall_win_percentage IS 'Calculated field: wins / (wins + losses)';
COMMENT ON COLUMN standings.conference_win_percentage IS 'Calculated field: conf wins / (conf wins + conf losses)';

-- ============================================
-- Sample Data Insert for Basketball Teams
-- ============================================

-- Example: Insert 2024-25 basketball standings from extracted data
-- This would be populated from the team sheet data we extracted

/*
-- Duke (ACC) - 35-4 overall, 19-1 conference
INSERT INTO standings (team_id, school_id, sport_id, season_year, overall_wins, overall_losses, conference_wins, conference_losses, net_ranking)
VALUES (3702, 37, 2, 2025, 35, 4, 19, 1, 1);

-- Michigan State (Big Ten) - 30-7 overall, 17-3 conference  
INSERT INTO standings (team_id, school_id, sport_id, season_year, overall_wins, overall_losses, conference_wins, conference_losses, net_ranking)
VALUES (5702, 57, 2, 2025, 30, 7, 17, 3, 9);

-- Houston (Big 12) - 35-5 overall, 19-1 conference
INSERT INTO standings (team_id, school_id, sport_id, season_year, overall_wins, overall_losses, conference_wins, conference_losses, net_ranking)
VALUES (902, 9, 2, 2025, 35, 5, 19, 1, 2);
*/