-- Create conferences table
CREATE TABLE conferences (
    conference_id INTEGER PRIMARY KEY,
    conference_name VARCHAR(50) NOT NULL,
    conference_abbreviation VARCHAR(10) NOT NULL UNIQUE,
    founded_year INTEGER,
    website TEXT,
    headquarters_location TEXT,
    commissioner TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert initial conference data
INSERT INTO conferences (conference_id, conference_name, conference_abbreviation, founded_year) VALUES 
(1, 'Big 12 Conference', 'XII', 1994),
(2, 'Atlantic Coast Conference', 'ACC', 1953),
(3, 'Big Ten Conference', 'B1G', 1896),
(4, 'Southeastern Conference', 'SEC', 1932);

-- Add conference_id to schools table
ALTER TABLE schools ADD COLUMN conference_id INTEGER;
ALTER TABLE schools ADD CONSTRAINT fk_schools_conference 
    FOREIGN KEY (conference_id) REFERENCES conferences(conference_id);

-- Create index for performance
CREATE INDEX idx_schools_conference_id ON schools(conference_id);

-- Update trigger for conferences table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conferences_updated_at 
    BEFORE UPDATE ON conferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();