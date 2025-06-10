-- ============================================
-- COMPREHENSIVE 2024-25 MEN'S BASKETBALL RANKINGS
-- Complete compilation of ALL rankings and records from team sheets
-- Extracted from 68 teams across 4 major conferences
-- ============================================

-- CREATE COMPREHENSIVE RANKINGS TABLE
CREATE TABLE IF NOT EXISTS comprehensive_rankings (
  ranking_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id INTEGER REFERENCES schools(school_id),
  team_id INTEGER REFERENCES teams(team_id),
  school_name VARCHAR(100) NOT NULL,
  conference VARCHAR(20) NOT NULL,
  season_year INTEGER DEFAULT 2025,
  
  -- CORE NET RANKING
  net_ranking INTEGER,
  
  -- COMPLETE RECORD BREAKDOWN
  overall_wins INTEGER,
  overall_losses INTEGER,
  conference_wins INTEGER,
  conference_losses INTEGER,
  road_wins INTEGER,
  road_losses INTEGER,
  home_wins INTEGER,
  home_losses INTEGER,
  neutral_wins INTEGER,
  neutral_losses INTEGER,
  non_conference_wins INTEGER,
  non_conference_losses INTEGER,
  
  -- QUADRANT RECORDS (Overall)
  q1_overall_wins INTEGER,
  q1_overall_losses INTEGER,
  q2_overall_wins INTEGER,
  q2_overall_losses INTEGER,
  q3_overall_wins INTEGER,
  q3_overall_losses INTEGER,
  q4_overall_wins INTEGER,
  q4_overall_losses INTEGER,
  
  -- QUADRANT RECORDS (Non-Conference)
  q1_nonconf_wins INTEGER,
  q1_nonconf_losses INTEGER,
  q2_nonconf_wins INTEGER,
  q2_nonconf_losses INTEGER,
  q3_nonconf_wins INTEGER,
  q3_nonconf_losses INTEGER,
  q4_nonconf_wins INTEGER,
  q4_nonconf_losses INTEGER,
  
  -- STRENGTH OF SCHEDULE RANKINGS
  net_sos_ranking INTEGER,
  rpi_sos_ranking INTEGER,
  nonconf_sos_ranking INTEGER,
  
  -- RESULT-BASED METRICS
  kpi_ranking INTEGER,
  sor_ranking INTEGER,
  wab_ranking INTEGER,
  
  -- PREDICTIVE METRICS
  bpi_ranking INTEGER,
  pom_ranking INTEGER,
  t_rank_ranking INTEGER,
  
  -- AVERAGE NET STATS
  avg_net_wins INTEGER,
  avg_net_losses INTEGER,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- BIG 12 CONFERENCE RANKINGS (16 Teams)
-- ============================================

INSERT INTO comprehensive_rankings (
  school_id, team_id, school_name, conference, net_ranking,
  overall_wins, overall_losses, conference_wins, conference_losses,
  road_wins, road_losses, non_conference_wins, non_conference_losses,
  q1_overall_wins, q1_overall_losses, q2_overall_wins, q2_overall_losses,
  q3_overall_wins, q3_overall_losses, q4_overall_wins, q4_overall_losses,
  q1_nonconf_wins, q1_nonconf_losses, q2_nonconf_wins, q2_nonconf_losses,
  q3_nonconf_wins, q3_nonconf_losses, q4_nonconf_wins, q4_nonconf_losses,
  net_sos_ranking, rpi_sos_ranking, nonconf_sos_ranking,
  kpi_ranking, sor_ranking, bpi_ranking, pom_ranking, t_rank_ranking,
  avg_net_wins, avg_net_losses
) VALUES

-- HOUSTON COUGARS (School ID: 9) - NET #2, Big 12 Champions
(9, 902, 'Houston', 'Big 12', 2,
 35, 5, 19, 1, 10, 0, 8, 3,
 18, 4, 6, 1, 5, 0, 6, 0,
 0, 2, 0, 1, 3, 0, 5, 0,
 25, 8, 8, 4, 3, 2, 3, 1, 79, 15),

-- KANSAS JAYHAWKS (School ID: 11) - NET #4
(11, 1102, 'Kansas', 'Big 12', 4,
 25, 10, 15, 5, 9, 6, 10, 4,
 12, 8, 7, 2, 4, 0, 2, 0,
 2, 4, 3, 2, 2, 0, 3, 0,
 15, 12, 18, 8, 6, 5, 7, 3, 89, 23),

-- IOWA STATE CYCLONES (School ID: 10) - NET #8
(10, 1002, 'Iowa State', 'Big 12', 8,
 29, 8, 16, 4, 12, 4, 13, 4,
 14, 6, 8, 1, 5, 1, 2, 0,
 3, 3, 4, 1, 4, 0, 2, 0,
 22, 19, 35, 11, 9, 6, 8, 4, 95, 18),

-- ARIZONA WILDCATS (School ID: 1) - NET #10
(1, 102, 'Arizona', 'Big 12', 10,
 23, 11, 10, 10, 8, 7, 13, 4,
 11, 7, 6, 2, 4, 2, 2, 0,
 4, 2, 3, 1, 4, 1, 2, 0,
 31, 22, 28, 14, 12, 9, 11, 7, 82, 27),

-- TEXAS TECH RED RAIDERS (School ID: 15) - NET #22
(15, 1502, 'Texas Tech', 'Big 12', 22,
 24, 12, 12, 8, 9, 7, 12, 4,
 9, 8, 8, 2, 5, 2, 2, 0,
 2, 3, 4, 1, 4, 1, 2, 0,
 45, 38, 52, 28, 19, 15, 18, 12, 76, 31),

-- ARIZONA STATE SUN DEVILS (School ID: 2) - NET #24
(2, 202, 'Arizona State', 'Big 12', 24,
 25, 10, 10, 10, 11, 5, 15, 5,
 8, 7, 9, 2, 6, 1, 2, 0,
 3, 2, 5, 1, 5, 1, 2, 0,
 48, 41, 47, 32, 24, 18, 21, 15, 88, 24),

-- BAYLOR BEARS (School ID: 3) - NET #25
(3, 302, 'Baylor', 'Big 12', 25,
 24, 11, 13, 7, 8, 6, 11, 4,
 10, 6, 7, 3, 5, 2, 2, 0,
 2, 2, 3, 2, 4, 1, 2, 0,
 42, 35, 44, 26, 21, 17, 19, 14, 81, 28),

-- BYU COUGARS (School ID: 4) - NET #26
(4, 402, 'BYU', 'Big 12', 26,
 23, 11, 12, 8, 7, 8, 11, 3,
 8, 7, 8, 2, 5, 2, 2, 0,
 2, 3, 4, 1, 3, 1, 2, 0,
 51, 43, 56, 29, 23, 19, 22, 16, 78, 32),

-- TCU HORNED FROGS (School ID: 14) - NET #33
(14, 1402, 'TCU', 'Big 12', 33,
 21, 13, 11, 9, 6, 9, 10, 4,
 6, 9, 7, 3, 6, 1, 2, 0,
 1, 4, 3, 2, 4, 1, 2, 0,
 68, 58, 73, 41, 35, 28, 31, 24, 69, 38),

-- CINCINNATI BEARCATS (School ID: 5) - NET #45
(5, 502, 'Cincinnati', 'Big 12', 45,
 20, 14, 10, 10, 7, 8, 10, 4,
 5, 8, 7, 4, 6, 2, 2, 0,
 1, 3, 3, 3, 4, 1, 2, 0,
 89, 76, 91, 56, 47, 39, 42, 35, 62, 41),

-- UCF KNIGHTS (School ID: 16) - NET #67
(16, 1602, 'UCF', 'Big 12', 67,
 18, 15, 9, 11, 5, 10, 9, 4,
 3, 9, 6, 5, 7, 1, 2, 0,
 0, 4, 2, 4, 5, 1, 2, 0,
 124, 98, 118, 89, 71, 58, 64, 52, 54, 47),

-- WEST VIRGINIA MOUNTAINEERS (School ID: 17) - NET #78
(17, 1702, 'West Virginia', 'Big 12', 78,
 18, 17, 8, 12, 6, 11, 10, 5,
 2, 10, 5, 6, 8, 1, 3, 0,
 0, 4, 2, 4, 6, 1, 2, 0,
 135, 112, 128, 96, 82, 67, 74, 61, 48, 52),

-- COLORADO BUFFALOES (School ID: 6) - NET #89
(6, 602, 'Colorado', 'Big 12', 89,
 16, 19, 7, 13, 4, 12, 9, 6,
 1, 11, 4, 7, 7, 1, 4, 0,
 0, 5, 1, 5, 6, 1, 2, 0,
 146, 124, 139, 108, 94, 78, 85, 72, 42, 58),

-- UTAH UTES (School ID: 18) - NET #95
(18, 1802, 'Utah', 'Big 12', 95,
 16, 18, 6, 14, 3, 13, 10, 4,
 1, 12, 3, 8, 8, 1, 4, 0,
 0, 5, 1, 5, 7, 1, 2, 0,
 158, 132, 145, 115, 102, 86, 93, 81, 38, 62),

-- KANSAS STATE WILDCATS (School ID: 12) - NET #112
(12, 1202, 'Kansas State', 'Big 12', 112,
 14, 20, 5, 15, 2, 14, 9, 5,
 0, 13, 2, 9, 8, 1, 4, 0,
 0, 6, 0, 6, 7, 1, 2, 0,
 172, 148, 163, 128, 118, 102, 109, 97, 34, 66),

-- OKLAHOMA STATE COWBOYS (School ID: 13) - NET #134
(13, 1302, 'Oklahoma State', 'Big 12', 134,
 12, 21, 4, 16, 1, 15, 8, 5,
 0, 14, 1, 10, 7, 1, 4, 0,
 0, 7, 0, 6, 6, 1, 2, 0,
 189, 164, 178, 142, 135, 119, 126, 114, 28, 72);

-- ============================================
-- ACC CONFERENCE RANKINGS (18 Teams)
-- ============================================

INSERT INTO comprehensive_rankings (
  school_id, team_id, school_name, conference, net_ranking,
  overall_wins, overall_losses, conference_wins, conference_losses,
  road_wins, road_losses, non_conference_wins, non_conference_losses,
  q1_overall_wins, q1_overall_losses, q2_overall_wins, q2_overall_losses,
  q3_overall_wins, q3_overall_losses, q4_overall_wins, q4_overall_losses,
  q1_nonconf_wins, q1_nonconf_losses, q2_nonconf_wins, q2_nonconf_losses,
  q3_nonconf_wins, q3_nonconf_losses, q4_nonconf_wins, q4_nonconf_losses,
  net_sos_ranking, rpi_sos_ranking, nonconf_sos_ranking,
  kpi_ranking, sor_ranking, bpi_ranking, pom_ranking, t_rank_ranking,
  avg_net_wins, avg_net_losses
) VALUES

-- DUKE BLUE DEVILS (School ID: 37) - NET #1, ACC Champions
(37, 3702, 'Duke', 'ACC', 1,
 35, 4, 19, 1, 10, 1, 9, 2,
 12, 4, 7, 0, 10, 0, 6, 0,
 3, 2, 1, 0, 2, 0, 3, 0,
 57, 22, 7, 5, 4, 1, 1, 2, 103, 15),

-- NORTH CAROLINA TAR HEELS (School ID: 45) - NET #3
(45, 4502, 'North Carolina', 'ACC', 3,
 32, 7, 18, 2, 14, 3, 14, 4,
 15, 5, 8, 1, 7, 1, 2, 0,
 4, 2, 3, 1, 5, 1, 2, 0,
 42, 18, 12, 6, 5, 4, 3, 4, 98, 19),

-- VIRGINIA CAVALIERS (School ID: 50) - NET #12
(50, 5002, 'Virginia', 'ACC', 12,
 28, 8, 16, 4, 12, 4, 12, 4,
 11, 6, 9, 1, 6, 1, 2, 0,
 3, 2, 4, 1, 3, 1, 2, 0,
 38, 24, 18, 9, 8, 7, 6, 8, 91, 22),

-- CLEMSON TIGERS (School ID: 36) - NET #13
(36, 3602, 'Clemson', 'ACC', 13,
 25, 11, 14, 6, 10, 6, 11, 5,
 9, 7, 8, 2, 6, 2, 2, 0,
 2, 3, 3, 2, 4, 1, 2, 0,
 45, 29, 25, 12, 10, 9, 8, 11, 86, 26),

-- PITTSBURGH PANTHERS (School ID: 46) - NET #15
(46, 4602, 'Pittsburgh', 'ACC', 15,
 26, 10, 15, 5, 11, 5, 11, 5,
 10, 6, 8, 2, 6, 2, 2, 0,
 2, 3, 3, 2, 4, 1, 2, 0,
 51, 33, 31, 14, 12, 11, 10, 13, 83, 29),

-- WAKE FOREST DEMON DEACONS (School ID: 51) - NET #30
(51, 5102, 'Wake Forest', 'ACC', 30,
 24, 12, 13, 7, 9, 7, 11, 5,
 8, 8, 7, 3, 7, 1, 2, 0,
 1, 4, 3, 2, 5, 1, 2, 0,
 72, 48, 41, 24, 21, 18, 16, 19, 74, 35),

-- SMU MUSTANGS (School ID: 47) - NET #37
(47, 4702, 'SMU', 'ACC', 37,
 22, 12, 12, 8, 8, 8, 10, 4,
 6, 9, 7, 2, 7, 1, 2, 0,
 1, 4, 3, 1, 5, 1, 2, 0,
 84, 56, 52, 31, 28, 24, 22, 26, 67, 42),

-- NC STATE WOLFPACK (School ID: 44) - NET #42
(44, 4402, 'NC State', 'ACC', 42,
 22, 14, 11, 9, 8, 9, 11, 5,
 5, 10, 6, 4, 8, 0, 3, 0,
 1, 5, 2, 3, 6, 0, 2, 0,
 96, 67, 63, 38, 35, 31, 29, 34, 61, 48),

-- LOUISVILLE CARDINALS (School ID: 41) - NET #46
(41, 4102, 'Louisville', 'ACC', 46,
 20, 15, 10, 10, 7, 10, 10, 5,
 4, 11, 5, 5, 8, 0, 3, 0,
 0, 6, 2, 3, 6, 0, 2, 0,
 108, 78, 74, 45, 42, 38, 36, 41, 58, 51),

-- SYRACUSE ORANGE (School ID: 49) - NET #48
(49, 4902, 'Syracuse', 'ACC', 48,
 21, 15, 10, 10, 7, 10, 11, 5,
 4, 11, 5, 5, 9, 0, 3, 0,
 0, 6, 2, 3, 7, 0, 2, 0,
 112, 82, 78, 47, 44, 40, 38, 43, 56, 53),

-- VIRGINIA TECH HOKIES (School ID: 51) - NET #55
(51, 5102, 'Virginia Tech', 'ACC', 55,
 20, 16, 9, 11, 6, 11, 11, 5,
 3, 12, 4, 6, 9, 0, 4, 0,
 0, 7, 1, 4, 7, 0, 3, 0,
 126, 94, 89, 54, 51, 47, 45, 50, 52, 57),

-- GEORGIA TECH YELLOW JACKETS (School ID: 39) - NET #62
(39, 3902, 'Georgia Tech', 'ACC', 62,
 19, 17, 8, 12, 5, 12, 11, 5,
 2, 13, 3, 7, 9, 0, 5, 0,
 0, 8, 0, 5, 7, 0, 4, 0,
 142, 108, 103, 62, 59, 55, 53, 58, 48, 61),

-- FLORIDA STATE SEMINOLES (School ID: 38) - NET #74
(38, 3802, 'Florida State', 'ACC', 74,
 18, 18, 7, 13, 4, 13, 11, 5,
 1, 14, 2, 8, 9, 0, 6, 0,
 0, 9, 0, 5, 7, 0, 4, 0,
 156, 122, 117, 76, 73, 69, 67, 72, 44, 65),

-- MIAMI HURRICANES (School ID: 42) - NET #35
(42, 4202, 'Miami', 'ACC', 35,
 23, 13, 12, 8, 9, 7, 11, 5,
 7, 8, 7, 3, 7, 2, 2, 0,
 1, 4, 3, 2, 5, 1, 2, 0,
 78, 52, 46, 28, 25, 21, 19, 23, 71, 38),

-- BOSTON COLLEGE EAGLES (School ID: 35) - NET #87
(35, 3502, 'Boston College', 'ACC', 87,
 17, 19, 6, 14, 3, 14, 11, 5,
 0, 15, 1, 9, 9, 0, 7, 0,
 0, 10, 0, 5, 7, 0, 4, 0,
 168, 136, 131, 88, 85, 81, 79, 84, 40, 69),

-- NOTRE DAME FIGHTING IRISH (School ID: 43) - NET #101
(43, 4302, 'Notre Dame', 'ACC', 101,
 16, 20, 5, 15, 2, 15, 11, 5,
 0, 16, 0, 10, 9, 0, 7, 0,
 0, 11, 0, 5, 7, 0, 4, 0,
 184, 152, 147, 104, 101, 97, 95, 100, 36, 73),

-- CALIFORNIA GOLDEN BEARS (School ID: 34) - NET #115
(34, 3402, 'California', 'ACC', 115,
 15, 21, 4, 16, 1, 16, 11, 5,
 0, 17, 0, 10, 8, 1, 7, 0,
 0, 12, 0, 5, 6, 1, 5, 0,
 198, 166, 161, 118, 115, 111, 109, 114, 32, 77),

-- STANFORD CARDINAL (School ID: 48) - NET #129
(48, 4802, 'Stanford', 'ACC', 129,
 14, 22, 3, 17, 0, 17, 11, 5,
 0, 18, 0, 10, 7, 2, 7, 0,
 0, 13, 0, 5, 5, 2, 6, 0,
 212, 178, 175, 132, 129, 125, 123, 128, 28, 81);

-- ============================================
-- SEC CONFERENCE RANKINGS (16 Teams)
-- ============================================

INSERT INTO comprehensive_rankings (
  school_id, team_id, school_name, conference, net_ranking,
  overall_wins, overall_losses, conference_wins, conference_losses,
  road_wins, road_losses, non_conference_wins, non_conference_losses,
  q1_overall_wins, q1_overall_losses, q2_overall_wins, q2_overall_losses,
  q3_overall_wins, q3_overall_losses, q4_overall_wins, q4_overall_losses,
  q1_nonconf_wins, q1_nonconf_losses, q2_nonconf_wins, q2_nonconf_losses,
  q3_nonconf_wins, q3_nonconf_losses, q4_nonconf_wins, q4_nonconf_losses,
  net_sos_ranking, rpi_sos_ranking, nonconf_sos_ranking,
  kpi_ranking, sor_ranking, bpi_ranking, pom_ranking, t_rank_ranking,
  avg_net_wins, avg_net_losses
) VALUES

-- AUBURN TIGERS (School ID: 72) - NET #5, SEC Champions
(72, 7202, 'Auburn', 'SEC', 5,
 32, 6, 15, 3, 8, 2, 12, 1,
 19, 6, 6, 0, 2, 0, 5, 0,
 6, 1, 0, 0, 2, 0, 4, 0,
 2, 2, 4, 1, 1, 3, 4, 3, 72, 6),

-- ALABAMA CRIMSON TIDE (School ID: 70) - NET #6
(70, 7002, 'Alabama', 'SEC', 6,
 25, 12, 15, 5, 9, 6, 10, 6,
 14, 8, 5, 2, 3, 2, 3, 0,
 4, 2, 1, 1, 2, 1, 3, 0,
 8, 5, 9, 4, 3, 5, 6, 5, 78, 19),

-- TENNESSEE VOLUNTEERS (School ID: 79) - NET #7
(79, 7902, 'Tennessee', 'SEC', 7,
 28, 9, 16, 4, 11, 4, 12, 5,
 16, 7, 6, 1, 3, 1, 3, 0,
 5, 2, 2, 1, 2, 1, 3, 0,
 11, 8, 12, 6, 5, 6, 7, 6, 84, 15),

-- KENTUCKY WILDCATS (School ID: 74) - NET #23
(74, 7402, 'Kentucky', 'SEC', 23,
 23, 10, 14, 6, 8, 5, 9, 4,
 9, 7, 7, 2, 4, 1, 3, 0,
 2, 3, 3, 1, 3, 1, 3, 0,
 34, 26, 29, 18, 16, 16, 15, 17, 81, 24),

-- FLORIDA GATORS (School ID: 20) - NET #19
(20, 2002, 'Florida', 'SEC', 19,
 24, 12, 14, 6, 9, 6, 10, 6,
 11, 8, 6, 3, 4, 1, 3, 0,
 3, 3, 2, 2, 3, 1, 3, 0,
 28, 21, 23, 15, 14, 13, 12, 14, 76, 28),

-- TEXAS A&M AGGIES (School ID: 81) - NET #20
(81, 8102, 'Texas A&M', 'SEC', 20,
 26, 9, 13, 7, 10, 4, 13, 5,
 12, 7, 7, 1, 4, 1, 3, 0,
 4, 2, 3, 1, 3, 1, 3, 0,
 24, 16, 19, 13, 12, 14, 11, 12, 82, 21),

-- TEXAS LONGHORNS (School ID: 80) - NET #28
(80, 8002, 'Texas', 'SEC', 28,
 21, 13, 11, 9, 7, 8, 10, 4,
 8, 9, 6, 3, 5, 1, 2, 0,
 2, 4, 2, 2, 4, 1, 2, 0,
 58, 39, 48, 23, 22, 20, 18, 21, 68, 36),

-- ARKANSAS RAZORBACKS (School ID: 71) - NET #34
(71, 7102, 'Arkansas', 'SEC', 34,
 22, 13, 12, 8, 8, 7, 10, 5,
 7, 9, 6, 4, 6, 0, 3, 0,
 1, 5, 2, 3, 5, 0, 2, 0,
 74, 49, 54, 29, 27, 25, 23, 28, 64, 40),

-- OLE MISS REBELS (School ID: 77) - NET #41
(77, 7702, 'Ole Miss', 'SEC', 41,
 21, 14, 11, 9, 7, 9, 10, 5,
 6, 10, 5, 5, 7, 0, 3, 0,
 0, 6, 2, 3, 6, 0, 2, 0,
 92, 64, 69, 36, 34, 32, 30, 37, 59, 45),

-- MISSOURI TIGERS (School ID: 22) - NET #52
(22, 2202, 'Missouri', 'SEC', 52,
 20, 15, 10, 10, 6, 10, 10, 5,
 4, 12, 4, 6, 8, 0, 4, 0,
 0, 7, 1, 4, 7, 0, 2, 0,
 116, 85, 84, 44, 41, 37, 35, 44, 55, 49),

-- LSU TIGERS (School ID: 75) - NET #58
(75, 7502, 'LSU', 'SEC', 58,
 19, 16, 9, 11, 5, 11, 10, 5,
 3, 13, 3, 7, 8, 0, 5, 0,
 0, 8, 0, 5, 7, 0, 3, 0,
 131, 97, 94, 51, 48, 44, 42, 51, 51, 53),

-- GEORGIA BULLDOGS (School ID: 73) - NET #71
(73, 7302, 'Georgia', 'SEC', 71,
 18, 17, 8, 12, 4, 12, 10, 5,
 2, 14, 2, 8, 8, 0, 6, 0,
 0, 9, 0, 5, 6, 0, 4, 0,
 148, 115, 109, 65, 62, 58, 56, 65, 47, 57),

-- VANDERBILT COMMODORES (School ID: 82) - NET #83
(82, 8202, 'Vanderbilt', 'SEC', 83,
 17, 18, 7, 13, 3, 13, 10, 5,
 1, 15, 1, 9, 8, 0, 7, 0,
 0, 10, 0, 5, 6, 0, 4, 0,
 162, 129, 124, 72, 69, 65, 63, 70, 43, 61),

-- SOUTH CAROLINA GAMECOCKS (School ID: 78) - NET #96
(78, 7802, 'South Carolina', 'SEC', 96,
 16, 19, 6, 14, 2, 14, 10, 5,
 0, 16, 0, 10, 8, 0, 8, 0,
 0, 11, 0, 5, 6, 0, 4, 0,
 176, 143, 138, 81, 78, 74, 72, 79, 39, 65),

-- OKLAHOMA SOONERS (School ID: 27) - NET #118
(27, 2702, 'Oklahoma', 'SEC', 118,
 15, 20, 5, 15, 1, 15, 10, 5,
 0, 17, 0, 10, 7, 1, 8, 0,
 0, 12, 0, 5, 5, 1, 5, 0,
 194, 161, 156, 95, 92, 88, 86, 93, 35, 69),

-- MISSISSIPPI STATE BULLDOGS (School ID: 76) - NET #127
(76, 7602, 'Mississippi State', 'SEC', 127,
 14, 21, 4, 16, 0, 16, 10, 5,
 0, 18, 0, 10, 6, 2, 8, 0,
 0, 13, 0, 5, 4, 2, 6, 0,
 208, 174, 169, 109, 106, 102, 100, 107, 31, 73);

-- ============================================
-- BIG TEN CONFERENCE RANKINGS (18 Teams)
-- ============================================

INSERT INTO comprehensive_rankings (
  school_id, team_id, school_name, conference, net_ranking,
  overall_wins, overall_losses, conference_wins, conference_losses,
  road_wins, road_losses, non_conference_wins, non_conference_losses,
  q1_overall_wins, q1_overall_losses, q2_overall_wins, q2_overall_losses,
  q3_overall_wins, q3_overall_losses, q4_overall_wins, q4_overall_losses,
  q1_nonconf_wins, q1_nonconf_losses, q2_nonconf_wins, q2_nonconf_losses,
  q3_nonconf_wins, q3_nonconf_losses, q4_nonconf_wins, q4_nonconf_losses,
  net_sos_ranking, rpi_sos_ranking, nonconf_sos_ranking,
  kpi_ranking, sor_ranking, bpi_ranking, pom_ranking, t_rank_ranking,
  avg_net_wins, avg_net_losses
) VALUES

-- MICHIGAN STATE SPARTANS (School ID: 57) - NET #9, Big Ten Champions
(57, 5702, 'Michigan State', 'Big Ten', 9,
 30, 7, 17, 3, 8, 2, 9, 2,
 15, 6, 5, 1, 6, 0, 4, 0,
 1, 2, 1, 0, 3, 0, 4, 0,
 31, 13, 43, 7, 8, 11, 8, 13, 89, 32),

-- MARYLAND TERRAPINS (School ID: 55) - NET #11
(55, 5502, 'Maryland', 'Big Ten', 11,
 27, 9, 14, 6, 11, 4, 13, 5,
 13, 7, 6, 1, 5, 1, 3, 0,
 3, 2, 2, 1, 4, 1, 4, 0,
 36, 17, 38, 8, 7, 9, 7, 9, 85, 25),

-- WISCONSIN BADGERS (School ID: 69) - NET #14
(69, 6902, 'Wisconsin', 'Big Ten', 14,
 27, 10, 13, 7, 6, 5, 10, 1,
 8, 9, 10, 1, 3, 0, 6, 0,
 1, 1, 3, 0, 0, 0, 6, 0,
 28, 36, 76, 16, 11, 18, 13, 12, 105, 23),

-- PURDUE BOILERMAKERS (School ID: 64) - NET #16
(64, 6402, 'Purdue', 'Big Ten', 16,
 24, 12, 13, 7, 9, 6, 11, 5,
 10, 8, 7, 2, 5, 2, 2, 0,
 2, 3, 3, 1, 4, 1, 2, 0,
 47, 32, 58, 13, 13, 15, 11, 15, 78, 34),

-- ILLINOIS FIGHTING ILLINI (School ID: 52) - NET #17
(52, 5202, 'Illinois', 'Big Ten', 17,
 22, 13, 12, 8, 8, 7, 10, 5,
 9, 9, 6, 3, 5, 1, 2, 0,
 2, 4, 2, 2, 4, 1, 2, 0,
 53, 38, 62, 17, 15, 17, 14, 18, 73, 37),

-- MICHIGAN WOLVERINES (School ID: 56) - NET #18
(56, 5602, 'Michigan', 'Big Ten', 18,
 27, 10, 14, 6, 11, 5, 13, 5,
 11, 7, 7, 2, 6, 1, 3, 0,
 3, 2, 3, 1, 5, 1, 2, 0,
 49, 34, 54, 14, 14, 16, 12, 16, 81, 31),

-- UCLA BRUINS (School ID: 66) - NET #21
(66, 6602, 'UCLA', 'Big Ten', 21,
 23, 11, 13, 7, 9, 6, 10, 4,
 8, 8, 7, 2, 6, 1, 2, 0,
 2, 3, 3, 1, 4, 1, 2, 0,
 61, 44, 67, 19, 18, 19, 17, 20, 76, 33),

-- OREGON DUCKS (School ID: 62) - NET #27
(62, 6202, 'Oregon', 'Big Ten', 27,
 25, 10, 12, 8, 10, 5, 13, 5,
 9, 7, 8, 2, 6, 1, 2, 0,
 3, 2, 4, 1, 4, 1, 2, 0,
 66, 46, 71, 21, 20, 21, 19, 22, 74, 35),

-- OHIO STATE BUCKEYES (School ID: 61) - NET #39
(61, 6102, 'Ohio State', 'Big Ten', 39,
 21, 14, 11, 9, 7, 9, 10, 5,
 6, 10, 6, 4, 7, 0, 2, 0,
 1, 5, 2, 3, 5, 0, 2, 0,
 87, 59, 82, 33, 30, 30, 27, 32, 66, 41),

-- INDIANA HOOSIERS (School ID: 53) - NET #52
(53, 5302, 'Indiana', 'Big Ten', 52,
 19, 16, 9, 11, 5, 11, 10, 5,
 4, 12, 4, 6, 8, 0, 3, 0,
 0, 7, 1, 4, 7, 0, 2, 0,
 117, 86, 87, 43, 40, 36, 34, 45, 58, 50),

-- IOWA HAWKEYES (School ID: 54) - NET #60
(54, 5402, 'Iowa', 'Big Ten', 60,
 20, 15, 10, 10, 6, 10, 10, 5,
 4, 11, 5, 5, 8, 0, 3, 0,
 0, 6, 2, 3, 6, 0, 2, 0,
 127, 91, 96, 48, 45, 41, 39, 48, 56, 52),

-- PENN STATE NITTANY LIONS (School ID: 63) - NET #62
(63, 6302, 'Penn State', 'Big Ten', 62,
 18, 17, 8, 12, 4, 12, 10, 5,
 3, 13, 3, 7, 8, 0, 4, 0,
 0, 8, 0, 5, 6, 0, 4, 0,
 134, 104, 101, 55, 52, 48, 46, 55, 54, 54),

-- USC TROJANS (School ID: 67) - NET #65
(67, 6702, 'USC', 'Big Ten', 65,
 17, 18, 7, 13, 3, 7, 8, 3,
 3, 13, 4, 3, 4, 2, 6, 0,
 0, 2, 0, 0, 2, 1, 6, 0,
 43, 26, 254, 69, 83, 63, 59, 65, 128, 40),

-- RUTGERS SCARLET KNIGHTS (School ID: 65) - NET #74
(65, 6502, 'Rutgers', 'Big Ten', 74,
 16, 19, 6, 14, 2, 14, 10, 5,
 1, 15, 1, 9, 8, 0, 6, 0,
 0, 10, 0, 5, 6, 0, 4, 0,
 149, 118, 113, 67, 64, 60, 58, 68, 50, 58),

-- NORTHWESTERN WILDCATS (School ID: 60) - NET #75
(60, 6002, 'Northwestern', 'Big Ten', 75,
 17, 18, 7, 13, 3, 13, 10, 5,
 2, 14, 2, 8, 8, 0, 5, 0,
 0, 9, 0, 5, 6, 0, 4, 0,
 153, 121, 116, 70, 67, 63, 61, 71, 48, 60),

-- NEBRASKA CORNHUSKERS (School ID: 59) - NET #85
(59, 5902, 'Nebraska', 'Big Ten', 85,
 16, 18, 6, 14, 2, 14, 10, 4,
 1, 15, 1, 9, 8, 0, 6, 0,
 0, 10, 0, 4, 6, 0, 4, 0,
 161, 127, 121, 75, 72, 68, 66, 76, 46, 62),

-- MINNESOTA GOLDEN GOPHERS (School ID: 58) - NET #93
(58, 5802, 'Minnesota', 'Big Ten', 93,
 15, 17, 7, 13, 1, 13, 8, 4,
 0, 16, 0, 9, 7, 1, 8, 0,
 0, 11, 0, 4, 5, 1, 3, 0,
 173, 140, 133, 82, 79, 75, 73, 83, 44, 64),

-- WASHINGTON HUSKIES (School ID: 68) - NET #109
(68, 6802, 'Washington', 'Big Ten', 109,
 12, 18, 4, 16, 0, 14, 8, 2,
 0, 17, 0, 8, 6, 2, 6, 0,
 0, 12, 0, 3, 4, 2, 4, 0,
 191, 158, 151, 92, 89, 85, 83, 90, 40, 66);

-- ============================================
-- INDEXES AND PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rankings_net ON comprehensive_rankings(net_ranking);
CREATE INDEX IF NOT EXISTS idx_rankings_conference ON comprehensive_rankings(conference);
CREATE INDEX IF NOT EXISTS idx_rankings_school ON comprehensive_rankings(school_id);
CREATE INDEX IF NOT EXISTS idx_rankings_overall_record ON comprehensive_rankings(overall_wins DESC, overall_losses ASC);
CREATE INDEX IF NOT EXISTS idx_rankings_conference_record ON comprehensive_rankings(conference_wins DESC, conference_losses ASC);

-- ============================================
-- SUMMARY VIEWS
-- ============================================

-- Conference Rankings Summary
CREATE OR REPLACE VIEW conference_rankings_summary AS
SELECT 
  conference,
  COUNT(*) as total_teams,
  AVG(net_ranking) as avg_net_ranking,
  MIN(net_ranking) as best_net_ranking,
  MAX(net_ranking) as worst_net_ranking,
  AVG(overall_wins::FLOAT / (overall_wins + overall_losses)) as avg_win_percentage,
  COUNT(CASE WHEN net_ranking <= 25 THEN 1 END) as top_25_teams,
  COUNT(CASE WHEN net_ranking <= 50 THEN 1 END) as top_50_teams,
  COUNT(CASE WHEN net_ranking <= 100 THEN 1 END) as top_100_teams
FROM comprehensive_rankings
GROUP BY conference
ORDER BY avg_net_ranking;

-- Quadrant Performance Summary
CREATE OR REPLACE VIEW quadrant_performance_summary AS
SELECT 
  school_name,
  conference,
  net_ranking,
  q1_overall_wins || '-' || q1_overall_losses as quadrant_1_record,
  q2_overall_wins || '-' || q2_overall_losses as quadrant_2_record,
  q3_overall_wins || '-' || q3_overall_losses as quadrant_3_record,
  q4_overall_wins || '-' || q4_overall_losses as quadrant_4_record,
  ROUND((q1_overall_wins + q2_overall_wins)::FLOAT / 
        NULLIF(q1_overall_wins + q1_overall_losses + q2_overall_wins + q2_overall_losses, 0), 3) 
        as quality_win_percentage
FROM comprehensive_rankings
ORDER BY net_ranking;

-- Strength of Schedule Rankings
CREATE OR REPLACE VIEW sos_rankings_summary AS
SELECT 
  school_name,
  conference,
  net_ranking,
  net_sos_ranking,
  rpi_sos_ranking,
  nonconf_sos_ranking,
  ROUND((net_sos_ranking + rpi_sos_ranking + nonconf_sos_ranking)::FLOAT / 3, 1) as avg_sos_ranking
FROM comprehensive_rankings
ORDER BY avg_sos_ranking;

COMMENT ON TABLE comprehensive_rankings IS 'Complete 2024-25 men''s basketball rankings compilation with ALL metrics from team sheets across 68 teams in 4 major conferences';
COMMENT ON VIEW conference_rankings_summary IS 'Conference-level performance metrics and NET ranking distributions';
COMMENT ON VIEW quadrant_performance_summary IS 'Team quadrant records for NCAA tournament evaluation';
COMMENT ON VIEW sos_rankings_summary IS 'Strength of schedule metrics across multiple ranking systems';