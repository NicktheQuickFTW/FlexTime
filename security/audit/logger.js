/**
 * Security Audit Logger
 * Comprehensive security event logging and monitoring
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class SecurityAuditLogger extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            logLevel: config.logLevel || 'info',
            logFormat: config.logFormat || 'json',
            outputDirectory: config.outputDirectory || './logs/security',
            maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
            maxFiles: config.maxFiles || 30,
            enableEncryption: config.enableEncryption || false,
            encryptionKey: config.encryptionKey || crypto.randomBytes(32),
            enableIntegrityCheck: config.enableIntegrityCheck !== false,
            enableRealTimeAlerts: config.enableRealTimeAlerts !== false,
            alertThresholds: config.alertThresholds || {
                failedLogins: 5,
                unauthorizedAccess: 3,
                suspiciousActivity: 1
            },
            ...config
        };

        // Event storage
        this.events = [];
        this.eventIndex = new Map();
        this.alertCounters = new Map();
        
        // Log levels
        this.logLevels = {
            error: 0,
            warn: 1,
            info: 2,
            debug: 3,
            trace: 4
        };

        // Security event categories
        this.eventCategories = {
            AUTHENTICATION: 'authentication',
            AUTHORIZATION: 'authorization',
            DATA_ACCESS: 'data_access',
            SYSTEM_SECURITY: 'system_security',
            COMPLIANCE: 'compliance',
            INCIDENT: 'incident',
            CONFIGURATION: 'configuration',
            NETWORK: 'network'
        };

        this.initializeLogger();
    }

    /**
     * Initialize logger
     */
    async initializeLogger() {
        try {
            await this.ensureLogDirectory();
            this.startLogRotation();
            console.log('[AUDIT] Security audit logger initialized');
        } catch (error) {
            console.error('[AUDIT] Failed to initialize logger:', error);
        }
    }

    /**
     * Ensure log directory exists
     */
    async ensureLogDirectory() {
        try {
            await fs.mkdir(this.config.outputDirectory, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    /**
     * Log security event
     */
    async logSecurityEvent(eventType, details = {}, severity = 'info', category = null) {
        const event = this.createSecurityEvent(eventType, details, severity, category);
        
        // Add to in-memory storage
        this.events.push(event);
        this.indexEvent(event);

        // Write to file
        await this.writeEventToFile(event);

        // Check for real-time alerts
        if (this.config.enableRealTimeAlerts) {
            this.checkAlertThresholds(event);
        }

        // Emit event for listeners
        this.emit('securityEvent', event);
        this.emit(event.type, event);

        return event.id;
    }

    /**
     * Create security event object
     */
    createSecurityEvent(eventType, details, severity, category) {
        const event = {
            id: crypto.randomUUID(),
            type: eventType,
            category: category || this.inferCategory(eventType),
            severity,
            timestamp: Date.now(),
            isoTimestamp: new Date().toISOString(),
            details: this.sanitizeDetails(details),
            session: details.sessionId || null,
            user: details.userId || details.username || null,
            ip: details.ipAddress || details.ip || null,
            userAgent: details.userAgent || null,
            source: details.source || 'system',
            correlationId: details.correlationId || crypto.randomUUID(),
            hash: null // Will be computed for integrity
        };

        // Compute integrity hash
        if (this.config.enableIntegrityCheck) {
            event.hash = this.computeEventHash(event);
        }

        return event;
    }

    /**
     * Sanitize event details to remove sensitive information
     */
    sanitizeDetails(details) {
        const sanitized = { ...details };
        
        // Remove sensitive fields
        const sensitiveFields = [
            'password', 'token', 'secret', 'key', 'credential',
            'authorization', 'cookie', 'session'
        ];

        for (const field of sensitiveFields) {
            if (field in sanitized) {
                sanitized[field] = '[REDACTED]';
            }
        }

        // Truncate long values
        for (const [key, value] of Object.entries(sanitized)) {
            if (typeof value === 'string' && value.length > 1000) {
                sanitized[key] = value.substring(0, 1000) + '...[TRUNCATED]';
            }
        }

        return sanitized;
    }

    /**
     * Infer event category from event type
     */
    inferCategory(eventType) {
        const typeMap = {
            'login': this.eventCategories.AUTHENTICATION,
            'logout': this.eventCategories.AUTHENTICATION,
            'failed_login': this.eventCategories.AUTHENTICATION,
            'mfa_challenge': this.eventCategories.AUTHENTICATION,
            'password_change': this.eventCategories.AUTHENTICATION,
            'access_denied': this.eventCategories.AUTHORIZATION,
            'permission_check': this.eventCategories.AUTHORIZATION,
            'role_assignment': this.eventCategories.AUTHORIZATION,
            'data_access': this.eventCategories.DATA_ACCESS,
            'data_modification': this.eventCategories.DATA_ACCESS,
            'export': this.eventCategories.DATA_ACCESS,
            'security_configuration': this.eventCategories.CONFIGURATION,
            'certificate_expiry': this.eventCategories.SYSTEM_SECURITY,
            'intrusion_attempt': this.eventCategories.INCIDENT,
            'suspicious_activity': this.eventCategories.INCIDENT
        };

        return typeMap[eventType.toLowerCase()] || this.eventCategories.SYSTEM_SECURITY;
    }

    /**
     * Compute integrity hash for event
     */
    computeEventHash(event) {
        const hashData = {
            id: event.id,
            type: event.type,
            timestamp: event.timestamp,
            details: event.details,
            user: event.user,
            ip: event.ip
        };

        return crypto
            .createHash('sha256')
            .update(JSON.stringify(hashData))
            .digest('hex');
    }

    /**
     * Verify event integrity
     */
    verifyEventIntegrity(event) {
        if (!this.config.enableIntegrityCheck || !event.hash) {
            return true; // Skip if integrity check is disabled
        }

        const computedHash = this.computeEventHash(event);
        return computedHash === event.hash;
    }

    /**
     * Index event for fast searching
     */
    indexEvent(event) {
        // Index by type
        if (!this.eventIndex.has(event.type)) {
            this.eventIndex.set(event.type, []);
        }
        this.eventIndex.get(event.type).push(event.id);

        // Index by user
        if (event.user) {
            const userKey = `user:${event.user}`;
            if (!this.eventIndex.has(userKey)) {
                this.eventIndex.set(userKey, []);
            }
            this.eventIndex.get(userKey).push(event.id);
        }

        // Index by IP
        if (event.ip) {
            const ipKey = `ip:${event.ip}`;
            if (!this.eventIndex.has(ipKey)) {
                this.eventIndex.set(ipKey, []);
            }
            this.eventIndex.get(ipKey).push(event.id);
        }

        // Limit index size
        for (const [key, events] of this.eventIndex.entries()) {
            if (events.length > 10000) {
                events.splice(0, events.length - 10000);
            }
        }
    }

    /**
     * Write event to log file
     */
    async writeEventToFile(event) {
        try {
            const logEntry = this.formatLogEntry(event);
            const filename = this.getLogFilename();
            const filepath = path.join(this.config.outputDirectory, filename);

            let data;
            if (this.config.enableEncryption) {
                data = this.encryptLogEntry(logEntry);
            } else {
                data = logEntry + '\n';
            }

            await fs.appendFile(filepath, data);

            // Check file size for rotation
            const stats = await fs.stat(filepath);
            if (stats.size > this.config.maxFileSize) {
                await this.rotateLogFile(filename);
            }
        } catch (error) {
            console.error('[AUDIT] Failed to write event to file:', error);
        }
    }

    /**
     * Format log entry
     */
    formatLogEntry(event) {
        switch (this.config.logFormat) {
            case 'json':
                return JSON.stringify(event);
            
            case 'text':
                return `[${event.isoTimestamp}] ${event.severity.toUpperCase()} ${event.type}: ${JSON.stringify(event.details)}`;
            
            case 'syslog':
                return `<${this.getSyslogPriority(event.severity)}>${event.isoTimestamp} flextime-security: ${event.type} ${JSON.stringify(event.details)}`;
            
            default:
                return JSON.stringify(event);
        }
    }

    /**
     * Get syslog priority
     */
    getSyslogPriority(severity) {
        const priorities = {
            error: 3,   // Error
            warn: 4,    // Warning
            info: 6,    // Informational
            debug: 7,   // Debug
            trace: 7    // Debug
        };
        return priorities[severity] || 6;
    }

    /**
     * Get current log filename
     */
    getLogFilename() {
        const date = new Date().toISOString().split('T')[0];
        return `security-audit-${date}.log`;
    }

    /**
     * Encrypt log entry
     */
    encryptLogEntry(logEntry) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', this.config.encryptionKey, { iv });
        
        let encrypted = cipher.update(logEntry, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const authTag = cipher.getAuthTag();

        const encryptedEntry = {
            encrypted,
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64')
        };

        return JSON.stringify(encryptedEntry) + '\n';
    }

    /**
     * Decrypt log entry
     */
    decryptLogEntry(encryptedData) {
        const data = JSON.parse(encryptedData.trim());
        
        const decipher = crypto.createDecipher('aes-256-gcm', this.config.encryptionKey, {
            iv: Buffer.from(data.iv, 'base64')
        });
        
        decipher.setAuthTag(Buffer.from(data.authTag, 'base64'));

        let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Rotate log file
     */
    async rotateLogFile(currentFilename) {
        try {
            const currentPath = path.join(this.config.outputDirectory, currentFilename);
            const timestamp = Date.now();
            const rotatedFilename = currentFilename.replace('.log', `-${timestamp}.log`);
            const rotatedPath = path.join(this.config.outputDirectory, rotatedFilename);

            await fs.rename(currentPath, rotatedPath);
            console.log(`[AUDIT] Log file rotated: ${rotatedFilename}`);

            // Clean up old files
            await this.cleanupOldLogFiles();
        } catch (error) {
            console.error('[AUDIT] Failed to rotate log file:', error);
        }
    }

    /**
     * Clean up old log files
     */
    async cleanupOldLogFiles() {
        try {
            const files = await fs.readdir(this.config.outputDirectory);
            const logFiles = files
                .filter(file => file.startsWith('security-audit-') && file.endsWith('.log'))
                .map(file => ({
                    name: file,
                    path: path.join(this.config.outputDirectory, file),
                    time: fs.stat(path.join(this.config.outputDirectory, file)).then(s => s.mtime)
                }));

            const filesWithStats = await Promise.all(
                logFiles.map(async file => ({
                    ...file,
                    time: await file.time
                }))
            );

            // Sort by modification time, newest first
            filesWithStats.sort((a, b) => b.time - a.time);

            // Remove excess files
            if (filesWithStats.length > this.config.maxFiles) {
                const filesToDelete = filesWithStats.slice(this.config.maxFiles);
                
                for (const file of filesToDelete) {
                    await fs.unlink(file.path);
                    console.log(`[AUDIT] Deleted old log file: ${file.name}`);
                }
            }
        } catch (error) {
            console.error('[AUDIT] Failed to cleanup old log files:', error);
        }
    }

    /**
     * Start log rotation timer
     */
    startLogRotation() {
        // Rotate logs daily at midnight
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        const msUntilMidnight = midnight.getTime() - now.getTime();

        setTimeout(() => {
            this.rotateLogFile(this.getLogFilename());
            
            // Set up daily rotation
            setInterval(() => {
                this.rotateLogFile(this.getLogFilename());
            }, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    /**
     * Check alert thresholds
     */
    checkAlertThresholds(event) {
        const key = `${event.type}:${event.user || event.ip || 'unknown'}`;
        const timeWindow = 60 * 60 * 1000; // 1 hour
        const now = Date.now();

        // Clean up old counters
        for (const [counterKey, counter] of this.alertCounters.entries()) {
            if (now - counter.firstOccurrence > timeWindow) {
                this.alertCounters.delete(counterKey);
            }
        }

        // Update counter
        if (!this.alertCounters.has(key)) {
            this.alertCounters.set(key, {
                count: 1,
                firstOccurrence: now,
                lastOccurrence: now
            });
        } else {
            const counter = this.alertCounters.get(key);
            counter.count++;
            counter.lastOccurrence = now;
        }

        // Check thresholds
        const counter = this.alertCounters.get(key);
        const threshold = this.getAlertThreshold(event.type);

        if (threshold && counter.count >= threshold) {
            this.triggerAlert(event, counter);
        }
    }

    /**
     * Get alert threshold for event type
     */
    getAlertThreshold(eventType) {
        const typeMap = {
            'failed_login': this.config.alertThresholds.failedLogins,
            'access_denied': this.config.alertThresholds.unauthorizedAccess,
            'suspicious_activity': this.config.alertThresholds.suspiciousActivity,
            'intrusion_attempt': 1
        };

        return typeMap[eventType];
    }

    /**
     * Trigger security alert
     */
    async triggerAlert(event, counter) {
        const alert = {
            id: crypto.randomUUID(),
            type: 'security_alert',
            severity: 'critical',
            triggerEvent: event,
            occurrenceCount: counter.count,
            timeWindow: counter.lastOccurrence - counter.firstOccurrence,
            triggeredAt: Date.now()
        };

        // Log the alert
        await this.logSecurityEvent('security_alert', alert, 'critical', this.eventCategories.INCIDENT);

        // Emit alert event
        this.emit('securityAlert', alert);

        console.warn(`[AUDIT] SECURITY ALERT: ${event.type} threshold exceeded`, alert);
    }

    /**
     * Search events
     */
    searchEvents(criteria = {}) {
        const {
            type,
            user,
            ip,
            category,
            severity,
            startTime,
            endTime,
            limit = 100
        } = criteria;

        let results = [...this.events];

        // Apply filters
        if (type) {
            results = results.filter(e => e.type === type);
        }

        if (user) {
            results = results.filter(e => e.user === user);
        }

        if (ip) {
            results = results.filter(e => e.ip === ip);
        }

        if (category) {
            results = results.filter(e => e.category === category);
        }

        if (severity) {
            results = results.filter(e => e.severity === severity);
        }

        if (startTime) {
            results = results.filter(e => e.timestamp >= startTime);
        }

        if (endTime) {
            results = results.filter(e => e.timestamp <= endTime);
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp);

        // Apply limit
        return results.slice(0, limit);
    }

    /**
     * Get event statistics
     */
    getEventStatistics(timeWindow = 24 * 60 * 60 * 1000) { // 24 hours
        const now = Date.now();
        const cutoff = now - timeWindow;
        const recentEvents = this.events.filter(e => e.timestamp >= cutoff);

        const stats = {
            totalEvents: recentEvents.length,
            eventsByType: {},
            eventsByCategory: {},
            eventsBySeverity: {},
            eventsByUser: {},
            eventsByIP: {},
            timeWindow,
            generatedAt: now
        };

        for (const event of recentEvents) {
            // By type
            stats.eventsByType[event.type] = (stats.eventsByType[event.type] || 0) + 1;

            // By category
            stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;

            // By severity
            stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;

            // By user
            if (event.user) {
                stats.eventsByUser[event.user] = (stats.eventsByUser[event.user] || 0) + 1;
            }

            // By IP
            if (event.ip) {
                stats.eventsByIP[event.ip] = (stats.eventsByIP[event.ip] || 0) + 1;
            }
        }

        return stats;
    }

    /**
     * Export events for external analysis
     */
    async exportEvents(criteria = {}, format = 'json') {
        const events = this.searchEvents(criteria);
        
        switch (format) {
            case 'json':
                return JSON.stringify(events, null, 2);
            
            case 'csv':
                return this.eventsToCSV(events);
            
            case 'xml':
                return this.eventsToXML(events);
            
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Convert events to CSV format
     */
    eventsToCSV(events) {
        if (events.length === 0) {
            return '';
        }

        const headers = ['id', 'type', 'category', 'severity', 'timestamp', 'user', 'ip', 'details'];
        const rows = events.map(event => [
            event.id,
            event.type,
            event.category,
            event.severity,
            event.isoTimestamp,
            event.user || '',
            event.ip || '',
            JSON.stringify(event.details)
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    }

    /**
     * Convert events to XML format
     */
    eventsToXML(events) {
        const xmlEvents = events.map(event => {
            return `
                <event>
                    <id>${event.id}</id>
                    <type>${event.type}</type>
                    <category>${event.category}</category>
                    <severity>${event.severity}</severity>
                    <timestamp>${event.isoTimestamp}</timestamp>
                    <user>${event.user || ''}</user>
                    <ip>${event.ip || ''}</ip>
                    <details><![CDATA[${JSON.stringify(event.details)}]]></details>
                </event>`;
        }).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>\n<events>\n${xmlEvents}\n</events>`;
    }

    /**
     * Get audit trail for specific entity
     */
    getAuditTrail(entityType, entityId, limit = 50) {
        const events = this.events.filter(event => {
            return event.details[entityType] === entityId ||
                   event.details.entityType === entityType && event.details.entityId === entityId;
        });

        return events
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    /**
     * Cleanup old events from memory
     */
    cleanup(retentionPeriod = 7 * 24 * 60 * 60 * 1000) { // 7 days
        const cutoff = Date.now() - retentionPeriod;
        const originalLength = this.events.length;
        
        this.events = this.events.filter(event => event.timestamp >= cutoff);
        
        // Rebuild index
        this.eventIndex.clear();
        for (const event of this.events) {
            this.indexEvent(event);
        }

        const removed = originalLength - this.events.length;
        if (removed > 0) {
            console.log(`[AUDIT] Cleaned up ${removed} old events from memory`);
        }
    }
}

module.exports = SecurityAuditLogger;