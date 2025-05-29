-- Migration to update the sports table schema
-- Rename 'name' column to 'sport_name' and ensure all required columns exist

-- First, check if the column needs to be renamed
DO $$
BEGIN
    -- Check if the 'name' column exists and 'sport_name' doesn't exist
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'sports' AND column_name = 'name') 
    AND NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'sports' AND column_name = 'sport_name') THEN
        -- Rename the column
        EXECUTE 'ALTER TABLE sports RENAME COLUMN name TO sport_name';
        RAISE NOTICE 'Renamed column "name" to "sport_name" in sports table';
    END IF;

    -- Add any missing columns with appropriate constraints
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'code') THEN
        ALTER TABLE sports ADD COLUMN code VARCHAR(10);
        RAISE NOTICE 'Added "code" column to sports table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'gender') THEN
        ALTER TABLE sports ADD COLUMN gender VARCHAR(10);
        RAISE NOTICE 'Added "gender" column to sports table';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'sports' AND column_name = 'season_type') THEN
        ALTER TABLE sports ADD COLUMN season_type VARCHAR(20);
        RAISE NOTICE 'Added "season_type" column to sports table';
    END IF;

    -- Update existing sports with correct data
    UPDATE sports SET 
        code = LOWER(REPLACE(sport_name, ' ', '-')),
        gender = CASE 
            WHEN sport_name LIKE 'Men%' THEN 'Men''s'
            WHEN sport_name LIKE 'Women%' THEN 'Women''s'
            WHEN sport_name IN ('Football', 'Baseball', 'Wrestling') THEN 'Men''s'
            WHEN sport_name IN ('Softball', 'Volleyball', 'Soccer', 'Gymnastics', 'Lacrosse', 'Rowing', 'Equestrian') THEN 'Women''s'
            ELSE 'Coed'
        END,
        season_type = CASE 
            WHEN sport_name = 'Football' THEN 'Fall'
            WHEN sport_name IN ('Men''s Basketball', 'Women''s Basketball', 'Wrestling', 'Gymnastics') THEN 'Winter'
            WHEN sport_name IN ('Baseball', 'Softball', 'Men''s Tennis', 'Women''s Tennis', 'Lacrosse', 'Rowing', 'Equestrian') THEN 'Spring'
            ELSE 'Year-Round'
        END
    WHERE code IS NULL OR gender IS NULL OR season_type IS NULL;

    -- Add NOT NULL constraints after populating data
    BEGIN
        ALTER TABLE sports ALTER COLUMN sport_name SET NOT NULL;
        ALTER TABLE sports ALTER COLUMN code SET NOT NULL;
        ALTER TABLE sports ALTER COLUMN gender SET NOT NULL;
        ALTER TABLE sports ALTER COLUMN season_type SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not add NOT NULL constraints: %', SQLERRM;
    END;

    -- Create a unique index on sport_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'sports' 
        AND indexname = 'sports_sport_name_key'
    ) THEN
        CREATE UNIQUE INDEX sports_sport_name_key ON sports (LOWER(sport_name));
        RAISE NOTICE 'Created unique index on sport_name';
    END IF;

    -- Create a unique index on code if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'sports' 
        AND indexname = 'sports_code_key'
    ) THEN
        CREATE UNIQUE INDEX sports_code_key ON sports (LOWER(code));
        RAISE NOTICE 'Created unique index on code';
    END IF;

    RAISE NOTICE 'Sports table schema update completed successfully';
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error updating sports table: %', SQLERRM;
END $$;
