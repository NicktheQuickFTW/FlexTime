-- FlexTime Microservices Migration
-- Seed Big 12 Team Availability Data
-- This script populates the team availability service with Big 12 specific data

BEGIN;

-- Set search path
SET search_path = team_availability, shared_data, public;

-- First ensure we have sports data in shared_data
INSERT INTO shared_data.sports (name, code, category, season_type, gender) VALUES
('Football', 'FB', 'Fall', 'fall', 'M'),
('Men''s Basketball', 'MBB', 'Winter', 'winter', 'M'),
('Women''s Basketball', 'WBB', 'Winter', 'winter', 'W'),
('Baseball', 'BB', 'Spring', 'spring', 'M'),
('Softball', 'SB', 'Spring', 'spring', 'W'),
('Soccer', 'SOC', 'Fall', 'fall', 'C'),
('Volleyball', 'VB', 'Fall', 'fall', 'W'),
('Wrestling', 'WR', 'Winter', 'winter', 'M'),
('Tennis', 'TEN', 'Spring', 'spring', 'C'),
('Golf', 'GOLF', 'Spring', 'spring', 'C')
ON CONFLICT (code) DO NOTHING;

-- Create current season
INSERT INTO shared_data.seasons (name, start_date, end_date, season_type, active) VALUES
('2024-25', '2024-08-01', '2025-07-31', 'academic_year', true),
('2025-26', '2025-08-01', '2026-07-31', 'academic_year', false)
ON CONFLICT DO NOTHING;

-- Ensure Big 12 institutions exist in shared_data
INSERT INTO shared_data.institutions (name, code, city, state, time_zone) VALUES
('Arizona State University', 'ASU', 'Tempe', 'AZ', 'America/Phoenix'),
('University of Arizona', 'ARIZ', 'Tucson', 'AZ', 'America/Phoenix'),
('Baylor University', 'BAY', 'Waco', 'TX', 'America/Chicago'),
('Brigham Young University', 'BYU', 'Provo', 'UT', 'America/Denver'),
('University of Cincinnati', 'CIN', 'Cincinnati', 'OH', 'America/New_York'),
('University of Colorado', 'COL', 'Boulder', 'CO', 'America/Denver'),
('University of Houston', 'HOU', 'Houston', 'TX', 'America/Chicago'),
('Iowa State University', 'ISU', 'Ames', 'IA', 'America/Chicago'),
('University of Kansas', 'KU', 'Lawrence', 'KS', 'America/Chicago'),
('Kansas State University', 'KSU', 'Manhattan', 'KS', 'America/Chicago'),
('Oklahoma State University', 'OKST', 'Stillwater', 'OK', 'America/Chicago'),
('Texas Christian University', 'TCU', 'Fort Worth', 'TX', 'America/Chicago'),
('Texas Tech University', 'TTU', 'Lubbock', 'TX', 'America/Chicago'),
('University of Central Florida', 'UCF', 'Orlando', 'FL', 'America/New_York'),
('University of Utah', 'UTAH', 'Salt Lake City', 'UT', 'America/Denver'),
('West Virginia University', 'WVU', 'Morgantown', 'WV', 'America/New_York')
ON CONFLICT (code) DO NOTHING;

-- Get sport and season IDs
DO $$
DECLARE
    football_id INTEGER;
    mbb_id INTEGER;
    wbb_id INTEGER;
    current_season_id INTEGER;
    
    -- Institution variables
    asu_id INTEGER;
    ariz_id INTEGER;
    bay_id INTEGER;
    byu_id INTEGER;
    cin_id INTEGER;
    col_id INTEGER;
    hou_id INTEGER;
    isu_id INTEGER;
    ku_id INTEGER;
    ksu_id INTEGER;
    okst_id INTEGER;
    tcu_id INTEGER;
    ttu_id INTEGER;
    ucf_id INTEGER;
    utah_id INTEGER;
    wvu_id INTEGER;
