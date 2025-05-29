-- FlexTime Microservices Migration
-- Venue Management Service Database Schema
-- PostgreSQL 13+ compatible

-- Drop existing tables if they exist (in dependency order)
DROP TABLE IF EXISTS venue_booking_conflicts CASCADE;
DROP TABLE IF EXISTS venue_maintenance_schedules CASCADE;
DROP TABLE IF EXISTS venue_capacity_configurations CASCADE;
DROP TABLE IF EXISTS venue_equipment_inventory CASCADE;
DROP TABLE IF EXISTS venue_availability_rules CASCADE;
DROP TABLE IF EXISTS venue_unavailability_periods CASCADE;
DROP TABLE IF EXISTS venue_sport_configurations CASCADE;
DROP TABLE IF EXISTS venue_operational_hours CASCADE;
DROP TABLE IF EXISTS venue_profiles CASCADE;
DROP TABLE IF EXISTS venues_institutions_view CASCADE;

-- Create materialized view for venue-institution relationships (denormalized for microservice boundary)
CREATE MATERIALIZED VIEW venues_institutions_view AS
SELECT 
    v.venue_id,
    v.name AS venue_name,
    v.city,
    v.state,
    v.address,
    v.latitude,
    v.longitude,
    v.capacity,
    v.facilities,
    v.institution_id,
    v.is_primary,
    v.metadata,
    v.supported_sports,
    v.time_zone,
    v.venue_type,
    v.created_at,
    v.updated_at,
    i.name AS institution_name,
    i.code AS institution_code,
    i.city AS institution_city,
    i.state AS institution_state
FROM venues v
LEFT JOIN institutions i ON v.institution_id = i.institution_id;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_venues_institutions_venue_id ON venues_institutions_view(venue_id);
CREATE INDEX idx_venues_institutions_institution_id ON venues_institutions_view(institution_id);
CREATE INDEX idx_venues_institutions_city_state ON venues_institutions_view(city, state);
CREATE INDEX idx_venues_institutions_primary ON venues_institutions_view(is_primary);

