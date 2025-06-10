-- Travel Mileage Schema for Supabase
-- Big 12 Conference travel distance calculations and optimization

-- Schools master table
CREATE TABLE IF NOT EXISTS schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name VARCHAR(100) NOT NULL UNIQUE,
    school_code VARCHAR(10) NOT NULL UNIQUE,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    conference_status VARCHAR(20) NOT NULL CHECK (conference_status IN ('full_member', 'associate_member')),
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4')),
    travel_budget_range_min INTEGER,
    travel_budget_range_max INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sports master table
CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_name VARCHAR(50) NOT NULL UNIQUE,
    sport_code VARCHAR(10) NOT NULL UNIQUE,
    gender VARCHAR(10) CHECK (gender IN ('men', 'women', 'mixed')),
    season VARCHAR(20) CHECK (season IN ('fall', 'winter', 'spring', 'year_round')),
    roster_size_min INTEGER,
    roster_size_max INTEGER,
    travel_party_multiplier DECIMAL(3, 2) DEFAULT 1.5,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table (junction of schools and sports)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    participation_type VARCHAR(20) DEFAULT 'full' CHECK (participation_type IN ('full', 'associate', 'affiliate')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_id, sport_id)
);

-- Travel mileage matrix
CREATE TABLE IF NOT EXISTS travel_mileage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    destination_school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    distance_miles DECIMAL(8, 2) NOT NULL,
    driving_time_hours DECIMAL(5, 2),
    straight_line_distance DECIMAL(8, 2),
    timezone_difference INTEGER DEFAULT 0,
    calculation_method VARCHAR(20) DEFAULT 'haversine' CHECK (calculation_method IN ('haversine', 'road_distance', 'manual')),
    last_verified DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(origin_school_id, destination_school_id),
    CHECK (origin_school_id != destination_school_id),
    CHECK (distance_miles > 0),
    CHECK (driving_time_hours > 0)
);

-- Travel costs by tier and mode
CREATE TABLE IF NOT EXISTS travel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier VARCHAR(10) NOT NULL CHECK (tier IN ('TIER_1', 'TIER_2', 'TIER_3', 'TIER_4')),
    transport_mode VARCHAR(20) NOT NULL CHECK (transport_mode IN ('charter_bus', 'charter_flight', 'commercial_flight', 'van')),
    distance_min INTEGER NOT NULL,
    distance_max INTEGER NOT NULL,
    base_cost INTEGER NOT NULL,
    cost_per_mile DECIMAL(6, 2),
    cost_per_person DECIMAL(8, 2),
    fuel_surcharge_rate DECIMAL(4, 3) DEFAULT 0,
    capacity INTEGER,
    comfort_rating DECIMAL(2, 1) CHECK (comfort_rating BETWEEN 0 AND 10),
    co2_emissions_per_mile DECIMAL(6, 3),
    effective_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Travel partners (for coordination and cost sharing)
CREATE TABLE IF NOT EXISTS travel_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_1_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    school_2_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    partnership_type VARCHAR(20) DEFAULT 'geographic' CHECK (partnership_type IN ('geographic', 'strategic', 'sport_specific')),
    efficiency_rating DECIMAL(3, 2) CHECK (efficiency_rating BETWEEN 0 AND 1),
    cost_reduction_percentage DECIMAL(3, 2) CHECK (cost_reduction_percentage BETWEEN 0 AND 1),
    distance_between DECIMAL(8, 2),
    is_active BOOLEAN DEFAULT TRUE,
    sports_applicable TEXT[], -- Array of sport codes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(school_1_id, school_2_id),
    CHECK (school_1_id != school_2_id)
);

