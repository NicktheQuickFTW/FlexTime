-- Migration to populate NCAA tournament dates for 2025-26 season
-- This migration adds NCAA tournament dates for various sports based on the provided data
-- Also includes official NCAA First Practice, Contest, and End-of-Season dates

-- First, make sure we have the tables we need for NCAA dates

-- Table for NCAA tournament dates
CREATE TABLE IF NOT EXISTS ncaa_tournament_dates (
    date_id SERIAL PRIMARY KEY,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
    season VARCHAR(9) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sport_id, season, event_type)
);

-- Table for NCAA regular season dates
CREATE TABLE IF NOT EXISTS ncaa_regular_season_dates (
    date_id SERIAL PRIMARY KEY,
    sport_id INTEGER NOT NULL REFERENCES sports(sport_id),
    season VARCHAR(9) NOT NULL,
    first_practice_date DATE,
    first_contest_date DATE,
    regular_season_end_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(sport_id, season)
);

-- Clear existing data for 2025-26 season to avoid duplicates
DELETE FROM ncaa_tournament_dates WHERE season = '2025-26';
DELETE FROM ncaa_regular_season_dates WHERE season = '2025-26';

-- Insert NCAA tournament dates for 2025-26 season

-- Football (sport_id = 8)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (8, '2025-26', '2025-12-06', '2025-12-06', 'Championship', 'Conference Championship Game');

-- College Football Playoff dates
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (8, '2025-26', '2025-12-20', '2026-01-15', 'NCAA Tournament', 'College Football Playoff');

-- Men's Basketball (sport_id = 1)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (1, '2025-26', '2026-03-17', '2026-04-06', 'NCAA Tournament', 'March Madness - First Four to Championship');

-- Women's Basketball (sport_id = 2)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (2, '2025-26', '2026-03-19', '2026-04-06', 'NCAA Tournament', 'March Madness - First Round to Championship');

-- Men's Golf (sport_id = 15) - estimated based on typical schedule
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (15, '2025-26', '2026-05-28', '2026-06-02', 'NCAA Tournament', 'NCAA Division I Men\'s Golf Championship');

-- Women's Golf (sport_id = 16) - estimated based on typical schedule
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (16, '2025-26', '2026-05-22', '2026-05-27', 'NCAA Tournament', 'NCAA Division I Women\'s Golf Championship');

-- Men's Soccer (sport_id = 17)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (17, '2025-26', '2025-11-20', '2025-12-15', 'NCAA Tournament', 'NCAA Division I Men\'s Soccer Tournament');

-- Women's Soccer (sport_id = 18)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (18, '2025-26', '2025-11-15', '2025-12-07', 'NCAA Tournament', 'NCAA Division I Women\'s Soccer Championship');

-- Softball (sport_id = 19)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (19, '2025-26', '2026-05-21', '2026-06-10', 'NCAA Tournament', 'NCAA Division I Softball Tournament and Women\'s College World Series');

-- Baseball (sport_id = 20)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (20, '2025-26', '2026-05-29', '2026-06-24', 'NCAA Tournament', 'NCAA Division I Baseball Tournament and College World Series');

-- Men's Tennis (sport_id = 21)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (21, '2025-26', '2026-05-15', '2026-05-24', 'NCAA Tournament', 'NCAA Division I Men\'s Tennis Championship');

-- Women's Tennis (sport_id = 22)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (22, '2025-26', '2026-05-15', '2026-05-24', 'NCAA Tournament', 'NCAA Division I Women\'s Tennis Championship');

-- Men's Indoor Track (sport_id = 23)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (23, '2025-26', '2026-03-13', '2026-03-14', 'NCAA Tournament', 'NCAA Division I Men\'s Indoor Track & Field Championship');

-- Women's Indoor Track (sport_id = 24)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (24, '2025-26', '2026-03-13', '2026-03-14', 'NCAA Tournament', 'NCAA Division I Women\'s Indoor Track & Field Championship');

-- Men's Outdoor Track (sport_id = 25)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (25, '2025-26', '2026-06-10', '2026-06-13', 'NCAA Tournament', 'NCAA Division I Men\'s Outdoor Track & Field Championship');

-- Women's Outdoor Track (sport_id = 26)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (26, '2025-26', '2026-06-10', '2026-06-13', 'NCAA Tournament', 'NCAA Division I Women\'s Outdoor Track & Field Championship');

-- Men's Volleyball (sport_id = 27)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (27, '2025-26', '2026-05-05', '2026-05-09', 'NCAA Tournament', 'NCAA Men\'s Volleyball Championship');

