/**
 * FlexTime Enhanced Authentication and Authorization System
 * 
 * Provides comprehensive security features including:
 * - Role-based access control (RBAC)
 * - Schedule ownership validation
 * - Collaboration permissions
 * - API key management
 * - JWT token handling
 * - Session management
 * - Audit logging and compliance
 * 
 * @author FlexTime Development Team
 * @version 2.0.0
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class AuthSystem {
    constructor(config = {}) {
        this.config = {
            jwtSecret: config.jwtSecret || process.env.JWT_SECRET || 'flextime_default_secret',
            jwtExpiresIn: config.jwtExpiresIn || '24h',
            refreshTokenExpiresIn: config.refreshTokenExpiresIn || '7d',
            sessionTimeout: config.sessionTimeout || 3600000, // 1 hour
            maxLoginAttempts: config.maxLoginAttempts || 5,
            lockoutDuration: config.lockoutDuration || 900000, // 15 minutes
            auditEnabled: config.auditEnabled !== false,
            ...config
        };

        this.sessions = new Map();
        this.apiKeys = new Map();
        this.loginAttempts = new Map();
        this.auditLog = [];
        
        // Initialize default roles and permissions
        this.initializeRBAC();
    }

    /**
     * Initialize Role-Based Access Control (RBAC) system
     */
    initializeRBAC() {
        this.roles = {
            admin: {
                name: 'Administrator',
                permissions: [
                    'schedule:create', 'schedule:read', 'schedule:update', 'schedule:delete',
                    'user:create', 'user:read', 'user:update', 'user:delete',
                    'system:configure', 'system:audit', 'system:manage',
                    'api:manage', 'collaboration:manage'
                ]
            },
            scheduler: {
                name: 'Scheduler',
                permissions: [
                    'schedule:create', 'schedule:read', 'schedule:update', 'schedule:delete',
                    'schedule:publish', 'schedule:export',
                    'collaboration:create', 'collaboration:participate'
                ]
            },
            coordinator: {
                name: 'Coordinator',
                permissions: [
                    'schedule:read', 'schedule:update',
                    'schedule:export',
                    'collaboration:participate'
                ]
            },
            viewer: {
                name: 'Viewer',
                permissions: [
                    'schedule:read',
                    'schedule:export'
                ]
            },
            guest: {
                name: 'Guest',
                permissions: [
                    'schedule:read'
                ]
            }
        };

        this.permissions = {
            'schedule:create': 'Create new schedules',
            'schedule:read': 'View schedules',
            'schedule:update': 'Modify schedules',
            'schedule:delete': 'Delete schedules',
            'schedule:publish': 'Publish schedules',
            'schedule:export': 'Export schedules',
            'user:create': 'Create users',
            'user:read': 'View users',
            'user:update': 'Modify users',
            'user:delete': 'Delete users',
            'system:configure': 'Configure system settings',
            'system:audit': 'View audit logs',
            'system:manage': 'Manage system',
            'api:manage': 'Manage API keys',
            'collaboration:create': 'Create collaboration sessions',
            'collaboration:participate': 'Participate in collaboration',
            'collaboration:manage': 'Manage collaboration permissions'
        };
    }

    /**
     * User registration with role assignment
     */
    async registerUser(userData) {
        try {
            const { username, email, password, role = 'viewer', organizationId } = userData;

            // Validate input
            if (!username || !email || !password) {
                throw new Error('Username, email, and password are required');
            }

            if (!this.roles[role]) {
                throw new Error(`Invalid role: ${role}`);
            }

            // Hash password
            const saltRounds = 12;
            const hashedPassword = await bcrypt.hash(password, saltRounds);

            // Create user object
            const user = {
                id: uuidv4(),
                username,
                email: email.toLowerCase(),
                password: hashedPassword,
                role,
                organizationId,
                createdAt: new Date(),
                lastLogin: null,
                isActive: true,
                loginAttempts: 0,
                lockedUntil: null
            };

            // Log registration
            this.logAuditEvent('user:register', {
                userId: user.id,
                username,
                email,
                role,
                organizationId
            });

            return { success: true, user: this.sanitizeUser(user) };
        } catch (error) {
            this.logAuditEvent('user:register:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * User authentication with login attempt tracking
     */
    async authenticateUser(credentials) {
        try {
            const { username, password } = credentials;

            if (!username || !password) {
                throw new Error('Username and password are required');
            }

            // Check for rate limiting
            const attemptKey = username.toLowerCase();
            const attempts = this.loginAttempts.get(attemptKey);
            
            if (attempts && attempts.count >= this.config.maxLoginAttempts) {
                const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
                if (timeSinceLastAttempt < this.config.lockoutDuration) {
                    this.logAuditEvent('auth:login:blocked', { username, reason: 'rate_limit' });
                    throw new Error('Account temporarily locked due to too many failed login attempts');
                }
                // Reset attempts after lockout period
                this.loginAttempts.delete(attemptKey);
            }

            // Simulate user lookup (in real implementation, this would query the database)
            const user = await this.findUserByUsername(username);
            
            if (!user || !user.isActive) {
                this.recordFailedLogin(attemptKey);
                this.logAuditEvent('auth:login:failed', { username, reason: 'user_not_found' });
                throw new Error('Invalid credentials');
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                this.recordFailedLogin(attemptKey);
                this.logAuditEvent('auth:login:failed', { username, reason: 'invalid_password' });
                throw new Error('Invalid credentials');
            }

            // Reset login attempts on successful login
            this.loginAttempts.delete(attemptKey);

            // Update last login
            user.lastLogin = new Date();

            // Generate tokens
            const tokens = this.generateTokens(user);

            // Create session
            const session = this.createSession(user, tokens.accessToken);

            this.logAuditEvent('auth:login:success', {
                userId: user.id,
                username,
                sessionId: session.id
            });

            return {
                success: true,
                user: this.sanitizeUser(user),
                tokens,
                session: {
                    id: session.id,
                    expiresAt: session.expiresAt
                }
            };
        } catch (error) {
            this.logAuditEvent('auth:login:error', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate JWT tokens
     */
    generateTokens(user) {
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            organizationId: user.organizationId,
            permissions: this.roles[user.role]?.permissions || []
        };

        const accessToken = jwt.sign(payload, this.config.jwtSecret, {
            expiresIn: this.config.jwtExpiresIn,
            issuer: 'flextime-auth',
            subject: user.id
        });

        const refreshToken = jwt.sign(
            { userId: user.id, tokenType: 'refresh' },
            this.config.jwtSecret,
            {
                expiresIn: this.config.refreshTokenExpiresIn,
                issuer: 'flextime-auth',
                subject: user.id
            }
        );

        return { accessToken, refreshToken };
    }

    /**
     * Verify and decode JWT token
     */
    verifyToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            return { valid: true, payload: decoded };
        } catch (error) {
            this.logAuditEvent('auth:token:invalid', { error: error.message });
            return { valid: false, error: error.message };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken) {
        try {
            const { valid, payload } = this.verifyToken(refreshToken);
            
            if (!valid || payload.tokenType !== 'refresh') {
                throw new Error('Invalid refresh token');
            }

            const user = await this.findUserById(payload.userId);
            if (!user || !user.isActive) {
                throw new Error('User not found or inactive');
            }

            const tokens = this.generateTokens(user);

            this.logAuditEvent('auth:token:refresh', { userId: user.id });

            return { success: true, tokens };
        } catch (error) {
            this.logAuditEvent('auth:token:refresh:failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Create user session
     */
    createSession(user, accessToken) {
        const sessionId = uuidv4();
        const expiresAt = new Date(Date.now() + this.config.sessionTimeout);

        const session = {
            id: sessionId,
            userId: user.id,
            token: accessToken,
            createdAt: new Date(),
            expiresAt,
            lastActivity: new Date(),
            ipAddress: null, // Set by middleware
            userAgent: null  // Set by middleware
        };

        this.sessions.set(sessionId, session);

        // Clean up expired sessions
        this.cleanupExpiredSessions();

        return session;
    }

    /**
     * Validate session
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return { valid: false, error: 'Session not found' };
        }

        if (session.expiresAt < new Date()) {
            this.sessions.delete(sessionId);
            return { valid: false, error: 'Session expired' };
        }

        // Update last activity
        session.lastActivity = new Date();

        return { valid: true, session };
    }

    /**
     * Logout user and invalidate session
     */
    logout(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            this.logAuditEvent('auth:logout', { userId: session.userId, sessionId });
            this.sessions.delete(sessionId);
        }
        return { success: true };
    }

    /**
     * Permission-based authorization
     */
    hasPermission(user, permission) {
        if (!user || !user.role) {
            return false;
        }

        const role = this.roles[user.role];
        return role && role.permissions.includes(permission);
    }

    /**
     * Resource-based authorization (e.g., schedule ownership)
     */
    hasResourceAccess(user, resource, action) {
        // Check basic permission first
        const permission = `${resource}:${action}`;
        if (!this.hasPermission(user, permission)) {
            return false;
        }

        // Additional resource-specific checks can be added here
        // For example, checking if user owns the schedule or has collaboration access
        return true;
    }

    /**
     * Schedule ownership validation
     */
    validateScheduleOwnership(user, schedule) {
        // Owner has full access
        if (schedule.ownerId === user.id) {
            return { hasAccess: true, level: 'owner' };
        }

        // Check collaboration permissions
        if (schedule.collaborators) {
            const collaborator = schedule.collaborators.find(c => c.userId === user.id);
            if (collaborator) {
                return { 
                    hasAccess: true, 
                    level: 'collaborator',
                    permissions: collaborator.permissions 
                };
            }
        }

        // Check organization access
        if (user.organizationId && schedule.organizationId === user.organizationId) {
            return { hasAccess: true, level: 'organization' };
        }

        // Check if schedule is public
        if (schedule.isPublic && this.hasPermission(user, 'schedule:read')) {
            return { hasAccess: true, level: 'public' };
        }

        return { hasAccess: false, level: 'none' };
    }

    /**
     * API Key Management
     */
    generateApiKey(user, options = {}) {
        const apiKey = {
            id: uuidv4(),
            key: this.generateSecureKey(),
            userId: user.id,
            name: options.name || 'Default API Key',
            permissions: options.permissions || this.roles[user.role]?.permissions || [],
            createdAt: new Date(),
            expiresAt: options.expiresAt || null,
            lastUsed: null,
            isActive: true
        };

        this.apiKeys.set(apiKey.key, apiKey);

        this.logAuditEvent('api:key:create', {
            userId: user.id,
            keyId: apiKey.id,
            name: apiKey.name
        });

        return apiKey;
    }

    /**
     * Validate API key
     */
    validateApiKey(keyString) {
        const apiKey = this.apiKeys.get(keyString);
        
        if (!apiKey || !apiKey.isActive) {
            return { valid: false, error: 'Invalid API key' };
        }

        if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
            return { valid: false, error: 'API key expired' };
        }

        // Update last used timestamp
        apiKey.lastUsed = new Date();

        return { valid: true, apiKey };
    }

    /**
     * Revoke API key
     */
    revokeApiKey(keyString, userId) {
        const apiKey = this.apiKeys.get(keyString);
        
        if (apiKey && apiKey.userId === userId) {
            apiKey.isActive = false;
            this.logAuditEvent('api:key:revoke', {
                userId,
                keyId: apiKey.id
            });
            return { success: true };
        }

        return { success: false, error: 'API key not found' };
    }

    /**
     * Collaboration permissions management
     */
    addCollaborator(schedule, collaboratorData, requestingUser) {
        if (!this.validateScheduleOwnership(requestingUser, schedule).hasAccess) {
            throw new Error('Insufficient permissions to add collaborators');
        }

        const collaborator = {
            userId: collaboratorData.userId,
            permissions: collaboratorData.permissions || ['schedule:read'],
            addedBy: requestingUser.id,
            addedAt: new Date()
        };

        if (!schedule.collaborators) {
            schedule.collaborators = [];
        }

        schedule.collaborators.push(collaborator);

        this.logAuditEvent('collaboration:add', {
            scheduleId: schedule.id,
            collaboratorId: collaborator.userId,
            permissions: collaborator.permissions,
            addedBy: requestingUser.id
        });

        return collaborator;
    }

    /**
     * Comprehensive audit logging
     */
    logAuditEvent(action, details = {}) {
        if (!this.config.auditEnabled) {
            return;
        }

        const auditEntry = {
            id: uuidv4(),
            timestamp: new Date(),
            action,
            details: {
                ...details,
                timestamp: new Date().toISOString(),
                source: 'AuthSystem'
            }
        };

        this.auditLog.push(auditEntry);

        // Emit event for external logging systems
        this.emit && this.emit('audit', auditEntry);

        // Keep only last 10000 entries in memory
        if (this.auditLog.length > 10000) {
            this.auditLog.shift();
        }
    }

    /**
     * Get audit logs with filtering
     */
    getAuditLogs(filters = {}) {
        let logs = [...this.auditLog];

        if (filters.userId) {
            logs = logs.filter(log => log.details.userId === filters.userId);
        }

        if (filters.action) {
            logs = logs.filter(log => log.action.includes(filters.action));
        }

        if (filters.startDate) {
            logs = logs.filter(log => log.timestamp >= new Date(filters.startDate));
        }

        if (filters.endDate) {
            logs = logs.filter(log => log.timestamp <= new Date(filters.endDate));
        }

        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Generate compliance report
     */
    generateComplianceReport(options = {}) {
        const endDate = options.endDate || new Date();
        const startDate = options.startDate || new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

        const logs = this.getAuditLogs({ startDate, endDate });

        const report = {
            period: { startDate, endDate },
            summary: {
                totalEvents: logs.length,
                loginAttempts: logs.filter(l => l.action.includes('login')).length,
                failedLogins: logs.filter(l => l.action === 'auth:login:failed').length,
                apiKeyUsage: logs.filter(l => l.action.includes('api:key')).length,
                userRegistrations: logs.filter(l => l.action === 'user:register').length
            },
            securityEvents: logs.filter(l => 
                l.action.includes('failed') || 
                l.action.includes('blocked') || 
                l.action.includes('invalid')
            ),
            userActivity: this.generateUserActivityReport(logs),
            systemAccess: this.generateSystemAccessReport(logs)
        };

        return report;
    }

    /**
     * User activity analysis for compliance
     */
    generateUserActivityReport(logs) {
        const userActivity = {};

        logs.forEach(log => {
            if (log.details.userId) {
                if (!userActivity[log.details.userId]) {
                    userActivity[log.details.userId] = {
                        userId: log.details.userId,
                        actions: [],
                        firstActivity: log.timestamp,
                        lastActivity: log.timestamp,
                        totalActions: 0
                    };
                }

                const user = userActivity[log.details.userId];
                user.actions.push({
                    action: log.action,
                    timestamp: log.timestamp,
                    details: log.details
                });
                user.totalActions++;
                
                if (log.timestamp < user.firstActivity) {
                    user.firstActivity = log.timestamp;
                }
                if (log.timestamp > user.lastActivity) {
                    user.lastActivity = log.timestamp;
                }
            }
        });

        return Object.values(userActivity);
    }

    /**
     * System access analysis for compliance
     */
    generateSystemAccessReport(logs) {
        const accessPatterns = {
            byHour: new Array(24).fill(0),
            byDay: {},
            byAction: {},
            failedAttempts: []
        };

        logs.forEach(log => {
            const hour = log.timestamp.getHours();
            const day = log.timestamp.toDateString();

            accessPatterns.byHour[hour]++;
            accessPatterns.byDay[day] = (accessPatterns.byDay[day] || 0) + 1;
            accessPatterns.byAction[log.action] = (accessPatterns.byAction[log.action] || 0) + 1;

            if (log.action.includes('failed') || log.action.includes('blocked')) {
                accessPatterns.failedAttempts.push(log);
            }
        });

        return accessPatterns;
    }

    // Utility methods

    recordFailedLogin(username) {
        const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: null };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        this.loginAttempts.set(username, attempts);
    }

    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.expiresAt < now) {
                this.sessions.delete(sessionId);
            }
        }
    }

    generateSecureKey(length = 32) {
        return crypto.randomBytes(length).toString('hex');
    }

    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    // Mock database methods (replace with actual database calls)
    async findUserByUsername(username) {
        // This would query your actual database
        // For demo purposes, returning a mock user
        return {
            id: 'user-123',
            username,
            email: `${username}@example.com`,
            password: '$2a$12$example_hashed_password',
            role: 'scheduler',
            organizationId: 'org-456',
            isActive: true,
            createdAt: new Date(),
            lastLogin: null
        };
    }

    async findUserById(userId) {
        // This would query your actual database
        return this.findUserByUsername('demo_user');
    }
}

// Middleware factory for Express.js integration
AuthSystem.createAuthMiddleware = function(authSystem) {
    return (req, res, next) => {
        const token = req.headers.authorization?.replace('Bearer ', '') ||
                     req.headers['x-api-key'] ||
                     req.query.token;

        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Try JWT token first
        const tokenResult = authSystem.verifyToken(token);
        if (tokenResult.valid) {
            req.user = tokenResult.payload;
            req.auth = { type: 'jwt', user: req.user };
            return next();
        }

        // Try API key
        const apiKeyResult = authSystem.validateApiKey(token);
        if (apiKeyResult.valid) {
            req.user = { 
                userId: apiKeyResult.apiKey.userId,
                permissions: apiKeyResult.apiKey.permissions
            };
            req.auth = { type: 'apikey', apiKey: apiKeyResult.apiKey };
            return next();
        }

        return res.status(401).json({ error: 'Invalid authentication credentials' });
    };
};

// Permission checking middleware
AuthSystem.requirePermission = function(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!req.user.permissions || !req.user.permissions.includes(permission)) {
            authSystem.logAuditEvent('auth:permission:denied', {
                userId: req.user.userId,
                permission,
                endpoint: req.path
            });
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: permission
            });
        }

        next();
    };
};

module.exports = AuthSystem;