-- 1. Venue Profiles - Enhanced venue information for scheduling
CREATE TABLE venue_profiles (
    profile_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Basic information (denormalized from venues table for microservice independence)
    venue_name VARCHAR(100) NOT NULL,
    venue_type VARCHAR(20) CHECK (venue_type IN ('indoor', 'outdoor', 'mixed', 'field', 'court', 'pool', 'track')),
    primary_surface VARCHAR(50), -- 'natural_grass', 'artificial_turf', 'hardwood', 'synthetic_track', etc.
    
    -- Capacity and configuration
    standard_capacity INTEGER,
    maximum_capacity INTEGER,
    reduced_capacity INTEGER, -- For COVID-style restrictions
    vip_capacity INTEGER,
    student_section_capacity INTEGER,
    
    -- Physical specifications
    field_dimensions JSONB, -- {"length": 100, "width": 60, "units": "yards"}
    ceiling_height_feet INTEGER, -- For indoor venues
    lighting_specifications JSONB,
    sound_system_specifications JSONB,
    video_board_specifications JSONB,
    
    -- Operational capabilities
    simultaneous_events_capacity INTEGER DEFAULT 1,
    quick_turnaround_capable BOOLEAN DEFAULT FALSE,
    broadcast_ready BOOLEAN DEFAULT TRUE,
    streaming_infrastructure BOOLEAN DEFAULT TRUE,
    
    -- Climate and environmental
    climate_controlled BOOLEAN DEFAULT FALSE,
    weather_protection_level VARCHAR(20) DEFAULT 'none' CHECK (
        weather_protection_level IN ('none', 'partial', 'full', 'retractable')
    ),
    backup_power_available BOOLEAN DEFAULT FALSE,
    
    -- Accessibility and compliance
    ada_compliant BOOLEAN DEFAULT TRUE,
    ada_capacity INTEGER,
    emergency_evacuation_time_minutes INTEGER,
    safety_certifications JSONB DEFAULT '[]',
    
    -- Technology and infrastructure
    wifi_available BOOLEAN DEFAULT TRUE,
    cellular_coverage_quality INTEGER DEFAULT 3 CHECK (cellular_coverage_quality BETWEEN 1 AND 5),
    power_outlet_availability JSONB, -- {"media": 20, "concessions": 10, "general": 50}
    
    -- Parking and transportation
    on_site_parking_spaces INTEGER,
    nearby_parking_spaces INTEGER,
    public_transportation_access BOOLEAN DEFAULT FALSE,
    shuttle_service_available BOOLEAN DEFAULT FALSE,
    
    -- Amenities and services
    concession_stands_count INTEGER DEFAULT 0,
    restroom_facilities_count INTEGER,
    first_aid_stations_count INTEGER DEFAULT 1,
    team_locker_rooms_count INTEGER DEFAULT 2,
    official_facilities_available BOOLEAN DEFAULT TRUE,
    
    -- Media and broadcasting
    press_box_capacity INTEGER DEFAULT 0,
    media_work_rooms_count INTEGER DEFAULT 0,
    broadcast_booth_count INTEGER DEFAULT 0,
    interview_room_available BOOLEAN DEFAULT FALSE,
    
    -- Security and staffing
    security_office_on_site BOOLEAN DEFAULT TRUE,
    minimum_security_staff INTEGER DEFAULT 2,
    medical_staff_required BOOLEAN DEFAULT TRUE,
    volunteer_positions_available INTEGER DEFAULT 0,
    
    -- Financial and operational
    base_rental_cost DECIMAL(10,2),
    hourly_operational_cost DECIMAL(8,2),
    setup_cost DECIMAL(8,2),
    cleanup_cost DECIMAL(8,2),
    security_cost_per_hour DECIMAL(6,2),
    utilities_cost_per_hour DECIMAL(6,2),
    
    -- Maintenance and condition
    last_major_renovation_year INTEGER,
    facility_condition_rating INTEGER DEFAULT 3 CHECK (facility_condition_rating BETWEEN 1 AND 5),
    scheduled_maintenance_windows JSONB DEFAULT '[]',
    
    -- Scheduling metadata
    advance_booking_required_days INTEGER DEFAULT 7,
    cancellation_notice_required_hours INTEGER DEFAULT 48,
    setup_time_required_hours DECIMAL(4,2) DEFAULT 2.0,
    breakdown_time_required_hours DECIMAL(4,2) DEFAULT 1.0,
    
    -- Status and availability
    currently_available BOOLEAN DEFAULT TRUE,
    seasonal_availability VARCHAR(20) DEFAULT 'year_round' CHECK (
        seasonal_availability IN ('year_round', 'fall_winter', 'spring_summer', 'seasonal', 'limited')
    ),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(venue_id)
);

-- 2. Venue Operational Hours - When venues are available for use
CREATE TABLE venue_operational_hours (
    hours_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Day of week (0=Sunday, 1=Monday, etc.)
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    
    -- Operating hours
    open_time TIME,
    close_time TIME,
    
    -- Special hour configurations
    setup_allowed_before_open_hours INTEGER DEFAULT 2, -- Hours before open_time
    breakdown_allowed_after_close_hours INTEGER DEFAULT 1, -- Hours after close_time
    
    -- Seasonal variations
    effective_start_date DATE DEFAULT CURRENT_DATE,
    effective_end_date DATE,
    
    -- Holiday and special day overrides
    applies_to_holidays BOOLEAN DEFAULT FALSE,
    holiday_exceptions JSONB DEFAULT '[]', -- ["christmas", "new_years", "thanksgiving"]
    
    -- Event type restrictions
    allows_practices BOOLEAN DEFAULT TRUE,
    allows_games BOOLEAN DEFAULT TRUE,
    allows_tournaments BOOLEAN DEFAULT TRUE,
    allows_non_sport_events BOOLEAN DEFAULT FALSE,
    
    -- Noise and community restrictions
    noise_restrictions_apply BOOLEAN DEFAULT FALSE,
    community_quiet_hours_start TIME,
    community_quiet_hours_end TIME,
    
    -- Access and security
    requires_security_presence BOOLEAN DEFAULT FALSE,
    requires_facility_staff BOOLEAN DEFAULT TRUE,
    
    -- Priority and booking
    priority_booking_hours_start TIME, -- Hours with priority for certain users
    priority_booking_hours_end TIME,
    priority_user_types JSONB DEFAULT '[]', -- ["home_team", "conference", "broadcast"]
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_operational_hours CHECK (close_time > open_time OR (open_time IS NULL AND close_time IS NULL))
);

