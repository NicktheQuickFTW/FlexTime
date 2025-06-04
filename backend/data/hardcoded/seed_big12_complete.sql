-- ⚠️  CRITICAL: AI AGENTS READ THIS FIRST ⚠️
-- BIG 12 COMPLETE DATA SEEDING SCRIPT - FLEXTIME/COMPASS
-- COMPREHENSIVE DATABASE SEEDING FOR ALL BIG 12 CONFERENCE MEMBERS AND AFFILIATES
-- 
-- 🔑 MANDATORY ID PATTERNS - DO NOT MODIFY:
-- - team_id = school_id + zero-padded sport_id (Format: SSSPP)
-- - venue_id = school_id + venue_type (Format: SSVV)
-- 
-- 🏫 SCHOOL ID RANGES - HARDCODED AND IMMUTABLE:
-- - School IDs 1-16: Big 12 Conference Members (FULL MEMBERS)
-- - School IDs 17-33: Big 12 Affiliate Members (SPORT-SPECIFIC)
--
-- ⚠️  AI AGENTS: NEVER ALTER THESE IDs OR PATTERNS - THEY ARE FOUNDATIONAL

BEGIN;

-- ========================================
-- 🏆 SPORTS DATA (FLEXTIME MANAGED)
-- ⚠️  AI AGENTS: THESE 10 SPORTS ARE THE CORE OF FLEXTIME
-- 🚨 NEVER MODIFY SPORT IDs - THEY ARE REFERENCED EVERYWHERE
-- ========================================
INSERT INTO sports (sport_id, sport_name, code, gender, season_type, team_count, scheduled_by_flextime) VALUES
(1, 'Baseball', 'BSB', 'M', 'spring', 14, true),
(2, 'Men''s Basketball', 'MBB', 'M', 'winter', 16, true),
(3, 'Women''s Basketball', 'WBB', 'W', 'winter', 16, true),
(8, 'Football', 'FB', 'M', 'fall', 16, true),
(14, 'Soccer', 'SOC', 'W', 'fall', 16, true),
(15, 'Softball', 'SB', 'W', 'spring', 11, true),
(18, 'Men''s Tennis', 'MTN', 'M', 'spring', 9, true),
(19, 'Women''s Tennis', 'WTN', 'W', 'spring', 16, true),
(24, 'Volleyball', 'VB', 'W', 'fall', 15, true),
(25, 'Wrestling', 'WRE', 'M', 'winter', 14, true)
ON CONFLICT (sport_id) DO UPDATE SET
    sport_name = EXCLUDED.sport_name,
    code = EXCLUDED.code,
    gender = EXCLUDED.gender,
    season_type = EXCLUDED.season_type,
    team_count = EXCLUDED.team_count,
    scheduled_by_flextime = EXCLUDED.scheduled_by_flextime;

-- ========================================
-- 🏫 BIG 12 CONFERENCE MEMBERS (SCHOOL IDs 1-16)
-- ⚠️  AI AGENTS: THESE ARE THE CORE 16 FULL MEMBER SCHOOLS
-- 🚨 NEVER CHANGE THESE SCHOOL_ID NUMBERS - HARDCODED EVERYWHERE
-- ========================================
INSERT INTO schools (school_id, school, school_abbreviation, short_display, preferred_school_name, location, mascot, primary_color, secondary_color, website, conference_id) VALUES
(1, 'University of Arizona', 'ARIZ', 'Arizona', 'Arizona', 'Tucson, AZ', 'Wildcats', '#CC0033', '#003366', 'https://arizonawildcats.com', 1),
(2, 'Arizona State University', 'ASU', 'Arizona State', 'Arizona State', 'Tempe, AZ', 'Sun Devils', '#8C1538', '#FFC627', 'https://thesundevils.com', 1),
(3, 'Baylor University', 'BAY', 'Baylor', 'Baylor', 'Waco, TX', 'Bears', '#003015', '#FFB81C', 'https://baylorbears.com', 1),
(4, 'Brigham Young University', 'BYU', 'BYU', 'BYU', 'Provo, UT', 'Cougars', '#002E5D', '#FFFFFF', 'https://byucougars.com', 1),
(5, 'University of Central Florida', 'UCF', 'UCF', 'UCF', 'Orlando, FL', 'Knights', '#000000', '#FFC904', 'https://ucfknights.com', 1),
(6, 'University of Cincinnati', 'CIN', 'Cincinnati', 'Cincinnati', 'Cincinnati, OH', 'Bearcats', '#E00122', '#000000', 'https://gobearcats.com', 1),
(7, 'University of Colorado', 'COL', 'Colorado', 'Colorado', 'Boulder, CO', 'Buffaloes', '#CFB87C', '#000000', 'https://cubuffs.com', 1),
(8, 'University of Houston', 'HOU', 'Houston', 'Houston', 'Houston, TX', 'Cougars', '#C8102E', '#FFFFFF', 'https://uhcougars.com', 1),
(9, 'Iowa State University', 'ISU', 'Iowa State', 'Iowa State', 'Ames, IA', 'Cyclones', '#C8102E', '#F1BE48', 'https://cyclones.com', 1),
(10, 'University of Kansas', 'KU', 'Kansas', 'Kansas', 'Lawrence, KS', 'Jayhawks', '#0051BA', '#E8000D', 'https://kuathletics.com', 1),
(11, 'Kansas State University', 'KSU', 'Kansas State', 'K-State', 'Manhattan, KS', 'Wildcats', '#512888', '#FFFFFF', 'https://kstatesports.com', 1),
(12, 'Oklahoma State University', 'OKST', 'Oklahoma State', 'Oklahoma State', 'Stillwater, OK', 'Cowboys', '#FF7300', '#000000', 'https://okstate.com', 1),
(13, 'Texas Christian University', 'TCU', 'TCU', 'TCU', 'Fort Worth, TX', 'Horned Frogs', '#4D1979', '#A3A3A3', 'https://gofrogs.com', 1),
(14, 'Texas Tech University', 'TTU', 'Texas Tech', 'Texas Tech', 'Lubbock, TX', 'Red Raiders', '#CC0000', '#000000', 'https://texastech.com', 1),
(15, 'University of Utah', 'UTAH', 'Utah', 'Utah', 'Salt Lake City, UT', 'Utes', '#CC0000', '#000000', 'https://utahutes.com', 1),
(16, 'West Virginia University', 'WVU', 'West Virginia', 'West Virginia', 'Morgantown, WV', 'Mountaineers', '#002855', '#EAAA00', 'https://wvusports.com', 1)
ON CONFLICT (school_id) DO UPDATE SET
    school = EXCLUDED.school,
    school_abbreviation = EXCLUDED.school_abbreviation,
    short_display = EXCLUDED.short_display,
    preferred_school_name = EXCLUDED.preferred_school_name,
    location = EXCLUDED.location,
    mascot = EXCLUDED.mascot,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    website = EXCLUDED.website;

