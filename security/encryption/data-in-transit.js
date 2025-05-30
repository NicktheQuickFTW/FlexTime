/**
 * Data in Transit Encryption Service
 * Provides TLS/SSL configuration and API encryption
 */

const crypto = require('crypto');
const https = require('https');
const fs = require('fs').promises;
const { promisify } = require('util');

class DataInTransitEncryption {
    constructor(config = {}) {
        this.config = {
            tlsVersion: config.tlsVersion || 'TLSv1.3',
            cipherSuites: config.cipherSuites || [
                'TLS_AES_256_GCM_SHA384',
                'TLS_CHACHA20_POLY1305_SHA256',
                'TLS_AES_128_GCM_SHA256',
                'ECDHE-RSA-AES256-GCM-SHA384',
                'ECDHE-RSA-AES128-GCM-SHA256'
            ],
            keyExchange: config.keyExchange || 'ECDHE',
            certificatePath: config.certificatePath,
            privateKeyPath: config.privateKeyPath,
            caPath: config.caPath,
            enableHSTS: config.enableHSTS !== false,
            enableOCSP: config.enableOCSP !== false,
            enableCompression: config.enableCompression || false,
            sessionTimeout: config.sessionTimeout || 300, // 5 minutes
            ...config
        };

        // Certificate and key storage
        this.certificates = new Map();
        this.privateKeys = new Map();
        this.trustedCAs = new Map();
        
        // Session management
        this.tlsSessions = new Map();
        this.sessionTickets = new Map();
    }

    /**
     * Load SSL/TLS certificates
     */
    async loadCertificates() {
        if (this.config.certificatePath) {
            const certData = await fs.readFile(this.config.certificatePath);
            this.certificates.set('default', certData);
        }

        if (this.config.privateKeyPath) {
            const keyData = await fs.readFile(this.config.privateKeyPath);
            this.privateKeys.set('default', keyData);
        }

        if (this.config.caPath) {
            const caData = await fs.readFile(this.config.caPath);
            this.trustedCAs.set('default', caData);
        }
    }

    /**
     * Generate self-signed certificate for development
     */
    async generateSelfSignedCertificate(options = {}) {
        const {
            commonName = 'localhost',
            organization = 'Flextime Development',
            country = 'US',
            validDays = 365,
            keySize = 2048
        } = options;

        // Generate private key
        const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: keySize,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        // Create certificate signing request
        const cert = await this.createSelfSignedCert({
            privateKey,
            publicKey,
            commonName,
            organization,
            country,
            validDays
        });

        return {
            certificate: cert,
            privateKey,
            publicKey
        };
    }

    /**
     * Create self-signed certificate
     */
    async createSelfSignedCert(options) {
        // This is a simplified version - in production, use a proper certificate library
        const { privateKey, commonName, organization, country, validDays } = options;
        
        // Generate a basic X.509 certificate structure
        const serialNumber = crypto.randomBytes(16).toString('hex');
        const notBefore = new Date();
        const notAfter = new Date(Date.now() + validDays * 24 * 60 * 60 * 1000);

        const certificate = {
            version: 3,
            serialNumber,
            issuer: { CN: commonName, O: organization, C: country },
            subject: { CN: commonName, O: organization, C: country },
            notBefore,
            notAfter,
            publicKey: options.publicKey,
            extensions: {
                keyUsage: ['digitalSignature', 'keyEncipherment'],
                extKeyUsage: ['serverAuth'],
                subjectAltName: [`DNS:${commonName}`]
            }
        };

        // In a real implementation, this would create a proper DER/PEM encoded certificate
        return JSON.stringify(certificate);
    }

    /**
     * Configure HTTPS server options
     */
    getHTTPSOptions(domain = 'default') {
        const cert = this.certificates.get(domain) || this.certificates.get('default');
        const key = this.privateKeys.get(domain) || this.privateKeys.get('default');
        const ca = this.trustedCAs.get(domain) || this.trustedCAs.get('default');

        if (!cert || !key) {
            throw new Error('SSL certificate and private key are required');
        }

        const options = {
            cert,
            key,
            ca,
            
            // TLS Configuration
            secureProtocol: this.config.tlsVersion === 'TLSv1.3' ? 'TLSv1_3_method' : 'TLSv1_2_method',
            ciphers: this.config.cipherSuites.join(':'),
            honorCipherOrder: true,
            
            // Security settings
            secureOptions: crypto.constants.SSL_OP_NO_SSLv2 | 
                          crypto.constants.SSL_OP_NO_SSLv3 |
                          crypto.constants.SSL_OP_NO_TLSv1 |
                          crypto.constants.SSL_OP_NO_TLSv1_1,
            
            // Session management
            sessionTimeout: this.config.sessionTimeout,
            sessionIdContext: 'flextime-secure',
            
            // OCSP stapling
            requestOCSP: this.config.enableOCSP
        };

        if (!this.config.enableCompression) {
            options.secureOptions |= crypto.constants.SSL_OP_NO_COMPRESSION;
        }

        return options;
    }