BEGIN
    -- Get sport IDs
    SELECT sport_id INTO football_id FROM shared_data.sports WHERE code = 'FB';
    SELECT sport_id INTO mbb_id FROM shared_data.sports WHERE code = 'MBB';
    SELECT sport_id INTO wbb_id FROM shared_data.sports WHERE code = 'WBB';
    
    -- Get current season ID
    SELECT season_id INTO current_season_id FROM shared_data.seasons WHERE name = '2024-25';
    
    -- Get institution IDs
    SELECT institution_id INTO asu_id FROM shared_data.institutions WHERE code = 'ASU';
    SELECT institution_id INTO ariz_id FROM shared_data.institutions WHERE code = 'ARIZ';
    SELECT institution_id INTO bay_id FROM shared_data.institutions WHERE code = 'BAY';
    SELECT institution_id INTO byu_id FROM shared_data.institutions WHERE code = 'BYU';
    SELECT institution_id INTO cin_id FROM shared_data.institutions WHERE code = 'CIN';
    SELECT institution_id INTO col_id FROM shared_data.institutions WHERE code = 'COL';
    SELECT institution_id INTO hou_id FROM shared_data.institutions WHERE code = 'HOU';
    SELECT institution_id INTO isu_id FROM shared_data.institutions WHERE code = 'ISU';
    SELECT institution_id INTO ku_id FROM shared_data.institutions WHERE code = 'KU';
    SELECT institution_id INTO ksu_id FROM shared_data.institutions WHERE code = 'KSU';
    SELECT institution_id INTO okst_id FROM shared_data.institutions WHERE code = 'OKST';
    SELECT institution_id INTO tcu_id FROM shared_data.institutions WHERE code = 'TCU';
    SELECT institution_id INTO ttu_id FROM shared_data.institutions WHERE code = 'TTU';
    SELECT institution_id INTO ucf_id FROM shared_data.institutions WHERE code = 'UCF';
    SELECT institution_id INTO utah_id FROM shared_data.institutions WHERE code = 'UTAH';
    SELECT institution_id INTO wvu_id FROM shared_data.institutions WHERE code = 'WVU';
    
    -- Create team entries if they don't exist in the main teams table
    -- (This assumes team_id will be auto-generated)
    
    -- Create Football Team Scheduling Profiles for Big 12 schools
    -- Arizona State Football
    INSERT INTO team_availability.team_scheduling_profiles (
        team_id, season_id, sport_id,
        preferred_game_times, max_games_per_week, min_rest_days,
        max_consecutive_away_games, max_travel_distance_miles,
        preferred_travel_days, avoid_travel_days,
        tv_broadcast_priority, conference_game_priority,
        flexibility_score, notes
    ) VALUES (
        (SELECT team_id FROM public.teams WHERE institution_id = asu_id LIMIT 1),
        current_season_id, football_id,
        '{"weekday": ["19:00", "20:00"], "weekend": ["12:00", "15:00", "19:00"]}',
        1, 6, 2, 1200,
        '["tuesday", "wednesday", "thursday"]', '["sunday"]',
        4, 5, 0.65,
        'Arizona State football preferences - West Coast friendly times'
    ) ON CONFLICT (team_id, season_id, sport_id) DO NOTHING;
    
    -- Arizona Football
    INSERT INTO team_availability.team_scheduling_profiles (
        team_id, season_id, sport_id,
        preferred_game_times, max_games_per_week, min_rest_days,
        max_consecutive_away_games, max_travel_distance_miles,
        preferred_travel_days, avoid_travel_days,
        tv_broadcast_priority, conference_game_priority,
        flexibility_score, notes
    ) VALUES (
        (SELECT team_id FROM public.teams WHERE institution_id = ariz_id LIMIT 1),
        current_season_id, football_id,
        '{"weekday": ["19:00", "20:00"], "weekend": ["12:00", "15:00", "19:00"]}',
        1, 6, 2, 1200,
        '["tuesday", "wednesday", "thursday"]', '["sunday"]',
        4, 5, 0.70,
        'Arizona football preferences - Desert heat considerations'
    ) ON CONFLICT (team_id, season_id, sport_id) DO NOTHING;
    
    -- Baylor Football
    INSERT INTO team_availability.team_scheduling_profiles (
        team_id, season_id, sport_id,
        preferred_game_times, max_games_per_week, min_rest_days,
        max_consecutive_away_games, max_travel_distance_miles,
        preferred_travel_days, avoid_travel_days,
        tv_broadcast_priority, conference_game_priority,
        flexibility_score, notes
    ) VALUES (
        (SELECT team_id FROM public.teams WHERE institution_id = bay_id LIMIT 1),
        current_season_id, football_id,
        '{"weekday": ["19:00", "20:00"], "weekend": ["11:00", "14:30", "19:00"]}',
        1, 7, 2, 1000,
        '["monday", "tuesday", "wednesday"]', '["sunday"]',
        5, 5, 0.60,
        'Baylor football preferences - Traditional Central Time scheduling'
    ) ON CONFLICT (team_id, season_id, sport_id) DO NOTHING;
    
    -- BYU Football
    INSERT INTO team_availability.team_scheduling_profiles (
        team_id, season_id, sport_id,
        preferred_game_times, max_games_per_week, min_rest_days,
        max_consecutive_away_games, max_travel_distance_miles,
        preferred_travel_days, avoid_travel_days,
        tv_broadcast_priority, conference_game_priority,
        flexibility_score, notes
    ) VALUES (
        (SELECT team_id FROM public.teams WHERE institution_id = byu_id LIMIT 1),
        current_season_id, football_id,
        '{"weekday": ["19:00"], "weekend": ["12:00", "15:00", "18:00"]}',
        1, 6, 2, 1300,
        '["tuesday", "wednesday", "thursday"]', '["sunday"]',
        4, 5, 0.50,
        'BYU football preferences - No Sunday games, religious considerations'
    ) ON CONFLICT (team_id, season_id, sport_id) DO NOTHING;
    
    -- Create Big 12 Football Travel Constraints
    -- Western schools have different travel needs
    INSERT INTO team_availability.team_travel_constraints (
        team_id, season_id,
        max_travel_distance_miles, preferred_travel_distance_miles,
        air_travel_required_distance_miles, charter_flight_minimum_distance_miles,
        preferred_regions, avoided_regions,
        no_red_eye_flights, regional_rivalry_priority
    ) VALUES 
    -- Arizona State
    ((SELECT team_id FROM public.teams WHERE institution_id = asu_id LIMIT 1), current_season_id,
     1500, 800, 400, 800, '["west", "southwest"]', '[]', true, true),
    -- Arizona  
    ((SELECT team_id FROM public.teams WHERE institution_id = ariz_id LIMIT 1), current_season_id,
     1500, 800, 400, 800, '["west", "southwest"]', '[]', true, true),
    -- Utah
    ((SELECT team_id FROM public.teams WHERE institution_id = utah_id LIMIT 1), current_season_id,
     1400, 750, 500, 900, '["west", "mountain"]', '[]', true, true),
    -- Colorado
    ((SELECT team_id FROM public.teams WHERE institution_id = col_id LIMIT 1), current_season_id,
     1300, 700, 450, 850, '["mountain", "central"]', '[]', true, true)
    ON CONFLICT (team_id, season_id) DO NOTHING;
    
    -- Central/Eastern schools
    INSERT INTO team_availability.team_travel_constraints (
        team_id, season_id,
        max_travel_distance_miles, preferred_travel_distance_miles,
        air_travel_required_distance_miles, charter_flight_minimum_distance_miles,
        preferred_regions, regional_rivalry_priority
    ) VALUES 
    -- Texas schools
    ((SELECT team_id FROM public.teams WHERE institution_id = bay_id LIMIT 1), current_season_id,
     1200, 600, 600, 1000, '["central", "south"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = hou_id LIMIT 1), current_season_id,
     1200, 600, 600, 1000, '["central", "south"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = tcu_id LIMIT 1), current_season_id,
     1200, 600, 600, 1000, '["central", "south"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = ttu_id LIMIT 1), current_season_id,
     1200, 600, 600, 1000, '["central", "south"]', true),
    -- Kansas schools
    ((SELECT team_id FROM public.teams WHERE institution_id = ku_id LIMIT 1), current_season_id,
     1100, 550, 550, 900, '["central", "midwest"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = ksu_id LIMIT 1), current_season_id,
     1100, 550, 550, 900, '["central", "midwest"]', true),
    -- Others
    ((SELECT team_id FROM public.teams WHERE institution_id = isu_id LIMIT 1), current_season_id,
     1100, 550, 550, 900, '["central", "midwest"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = okst_id LIMIT 1), current_season_id,
     1100, 550, 600, 950, '["central", "south"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = cin_id LIMIT 1), current_season_id,
     1300, 700, 500, 850, '["midwest", "east"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = ucf_id LIMIT 1), current_season_id,
     1400, 800, 600, 1000, '["south", "southeast"]', true),
    ((SELECT team_id FROM public.teams WHERE institution_id = wvu_id LIMIT 1), current_season_id,
     1300, 700, 500, 850, '["east", "southeast"]', true)
    ON CONFLICT (team_id, season_id) DO NOTHING;
    
    -- Create Academic Calendar Blackouts for all Big 12 schools
    -- Finals Week - Fall Semester
    INSERT INTO team_availability.team_blackout_dates (
        team_id, season_id, start_date, end_date,
        blackout_type, severity, reason, recurring_annually
    )
    SELECT 
        t.team_id, current_season_id, 
        '2024-12-09'::date, '2024-12-15'::date,
        'finals_week', 'hard', 'Fall semester finals week', true
    FROM public.teams t
    WHERE t.institution_id IN (asu_id, ariz_id, bay_id, byu_id, cin_id, col_id, hou_id, isu_id, ku_id, ksu_id, okst_id, tcu_id, ttu_id, ucf_id, utah_id, wvu_id)
    ON CONFLICT DO NOTHING;
    
    -- Finals Week - Spring Semester
    INSERT INTO team_availability.team_blackout_dates (
        team_id, season_id, start_date, end_date,
        blackout_type, severity, reason, recurring_annually
    )
    SELECT 
        t.team_id, current_season_id, 
        '2025-05-05'::date, '2025-05-11'::date,
        'finals_week', 'hard', 'Spring semester finals week', true
    FROM public.teams t
    WHERE t.institution_id IN (asu_id, ariz_id, bay_id, byu_id, cin_id, col_id, hou_id, isu_id, ku_id, ksu_id, okst_id, tcu_id, ttu_id, ucf_id, utah_id, wvu_id)
    ON CONFLICT DO NOTHING;
    
    -- Spring Break variations
    INSERT INTO team_availability.team_blackout_dates (
        team_id, season_id, start_date, end_date,
        blackout_type, severity, reason, recurring_annually
    )
    SELECT 
        t.team_id, current_season_id, 
        '2025-03-10'::date, '2025-03-16'::date,
        'academic_break', 'soft', 'Spring break - most schools', true
    FROM public.teams t
    WHERE t.institution_id IN (bay_id, hou_id, isu_id, ku_id, ksu_id, okst_id, tcu_id, ttu_id)
    ON CONFLICT DO NOTHING;
    
    -- Create Basketball-specific scheduling profiles
    -- High-profile basketball programs
    INSERT INTO team_availability.team_scheduling_profiles (
        team_id, season_id, sport_id,
        preferred_game_times, max_games_per_week, min_rest_days,
        max_consecutive_away_games, max_travel_distance_miles,
        tv_broadcast_priority, conference_game_priority,
        flexibility_score, notes
    ) VALUES 
    -- Kansas Men's Basketball (Basketball powerhouse)
    ((SELECT team_id FROM public.teams WHERE institution_id = ku_id LIMIT 1),
     current_season_id, mbb_id,
     '{"weekday": ["19:00", "20:00"], "weekend": ["12:00", "16:00", "18:00", "20:00"]}',
     3, 2, 3, 1200, 5, 5, 0.80,
     'Kansas MBB - High TV demand, flexible scheduling for national exposure'),
    -- Baylor Men's Basketball
    ((SELECT team_id FROM public.teams WHERE institution_id = bay_id LIMIT 1),
     current_season_id, mbb_id,
     '{"weekday": ["18:00", "20:00"], "weekend": ["12:00", "14:00", "18:00"]}',
     3, 2, 3, 1100, 4, 5, 0.75,
     'Baylor MBB - Strong program, good TV appeal'),
    -- Houston Men's Basketball
    ((SELECT team_id FROM public.teams WHERE institution_id = hou_id LIMIT 1),
     current_season_id, mbb_id,
     '{"weekday": ["19:00", "20:00"], "weekend": ["13:00", "15:00", "19:00"]}',
     3, 2, 3, 1100, 4, 5, 0.75,
     'Houston MBB - Rising program, Central Time Zone')
    ON CONFLICT (team_id, season_id, sport_id) DO NOTHING;
    
    -- Create Rest Requirements for Football
    INSERT INTO team_availability.team_rest_requirements (
        team_id, sport_id,
        min_rest_hours, preferred_rest_hours, max_games_without_rest,
        away_game_recovery_hours, conference_game_recovery_hours
    )
    SELECT 
        t.team_id, football_id,
        144, 168, 1,  -- 6 days minimum, 7 days preferred, max 1 game without rest
        168, 168      -- 7 days recovery for away and conference games
    FROM public.teams t
    WHERE t.institution_id IN (asu_id, ariz_id, bay_id, byu_id, cin_id, col_id, hou_id, isu_id, ku_id, ksu_id, okst_id, tcu_id, ttu_id, ucf_id, utah_id, wvu_id)
    ON CONFLICT (team_id, sport_id) DO NOTHING;
    
    -- Create Rest Requirements for Basketball (more frequent games)
    INSERT INTO team_availability.team_rest_requirements (
        team_id, sport_id,
        min_rest_hours, preferred_rest_hours, max_games_without_rest,
        away_game_recovery_hours, conference_game_recovery_hours
    )
    SELECT 
        t.team_id, mbb_id,
        48, 72, 3,    -- 2 days minimum, 3 days preferred, max 3 games without rest
        72, 48        -- 3 days for away, 2 days for conference
    FROM public.teams t
    WHERE t.institution_id IN (ku_id, bay_id, hou_id, isu_id, tcu_id, okst_id)
    ON CONFLICT (team_id, sport_id) DO NOTHING;
    
    RAISE NOTICE 'Big 12 team availability data seeded successfully';
    