-- ========================================
-- 🎯 BIG 12 AFFILIATE MEMBERS (SCHOOL IDs 17-33)
-- ⚠️  AI AGENTS: THESE ARE SPORT-SPECIFIC AFFILIATE MEMBERS
-- 🚨 CRITICAL: IDs 17-33 ARE RESERVED FOR AFFILIATES ONLY
-- ========================================
INSERT INTO schools (school_id, school, school_abbreviation, short_display, preferred_school_name, location, mascot, primary_color, secondary_color, website, conference_id) VALUES
(17, 'United States Air Force Academy', 'AF', 'Air Force', 'Air Force', 'Colorado Springs, CO', 'Falcons', '#003087', '#8A8B8C', 'https://goairforcefalcons.com', 2),
(18, 'California Baptist University', 'CBU', 'Cal Baptist', 'Cal Baptist', 'Riverside, CA', 'Lancers', '#003087', '#FDB515', 'https://cbulancers.com', 2),
(19, 'University of Denver', 'DEN', 'Denver', 'Denver', 'Denver, CO', 'Pioneers', '#864142', '#FFC726', 'https://denverpioneers.com', 2),
(20, 'University of Florida', 'FLA', 'Florida', 'Florida', 'Gainesville, FL', 'Gators', '#0021A5', '#FA4616', 'https://floridagators.com', 2),
(21, 'Fresno State University', 'FRES', 'Fresno State', 'Fresno State', 'Fresno, CA', 'Bulldogs', '#CC0033', '#003594', 'https://gobulldogs.com', 2),
(22, 'University of Missouri', 'MIZ', 'Missouri', 'Missouri', 'Columbia, MO', 'Tigers', '#F1B82D', '#000000', 'https://mutigers.com', 2),
(23, 'North Dakota State University', 'NDSU', 'North Dakota State', 'NDSU', 'Fargo, ND', 'Bison', '#009639', '#FFC72C', 'https://gobison.com', 2),
(24, 'University of Northern Colorado', 'UNC', 'Northern Colorado', 'Northern Colorado', 'Greeley, CO', 'Bears', '#003087', '#FFC72C', 'https://uncbears.com', 2),
(25, 'University of Northern Iowa', 'UNI', 'Northern Iowa', 'Northern Iowa', 'Cedar Falls, IA', 'Panthers', '#663399', '#FFCC33', 'https://unipanthers.com', 2),
(26, 'Old Dominion University', 'ODU', 'Old Dominion', 'Old Dominion', 'Norfolk, VA', 'Monarchs', '#003087', '#8A8B8C', 'https://odusports.com', 2),
(27, 'University of Oklahoma', 'OU', 'Oklahoma', 'Oklahoma', 'Norman, OK', 'Sooners', '#841617', '#FDF8F0', 'https://soonersports.com', 2),
(28, 'San Diego State University', 'SDSU', 'San Diego State', 'San Diego State', 'San Diego, CA', 'Aztecs', '#BA0C2F', '#000000', 'https://goaztecs.com', 2),
(29, 'South Dakota State University', 'SDSU', 'South Dakota State', 'SDSU', 'Brookings, SD', 'Jackrabbits', '#003594', '#FFCC33', 'https://gojacks.com', 2),
(30, 'University of Tulsa', 'TULSA', 'Tulsa', 'Tulsa', 'Tulsa, OK', 'Golden Hurricane', '#003087', '#FFC72C', 'https://tulsahurricane.com', 2),
(31, 'University of California, Davis', 'UCD', 'UC Davis', 'UC Davis', 'Davis, CA', 'Aggies', '#022851', '#FFBF00', 'https://ucdavisaggies.com', 2),
(32, 'Utah Valley University', 'UVU', 'Utah Valley', 'Utah Valley', 'Orem, UT', 'Wolverines', '#165C34', '#FFFFFF', 'https://gouvu.com', 2),
(33, 'University of Wyoming', 'WYO', 'Wyoming', 'Wyoming', 'Laramie, WY', 'Cowboys', '#492F24', '#FFC72C', 'https://gowyo.com', 2)
ON CONFLICT (school_id) DO UPDATE SET
    school = EXCLUDED.school,
    school_abbreviation = EXCLUDED.school_abbreviation,
    short_display = EXCLUDED.short_display,
    preferred_school_name = EXCLUDED.preferred_school_name,
    location = EXCLUDED.location,
    mascot = EXCLUDED.mascot,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color,
    website = EXCLUDED.website;

