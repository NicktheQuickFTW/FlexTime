# FlexTime Data Directory

This directory contains all data files, schemas, seed data, and analytical results for the FlexTime scheduling platform.

## 📁 Directory Structure

### **Schemas (`/schemas/`)**
Database schema definitions and migration files:
- `big12-venues-schema.sql` - Complete Big 12 venue database with all sports (SSVV ID pattern)
- `ml-workflow-migrations.sql` - ML workflow tables aligned with FlexTime schema patterns

### **Seed Data (`/seed/`)**
Initial and reference data for populating databases:
- `big12-football-venues.sql` - Big 12 football stadiums seed data

### **Research Results (`/research_results/`)**
COMPASS analysis and research outputs for various sports:
- `basketball_research_latest.json` - Latest basketball research data
- `softball_research_latest.json` - Latest softball research data
- Summer 2025 football analysis and data files

### **Integrated Analysis (`/integrated_analysis/`)**
Combined research and analysis results:
- Integrated contacts and sports analysis
- Analysis summaries with timestamps

### **Analytics (`/analytics/`)**
Business intelligence and performance analytics:
- Dashboards, metrics, reports, and warehouse schemas

### **Processing (`/processing/`)**
Data processing pipelines and ETL operations:
- Constraint processing, transformers, validators

### **ML Pipeline (`/ml-pipeline/`)**
Machine learning model training and deployment:
- Feature engineering, models, training data

### **Ingestion (`/ingestion/`)**
Data ingestion from external sources:
- Big 12 API connectors, batch processing, streaming

### **Exports (`/exports/`)**
Data export functionality and formats:
- APIs, schedulers, templates, distribution

### **Backup (`/backup/`)**
Data backup and recovery systems:
- Automation, policies, recovery strategies

## 🔑 **Schema Alignment Summary**

All database schemas now follow FlexTime's standardized patterns:

### **ID Patterns**
- **Team IDs**: `school_id + zero-padded sport_id` (e.g., 108 = Arizona Football)
- **Venue IDs**: `school_id + venue_type` (e.g., 0101 = Arizona Football Stadium)

### **Entity References**
- Uses `school_id` instead of `institution_id` throughout
- References `sports(sport_id)` instead of `sport_type` strings
- Follows `teams(team_id)` and `venues(venue_id)` foreign key patterns

### **Big 12 School Mappings**
| School | ID | Football Team | Stadium ID |
|--------|----|---------------|------------|
| Arizona | 1 | 108 | 0101 |
| Arizona State | 2 | 208 | 0201 |
| Baylor | 3 | 308 | 0301 |
| BYU | 4 | 408 | 0401 |
| UCF | 5 | 508 | 0501 |
| Cincinnati | 6 | 608 | 0601 |
| Colorado | 7 | 708 | 0701 |
| Houston | 8 | 808 | 0801 |
| Iowa State | 9 | 908 | 0901 |
| Kansas | 10 | 1008 | 1001 |
| Kansas State | 11 | 1108 | 1101 |
| Oklahoma State | 12 | 1208 | 1201 |
| TCU | 13 | 1308 | 1301 |
| Texas Tech | 14 | 1408 | 1401 |
| Utah | 15 | 1508 | 1501 |
| West Virginia | 16 | 1608 | 1601 |

### **Venue Type Reference**
- **01** = Football Stadium 🏈
- **02** = Arena/Gymnasium 🏀 (Basketball, Gymnastics)
- **03** = Baseball Complex ⚾
- **04** = Softball Complex 🥎
- **05** = Soccer Field ⚽
- **06** = Volleyball Facility 🏐
- **07** = Tennis Complex 🎾
- **08** = Track & Field 🏃
- **09** = Swimming Pool 🏊
- **10** = Golf Course ⛳

## 📋 **Recent Updates**

### **May 30, 2025 - Schema Alignment Completion**
1. **Venue Schema Migration**: Moved comprehensive Big 12 venue schema from `/backend/src/ai/` to `/data/schemas/`
2. **ML Migrations Update**: Enhanced ML workflow migrations with FlexTime schema alignment
3. **Data Organization**: Established proper directory structure for schemas, seed data, and reference files
4. **ID Pattern Standardization**: All schemas now use consistent school_id + venue_type patterns

### **Files Relocated**
- `backend/src/ai/big12-venues-schema.sql` → `data/schemas/big12-venues-schema.sql`
- `backend/src/ai/add-football-venues.sql.bak` → `data/seed/big12-football-venues.sql`
- `backend/src/ai/migrations.sql` → `data/schemas/ml-workflow-migrations.sql` (updated)

---

## 🔗 **Related Documentation**

- **Database Schemas Reference**: `/docs/DATABASE_SCHEMAS.md`
- **FlexTime Playbook**: `/FlexTime_Playbook.md`
- **Migration Guide**: `/migration/database-schema/docs/migration-guide.md`

---

*Last Updated: May 30, 2025*  
*Schema Version: 2.0 - FlexTime Aligned*