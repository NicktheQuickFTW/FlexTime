/**
 * Encryption Module Index
 * Comprehensive encryption service for data at rest and in transit
 */

const DataAtRestEncryption = require('./data-at-rest');
const DataInTransitEncryption = require('./data-in-transit');
const crypto = require('crypto');

class EncryptionService {
    constructor(config = {}) {
        this.config = {
            autoRotateKeys: config.autoRotateKeys !== false,
            keyRotationInterval: config.keyRotationInterval || 30 * 24 * 60 * 60 * 1000, // 30 days
            enableMetrics: config.enableMetrics !== false,
            ...config
        };

        // Initialize encryption services
        this.dataAtRest = new DataAtRestEncryption(config.dataAtRest || {});
        this.dataInTransit = new DataInTransitEncryption(config.dataInTransit || {});

        // Metrics and monitoring
        this.metrics = {
            encryptionOperations: 0,
            decryptionOperations: 0,
            keyRotations: 0,
            encryptionErrors: 0,
            decryptionErrors: 0,
            lastKeyRotation: null
        };

        // Start automatic key rotation if enabled
        if (this.config.autoRotateKeys) {
            this.startKeyRotationScheduler();
        }
    }

    /**
     * Initialize encryption service
     */
    async initialize() {
        // Load TLS certificates for data in transit
        await this.dataInTransit.loadCertificates();

        // Create initial encryption key if none exists
        if (!this.dataAtRest.currentKeyId) {
            this.dataAtRest.createEncryptionKey();
        }

        return true;
    }

    /**
     * Encrypt data (automatically determines best method)
     */
    async encrypt(data, options = {}) {
        try {
            const {
                type = 'rest', // 'rest' or 'transit'
                keyId = null,
                metadata = {},
                sharedSecret = null
            } = options;

            this.incrementMetric('encryptionOperations');

            if (type === 'transit' && sharedSecret) {
                return this.dataInTransit.encryptAPIRequest(data, sharedSecret);
            } else {
                return this.dataAtRest.encrypt(data, keyId, metadata);
            }
        } catch (error) {
            this.incrementMetric('encryptionErrors');
            throw error;
        }
    }

    /**
     * Decrypt data (automatically determines method from payload)
     */
    async decrypt(encryptedData, options = {}) {
        try {
            const { sharedSecret = null } = options;

            this.incrementMetric('decryptionOperations');

            // Try to determine encryption type from payload structure
            if (typeof encryptedData === 'object' && encryptedData.encryptedData) {
                // Looks like transit encryption
                return this.dataInTransit.decryptAPIRequest(encryptedData, sharedSecret);
            } else {
                // Assume data at rest encryption
                return this.dataAtRest.decrypt(encryptedData);
            }
        } catch (error) {
            this.incrementMetric('decryptionErrors');
            throw error;
        }
    }

    /**
     * Encrypt file
     */
    async encryptFile(inputPath, outputPath = null, options = {}) {
        try {
            this.incrementMetric('encryptionOperations');
            return await this.dataAtRest.encryptFile(inputPath, outputPath, 
                options.keyId, options.metadata);
        } catch (error) {
            this.incrementMetric('encryptionErrors');
            throw error;
        }
    }

    /**
     * Decrypt file
     */
    async decryptFile(encryptedPath, outputPath = null) {
        try {
            this.incrementMetric('decryptionOperations');
            return await this.dataAtRest.decryptFile(encryptedPath, outputPath);
        } catch (error) {
            this.incrementMetric('decryptionErrors');
            throw error;
        }
    }

    /**
     * Encrypt database fields
     */
    encryptFields(data, encryptedFields, keyId = null) {
        try {
            this.incrementMetric('encryptionOperations');
            return this.dataAtRest.encryptFields(data, encryptedFields, keyId);
        } catch (error) {
            this.incrementMetric('encryptionErrors');
            throw error;
        }
    }

    /**
     * Decrypt database fields
     */
    decryptFields(data, encryptedFields, fieldTypes = {}) {
        try {
            this.incrementMetric('decryptionOperations');
            return this.dataAtRest.decryptFields(data, encryptedFields, fieldTypes);
        } catch (error) {
            this.incrementMetric('decryptionErrors');
            throw error;
        }
    }

