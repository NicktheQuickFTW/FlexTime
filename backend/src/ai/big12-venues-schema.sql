-- FlexTime Big 12 Venues Comprehensive Schema
-- Complete venue setup for all Big 12 schools and sports
-- Using school-venue ID pattern: SSVV (school_id + venue_type)
--
-- VENUE TYPE REFERENCE:
-- 01 = Football Stadium    🏈 (Primary outdoor venue)
-- 02 = Arena/Gymnasium     🏀 (Basketball, Gymnastics)  
-- 03 = Baseball Complex    ⚾ (Baseball)
-- 04 = Softball Complex    🥎 (Softball)
-- 05 = Soccer Field        ⚽ (Soccer)
-- 06 = Volleyball Facility 🏐 (Volleyball)
-- 07 = Tennis Complex      🎾 (Men's & Women's Tennis)
-- 08 = Track & Field       🏃 (All track events)
-- 09 = Swimming Pool       🏊 (Swimming & Diving)
-- 10 = Golf Course         ⛳ (Golf)

-- ============================================================================
-- FOOTBALL STADIUMS (Venue Type 01)
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Football Stadium = 0101
(0101, 'Arizona Stadium', 'Tucson', 'AZ', 57000, 108),
-- Arizona State (school_id=2) - Football Stadium = 0201  
(0201, 'Mountain America Stadium', 'Tempe', 'AZ', 53000, 208),
-- Baylor (school_id=3) - Football Stadium = 0301
(0301, 'McLane Stadium', 'Waco', 'TX', 45000, 308),
-- BYU (school_id=4) - Football Stadium = 0401
(0401, 'LaVell Edwards Stadium', 'Provo', 'UT', 63000, 408),
-- UCF (school_id=5) - Football Stadium = 0501
(0501, 'FBC Mortgage Stadium', 'Orlando', 'FL', 45000, 508),
-- Cincinnati (school_id=6) - Football Stadium = 0601
(0601, 'Nippert Stadium', 'Cincinnati', 'OH', 40000, 608),
-- Colorado (school_id=7) - Football Stadium = 0701
(0701, 'Folsom Field', 'Boulder', 'CO', 50000, 708),
-- Houston (school_id=8) - Football Stadium = 0801
(0801, 'TDECU Stadium', 'Houston', 'TX', 40000, 808),
-- Iowa State (school_id=9) - Football Stadium = 0901
(0901, 'Jack Trice Stadium', 'Ames', 'IA', 61500, 908),
-- Kansas (school_id=10) - Football Stadium = 1001
(1001, 'David Booth Kansas Memorial Stadium', 'Lawrence', 'KS', 47000, 1008),
-- Kansas State (school_id=11) - Football Stadium = 1101
(1101, 'Bill Snyder Family Stadium', 'Manhattan', 'KS', 50000, 1108),
-- Oklahoma State (school_id=12) - Football Stadium = 1201
(1201, 'Boone Pickens Stadium', 'Stillwater', 'OK', 55500, 1208),
-- TCU (school_id=13) - Football Stadium = 1301
(1301, 'Amon G. Carter Stadium', 'Fort Worth', 'TX', 45000, 1308),
-- Texas Tech (school_id=14) - Football Stadium = 1401
(1401, 'Jones AT&T Stadium', 'Lubbock', 'TX', 60000, 1408),
-- Utah (school_id=15) - Football Stadium = 1501
(1501, 'Rice-Eccles Stadium', 'Salt Lake City', 'UT', 51000, 1508),
-- West Virginia (school_id=16) - Football Stadium = 1601
(1601, 'Milan Puskar Stadium', 'Morgantown', 'WV', 60000, 1608);

