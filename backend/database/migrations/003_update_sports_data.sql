-- Migration to update sports data for Big 12 Conference
-- This migration ensures all Big 12 sports are properly configured in the database

-- First, add any missing columns if they don't exist
DO $$
BEGIN
    -- Add code column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'code') THEN
        ALTER TABLE sports ADD COLUMN code VARCHAR(10);
        RAISE NOTICE 'Added code column to sports table';
    END IF;
    
    -- Add gender column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'gender') THEN
        ALTER TABLE sports ADD COLUMN gender VARCHAR(10);
        RAISE NOTICE 'Added gender column to sports table';
    END IF;
    
    -- Add season_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'season_type') THEN
        ALTER TABLE sports ADD COLUMN season_type VARCHAR(20);
        RAISE NOTICE 'Added season_type column to sports table';
    END IF;
    
    -- Add other columns that might be needed
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'sport_abbrev') THEN
        ALTER TABLE sports ADD COLUMN sport_abbrev VARCHAR(10);
        RAISE NOTICE 'Added sport_abbrev column to sports table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'scheduled_by_flextime') THEN
        ALTER TABLE sports ADD COLUMN scheduled_by_flextime BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added scheduled_by_flextime column to sports table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'selection_criteria') THEN
        ALTER TABLE sports ADD COLUMN selection_criteria TEXT;
        RAISE NOTICE 'Added selection_criteria column to sports table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'rpi_weight') THEN
        ALTER TABLE sports ADD COLUMN rpi_weight NUMERIC(3,2);
        RAISE NOTICE 'Added rpi_weight column to sports table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'analytics_platform') THEN
        ALTER TABLE sports ADD COLUMN analytics_platform VARCHAR(100);
        RAISE NOTICE 'Added analytics_platform column to sports table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'recruiting_season') THEN
        ALTER TABLE sports ADD COLUMN recruiting_season VARCHAR(20);
        RAISE NOTICE 'Added recruiting_season column to sports table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'transfer_portal_active') THEN
        ALTER TABLE sports ADD COLUMN transfer_portal_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added transfer_portal_active column to sports table';
    END IF;
    
    RAISE NOTICE 'Schema updates completed';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating schema: %', SQLERRM;
END $$;

-- Update existing sports data with complete information
-- Football
UPDATE sports SET 
    code = 'FB',
    gender = 'Men',
    season_type = 'fall',
    sport_abbrev = 'FB',
    team_count = 16,
    championship_format = 'Top 12 in Big 12 RS Standings',
    championship_location = 'Arlington, TX - AT&T Stadium',
    championship_date = 'December 7, 2024',
    scheduled_by_flextime = true,
    selection_criteria = 'NCAA FBS rules and Big 12 scheduling policies',
    rpi_weight = 0.75,
    analytics_platform = 'Big 12 Analytics',
    recruiting_season = 'Year-Round',
    transfer_portal_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(sport_name) = 'football';

-- Men's Basketball
UPDATE sports SET 
    code = 'MBB',
    gender = 'Men',
    season_type = 'winter',
    sport_abbrev = 'MBB',
    team_count = 16,
    championship_format = 'All Teams Compete',
    championship_location = 'Kansas City, MO - T-Mobile Center',
    championship_date = 'March 11, 2025 → March 15, 2025',
    scheduled_by_flextime = true,
    selection_criteria = 'NCAA Division I basketball rules and NET rankings',
    rpi_weight = 0.85,
    analytics_platform = 'Big 12 Analytics',
    recruiting_season = 'Year-Round',
    transfer_portal_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(sport_name) = 'men''s basketball';

-- Women's Basketball
UPDATE sports SET 
    code = 'WBB',
    gender = 'Women',
    season_type = 'winter',
    sport_abbrev = 'WBB',
    team_count = 14,
    championship_format = 'All Teams Compete',
    championship_location = 'Kansas City, MO - T-Mobile Center',
    championship_date = 'March 11, 2025 → March 15, 2025',
    scheduled_by_flextime = true,
    selection_criteria = 'NCAA Division I basketball rules and NET rankings',
    rpi_weight = 0.85,
    analytics_platform = 'Big 12 Analytics',
    recruiting_season = 'Year-Round',
    transfer_portal_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(sport_name) = 'women''s basketball';

-- Baseball
UPDATE sports SET 
    code = 'BSB',
    gender = 'Men',
    season_type = 'spring',
    sport_abbrev = 'BSB',
    team_count = 14,
    championship_format = 'Top 12 in Big 12 RS Standings',
    championship_location = 'Arlington, TX - Globe Life Field',
    championship_date = 'May 20, 2025 → May 24, 2025',
    scheduled_by_flextime = true,
    selection_criteria = 'NCAA Division I baseball rules and RPI',
    rpi_weight = 0.80,
    analytics_platform = 'Big 12 Analytics',
    recruiting_season = 'Year-Round',
    transfer_portal_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(sport_name) = 'baseball';

