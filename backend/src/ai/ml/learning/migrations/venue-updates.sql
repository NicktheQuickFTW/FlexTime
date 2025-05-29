-- Venue Updates for Big 12 Conference Teams
-- This migration updates venue information for all sports across Big 12 schools

-- First, let's check if the venue_unavailability table exists, and create it if not
CREATE TABLE IF NOT EXISTS venue_unavailability (
  unavailability_id SERIAL PRIMARY KEY,
  venue_id INTEGER REFERENCES venues(venue_id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add additional columns to venues table if they don't exist yet
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'surface_type') THEN
    ALTER TABLE venues ADD COLUMN surface_type VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'is_indoor') THEN
    ALTER TABLE venues ADD COLUMN is_indoor BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'year_opened') THEN
    ALTER TABLE venues ADD COLUMN year_opened INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'location_latitude') THEN
    ALTER TABLE venues ADD COLUMN location_latitude DECIMAL(10, 6);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'location_longitude') THEN
    ALTER TABLE venues ADD COLUMN location_longitude DECIMAL(10, 6);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'description') THEN
    ALTER TABLE venues ADD COLUMN description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'venues' AND column_name = 'timezone') THEN
    ALTER TABLE venues ADD COLUMN timezone VARCHAR(50);
  END IF;
END $$;

-- Update Football Venues for Big 12 Schools
-- First, let's check the sequence to make sure it's set correctly
DO $$
DECLARE
    max_venue_id INTEGER;
BEGIN
    -- Get the current maximum venue_id
    SELECT COALESCE(MAX(venue_id), 0) INTO max_venue_id FROM venues;
    
    -- Set the sequence to start after the max id
    EXECUTE 'ALTER SEQUENCE IF EXISTS venues_venue_id_seq RESTART WITH ' || (max_venue_id + 1);
    
    RAISE NOTICE 'Updated sequence to start at %', (max_venue_id + 1);
END $$;

-- Create a function to handle upserts (insert or update) with safer ID handling
CREATE OR REPLACE FUNCTION upsert_venue(
  v_name VARCHAR,
  v_city VARCHAR,
  v_state VARCHAR,
  v_capacity INTEGER,
  v_team_id INTEGER,
  v_sport_id INTEGER,
  v_surface_type VARCHAR DEFAULT NULL,
  v_is_indoor BOOLEAN DEFAULT FALSE,
  v_year_opened INTEGER DEFAULT NULL,
  v_latitude DECIMAL DEFAULT NULL,
  v_longitude DECIMAL DEFAULT NULL,
  v_description TEXT DEFAULT NULL,
  v_timezone VARCHAR DEFAULT 'America/Chicago'
) RETURNS void AS $$
DECLARE
  v_venue_id INTEGER;
  v_exists BOOLEAN;
BEGIN
  -- Check if venue exists for this team
  SELECT EXISTS(SELECT 1 FROM venues WHERE team_id = v_team_id) INTO v_exists;
  
  IF NOT v_exists THEN
    -- Insert new venue with default sequence handling for venue_id
    INSERT INTO venues (
      name, city, state, capacity, team_id, 
      surface_type, is_indoor, year_opened, 
      location_latitude, location_longitude, 
      description, timezone,
      created_at, updated_at
    ) VALUES (
      v_name, v_city, v_state, v_capacity, v_team_id,
      v_surface_type, v_is_indoor, v_year_opened,
      v_latitude, v_longitude,
      v_description, v_timezone,
      NOW(), NOW()
    );
  ELSE
    -- Get the venue_id for updating
    SELECT venue_id INTO v_venue_id FROM venues WHERE team_id = v_team_id;
    
    -- Update existing venue
    UPDATE venues SET
      name = v_name,
      city = v_city,
      state = v_state,
      capacity = v_capacity,
      surface_type = v_surface_type,
      is_indoor = v_is_indoor,
      year_opened = v_year_opened,
      location_latitude = v_latitude,
      location_longitude = v_longitude,
      description = v_description,
      timezone = v_timezone,
      updated_at = NOW()
    WHERE venue_id = v_venue_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Now update football venues for each school
-- Football venues (sport_id = 8)
SELECT upsert_venue(
  'Arizona Stadium', 'Tucson', 'AZ', 50782,
  (SELECT team_id FROM teams WHERE name = 'Arizona Wildcats' AND sport_id = 8),
  8, 'FieldTurf', FALSE, 1929, 32.2297, -110.9478,
  'Home of the Arizona Wildcats football team', 'America/Phoenix'
);