-- 3. Venue Sport Configurations - Sport-specific venue setups
CREATE TABLE venue_sport_configurations (
    config_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    sport_id INTEGER NOT NULL,
    
    -- Configuration details
    configuration_name VARCHAR(100) NOT NULL,
    is_primary_sport BOOLEAN DEFAULT FALSE,
    setup_complexity INTEGER DEFAULT 3 CHECK (setup_complexity BETWEEN 1 AND 5),
    
    -- Field/court specifications
    playing_area_dimensions JSONB NOT NULL, -- {"length": 100, "width": 53, "units": "yards"}
    sideline_buffer_feet INTEGER DEFAULT 6,
    endzone_depth_feet INTEGER,
    
    -- Equipment and infrastructure
    required_equipment JSONB DEFAULT '[]', -- ["goalposts", "nets", "timing_system"]
    permanent_equipment JSONB DEFAULT '[]',
    portable_equipment JSONB DEFAULT '[]',
    
    -- Capacity adjustments for sport
    sport_specific_capacity INTEGER,
    optimal_seating_configuration VARCHAR(50),
    
    -- Setup and breakdown requirements
    setup_time_hours DECIMAL(4,2) NOT NULL DEFAULT 2.0,
    breakdown_time_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    staff_required_for_setup INTEGER DEFAULT 2,
    
    -- Sport-specific safety requirements
    safety_buffer_zones JSONB, -- {"sideline": 6, "endline": 10, "overhead": 20}
    required_safety_equipment JSONB DEFAULT '[]',
    emergency_access_points INTEGER DEFAULT 2,
    
    -- Weather and environmental considerations
    weather_dependent BOOLEAN DEFAULT FALSE,
    temperature_requirements JSONB, -- {"min": 50, "max": 85, "optimal": 72}
    lighting_requirements JSONB,
    
    -- Media and broadcasting setup
    camera_positions JSONB DEFAULT '[]',
    broadcast_equipment_requirements JSONB DEFAULT '[]',
    
    -- Officials and game management
    officials_facilities_required JSONB DEFAULT '[]',
    scorer_table_configuration JSONB,
    bench_configuration JSONB,
    
    -- Scheduling preferences
    preferred_game_times JSONB DEFAULT '[]',
    avoided_times JSONB DEFAULT '[]',
    buffer_time_between_events_hours DECIMAL(4,2) DEFAULT 1.0,
    
    -- Usage statistics and performance
    annual_usage_events INTEGER DEFAULT 0,
    last_used_date DATE,
    maintenance_frequency_weeks INTEGER DEFAULT 4,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(venue_id, sport_id, configuration_name)
);

-- 4. Venue Unavailability Periods - Scheduled unavailable times
CREATE TABLE venue_unavailability_periods (
    unavailability_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Unavailability period
    start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Unavailability details
    unavailability_type VARCHAR(30) NOT NULL CHECK (unavailability_type IN (
        'maintenance', 'renovation', 'weather_damage', 'flooding', 'power_outage',
        'safety_inspection', 'deep_cleaning', 'facility_upgrade', 'surface_replacement',
        'non_sport_event', 'private_rental', 'emergency_closure', 'seasonal_closure',
        'staff_shortage', 'equipment_failure', 'construction', 'community_event'
    )),
    severity VARCHAR(15) NOT NULL DEFAULT 'hard' CHECK (severity IN ('hard', 'soft', 'advisory')),
    
    -- Impact and scope
    affects_entire_venue BOOLEAN DEFAULT TRUE,
    affected_areas JSONB DEFAULT '[]', -- ["field", "home_sideline", "press_box"]
    affected_sports JSONB DEFAULT '[]', -- If not entire venue
    
    -- Flexibility and alternatives
    allows_emergency_use BOOLEAN DEFAULT FALSE,
    alternative_setup_possible BOOLEAN DEFAULT FALSE,
    reduced_capacity_available BOOLEAN DEFAULT FALSE,
    
    -- Scheduling impact
    requires_event_relocation BOOLEAN DEFAULT TRUE,
    advance_notice_provided_days INTEGER DEFAULT 30,
    
    -- Contact and coordination
    reason_description TEXT NOT NULL,
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    
    -- Recurring patterns
    recurring_pattern VARCHAR(20) DEFAULT 'none' CHECK (
        recurring_pattern IN ('none', 'daily', 'weekly', 'monthly', 'annually', 'seasonal')
    ),
    recurrence_details JSONB, -- For complex recurring patterns
    
    -- External references
    work_order_number VARCHAR(50),
    contractor_information JSONB,
    permit_numbers JSONB DEFAULT '[]',
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'extended')
    ),
    actual_start_datetime TIMESTAMP WITH TIME ZONE,
    actual_end_datetime TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_unavailability_period CHECK (end_datetime > start_datetime)
);

