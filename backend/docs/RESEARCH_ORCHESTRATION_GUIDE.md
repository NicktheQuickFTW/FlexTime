# Research Orchestration System Guide

## Overview

The FlexTime Research Orchestration System is an automated, intelligent research pipeline that uses Perplexity AI to continuously gather, validate, and store data about Big 12 teams. The system respects data retention policies to maintain permanent historical records while cleaning temporary operational data.

## Architecture

### Core Components

1. **Research Scheduler** - Manages automated scheduling with sport-specific frequencies
2. **Validation Agent** - Ensures data quality and consistency
3. **Orchestration Hub** - Central coordination and database integration
4. **Feedback Agent** - Monitors performance and optimizes the system
5. **Retention Policy Manager** - Manages permanent vs temporary data

### Data Flow

```
Perplexity API → Research Agent → Validation → Database Storage → Retention Management
                                      ↓                              ↓
                                  Feedback Loop              Archive/Clean
```

## Scheduling Strategy

### Priority Sports (Daily Updates)
- **Football (FB) & Men's Basketball (MBB)**
  - Transfer Portal: Daily at 6 AM
  - Recruiting: Daily at 5 AM
  - Comprehensive Research: Daily at 2 AM
  - High priority due to rapid changes and media attention

### Other Sports (Monday/Wednesday Updates)
- **Women's Basketball (WBB), Baseball (BSB), Softball (SB), Women's Soccer (WSOC), Wrestling (WRES), Women's Volleyball (WVB), Men's Tennis (MTN), Women's Tennis (WTN)**
  - Transfer Portal: Monday & Wednesday at 7 AM
  - Recruiting: Monday & Wednesday at 6 AM
  - Comprehensive Research: Monday & Wednesday at 2 AM
  - Bi-weekly updates for these sports
  - Note: Some sports data may need to be sourced from X (Twitter) for real-time updates

### System-Wide Updates
- **COMPASS Ratings**: Tuesday & Friday at 3 AM (all sports)
- **Data Maintenance**: Daily at 4 AM
- **Note**: Sports not listed above do not receive automated research updates

## Data Retention Policies

### Permanent Data (Never Deleted)
- `comprehensive_research_data` - Historical research snapshots
- `transfer_portal_activity` - Transfer history
- `coaching_changes` - Coaching change history
- `facility_investments` - Infrastructure investments
- `nil_program_tracking` - NIL program evolution
- `performance_benchmarks` - Historical performance

### Semi-Permanent Data (2-5 Years)
- `research_job_history` - 2 years (then archived)
- `research_conflicts` - 3 years (then archived)
- `research_feedback_adjustments` - 5 years (then archived)

### Temporary Data (7-90 Days)
- `research_validations` - 30 days
- `research_errors` - 90 days (unless unresolved)
- `research_api_usage` - 7 days
- `research_performance_metrics` - 30 days

### Special Rules
- Unresolved errors kept indefinitely
- Championship/tournament data extended retention
- Data linked to major decisions preserved
- Archive before delete for semi-permanent data

## Usage Guide

### Starting the System

```bash
# 1. Ensure Redis is running
docker run -d -p 6379:6379 redis:alpine

# 2. Run setup script
./scripts/setup-research-orchestration.js

# 3. Start orchestration
./scripts/research-orchestration-cli.js start
```

### CLI Commands

#### System Control
```bash
# Start automated scheduling
./scripts/research-orchestration-cli.js start

# Stop system
./scripts/research-orchestration-cli.js stop

# Check status
./scripts/research-orchestration-cli.js status

# Monitor in real-time
./scripts/research-orchestration-cli.js monitor
```

#### Manual Research
```bash
# Schedule immediate comprehensive research
./scripts/research-orchestration-cli.js schedule comprehensive -s football mens_basketball womens_basketball

# Schedule transfer portal check
./scripts/research-orchestration-cli.js schedule transfer_portal -s mens_basketball -p 1

# Trigger event-based research
./scripts/research-orchestration-cli.js trigger coaching_change -s football -t "Texas Tech"
```

#### Data Management
```bash
# View retention policies
./scripts/research-orchestration-cli.js retention-policy

# Perform maintenance (respects retention policies)
./scripts/research-orchestration-cli.js maintenance

# Clear temporary data older than 30 days
./scripts/research-orchestration-cli.js clear -o 30 --table research_validations --yes

# View research history
./scripts/research-orchestration-cli.js history -s basketball -l 50
```

### API Endpoints

#### Control Endpoints
- `GET /api/research-orchestration/status` - System status
- `POST /api/research-orchestration/start` - Start automation
- `POST /api/research-orchestration/stop` - Stop automation
- `POST /api/research-orchestration/schedule` - Schedule immediate research
- `POST /api/research-orchestration/trigger-event` - Trigger event-based research