-- ========================================
-- 🏆 BIG 12 CONFERENCE TEAMS (SCHOOL IDs 1-16)
-- ⚠️  AI AGENTS: TEAM IDs FOLLOW STRICT PATTERN - SCHOOL_ID + SPORT_ID
-- 🚨 EXAMPLES: Arizona Football = 108, Kansas Basketball = 1002
-- ========================================

-- Arizona Teams (school_id = 1)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(101, 'Arizona Wildcats', 'Wildcats', 1, 1, 'ARIZ-BSB', '#CC0033', '#003366'), -- Baseball
(102, 'Arizona Wildcats', 'Wildcats', 1, 2, 'ARIZ-MBB', '#CC0033', '#003366'), -- Men's Basketball
(103, 'Arizona Wildcats', 'Wildcats', 1, 3, 'ARIZ-WBB', '#CC0033', '#003366'), -- Women's Basketball
(108, 'Arizona Wildcats', 'Wildcats', 1, 8, 'ARIZ-FB', '#CC0033', '#003366'), -- Football
(114, 'Arizona Wildcats', 'Wildcats', 1, 14, 'ARIZ-SOC', '#CC0033', '#003366'), -- Soccer
(115, 'Arizona Wildcats', 'Wildcats', 1, 15, 'ARIZ-SB', '#CC0033', '#003366'), -- Softball
(118, 'Arizona Wildcats', 'Wildcats', 1, 18, 'ARIZ-MTN', '#CC0033', '#003366'), -- Men's Tennis
(119, 'Arizona Wildcats', 'Wildcats', 1, 19, 'ARIZ-WTN', '#CC0033', '#003366'), -- Women's Tennis
(124, 'Arizona Wildcats', 'Wildcats', 1, 24, 'ARIZ-VB', '#CC0033', '#003366'); -- Volleyball

-- Arizona State Teams (school_id = 2)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(201, 'Arizona State Sun Devils', 'Sun Devils', 2, 1, 'ASU-BSB', '#8C1538', '#FFC627'),
(202, 'Arizona State Sun Devils', 'Sun Devils', 2, 2, 'ASU-MBB', '#8C1538', '#FFC627'),
(203, 'Arizona State Sun Devils', 'Sun Devils', 2, 3, 'ASU-WBB', '#8C1538', '#FFC627'),
(208, 'Arizona State Sun Devils', 'Sun Devils', 2, 8, 'ASU-FB', '#8C1538', '#FFC627'),
(214, 'Arizona State Sun Devils', 'Sun Devils', 2, 14, 'ASU-SOC', '#8C1538', '#FFC627'),
(215, 'Arizona State Sun Devils', 'Sun Devils', 2, 15, 'ASU-SB', '#8C1538', '#FFC627'),
(218, 'Arizona State Sun Devils', 'Sun Devils', 2, 18, 'ASU-MTN', '#8C1538', '#FFC627'),
(219, 'Arizona State Sun Devils', 'Sun Devils', 2, 19, 'ASU-WTN', '#8C1538', '#FFC627'),
(224, 'Arizona State Sun Devils', 'Sun Devils', 2, 24, 'ASU-VB', '#8C1538', '#FFC627'),
(225, 'Arizona State Sun Devils', 'Sun Devils', 2, 25, 'ASU-WRE', '#8C1538', '#FFC627');

-- Baylor Teams (school_id = 3)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(301, 'Baylor Bears', 'Bears', 3, 1, 'BAY-BSB', '#003015', '#FFB81C'),
(302, 'Baylor Bears', 'Bears', 3, 2, 'BAY-MBB', '#003015', '#FFB81C'),
(303, 'Baylor Bears', 'Bears', 3, 3, 'BAY-WBB', '#003015', '#FFB81C'),
(308, 'Baylor Bears', 'Bears', 3, 8, 'BAY-FB', '#003015', '#FFB81C'),
(314, 'Baylor Bears', 'Bears', 3, 14, 'BAY-SOC', '#003015', '#FFB81C'),
(315, 'Baylor Bears', 'Bears', 3, 15, 'BAY-SB', '#003015', '#FFB81C'),
(318, 'Baylor Bears', 'Bears', 3, 18, 'BAY-MTN', '#003015', '#FFB81C'),
(319, 'Baylor Bears', 'Bears', 3, 19, 'BAY-WTN', '#003015', '#FFB81C'),
(324, 'Baylor Bears', 'Bears', 3, 24, 'BAY-VB', '#003015', '#FFB81C');