-- 5. Venue Availability Rules - Complex availability logic
CREATE TABLE venue_availability_rules (
    rule_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Rule identification
    rule_name VARCHAR(100) NOT NULL,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN (
        'time_restriction', 'capacity_limit', 'sport_specific', 'weather_dependent',
        'seasonal', 'priority_booking', 'conflict_resolution', 'maintenance_window'
    )),
    priority_level INTEGER DEFAULT 3 CHECK (priority_level BETWEEN 1 AND 5),
    
    -- Rule conditions
    conditions JSONB NOT NULL, -- Complex conditions in JSON format
    -- Example: {"day_of_week": [1,2,3,4,5], "time_range": {"start": "08:00", "end": "22:00"}}
    
    -- Rule actions/constraints
    actions JSONB NOT NULL, -- What happens when conditions are met
    -- Example: {"max_capacity": 5000, "requires_approval": true, "additional_cost": 500}
    
    -- Temporal scope
    effective_start_date DATE DEFAULT CURRENT_DATE,
    effective_end_date DATE,
    
    -- Override and exception handling
    allows_override BOOLEAN DEFAULT FALSE,
    override_approval_required BOOLEAN DEFAULT TRUE,
    override_cost_multiplier DECIMAL(4,2) DEFAULT 1.5,
    
    -- Conflict resolution
    conflicts_with_rules JSONB DEFAULT '[]', -- Array of rule_ids that conflict
    resolution_priority INTEGER DEFAULT 3 CHECK (resolution_priority BETWEEN 1 AND 5),
    
    -- Application scope
    applies_to_sports JSONB DEFAULT '[]', -- Empty array = all sports
    applies_to_event_types JSONB DEFAULT '[]', -- ["game", "practice", "tournament"]
    applies_to_user_types JSONB DEFAULT '[]', -- ["home_team", "visiting_team", "conference"]
    
    -- Notification and communication
    requires_advance_notice_days INTEGER DEFAULT 0,
    notification_required BOOLEAN DEFAULT FALSE,
    notification_contacts JSONB DEFAULT '[]',
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Venue Equipment Inventory - Equipment available at venues
CREATE TABLE venue_equipment_inventory (
    inventory_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Equipment details
    equipment_name VARCHAR(100) NOT NULL,
    equipment_category VARCHAR(30) NOT NULL CHECK (equipment_category IN (
        'playing_surface', 'goals_nets', 'timing_scoring', 'audio_visual',
        'lighting', 'safety', 'maintenance', 'broadcasting', 'seating',
        'concessions', 'transportation', 'communication'
    )),
    equipment_type VARCHAR(50) NOT NULL,
    
    -- Inventory tracking
    quantity_available INTEGER NOT NULL DEFAULT 1,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_in_maintenance INTEGER DEFAULT 0,
    
    -- Equipment specifications
    specifications JSONB, -- Technical specs, dimensions, capabilities
    manufacturer VARCHAR(50),
    model_number VARCHAR(50),
    serial_numbers JSONB DEFAULT '[]',
    
    -- Condition and maintenance
    condition_rating INTEGER DEFAULT 3 CHECK (condition_rating BETWEEN 1 AND 5),
    last_maintenance_date DATE,
    next_maintenance_due_date DATE,
    maintenance_frequency_months INTEGER DEFAULT 6,
    
    -- Usage and scheduling
    requires_setup BOOLEAN DEFAULT FALSE,
    setup_time_minutes INTEGER DEFAULT 0,
    breakdown_time_minutes INTEGER DEFAULT 0,
    requires_trained_operator BOOLEAN DEFAULT FALSE,
    
    -- Availability and booking
    bookable_separately BOOLEAN DEFAULT FALSE,
    included_with_venue BOOLEAN DEFAULT TRUE,
    rental_cost_per_use DECIMAL(8,2) DEFAULT 0.00,
    deposit_required DECIMAL(8,2) DEFAULT 0.00,
    
    -- Safety and compliance
    safety_certifications JSONB DEFAULT '[]',
    inspection_due_date DATE,
    safety_requirements JSONB,
    
    -- Usage restrictions
    restricted_to_sports JSONB DEFAULT '[]', -- Empty = available for all sports
    restricted_to_events JSONB DEFAULT '[]',
    max_usage_hours_per_day INTEGER,
    
    -- Replacement and lifecycle
    purchase_date DATE,
    expected_lifespan_years INTEGER,
    replacement_cost DECIMAL(10,2),
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Venue Capacity Configurations - Different capacity setups
CREATE TABLE venue_capacity_configurations (
    config_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Configuration details
    configuration_name VARCHAR(100) NOT NULL,
    configuration_type VARCHAR(30) NOT NULL CHECK (configuration_type IN (
        'standard', 'reduced', 'enhanced', 'tournament', 'broadcast', 
        'special_event', 'graduation', 'concert', 'multi_sport'
    )),
    
    -- Capacity breakdown
    total_capacity INTEGER NOT NULL,
    general_admission_capacity INTEGER DEFAULT 0,
    reserved_seating_capacity INTEGER DEFAULT 0,
    premium_seating_capacity INTEGER DEFAULT 0,
    student_section_capacity INTEGER DEFAULT 0,
    visiting_team_allocation INTEGER DEFAULT 0,
    media_seating_capacity INTEGER DEFAULT 0,
    official_seating_capacity INTEGER DEFAULT 0,
    
    -- Special accommodations
    ada_accessible_capacity INTEGER DEFAULT 0,
    wheelchair_accessible_spots INTEGER DEFAULT 0,
    companion_seating_spots INTEGER DEFAULT 0,
    
    -- Field/court impact
    reduces_playing_area BOOLEAN DEFAULT FALSE,
    playing_area_adjustments JSONB,
    
    -- Setup requirements
    setup_time_hours DECIMAL(4,2) NOT NULL DEFAULT 2.0,
    breakdown_time_hours DECIMAL(4,2) NOT NULL DEFAULT 1.0,
    additional_staff_required INTEGER DEFAULT 0,
    additional_equipment_needed JSONB DEFAULT '[]',
    
    -- Cost implications
    setup_cost DECIMAL(8,2) DEFAULT 0.00,
    additional_security_cost DECIMAL(8,2) DEFAULT 0.00,
    additional_staffing_cost DECIMAL(8,2) DEFAULT 0.00,
    
    -- Usage patterns
    typically_used_for_events JSONB DEFAULT '[]',
    seasonal_usage BOOLEAN DEFAULT FALSE,
    advance_notice_required_days INTEGER DEFAULT 7,
    
    -- Approval and restrictions
    requires_approval BOOLEAN DEFAULT FALSE,
    approval_authority VARCHAR(100),
    usage_restrictions JSONB,
    
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(venue_id, configuration_name)
);

-- 8. Venue Maintenance Schedules - Planned maintenance activities
CREATE TABLE venue_maintenance_schedules (
    maintenance_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Maintenance details
    maintenance_type VARCHAR(30) NOT NULL CHECK (maintenance_type IN (
        'routine_cleaning', 'deep_cleaning', 'field_maintenance', 'equipment_service',
        'hvac_service', 'electrical_inspection', 'plumbing_service', 'safety_inspection',
        'surface_treatment', 'painting', 'structural_inspection', 'technology_update'
    )),
    maintenance_description TEXT NOT NULL,
    
    -- Scheduling
    scheduled_start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_datetime TIMESTAMP WITH TIME ZONE,
    actual_end_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Recurrence
    recurring BOOLEAN DEFAULT FALSE,
    recurrence_pattern VARCHAR(20) CHECK (
        recurrence_pattern IN ('weekly', 'monthly', 'quarterly', 'semi_annually', 'annually')
    ),
    next_scheduled_date TIMESTAMP WITH TIME ZONE,
    
    -- Impact on venue availability
    venue_unavailable_during_maintenance BOOLEAN DEFAULT TRUE,
    partial_venue_availability BOOLEAN DEFAULT FALSE,
    affected_areas JSONB DEFAULT '[]',
    
    -- Resource requirements
    contractor_company VARCHAR(100),
    contractor_contact JSONB,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    
    -- Materials and equipment
    materials_needed JSONB DEFAULT '[]',
    equipment_needed JSONB DEFAULT '[]',
    
    -- Coordination and communication
    requires_venue_coordination BOOLEAN DEFAULT TRUE,
    requires_event_rescheduling BOOLEAN DEFAULT FALSE,
    advance_notice_days INTEGER DEFAULT 14,
    
    -- Quality and completion
    completion_status VARCHAR(20) DEFAULT 'scheduled' CHECK (
        completion_status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'rescheduled')
    ),
    quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
    completion_notes TEXT,
    
    -- Follow-up requirements
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    warranty_period_months INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_maintenance_schedule CHECK (scheduled_end_datetime > scheduled_start_datetime)
);

