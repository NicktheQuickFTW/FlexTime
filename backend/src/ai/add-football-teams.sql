-- Insert Big 12 football teams into Neon database
-- team_id follows pattern: school_id + zero-padded sport_id
-- Football sport_id = 8, so team_ids will be: school_id + "08" (e.g., 108, 508, 608, etc.)
-- Corrected school_id mappings based on actual Neon database
INSERT INTO teams (name, mascot, school_id, sport_id) VALUES
('Arizona Wildcats', 'Wildcats', 1, 8),
('Arizona State Sun Devils', 'Sun Devils', 2, 8),
('Baylor Bears', 'Bears', 3, 8),
('BYU Cougars', 'Cougars', 4, 8),
('UCF Knights', 'Knights', 5, 8),
('Cincinnati Bearcats', 'Bearcats', 6, 8),
('Colorado Buffaloes', 'Buffaloes', 7, 8),
('Houston Cougars', 'Cougars', 8, 8),
('Iowa State Cyclones', 'Cyclones', 9, 8),
('Kansas Jayhawks', 'Jayhawks', 10, 8),
('Kansas State Wildcats', 'Wildcats', 11, 8),
('Oklahoma State Cowboys', 'Cowboys', 12, 8),
('TCU Horned Frogs', 'Horned Frogs', 13, 8),
('Texas Tech Red Raiders', 'Red Raiders', 14, 8),
('Utah Utes', 'Utes', 15, 8),
('West Virginia Mountaineers', 'Mountaineers', 16, 8);