-- BYU Teams (school_id = 4)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(401, 'BYU Cougars', 'Cougars', 4, 1, 'BYU-BSB', '#002E5D', '#FFFFFF'),
(402, 'BYU Cougars', 'Cougars', 4, 2, 'BYU-MBB', '#002E5D', '#FFFFFF'),
(403, 'BYU Cougars', 'Cougars', 4, 3, 'BYU-WBB', '#002E5D', '#FFFFFF'),
(408, 'BYU Cougars', 'Cougars', 4, 8, 'BYU-FB', '#002E5D', '#FFFFFF'),
(414, 'BYU Cougars', 'Cougars', 4, 14, 'BYU-SOC', '#002E5D', '#FFFFFF'),
(415, 'BYU Cougars', 'Cougars', 4, 15, 'BYU-SB', '#002E5D', '#FFFFFF'),
(418, 'BYU Cougars', 'Cougars', 4, 18, 'BYU-MTN', '#002E5D', '#FFFFFF'),
(419, 'BYU Cougars', 'Cougars', 4, 19, 'BYU-WTN', '#002E5D', '#FFFFFF'),
(424, 'BYU Cougars', 'Cougars', 4, 24, 'BYU-VB', '#002E5D', '#FFFFFF');

-- UCF Teams (school_id = 5)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(501, 'UCF Knights', 'Knights', 5, 1, 'UCF-BSB', '#000000', '#FFC904'),
(502, 'UCF Knights', 'Knights', 5, 2, 'UCF-MBB', '#000000', '#FFC904'),
(503, 'UCF Knights', 'Knights', 5, 3, 'UCF-WBB', '#000000', '#FFC904'),
(508, 'UCF Knights', 'Knights', 5, 8, 'UCF-FB', '#000000', '#FFC904'),
(514, 'UCF Knights', 'Knights', 5, 14, 'UCF-SOC', '#000000', '#FFC904'),
(515, 'UCF Knights', 'Knights', 5, 15, 'UCF-SB', '#000000', '#FFC904'),
(518, 'UCF Knights', 'Knights', 5, 18, 'UCF-MTN', '#000000', '#FFC904'),
(519, 'UCF Knights', 'Knights', 5, 19, 'UCF-WTN', '#000000', '#FFC904'),
(524, 'UCF Knights', 'Knights', 5, 24, 'UCF-VB', '#000000', '#FFC904');

-- Cincinnati Teams (school_id = 6)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(602, 'Cincinnati Bearcats', 'Bearcats', 6, 2, 'CIN-MBB', '#E00122', '#000000'),
(603, 'Cincinnati Bearcats', 'Bearcats', 6, 3, 'CIN-WBB', '#E00122', '#000000'),
(608, 'Cincinnati Bearcats', 'Bearcats', 6, 8, 'CIN-FB', '#E00122', '#000000'),
(614, 'Cincinnati Bearcats', 'Bearcats', 6, 14, 'CIN-SOC', '#E00122', '#000000'),
(624, 'Cincinnati Bearcats', 'Bearcats', 6, 24, 'CIN-VB', '#E00122', '#000000');

-- Colorado Teams (school_id = 7)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(702, 'Colorado Buffaloes', 'Buffaloes', 7, 2, 'COL-MBB', '#CFB87C', '#000000'),
(703, 'Colorado Buffaloes', 'Buffaloes', 7, 3, 'COL-WBB', '#CFB87C', '#000000'),
(708, 'Colorado Buffaloes', 'Buffaloes', 7, 8, 'COL-FB', '#CFB87C', '#000000'),
(714, 'Colorado Buffaloes', 'Buffaloes', 7, 14, 'COL-SOC', '#CFB87C', '#000000'),
(724, 'Colorado Buffaloes', 'Buffaloes', 7, 24, 'COL-VB', '#CFB87C', '#000000');

-- Houston Teams (school_id = 8)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(801, 'Houston Cougars', 'Cougars', 8, 1, 'HOU-BSB', '#C8102E', '#FFFFFF'),
(802, 'Houston Cougars', 'Cougars', 8, 2, 'HOU-MBB', '#C8102E', '#FFFFFF'),
(803, 'Houston Cougars', 'Cougars', 8, 3, 'HOU-WBB', '#C8102E', '#FFFFFF'),
(808, 'Houston Cougars', 'Cougars', 8, 8, 'HOU-FB', '#C8102E', '#FFFFFF'),
(814, 'Houston Cougars', 'Cougars', 8, 14, 'HOU-SOC', '#C8102E', '#FFFFFF'),
(815, 'Houston Cougars', 'Cougars', 8, 15, 'HOU-SB', '#C8102E', '#FFFFFF'),
(824, 'Houston Cougars', 'Cougars', 8, 24, 'HOU-VB', '#C8102E', '#FFFFFF');

