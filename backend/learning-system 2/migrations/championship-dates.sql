-- Championship Dates Migration
-- Create tables to store championship date formulas and NCAA tournament dates

-- Table for storing championship date formulas
CREATE TABLE IF NOT EXISTS championship_formulas (
  formula_id SERIAL PRIMARY KEY,
  sport_id INTEGER REFERENCES sports(sport_id),
  formula_type VARCHAR(50) NOT NULL, -- 'relative_to_ncaa', 'fixed_date', 'day_of_week', etc.
  formula_value TEXT NOT NULL, -- JSON structure with calculation details
  days_before_ncaa INTEGER, -- Number of days/weeks before NCAA event
  competition_days VARCHAR(50), -- Days of week for competition (e.g. 'Sat,Mon,Wed')
  special_conditions TEXT, -- Special conditions (e.g. "Championship moves to Monday If BYU Advances to finals")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing NCAA tournament dates (to be updated each year)
CREATE TABLE IF NOT EXISTS ncaa_tournament_dates (
  date_id SERIAL PRIMARY KEY,
  sport_id INTEGER REFERENCES sports(sport_id),
  season VARCHAR(20) NOT NULL, -- e.g. '2025-2026'
  event_type VARCHAR(50) NOT NULL, -- 'Tournament', 'Regionals', 'Championships'
  start_date DATE NOT NULL,
  end_date DATE,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Populate championship formulas table with the values
INSERT INTO championship_formulas 
  (sport_id, formula_type, formula_value, days_before_ncaa, competition_days, special_conditions)
VALUES
  -- Football
  (8, 'fixed_date', '{"month": 12, "day_of_week": "Saturday", "week_in_month": "first"}', NULL, 'Saturday', NULL),
  
  -- Men's Basketball
  (2, 'relative_to_ncaa', '{"weeks_before": 1}', 7, 'Tuesday,Wednesday,Thursday,Friday,Saturday', NULL),
  
  -- Women's Basketball
  (3, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Wednesday,Thursday,Friday,Saturday,Sunday', 'Championship moves to Monday If BYU Advances to finals'),
  
  -- Soccer
  (14, 'relative_to_ncaa', '{"days_before": "Saturday prior"}', NULL, 'Saturday,Monday,Wednesday', NULL),
  
  -- Men's Cross Country
  (5, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Saturday', 'Championship moves to Friday if host has a Saturday conflict'),
  
  -- Women's Cross Country
  (6, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Saturday', 'Championship moves to Friday if host has a Saturday conflict'),
  
  -- Volleyball - No tournament
  (24, 'none', '{}', NULL, NULL, 'No Conference Tournament'),
  
  -- Men's Swimming & Diving
  (16, 'relative_to_ncaa', '{"weeks_before": 4}', 28, 'Tuesday,Wednesday,Thursday,Friday,Saturday', NULL),
  
  -- Women's Swimming & Diving
  (17, 'relative_to_ncaa', '{"weeks_before": 3}', 21, 'Tuesday,Wednesday,Thursday,Friday,Saturday', NULL),
  
  -- Men's Indoor Track & Field
  (20, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Friday,Saturday', NULL),
  
  -- Women's Indoor Track & Field
  (21, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Friday,Saturday', NULL),
  
  -- Wrestling
  (25, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Saturday,Sunday', NULL),
  
  -- Gymnastics
  (11, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Saturday', NULL),
  
  -- Equestrian
  (7, 'special', '{"options": ["last_weekend_march", "weeks_before_ncea_2"]}', 14, 'Friday,Saturday', NULL),
  
  -- Men's Tennis
  (18, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Thursday,Friday,Saturday,Sunday', 'Championships move to Monday If BYU Advances to finals'),
  
  -- Women's Tennis
  (19, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Wednesday,Thursday,Friday,Saturday,Sunday', 'Championships move to Monday If BYU Advances to finals'),
  
  -- Women's Golf
  (10, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Thursday,Friday,Saturday', NULL),
  
  -- Men's Golf
  (9, 'relative_to_ncaa', '{"weeks_before": 3}', 21, 'Monday,Tuesday,Wednesday,Thursday,Friday,Saturday', 'Days of the week dependent on golf course availability'),
  
  -- Beach Volleyball
  (4, 'relative_to_ncaa', '{"days_before": "Friday prior"}', NULL, 'Thursday,Friday', NULL),
  
  -- Lacrosse
  (12, 'relative_to_ncaa', '{"weeks_before": 1}', 7, 'Thursday,Saturday', NULL),
  
  -- Softball
  (15, 'relative_to_ncaa', '{"weeks_before": 1}', 7, 'Wednesday,Thursday,Friday,Saturday', NULL),
  
  -- Men's Outdoor Track & Field
  (22, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Thursday,Friday,Saturday', 'Minimize conflicts with final exams'),
  
  -- Women's Outdoor Track & Field
  (23, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Thursday,Friday,Saturday', 'Minimize conflicts with final exams'),
  
  -- Rowing
  (13, 'relative_to_ncaa', '{"weeks_before": 2}', 14, 'Sunday', NULL),
  
  -- Baseball
  (1, 'relative_to_ncaa', '{"weeks_before": 1}', 7, 'Wednesday,Thursday,Friday,Saturday', 'Ends Saturday of Memorial Day weekend');
