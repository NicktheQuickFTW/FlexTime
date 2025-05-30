#!/usr/bin/env node

/**
 * Update School Branding Script
 * 
 * Updates FlexTime's school branding data from the official Big 12 CSV
 * and syncs with the Neon database schools table
 */

const fs = require('fs').promises;
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('../config/neon_db_config');

class SchoolBrandingUpdater {
  constructor() {
    this.csvPath = '/Users/nickw/Documents/XII-Ops/Big 12 School Branding Info 2025.csv';
    this.schools = [];
    this.sequelize = null;
  }

  async initialize() {
    this.sequelize = new Sequelize(config.connectionString, {
      dialectOptions: config.connection.dialectOptions,
      logging: false
    });
    
    await this.sequelize.authenticate();
    console.log('✅ Connected to Neon HELiiX database');
  }

  async updateSchoolBranding() {
    console.log('🎨 Starting School Branding Update');
    console.log('=' * 50);
    
    // Read and parse CSV
    await this.readCSVData();
    
    // Update Neon database
    await this.updateNeonDatabase();
    
    // Create/update FlexTime constants
    await this.updateFlexTimeConstants();
    
    // Generate summary
    await this.generateSummary();
    
    console.log('\n✅ School branding update completed!');
  }

  async readCSVData() {
    console.log('📖 Reading Big 12 branding CSV...');
    
    const csvContent = await fs.readFile(this.csvPath, 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length === headers.length) {
        const school = this.createSchoolObject(headers, values);
        this.schools.push(school);
      }
    }
    