    /**
     * Create secure HTTPS server
     */
    createSecureServer(app, domain = 'default') {
        return this.dataInTransit.createSecureServer(app, domain);
    }

    /**
     * Get security headers middleware
     */
    getSecurityHeadersMiddleware() {
        return this.dataInTransit.securityHeadersMiddleware();
    }

    /**
     * Create secure HTTP client
     */
    createSecureClient(options = {}) {
        return this.dataInTransit.createSecureClient(options);
    }

    /**
     * Generate key exchange for secure communication
     */
    generateKeyExchange() {
        return this.dataInTransit.generateDHKeyExchange();
    }

    /**
     * Compute shared secret from key exchange
     */
    computeSharedSecret(otherPublicKey, privateKey, prime, generator) {
        return this.dataInTransit.computeSharedSecret(
            otherPublicKey, privateKey, prime, generator
        );
    }

    /**
     * Create digital signature
     */
    createSignature(data, privateKey, algorithm = 'sha256') {
        const sign = crypto.createSign(algorithm);
        sign.update(data);
        return sign.sign(privateKey, 'base64');
    }

    /**
     * Verify digital signature
     */
    verifySignature(data, signature, publicKey, algorithm = 'sha256') {
        const verify = crypto.createVerify(algorithm);
        verify.update(data);
        return verify.verify(publicKey, signature, 'base64');
    }

    /**
     * Hash data with salt
     */
    hashData(data, salt = null, algorithm = 'sha256') {
        const saltBuffer = salt ? Buffer.from(salt) : crypto.randomBytes(32);
        const hash = crypto.createHash(algorithm);
        hash.update(data);
        hash.update(saltBuffer);
        
        return {
            hash: hash.digest('hex'),
            salt: saltBuffer.toString('hex'),
            algorithm
        };
    }

    /**
     * Verify hashed data
     */
    verifyHash(data, expectedHash, salt, algorithm = 'sha256') {
        const hash = crypto.createHash(algorithm);
        hash.update(data);
        hash.update(Buffer.from(salt, 'hex'));
        
        const computedHash = hash.digest('hex');
        return crypto.timingSafeEqual(
            Buffer.from(expectedHash, 'hex'),
            Buffer.from(computedHash, 'hex')
        );
    }

    /**
     * Generate secure random values
     */
    generateSecureRandom(length = 32, encoding = 'hex') {
        return crypto.randomBytes(length).toString(encoding);
    }

    /**
     * Generate cryptographically secure UUID
     */
    generateSecureUUID() {
        return crypto.randomUUID();
    }

    /**
     * Key derivation function
     */
    deriveKey(password, salt, iterations = 100000, keyLength = 32) {
        return crypto.pbkdf2Sync(password, salt, iterations, keyLength, 'sha256');
    }

    /**
     * Rotate encryption keys
     */
    async rotateKeys(force = false) {
        try {
            const needsRotation = force || this.dataAtRest.isKeyRotationNeeded();
            
            if (needsRotation) {
                const result = this.dataAtRest.rotateKey();
                this.incrementMetric('keyRotations');
                this.metrics.lastKeyRotation = Date.now();
                
                console.log(`[ENCRYPTION] Key rotated: ${result.oldKeyId} → ${result.newKeyId}`);
                
                return result;
            }
            
            return null;
        } catch (error) {
            console.error('[ENCRYPTION] Key rotation failed:', error);
            throw error;
        }
    }

    /**
     * Start automatic key rotation scheduler
     */
    startKeyRotationScheduler() {
        const interval = Math.min(this.config.keyRotationInterval, 24 * 60 * 60 * 1000); // Max 24 hours
        
        this.keyRotationTimer = setInterval(async () => {
            try {
                await this.rotateKeys();
            } catch (error) {
                console.error('[ENCRYPTION] Scheduled key rotation failed:', error);
            }
        }, interval);

        console.log(`[ENCRYPTION] Key rotation scheduler started (interval: ${interval}ms)`);
    }

    /**
     * Stop automatic key rotation scheduler
     */
    stopKeyRotationScheduler() {
        if (this.keyRotationTimer) {
            clearInterval(this.keyRotationTimer);
            this.keyRotationTimer = null;
            console.log('[ENCRYPTION] Key rotation scheduler stopped');
        }
    }

