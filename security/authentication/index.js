/**
 * Authentication Module Index
 * Central authentication service combining OAuth2, JWT, and MFA
 */

const OAuth2Service = require('./oauth2');
const JWTService = require('./jwt');
const MFAService = require('./mfa');
const crypto = require('crypto');

class AuthenticationService {
    constructor(config = {}) {
        this.config = {
            jwt: {
                issuer: 'flextime',
                audience: 'flextime-api',
                accessTokenSecret: process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex'),
                refreshTokenSecret: process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex'),
                accessTokenExpiry: '15m',
                refreshTokenExpiry: '7d',
                ...config.jwt
            },
            oauth2: {
                issuer: 'flextime-auth',
                clientId: process.env.OAUTH_CLIENT_ID || 'flextime-client',
                clientSecret: process.env.OAUTH_CLIENT_SECRET || crypto.randomBytes(32).toString('hex'),
                redirectUri: process.env.OAUTH_REDIRECT_URI || 'http://localhost:3000/auth/callback',
                jwtSecret: process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex'),
                ...config.oauth2
            },
            mfa: {
                issuer: 'Flextime',
                totpWindow: 2,
                ...config.mfa
            },
            ...config
        };

        // Initialize services
        this.jwt = new JWTService(this.config.jwt);
        this.oauth2 = new OAuth2Service(this.config.oauth2);
        this.mfa = new MFAService(this.config.mfa);

        // User sessions and security events
        this.activeSessions = new Map();
        this.securityEvents = [];
    }

    /**
     * Authenticate user with password
     */
    async authenticateUser(username, password, userProvider) {
        try {
            // Validate user credentials via provided user service
            const user = await userProvider.validateCredentials(username, password);
            
            if (!user) {
                this.logSecurityEvent('AUTH_FAILED', { username, reason: 'invalid_credentials' });
                throw new Error('Invalid credentials');
            }

            // Check if account is locked/disabled
            if (user.status === 'locked' || user.status === 'disabled') {
                this.logSecurityEvent('AUTH_FAILED', { username, reason: 'account_locked' });
                throw new Error('Account is locked or disabled');
            }

            // Check if MFA is required
            const mfaRequired = this.mfa.isMFAEnabled(user.id);
            
            if (mfaRequired) {
                // Create a temporary session token for MFA flow
                const tempToken = this.jwt.createAccessToken({
                    sub: user.id,
                    username: user.username,
                    temp: true,
                    mfa_pending: true
                });

                return {
                    success: true,
                    mfaRequired: true,
                    tempToken,
                    user: this.sanitizeUser(user)
                };
            }

            // Create full session
            return this.createUserSession(user);

        } catch (error) {
            this.logSecurityEvent('AUTH_ERROR', { username, error: error.message });
            throw error;
        }
    }

