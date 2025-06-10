-- Team ID Restructure Migration
-- Updated formula: conference_id + school_id + sport_id
-- Format: C (conference) + SSS (school) + PP (sport) = CSSSPP

-- 1. First, add temporary column for new team_id format
ALTER TABLE teams ADD COLUMN new_team_id INTEGER;

-- 2. Update new_team_id with conference-based formula
-- Get conference_id from schools table and combine with existing formula

UPDATE teams 
SET new_team_id = CAST(
    COALESCE(s.conference_id, 0)::text || 
    LPAD(teams.school_id::text, 3, '0') || 
    LPAD(teams.sport_id::text, 2, '0') 
    AS INTEGER
)
FROM schools s 
WHERE teams.school_id = s.school_id;

-- 3. Create mapping table for old to new team_ids for reference
CREATE TABLE team_id_migration_mapping (
    old_team_id INTEGER,
    new_team_id INTEGER,
    school_id INTEGER,
    sport_id INTEGER,
    conference_id INTEGER,
    school_name TEXT,
    sport_name TEXT,
    migration_date TIMESTAMP DEFAULT NOW()
);

-- 4. Populate mapping table
INSERT INTO team_id_migration_mapping (old_team_id, new_team_id, school_id, sport_id, conference_id, school_name, sport_name)
SELECT 
    t.team_id as old_team_id,
    t.new_team_id,
    t.school_id,
    t.sport_id,
    s.conference_id,
    s.school_name,
    sp.sport_name
FROM teams t
JOIN schools s ON t.school_id = s.school_id
JOIN sports sp ON t.sport_id = sp.sport_id;

-- 5. Update all foreign key references

-- Update games table
UPDATE games SET home_team_id = (
    SELECT new_team_id FROM teams WHERE team_id = games.home_team_id
);

UPDATE games SET away_team_id = (
    SELECT new_team_id FROM teams WHERE team_id = games.away_team_id
);

-- Update other tables with team_id references
UPDATE award_recipients SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = award_recipients.team_id
);

UPDATE awards SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = awards.team_id
);

UPDATE conflicts SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = conflicts.team_id
);

UPDATE constraints_new SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = constraints_new.team_id
);

UPDATE schedule_analytics SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = schedule_analytics.team_id
);

UPDATE scheduling_parameters SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = scheduling_parameters.team_id
);

UPDATE team_preferences SET team_id = (
    SELECT new_team_id FROM teams WHERE team_id = team_preferences.team_id
);

-- 6. Drop old team_id and rename new_team_id
ALTER TABLE teams DROP CONSTRAINT teams_pkey;
ALTER TABLE teams DROP COLUMN team_id;
ALTER TABLE teams RENAME COLUMN new_team_id TO team_id;
ALTER TABLE teams ADD CONSTRAINT teams_pkey PRIMARY KEY (team_id);

-- 7. Update team_id generation function for future inserts
CREATE OR REPLACE FUNCTION generate_team_id(conference_id INTEGER, school_id INTEGER, sport_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN CAST(
        COALESCE(conference_id, 0)::text || 
        LPAD(school_id::text, 3, '0') || 
        LPAD(sport_id::text, 2, '0') 
        AS INTEGER
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-generate team_id on insert
CREATE OR REPLACE FUNCTION auto_generate_team_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.team_id IS NULL THEN
        SELECT generate_team_id(s.conference_id, NEW.school_id, NEW.sport_id)
        INTO NEW.team_id
        FROM schools s 
        WHERE s.school_id = NEW.school_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_team_id_trigger
    BEFORE INSERT ON teams
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_team_id();

-- 9. Examples of new team_id format:
-- Big 12 (conference_id = 1):
--   Arizona (school_id = 1) Men's Basketball (sport_id = 2): 1 + 001 + 02 = 100102
--   Kansas (school_id = 10) Football (sport_id = 8): 1 + 010 + 08 = 101008

-- SEC (conference_id = 4):  
--   Alabama (school_id = ?) Men's Basketball (sport_id = 2): 4 + XXX + 02 = 4XXX02
--   Kentucky (school_id = ?) Men's Basketball (sport_id = 2): 4 + XXX + 02 = 4XXX02

-- 10. Update indexes for better performance
DROP INDEX IF EXISTS idx_teams_school_id;
DROP INDEX IF EXISTS idx_teams_sport_id;
DROP INDEX IF EXISTS idx_teams_school_sport;

CREATE INDEX idx_teams_conference_school ON teams(school_id, sport_id);
CREATE INDEX idx_teams_conference ON teams((team_id::text)[1:1]); -- Conference prefix
CREATE INDEX idx_teams_school_sport_new ON teams(school_id, sport_id);

COMMENT ON TABLE team_id_migration_mapping IS 'Mapping table for team_id migration from old format (school_id + sport_id) to new format (conference_id + school_id + sport_id)';
COMMENT ON FUNCTION generate_team_id IS 'Generates new team_id format: conference_id + zero-padded school_id (3 digits) + zero-padded sport_id (2 digits)';