    /**
     * Create secure HTTPS server
     */
    createSecureServer(app, domain = 'default') {
        const options = this.getHTTPSOptions(domain);
        const server = https.createServer(options, app);

        // Enable session reuse
        server.on('secureConnection', (tlsSocket) => {
            this.handleSecureConnection(tlsSocket);
        });

        // Handle session tickets
        server.on('newSession', (sessionId, sessionData, callback) => {
            this.storeSession(sessionId, sessionData);
            callback();
        });

        server.on('resumeSession', (sessionId, callback) => {
            const sessionData = this.getSession(sessionId);
            callback(null, sessionData);
        });

        return server;
    }

    /**
     * Handle secure connection
     */
    handleSecureConnection(tlsSocket) {
        const sessionId = tlsSocket.getSession();
        const cipher = tlsSocket.getCipher();
        const protocol = tlsSocket.getProtocol();
        const peerCertificate = tlsSocket.getPeerCertificate();

        // Store session information
        this.tlsSessions.set(sessionId.toString('hex'), {
            sessionId: sessionId.toString('hex'),
            cipher,
            protocol,
            peerCertificate,
            connectedAt: Date.now(),
            remoteAddress: tlsSocket.remoteAddress,
            remotePort: tlsSocket.remotePort
        });

        // Log connection details
        console.log(`[TLS] Secure connection established:`, {
            protocol,
            cipher: cipher.name,
            version: cipher.version,
            remoteAddress: tlsSocket.remoteAddress
        });
    }

    /**
     * Store TLS session
     */
    storeSession(sessionId, sessionData) {
        const id = sessionId.toString('hex');
        this.sessionTickets.set(id, {
            sessionData,
            createdAt: Date.now(),
            expiresAt: Date.now() + (this.config.sessionTimeout * 1000)
        });

        // Clean up expired sessions
        this.cleanupExpiredSessions();
    }

    /**
     * Get TLS session
     */
    getSession(sessionId) {
        const id = sessionId.toString('hex');
        const session = this.sessionTickets.get(id);
        
        if (!session) {
            return null;
        }

        if (Date.now() > session.expiresAt) {
            this.sessionTickets.delete(id);
            return null;
        }

        return session.sessionData;
    }

    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = Date.now();
        
        for (const [sessionId, session] of this.sessionTickets.entries()) {
            if (now > session.expiresAt) {
                this.sessionTickets.delete(sessionId);
            }
        }