    console.log(`📋 Parsed ${this.schools.length} schools from CSV`);
  }

  parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current.trim());
    return values;
  }

  createSchoolObject(headers, values) {
    const school = {};
    
    headers.forEach((header, index) => {
      const key = this.normalizeKey(header);
      school[key] = values[index] || '';
    });
    
    // Normalize data based on actual CSV header mappings
    const headerMap = {
      'officialuniversityname': 'officialUniversityName',
      'prefferedname': 'preferredName', 
      'schoolabbreviations': 'schoolAbbreviations',
      'unapprovednames': 'unapprovedNames',
      'mascot': 'mascot',
      'mascotnames': 'mascotNames',
      'primarycolorcodes': 'primaryColorCodes',
      'secondarycolorcodes': 'secondaryColorCodes',
      'tertiarycolorcodes': 'tertiaryColorCodes',
      'officialhashtags': 'officialHashtags'
    };
    
    // Create normalized school object
    const normalizedSchool = {};
    for (const [key, value] of Object.entries(school)) {
      const normalizedKey = headerMap[key] || key;
      normalizedSchool[normalizedKey] = value;
    }
    
    normalizedSchool.displayName = (normalizedSchool.preferredName || normalizedSchool.officialUniversityName).replace(/^The /, '');
    normalizedSchool.hashtags = normalizedSchool.officialHashtags ? normalizedSchool.officialHashtags.split(';').map(h => h.trim()) : [];
    
    // Parse colors using the raw school object (before normalization)
    normalizedSchool.parsedColors = this.parseColors(school);
    
    return normalizedSchool;
  }

  normalizeKey(header) {
    return header
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .replace(/preffered/g, 'preferred'); // Fix typo in CSV
  }

  parseColors(school) {
    const colors = {
      primary: this.extractHexColor(school.primarycolorcodes),
      secondary: this.extractHexColor(school.secondarycolorcodes),
      tertiary: this.extractHexColor(school.tertiarycolorcodes)
    };
    
    return colors;
  }

  extractHexColor(colorString) {
    if (!colorString) return null;
    
    // Look for HEX color
    const hexMatch = colorString.match(/#([A-Fa-f0-9]{6})/);
    if (hexMatch) return hexMatch[0];
    
    // Look for RGB and convert to HEX
    const rgbMatch = colorString.match(/RGB:\s*(\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1]);
      const g = parseInt(rgbMatch[2]);
      const b = parseInt(rgbMatch[3]);
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    }
    
    return null;
  }

  async updateNeonDatabase() {
    console.log('\n🗄️ Updating Neon database schools table...');
    
    for (const school of this.schools) {
      try {
        // Find existing school record using preferred name for BYU, UCF, TCU
        const searchName = school.preferredName || school.displayName;
        
        // Special handling for schools stored by preferred names
        let searchTerms = [`%${searchName}%`];
        if (school.preferredName) {
          searchTerms.push(`%${school.preferredName}%`);
        }
        if (school.schoolAbbreviations) {
          searchTerms.push(...school.schoolAbbreviations.split(',').map(s => `%${s.trim()}%`));
        }
        const [existingSchools] = await this.sequelize.query(`
          SELECT school_id, school, short_display FROM schools 
          WHERE conference_id = 1 
          AND (LOWER(school) LIKE LOWER($1) 
             OR LOWER(short_display) LIKE LOWER($2)
             OR LOWER(schedule_display) LIKE LOWER($3)
             OR LOWER(school) = LOWER($4)
             OR LOWER(short_display) = LOWER($5)
             OR LOWER(school) = LOWER($6)
             OR LOWER(short_display) = LOWER($7))
          LIMIT 1
        `, { 
          bind: [
            `%${searchName}%`, 
            `%${searchName}%`, 
            `%${searchName}%`,
            school.preferredName || '', 
            school.preferredName || '',
            school.schoolAbbreviations || '',
            school.schoolAbbreviations || ''
          ] 
        });

        if (existingSchools.length > 0) {
          const schoolId = existingSchools[0].school_id;
          
          // First, add preferred_school_name column if it doesn't exist
          try {
            await this.sequelize.query(`
              ALTER TABLE schools ADD COLUMN IF NOT EXISTS preferred_school_name VARCHAR(255)
            `);
          } catch (error) {
            // Column might already exist, continue
          }

          // Update school record (mapping CSV to correct database columns)
          // CSV 'Official University Name' -> DB 'school' (full name)
          // CSV 'Preffered Name' or 'Display Name' -> DB 'short_display', 'schedule_display', 'preferred_school_name' (short name)
          await this.sequelize.query(`
            UPDATE schools SET
              school = $1,
              short_display = $2,
              schedule_display = $3,
              preferred_school_name = $4,
              primary_color = $5,
              secondary_color = $6,
              mascot = $7,
              school_abbreviation = $8,
              updated_at = NOW()
            WHERE school_id = $9
          `, {
            bind: [
              school.officialUniversityName, // Full university name for 'school' column
              school.preferredName || school.displayName.replace(/^The /, ''), // Short name for short_display
              school.preferredName || school.displayName.replace(/^The /, ''), // Short name for schedule_display
              school.preferredName || school.displayName.replace(/^The /, ''), // Short name for preferred_school_name
              school.parsedColors.primary,
              school.parsedColors.secondary,
              school.mascot,
              school.schoolAbbreviations,
              schoolId
            ]
          });
          
          console.log(`✅ Updated: ${school.displayName} (ID: ${schoolId})`);
        } else {
          console.warn(`⚠️ School not found in database: ${school.displayName}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${school.displayName}:`, error.message);
      }
    }
  }

  async updateFlexTimeConstants() {
    console.log('\n📝 Creating FlexTime school constants...');
    
    // Create JavaScript constants file
    const jsConstants = this.generateJSConstants();
    const jsPath = path.join(__dirname, '../constants/schoolBranding.js');
    await fs.writeFile(jsPath, jsConstants);
    console.log(`✅ Created: ${jsPath}`);
    
    // Create JSON file for frontend
    const jsonData = this.generateJSONData();
    const jsonPath = path.join(__dirname, '../../frontend/src/constants/schoolBranding.json');
    await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Created: ${jsonPath}`);
    
    // Create TypeScript definitions
    const tsDefinitions = this.generateTSDefinitions();
    const tsPath = path.join(__dirname, '../../frontend/src/types/schoolBranding.ts');
    await fs.writeFile(tsPath, tsDefinitions);
    console.log(`✅ Created: ${tsPath}`);
  }

  generateJSConstants() {
    return `/**
 * Big 12 School Branding Constants
 * Generated from official Big 12 branding CSV
 * Last updated: ${new Date().toISOString()}
 */

const BIG12_SCHOOLS = {
${this.schools.map(school => this.generateSchoolConstant(school)).join(',\n\n')}
};

const SCHOOL_LOOKUP = {
${this.schools.map(school => `  '${school.displayName.toLowerCase()}': BIG12_SCHOOLS.${this.getSchoolKey(school)}`).join(',\n')}
};

const SCHOOL_COLORS = {
${this.schools.map(school => this.generateColorConstant(school)).join(',\n')}
};

module.exports = {
  BIG12_SCHOOLS,
  SCHOOL_LOOKUP,
  SCHOOL_COLORS,
  getSchoolByName: (name) => SCHOOL_LOOKUP[name.toLowerCase()],
  getSchoolColors: (name) => SCHOOL_COLORS[name.toLowerCase()]
};`;
  }

  generateSchoolConstant(school) {
    const key = this.getSchoolKey(school);
    const escapeQuotes = (str) => str ? str.replace(/'/g, "\\'") : '';
    
    return `  ${key}: {
    officialName: '${escapeQuotes(school.officialUniversityName)}',
    displayName: '${escapeQuotes(school.displayName)}',
    abbreviations: '${escapeQuotes(school.schoolAbbreviations)}',
    mascot: '${escapeQuotes(school.mascot)}',
    mascotNames: '${escapeQuotes(school.mascotNames || '')}',
    colors: {
      primary: '${school.parsedColors.primary || ''}',
      secondary: '${school.parsedColors.secondary || ''}',
      tertiary: '${school.parsedColors.tertiary || ''}'
    },
    hashtags: [${school.hashtags.map(h => `'${escapeQuotes(h)}'`).join(', ')}],
    unapprovedNames: '${escapeQuotes(school.unapprovedNames || '')}'
  }`;
  }

  generateColorConstant(school) {
    return `  '${school.displayName.toLowerCase()}': {
    primary: '${school.parsedColors.primary || '#000000'}',
    secondary: '${school.parsedColors.secondary || '#FFFFFF'}',
    tertiary: '${school.parsedColors.tertiary || ''}'
  }`;
  }

  getSchoolKey(school) {
    return school.displayName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  generateJSONData() {
    return {
      schools: this.schools.map(school => ({
        officialName: school.officialUniversityName,
        displayName: school.displayName,
        abbreviations: school.schoolAbbreviations.split(',').map(a => a.trim()),
        mascot: school.mascot,
        mascotNames: school.mascotNames ? school.mascotNames.split('&').map(n => n.trim()) : [],
        colors: school.parsedColors,
        hashtags: school.hashtags,
        unapprovedNames: school.unapprovedNames ? school.unapprovedNames.split(';').map(n => n.trim()) : []
      })),
      lastUpdated: new Date().toISOString(),
      source: 'Big 12 School Branding Info 2025.csv'
    };
  }

  generateTSDefinitions() {
    return `/**
 * Big 12 School Branding Type Definitions
 * Generated from official Big 12 branding CSV
 */

export interface SchoolColors {
  primary: string;
  secondary: string;
  tertiary?: string;
}

export interface School {
  officialName: string;
  displayName: string;
  abbreviations: string[];
  mascot: string;
  mascotNames: string[];
  colors: SchoolColors;
  hashtags: string[];
  unapprovedNames: string[];
}

export interface SchoolBrandingData {
  schools: School[];
  lastUpdated: string;
  source: string;
}

export const BIG12_SCHOOL_NAMES = [
${this.schools.map(school => `  '${school.displayName}'`).join(',\n')}
] as const;

export type Big12SchoolName = typeof BIG12_SCHOOL_NAMES[number];
`;
  }

  async generateSummary() {
    console.log('\n📊 UPDATE SUMMARY:');
    console.log(`   🏫 Schools Processed: ${this.schools.length}`);
    
    // Check database updates
    const [updatedSchools] = await this.sequelize.query(`
      SELECT school_id, short_display, primary_color, secondary_color, mascot
      FROM schools 
      WHERE school_id BETWEEN 1 AND 16 
      AND primary_color IS NOT NULL
      ORDER BY school_id
    `);
    
    console.log(`   ✅ Database Records Updated: ${updatedSchools.length}`);
    console.log('\n🎨 Updated Schools:');
    
    updatedSchools.forEach(school => {
      console.log(`   - ${school.short_display}: ${school.primary_color} / ${school.secondary_color} (${school.mascot})`);
    });
    
    console.log('\n📁 Files Created:');
    console.log('   - /backend/constants/schoolBranding.js');
    console.log('   - /frontend/src/constants/schoolBranding.json');
    console.log('   - /frontend/src/types/schoolBranding.ts');
    
    await this.sequelize.close();
  }
}

async function main() {
  const updater = new SchoolBrandingUpdater();
  await updater.initialize();
  await updater.updateSchoolBranding();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = SchoolBrandingUpdater;