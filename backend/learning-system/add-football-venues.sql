-- Insert football venues for the Big 12 teams
-- First, let's get the next available venue_id
DO $$
DECLARE
    next_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(venue_id) + 1, 1) INTO next_id FROM venues;
    -- Set the sequence to start from the next available ID
    EXECUTE 'ALTER SEQUENCE IF EXISTS venues_venue_id_seq RESTART WITH ' || next_id;
END $$;

-- Now insert venues with automatically generated IDs
INSERT INTO venues (name, city, state, capacity, team_id) VALUES
('Arizona Stadium', 'Tucson', 'AZ', 57000, (SELECT team_id FROM teams WHERE name = 'Arizona Wildcats' AND sport_id = 8)),
('Mountain America Stadium', 'Tempe', 'AZ', 53000, (SELECT team_id FROM teams WHERE name = 'Arizona State Sun Devils' AND sport_id = 8)),
('McLane Stadium', 'Waco', 'TX', 45000, (SELECT team_id FROM teams WHERE name = 'Baylor Bears' AND sport_id = 8)),
('LaVell Edwards Stadium', 'Provo', 'UT', 63000, (SELECT team_id FROM teams WHERE name = 'BYU Cougars' AND sport_id = 8)),
('Nippert Stadium', 'Cincinnati', 'OH', 40000, (SELECT team_id FROM teams WHERE name = 'Cincinnati Bearcats' AND sport_id = 8)),
('Folsom Field', 'Boulder', 'CO', 50000, (SELECT team_id FROM teams WHERE name = 'Colorado Buffaloes' AND sport_id = 8)),
('TDECU Stadium', 'Houston', 'TX', 40000, (SELECT team_id FROM teams WHERE name = 'Houston Cougars' AND sport_id = 8)),
('Jack Trice Stadium', 'Ames', 'IA', 61500, (SELECT team_id FROM teams WHERE name = 'Iowa State Cyclones' AND sport_id = 8)),
('David Booth Kansas Memorial Stadium', 'Lawrence', 'KS', 47000, (SELECT team_id FROM teams WHERE name = 'Kansas Jayhawks' AND sport_id = 8)),
('Bill Snyder Family Stadium', 'Manhattan', 'KS', 50000, (SELECT team_id FROM teams WHERE name = 'Kansas State Wildcats' AND sport_id = 8)),
('Boone Pickens Stadium', 'Stillwater', 'OK', 55500, (SELECT team_id FROM teams WHERE name = 'Oklahoma State Cowboys' AND sport_id = 8)),
('Amon G. Carter Stadium', 'Fort Worth', 'TX', 45000, (SELECT team_id FROM teams WHERE name = 'TCU Horned Frogs' AND sport_id = 8)),
('Jones AT&T Stadium', 'Lubbock', 'TX', 60000, (SELECT team_id FROM teams WHERE name = 'Texas Tech Red Raiders' AND sport_id = 8)),
('FBC Mortgage Stadium', 'Orlando', 'FL', 45000, (SELECT team_id FROM teams WHERE name = 'UCF Knights' AND sport_id = 8)),
('Rice-Eccles Stadium', 'Salt Lake City', 'UT', 51000, (SELECT team_id FROM teams WHERE name = 'Utah Utes' AND sport_id = 8)),
('Milan Puskar Stadium', 'Morgantown', 'WV', 60000, (SELECT team_id FROM teams WHERE name = 'West Virginia Mountaineers' AND sport_id = 8));
