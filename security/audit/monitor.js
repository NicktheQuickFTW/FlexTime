/**
 * Security Monitoring Service
 * Real-time security monitoring and threat detection
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class SecurityMonitor extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableBehavioralAnalysis: config.enableBehavioralAnalysis !== false,
            enableAnomalyDetection: config.enableAnomalyDetection !== false,
            enableThreatIntelligence: config.enableThreatIntelligence !== false,
            monitoringInterval: config.monitoringInterval || 60000, // 1 minute
            anomalyThreshold: config.anomalyThreshold || 0.8,
            maxUserSessions: config.maxUserSessions || 5,
            maxLoginAttempts: config.maxLoginAttempts || 5,
            suspiciousIPThreshold: config.suspiciousIPThreshold || 10,
            ...config
        };

        // Monitoring data
        this.userBehavior = new Map();
        this.ipReputation = new Map();
        this.activeThreats = new Map();
        this.sessionTracking = new Map();
        this.loginAttempts = new Map();
        this.anomalies = new Map();
        
        // Threat patterns
        this.threatPatterns = new Map();
        this.initializeThreatPatterns();
        
        // Monitoring metrics
        this.metrics = {
            eventsProcessed: 0,
            threatsDetected: 0,
            anomaliesFound: 0,
            alertsTriggered: 0,
            lastAnalysisTime: null
        };

        this.startMonitoring();
    }

    /**
     * Initialize threat detection patterns
     */
    initializeThreatPatterns() {
        // Brute force patterns
        this.threatPatterns.set('brute_force', {
            name: 'Brute Force Attack',
            pattern: (events) => {
                const failedLogins = events.filter(e => 
                    e.type === 'failed_login' && 
                    Date.now() - e.timestamp < 5 * 60 * 1000 // 5 minutes
                );
                return failedLogins.length >= this.config.maxLoginAttempts;
            },
            severity: 'high',
            response: 'block_ip'
        });

        // SQL injection patterns
        this.threatPatterns.set('sql_injection', {
            name: 'SQL Injection Attempt',
            pattern: (events) => {
                const sqlPatterns = [
                    /union\s+select/i,
                    /or\s+1\s*=\s*1/i,
                    /drop\s+table/i,
                    /insert\s+into/i,
                    /delete\s+from/i
                ];
                
                return events.some(e => 
                    e.details.query && 
                    sqlPatterns.some(pattern => pattern.test(e.details.query))
                );
            },
            severity: 'critical',
            response: 'block_request'
        });

        // Privilege escalation
        this.threatPatterns.set('privilege_escalation', {
            name: 'Privilege Escalation Attempt',
            pattern: (events) => {
                const escalationEvents = events.filter(e => 
                    e.type === 'role_assignment' || 
                    e.type === 'permission_change'
                );
                
                // Check for rapid privilege changes
                return escalationEvents.length > 3 && 
                       escalationEvents[escalationEvents.length - 1].timestamp - 
                       escalationEvents[0].timestamp < 10 * 60 * 1000; // 10 minutes
            },
            severity: 'high',
            response: 'alert_admin'
        });

        // Data exfiltration
        this.threatPatterns.set('data_exfiltration', {
            name: 'Data Exfiltration Attempt',
            pattern: (events) => {
                const dataAccess = events.filter(e => 
                    e.type === 'data_access' || e.type === 'export'
                );
                
                // Large amount of data accessed in short time
                const totalSize = dataAccess.reduce((sum, e) => 
                    sum + (e.details.size || 0), 0
                );
                
                return totalSize > 100 * 1024 * 1024 && // 100MB
                       dataAccess.length > 10;
            },
            severity: 'critical',
            response: 'block_user'
        });

        // Suspicious login patterns
        this.threatPatterns.set('suspicious_login', {
            name: 'Suspicious Login Pattern',
            pattern: (events) => {
                const logins = events.filter(e => e.type === 'login');
                const uniqueIPs = new Set(logins.map(e => e.ip));
                const uniqueLocations = new Set(logins.map(e => e.details.location));
                
                // Multiple IPs or impossible travel
                return uniqueIPs.size > 3 || uniqueLocations.size > 2;
            },
            severity: 'medium',
            response: 'require_mfa'
        });
    }

    /**
     * Start monitoring
     */
    startMonitoring() {
        this.monitoringTimer = setInterval(() => {
            this.performSecurityAnalysis();
        }, this.config.monitoringInterval);

        console.log('[MONITOR] Security monitoring started');
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        console.log('[MONITOR] Security monitoring stopped');
    }

    /**
     * Process security event
     */
    async processSecurityEvent(event) {
        this.metrics.eventsProcessed++;

        // Update user behavior profile
        if (event.user) {
            this.updateUserBehavior(event);
        }

        // Update IP reputation
        if (event.ip) {
            this.updateIPReputation(event);
        }

        // Track user sessions
        this.trackUserSession(event);

        // Track login attempts
        this.trackLoginAttempts(event);

        // Perform real-time threat detection
        await this.detectThreats(event);

        // Perform anomaly detection
        if (this.config.enableAnomalyDetection) {
            this.detectAnomalies(event);
        }
    }

    /**
     * Update user behavior profile
     */
    updateUserBehavior(event) {
        const userId = event.user;
        
        if (!this.userBehavior.has(userId)) {
            this.userBehavior.set(userId, {
                userId,
                firstSeen: event.timestamp,
                lastSeen: event.timestamp,
                eventCount: 0,
                eventTypes: new Map(),
                ipAddresses: new Set(),
                userAgents: new Set(),
                loginTimes: [],
                locations: new Set(),
                riskScore: 0
            });
        }

        const profile = this.userBehavior.get(userId);
        profile.lastSeen = event.timestamp;
        profile.eventCount++;

        // Track event types
        const eventType = event.type;
        profile.eventTypes.set(eventType, (profile.eventTypes.get(eventType) || 0) + 1);

        // Track IP addresses
        if (event.ip) {
            profile.ipAddresses.add(event.ip);
        }

        // Track user agents
        if (event.userAgent) {
            profile.userAgents.add(event.userAgent);
        }

        // Track login times for pattern analysis
        if (event.type === 'login') {
            profile.loginTimes.push(event.timestamp);
            // Keep only last 50 logins
            if (profile.loginTimes.length > 50) {
                profile.loginTimes.shift();
            }
        }

        // Track locations
        if (event.details.location) {
            profile.locations.add(event.details.location);
        }

        // Update risk score
        profile.riskScore = this.calculateUserRiskScore(profile);
    }

    /**
     * Calculate user risk score
     */
    calculateUserRiskScore(profile) {
        let riskScore = 0;

        // Multiple IP addresses increase risk
        if (profile.ipAddresses.size > 5) {
            riskScore += 0.3;
        }

        // Multiple user agents increase risk
        if (profile.userAgents.size > 3) {
            riskScore += 0.2;
        }

        // Multiple locations increase risk
        if (profile.locations.size > 2) {
            riskScore += 0.4;
        }

        // Failed login attempts increase risk
        const failedLogins = profile.eventTypes.get('failed_login') || 0;
        if (failedLogins > 0) {
            riskScore += Math.min(failedLogins * 0.1, 0.5);
        }

        // Off-hours login patterns
        const offHoursLogins = profile.loginTimes.filter(time => {
            const hour = new Date(time).getHours();
            return hour < 6 || hour > 22; // Outside 6 AM - 10 PM
        }).length;

        if (offHoursLogins > profile.loginTimes.length * 0.5) {
            riskScore += 0.3;
        }

        return Math.min(riskScore, 1.0);
    }

    /**
     * Update IP reputation
     */
    updateIPReputation(event) {
        const ip = event.ip;
        
        if (!this.ipReputation.has(ip)) {
            this.ipReputation.set(ip, {
                ip,
                firstSeen: event.timestamp,
                lastSeen: event.timestamp,
                eventCount: 0,
                failedLogins: 0,
                users: new Set(),
                countries: new Set(),
                riskScore: 0,
                blocked: false
            });
        }

        const reputation = this.ipReputation.get(ip);
        reputation.lastSeen = event.timestamp;
        reputation.eventCount++;

        if (event.user) {
            reputation.users.add(event.user);
        }

        if (event.details.country) {
            reputation.countries.add(event.details.country);
        }

        if (event.type === 'failed_login') {
            reputation.failedLogins++;
        }

        // Calculate risk score
        reputation.riskScore = this.calculateIPRiskScore(reputation);

        // Auto-block high-risk IPs
        if (reputation.riskScore > 0.8 && !reputation.blocked) {
            this.blockIP(ip, 'High risk score');
        }
    }

    /**
     * Calculate IP risk score
     */
    calculateIPRiskScore(reputation) {
        let riskScore = 0;

        // High failure rate
        if (reputation.eventCount > 0) {
            const failureRate = reputation.failedLogins / reputation.eventCount;
            riskScore += failureRate * 0.6;
        }

        // Multiple users from same IP (potential bot/proxy)
        if (reputation.users.size > 10) {
            riskScore += 0.4;
        }

        // High volume of events
        if (reputation.eventCount > this.config.suspiciousIPThreshold) {
            riskScore += 0.3;
        }

        return Math.min(riskScore, 1.0);
    }

    /**
     * Track user sessions
     */
    trackUserSession(event) {
        if (event.type === 'login' && event.session) {
            const userId = event.user;
            
            if (!this.sessionTracking.has(userId)) {
                this.sessionTracking.set(userId, new Set());
            }

            const userSessions = this.sessionTracking.get(userId);
            userSessions.add(event.session);

            // Check for too many concurrent sessions
            if (userSessions.size > this.config.maxUserSessions) {
                this.triggerAlert('excessive_sessions', {
                    userId,
                    sessionCount: userSessions.size,
                    maxAllowed: this.config.maxUserSessions
                }, 'medium');
            }
        }

        if (event.type === 'logout' && event.session) {
            const userId = event.user;
            const userSessions = this.sessionTracking.get(userId);
            if (userSessions) {
                userSessions.delete(event.session);
            }
        }
    }

    /**
     * Track login attempts
     */
    trackLoginAttempts(event) {
        if (event.type === 'failed_login') {
            const key = event.ip || event.user || 'unknown';
            const timeWindow = 5 * 60 * 1000; // 5 minutes
            
            if (!this.loginAttempts.has(key)) {
                this.loginAttempts.set(key, []);
            }

            const attempts = this.loginAttempts.get(key);
            attempts.push(event.timestamp);

            // Remove old attempts outside time window
            const cutoff = Date.now() - timeWindow;
            this.loginAttempts.set(key, 
                attempts.filter(timestamp => timestamp > cutoff)
            );

            // Check if threshold exceeded
            if (attempts.length >= this.config.maxLoginAttempts) {
                this.triggerAlert('brute_force_detected', {
                    target: key,
                    attempts: attempts.length,
                    timeWindow: timeWindow / 1000
                }, 'high');
            }
        }

        if (event.type === 'login') {
            // Clear failed attempts on successful login
            const key = event.ip || event.user || 'unknown';
            this.loginAttempts.delete(key);
        }
    }

    /**
     * Detect threats using pattern matching
     */
    async detectThreats(event) {
        // Get recent events for context
        const recentEvents = this.getRecentEventsForContext(event);
        recentEvents.push(event);

        // Check each threat pattern
        for (const [patternId, pattern] of this.threatPatterns.entries()) {
            try {
                if (pattern.pattern(recentEvents)) {
                    await this.handleThreatDetection(patternId, pattern, event, recentEvents);
                }
            } catch (error) {
                console.error(`[MONITOR] Error checking pattern ${patternId}:`, error);
            }
        }
    }

    /**
     * Get recent events for threat context
     */
    getRecentEventsForContext(currentEvent) {
        // This would typically query the audit logger
        // For now, return empty array - should be integrated with SecurityAuditLogger
        return [];
    }

    /**
     * Handle threat detection
     */
    async handleThreatDetection(patternId, pattern, triggerEvent, context) {
        const threatId = crypto.randomUUID();
        const threat = {
            id: threatId,
            pattern: patternId,
            name: pattern.name,
            severity: pattern.severity,
            triggerEvent,
            context: context.slice(-10), // Last 10 events for context
            detectedAt: Date.now(),
            response: pattern.response,
            mitigated: false
        };

        this.activeThreats.set(threatId, threat);
        this.metrics.threatsDetected++;

        // Execute response
        await this.executeThreatResponse(threat);

        // Trigger alert
        this.triggerAlert('threat_detected', threat, pattern.severity);

        console.warn(`[MONITOR] THREAT DETECTED: ${pattern.name}`, {
            threatId,
            severity: pattern.severity,
            triggerEvent: triggerEvent.type
        });
    }

    /**
     * Execute threat response
     */
    async executeThreatResponse(threat) {
        switch (threat.response) {
            case 'block_ip':
                if (threat.triggerEvent.ip) {
                    this.blockIP(threat.triggerEvent.ip, `Threat detected: ${threat.name}`);
                }
                break;

            case 'block_user':
                if (threat.triggerEvent.user) {
                    this.blockUser(threat.triggerEvent.user, `Threat detected: ${threat.name}`);
                }
                break;

            case 'require_mfa':
                if (threat.triggerEvent.user) {
                    this.requireMFA(threat.triggerEvent.user, `Threat detected: ${threat.name}`);
                }
                break;

            case 'alert_admin':
                this.alertAdministrators(threat);
                break;

            case 'block_request':
                // Would block the specific request type
                console.log(`[MONITOR] Would block request type: ${threat.triggerEvent.type}`);
                break;
        }

        threat.mitigated = true;
        threat.mitigatedAt = Date.now();
    }

    /**
     * Detect anomalies using statistical analysis
     */
    detectAnomalies(event) {
        if (!this.config.enableAnomalyDetection) {
            return;
        }

        // Check user behavior anomalies
        if (event.user) {
            const profile = this.userBehavior.get(event.user);
            if (profile && this.isUserBehaviorAnomalous(event, profile)) {
                this.recordAnomaly('user_behavior', event, profile);
            }
        }

        // Check temporal anomalies
        if (this.isTemporalAnomalous(event)) {
            this.recordAnomaly('temporal', event);
        }

        // Check geographic anomalies
        if (event.details.location && this.isGeographicAnomalous(event)) {
            this.recordAnomaly('geographic', event);
        }
    }

    /**
     * Check if user behavior is anomalous
     */
    isUserBehaviorAnomalous(event, profile) {
        // Check if event type is unusual for this user
        const eventType = event.type;
        const typeFrequency = profile.eventTypes.get(eventType) || 0;
        const totalEvents = profile.eventCount;
        
        if (totalEvents > 20 && typeFrequency / totalEvents < 0.05) {
            return true; // Very rare event type for this user
        }

        // Check if IP is new
        if (event.ip && !profile.ipAddresses.has(event.ip) && profile.ipAddresses.size > 0) {
            return true; // New IP address
        }

        // Check if time is unusual
        const hour = new Date(event.timestamp).getHours();
        const usualHours = profile.loginTimes.map(t => new Date(t).getHours());
        const hourFrequency = usualHours.filter(h => h === hour).length;
        
        if (usualHours.length > 10 && hourFrequency === 0) {
            return true; // Unusual time
        }

        return false;
    }

    /**
     * Check if event is temporally anomalous
     */
    isTemporalAnomalous(event) {
        // Check if this is an unusual time for system activity
        const hour = new Date(event.timestamp).getHours();
        const dayOfWeek = new Date(event.timestamp).getDay();
        
        // Suspicious: Activity on Sunday between 2-5 AM
        if (dayOfWeek === 0 && hour >= 2 && hour <= 5) {
            return true;
        }

        return false;
    }

    /**
     * Check if event is geographically anomalous
     */
    isGeographicAnomalous(event) {
        if (!event.user || !event.details.location) {
            return false;
        }

        const profile = this.userBehavior.get(event.user);
        if (!profile || profile.locations.size === 0) {
            return false;
        }

        // Check if location is completely new
        if (!profile.locations.has(event.details.location)) {
            return true;
        }

        return false;
    }

    /**
     * Record anomaly
     */
    recordAnomaly(type, event, context = null) {
        const anomalyId = crypto.randomUUID();
        const anomaly = {
            id: anomalyId,
            type,
            event,
            context,
            detectedAt: Date.now(),
            score: this.calculateAnomalyScore(type, event, context)
        };

        this.anomalies.set(anomalyId, anomaly);
        this.metrics.anomaliesFound++;

        if (anomaly.score >= this.config.anomalyThreshold) {
            this.triggerAlert('anomaly_detected', anomaly, 'medium');
        }

        console.log(`[MONITOR] Anomaly detected: ${type} (score: ${anomaly.score})`);
    }

    /**
     * Calculate anomaly score
     */
    calculateAnomalyScore(type, event, context) {
        let score = 0.5; // Base score

        switch (type) {
            case 'user_behavior':
                if (context && context.riskScore) {
                    score += context.riskScore * 0.4;
                }
                break;

            case 'temporal':
                score += 0.3; // Temporal anomalies are moderately suspicious
                break;

            case 'geographic':
                score += 0.4; // Geographic anomalies are quite suspicious
                break;
        }

        return Math.min(score, 1.0);
    }

    /**
     * Block IP address
     */
    blockIP(ip, reason) {
        const reputation = this.ipReputation.get(ip);
        if (reputation) {
            reputation.blocked = true;
            reputation.blockedAt = Date.now();
            reputation.blockReason = reason;
        }

        console.log(`[MONITOR] Blocked IP ${ip}: ${reason}`);
        this.emit('ipBlocked', { ip, reason, timestamp: Date.now() });
    }

    /**
     * Block user
     */
    blockUser(userId, reason) {
        console.log(`[MONITOR] Blocked user ${userId}: ${reason}`);
        this.emit('userBlocked', { userId, reason, timestamp: Date.now() });
    }

    /**
     * Require MFA for user
     */
    requireMFA(userId, reason) {
        console.log(`[MONITOR] Requiring MFA for user ${userId}: ${reason}`);
        this.emit('mfaRequired', { userId, reason, timestamp: Date.now() });
    }

    /**
     * Alert administrators
     */
    alertAdministrators(threat) {
        console.log(`[MONITOR] ADMIN ALERT: ${threat.name}`, threat);
        this.emit('adminAlert', threat);
    }

    /**
     * Trigger security alert
     */
    triggerAlert(alertType, data, severity = 'info') {
        const alert = {
            id: crypto.randomUUID(),
            type: alertType,
            severity,
            data,
            timestamp: Date.now()
        };

        this.metrics.alertsTriggered++;

        this.emit('securityAlert', alert);
        this.emit(alertType, alert);

        console.log(`[MONITOR] ALERT [${severity.toUpperCase()}]: ${alertType}`, data);
    }

    /**
     * Perform comprehensive security analysis
     */
    performSecurityAnalysis() {
        this.metrics.lastAnalysisTime = Date.now();

        // Analyze user risk scores
        this.analyzeUserRiskScores();

        // Analyze IP reputation
        this.analyzeIPReputation();

        // Check for threat patterns
        this.checkForThreatPatterns();

        // Clean up old data
        this.cleanupOldData();
    }

    /**
     * Analyze user risk scores
     */
    analyzeUserRiskScores() {
        let highRiskUsers = 0;
        
        for (const [userId, profile] of this.userBehavior.entries()) {
            if (profile.riskScore > 0.7) {
                highRiskUsers++;
                
                this.triggerAlert('high_risk_user', {
                    userId,
                    riskScore: profile.riskScore,
                    factors: this.getRiskFactors(profile)
                }, 'medium');
            }
        }

        if (highRiskUsers > 0) {
            console.log(`[MONITOR] Found ${highRiskUsers} high-risk users`);
        }
    }

    /**
     * Get risk factors for user
     */
    getRiskFactors(profile) {
        const factors = [];

        if (profile.ipAddresses.size > 5) {
            factors.push('multiple_ips');
        }

        if (profile.userAgents.size > 3) {
            factors.push('multiple_user_agents');
        }

        if (profile.locations.size > 2) {
            factors.push('multiple_locations');
        }

        const failedLogins = profile.eventTypes.get('failed_login') || 0;
        if (failedLogins > 0) {
            factors.push('failed_logins');
        }

        return factors;
    }

    /**
     * Analyze IP reputation
     */
    analyzeIPReputation() {
        let blockedIPs = 0;
        
        for (const [ip, reputation] of this.ipReputation.entries()) {
            if (reputation.blocked) {
                blockedIPs++;
            }
        }

        if (blockedIPs > 0) {
            console.log(`[MONITOR] Currently blocking ${blockedIPs} IP addresses`);
        }
    }

    /**
     * Check for threat patterns across all data
     */
    checkForThreatPatterns() {
        // This would perform more comprehensive pattern analysis
        // across all stored data
    }

    /**
     * Clean up old monitoring data
     */
    cleanupOldData() {
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const cutoff = Date.now() - maxAge;

        // Clean up old login attempts
        for (const [key, attempts] of this.loginAttempts.entries()) {
            const recentAttempts = attempts.filter(timestamp => timestamp > cutoff);
            if (recentAttempts.length === 0) {
                this.loginAttempts.delete(key);
            } else {
                this.loginAttempts.set(key, recentAttempts);
            }
        }

        // Clean up old threats
        for (const [threatId, threat] of this.activeThreats.entries()) {
            if (threat.detectedAt < cutoff) {
                this.activeThreats.delete(threatId);
            }
        }

        // Clean up old anomalies
        for (const [anomalyId, anomaly] of this.anomalies.entries()) {
            if (anomaly.detectedAt < cutoff) {
                this.anomalies.delete(anomalyId);
            }
        }
    }

    /**
     * Get monitoring statistics
     */
    getMonitoringStats() {
        return {
            ...this.metrics,
            activeUsers: this.userBehavior.size,
            trackedIPs: this.ipReputation.size,
            blockedIPs: Array.from(this.ipReputation.values()).filter(r => r.blocked).length,
            activeThreats: this.activeThreats.size,
            recentAnomalies: this.anomalies.size,
            activeSessions: Array.from(this.sessionTracking.values())
                .reduce((sum, sessions) => sum + sessions.size, 0)
        };
    }

    /**
     * Get user risk assessment
     */
    getUserRiskAssessment(userId) {
        const profile = this.userBehavior.get(userId);
        if (!profile) {
            return null;
        }

        return {
            userId,
            riskScore: profile.riskScore,
            riskLevel: profile.riskScore > 0.7 ? 'high' : 
                      profile.riskScore > 0.4 ? 'medium' : 'low',
            factors: this.getRiskFactors(profile),
            profile: {
                firstSeen: profile.firstSeen,
                lastSeen: profile.lastSeen,
                eventCount: profile.eventCount,
                ipCount: profile.ipAddresses.size,
                locationCount: profile.locations.size
            }
        };
    }

    /**
     * Get IP risk assessment
     */
    getIPRiskAssessment(ip) {
        const reputation = this.ipReputation.get(ip);
        if (!reputation) {
            return null;
        }

        return {
            ip,
            riskScore: reputation.riskScore,
            riskLevel: reputation.riskScore > 0.7 ? 'high' : 
                      reputation.riskScore > 0.4 ? 'medium' : 'low',
            blocked: reputation.blocked,
            eventCount: reputation.eventCount,
            failedLogins: reputation.failedLogins,
            userCount: reputation.users.size,
            firstSeen: reputation.firstSeen,
            lastSeen: reputation.lastSeen
        };
    }
}

module.exports = SecurityMonitor;