-- Softball
UPDATE sports SET 
    code = 'SB',
    gender = 'Women',
    season_type = 'spring',
    sport_abbrev = 'SB',
    team_count = 10,
    championship_format = 'All Teams Compete',
    championship_location = 'Oklahoma City, OK - USA Softball Hall of Fame Stadium',
    championship_date = 'May 7, 2025 → May 11, 2025',
    scheduled_by_flextime = true,
    selection_criteria = 'NCAA Division I softball rules and RPI',
    rpi_weight = 0.80,
    analytics_platform = 'Big 12 Analytics',
    recruiting_season = 'Year-Round',
    transfer_portal_active = true,
    updated_at = CURRENT_TIMESTAMP
WHERE LOWER(sport_name) = 'softball';

-- Add any missing Big 12 sports
INSERT INTO sports (
    sport_name,
    code,
    gender,
    season_type,
    team_count,
    championship_format,
    championship_location,
    championship_date,
    sport_abbrev,
    scheduled_by_flextime,
    selection_criteria,
    rpi_weight,
    analytics_platform,
    recruiting_season,
    transfer_portal_active,
    created_at,
    updated_at
) VALUES 
-- Volleyball
(
    'Volleyball',
    'VB',
    'Women',
    'fall',
    14,
    'Top 10 in Big 12 Regular Season Standings',
    'Ames, IA - Hilton Coliseum',
    'November 20-24, 2024',
    'VB',
    true,
    'NCAA Division I volleyball rules and RPI',
    0.75,
    'Big 12 Analytics',
    'Year-Round',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Soccer
(
    'Soccer',
    'SOC',
    'Women',
    'fall',
    14,
    'Top 8 in Big 12 Regular Season Standings',
    'Round Rock, TX - Round Rock Multipurpose Complex',
    'October 31 - November 5, 2024',
    'SOC',
    true,
    'NCAA Division I soccer rules and RPI',
    0.75,
    'Big 12 Analytics',
    'Year-Round',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Wrestling
(
    'Wrestling',
    'WR',
    'Men',
    'winter',
    7,
    'All Teams Compete',
    'Tulsa, OK - BOK Center',
    'March 8-9, 2025',
    'WR',
    true,
    'NCAA Division I wrestling rules',
    0.70,
    'Big 12 Analytics',
    'Year-Round',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Swimming & Diving (Men)
(
    'Swimming & Diving',
    'SD',
    'Men',
    'winter',
    6,
    'All Teams Compete',
    'Morgantown, WV - Aquatic Center at Mylan Park',
    'February 26 - March 1, 2025',
    'SD',
    true,
    'NCAA Division I swimming & diving rules',
    0.65,
    'Big 12 Analytics',
    'Year-Round',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Swimming & Diving (Women)
(
    'Swimming & Diving',
    'SD',
    'Women',
    'winter',
    9,
    'All Teams Compete',
    'Morgantown, WV - Aquatic Center at Mylan Park',
    'February 26 - March 1, 2025',
    'SD',
    true,
    'NCAA Division I swimming & diving rules',
    0.65,
    'Big 12 Analytics',
    'Year-Round',
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Men's Tennis
(
    'Men''s Tennis',
    'MTEN',
    'Men',
    'spring',
    10,
    'All Teams Compete',
    'Stillwater, OK - Greenwood Tennis Center',
    'April 17-20, 2025',
    'MTEN',
    true,
    'NCAA Division I tennis rules and ITA rankings',
    0.70,
    'Big 12 Analytics',
    'Year-Round',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Women's Tennis
(
    'Women''s Tennis',
    'WTEN',
    'Women',
    'spring',
    13,
    'All Teams Compete',
    'Lawrence, KS - Jayhawk Tennis Center',
    'April 17-20, 2025',
    'WTEN',
    true,
    'NCAA Division I tennis rules and ITA rankings',
    0.70,
    'Big 12 Analytics',
    'Year-Round',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (LOWER(sport_name)) 
DO UPDATE SET
    code = EXCLUDED.code,
    gender = EXCLUDED.gender,
    season_type = EXCLUDED.season_type,
    team_count = EXCLUDED.team_count,
    championship_format = EXCLUDED.championship_format,
    championship_location = EXCLUDED.championship_location,
    championship_date = EXCLUDED.championship_date,
    sport_abbrev = EXCLUDED.sport_abbrev,
    scheduled_by_flextime = EXCLUDED.scheduled_by_flextime,
    selection_criteria = EXCLUDED.selection_criteria,
    rpi_weight = EXCLUDED.rpi_weight,
    analytics_platform = EXCLUDED.analytics_platform,
    recruiting_season = EXCLUDED.recruiting_season,
    transfer_portal_active = EXCLUDED.transfer_portal_active,
    updated_at = CURRENT_TIMESTAMP;

-- Set updated_at for all records
UPDATE sports SET updated_at = CURRENT_TIMESTAMP;

-- Verify the updates
SELECT 
    sport_id,
    sport_name,
    code,
    gender,
    season_type,
    team_count,
    sport_abbrev,
    scheduled_by_flextime,
    transfer_portal_active
FROM 
    sports
ORDER BY 
    gender,
    sport_name;