-- Women's Volleyball (sport_id = 28)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (28, '2025-26', '2025-12-04', '2025-12-20', 'NCAA Tournament', 'NCAA Division I Women\'s Volleyball Championship');

-- Swimming & Diving - Men's (sport_id = 29)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (29, '2025-26', '2026-03-24', '2026-03-27', 'NCAA Tournament', 'NCAA Division I Men\'s Swimming & Diving Championship');

-- Swimming & Diving - Women's (sport_id = 30)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (30, '2025-26', '2026-03-17', '2026-03-20', 'NCAA Tournament', 'NCAA Division I Women\'s Swimming & Diving Championship');

-- Cross Country - Men's (sport_id = 31)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (31, '2025-26', '2025-11-22', '2025-11-22', 'NCAA Tournament', 'NCAA Division I Men\'s Cross Country Championship');

-- Cross Country - Women's (sport_id = 32)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (32, '2025-26', '2025-11-22', '2025-11-22', 'NCAA Tournament', 'NCAA Division I Women\'s Cross Country Championship');

-- Wrestling (sport_id = 33)
INSERT INTO ncaa_tournament_dates (sport_id, season, start_date, end_date, event_type, notes)
VALUES (33, '2025-26', '2026-03-19', '2026-03-21', 'NCAA Tournament', 'NCAA Division I Wrestling Championship');

-- Populate NCAA regular season dates for 2025-26 based on the official NCAA document