-- ============================================================================
-- ARENAS/GYMNASIUMS (Venue Type 02) - Basketball, Gymnastics
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Arena = 0102 (Men's Basketball team_id = 102)
(0102, 'McKale Center', 'Tucson', 'AZ', 14644, 102),
-- Arizona State (school_id=2) - Arena = 0202
(0202, 'Desert Financial Arena', 'Tempe', 'AZ', 14198, 202),
-- Baylor (school_id=3) - Arena = 0302
(0302, 'Foster Pavilion', 'Waco', 'TX', 10284, 302),
-- BYU (school_id=4) - Arena = 0402
(0402, 'Marriott Center', 'Provo', 'UT', 22700, 402),
-- UCF (school_id=5) - Arena = 0502
(0502, 'Addition Financial Arena', 'Orlando', 'FL', 10000, 502),
-- Cincinnati (school_id=6) - Arena = 0602
(0602, 'Fifth Third Arena', 'Cincinnati', 'OH', 12012, 602),
-- Colorado (school_id=7) - Arena = 0702
(0702, 'CU Events Center', 'Boulder', 'CO', 11064, 702),
-- Houston (school_id=8) - Arena = 0802
(0802, 'Fertitta Center', 'Houston', 'TX', 7100, 802),
-- Iowa State (school_id=9) - Arena = 0902
(0902, 'Hilton Coliseum', 'Ames', 'IA', 14267, 902),
-- Kansas (school_id=10) - Arena = 1002
(1002, 'Allen Fieldhouse', 'Lawrence', 'KS', 16300, 1002),
-- Kansas State (school_id=11) - Arena = 1102
(1102, 'Bramlage Coliseum', 'Manhattan', 'KS', 12528, 1102),
-- Oklahoma State (school_id=12) - Arena = 1202
(1202, 'Gallagher-Iba Arena', 'Stillwater', 'OK', 13611, 1202),
-- TCU (school_id=13) - Arena = 1302
(1302, 'Schollmaier Arena', 'Fort Worth', 'TX', 7166, 1302),
-- Texas Tech (school_id=14) - Arena = 1402
(1402, 'United Supermarkets Arena', 'Lubbock', 'TX', 15300, 1402),
-- Utah (school_id=15) - Arena = 1502
(1502, 'Jon M. Huntsman Center', 'Salt Lake City', 'UT', 15000, 1502),
-- West Virginia (school_id=16) - Arena = 1602
(1602, 'WVU Coliseum', 'Morgantown', 'WV', 14000, 1602);

-- ============================================================================
-- BASEBALL COMPLEXES (Venue Type 03) - Baseball Only
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Baseball = 0103 (Baseball team_id = 101)
(0103, 'Hi Corbett Field', 'Tucson', 'AZ', 9500, 101),
-- Arizona State (school_id=2) - Baseball = 0203
(0203, 'Phoenix Municipal Stadium', 'Tempe', 'AZ', 8775, 201),
-- Baylor (school_id=3) - Baseball = 0303
(0303, 'Baylor Ballpark', 'Waco', 'TX', 5000, 301),
-- BYU (school_id=4) - Baseball = 0403
(0403, 'Larry H. Miller Field', 'Provo', 'UT', 2500, 401),
-- UCF (school_id=5) - Baseball = 0503
(0503, 'John Euliano Park', 'Orlando', 'FL', 3000, 501),
-- Cincinnati (school_id=6) - Baseball = 0603
(0603, 'Marge Schott Stadium', 'Cincinnati', 'OH', 3085, 601),
-- Houston (school_id=8) - Baseball = 0803 (No Colorado baseball)
(0803, 'Darryl & Lori Schroeder Park', 'Houston', 'TX', 5000, 801),
-- Iowa State (school_id=9) - Baseball = 0903
(0903, 'Cap Timm Field', 'Ames', 'IA', 1500, 901),
-- Kansas (school_id=10) - Baseball = 1003
(1003, 'Hoglund Ballpark', 'Lawrence', 'KS', 2500, 1001),
-- Kansas State (school_id=11) - Baseball = 1103
(1103, 'Tointon Family Stadium', 'Manhattan', 'KS', 1500, 1101),
-- Oklahoma State (school_id=12) - Baseball = 1203
(1203, 'ONeal Field at Allie P. Reynolds Stadium', 'Stillwater', 'OK', 4200, 1201),
-- TCU (school_id=13) - Baseball = 1303
(1303, 'Lupton Stadium', 'Fort Worth', 'TX', 3500, 1301),
-- Texas Tech (school_id=14) - Baseball = 1403
(1403, 'Dan Law Field at Rip Griffin Park', 'Lubbock', 'TX', 4500, 1401),
-- Utah (school_id=15) - Baseball = 1503
(1503, 'Smith Ballpark', 'Salt Lake City', 'UT', 2500, 1501),
-- West Virginia (school_id=16) - Baseball = 1603
(1603, 'Monongalia County Ballpark', 'Morgantown', 'WV', 3500, 1601);

-- ============================================================================
-- SOFTBALL COMPLEXES (Venue Type 04) - Softball Only
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Softball = 0104 (Softball team_id = 115)
(0104, 'Hillenbrand Stadium', 'Tucson', 'AZ', 2000, 115),
-- Arizona State (school_id=2) - Softball = 0204
(0204, 'Farrington Stadium', 'Tempe', 'AZ', 1500, 215),
-- Baylor (school_id=3) - Softball = 0304
(0304, 'Getterman Stadium', 'Waco', 'TX', 1288, 315),
-- BYU (school_id=4) - Softball = 0404
(0404, 'Gail Miller Field', 'Provo', 'UT', 1500, 415),
-- UCF (school_id=5) - Softball = 0504
(0504, 'UCF Softball Complex', 'Orlando', 'FL', 1000, 515),
-- Houston (school_id=8) - Softball = 0804 (No Cincinnati, Colorado softball)
(0804, 'Cougar Softball Stadium', 'Houston', 'TX', 1500, 815),
-- Iowa State (school_id=9) - Softball = 0904
(0904, 'Cyclone Sports Complex', 'Ames', 'IA', 1500, 915),
-- Kansas (school_id=10) - Softball = 1004
(1004, 'Arrocha Ballpark', 'Lawrence', 'KS', 1200, 1015),
-- Oklahoma State (school_id=12) - Softball = 1204 (No Kansas State softball)
(1204, 'Cowgirl Stadium', 'Stillwater', 'OK', 3000, 1215),
-- Texas Tech (school_id=14) - Softball = 1404 (No TCU softball)
(1404, 'Rocky Johnson Field', 'Lubbock', 'TX', 1200, 1415),
-- Utah (school_id=15) - Softball = 1504
(1504, 'Dumke Family Softball Stadium', 'Salt Lake City', 'UT', 1500, 1515);

-- ============================================================================
-- SOCCER FIELDS (Venue Type 05) - Soccer
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Soccer = 0105 (Soccer team_id = 114)
(0105, 'Murphey Field at Mulcahy Soccer Stadium', 'Tucson', 'AZ', 3000, 114),
-- Arizona State (school_id=2) - Soccer = 0205
(0205, 'Phoenix Rising Soccer Complex', 'Tempe', 'AZ', 2000, 214),
-- Baylor (school_id=3) - Soccer = 0305
(0305, 'Betty Lou Mays Field', 'Waco', 'TX', 1500, 314),
-- BYU (school_id=4) - Soccer = 0405
(0405, 'South Field', 'Provo', 'UT', 2000, 414),
-- UCF (school_id=5) - Soccer = 0505
(0505, 'UCF Soccer Complex', 'Orlando', 'FL', 2000, 514),
-- Cincinnati (school_id=6) - Soccer = 0605
(0605, 'Gettler Stadium', 'Cincinnati', 'OH', 3000, 614),
-- Colorado (school_id=7) - Soccer = 0705
(0705, 'Prentup Field', 'Boulder', 'CO', 2000, 714),
-- Houston (school_id=8) - Soccer = 0805
(0805, 'Carl Lewis International Complex', 'Houston', 'TX', 1500, 814),
-- Iowa State (school_id=9) - Soccer = 0905
(0905, 'Cyclone Sports Complex', 'Ames', 'IA', 2500, 914),
-- Kansas (school_id=10) - Soccer = 1005
(1005, 'Rock Chalk Park', 'Lawrence', 'KS', 2500, 1014),
-- Kansas State (school_id=11) - Soccer = 1105
(1105, 'Buser Family Park', 'Manhattan', 'KS', 1500, 1114),
-- Oklahoma State (school_id=12) - Soccer = 1205
(1205, 'Neal Patterson Stadium', 'Stillwater', 'OK', 3000, 1214),
-- TCU (school_id=13) - Soccer = 1305
(1305, 'Garvey-Rosenthal Soccer Stadium', 'Fort Worth', 'TX', 1500, 1314),
-- Texas Tech (school_id=14) - Soccer = 1405
(1405, 'John Walker Soccer Complex', 'Lubbock', 'TX', 1500, 1414),
-- UCF (school_id=5) - Soccer = 0505 (Already added above)
-- Utah (school_id=15) - Soccer = 1505
(1505, 'Ute Field', 'Salt Lake City', 'UT', 2000, 1514),
-- West Virginia (school_id=16) - Soccer = 1605
(1605, 'Dick Dlesk Soccer Stadium', 'Morgantown', 'WV', 1650, 1614);

-- ============================================================================
-- VOLLEYBALL FACILITIES (Venue Type 06) - Volleyball Only
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Volleyball = 0106 (Volleyball team_id = 124)
(0106, 'Bear Down Gym', 'Tucson', 'AZ', 1200, 124),
-- Arizona State (school_id=2) - Volleyball = 0206
(0206, 'Weatherup Center', 'Tempe', 'AZ', 1000, 224),
-- Baylor (school_id=3) - Volleyball = 0306
(0306, 'Ferrell Center Auxiliary Gym', 'Waco', 'TX', 1500, 324),
-- BYU (school_id=4) - Volleyball = 0406
(0406, 'Smith Fieldhouse', 'Provo', 'UT', 5000, 424),
-- UCF (school_id=5) - Volleyball = 0506
(0506, 'The Venue', 'Orlando', 'FL', 2000, 524),
-- Cincinnati (school_id=6) - Volleyball = 0606
(0606, 'Armory Fieldhouse', 'Cincinnati', 'OH', 1200, 624),
-- Colorado (school_id=7) - Volleyball = 0706
(0706, 'CU Events Center Auxiliary', 'Boulder', 'CO', 2000, 724),
-- Houston (school_id=8) - Volleyball = 0806
(0806, 'Athletics/Alumni Center', 'Houston', 'TX', 1500, 824),
-- Iowa State (school_id=9) - Volleyball = 0906
(0906, 'Ames High School', 'Ames', 'IA', 2000, 924),
-- Kansas (school_id=10) - Volleyball = 1006
(1006, 'Horejsi Family Volleyball Arena', 'Lawrence', 'KS', 1500, 1024),
-- Kansas State (school_id=11) - Volleyball = 1106
(1106, 'Ahearn Field House', 'Manhattan', 'KS', 2500, 1124),
-- TCU (school_id=13) - Volleyball = 1306 (No Oklahoma State volleyball)
(1306, 'University Recreation Center', 'Fort Worth', 'TX', 1500, 1324),
-- Texas Tech (school_id=14) - Volleyball = 1406
(1406, 'Sports Performance Center', 'Lubbock', 'TX', 1000, 1424),
-- Utah (school_id=15) - Volleyball = 1506
(1506, 'Jon M. Huntsman Center Auxiliary', 'Salt Lake City', 'UT', 2000, 1524),
-- West Virginia (school_id=16) - Volleyball = 1606
(1606, 'WVU Coliseum Auxiliary', 'Morgantown', 'WV', 1500, 1624);

-- ============================================================================
-- TENNIS COMPLEXES (Venue Type 07) - Men's & Women's Tennis
-- ============================================================================

INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
-- Arizona (school_id=1) - Tennis = 0107 (Men's Tennis team_id = 118)
(0107, 'LaNelle Robson Tennis Center', 'Tucson', 'AZ', 1000, 118),
-- Arizona State (school_id=2) - Tennis = 0207
(0207, 'Whiteman Tennis Center', 'Tempe', 'AZ', 1500, 218),
-- Baylor (school_id=3) - Tennis = 0307
(0307, 'Hurd Tennis Center', 'Waco', 'TX', 500, 318),
-- BYU (school_id=4) - Tennis = 0407
(0407, 'BYU Tennis Courts', 'Provo', 'UT', 1000, 418),
-- Oklahoma State (school_id=12) - Tennis = 1207 (Limited Big 12 tennis)
(1207, 'Greenwood Tennis Center', 'Stillwater', 'OK', 1000, 1218),
-- TCU (school_id=13) - Tennis = 1307
(1307, 'Bayard H. Friedman Tennis Center', 'Fort Worth', 'TX', 1000, 1318),
-- Texas Tech (school_id=14) - Tennis = 1407
(1407, 'McLeod Tennis Center', 'Lubbock', 'TX', 1000, 1418),
-- UCF (school_id=5) - Tennis = 0507
(0507, 'UCF Tennis Complex', 'Orlando', 'FL', 500, 518),
-- Utah (school_id=15) - Tennis = 1507
(1507, 'George S. Eccles Tennis Center', 'Salt Lake City', 'UT', 1000, 1518);

-- ============================================================================
-- VENUE-SPORT MAPPINGS
-- Note: Some venues host multiple sports - this is handled via team_id relationships
-- ============================================================================

-- Add comments for multi-sport venues
COMMENT ON TABLE venues IS 'FlexTime venue schema with SSVV ID pattern (school_id + venue_type)';

-- Create venue type lookup function
CREATE OR REPLACE FUNCTION get_venue_type_name(venue_type_id INTEGER)
RETURNS VARCHAR AS $$
BEGIN
    RETURN CASE venue_type_id
        WHEN 1 THEN 'Football Stadium'
        WHEN 2 THEN 'Arena/Gymnasium'
        WHEN 3 THEN 'Baseball Complex'
        WHEN 4 THEN 'Softball Complex'
        WHEN 5 THEN 'Soccer Field'
        WHEN 6 THEN 'Volleyball Facility'
        WHEN 7 THEN 'Tennis Complex'
        WHEN 8 THEN 'Track & Field'
        WHEN 9 THEN 'Swimming Pool'
        WHEN 10 THEN 'Golf Course'
        ELSE 'Unknown Venue Type'
    END;
END;
$$ LANGUAGE plpgsql;

-- Create helper view for venue analysis
CREATE VIEW venue_summary AS
SELECT 
    venue_id,
    name,
    city,
    state,
    capacity,
    (venue_id / 100) as school_id,
    (venue_id % 100) as venue_type_id,
    get_venue_type_name(venue_id % 100) as venue_type_name,
    team_id
FROM venues
ORDER BY venue_id;

-- Index for performance
CREATE INDEX idx_venues_school_id ON venues ((venue_id / 100));
CREATE INDEX idx_venues_type_id ON venues ((venue_id % 100));

COMMENT ON VIEW venue_summary IS 'Analysis view showing venue breakdown by school and type';