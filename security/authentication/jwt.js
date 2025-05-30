/**
 * JWT (JSON Web Token) Service
 * Provides comprehensive JWT handling with security best practices
 */

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class JWTService {
    constructor(config) {
        this.config = {
            issuer: config.issuer || 'flextime',
            audience: config.audience || 'flextime-api',
            accessTokenSecret: config.accessTokenSecret || this.generateSecret(),
            refreshTokenSecret: config.refreshTokenSecret || this.generateSecret(),
            accessTokenExpiry: config.accessTokenExpiry || '15m',
            refreshTokenExpiry: config.refreshTokenExpiry || '7d',
            algorithm: config.algorithm || 'HS256',
            clockTolerance: config.clockTolerance || 60, // seconds
            ...config
        };

        // Token blacklist for revoked tokens (use Redis in production)
        this.tokenBlacklist = new Set();
        this.refreshTokens = new Map();
    }

    /**
     * Generate a secure secret key
     */
    generateSecret() {
        return crypto.randomBytes(64).toString('hex');
    }

    /**
     * Create access token
     */
    createAccessToken(payload) {
        const jti = uuidv4();
        const now = Math.floor(Date.now() / 1000);
        
        const tokenPayload = {
            iss: this.config.issuer,
            aud: this.config.audience,
            iat: now,
            jti,
            ...payload
        };

        const options = {
            expiresIn: this.config.accessTokenExpiry,
            algorithm: this.config.algorithm,
            noTimestamp: false
        };

        return jwt.sign(tokenPayload, this.config.accessTokenSecret, options);
    }

    /**
     * Create refresh token
     */
    createRefreshToken(userId, accessTokenJti) {
        const jti = uuidv4();
        const now = Math.floor(Date.now() / 1000);
        
        const tokenPayload = {
            iss: this.config.issuer,
            aud: this.config.audience,
            sub: userId,
            iat: now,
            jti,
            token_type: 'refresh',
            access_jti: accessTokenJti
        };

        const options = {
            expiresIn: this.config.refreshTokenExpiry,
            algorithm: this.config.algorithm
        };

        const token = jwt.sign(tokenPayload, this.config.refreshTokenSecret, options);
        
        // Store refresh token metadata
        this.refreshTokens.set(jti, {
            userId,
            accessTokenJti,
            issuedAt: now,
            used: false
        });

        return token;
    }

    /**
     * Create token pair (access + refresh)
     */
    createTokenPair(payload) {
        const accessToken = this.createAccessToken(payload);
        const accessDecoded = jwt.decode(accessToken);
        const refreshToken = this.createRefreshToken(payload.sub, accessDecoded.jti);

        return {
            accessToken,
            refreshToken,
            expiresIn: this.parseExpiry(this.config.accessTokenExpiry),
            tokenType: 'Bearer'
        };
    }

    /**
     * Verify access token
     */
    verifyAccessToken(token) {
        try {
            // Check if token is blacklisted
            const decoded = jwt.decode(token);
            if (decoded && this.tokenBlacklist.has(decoded.jti)) {
                throw new Error('Token has been revoked');
            }

            const payload = jwt.verify(token, this.config.accessTokenSecret, {
                issuer: this.config.issuer,
                audience: this.config.audience,
                algorithms: [this.config.algorithm],
                clockTolerance: this.config.clockTolerance
            });

            return {
                valid: true,
                payload,
                jti: payload.jti
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                expired: error.name === 'TokenExpiredError'
            };
        }
    }

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token) {
        try {
            const payload = jwt.verify(token, this.config.refreshTokenSecret, {
                issuer: this.config.issuer,
                audience: this.config.audience,
                algorithms: [this.config.algorithm],
                clockTolerance: this.config.clockTolerance
            });

            // Check if refresh token exists and hasn't been used
            const refreshData = this.refreshTokens.get(payload.jti);
            if (!refreshData) {
                throw new Error('Refresh token not found');
            }

            if (refreshData.used) {
                throw new Error('Refresh token already used');
            }

            return {
                valid: true,
                payload,
                refreshData
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message,
                expired: error.name === 'TokenExpiredError'
            };
        }
    }

    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(refreshToken, newPayload = {}) {
        const verification = this.verifyRefreshToken(refreshToken);
        
        if (!verification.valid) {
            throw new Error(`Invalid refresh token: ${verification.error}`);
        }

        const { payload, refreshData } = verification;
        
        // Mark refresh token as used
        refreshData.used = true;
        
        // Revoke old access token
        this.tokenBlacklist.add(refreshData.accessTokenJti);

        // Create new token pair
        const tokenPayload = {
            sub: payload.sub,
            ...newPayload
        };

        return this.createTokenPair(tokenPayload);
    }

    /**
     * Revoke token
     */
    revokeToken(token, tokenType = 'access') {
        try {
            const decoded = jwt.decode(token);
            if (!decoded || !decoded.jti) {
                return false;
            }

            if (tokenType === 'refresh') {
                const refreshData = this.refreshTokens.get(decoded.jti);
                if (refreshData) {
                    // Mark refresh token as used
                    refreshData.used = true;
                    // Also revoke associated access token
                    this.tokenBlacklist.add(refreshData.accessTokenJti);
                }
            } else {
                // Add to blacklist
                this.tokenBlacklist.add(decoded.jti);
            }

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Revoke all tokens for a user
     */
    revokeAllUserTokens(userId) {
        // Revoke all refresh tokens for user
        for (const [jti, data] of this.refreshTokens.entries()) {
            if (data.userId === userId) {
                data.used = true;
                this.tokenBlacklist.add(data.accessTokenJti);
            }
        }
    }

    /**
     * Decode token without verification
     */
    decodeToken(token) {
        return jwt.decode(token, { complete: true });
    }

    /**
     * Get token claims
     */
    getTokenClaims(token) {
        const decoded = this.decodeToken(token);
        return decoded ? decoded.payload : null;
    }

    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        const claims = this.getTokenClaims(token);
        if (!claims || !claims.exp) {
            return true;
        }
        
        const now = Math.floor(Date.now() / 1000);
        return now >= claims.exp;
    }

    /**
     * Get token expiration time
     */
    getTokenExpiration(token) {
        const claims = this.getTokenClaims(token);
        return claims ? claims.exp : null;
    }

    /**
     * Get time until token expires
     */
    getTimeUntilExpiry(token) {
        const exp = this.getTokenExpiration(token);
        if (!exp) return 0;
        
        const now = Math.floor(Date.now() / 1000);
        return Math.max(0, exp - now);
    }

    /**
     * Parse expiry string to seconds
     */
    parseExpiry(expiry) {
        if (typeof expiry === 'number') {
            return expiry;
        }
        
        const units = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400,
            'w': 604800,
            'y': 31536000
        };
        
        const match = expiry.match(/^(\d+)([smhdwy]?)$/);
        if (!match) {
            throw new Error('Invalid expiry format');
        }
        
        const [, value, unit] = match;
        return parseInt(value) * (units[unit] || 1);
    }

    /**
     * Middleware for Express.js
     */
    middleware(options = {}) {
        const {
            required = true,
            skipPaths = [],
            getToken = (req) => {
                const authHeader = req.headers.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    return authHeader.substring(7);
                }
                return null;
            }
        } = options;

        return (req, res, next) => {
            // Skip authentication for certain paths
            if (skipPaths.some(path => req.path.startsWith(path))) {
                return next();
            }

            const token = getToken(req);
            
            if (!token) {
                if (required) {
                    return res.status(401).json({ error: 'No token provided' });
                }
                return next();
            }

            const verification = this.verifyAccessToken(token);
            
            if (!verification.valid) {
                const status = verification.expired ? 401 : 403;
                return res.status(status).json({ 
                    error: verification.error,
                    expired: verification.expired 
                });
            }

            // Attach user info to request
            req.user = verification.payload;
            req.token = {
                jti: verification.jti,
                raw: token
            };

            next();
        };
    }

    /**
     * Clean up expired tokens (should be run periodically)
     */
    cleanup() {
        const now = Math.floor(Date.now() / 1000);
        
        // Clean up expired refresh tokens
        for (const [jti, data] of this.refreshTokens.entries()) {
            try {
                const token = jwt.sign({ jti }, this.config.refreshTokenSecret);
                const verification = this.verifyRefreshToken(token);
                if (!verification.valid && verification.expired) {
                    this.refreshTokens.delete(jti);
                }
            } catch (error) {
                // Token likely expired, remove it
                this.refreshTokens.delete(jti);
            }
        }
        
        // In production, also clean up Redis-based blacklist
        // For now, we'll keep the blacklist as-is (Set doesn't have TTL)
    }
}

module.exports = JWTService;