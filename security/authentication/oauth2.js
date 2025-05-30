/**
 * OAuth2 Authentication Service
 * Provides secure OAuth2 implementation for Flextime application
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

class OAuth2Service {
    constructor(config) {
        this.config = {
            issuer: config.issuer || 'flextime-auth',
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            redirectUri: config.redirectUri,
            scope: config.scope || 'read write',
            tokenExpiry: config.tokenExpiry || 3600, // 1 hour
            refreshTokenExpiry: config.refreshTokenExpiry || 86400 * 7, // 7 days
            ...config
        };
        
        this.authorizationCodes = new Map(); // In production, use Redis
        this.accessTokens = new Map();
        this.refreshTokens = new Map();
    }

    /**
     * Generate authorization URL for OAuth2 flow
     */
    generateAuthorizationUrl(state = null, codeChallenge = null) {
        const params = new URLSearchParams({
            response_type: 'code',
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scope,
            state: state || crypto.randomBytes(16).toString('hex')
        });

        // PKCE support
        if (codeChallenge) {
            params.append('code_challenge', codeChallenge);
            params.append('code_challenge_method', 'S256');
        }

        return `${this.config.authorizationEndpoint}?${params.toString()}`;
    }

    /**
     * Generate authorization code
     */
    generateAuthorizationCode(userId, clientId, redirectUri, scope, codeChallenge = null) {
        const code = crypto.randomBytes(32).toString('hex');
        const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

        this.authorizationCodes.set(code, {
            userId,
            clientId,
            redirectUri,
            scope,
            codeChallenge,
            expiresAt,
            used: false
        });

        // Clean up expired codes
        setTimeout(() => {
            this.authorizationCodes.delete(code);
        }, 10 * 60 * 1000);

        return code;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code, clientId, clientSecret, redirectUri, codeVerifier = null) {
        const authCode = this.authorizationCodes.get(code);
        
        if (!authCode) {
            throw new Error('Invalid authorization code');
        }

        if (authCode.used) {
            throw new Error('Authorization code already used');
        }

        if (Date.now() > authCode.expiresAt) {
            this.authorizationCodes.delete(code);
            throw new Error('Authorization code expired');
        }

        if (authCode.clientId !== clientId) {
            throw new Error('Client ID mismatch');
        }

        if (authCode.redirectUri !== redirectUri) {
            throw new Error('Redirect URI mismatch');
        }

        // Verify client credentials
        if (!this.verifyClientCredentials(clientId, clientSecret)) {
            throw new Error('Invalid client credentials');
        }

        // PKCE verification
        if (authCode.codeChallenge) {
            if (!codeVerifier) {
                throw new Error('Code verifier required');
            }
            
            const challengeFromVerifier = crypto
                .createHash('sha256')
                .update(codeVerifier)
                .digest('base64url');
                
            if (challengeFromVerifier !== authCode.codeChallenge) {
                throw new Error('Invalid code verifier');
            }
        }

        // Mark code as used
        authCode.used = true;

        // Generate tokens
        const accessToken = this.generateAccessToken(authCode.userId, authCode.scope);
        const refreshToken = this.generateRefreshToken(authCode.userId, accessToken.jti);

        return {
            access_token: accessToken.token,
            token_type: 'Bearer',
            expires_in: this.config.tokenExpiry,
            refresh_token: refreshToken,
            scope: authCode.scope
        };
    }

    /**
     * Generate JWT access token
     */
    generateAccessToken(userId, scope) {
        const jti = uuidv4();
        const now = Math.floor(Date.now() / 1000);
        
        const payload = {
            iss: this.config.issuer,
            sub: userId,
            aud: this.config.clientId,
            iat: now,
            exp: now + this.config.tokenExpiry,
            jti,
            scope,
            token_type: 'access_token'
        };

        const token = jwt.sign(payload, this.config.jwtSecret, { algorithm: 'HS256' });
        
        // Store token metadata
        this.accessTokens.set(jti, {
            userId,
            scope,
            issuedAt: now,
            expiresAt: now + this.config.tokenExpiry
        });

        return { token, jti, expiresAt: payload.exp };
    }

    /**
     * Generate refresh token
     */
    generateRefreshToken(userId, accessTokenJti) {
        const refreshToken = crypto.randomBytes(64).toString('hex');
        const expiresAt = Math.floor(Date.now() / 1000) + this.config.refreshTokenExpiry;
        
        this.refreshTokens.set(refreshToken, {
            userId,
            accessTokenJti,
            expiresAt,
            used: false
        });

        return refreshToken;
    }

    /**
     * Refresh access token using refresh token
     */
    async refreshAccessToken(refreshToken, clientId, clientSecret) {
        if (!this.verifyClientCredentials(clientId, clientSecret)) {
            throw new Error('Invalid client credentials');
        }

        const refreshData = this.refreshTokens.get(refreshToken);
        
        if (!refreshData) {
            throw new Error('Invalid refresh token');
        }

        if (refreshData.used) {
            throw new Error('Refresh token already used');
        }

        if (Date.now() / 1000 > refreshData.expiresAt) {
            this.refreshTokens.delete(refreshToken);
            throw new Error('Refresh token expired');
        }

        // Revoke old access token
        const oldToken = this.accessTokens.get(refreshData.accessTokenJti);
        if (oldToken) {
            this.accessTokens.delete(refreshData.accessTokenJti);
        }

        // Mark refresh token as used
        refreshData.used = true;

        // Generate new tokens
        const scope = oldToken ? oldToken.scope : 'read write';
        const newAccessToken = this.generateAccessToken(refreshData.userId, scope);
        const newRefreshToken = this.generateRefreshToken(refreshData.userId, newAccessToken.jti);

        return {
            access_token: newAccessToken.token,
            token_type: 'Bearer',
            expires_in: this.config.tokenExpiry,
            refresh_token: newRefreshToken,
            scope
        };
    }

    /**
     * Validate access token
     */
    validateAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.config.jwtSecret);
            const tokenData = this.accessTokens.get(decoded.jti);
            
            if (!tokenData) {
                throw new Error('Token not found');
            }

            if (Date.now() / 1000 > decoded.exp) {
                this.accessTokens.delete(decoded.jti);
                throw new Error('Token expired');
            }

            return {
                valid: true,
                userId: decoded.sub,
                scope: decoded.scope,
                jti: decoded.jti
            };
        } catch (error) {
            return {
                valid: false,
                error: error.message
            };
        }
    }

    /**
     * Revoke token
     */
    revokeToken(token, tokenTypeHint = null) {
        if (tokenTypeHint === 'refresh_token' || this.refreshTokens.has(token)) {
            const refreshData = this.refreshTokens.get(token);
            if (refreshData) {
                this.refreshTokens.delete(token);
                // Also revoke associated access token
                this.accessTokens.delete(refreshData.accessTokenJti);
                return true;
            }
        }

        // Try to decode as JWT access token
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.jti) {
                this.accessTokens.delete(decoded.jti);
                return true;
            }
        } catch (error) {
            // Not a valid JWT
        }

        return false;
    }

    /**
     * Verify client credentials
     */
    verifyClientCredentials(clientId, clientSecret) {
        // In production, validate against secure client registry
        return clientId === this.config.clientId && 
               clientSecret === this.config.clientSecret;
    }

    /**
     * Get token introspection data
     */
    introspectToken(token) {
        const validation = this.validateAccessToken(token);
        
        if (!validation.valid) {
            return { active: false };
        }

        const tokenData = this.accessTokens.get(validation.jti);
        
        return {
            active: true,
            scope: validation.scope,
            client_id: this.config.clientId,
            username: validation.userId,
            token_type: 'Bearer',
            exp: tokenData.expiresAt,
            iat: tokenData.issuedAt,
            sub: validation.userId,
            aud: this.config.clientId,
            iss: this.config.issuer,
            jti: validation.jti
        };
    }
}

module.exports = OAuth2Service;