-- Travel optimization cache
CREATE TABLE IF NOT EXISTS travel_optimization_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    origin_school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    destination_school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    travel_date DATE NOT NULL,
    recommended_mode VARCHAR(20) NOT NULL,
    estimated_cost INTEGER NOT NULL,
    travel_time_hours DECIMAL(5, 2),
    comfort_score DECIMAL(3, 2),
    sustainability_score DECIMAL(3, 2),
    performance_impact_score DECIMAL(3, 2),
    optimization_version VARCHAR(10) DEFAULT '1.0',
    cache_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_travel_mileage_origin ON travel_mileage(origin_school_id);
CREATE INDEX IF NOT EXISTS idx_travel_mileage_destination ON travel_mileage(destination_school_id);
CREATE INDEX IF NOT EXISTS idx_travel_mileage_distance ON travel_mileage(distance_miles);
CREATE INDEX IF NOT EXISTS idx_schools_tier ON schools(tier);
CREATE INDEX IF NOT EXISTS idx_teams_school_sport ON teams(school_id, sport_id);
CREATE INDEX IF NOT EXISTS idx_travel_costs_tier_mode ON travel_costs(tier, transport_mode);
CREATE INDEX IF NOT EXISTS idx_travel_partners_schools ON travel_partners(school_1_id, school_2_id);
CREATE INDEX IF NOT EXISTS idx_optimization_cache_lookup ON travel_optimization_cache(origin_school_id, destination_school_id, sport_id, travel_date);

-- Enable Row Level Security
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_mileage ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel_optimization_cache ENABLE ROW LEVEL SECURITY;

-- Create policies for read access (adjust based on your authentication needs)
CREATE POLICY "Allow read access to schools" ON schools FOR SELECT USING (true);
CREATE POLICY "Allow read access to sports" ON sports FOR SELECT USING (true);
CREATE POLICY "Allow read access to teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Allow read access to travel_mileage" ON travel_mileage FOR SELECT USING (true);
CREATE POLICY "Allow read access to travel_costs" ON travel_costs FOR SELECT USING (true);
CREATE POLICY "Allow read access to travel_partners" ON travel_partners FOR SELECT USING (true);
CREATE POLICY "Allow read access to travel_optimization_cache" ON travel_optimization_cache FOR SELECT USING (true);