#### Data Endpoints
- `GET /api/research-orchestration/history` - View research history
- `DELETE /api/research-orchestration/clear` - Clear data (respects policies)
- `GET /api/research-orchestration/retention-policy` - View retention policies
- `POST /api/research-orchestration/maintenance` - Perform maintenance

#### Monitoring
- `GET /api/research-orchestration/feedback/insights` - System insights
- `WS /api/research-orchestration/monitor` - Real-time monitoring

## Event Triggers

The system responds to these events:

### transfer_portal_update
```javascript
POST /api/research-orchestration/trigger-event
{
  "event": "transfer_portal_update",
  "data": {
    "sport": "mens_basketball",
    "team": "Kansas",
    "player": "John Doe",
    "previousSchool": "Duke"
  }
}
```

### coaching_change
```javascript
{
  "event": "coaching_change",
  "data": {
    "sport": "football",
    "team": "Texas Tech",
    "position": "Head Coach",
    "name": "Joey McGuire"
  }
}
```

### game_completed
```javascript
{
  "event": "game_completed",
  "data": {
    "sport": "womens_basketball",
    "homeTeam": "Kansas",
    "awayTeam": "Baylor",
    "gameId": "12345"
  }
}
```

### recruiting_update
```javascript
{
  "event": "recruiting_update",
  "data": {
    "sport": "football",
    "team": "Oklahoma State",
    "prospect": "5-star QB",
    "commitment": true
  }
}
```

## Monitoring & Alerts

### Health Monitoring
The system continuously monitors:
- Research success rates
- API usage and rate limits
- Data validation failures
- System performance metrics

### Automatic Adjustments
The feedback agent automatically:
- Adjusts confidence thresholds based on accuracy
- Modifies API frequency for rate-limited patterns
- Optimizes scheduling based on success patterns
- Suggests query improvements

### Alert Conditions
- Research failure rate > 10%
- API rate limits approached
- Unresolved errors > 24 hours old
- Data staleness detected

## Best Practices

### 1. Regular Monitoring
- Check status daily
- Review feedback insights weekly
- Monitor API usage to stay within limits

### 2. Data Quality
- Review validation warnings
- Resolve conflicts promptly
- Verify COMPASS ratings accuracy

### 3. Performance Optimization
- Run maintenance during low-activity hours
- Archive old data before deletion
- Monitor job queue depth

### 4. Event Management
- Trigger events promptly after real-world changes
- Use appropriate priority levels
- Batch related updates when possible

## Troubleshooting

### Common Issues

#### High Failure Rate
1. Check API rate limits
2. Review error logs
3. Verify network connectivity
4. Check for API changes

#### Data Inconsistencies
1. Run validation report
2. Check for conflicting sources
3. Review confidence scores
4. Manually verify questionable data

#### Performance Issues
1. Check Redis connection
2. Monitor job queue size
3. Review database indexes
4. Check for long-running queries

### Recovery Procedures

#### System Crash Recovery
```bash
# 1. Restart Redis
docker restart redis

# 2. Check database connection
psql $DATABASE_URL -c "SELECT 1"

# 3. Restart orchestration
./scripts/research-orchestration-cli.js start

# 4. Verify status
./scripts/research-orchestration-cli.js status
```

#### Data Recovery
```bash
# View archived data
SELECT * FROM v_all_research_job_history WHERE team_name = 'Kansas';

# Restore from archive if needed
INSERT INTO research_job_history SELECT * FROM research_job_history_archive WHERE condition;
```

## Database Queries

### Useful Queries

```sql
-- Get team research history
SELECT * FROM get_team_research_history(
  (SELECT team_id FROM teams WHERE school_id = 10 AND sport_id = 2)
);

-- Daily research summary
SELECT * FROM v_daily_research_summary 
WHERE research_date >= CURRENT_DATE - INTERVAL '7 days';

-- Error trends
SELECT * FROM v_research_error_trends;

-- API usage summary
SELECT * FROM v_api_usage_summary;
```

## Future Enhancements

1. **Multi-Source Integration**
   - Add ESPN API integration
   - Include official conference data feeds
   - Social media sentiment analysis

2. **Advanced Analytics**
   - Predictive modeling for transfers
   - Recruiting success probability
   - Performance trend analysis

3. **Expanded Automation**
   - Auto-generate reports
   - Email/Slack notifications
   - Dashboard visualizations

4. **Enhanced Intelligence**
   - Natural language queries
   - Anomaly detection
   - Cross-sport correlations