-- 9. Venue Booking Conflicts - Track and resolve scheduling conflicts
CREATE TABLE venue_booking_conflicts (
    conflict_id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE CASCADE,
    
    -- Conflict details
    conflict_type VARCHAR(30) NOT NULL CHECK (conflict_type IN (
        'double_booking', 'maintenance_overlap', 'setup_time_conflict', 
        'capacity_exceeded', 'equipment_unavailable', 'staff_unavailable',
        'weather_related', 'emergency_closure', 'permit_issue'
    )),
    conflict_description TEXT NOT NULL,
    
    -- Time period of conflict
    conflict_start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    conflict_end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Affected bookings/events
    affected_events JSONB NOT NULL, -- Array of event/booking IDs
    primary_event_priority INTEGER DEFAULT 3 CHECK (primary_event_priority BETWEEN 1 AND 5),
    
    -- Resolution details
    resolution_status VARCHAR(20) DEFAULT 'unresolved' CHECK (
        resolution_status IN ('unresolved', 'in_progress', 'resolved', 'escalated')
    ),
    resolution_strategy VARCHAR(30) CHECK (resolution_strategy IN (
        'reschedule_secondary', 'relocate_event', 'modify_setup', 'split_time',
        'cancel_lower_priority', 'find_alternative_venue', 'adjust_capacity'
    )),
    resolution_description TEXT,
    
    -- Impact assessment
    financial_impact DECIMAL(10,2) DEFAULT 0.00,
    attendance_impact INTEGER DEFAULT 0,
    broadcast_impact BOOLEAN DEFAULT FALSE,
    
    -- Stakeholder communication
    stakeholders_notified JSONB DEFAULT '[]',
    notification_sent_datetime TIMESTAMP WITH TIME ZONE,
    requires_external_approval BOOLEAN DEFAULT FALSE,
    
    -- Resolution timeline
    target_resolution_datetime TIMESTAMP WITH TIME ZONE,
    actual_resolution_datetime TIMESTAMP WITH TIME ZONE,
    
    -- Prevention measures
    prevention_recommendations TEXT,
    system_improvements_needed JSONB DEFAULT '[]',
    
    -- Escalation information
    escalated_to VARCHAR(100),
    escalation_reason TEXT,
    escalation_datetime TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT valid_conflict_period CHECK (conflict_end_datetime > conflict_start_datetime)
);

