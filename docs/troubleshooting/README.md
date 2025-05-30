# FlexTime Troubleshooting Guide

This comprehensive troubleshooting guide helps you diagnose and resolve common issues with FlexTime. Whether you're experiencing performance problems, API errors, or configuration issues, this guide provides step-by-step solutions.

## 🔍 Quick Problem Resolution

### Most Common Issues (90% of problems)

| Issue | Symptoms | Quick Fix |
|-------|----------|-----------|
| **Schedule Won't Generate** | Stuck at "Generating..." | [Reset constraints](#constraint-issues) |
| **API Connection Error** | 401/403 errors | [Check authentication](#authentication-issues) |
| **Slow Performance** | Long load times | [Clear cache](#performance-issues) |
| **Missing Teams** | Teams not showing up | [Sync team data](#data-sync-issues) |
| **Login Problems** | Can't access system | [Reset credentials](#login-issues) |

### Emergency Quick Fixes

```bash
# System not responding
curl -f http://localhost:3000/health || systemctl restart flextime

# Database connection issues
npm run db:test-connection

# Clear all caches
redis-cli FLUSHALL

# Reset to safe configuration
flextime-admin config reset --confirm
```

## 📚 Troubleshooting Sections

### User Issues
- **[Login and Authentication](./user-issues/login-authentication.md)** - Can't access the system
- **[Schedule Creation Problems](./user-issues/schedule-creation.md)** - Issues creating or modifying schedules
- **[Performance and Speed](./user-issues/performance.md)** - Slow loading or timeouts
- **[Data Export Issues](./user-issues/data-export.md)** - Problems downloading schedules

### System Issues
- **[API and Integration](./system-issues/api-integration.md)** - API errors and external system problems
- **[Database Issues](./system-issues/database.md)** - Database connectivity and performance
- **[Performance Optimization](./system-issues/performance.md)** - System performance troubleshooting
- **[Configuration Problems](./system-issues/configuration.md)** - Settings and configuration issues

### Infrastructure Issues
- **[Deployment Problems](./infrastructure/deployment.md)** - Deployment and container issues
- **[Network and Connectivity](./infrastructure/network.md)** - Network-related problems
- **[Monitoring and Alerts](./infrastructure/monitoring.md)** - Monitoring system issues
- **[Backup and Recovery](./infrastructure/backup-recovery.md)** - Data backup and recovery problems

### Advanced Troubleshooting
- **[Debug Mode](./advanced/debug-mode.md)** - Enabling and using debug features
- **[Log Analysis](./advanced/log-analysis.md)** - Analyzing system logs
- **[Performance Profiling](./advanced/performance-profiling.md)** - Deep performance analysis
- **[Custom Solutions](./advanced/custom-solutions.md)** - Building custom diagnostic tools

## 🚨 Emergency Response

### System Down (Priority 1)

**Symptoms**: System completely inaccessible, health checks failing

**Immediate Actions** (0-5 minutes):
1. **Check System Status**
   ```bash
   # Quick health check
   curl -f https://api.flextime.big12.org/health
   
   # Check container status
   kubectl get pods -n flextime
   
   # Check infrastructure
   aws ecs describe-services --cluster flextime-production
   ```

2. **Identify Scope**
   - Is it affecting all users or specific groups?
   - Are all services down or just specific components?
   - Is the database accessible?

3. **Emergency Recovery**
   ```bash
   # Restart failed services
   kubectl rollout restart deployment/flextime-api
   
   # Scale up if needed
   kubectl scale deployment flextime-api --replicas=5
   
   # Switch to backup database if needed
   flextime-admin failover --to-backup --confirm
   ```

### Performance Degradation (Priority 2)

**Symptoms**: Slow response times, timeouts, high resource usage

**Immediate Actions** (5-15 minutes):
1. **Resource Check**
   ```bash
   # Check resource usage
   kubectl top nodes
   kubectl top pods -n flextime
   
   # Check database performance
   psql -c "SELECT query, state, query_start FROM pg_stat_activity WHERE state = 'active';"
   ```

2. **Scale Resources**
   ```bash
   # Increase replicas
   kubectl scale deployment flextime-api --replicas=8
   
   # Increase resource limits
   kubectl patch deployment flextime-api -p '{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"cpu":"1000m","memory":"2Gi"}}}]}}}}'
   ```

3. **Clear Bottlenecks**
   ```bash
   # Clear Redis cache
   redis-cli FLUSHALL
   
   # Restart slow queries
   psql -c "SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';"
   ```

## 🔧 Common Problem Categories

### Authentication Issues

#### Problem: "Invalid credentials" or 401 errors
**Symptoms**: 
- Login page shows "Invalid username or password"
- API calls return 401 Unauthorized
- Users randomly logged out

**Diagnostic Steps**:
```bash
# Check JWT token validity
jwt-decode "your-token-here"

# Verify user exists in database
psql -c "SELECT id, email, active FROM users WHERE email = 'user@example.com';"

# Check authentication service logs
kubectl logs deployment/auth-service | grep ERROR
```

**Solutions**:
1. **Password Reset**
   ```bash
   flextime-admin users reset-password --email "user@example.com"
   ```

2. **Token Refresh**
   ```javascript
   // Force token refresh
   localStorage.removeItem('flextime_token');
   window.location.reload();
   ```

3. **Check System Clock**
   ```bash
   # Ensure system time is correct
   date
   ntpdate -q pool.ntp.org
   ```

#### Problem: "Access denied" or 403 errors
**Symptoms**:
- User can login but can't access certain features
- API returns 403 Forbidden
- Missing menu items or buttons

**Diagnostic Steps**:
```bash
# Check user permissions
psql -c "SELECT u.email, r.name, p.permission FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id JOIN role_permissions rp ON r.id = rp.role_id JOIN permissions p ON rp.permission_id = p.id WHERE u.email = 'user@example.com';"

# Verify role assignments
flextime-admin users show --email "user@example.com" --include-permissions
```

**Solutions**:
1. **Update User Role**
   ```bash
   flextime-admin users assign-role --email "user@example.com" --role "sport_admin"
   ```

2. **Grant Specific Permission**
   ```bash
   flextime-admin users grant-permission --email "user@example.com" --permission "schedule:write"
   ```

### Schedule Generation Issues

#### Problem: Schedule generation fails or gets stuck
**Symptoms**:
- Status shows "Generating..." indefinitely
- Error: "Optimization failed to converge"
- Empty schedule returned

**Diagnostic Steps**:
```bash
# Check optimization service logs
kubectl logs deployment/optimization-service | tail -100

# Check for constraint conflicts
psql -c "SELECT id, type, parameters FROM constraints WHERE schedule_id = 'sched_123' AND active = true;"

# Monitor resource usage during generation
top -p $(pgrep -f "optimization-worker")
```

**Solutions**:
1. **Reset and Retry**
   ```bash
   # Cancel current generation
   flextime-admin schedules cancel --id "sched_123"
   
   # Clear optimization cache
   redis-cli DEL "opt:sched_123:*"
   
   # Retry generation
   flextime-admin schedules generate --id "sched_123" --force
   ```

2. **Simplify Constraints**
   ```bash
   # Temporarily disable problematic constraints
   flextime-admin constraints disable --schedule-id "sched_123" --type "travel_distance"
   
   # Generate with relaxed constraints
   flextime-admin schedules generate --id "sched_123" --relax-constraints
   ```

3. **Check Team Data**
   ```bash
   # Verify all teams have valid venues
   psql -c "SELECT t.id, t.name, v.id as venue_id FROM teams t LEFT JOIN venues v ON t.home_venue = v.id WHERE v.id IS NULL;"
   ```

#### Problem: Poor schedule quality or optimization scores
**Symptoms**:
- Optimization score below 0.8
- Excessive travel distances
- Unbalanced home/away games

**Diagnostic Steps**:
```bash
# Analyze schedule metrics
flextime-admin schedules analyze --id "sched_123" --verbose

# Check constraint satisfaction
psql -c "SELECT type, COUNT(*) as violations FROM constraint_violations WHERE schedule_id = 'sched_123' GROUP BY type;"

# Review optimization parameters
flextime-admin schedules show-config --id "sched_123"
```

**Solutions**:
1. **Adjust Optimization Goals**
   ```bash
   # Rebalance optimization priorities
   flextime-admin schedules set-goals --id "sched_123" \
     --travel-weight 0.9 \
     --balance-weight 0.8 \
     --constraint-weight 1.0
   ```

2. **Add Missing Constraints**
   ```bash
   # Add home/away balance constraint
   flextime-admin constraints add --schedule-id "sched_123" \
     --type "home_away_balance" \
     --parameters '{"tolerance": 0.1}'
   ```

3. **Optimize in Stages**
   ```bash
   # First pass: basic generation
   flextime-admin schedules generate --id "sched_123" --fast
   
   # Second pass: optimization
   flextime-admin schedules optimize --id "sched_123" --iterations 1000
   ```

### Database Issues

#### Problem: Database connection failures
**Symptoms**:
- "ECONNREFUSED" errors
- "Connection timeout" messages
- 500 Internal Server Error responses

**Diagnostic Steps**:
```bash
# Test database connectivity
pg_isready -h postgres-host -p 5432 -U flextime

# Check connection pool status
psql -c "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# Monitor active connections
psql -c "SELECT count(*) as connections, max_connections FROM pg_stat_activity, (SELECT setting::int as max_connections FROM pg_settings WHERE name = 'max_connections') s;"
```

**Solutions**:
1. **Restart Database Connection Pool**
   ```bash
   # Restart API services to reset connections
   kubectl rollout restart deployment/flextime-api
   
   # Or reset connection pool programmatically
   curl -X POST "http://localhost:3000/admin/db/reset-pool" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

2. **Increase Connection Limits**
   ```sql
   -- Increase max connections (requires restart)
   ALTER SYSTEM SET max_connections = 200;
   SELECT pg_reload_conf();
   ```

3. **Optimize Connection Pool**
   ```javascript
   // Update connection pool configuration
   const poolConfig = {
     max: 20,           // maximum pool size
     min: 5,            // minimum pool size
     idle: 10000,       // close idle connections after 10s
     acquireTimeout: 60000, // max time to get connection
     createTimeout: 30000,  // max time to create connection
   };
   ```

#### Problem: Slow database queries
**Symptoms**:
- API responses taking > 5 seconds
- High CPU usage on database server
- Query timeouts

**Diagnostic Steps**:
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats 
WHERE schemaname = 'public' 
ORDER BY n_distinct DESC;

-- Monitor lock waits
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

**Solutions**:
1. **Add Missing Indexes**
   ```sql
   -- Common indexes for FlexTime
   CREATE INDEX CONCURRENTLY idx_games_schedule_date ON games(schedule_id, game_date);
   CREATE INDEX CONCURRENTLY idx_teams_conference ON teams(conference);
   CREATE INDEX CONCURRENTLY idx_constraints_active ON constraints(schedule_id) WHERE active = true;
   ```

2. **Update Table Statistics**
   ```sql
   -- Update query planner statistics
   ANALYZE;
   
   -- Vacuum and analyze specific tables
   VACUUM ANALYZE games;
   VACUUM ANALYZE schedules;
   ```

3. **Optimize Queries**
   ```sql
   -- Example query optimization
   -- Before: Full table scan
   SELECT * FROM games WHERE schedule_id = 'sched_123' AND game_date > '2025-01-01';
   
   -- After: Use composite index
   CREATE INDEX idx_games_schedule_date ON games(schedule_id, game_date);
   ```

### Performance Issues

#### Problem: High API response times
**Symptoms**:
- API calls taking > 2 seconds
- Frontend feels sluggish
- Timeout errors

**Diagnostic Steps**:
```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/schedules"

# Monitor resource usage
top -p $(pgrep -f "node.*flextime")

# Check for memory leaks
node --inspect=9229 index.js
```

**Response time format file (curl-format.txt)**:
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

**Solutions**:
1. **Enable Response Caching**
   ```javascript
   // Add Redis caching middleware
   const cache = require('redis-cache-middleware');
   
   app.use('/api/schedules', cache({
     ttl: 300, // 5 minutes
     key: (req) => `schedules:${req.user.id}:${req.query.sport}`
   }));
   ```

2. **Optimize Database Queries**
   ```javascript
   // Use query optimization
   const schedules = await Schedule.findAll({
     include: [{
       model: Game,
       required: false,
       limit: 100
     }],
     order: [['created_at', 'DESC']],
     limit: 20
   });
   ```

3. **Implement Pagination**
   ```javascript
   // Add pagination to large result sets
   app.get('/api/schedules', async (req, res) => {
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 20;
     const offset = (page - 1) * limit;
     
     const schedules = await Schedule.findAndCountAll({
       limit,
       offset,
       order: [['created_at', 'DESC']]
     });
     
     res.json({
       data: schedules.rows,
       pagination: {
         page,
         limit,
         total: schedules.count,
         pages: Math.ceil(schedules.count / limit)
       }
     });
   });
   ```

### Integration Issues

#### Problem: External API failures
**Symptoms**:
- Notion sync not working
- Calendar export failures
- Travel distance calculation errors

**Diagnostic Steps**:
```bash
# Test external API connectivity
curl -f "https://api.notion.com/v1/users" \
  -H "Authorization: Bearer $NOTION_TOKEN" \
  -H "Notion-Version: 2022-06-28"

# Check API rate limits
curl -I "https://api.calendly.com/users/me" \
  -H "Authorization: Bearer $CALENDLY_TOKEN"

# Monitor integration logs
kubectl logs deployment/integration-service | grep ERROR
```

**Solutions**:
1. **API Token Refresh**
   ```bash
   # Refresh expired tokens
   flextime-admin integrations refresh-token --service "notion"
   
   # Verify token validity
   flextime-admin integrations test-connection --service "notion"
   ```

2. **Implement Retry Logic**
   ```javascript
   // Add exponential backoff retry
   const retry = require('async-retry');
   
   await retry(async () => {
     const response = await notionClient.databases.query({
       database_id: process.env.NOTION_DATABASE_ID
     });
     return response;
   }, {
     retries: 3,
     factor: 2,
     minTimeout: 1000,
     maxTimeout: 5000
   });
   ```

3. **Add Circuit Breaker**
   ```javascript
   // Implement circuit breaker pattern
   const CircuitBreaker = require('opossum');
   
   const options = {
     timeout: 3000,
     errorThresholdPercentage: 50,
     resetTimeout: 30000
   };
   
   const breaker = new CircuitBreaker(callExternalAPI, options);
   ```

## 🛠️ Diagnostic Tools

### System Health Check Script

```bash
#!/bin/bash
# flextime-health-check.sh

echo "FlexTime System Health Check"
echo "=========================="

# Check API health
echo "1. API Health:"
api_health=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$api_health" = "200" ]; then
    echo "   ✅ API is healthy"
else
    echo "   ❌ API is unhealthy (HTTP $api_health)"
fi

# Check database connectivity
echo "2. Database:"
if pg_isready -h localhost -p 5432 -U flextime > /dev/null 2>&1; then
    echo "   ✅ Database is accessible"
else
    echo "   ❌ Database is not accessible"
fi

# Check Redis
echo "3. Cache (Redis):"
if redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis is responding"
else
    echo "   ❌ Redis is not responding"
fi

# Check disk space
echo "4. Disk Space:"
disk_usage=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$disk_usage" -lt 85 ]; then
    echo "   ✅ Disk usage: ${disk_usage}%"
else
    echo "   ⚠️  Disk usage high: ${disk_usage}%"
fi

# Check memory usage
echo "5. Memory Usage:"
memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
if [ "$(echo "$memory_usage < 85" | bc)" = "1" ]; then
    echo "   ✅ Memory usage: ${memory_usage}%"
else
    echo "   ⚠️  Memory usage high: ${memory_usage}%"
fi

echo "=========================="
echo "Health check completed."
```

### Log Analysis Script

```bash
#!/bin/bash
# analyze-logs.sh

LOG_FILE=${1:-/var/log/flextime/app.log}
TIME_RANGE=${2:-"1 hour ago"}

echo "FlexTime Log Analysis"
echo "==================="
echo "Log file: $LOG_FILE"
echo "Time range: Since $TIME_RANGE"
echo

# Error summary
echo "Error Summary:"
echo "--------------"
grep -i error "$LOG_FILE" | \
  awk -v since="$(date -d "$TIME_RANGE" +%s)" '
    $1 >= since { print $0 }' | \
  grep -o '"level":"[^"]*"' | \
  sort | uniq -c | sort -nr

echo

# Response time analysis
echo "Response Time Analysis:"
echo "----------------------"
grep "response_time" "$LOG_FILE" | \
  awk -v since="$(date -d "$TIME_RANGE" +%s)" '
    $1 >= since { 
      match($0, /"response_time":([0-9]+)/, arr)
      if (arr[1] > 1000) slow++
      else if (arr[1] > 500) medium++
      else fast++
      total++
    } 
    END {
      print "Fast (<500ms): " fast " (" int(fast/total*100) "%)"
      print "Medium (500-1000ms): " medium " (" int(medium/total*100) "%)"
      print "Slow (>1000ms): " slow " (" int(slow/total*100) "%)"
    }'

echo

# Top error messages
echo "Top Error Messages:"
echo "------------------"
grep -i error "$LOG_FILE" | \
  awk -v since="$(date -d "$TIME_RANGE" +%s)" '
    $1 >= since { print $0 }' | \
  grep -o '"message":"[^"]*"' | \
  sort | uniq -c | sort -nr | head -5
```

### Performance Monitoring Script

```bash
#!/bin/bash
# monitor-performance.sh

DURATION=${1:-60}  # Monitor for 60 seconds by default

echo "FlexTime Performance Monitor"
echo "==========================="
echo "Monitoring for $DURATION seconds..."

# Function to get API response time
get_api_response_time() {
    curl -w "%{time_total}" -o /dev/null -s http://localhost:3000/health
}

# Function to get system metrics
get_system_metrics() {
    echo "$(date '+%H:%M:%S'),$(get_api_response_time),$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}'),$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
}

# Header
echo "Time,API Response (s),Memory %,CPU %"

# Monitor loop
for i in $(seq 1 $DURATION); do
    get_system_metrics
    sleep 1
done | tee performance-$(date +%Y%m%d-%H%M%S).csv

echo
echo "Performance monitoring completed."
echo "Data saved to performance-$(date +%Y%m%d-%H%M%S).csv"
```

## 📞 Getting Help

### Support Escalation

#### Level 1: Self-Service
- Check this troubleshooting guide
- Review system logs
- Try common fixes
- Check system status page

#### Level 2: Community Support
- **Community Forum**: https://community.flextime.big12.org
- **Stack Overflow**: Tag questions with `flextime`
- **GitHub Issues**: For bug reports

#### Level 3: Technical Support
- **Email**: support@flextime.big12.org
- **Response Time**: 4 hours during business hours
- **Include**: Error messages, logs, steps to reproduce

#### Level 4: Emergency Support
- **Phone**: +1-555-FLEXTIME (24/7)
- **Emergency Email**: emergency@flextime.big12.org
- **For**: System outages, security incidents, data loss

### What to Include in Support Requests

1. **System Information**
   ```bash
   # Gather system info
   flextime-admin system info > system-info.txt
   ```

2. **Error Logs**
   ```bash
   # Collect relevant logs
   kubectl logs deployment/flextime-api --since=1h > api-logs.txt
   ```

3. **Reproduction Steps**
   - What you were trying to do
   - What you expected to happen
   - What actually happened
   - Steps to reproduce the issue

4. **Environment Details**
   - FlexTime version
   - Deployment type (cloud, on-premises, docker)
   - Browser version (for web issues)
   - Time of occurrence

---

*This troubleshooting guide is continuously updated based on user feedback and new issues discovered.*

*Last updated: May 29, 2025*
*Troubleshooting Guide Version: 2.0*