-- Functions and triggers for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add update triggers
CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sports_updated_at BEFORE UPDATE ON sports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_mileage_updated_at BEFORE UPDATE ON travel_mileage FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_costs_updated_at BEFORE UPDATE ON travel_costs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_travel_partners_updated_at BEFORE UPDATE ON travel_partners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate haversine distance
CREATE OR REPLACE FUNCTION calculate_haversine_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    R CONSTANT DECIMAL := 3959; -- Earth's radius in miles
    dLat DECIMAL;
    dLon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLon := RADIANS(lon2 - lon1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLon/2) * SIN(dLon/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically populate mileage matrix
CREATE OR REPLACE FUNCTION populate_travel_mileage_matrix()
RETURNS INTEGER AS $$
DECLARE
    school_record1 RECORD;
    school_record2 RECORD;
    calculated_distance DECIMAL;
    calculated_time DECIMAL;
    timezone_diff INTEGER;
    records_inserted INTEGER := 0;
BEGIN
    -- Loop through all school pairs
    FOR school_record1 IN SELECT * FROM schools LOOP
        FOR school_record2 IN SELECT * FROM schools WHERE id != school_record1.id LOOP
            -- Check if this distance calculation already exists
            IF NOT EXISTS (
                SELECT 1 FROM travel_mileage 
                WHERE origin_school_id = school_record1.id 
                AND destination_school_id = school_record2.id
            ) THEN
                -- Calculate distance using haversine formula
                calculated_distance := calculate_haversine_distance(
                    school_record1.latitude, school_record1.longitude,
                    school_record2.latitude, school_record2.longitude
                );
                
                -- Estimate driving time (distance / average speed)
                calculated_time := calculated_distance / 55.0; -- 55 mph average
                
                -- Calculate timezone difference (simplified)
                timezone_diff := CASE 
                    WHEN school_record1.timezone = school_record2.timezone THEN 0
                    WHEN (school_record1.timezone = 'Eastern' AND school_record2.timezone = 'Central') OR 
                         (school_record1.timezone = 'Central' AND school_record2.timezone = 'Eastern') THEN 1
                    WHEN (school_record1.timezone = 'Central' AND school_record2.timezone = 'Mountain') OR 
                         (school_record1.timezone = 'Mountain' AND school_record2.timezone = 'Central') THEN 1
                    WHEN (school_record1.timezone = 'Eastern' AND school_record2.timezone = 'Mountain') OR 
                         (school_record1.timezone = 'Mountain' AND school_record2.timezone = 'Eastern') THEN 2
                    ELSE 0
                END;
                
                -- Insert the calculated distance
                INSERT INTO travel_mileage (
                    origin_school_id, destination_school_id, distance_miles, 
                    driving_time_hours, straight_line_distance, timezone_difference,
                    calculation_method
                ) VALUES (
                    school_record1.id, school_record2.id, calculated_distance,
                    calculated_time, calculated_distance, timezone_diff,
                    'haversine'
                );
                
                records_inserted := records_inserted + 1;
            END IF;
        END LOOP;
    END LOOP;
    
    RETURN records_inserted;
END;
$$ LANGUAGE plpgsql;

-- View for easy travel distance lookups
CREATE OR REPLACE VIEW v_travel_distances AS
SELECT 
    tm.id,
    s1.school_name AS origin_school,
    s1.school_code AS origin_code,
    s2.school_name AS destination_school,
    s2.school_code AS destination_code,
    tm.distance_miles,
    tm.driving_time_hours,
    tm.timezone_difference,
    CASE 
        WHEN tm.distance_miles < 300 THEN 'Regional'
        WHEN tm.distance_miles < 600 THEN 'Conference'
        WHEN tm.distance_miles < 1200 THEN 'Cross-Regional'
        ELSE 'Cross-Country'
    END AS trip_category,
    tm.last_verified,
    tm.calculation_method
FROM travel_mileage tm
JOIN schools s1 ON tm.origin_school_id = s1.id
JOIN schools s2 ON tm.destination_school_id = s2.id;

-- View for travel partner information with distances
CREATE OR REPLACE VIEW v_travel_partners AS
SELECT 
    tp.id,
    s1.school_name AS school_1,
    s1.school_code AS school_1_code,
    s2.school_name AS school_2,
    s2.school_code AS school_2_code,
    tp.partnership_type,
    tp.efficiency_rating,
    tp.cost_reduction_percentage,
    tp.distance_between,
    tp.sports_applicable,
    tp.is_active
FROM travel_partners tp
JOIN schools s1 ON tp.school_1_id = s1.id
JOIN schools s2 ON tp.school_2_id = s2.id
WHERE tp.is_active = true;

-- View for recommended transportation modes by distance and tier
CREATE OR REPLACE VIEW v_transportation_recommendations AS
SELECT 
    s1.school_name AS origin,
    s2.school_name AS destination,
    tm.distance_miles,
    s1.tier AS origin_tier,
    s2.tier AS destination_tier,
    CASE 
        WHEN tm.distance_miles < 300 THEN 'charter_bus'
        WHEN tm.distance_miles < 600 AND s1.tier IN ('TIER_1', 'TIER_2') THEN 'charter_bus_or_flight'
        WHEN tm.distance_miles < 1200 AND s1.tier IN ('TIER_1', 'TIER_2') THEN 'charter_flight'
        WHEN tm.distance_miles >= 1200 THEN 'charter_flight'
        ELSE 'charter_bus'
    END AS recommended_mode,
    tm.driving_time_hours,
    tm.timezone_difference
FROM travel_mileage tm
JOIN schools s1 ON tm.origin_school_id = s1.id
JOIN schools s2 ON tm.destination_school_id = s2.id;