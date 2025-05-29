-- Script to populate the sports table with Big 12 Conference sports

-- Temporarily disable triggers to avoid constraint issues
SET session_replication_role = 'replica';

-- Insert or update sports data
WITH sports_data AS (
    -- Men's Sports
    SELECT 'football' AS code, 'Football' AS sport_name, 'Fall' AS season_type, 'Men''s' AS gender, 12 AS team_count, 'Playoff' AS championship_format, 'Dallas, TX' AS championship_location, 'January' AS championship_date, 15 AS sponsorship_count, 'football' AS sport_abbrev, true AS scheduled_by_flextime, 'NCAA FBS rules and Big 12 scheduling policies' AS selection_criteria, 0.75 AS rpi_weight, 'Big 12 Analytics' AS analytics_platform, 'Year-Round' AS recruiting_season, true AS transfer_portal_active
    
    UNION ALL SELECT 'mens-basketball', 'Men''s Basketball', 'Winter', 'Men''s', 14, 'Tournament', 'Kansas City, MO', 'March', 25, 'mbb', true, 'NCAA Division I basketball rules and NET rankings', 0.85, 'Big 12 Analytics', 'Year-Round', true
    
    UNION ALL SELECT 'baseball', 'Baseball', 'Spring', 'Men''s', 13, 'Tournament', 'Arlington, TX', 'May', 18, 'baseball', true, 'NCAA Division I baseball rules and RPI', 0.70, 'NCAA Baseball', 'Fall', true
    
    UNION ALL SELECT 'wrestling', 'Wrestling', 'Winter', 'Men''s', 6, 'Championship', 'Tulsa, OK', 'March', 10, 'wrestling', true, 'NCAA Division I wrestling rules and coaches'' rankings', 0.65, 'TrackWrestling', 'Year-Round', true
    
    UNION ALL SELECT 'mens-tennis', 'Men''s Tennis', 'Spring', 'Men''s', 9, 'Tournament', 'Stillwater, OK', 'April', 8, 'mtennis', true, 'ITA rankings and NCAA selection criteria', 0.60, 'ITA', 'Year-Round', true
    
    -- Women's Sports
    UNION ALL SELECT 'womens-basketball', 'Women''s Basketball', 'Winter', 'Women''s', 14, 'Tournament', 'Kansas City, MO', 'March', 20, 'wbb', true, 'NCAA Division I basketball rules and NET rankings', 0.85, 'Big 12 Analytics', 'Year-Round', true
    
    UNION ALL SELECT 'softball', 'Softball', 'Spring', 'Women''s', 10, 'Tournament', 'Oklahoma City, OK', 'May', 15, 'softball', true, 'NCAA Division I softball rules and RPI', 0.75, 'NCAA Softball', 'Fall', true
    
    UNION ALL SELECT 'volleyball', 'Volleyball', 'Fall', 'Women''s', 14, 'Tournament', 'Ames, IA', 'December', 12, 'wvball', true, 'NCAA Division I volleyball rules and RPI', 0.70, 'NCAA Volleyball', 'Year-Round', true
    
    UNION ALL SELECT 'soccer', 'Soccer', 'Fall', 'Women''s', 14, 'Tournament', 'Round Rock, TX', 'November', 10, 'wsoc', true, 'NCAA Division I soccer rules and RPI', 0.70, 'United Soccer Coaches', 'Year-Round', true
    
    UNION ALL SELECT 'gymnastics', 'Gymnastics', 'Winter', 'Women''s', 7, 'Championship', 'Norman, OK', 'March', 8, 'wgym', true, 'NCAA Women''s Gymnastics rules and rankings', 0.65, 'Road to Nationals', 'Year-Round', true
    
    UNION ALL SELECT 'womens-tennis', 'Women''s Tennis', 'Spring', 'Women''s', 11, 'Tournament', 'Lawrence, KS', 'April', 8, 'wtennis', true, 'ITA rankings and NCAA selection criteria', 0.60, 'ITA', 'Year-Round', true
    
    UNION ALL SELECT 'lacrosse', 'Lacrosse', 'Spring', 'Women''s', 5, 'Tournament', 'Dallas, TX', 'May', 6, 'wlax', true, 'NCAA Women''s Lacrosse rules and RPI', 0.65, 'NCAA Lacrosse', 'Year-Round', true
    
    UNION ALL SELECT 'rowing', 'Rowing', 'Spring', 'Women''s', 4, 'Championship', 'Oak Ridge, TN', 'May', 5, 'wrow', true, 'NCAA Rowing Championship selection criteria', 0.55, 'NCAA Rowing', 'Year-Round', true
    
    UNION ALL SELECT 'equestrian', 'Equestrian', 'Spring', 'Women''s', 4, 'Championship', 'Waco, TX', 'April', 5, 'weq', true, 'NCEA Championship format', 0.50, 'NCEA', 'Year-Round', true
)
INSERT INTO sports (
    code, 
    sport_name, 
    gender, 
    season_type, 
    team_count, 
    championship_format, 
    championship_location, 
    championship_date, 
    sponsorship_count, 
    sport_abbrev, 
    scheduled_by_flextime, 
    selection_criteria, 
    rpi_weight, 
    analytics_platform, 
    recruiting_season, 
    transfer_portal_active
)
SELECT 
    sd.code, 
    sd.sport_name, 
    sd.gender, 
    sd.season_type, 
    sd.team_count, 
    sd.championship_format, 
    sd.championship_location, 
    sd.championship_date, 
    sd.sponsorship_count, 
    sd.sport_abbrev, 
    sd.scheduled_by_flextime, 
    sd.selection_criteria, 
    sd.rpi_weight, 
    sd.analytics_platform, 
    sd.recruiting_season, 
    sd.transfer_portal_active
FROM sports_data sd
ON CONFLICT (LOWER(code)) 
DO UPDATE SET
    sport_name = EXCLUDED.sport_name,
    gender = EXCLUDED.gender,
    season_type = EXCLUDED.season_type,
    team_count = EXCLUDED.team_count,
    championship_format = EXCLUDED.championship_format,
    championship_location = EXCLUDED.championship_location,
    championship_date = EXCLUDED.championship_date,
    sponsorship_count = EXCLUDED.sponsorship_count,
    sport_abbrev = EXCLUDED.sport_abbrev,
    scheduled_by_flextime = EXCLUDED.scheduled_by_flextime,
    selection_criteria = EXCLUDED.selection_criteria,
    rpi_weight = EXCLUDED.rpi_weight,
    analytics_platform = EXCLUDED.analytics_platform,
    recruiting_season = EXCLUDED.recruiting_season,
    transfer_portal_active = EXCLUDED.transfer_portal_active,
    updated_at = CURRENT_TIMESTAMP;

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Output the results
SELECT sport_id, code, sport_name, gender, season_type, team_count 
FROM sports 
ORDER BY 
    CASE 
        WHEN gender = 'Men\'s' THEN 1 
        WHEN gender = 'Women\'s' THEN 2 
        ELSE 3 
    END, 
    sport_name;