SELECT upsert_venue(
  'Mountain America Stadium', 'Tempe', 'AZ', 53599,
  (SELECT team_id FROM teams WHERE name = 'Arizona State Sun Devils' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 1958, 33.4255, -111.9325,
  'Home of the Arizona State Sun Devils football team', 'America/Phoenix'
);

SELECT upsert_venue(
  'McLane Stadium', 'Waco', 'TX', 45140,
  (SELECT team_id FROM teams WHERE name = 'Baylor Bears' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 2014, 31.5592, -97.1153, 
  'Home of the Baylor Bears football team', 'America/Chicago'
);

SELECT upsert_venue(
  'LaVell Edwards Stadium', 'Provo', 'UT', 63470,
  (SELECT team_id FROM teams WHERE name = 'BYU Cougars' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 1964, 40.2574, -111.6548,
  'Home of the BYU Cougars football team', 'America/Denver'
);

SELECT upsert_venue(
  'Nippert Stadium', 'Cincinnati', 'OH', 40000,
  (SELECT team_id FROM teams WHERE name = 'Cincinnati Bearcats' AND sport_id = 8),
  8, 'UBU Sports Speed Series S5-M', FALSE, 1924, 39.1311, -84.5167,
  'Home of the Cincinnati Bearcats football team', 'America/New_York'
);

SELECT upsert_venue(
  'Folsom Field', 'Boulder', 'CO', 50183,
  (SELECT team_id FROM teams WHERE name = 'Colorado Buffaloes' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 1924, 40.0076, -105.2674,
  'Home of the Colorado Buffaloes football team', 'America/Denver'
);

SELECT upsert_venue(
  'TDECU Stadium', 'Houston', 'TX', 40000,
  (SELECT team_id FROM teams WHERE name = 'Houston Cougars' AND sport_id = 8),
  8, 'Astroturf 3D60', FALSE, 2014, 29.7216, -95.3409,
  'Home of the Houston Cougars football team', 'America/Chicago'
);

SELECT upsert_venue(
  'Jack Trice Stadium', 'Ames', 'IA', 61500,
  (SELECT team_id FROM teams WHERE name = 'Iowa State Cyclones' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 1975, 42.0145, -93.6360,
  'Home of the Iowa State Cyclones football team', 'America/Chicago'
);

SELECT upsert_venue(
  'David Booth Kansas Memorial Stadium', 'Lawrence', 'KS', 47233,
  (SELECT team_id FROM teams WHERE name = 'Kansas Jayhawks' AND sport_id = 8),
  8, 'FieldTurf Revolution', FALSE, 1921, 38.9708, -95.2454,
  'Home of the Kansas Jayhawks football team', 'America/Chicago'
);

SELECT upsert_venue(
  'Bill Snyder Family Stadium', 'Manhattan', 'KS', 52000,
  (SELECT team_id FROM teams WHERE name = 'Kansas State Wildcats' AND sport_id = 8),
  8, 'AstroTurf 3D3', FALSE, 1968, 39.2019, -96.5967, 
  'Home of the Kansas State Wildcats football team', 'America/Chicago'
);

SELECT upsert_venue(
  'Boone Pickens Stadium', 'Stillwater', 'OK', 55509,
  (SELECT team_id FROM teams WHERE name = 'Oklahoma State Cowboys' AND sport_id = 8),
  8, 'AstroTurf 3D60', FALSE, 1920, 36.1269, -97.0651,
  'Home of the Oklahoma State Cowboys football team', 'America/Chicago'
);

SELECT upsert_venue(
  'Amon G. Carter Stadium', 'Fort Worth', 'TX', 47000, 
  (SELECT team_id FROM teams WHERE name = 'TCU Horned Frogs' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 1930, 32.7100, -97.3690,
  'Home of the TCU Horned Frogs football team', 'America/Chicago'
);

SELECT upsert_venue(
  'Jones AT&T Stadium', 'Lubbock', 'TX', 60454,
  (SELECT team_id FROM teams WHERE name = 'Texas Tech Red Raiders' AND sport_id = 8),
  8, 'FieldTurf Revolution', FALSE, 1947, 33.5906, -101.8716,
  'Home of the Texas Tech Red Raiders football team', 'America/Chicago'
);

SELECT upsert_venue(
  'FBC Mortgage Stadium', 'Orlando', 'FL', 45040,
  (SELECT team_id FROM teams WHERE name = 'UCF Knights' AND sport_id = 8),
  8, 'Natural Grass', FALSE, 2007, 28.6077, -81.1911,
  'Home of the UCF Knights football team', 'America/New_York'
);

SELECT upsert_venue(
  'Rice-Eccles Stadium', 'Salt Lake City', 'UT', 51444,
  (SELECT team_id FROM teams WHERE name = 'Utah Utes' AND sport_id = 8),
  8, 'FieldTurf', FALSE, 1998, 40.7606, -111.8486,
  'Home of the Utah Utes football team', 'America/Denver'
);

SELECT upsert_venue(
  'Milan Puskar Stadium', 'Morgantown', 'WV', 60000, 
  (SELECT team_id FROM teams WHERE name = 'West Virginia Mountaineers' AND sport_id = 8),
  8, 'FieldTurf', FALSE, 1980, 39.6487, -79.9539,
  'Home of the West Virginia Mountaineers football team', 'America/New_York'
);

-- Add some sample venue unavailability dates for testing
INSERT INTO venue_unavailability (venue_id, start_date, end_date, reason)
VALUES 
  -- Arizona Stadium renovations
  ((SELECT venue_id FROM venues WHERE name = 'Arizona Stadium'), '2025-07-15', '2025-08-15', 'Summer renovations'),
  
  -- McLane Stadium hosting a concert
  ((SELECT venue_id FROM venues WHERE name = 'McLane Stadium'), '2025-10-25', '2025-10-26', 'Luke Combs Concert'),
  
  -- Jack Trice Stadium hosting a conference
  ((SELECT venue_id FROM venues WHERE name = 'Jack Trice Stadium'), '2025-09-13', '2025-09-14', 'University event'),
  
  -- Milan Puskar Stadium maintenance
  ((SELECT venue_id FROM venues WHERE name = 'Milan Puskar Stadium'), '2025-11-20', '2025-11-22', 'Field maintenance');
