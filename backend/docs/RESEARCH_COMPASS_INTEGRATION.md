# Research-to-COMPASS Integration System

## Overview

The Research-to-COMPASS Integration system connects the research agent outputs (Perplexity/Gemini services) directly into the COMPASS analytics system, storing results in both local directories and the Neon database.

## Architecture

```
Research Agents → JSON Files → Integration Service → COMPASS Database
     ↓              ↓              ↓                    ↓
Perplexity/    /data/research_    Processing &         compass_team_ratings
Gemini APIs    results/           Parsing              compass_roster_changes
```

## Components

### 1. Integration Service (`services/researchCompassIntegration.js`)
- **Main integration logic** that processes research outputs
- **Extracts COMPASS ratings** from text using regex patterns
- **Stores data** in database tables
- **File monitoring** for automatic processing

### 2. CLI Scripts
- **`scripts/process-research-to-compass.js`** - Main processing script
- **`scripts/test-research-integration.js`** - Integration testing

### 3. API Routes (`routes/research-integration.js`)
- **REST endpoints** for managing integration
- **Status monitoring** and file processing
- **COMPASS ratings retrieval**

## Usage

### Command Line Interface

```bash
# Process all research files once
node scripts/process-research-to-compass.js process

# Watch for new files and process automatically  
node scripts/process-research-to-compass.js watch

# Run integration test
node scripts/process-research-to-compass.js test

# Test the integration system
node scripts/test-research-integration.js
```

### API Endpoints

#### Get Integration Status
```bash
GET /api/research-integration/status
```

#### Process All Research Files
```bash
POST /api/research-integration/process
```

#### Process Specific File
```bash
POST /api/research-integration/process-file
Content-Type: application/json

{
  "filename": "basketball_research_latest.json"
}
```

#### List Available Research Files
```bash
GET /api/research-integration/files
```

#### Get COMPASS Ratings from Database
```bash
GET /api/research-integration/compass-ratings?sport=basketball&team=Kansas
```

## File Structure

### Input Directory: `/data/research_results/`
Research agent outputs are stored here:
- `basketball_research_latest.json`
- `softball_research_latest.json`
- `{sport}_research_{timestamp}.json`

### Output Directory: `/data/compass_processed/`
Processed files are stored here:
- `processed/` - Successfully processed files
- `failed/` - Files that failed processing
- `processing_summary.json` - Processing statistics

### Database Tables

#### `compass_team_ratings`
Stores COMPASS ratings extracted from research:
```sql
rating_id UUID PRIMARY KEY
team_id UUID REFERENCES teams(team_id)
sport VARCHAR NOT NULL
normalized_rating FLOAT (0-1)
raw_rating FLOAT (0-100)
percentile INTEGER
tier VARCHAR
rating_components JSONB
prediction_confidence FLOAT
last_updated TIMESTAMP
```

#### `compass_roster_changes`
Stores roster changes mentioned in research:
```sql
change_id UUID PRIMARY KEY
team_id UUID REFERENCES teams(team_id)
player_name VARCHAR
change_type ENUM('add', 'remove', 'injury', 'return')
player_rating FLOAT (0-1)
impact_score FLOAT
details TEXT
```

## COMPASS Rating Extraction

The system uses intelligent parsing to extract COMPASS ratings from research text:

### Rating Patterns Recognized
- `COMPASS Rating: 96.5`
- `COMPASS: 94.0/100`
- `Overall COMPASS: 89.5`
- `Rating: 87.5/100`

### Component Patterns
- `Competitive Performance (35%): 33/35`
- `Operational Excellence (25%): 25/25`
- `Market Position (20%): 19/20`
- `Performance Trajectory (15%): 15/15`
- `Analytics (5%): 4.5/5`

### Fallback Estimation
If no explicit COMPASS rating is found, the system estimates based on:
- Content quality indicators (championship, tournament, elite)
- Citation count and source quality
- Sport-specific performance indicators

## Integration Flow

1. **File Detection**: Monitor `/data/research_results/` for new JSON files
2. **Sport Identification**: Extract sport from filename or metadata
3. **Team Processing**: Process each team's research data
4. **COMPASS Extraction**: Parse COMPASS ratings using regex patterns
5. **Database Storage**: Store ratings in `compass_team_ratings` table
6. **File Archival**: Move processed files to output directory

## Example Research Data Structure