END;
$$;

-- Create some sample availability windows for prime basketball programs
-- Kansas Basketball - Allen Fieldhouse availability
INSERT INTO team_availability.team_availability_windows (
    team_id, season_id, start_date, end_date,
    day_of_week, availability_type, priority_level,
    allows_tv_broadcasts, venue_restrictions
)
SELECT 
    t.team_id, 
    (SELECT season_id FROM shared_data.seasons WHERE name = '2024-25'),
    '2024-11-01'::date, '2025-03-15'::date,
    ARRAY[2,3,4,5,6,7], 'preferred', 5,  -- Tuesday through Sunday
    true, '["home_only"]'
FROM public.teams t
JOIN shared_data.institutions i ON t.institution_id = i.institution_id
WHERE i.code = 'KU'
LIMIT 1;

-- BYU special restrictions (no Sunday games)
INSERT INTO team_availability.team_availability_windows (
    team_id, season_id, start_date, end_date,
    day_of_week, availability_type, priority_level,
    allows_tv_broadcasts, conditions_notes
)
SELECT 
    t.team_id, 
    (SELECT season_id FROM shared_data.seasons WHERE name = '2024-25'),
    '2024-08-01'::date, '2025-07-31'::date,
    ARRAY[1,2,3,4,5,6], 'available', 3,  -- Monday through Saturday only
    true, 'No Sunday games due to religious observance'
FROM public.teams t
JOIN shared_data.institutions i ON t.institution_id = i.institution_id
WHERE i.code = 'BYU'
LIMIT 1;

COMMIT;

-- Refresh materialized view after seeding
REFRESH MATERIALIZED VIEW team_availability.institutions_teams_view;