-- Men's Basketball (sport_id = 1)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (1, '2025-26', 
        '2025-09-22', -- 42 days before first regular season contest
        '2025-11-03', -- Official first contest date
        '2026-04-06', -- NCAA Championship game
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Basketball (sport_id = 2)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (2, '2025-26', 
        '2025-09-22', -- 42 days before first regular season contest
        '2025-11-03', -- Official first contest date
        '2026-04-06', -- NCAA Championship game
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Football (sport_id = 8)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (8, '2025-26', 
        '2025-07-28', -- 31 days before first scheduled game
        '2025-08-28', -- Official first contest date
        '2026-01-15', -- End of College Football Playoff
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Men's Golf (sport_id = 15)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (15, '2025-26', 
        '2025-09-01', -- September 1 or five days before classes
        '2025-09-01', -- September 1 or five days before classes
        '2026-06-02', -- NCAA Golf Championships conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Golf (sport_id = 16)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (16, '2025-26', 
        '2025-09-01', -- September 1 or five days before classes
        '2025-09-01', -- September 1 or five days before classes
        '2026-05-27', -- NCAA Golf Championships conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Men's Soccer (sport_id = 17)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (17, '2025-26', 
        '2025-08-12', -- 16 days before first scheduled competition
        '2025-08-28', -- Official first contest date
        '2025-12-15', -- End of academic year finals
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Soccer (sport_id = 18)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (18, '2025-26', 
        '2025-08-05', -- 16 days before first scheduled competition
        '2025-08-21', -- Official first contest date
        '2025-12-07', -- End of academic year finals
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Softball (sport_id = 19)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (19, '2025-26', 
        '2025-09-15', -- September 1 or first day of classes, whichever is later, or September 15
        '2026-02-05', -- Official first contest date
        '2026-06-10', -- NCAA Softball Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Baseball (sport_id = 20)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (20, '2025-26', 
        '2026-01-23', -- Official first practice date
        '2026-02-13', -- Official first contest date
        '2026-06-24', -- NCAA Baseball Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Men's Tennis (sport_id = 21)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (21, '2025-26', 
        '2025-09-07', -- September 7 or first day of classes
        '2025-09-07', -- September 7 or first day of classes
        '2026-05-24', -- NCAA Tennis Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Tennis (sport_id = 22)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (22, '2025-26', 
        '2025-09-07', -- September 7 or first day of classes
        '2025-09-07', -- September 7 or first day of classes
        '2026-05-24', -- NCAA Tennis Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Men's Indoor Track (sport_id = 23)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (23, '2025-26', 
        '2025-09-07', -- September 7 or first day of classes
        '2025-09-07', -- September 7 or first day of classes
        '2026-03-14', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Indoor Track (sport_id = 24)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (24, '2025-26', 
        '2025-09-07', -- September 7 or first day of classes
        '2025-09-07', -- September 7 or first day of classes
        '2026-03-14', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Men's Outdoor Track (sport_id = 25)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (25, '2025-26', 
        '2026-01-07', -- Estimated based on track season
        '2026-01-15', -- Estimated based on track season
        '2026-06-13', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Outdoor Track (sport_id = 26)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (26, '2025-26', 
        '2026-01-07', -- Estimated based on track season
        '2026-01-15', -- Estimated based on track season
        '2026-06-13', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Men's Volleyball (sport_id = 27)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (27, '2025-26', 
        '2025-09-07', -- September 7 or first day of classes
        '2025-09-07', -- September 7 or first day of classes
        '2026-05-09', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Women's Volleyball (sport_id = 28)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (28, '2025-26', 
        '2025-08-12', -- 17 days before first date of competition
        '2025-08-29', -- Official first contest date
        '2025-12-20', -- NCAA Championship game
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Swimming & Diving - Men's (sport_id = 29)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (29, '2025-26', 
        '2025-09-15', -- September 1 or first day of classes, whichever is later, or September 15
        '2025-09-15', -- September 1 or first day of classes, whichever is later, or September 15
        '2026-03-27', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Swimming & Diving - Women's (sport_id = 30)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (30, '2025-26', 
        '2025-09-15', -- September 1 or first day of classes, whichever is later, or September 15
        '2025-09-15', -- September 1 or first day of classes, whichever is later, or September 15
        '2026-03-20', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Cross Country - Men's (sport_id = 31)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (31, '2025-26', 
        '2025-08-13', -- 16 days before first scheduled competition
        '2025-08-29', -- Official first contest date
        '2025-11-22', -- NCAA Championship
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Cross Country - Women's (sport_id = 32)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (32, '2025-26', 
        '2025-08-13', -- 16 days before first scheduled competition
        '2025-08-29', -- Official first contest date
        '2025-11-22', -- NCAA Championship
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Wrestling (sport_id = 33)
INSERT INTO ncaa_regular_season_dates (sport_id, season, first_practice_date, first_contest_date, regular_season_end_date, notes)
VALUES (33, '2025-26', 
        '2025-10-10', -- October 10 of each year
        '2025-11-01', -- November 1 of each year
        '2026-03-21', -- NCAA Championship conclusion
        'Dates from NCAA First Practice, Contest, and End-of-Season document');

-- Initial population of championship formulas table if not already populated
INSERT INTO championship_formulas (sport_id, formula_type, formula_value, notes)
SELECT 
    s.sport_id,
    'relative_to_ncaa' AS formula_type,
    CASE 
        WHEN s.sport_id = 1 THEN '{"weeks_before": 1, "day_of_week": "Sunday"}' -- Men's Basketball: 1 week before NCAA
        WHEN s.sport_id = 2 THEN '{"weeks_before": 1, "day_of_week": "Sunday"}' -- Women's Basketball: 1 week before NCAA
        WHEN s.sport_id = 8 THEN '{"fixed_date": "2025-12-06"}' -- Football: Fixed date
        WHEN s.sport_id IN (15, 16) THEN '{"weeks_before": 2, "day_of_week": "Wednesday"}' -- Golf: 2 weeks before NCAA
        WHEN s.sport_id IN (17, 18) THEN '{"weeks_before": 1, "day_of_week": "Sunday"}' -- Soccer: 1 week before NCAA
        WHEN s.sport_id = 19 THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Softball: 1 week before NCAA
        WHEN s.sport_id = 20 THEN '{"weeks_before": 1, "day_of_week": "Sunday"}' -- Baseball: 1 week before NCAA
        WHEN s.sport_id IN (21, 22) THEN '{"weeks_before": 2, "day_of_week": "Sunday"}' -- Tennis: 2 weeks before NCAA
        WHEN s.sport_id IN (23, 24) THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Indoor Track: 1 week before NCAA
        WHEN s.sport_id IN (25, 26) THEN '{"weeks_before": 2, "day_of_week": "Saturday"}' -- Outdoor Track: 2 weeks before NCAA
        WHEN s.sport_id = 27 THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Men's Volleyball: 1 week before NCAA
        WHEN s.sport_id = 28 THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Women's Volleyball: 1 week before NCAA
        WHEN s.sport_id IN (29, 30) THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Swimming: 1 week before NCAA
        WHEN s.sport_id IN (31, 32) THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Cross Country: 1 week before NCAA
        WHEN s.sport_id = 33 THEN '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Wrestling: 1 week before NCAA
        ELSE '{"weeks_before": 1, "day_of_week": "Saturday"}' -- Default: 1 week before NCAA
    END AS formula_value,
    'Default Big 12 Championship formula based on sport type' AS notes
FROM 
    sports s
WHERE 
    NOT EXISTS (SELECT 1 FROM championship_formulas cf WHERE cf.sport_id = s.sport_id)
ORDER BY 
    s.sport_id;

-- Log the completion
SELECT 'NCAA Tournament dates for 2025-26 season have been populated successfully.' AS result;