-- Iowa State Teams (school_id = 9)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(902, 'Iowa State Cyclones', 'Cyclones', 9, 2, 'ISU-MBB', '#C8102E', '#F1BE48'),
(903, 'Iowa State Cyclones', 'Cyclones', 9, 3, 'ISU-WBB', '#C8102E', '#F1BE48'),
(908, 'Iowa State Cyclones', 'Cyclones', 9, 8, 'ISU-FB', '#C8102E', '#F1BE48'),
(914, 'Iowa State Cyclones', 'Cyclones', 9, 14, 'ISU-SOC', '#C8102E', '#F1BE48'),
(915, 'Iowa State Cyclones', 'Cyclones', 9, 15, 'ISU-SB', '#C8102E', '#F1BE48'),
(924, 'Iowa State Cyclones', 'Cyclones', 9, 24, 'ISU-VB', '#C8102E', '#F1BE48'),
(925, 'Iowa State Cyclones', 'Cyclones', 9, 25, 'ISU-WRE', '#C8102E', '#F1BE48');

-- Kansas Teams (school_id = 10)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1001, 'Kansas Jayhawks', 'Jayhawks', 10, 1, 'KU-BSB', '#0051BA', '#E8000D'),
(1002, 'Kansas Jayhawks', 'Jayhawks', 10, 2, 'KU-MBB', '#0051BA', '#E8000D'),
(1003, 'Kansas Jayhawks', 'Jayhawks', 10, 3, 'KU-WBB', '#0051BA', '#E8000D'),
(1008, 'Kansas Jayhawks', 'Jayhawks', 10, 8, 'KU-FB', '#0051BA', '#E8000D'),
(1014, 'Kansas Jayhawks', 'Jayhawks', 10, 14, 'KU-SOC', '#0051BA', '#E8000D'),
(1024, 'Kansas Jayhawks', 'Jayhawks', 10, 24, 'KU-VB', '#0051BA', '#E8000D');

-- Kansas State Teams (school_id = 11)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1101, 'Kansas State Wildcats', 'Wildcats', 11, 1, 'KSU-BSB', '#512888', '#FFFFFF'),
(1102, 'Kansas State Wildcats', 'Wildcats', 11, 2, 'KSU-MBB', '#512888', '#FFFFFF'),
(1103, 'Kansas State Wildcats', 'Wildcats', 11, 3, 'KSU-WBB', '#512888', '#FFFFFF'),
(1108, 'Kansas State Wildcats', 'Wildcats', 11, 8, 'KSU-FB', '#512888', '#FFFFFF'),
(1114, 'Kansas State Wildcats', 'Wildcats', 11, 14, 'KSU-SOC', '#512888', '#FFFFFF'),
(1124, 'Kansas State Wildcats', 'Wildcats', 11, 24, 'KSU-VB', '#512888', '#FFFFFF');

-- Oklahoma State Teams (school_id = 12)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1201, 'Oklahoma State Cowboys', 'Cowboys', 12, 1, 'OKST-BSB', '#FF7300', '#000000'),
(1202, 'Oklahoma State Cowboys', 'Cowboys', 12, 2, 'OKST-MBB', '#FF7300', '#000000'),
(1203, 'Oklahoma State Cowboys', 'Cowboys', 12, 3, 'OKST-WBB', '#FF7300', '#000000'),
(1208, 'Oklahoma State Cowboys', 'Cowboys', 12, 8, 'OKST-FB', '#FF7300', '#000000'),
(1214, 'Oklahoma State Cowboys', 'Cowboys', 12, 14, 'OKST-SOC', '#FF7300', '#000000'),
(1215, 'Oklahoma State Cowboys', 'Cowboys', 12, 15, 'OKST-SB', '#FF7300', '#000000'),
(1218, 'Oklahoma State Cowboys', 'Cowboys', 12, 18, 'OKST-MTN', '#FF7300', '#000000'),
(1219, 'Oklahoma State Cowboys', 'Cowboys', 12, 19, 'OKST-WTN', '#FF7300', '#000000'),
(1224, 'Oklahoma State Cowboys', 'Cowboys', 12, 24, 'OKST-VB', '#FF7300', '#000000'),
(1225, 'Oklahoma State Cowboys', 'Cowboys', 12, 25, 'OKST-WRE', '#FF7300', '#000000');

-- TCU Teams (school_id = 13)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1301, 'TCU Horned Frogs', 'Horned Frogs', 13, 1, 'TCU-BSB', '#4D1979', '#A3A3A3'),
(1302, 'TCU Horned Frogs', 'Horned Frogs', 13, 2, 'TCU-MBB', '#4D1979', '#A3A3A3'),
(1303, 'TCU Horned Frogs', 'Horned Frogs', 13, 3, 'TCU-WBB', '#4D1979', '#A3A3A3'),
(1308, 'TCU Horned Frogs', 'Horned Frogs', 13, 8, 'TCU-FB', '#4D1979', '#A3A3A3'),
(1314, 'TCU Horned Frogs', 'Horned Frogs', 13, 14, 'TCU-SOC', '#4D1979', '#A3A3A3'),
(1315, 'TCU Horned Frogs', 'Horned Frogs', 13, 15, 'TCU-SB', '#4D1979', '#A3A3A3'),
(1318, 'TCU Horned Frogs', 'Horned Frogs', 13, 18, 'TCU-MTN', '#4D1979', '#A3A3A3'),
(1319, 'TCU Horned Frogs', 'Horned Frogs', 13, 19, 'TCU-WTN', '#4D1979', '#A3A3A3'),
(1324, 'TCU Horned Frogs', 'Horned Frogs', 13, 24, 'TCU-VB', '#4D1979', '#A3A3A3');