    /**
     * Get encryption statistics
     */
    getStats() {
        const dataAtRestStats = {
            totalKeys: this.dataAtRest.keys.size,
            currentKeyId: this.dataAtRest.currentKeyId,
            keyHistory: this.dataAtRest.keyHistory.size,
            keysNeedingRotation: Array.from(this.dataAtRest.keys.values())
                .filter(key => this.dataAtRest.isKeyRotationNeeded(key.id)).length
        };

        const dataInTransitStats = this.dataInTransit.getConnectionStats();

        return {
            ...this.metrics,
            dataAtRest: dataAtRestStats,
            dataInTransit: dataInTransitStats,
            keyRotationEnabled: this.config.autoRotateKeys,
            keyRotationInterval: this.config.keyRotationInterval
        };
    }

    /**
     * Increment metric counter
     */
    incrementMetric(metric) {
        if (this.config.enableMetrics) {
            this.metrics[metric] = (this.metrics[metric] || 0) + 1;
        }
    }

    /**
     * Export keys for backup
     */
    async exportKeys(masterPassword) {
        const keys = this.dataAtRest.listKeys();
        const exportedKeys = [];

        for (const keyInfo of keys) {
            try {
                const exported = this.dataAtRest.exportKey(keyInfo.id, masterPassword);
                exportedKeys.push({
                    ...keyInfo,
                    exportData: exported
                });
            } catch (error) {
                console.error(`Failed to export key ${keyInfo.id}:`, error);
            }
        }

        return {
            keys: exportedKeys,
            exportedAt: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Import keys from backup
     */
    async importKeys(backup, masterPassword) {
        const imported = [];
        const failed = [];

        for (const keyBackup of backup.keys) {
            try {
                const keyId = this.dataAtRest.importKey(keyBackup.exportData, masterPassword);
                imported.push(keyId);
            } catch (error) {
                failed.push({
                    keyId: keyBackup.id,
                    error: error.message
                });
            }
        }

        return {
            imported,
            failed,
            importedAt: Date.now()
        };
    }

    /**
     * Health check
     */
    async healthCheck() {
        const issues = [];
        const warnings = [];

        // Check if encryption keys exist
        if (this.dataAtRest.keys.size === 0) {
            issues.push('No encryption keys available');
        }

        // Check key rotation status
        if (this.dataAtRest.isKeyRotationNeeded()) {
            warnings.push('Encryption key needs rotation');
        }

        // Check certificate expiration
        for (const [domain, cert] of this.dataInTransit.certificates.entries()) {
            const expiration = this.dataInTransit.checkCertificateExpiration(cert);
            if (expiration.expired) {
                issues.push(`Certificate for ${domain} has expired`);
            } else if (expiration.warningThreshold) {
                warnings.push(`Certificate for ${domain} expires in ${expiration.daysUntilExpiration} days`);
            }
        }

        return {
            healthy: issues.length === 0,
            issues,
            warnings,
            checkedAt: Date.now()
        };
    }

    /**
     * Cleanup old keys and sessions
     */
    async cleanup() {
        // Cleanup data at rest keys
        this.dataAtRest.cleanup();

        // Cleanup data in transit sessions
        this.dataInTransit.cleanupExpiredSessions();

        console.log('[ENCRYPTION] Cleanup completed');
    }

    /**
     * Express middleware for automatic field encryption
     */
    fieldEncryptionMiddleware(encryptedFields = []) {
        return (req, res, next) => {
            // Encrypt request body fields
            if (req.body && encryptedFields.length > 0) {
                req.body = this.encryptFields(req.body, encryptedFields);
            }

            // Override res.json to decrypt fields in response
            const originalJson = res.json;
            res.json = (data) => {
                if (data && encryptedFields.length > 0) {
                    const decrypted = this.decryptFields(data, encryptedFields);
                    return originalJson.call(res, decrypted);
                }
                return originalJson.call(res, data);
            };

            next();
        };
    }

    /**
     * Shutdown encryption service
     */
    async shutdown() {
        this.stopKeyRotationScheduler();
        await this.cleanup();
        console.log('[ENCRYPTION] Service shutdown completed');
    }
}

module.exports = {
    EncryptionService,
    DataAtRestEncryption,
    DataInTransitEncryption
};