-- Indexes for Performance Optimization

-- Venue Profiles
CREATE INDEX idx_venue_profiles_venue_id ON venue_profiles(venue_id);
CREATE INDEX idx_venue_profiles_venue_type ON venue_profiles(venue_type);
CREATE INDEX idx_venue_profiles_capacity ON venue_profiles(standard_capacity);
CREATE INDEX idx_venue_profiles_available ON venue_profiles(currently_available);

-- Venue Operational Hours
CREATE INDEX idx_venue_operational_hours_venue_dow ON venue_operational_hours(venue_id, day_of_week);
CREATE INDEX idx_venue_operational_hours_effective ON venue_operational_hours(effective_start_date, effective_end_date);

-- Venue Sport Configurations
CREATE INDEX idx_venue_sport_configurations_venue_sport ON venue_sport_configurations(venue_id, sport_id);
CREATE INDEX idx_venue_sport_configurations_primary ON venue_sport_configurations(is_primary_sport);
CREATE INDEX idx_venue_sport_configurations_active ON venue_sport_configurations(active);

-- Venue Unavailability Periods
CREATE INDEX idx_venue_unavailability_periods_venue_time ON venue_unavailability_periods(venue_id, start_datetime, end_datetime);
CREATE INDEX idx_venue_unavailability_periods_type ON venue_unavailability_periods(unavailability_type);
CREATE INDEX idx_venue_unavailability_periods_status ON venue_unavailability_periods(status);