```json
{
  "research": {
    "Kansas": {
      "history": {
        "content": "Kansas basketball program analysis reveals exceptional performance with a COMPASS Rating: 96.5/100...",
        "citations": ["ESPN", "CBS Sports"],
        "timestamp": "2025-05-29T...",
        "model": "llama-3.1-sonar-large-128k-online"
      },
      "projections": {
        "content": "Kansas 2025-26 projections show continued championship contention...",
        "citations": ["247Sports"],
        "timestamp": "2025-05-29T..."
      }
    }
  },
  "trends": {
    "Kansas": {
      "content": "Historical COMPASS progression shows sustained excellence...",
      "ratingType": "COMPASS Historical and Projected - Basketball"
    }
  },
  "metadata": {
    "sport": "basketball",
    "teams": 16,
    "duration": 120.5,
    "completedAt": "2025-05-29T..."
  }
}
```

## Monitoring and Debugging

### Processing Statistics
```json
{
  "filesProcessed": 5,
  "teamsUpdated": 48,
  "ratingsCreated": 48,
  "errors": []
}
```

### Error Handling
- **File parsing errors** are logged and files moved to `failed/` directory
- **Database errors** are caught and reported with context
- **Missing teams** are automatically created in database
- **Invalid ratings** use fallback estimation

### Logging
- Console logging with emoji prefixes for easy identification
- Detailed error messages with stack traces in development
- Processing time tracking for performance monitoring

## Database Relationships

```sql
-- Teams table (existing)
teams (team_id, name, conference, division, active)

-- COMPASS ratings table
compass_team_ratings (rating_id, team_id, sport, normalized_rating, ...)
  ↓ FOREIGN KEY
teams.team_id

-- Roster changes table  
compass_roster_changes (change_id, team_id, player_name, ...)
  ↓ FOREIGN KEY
teams.team_id
```

## Development Setup

1. **Environment Variables**:
   ```bash
   DATABASE_URL=postgresql://localhost:5432/flextime
   NODE_ENV=development
   ```

2. **Install Dependencies**:
   ```bash
   npm install uuid sequelize
   ```

3. **Initialize Database Tables**:
   ```bash
   # Tables are created automatically via Sequelize models
   node -e "require('./models/db-compass')(sequelize).sync()"
   ```

4. **Run Test**:
   ```bash
   node scripts/test-research-integration.js
   ```

## Production Deployment

### Automated Processing
Set up cron job for regular processing:
```cron
# Process research files every hour
0 * * * * cd /path/to/flextime/backend && node scripts/process-research-to-compass.js process
```

### File Watching
For real-time processing:
```bash
# Run as daemon process
pm2 start scripts/process-research-to-compass.js --name "research-integration" -- watch
```

### API Integration
Add to frontend for manual triggering:
```javascript
// Trigger processing via API
fetch('/api/research-integration/process', { method: 'POST' })
  .then(response => response.json())
  .then(data => console.log('Processing completed:', data));
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check `DATABASE_URL` environment variable
   - Verify Neon database credentials
   - Test connection: `node -e "require('sequelize')(...).authenticate()"`

2. **No Research Files Found**
   - Check `/data/research_results/` directory exists
   - Verify research agents are generating output
   - Check file permissions

3. **COMPASS Ratings Not Extracted**
   - Review text parsing patterns in `parseCompassRatingFromText()`
   - Check research content format
   - Enable fallback estimation

4. **Teams Not Found in Database**
   - Teams are auto-created with default conference "Big 12"
   - Check team name variations and aliases
   - Verify `findOrCreateTeam()` logic

### Performance Optimization

- **Batch Processing**: Process multiple files in parallel
- **Database Indexing**: Ensure proper indexes on `team_id` and `sport`
- **File Watching**: Use efficient file system monitoring
- **Memory Management**: Process large files in chunks

## Future Enhancements

1. **Machine Learning Integration**: Use ML models for better rating extraction
2. **Real-time Updates**: WebSocket integration for live COMPASS updates  
3. **Historical Tracking**: Store rating history over time
4. **Advanced Analytics**: Trend analysis and prediction models
5. **Multi-sport Optimization**: Sport-specific parsing and validation
6. **External Data Sources**: Integration with NET rankings, KenPom, etc.

## Contact and Support

For issues with the integration system:
- Check logs in `/data/compass_processed/processing_summary.json`
- Review API responses for error details
- Test with `scripts/test-research-integration.js`
- Monitor database tables for successful inserts