-- Texas Tech Teams (school_id = 14)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1401, 'Texas Tech Red Raiders', 'Red Raiders', 14, 1, 'TTU-BSB', '#CC0000', '#000000'),
(1402, 'Texas Tech Red Raiders', 'Red Raiders', 14, 2, 'TTU-MBB', '#CC0000', '#000000'),
(1403, 'Texas Tech Red Raiders', 'Red Raiders', 14, 3, 'TTU-WBB', '#CC0000', '#000000'),
(1408, 'Texas Tech Red Raiders', 'Red Raiders', 14, 8, 'TTU-FB', '#CC0000', '#000000'),
(1414, 'Texas Tech Red Raiders', 'Red Raiders', 14, 14, 'TTU-SOC', '#CC0000', '#000000'),
(1415, 'Texas Tech Red Raiders', 'Red Raiders', 14, 15, 'TTU-SB', '#CC0000', '#000000'),
(1418, 'Texas Tech Red Raiders', 'Red Raiders', 14, 18, 'TTU-MTN', '#CC0000', '#000000'),
(1419, 'Texas Tech Red Raiders', 'Red Raiders', 14, 19, 'TTU-WTN', '#CC0000', '#000000'),
(1424, 'Texas Tech Red Raiders', 'Red Raiders', 14, 24, 'TTU-VB', '#CC0000', '#000000');

-- Utah Teams (school_id = 15)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1501, 'Utah Utes', 'Utes', 15, 1, 'UTAH-BSB', '#CC0000', '#000000'),
(1502, 'Utah Utes', 'Utes', 15, 2, 'UTAH-MBB', '#CC0000', '#000000'),
(1503, 'Utah Utes', 'Utes', 15, 3, 'UTAH-WBB', '#CC0000', '#000000'),
(1508, 'Utah Utes', 'Utes', 15, 8, 'UTAH-FB', '#CC0000', '#000000'),
(1514, 'Utah Utes', 'Utes', 15, 14, 'UTAH-SOC', '#CC0000', '#000000'),
(1515, 'Utah Utes', 'Utes', 15, 15, 'UTAH-SB', '#CC0000', '#000000'),
(1518, 'Utah Utes', 'Utes', 15, 18, 'UTAH-MTN', '#CC0000', '#000000'),
(1519, 'Utah Utes', 'Utes', 15, 19, 'UTAH-WTN', '#CC0000', '#000000'),
(1524, 'Utah Utes', 'Utes', 15, 24, 'UTAH-VB', '#CC0000', '#000000');

-- West Virginia Teams (school_id = 16)
INSERT INTO teams (team_id, name, mascot, school_id, sport_id, abbreviation, primary_color, secondary_color) VALUES
(1602, 'West Virginia Mountaineers', 'Mountaineers', 16, 2, 'WVU-MBB', '#002855', '#EAAA00'),
(1603, 'West Virginia Mountaineers', 'Mountaineers', 16, 3, 'WVU-WBB', '#002855', '#EAAA00'),
(1608, 'West Virginia Mountaineers', 'Mountaineers', 16, 8, 'WVU-FB', '#002855', '#EAAA00'),
(1614, 'West Virginia Mountaineers', 'Mountaineers', 16, 14, 'WVU-SOC', '#002855', '#EAAA00'),
(1624, 'West Virginia Mountaineers', 'Mountaineers', 16, 24, 'WVU-VB', '#002855', '#EAAA00'),
(1625, 'West Virginia Mountaineers', 'Mountaineers', 16, 25, 'WVU-WRE', '#002855', '#EAAA00')
ON CONFLICT (team_id) DO UPDATE SET
    name = EXCLUDED.name,
    mascot = EXCLUDED.mascot,
    abbreviation = EXCLUDED.abbreviation,
    primary_color = EXCLUDED.primary_color,
    secondary_color = EXCLUDED.secondary_color;

-- ========================================
-- 🏟️  VENUES - BIG 12 CONFERENCE MEMBERS
-- ⚠️  AI AGENTS: VENUE IDs FOLLOW PATTERN - SCHOOL_ID + VENUE_TYPE
-- 🚨 EXAMPLES: Arizona Stadium = 0101, Allen Fieldhouse = 1002
-- ========================================

-- Arizona Venues (school_id = 1)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0101, 'Arizona Stadium', 'Tucson', 'AZ', 57000, 108),
(0102, 'McKale Center', 'Tucson', 'AZ', 14644, 102),
(0103, 'Hi Corbett Field', 'Tucson', 'AZ', 4000, 101),
(0104, 'Rita Hillenbrand Memorial Stadium', 'Tucson', 'AZ', 1500, 115),
(0105, 'Murphey Family Soccer Stadium', 'Tucson', 'AZ', 3000, 114),
(0107, 'LaNelle Robson Tennis Center', 'Tucson', 'AZ', 2000, 118);