-- Venue Availability Rules
CREATE INDEX idx_venue_availability_rules_venue_type ON venue_availability_rules(venue_id, rule_type);
CREATE INDEX idx_venue_availability_rules_priority ON venue_availability_rules(priority_level);
CREATE INDEX idx_venue_availability_rules_active ON venue_availability_rules(active);
CREATE INDEX idx_venue_availability_rules_effective ON venue_availability_rules(effective_start_date, effective_end_date);

-- Venue Equipment Inventory
CREATE INDEX idx_venue_equipment_inventory_venue_category ON venue_equipment_inventory(venue_id, equipment_category);
CREATE INDEX idx_venue_equipment_inventory_available ON venue_equipment_inventory(quantity_available);
CREATE INDEX idx_venue_equipment_inventory_maintenance ON venue_equipment_inventory(next_maintenance_due_date);

-- Venue Capacity Configurations
CREATE INDEX idx_venue_capacity_configurations_venue_type ON venue_capacity_configurations(venue_id, configuration_type);
CREATE INDEX idx_venue_capacity_configurations_active ON venue_capacity_configurations(active);

-- Venue Maintenance Schedules
CREATE INDEX idx_venue_maintenance_schedules_venue_time ON venue_maintenance_schedules(venue_id, scheduled_start_datetime);
CREATE INDEX idx_venue_maintenance_schedules_type ON venue_maintenance_schedules(maintenance_type);
CREATE INDEX idx_venue_maintenance_schedules_status ON venue_maintenance_schedules(completion_status);
CREATE INDEX idx_venue_maintenance_schedules_recurring ON venue_maintenance_schedules(recurring, next_scheduled_date);

-- Venue Booking Conflicts
CREATE INDEX idx_venue_booking_conflicts_venue_time ON venue_booking_conflicts(venue_id, conflict_start_datetime);
CREATE INDEX idx_venue_booking_conflicts_status ON venue_booking_conflicts(resolution_status);
CREATE INDEX idx_venue_booking_conflicts_type ON venue_booking_conflicts(conflict_type);

-- Functions and Triggers

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_venue_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_venue_profiles_updated_at 
    BEFORE UPDATE ON venue_profiles
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_operational_hours_updated_at 
    BEFORE UPDATE ON venue_operational_hours
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_sport_configurations_updated_at 
    BEFORE UPDATE ON venue_sport_configurations
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_unavailability_periods_updated_at 
    BEFORE UPDATE ON venue_unavailability_periods
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_availability_rules_updated_at 
    BEFORE UPDATE ON venue_availability_rules
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_equipment_inventory_updated_at 
    BEFORE UPDATE ON venue_equipment_inventory
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_capacity_configurations_updated_at 
    BEFORE UPDATE ON venue_capacity_configurations
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_maintenance_schedules_updated_at 
    BEFORE UPDATE ON venue_maintenance_schedules
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

CREATE TRIGGER update_venue_booking_conflicts_updated_at 
    BEFORE UPDATE ON venue_booking_conflicts
    FOR EACH ROW EXECUTE FUNCTION update_venue_management_updated_at();

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_venues_institutions_view()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY venues_institutions_view;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Views for Common Queries

-- View: Venue Availability Summary
CREATE VIEW venue_availability_summary AS
SELECT 
    vp.venue_id,
    vp.venue_name,
    vp.venue_type,
    vp.standard_capacity,
    vp.currently_available,
    vp.seasonal_availability,
    COUNT(DISTINCT vsc.sport_id) AS supported_sports_count,
    COUNT(DISTINCT vup.unavailability_id) AS upcoming_unavailable_periods,
    COUNT(DISTINCT vms.maintenance_id) AS scheduled_maintenance_count