    /**
     * Complete MFA authentication
     */
    async completeMFAAuthentication(tempToken, mfaCredential, mfaType = 'totp', userProvider) {
        try {
            // Verify temp token
            const verification = this.jwt.verifyAccessToken(tempToken);
            if (!verification.valid || !verification.payload.mfa_pending) {
                throw new Error('Invalid or expired temporary token');
            }

            const userId = verification.payload.sub;

            // Verify MFA
            const mfaResult = this.mfa.verifyMFA(userId, mfaCredential, mfaType);
            if (!mfaResult) {
                this.logSecurityEvent('MFA_FAILED', { userId, type: mfaType });
                throw new Error('Invalid MFA credential');
            }

            // Get full user details
            const user = await userProvider.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Revoke temp token
            this.jwt.revokeToken(tempToken);

            // Create full session
            return this.createUserSession(user);

        } catch (error) {
            this.logSecurityEvent('MFA_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Create user session with tokens
     */
    createUserSession(user) {
        const tokenPayload = {
            sub: user.id,
            username: user.username,
            email: user.email,
            roles: user.roles || [],
            permissions: user.permissions || []
        };

        const tokens = this.jwt.createTokenPair(tokenPayload);
        const sessionId = crypto.randomUUID();

        // Store session info
        this.activeSessions.set(sessionId, {
            userId: user.id,
            username: user.username,
            accessTokenJti: this.jwt.getTokenClaims(tokens.accessToken).jti,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            ipAddress: null, // Set by middleware
            userAgent: null  // Set by middleware
        });

        this.logSecurityEvent('AUTH_SUCCESS', { 
            userId: user.id, 
            username: user.username,
            sessionId 
        });

        return {
            success: true,
            user: this.sanitizeUser(user),
            tokens,
            sessionId
        };
    }

    /**
     * OAuth2 authorization flow
     */
    async authorizeOAuth2(userId, clientId, redirectUri, scope, state, codeChallenge) {
        try {
            // Validate client and redirect URI
            if (!this.oauth2.verifyClientCredentials(clientId, this.config.oauth2.clientSecret)) {
                throw new Error('Invalid client');
            }

            // Generate authorization code
            const code = this.oauth2.generateAuthorizationCode(
                userId, clientId, redirectUri, scope, codeChallenge
            );

            this.logSecurityEvent('OAUTH_AUTHORIZE', { userId, clientId, scope });

            return { code, state };

        } catch (error) {
            this.logSecurityEvent('OAUTH_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * OAuth2 token exchange
     */
    async exchangeOAuth2Token(code, clientId, clientSecret, redirectUri, codeVerifier) {
        try {
            const tokens = await this.oauth2.exchangeCodeForToken(
                code, clientId, clientSecret, redirectUri, codeVerifier
            );

            this.logSecurityEvent('OAUTH_TOKEN_EXCHANGE', { clientId });

            return tokens;

        } catch (error) {
            this.logSecurityEvent('OAUTH_TOKEN_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Refresh tokens
     */
    async refreshTokens(refreshToken) {
        try {
            const newTokens = this.jwt.refreshAccessToken(refreshToken);
            
            this.logSecurityEvent('TOKEN_REFRESH', { 
                jti: this.jwt.getTokenClaims(newTokens.accessToken).jti 
            });

            return newTokens;

        } catch (error) {
            this.logSecurityEvent('TOKEN_REFRESH_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Logout user
     */
    async logout(accessToken, refreshToken = null, sessionId = null) {
        try {
            // Revoke tokens
            this.jwt.revokeToken(accessToken);
            if (refreshToken) {
                this.jwt.revokeToken(refreshToken, 'refresh');
            }

            // Remove session
            if (sessionId) {
                this.activeSessions.delete(sessionId);
            }

            const claims = this.jwt.getTokenClaims(accessToken);
            this.logSecurityEvent('LOGOUT', { userId: claims?.sub });

            return { success: true };

        } catch (error) {
            this.logSecurityEvent('LOGOUT_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Logout all sessions for user
     */
    async logoutAllSessions(userId) {
        try {
            // Revoke all user tokens
            this.jwt.revokeAllUserTokens(userId);

            // Remove all user sessions
            for (const [sessionId, session] of this.activeSessions.entries()) {
                if (session.userId === userId) {
                    this.activeSessions.delete(sessionId);
                }
            }

            this.logSecurityEvent('LOGOUT_ALL', { userId });

            return { success: true };

        } catch (error) {
            this.logSecurityEvent('LOGOUT_ALL_ERROR', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate token and get user info
     */
    validateToken(token) {
        const verification = this.jwt.verifyAccessToken(token);
        
        if (!verification.valid) {
            return {
                valid: false,
                error: verification.error,
                expired: verification.expired
            };
        }

        return {
            valid: true,
            user: verification.payload,
            jti: verification.jti
        };
    }

    /**
     * Get user sessions
     */
    getUserSessions(userId) {
        const sessions = [];
        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.userId === userId) {
                sessions.push({
                    sessionId,
                    createdAt: session.createdAt,
                    lastActivity: session.lastActivity,
                    ipAddress: session.ipAddress,
                    userAgent: session.userAgent
                });
            }
        }
        return sessions;
    }

    /**
     * Update session activity
     */
    updateSessionActivity(sessionId, ipAddress, userAgent) {
        const session = this.activeSessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
            session.ipAddress = ipAddress;
            session.userAgent = userAgent;
        }
    }

    /**
     * Sanitize user object for API responses
     */
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }

    /**
     * Log security event
     */
    logSecurityEvent(event, data) {
        this.securityEvents.push({
            event,
            data,
            timestamp: Date.now(),
            id: crypto.randomUUID()
        });

        // Keep only last 1000 events in memory
        if (this.securityEvents.length > 1000) {
            this.securityEvents.shift();
        }

        // In production, send to security monitoring system
        console.log(`[SECURITY] ${event}:`, data);
    }

    /**
     * Get security events
     */
    getSecurityEvents(limit = 100) {
        return this.securityEvents.slice(-limit);
    }

    /**
     * Express middleware for authentication
     */
    middleware(options = {}) {
        return this.jwt.middleware({
            ...options,
            // Override getToken to also update session activity
            getToken: (req) => {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    const token = authHeader.substring(7);
                    
                    // Update session activity if session ID provided
                    const sessionId = req.headers['x-session-id'];
                    if (sessionId) {
                        this.updateSessionActivity(
                            sessionId,
                            req.ip || req.connection.remoteAddress,
                            req.headers['user-agent']
                        );
                    }
                    
                    return token;
                }
                return null;
            }
        });
    }

    /**
     * Express middleware for MFA requirement
     */
    requireMFA(options = {}) {
        return this.mfa.requireMFA(options);
    }

    /**
     * Clean up expired tokens and sessions
     */
    cleanup() {
        this.jwt.cleanup();
        this.mfa.cleanup();

        // Clean up old sessions (older than refresh token expiry)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
        const cutoff = Date.now() - maxAge;

        for (const [sessionId, session] of this.activeSessions.entries()) {
            if (session.lastActivity < cutoff) {
                this.activeSessions.delete(sessionId);
            }
        }
    }
}

module.exports = {
    AuthenticationService,
    OAuth2Service,
    JWTService,
    MFAService
};