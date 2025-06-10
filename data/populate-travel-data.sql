-- Populate Travel Mileage Tables with Big 12 Data
-- This script inserts real Big 12 school data and generates travel distances

-- Insert Big 12 Schools with coordinates and tier information
INSERT INTO schools (school_name, school_code, city, state, latitude, longitude, timezone, conference_status, tier, travel_budget_range_min, travel_budget_range_max) VALUES
('Arizona', 'ARIZ', 'Tucson', 'Arizona', 32.2319, -110.9501, 'Mountain', 'full_member', 'TIER_2', 3000000, 5000000),
('Arizona State', 'ASU', 'Tempe', 'Arizona', 33.4242, -111.9281, 'Mountain', 'full_member', 'TIER_2', 3000000, 5000000),
('Baylor', 'BAY', 'Waco', 'Texas', 31.5489, -97.1131, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('BYU', 'BYU', 'Provo', 'Utah', 40.2518, -111.6493, 'Mountain', 'full_member', 'TIER_2', 3000000, 5000000),
('Cincinnati', 'CIN', 'Cincinnati', 'Ohio', 39.1032, -84.5120, 'Eastern', 'full_member', 'TIER_2', 3000000, 5000000),
('Colorado', 'COL', 'Boulder', 'Colorado', 40.0076, -105.2659, 'Mountain', 'full_member', 'TIER_2', 3000000, 5000000),
('Houston', 'HOU', 'Houston', 'Texas', 29.7604, -95.3698, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('Iowa State', 'ISU', 'Ames', 'Iowa', 42.0308, -93.6319, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('Kansas', 'KU', 'Lawrence', 'Kansas', 38.9717, -95.2353, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('Kansas State', 'KSU', 'Manhattan', 'Kansas', 39.1836, -96.5717, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('Oklahoma State', 'OSU', 'Stillwater', 'Oklahoma', 36.1156, -97.0583, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('TCU', 'TCU', 'Fort Worth', 'Texas', 32.7297, -97.2909, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('Texas Tech', 'TTU', 'Lubbock', 'Texas', 33.5779, -101.8552, 'Central', 'full_member', 'TIER_2', 3000000, 5000000),
('UCF', 'UCF', 'Orlando', 'Florida', 28.6024, -81.2001, 'Eastern', 'full_member', 'TIER_2', 3000000, 5000000),
('Utah', 'UTAH', 'Salt Lake City', 'Utah', 40.7649, -111.8421, 'Mountain', 'full_member', 'TIER_2', 3000000, 5000000),
('West Virginia', 'WVU', 'Morgantown', 'West Virginia', 39.6295, -79.9559, 'Eastern', 'full_member', 'TIER_2', 3000000, 5000000),
-- Associate Members (Tier 3, except for special cases)
('Florida', 'FLA', 'Gainesville', 'Florida', 29.6516, -82.3248, 'Eastern', 'associate_member', 'TIER_2', 3000000, 5000000),
('Missouri', 'MIZ', 'Columbia', 'Missouri', 38.9517, -92.3341, 'Central', 'associate_member', 'TIER_2', 3000000, 5000000),
('Oklahoma', 'OU', 'Norman', 'Oklahoma', 35.2226, -97.4395, 'Central', 'associate_member', 'TIER_2', 3000000, 5000000),
-- Other associates at Tier 3
('Air Force', 'AF', 'Colorado Springs', 'Colorado', 38.9959, -104.8628, 'Mountain', 'associate_member', 'TIER_3', 1500000, 2500000),
('Cal Baptist', 'CBU', 'Riverside', 'California', 33.9533, -117.3962, 'Pacific', 'associate_member', 'TIER_3', 1500000, 2500000),
('Denver', 'DU', 'Denver', 'Colorado', 39.6769, -104.9614, 'Mountain', 'associate_member', 'TIER_3', 1500000, 2500000),
('Fresno State', 'FRES', 'Fresno', 'California', 36.8144, -119.7539, 'Pacific', 'associate_member', 'TIER_3', 1500000, 2500000),
('North Dakota State', 'NDSU', 'Fargo', 'North Dakota', 46.8772, -96.7898, 'Central', 'associate_member', 'TIER_3', 1500000, 2500000),
('Northern Colorado', 'UNC', 'Greeley', 'Colorado', 40.4030, -104.6918, 'Mountain', 'associate_member', 'TIER_3', 1500000, 2500000),
('Northern Iowa', 'UNI', 'Cedar Falls', 'Iowa', 42.4534, -92.4463, 'Central', 'associate_member', 'TIER_3', 1500000, 2500000),
('Old Dominion', 'ODU', 'Norfolk', 'Virginia', 36.8846, -76.3042, 'Eastern', 'associate_member', 'TIER_3', 1500000, 2500000),
('San Diego State', 'SDSU', 'San Diego', 'California', 32.7767, -117.0711, 'Pacific', 'associate_member', 'TIER_3', 1500000, 2500000),
('South Dakota State', 'SDSU', 'Brookings', 'South Dakota', 44.3106, -96.7969, 'Central', 'associate_member', 'TIER_3', 1500000, 2500000),
('Tulsa', 'TLSA', 'Tulsa', 'Oklahoma', 36.1560, -95.9928, 'Central', 'associate_member', 'TIER_3', 1500000, 2500000),
('UC Davis', 'UCD', 'Davis', 'California', 38.5382, -121.7617, 'Pacific', 'associate_member', 'TIER_3', 1500000, 2500000),
('Utah Valley', 'UVU', 'Orem', 'Utah', 40.2677, -111.7323, 'Mountain', 'associate_member', 'TIER_3', 1500000, 2500000),
('Wyoming', 'WYO', 'Laramie', 'Wyoming', 41.3114, -105.5911, 'Mountain', 'associate_member', 'TIER_3', 1500000, 2500000)
ON CONFLICT (school_name) DO UPDATE SET
  latitude = EXCLUDED.latitude,
  longitude = EXCLUDED.longitude,
  timezone = EXCLUDED.timezone,
  conference_status = EXCLUDED.conference_status,
  tier = EXCLUDED.tier,
  travel_budget_range_min = EXCLUDED.travel_budget_range_min,
  travel_budget_range_max = EXCLUDED.travel_budget_range_max;

-- Insert Sports
INSERT INTO sports (sport_name, sport_code, gender, season, roster_size_min, roster_size_max, travel_party_multiplier) VALUES
('Football', 'FB', 'men', 'fall', 105, 120, 2.0),
('Men''s Basketball', 'MBB', 'men', 'winter', 13, 15, 1.8),
('Women''s Basketball', 'WBB', 'women', 'winter', 13, 15, 1.8),
('Baseball', 'BB', 'men', 'spring', 27, 35, 1.6),
('Softball', 'SB', 'women', 'spring', 20, 25, 1.6),
('Volleyball', 'VB', 'women', 'fall', 12, 18, 1.5),
('Soccer', 'SOC', 'women', 'fall', 28, 32, 1.4),
('Tennis', 'TEN', 'mixed', 'spring', 8, 12, 1.3),
('Golf', 'GOLF', 'mixed', 'spring', 8, 12, 1.2),
('Wrestling', 'WRES', 'men', 'winter', 25, 35, 1.4),
('Swimming', 'SWIM', 'mixed', 'winter', 30, 40, 1.5),
('Track & Field', 'TF', 'mixed', 'spring', 40, 60, 1.3),
('Cross Country', 'XC', 'mixed', 'fall', 12, 20, 1.2),
('Gymnastics', 'GYM', 'women', 'winter', 12, 18, 1.4),
('Lacrosse', 'LAX', 'women', 'spring', 25, 30, 1.3),
('Beach Volleyball', 'BVB', 'women', 'spring', 6, 10, 1.2),
('Equestrian', 'EQU', 'women', 'fall', 15, 25, 1.6),
('Rowing', 'ROW', 'women', 'spring', 20, 30, 1.4)
ON CONFLICT (sport_name) DO UPDATE SET
  roster_size_min = EXCLUDED.roster_size_min,
  roster_size_max = EXCLUDED.roster_size_max,
  travel_party_multiplier = EXCLUDED.travel_party_multiplier;

-- Insert Travel Costs by Tier and Mode
INSERT INTO travel_costs (tier, transport_mode, distance_min, distance_max, base_cost, cost_per_mile, cost_per_person, fuel_surcharge_rate, capacity, comfort_rating, co2_emissions_per_mile) VALUES
-- Tier 2 (Big 12) costs
('TIER_2', 'charter_bus', 0, 600, 1500, 2.80, 0, 0.125, 56, 7.0, 2.1),
('TIER_2', 'charter_flight', 300, 2500, 24000, 30.0, 0, 0.15, 120, 9.5, 12.5),
('TIER_2', 'commercial_flight', 800, 3000, 0, 0, 400, 0.10, 150, 6.0, 8.2),
('TIER_2', 'van', 0, 300, 200, 1.20, 0, 0.10, 15, 5.5, 1.8),

-- Tier 3 (Associate Members) costs
('TIER_3', 'charter_bus', 0, 500, 1200, 2.50, 0, 0.125, 56, 6.5, 2.1),
('TIER_3', 'charter_flight', 400, 2000, 18000, 25.0, 0, 0.15, 100, 9.0, 12.5),
('TIER_3', 'commercial_flight', 600, 3000, 0, 0, 350, 0.10, 150, 6.0, 8.2),
('TIER_3', 'van', 0, 400, 180, 1.10, 0, 0.10, 15, 5.0, 1.8),

-- Tier 1 (Elite) costs for reference
('TIER_1', 'charter_bus', 0, 800, 2000, 3.20, 0, 0.125, 56, 8.0, 2.1),
('TIER_1', 'charter_flight', 200, 3000, 35000, 40.0, 0, 0.15, 150, 10.0, 12.5),
('TIER_1', 'commercial_flight', 1000, 3000, 0, 0, 500, 0.10, 150, 7.0, 8.2),

-- Tier 4 (Budget) costs for reference  
('TIER_4', 'charter_bus', 0, 400, 800, 2.00, 0, 0.125, 56, 5.5, 2.1),
('TIER_4', 'commercial_flight', 500, 2500, 0, 0, 250, 0.10, 150, 5.0, 8.2),
('TIER_4', 'van', 0, 500, 150, 0.90, 0, 0.10, 15, 4.5, 1.8)
ON CONFLICT (tier, transport_mode, distance_min, distance_max) DO UPDATE SET
  base_cost = EXCLUDED.base_cost,
  cost_per_mile = EXCLUDED.cost_per_mile,
  cost_per_person = EXCLUDED.cost_per_person;

-- Insert Travel Partners (Geographic and Strategic)
INSERT INTO travel_partners (school_1_id, school_2_id, partnership_type, efficiency_rating, cost_reduction_percentage, distance_between, sports_applicable) 
SELECT 
  s1.id, s2.id, 
  'geographic',
  CASE 
    WHEN calculate_haversine_distance(s1.latitude, s1.longitude, s2.latitude, s2.longitude) < 150 THEN 0.90
    WHEN calculate_haversine_distance(s1.latitude, s1.longitude, s2.latitude, s2.longitude) < 300 THEN 0.85
    ELSE 0.75
  END,
  CASE 
    WHEN calculate_haversine_distance(s1.latitude, s1.longitude, s2.latitude, s2.longitude) < 150 THEN 0.25
    WHEN calculate_haversine_distance(s1.latitude, s1.longitude, s2.latitude, s2.longitude) < 300 THEN 0.20
    ELSE 0.15
  END,
  calculate_haversine_distance(s1.latitude, s1.longitude, s2.latitude, s2.longitude),
  ARRAY['FB', 'MBB', 'WBB', 'BB', 'SB', 'VB']
FROM schools s1
JOIN schools s2 ON s1.id != s2.id
WHERE (
  -- Arizona schools
  (s1.school_name IN ('Arizona', 'Arizona State') AND s2.school_name IN ('Arizona', 'Arizona State')) OR
  -- Utah schools  
  (s1.school_name IN ('BYU', 'Utah') AND s2.school_name IN ('BYU', 'Utah')) OR
  -- DFW schools
  (s1.school_name IN ('Baylor', 'TCU') AND s2.school_name IN ('Baylor', 'TCU')) OR
  -- Kansas schools
  (s1.school_name IN ('Kansas', 'Kansas State') AND s2.school_name IN ('Kansas', 'Kansas State')) OR
  -- Regional clusters
  (s1.school_name IN ('Cincinnati', 'West Virginia') AND s2.school_name IN ('Cincinnati', 'West Virginia')) OR
  (s1.school_name IN ('Colorado', 'Texas Tech') AND s2.school_name IN ('Colorado', 'Texas Tech')) OR
  (s1.school_name IN ('Houston', 'UCF') AND s2.school_name IN ('Houston', 'UCF'))
)
AND s1.id < s2.id  -- Avoid duplicates
ON CONFLICT (school_1_id, school_2_id) DO UPDATE SET
  efficiency_rating = EXCLUDED.efficiency_rating,
  cost_reduction_percentage = EXCLUDED.cost_reduction_percentage,
  distance_between = EXCLUDED.distance_between;

-- Populate the travel mileage matrix
SELECT populate_travel_mileage_matrix();

-- Create some sample optimization cache entries
INSERT INTO travel_optimization_cache (
  origin_school_id, destination_school_id, sport_id, travel_date, 
  recommended_mode, estimated_cost, travel_time_hours, comfort_score, 
  sustainability_score, performance_impact_score
) 
SELECT 
  s1.id, s2.id, sp.id,
  CURRENT_DATE + INTERVAL '30 days',
  CASE 
    WHEN tm.distance_miles < 300 THEN 'charter_bus'
    WHEN tm.distance_miles < 600 AND s1.tier = 'TIER_2' THEN 'charter_bus'
    WHEN tm.distance_miles < 1200 AND s1.tier = 'TIER_2' THEN 'charter_flight'
    ELSE 'charter_flight'
  END,
  CASE 
    WHEN tm.distance_miles < 300 THEN 8000
    WHEN tm.distance_miles < 600 THEN 12000
    WHEN tm.distance_miles < 1200 THEN 28000
    ELSE 45000
  END,
  CASE 
    WHEN tm.distance_miles < 300 THEN tm.distance_miles / 55.0
    WHEN tm.distance_miles < 600 THEN tm.distance_miles / 55.0
    ELSE 3.5
  END,
  CASE 
    WHEN tm.distance_miles < 300 THEN 0.70
    WHEN tm.distance_miles < 600 THEN 0.75
    ELSE 0.95
  END,
  CASE 
    WHEN tm.distance_miles < 300 THEN 0.85
    WHEN tm.distance_miles < 600 THEN 0.80
    ELSE 0.60
  END,
  CASE 
    WHEN tm.distance_miles < 300 THEN 0.90
    WHEN tm.distance_miles < 600 THEN 0.85
    ELSE 0.75
  END
FROM schools s1
JOIN schools s2 ON s1.id != s2.id
JOIN sports sp ON sp.sport_name IN ('Football', 'Men''s Basketball', 'Women''s Basketball')
JOIN travel_mileage tm ON tm.origin_school_id = s1.id AND tm.destination_school_id = s2.id
WHERE s1.conference_status = 'full_member' 
  AND s2.conference_status = 'full_member'
  AND s1.id < s2.id
LIMIT 50
ON CONFLICT (origin_school_id, destination_school_id, sport_id, travel_date) DO NOTHING;

-- Add some comments for data verification
COMMENT ON TABLE travel_mileage IS 'Generated distance matrix for all Big 12 schools using haversine formula';
COMMENT ON TABLE travel_costs IS 'Tier-specific transportation costs based on 2024-2025 research data';
COMMENT ON TABLE travel_partners IS 'Geographic and strategic travel partnerships for cost optimization';