FROM venue_profiles vp
LEFT JOIN venue_sport_configurations vsc ON vp.venue_id = vsc.venue_id AND vsc.active = TRUE
LEFT JOIN venue_unavailability_periods vup ON vp.venue_id = vup.venue_id 
    AND vup.start_datetime >= CURRENT_TIMESTAMP 
    AND vup.start_datetime <= CURRENT_TIMESTAMP + INTERVAL '30 days'
LEFT JOIN venue_maintenance_schedules vms ON vp.venue_id = vms.venue_id 
    AND vms.scheduled_start_datetime >= CURRENT_TIMESTAMP
    AND vms.completion_status = 'scheduled'
GROUP BY vp.venue_id, vp.venue_name, vp.venue_type, vp.standard_capacity, 
         vp.currently_available, vp.seasonal_availability;

-- View: Current Venue Conflicts
CREATE VIEW current_venue_conflicts AS
SELECT 
    vbc.*,
    vp.venue_name,
    vp.venue_type
FROM venue_booking_conflicts vbc
JOIN venue_profiles vp ON vbc.venue_id = vp.venue_id
WHERE vbc.resolution_status IN ('unresolved', 'in_progress')
  AND vbc.conflict_end_datetime >= CURRENT_TIMESTAMP
ORDER BY vbc.conflict_start_datetime;

-- View: Venue Maintenance Calendar
CREATE VIEW venue_maintenance_calendar AS
SELECT 
    vms.venue_id,
    vp.venue_name,
    vms.maintenance_type,
    vms.maintenance_description,
    vms.scheduled_start_datetime,
    vms.scheduled_end_datetime,
    vms.venue_unavailable_during_maintenance,
    vms.completion_status,
    vms.recurring,
    vms.next_scheduled_date
FROM venue_maintenance_schedules vms
JOIN venue_profiles vp ON vms.venue_id = vp.venue_id
WHERE vms.scheduled_start_datetime >= CURRENT_TIMESTAMP - INTERVAL '7 days'
ORDER BY vms.scheduled_start_datetime;

-- Comments for Documentation
COMMENT ON TABLE venue_profiles IS 'Enhanced venue information for microservice-based venue management';
COMMENT ON TABLE venue_operational_hours IS 'Operating hours and availability windows for venues';
COMMENT ON TABLE venue_sport_configurations IS 'Sport-specific configurations and requirements for venues';
COMMENT ON TABLE venue_unavailability_periods IS 'Scheduled periods when venues are unavailable';
COMMENT ON TABLE venue_availability_rules IS 'Complex rules governing venue availability and booking';
COMMENT ON TABLE venue_equipment_inventory IS 'Equipment and resources available at venues';
COMMENT ON TABLE venue_capacity_configurations IS 'Different seating and capacity configurations';
COMMENT ON TABLE venue_maintenance_schedules IS 'Planned maintenance activities and schedules';
COMMENT ON TABLE venue_booking_conflicts IS 'Tracking and resolution of venue scheduling conflicts';

COMMENT ON MATERIALIZED VIEW venues_institutions_view IS 'Denormalized view of venue-institution data for microservice boundary isolation';

-- Row Level Security (RLS) for multi-tenancy
ALTER TABLE venue_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_operational_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_sport_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_unavailability_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_equipment_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_capacity_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE venue_booking_conflicts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (to be customized based on authentication system)
CREATE POLICY venue_profiles_policy ON venue_profiles
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_operational_hours_policy ON venue_operational_hours
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_sport_configurations_policy ON venue_sport_configurations
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_unavailability_periods_policy ON venue_unavailability_periods
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_availability_rules_policy ON venue_availability_rules
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_equipment_inventory_policy ON venue_equipment_inventory
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_capacity_configurations_policy ON venue_capacity_configurations
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_maintenance_schedules_policy ON venue_maintenance_schedules
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));

CREATE POLICY venue_booking_conflicts_policy ON venue_booking_conflicts
    FOR ALL USING (venue_id IN (SELECT venue_id FROM user_venue_access WHERE user_id = current_setting('app.current_user_id')::int));