-- Arizona State Venues (school_id = 2)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0201, 'Mountain America Stadium', 'Tempe', 'AZ', 53000, 208),
(0202, 'Desert Financial Arena', 'Tempe', 'AZ', 14198, 202),
(0203, 'Phoenix Municipal Stadium', 'Phoenix', 'AZ', 8500, 201),
(0204, 'Farrington Stadium', 'Tempe', 'AZ', 1000, 215),
(0205, 'Sun Devil Soccer Stadium', 'Tempe', 'AZ', 1500, 214),
(0207, 'Whiteman Tennis Center', 'Tempe', 'AZ', 1000, 218);

-- Baylor Venues (school_id = 3)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0301, 'McLane Stadium', 'Waco', 'TX', 45000, 308),
(0302, 'Ferrell Center', 'Waco', 'TX', 10284, 302),
(0303, 'Baylor Ballpark', 'Waco', 'TX', 5000, 301),
(0304, 'Getterman Stadium', 'Waco', 'TX', 1200, 315),
(0305, 'Betty Lou Mays Field', 'Waco', 'TX', 1500, 314),
(0307, 'Hurd Tennis Center', 'Waco', 'TX', 1500, 318);

-- BYU Venues (school_id = 4)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0401, 'LaVell Edwards Stadium', 'Provo', 'UT', 63000, 408),
(0402, 'Marriott Center', 'Provo', 'UT', 22700, 402),
(0403, 'Larry H. Miller Field', 'Provo', 'UT', 2500, 401),
(0404, 'Gail Miller Field', 'Provo', 'UT', 1500, 415),
(0405, 'South Field', 'Provo', 'UT', 2000, 414),
(0407, 'Indoor Tennis Courts', 'Provo', 'UT', 500, 418);

-- UCF Venues (school_id = 5)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0501, 'FBC Mortgage Stadium', 'Orlando', 'FL', 45000, 508),
(0502, 'Addition Financial Arena', 'Orlando', 'FL', 10000, 502),
(0503, 'John Euliano Park', 'Orlando', 'FL', 2500, 501),
(0504, 'UCF Softball Complex', 'Orlando', 'FL', 1000, 515),
(0505, 'UCF Soccer and Track Stadium', 'Orlando', 'FL', 2000, 514),
(0507, 'UCF Tennis Complex', 'Orlando', 'FL', 1000, 518);

-- Cincinnati Venues (school_id = 6)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0601, 'Nippert Stadium', 'Cincinnati', 'OH', 40000, 608),
(0602, 'Fifth Third Arena', 'Cincinnati', 'OH', 12000, 602),
(0605, 'Gettler Stadium', 'Cincinnati', 'OH', 3000, 614);

-- Colorado Venues (school_id = 7)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0701, 'Folsom Field', 'Boulder', 'CO', 50000, 708),
(0702, 'CU Events Center', 'Boulder', 'CO', 11064, 702),
(0705, 'Prentup Field', 'Boulder', 'CO', 2500, 714);

-- Houston Venues (school_id = 8)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0801, 'TDECU Stadium', 'Houston', 'TX', 40000, 808),
(0802, 'Fertitta Center', 'Houston', 'TX', 7100, 802),
(0803, 'Schroeder Park', 'Houston', 'TX', 3500, 801),
(0804, 'Cougar Softball Stadium', 'Houston', 'TX', 1500, 815);

-- Iowa State Venues (school_id = 9)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(0901, 'Jack Trice Stadium', 'Ames', 'IA', 61500, 908),
(0902, 'Hilton Coliseum', 'Ames', 'IA', 14384, 902),
(0904, 'Cyclone Sports Complex', 'Ames', 'IA', 1500, 915),
(0905, 'Cyclone Sports Complex', 'Ames', 'IA', 1000, 914);

-- Kansas Venues (school_id = 10)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1001, 'David Booth Kansas Memorial Stadium', 'Lawrence', 'KS', 47000, 1008),
(1002, 'Allen Fieldhouse', 'Lawrence', 'KS', 16300, 1002),
(1003, 'Hoglund Ballpark', 'Lawrence', 'KS', 2500, 1001),
(1005, 'Rock Chalk Park', 'Lawrence', 'KS', 2500, 1014);

-- Kansas State Venues (school_id = 11)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1101, 'Bill Snyder Family Stadium', 'Manhattan', 'KS', 50000, 1108),
(1102, 'Bramlage Coliseum', 'Manhattan', 'KS', 12528, 1102),
(1103, 'Tointon Family Stadium', 'Manhattan', 'KS', 2000, 1101),
(1105, 'Buser Family Park', 'Manhattan', 'KS', 1500, 1114);

-- Oklahoma State Venues (school_id = 12)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1201, 'Boone Pickens Stadium', 'Stillwater', 'OK', 55500, 1208),
(1202, 'Gallagher-Iba Arena', 'Stillwater', 'OK', 13611, 1202),
(1203, 'O''Brate Stadium', 'Stillwater', 'OK', 4000, 1201),
(1204, 'Cowgirl Stadium', 'Stillwater', 'OK', 1500, 1215),
(1205, 'Neal Patterson Stadium', 'Stillwater', 'OK', 3500, 1214),
(1207, 'Greenwood Tennis Center', 'Stillwater', 'OK', 1500, 1218);