        for (const [sessionId, session] of this.tlsSessions.entries()) {
            if (now > session.connectedAt + (this.config.sessionTimeout * 1000)) {
                this.tlsSessions.delete(sessionId);
            }
        }
    }

    /**
     * Express middleware for security headers
     */
    securityHeadersMiddleware() {
        return (req, res, next) => {
            // HTTP Strict Transport Security
            if (this.config.enableHSTS) {
                res.setHeader('Strict-Transport-Security', 
                    'max-age=31536000; includeSubDomains; preload');
            }

            // Content Security Policy
            res.setHeader('Content-Security-Policy', 
                "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");

            // X-Content-Type-Options
            res.setHeader('X-Content-Type-Options', 'nosniff');

            // X-Frame-Options
            res.setHeader('X-Frame-Options', 'DENY');

            // X-XSS-Protection
            res.setHeader('X-XSS-Protection', '1; mode=block');

            // Referrer Policy
            res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

            // Permissions Policy
            res.setHeader('Permissions-Policy', 
                'geolocation=(), microphone=(), camera=()');

            next();
        };
    }

    /**
     * Encrypt API request payload
     */
    encryptAPIRequest(payload, sharedSecret) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', sharedSecret, { iv });
        
        let encrypted = cipher.update(JSON.stringify(payload), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const authTag = cipher.getAuthTag();

        return {
            encryptedData: encrypted,
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            timestamp: Date.now()
        };
    }

    /**
     * Decrypt API request payload
     */
    decryptAPIRequest(encryptedPayload, sharedSecret) {
        const { encryptedData, iv, authTag, timestamp } = encryptedPayload;
        
        // Check timestamp to prevent replay attacks
        const maxAge = 5 * 60 * 1000; // 5 minutes
        if (Date.now() - timestamp > maxAge) {
            throw new Error('Request timestamp too old');
        }

        const decipher = crypto.createDecipher('aes-256-gcm', sharedSecret, {
            iv: Buffer.from(iv, 'base64')
        });
        
        decipher.setAuthTag(Buffer.from(authTag, 'base64'));

        let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return JSON.parse(decrypted);
    }

    /**
     * Generate Diffie-Hellman key exchange
     */
    generateDHKeyExchange() {
        const dh = crypto.createDiffieHellman(2048);
        dh.generateKeys();

        return {
            prime: dh.getPrime('base64'),
            generator: dh.getGenerator('base64'),
            publicKey: dh.getPublicKey('base64'),
            privateKey: dh.getPrivateKey('base64')
        };
    }

    /**
     * Compute shared secret from DH key exchange
     */
    computeSharedSecret(otherPublicKey, privateKey, prime, generator) {
        const dh = crypto.createDiffieHellman(
            Buffer.from(prime, 'base64'),
            Buffer.from(generator, 'base64')
        );
        
        dh.setPrivateKey(Buffer.from(privateKey, 'base64'));
        const sharedSecret = dh.computeSecret(Buffer.from(otherPublicKey, 'base64'));
        
        return sharedSecret.toString('base64');
    }

    /**
     * Create message authentication code (HMAC)
     */
    createHMAC(data, secret, algorithm = 'sha256') {
        const hmac = crypto.createHmac(algorithm, secret);
        hmac.update(data);
        return hmac.digest('base64');
    }

    /**
     * Verify message authentication code
     */
    verifyHMAC(data, signature, secret, algorithm = 'sha256') {
        const expectedSignature = this.createHMAC(data, secret, algorithm);
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'base64'),
            Buffer.from(expectedSignature, 'base64')
        );
    }

    /**
     * Encrypt WebSocket messages
     */
    encryptWebSocketMessage(message, sessionKey) {
        const nonce = crypto.randomBytes(12);
        const cipher = crypto.createCipher('aes-256-gcm', sessionKey, { iv: nonce });
        
        let encrypted = cipher.update(message, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            encrypted,
            nonce: nonce.toString('base64'),
            authTag: authTag.toString('base64')
        });
    }

    /**
     * Decrypt WebSocket messages
     */
    decryptWebSocketMessage(encryptedMessage, sessionKey) {
        const { encrypted, nonce, authTag } = JSON.parse(encryptedMessage);
        
        const decipher = crypto.createDecipher('aes-256-gcm', sessionKey, {
            iv: Buffer.from(nonce, 'base64')
        });
        
        decipher.setAuthTag(Buffer.from(authTag, 'base64'));

        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Certificate pinning verification
     */
    verifyCertificatePin(certificate, expectedPins) {
        const cert = crypto.createHash('sha256')
            .update(certificate)
            .digest('base64');

        return expectedPins.includes(cert);
    }

    /**
     * Get connection statistics
     */
    getConnectionStats() {
        const stats = {
            activeSessions: this.tlsSessions.size,
            activeSessionTickets: this.sessionTickets.size,
            connectionsByProtocol: {},
            connectionsByCipher: {},
            totalConnections: 0
        };

        for (const session of this.tlsSessions.values()) {
            stats.totalConnections++;
            
            const protocol = session.protocol || 'unknown';
            stats.connectionsByProtocol[protocol] = 
                (stats.connectionsByProtocol[protocol] || 0) + 1;

            const cipher = session.cipher?.name || 'unknown';
            stats.connectionsByCipher[cipher] = 
                (stats.connectionsByCipher[cipher] || 0) + 1;
        }

        return stats;
    }

    /**
     * Check certificate expiration
     */
    checkCertificateExpiration(certificateData) {
        try {
            // This is a simplified check - in production, parse actual X.509 certificate
            const cert = JSON.parse(certificateData);
            const expirationDate = new Date(cert.notAfter);
            const now = new Date();
            const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

            return {
                expired: expirationDate < now,
                expirationDate,
                daysUntilExpiration,
                warningThreshold: daysUntilExpiration <= 30
            };
        } catch (error) {
            return {
                error: 'Could not parse certificate',
                expired: null
            };
        }
    }

    /**
     * Create secure HTTP client with certificate pinning
     */
    createSecureClient(options = {}) {
        const {
            hostname,
            port = 443,
            pinnedCertificates = [],
            timeout = 30000
        } = options;

        const httpsOptions = {
            hostname,
            port,
            ...this.getHTTPSOptions(),
            checkServerIdentity: (servername, cert) => {
                // Verify certificate pinning
                if (pinnedCertificates.length > 0) {
                    if (!this.verifyCertificatePin(cert.raw, pinnedCertificates)) {
                        throw new Error('Certificate pin verification failed');
                    }
                }
                
                // Default hostname verification
                return require('tls').checkServerIdentity(servername, cert);
            }
        };

        return {
            request: (path, options) => {
                return new Promise((resolve, reject) => {
                    const req = https.request({
                        ...httpsOptions,
                        path,
                        ...options
                    }, resolve);

                    req.setTimeout(timeout, () => {
                        req.destroy();
                        reject(new Error('Request timeout'));
                    });

                    req.on('error', reject);
                    req.end();
                });
            }
        };
    }
}

module.exports = DataInTransitEncryption;