-- TCU Venues (school_id = 13)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1301, 'Amon G. Carter Stadium', 'Fort Worth', 'TX', 45000, 1308),
(1302, 'Ed and Rae Schollmaier Arena', 'Fort Worth', 'TX', 7166, 1302),
(1303, 'Lupton Stadium', 'Fort Worth', 'TX', 4500, 1301),
(1304, 'Garvey-Rosenthal Stadium', 'Fort Worth', 'TX', 1500, 1315),
(1305, 'Garvey-Rosenthal Stadium', 'Fort Worth', 'TX', 2000, 1314),
(1307, 'Bayard H. Friedman Tennis Center', 'Fort Worth', 'TX', 3000, 1318);

-- Texas Tech Venues (school_id = 14)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1401, 'Jones AT&T Stadium', 'Lubbock', 'TX', 60000, 1408),
(1402, 'United Supermarkets Arena', 'Lubbock', 'TX', 15020, 1402),
(1403, 'Dan Law Field at Rip Griffin Park', 'Lubbock', 'TX', 5050, 1401),
(1404, 'Rocky Johnson Field', 'Lubbock', 'TX', 1000, 1415),
(1405, 'John Walker Soccer Complex', 'Lubbock', 'TX', 1500, 1414),
(1407, 'McLeod Tennis Center', 'Lubbock', 'TX', 2000, 1418);

-- Utah Venues (school_id = 15)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1501, 'Rice-Eccles Stadium', 'Salt Lake City', 'UT', 51000, 1508),
(1502, 'Jon M. Huntsman Center', 'Salt Lake City', 'UT', 15000, 1502),
(1503, 'Smith Ballpark', 'Salt Lake City', 'UT', 15000, 1501),
(1504, 'Dumke Family Softball Stadium', 'Salt Lake City', 'UT', 1500, 1515),
(1505, 'Ute Soccer Field', 'Salt Lake City', 'UT', 3000, 1514),
(1507, 'George S. Eccles Tennis Center', 'Salt Lake City', 'UT', 1500, 1518);

-- West Virginia Venues (school_id = 16)
INSERT INTO venues (venue_id, name, city, state, capacity, team_id) VALUES
(1601, 'Milan Puskar Stadium', 'Morgantown', 'WV', 60000, 1608),
(1602, 'WVU Coliseum', 'Morgantown', 'WV', 14000, 1602),
(1605, 'Dick Dlesk Soccer Stadium', 'Morgantown', 'WV', 1650, 1614)
ON CONFLICT (venue_id) DO UPDATE SET
    name = EXCLUDED.name,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    capacity = EXCLUDED.capacity,
    team_id = EXCLUDED.team_id;

-- ========================================
-- 🏆 COMPASS RATINGS UPDATE - PERFORMANCE ANALYTICS
-- ⚠️  AI AGENTS: THESE ARE OFFICIAL COMPASS SCORES FOR TOP PROGRAMS
-- 🚨 DO NOT MODIFY - USED FOR SCHEDULING PRIORITY AND ANALYTICS
-- ========================================
UPDATE teams SET 
    compass_overall_score = 92,
    compass_competitive = 95,
    compass_operational = 90,
    compass_market = 88,
    compass_trajectory = 94,
    compass_analytics = 91
WHERE team_id = 108; -- Arizona Football

UPDATE teams SET 
    compass_overall_score = 88,
    compass_competitive = 85,
    compass_operational = 92,
    compass_market = 90,
    compass_trajectory = 88,
    compass_analytics = 87
WHERE team_id = 208; -- Arizona State Football

UPDATE teams SET 
    compass_overall_score = 89,
    compass_competitive = 90,
    compass_operational = 88,
    compass_market = 85,
    compass_trajectory = 92,
    compass_analytics = 88
WHERE team_id = 308; -- Baylor Football

UPDATE teams SET 
    compass_overall_score = 95,
    compass_competitive = 98,
    compass_operational = 93,
    compass_market = 92,
    compass_trajectory = 96,
    compass_analytics = 94
WHERE team_id = 1002; -- Kansas Men's Basketball

UPDATE teams SET 
    compass_overall_score = 91,
    compass_competitive = 94,
    compass_operational = 89,
    compass_market = 88,
    compass_trajectory = 93,
    compass_analytics = 90
WHERE team_id = 302; -- Baylor Men's Basketball

UPDATE teams SET 
    compass_overall_score = 90,
    compass_competitive = 88,
    compass_operational = 92,
    compass_market = 89,
    compass_trajectory = 91,
    compass_analytics = 89
WHERE team_id = 1208; -- Oklahoma State Football

UPDATE teams SET 
    compass_overall_score = 91,
    compass_competitive = 89,
    compass_operational = 93,
    compass_market = 90,
    compass_trajectory = 92,
    compass_analytics = 90
WHERE team_id = 1308; -- TCU Football

COMMIT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_school_sport ON teams(school_id, sport_id);
CREATE INDEX IF NOT EXISTS idx_teams_compass_overall ON teams(compass_overall_score DESC) WHERE compass_overall_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_venues_school ON venues(school_id);
CREATE INDEX IF NOT EXISTS idx_venues_capacity ON venues(capacity DESC);

-- Refresh any materialized views that depend on this data
-- REFRESH MATERIALIZED VIEW IF EXISTS team_performance_summary;
-- REFRESH MATERIALIZED VIEW IF EXISTS venue_utilization_stats;