/**
 * Data at Rest Encryption Service
 * Provides comprehensive encryption for stored data
 */

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class DataAtRestEncryption {
    constructor(config = {}) {
        this.config = {
            algorithm: config.algorithm || 'aes-256-gcm',
            keyDerivationMethod: config.keyDerivationMethod || 'pbkdf2',
            keyLength: config.keyLength || 32,
            ivLength: config.ivLength || 16,
            tagLength: config.tagLength || 16,
            saltLength: config.saltLength || 32,
            iterations: config.iterations || 100000,
            encoding: config.encoding || 'base64',
            keyRotationInterval: config.keyRotationInterval || 30 * 24 * 60 * 60 * 1000, // 30 days
            ...config
        };

        // Key storage (in production, use HSM or key management service)
        this.keys = new Map();
        this.keyHistory = new Map();
        this.currentKeyId = null;
    }

    /**
     * Generate a new encryption key
     */
    generateKey() {
        return crypto.randomBytes(this.config.keyLength);
    }

    /**
     * Derive key from password using PBKDF2
     */
    deriveKeyFromPassword(password, salt) {
        return crypto.pbkdf2Sync(
            password,
            salt,
            this.config.iterations,
            this.config.keyLength,
            'sha256'
        );
    }

    /**
     * Derive key using Argon2 (more secure but requires bcrypt library)
     */
    async deriveKeyFromPasswordArgon2(password, salt) {
        // This would require argon2 library
        // For now, fallback to PBKDF2
        return this.deriveKeyFromPassword(password, salt);
    }

    /**
     * Create new encryption key with metadata
     */
    createEncryptionKey(keyId = null, password = null) {
        const id = keyId || crypto.randomUUID();
        const salt = crypto.randomBytes(this.config.saltLength);
        
        let key;
        if (password) {
            key = this.deriveKeyFromPassword(password, salt);
        } else {
            key = this.generateKey();
        }

        const keyData = {
            id,
            key,
            salt,
            algorithm: this.config.algorithm,
            createdAt: Date.now(),
            rotatedAt: Date.now(),
            version: 1,
            status: 'active'
        };

        this.keys.set(id, keyData);
        
        if (!this.currentKeyId) {
            this.currentKeyId = id;
        }

        return keyData;
    }

    /**
     * Rotate encryption key
     */
    rotateKey(oldKeyId = null) {
        const currentKey = this.keys.get(oldKeyId || this.currentKeyId);
        if (!currentKey) {
            throw new Error('No key to rotate');
        }

        // Mark old key as deprecated
        currentKey.status = 'deprecated';
        currentKey.deprecatedAt = Date.now();

        // Store in history
        this.keyHistory.set(currentKey.id, currentKey);

        // Create new key
        const newKey = this.createEncryptionKey();
        this.currentKeyId = newKey.id;

        return {
            oldKeyId: currentKey.id,
            newKeyId: newKey.id,
            rotatedAt: Date.now()
        };
    }

    /**
     * Encrypt data
     */
    encrypt(data, keyId = null, metadata = {}) {
        const keyData = this.keys.get(keyId || this.currentKeyId);
        if (!keyData) {
            throw new Error('Encryption key not found');
        }

        if (keyData.status !== 'active') {
            throw new Error('Cannot encrypt with inactive key');
        }

        const iv = crypto.randomBytes(this.config.ivLength);
        const cipher = crypto.createCipher(this.config.algorithm, keyData.key, { iv });
        
        let encrypted = cipher.update(data, 'utf8', this.config.encoding);
        encrypted += cipher.final(this.config.encoding);

        const authTag = cipher.getAuthTag();

        const encryptedData = {
            data: encrypted,
            iv: iv.toString(this.config.encoding),
            authTag: authTag.toString(this.config.encoding),
            keyId: keyData.id,
            algorithm: this.config.algorithm,
            metadata,
            encryptedAt: Date.now()
        };

        return JSON.stringify(encryptedData);
    }

    /**
     * Decrypt data
     */
    decrypt(encryptedPayload) {
        const encryptedData = JSON.parse(encryptedPayload);
        const keyData = this.keys.get(encryptedData.keyId) || 
                       this.keyHistory.get(encryptedData.keyId);
        
        if (!keyData) {
            throw new Error('Decryption key not found');
        }

        const decipher = crypto.createDecipher(
            encryptedData.algorithm,
            keyData.key,
            {
                iv: Buffer.from(encryptedData.iv, this.config.encoding)
            }
        );

        decipher.setAuthTag(Buffer.from(encryptedData.authTag, this.config.encoding));

        let decrypted = decipher.update(encryptedData.data, this.config.encoding, 'utf8');
        decrypted += decipher.final('utf8');

        return {
            data: decrypted,
            metadata: encryptedData.metadata,
            keyId: encryptedData.keyId,
            encryptedAt: encryptedData.encryptedAt,
            decryptedAt: Date.now()
        };
    }

    /**
     * Encrypt file
     */
    async encryptFile(inputPath, outputPath = null, keyId = null, metadata = {}) {
        const keyData = this.keys.get(keyId || this.currentKeyId);
        if (!keyData) {
            throw new Error('Encryption key not found');
        }

        const data = await fs.readFile(inputPath);
        const iv = crypto.randomBytes(this.config.ivLength);
        
        const cipher = crypto.createCipher(this.config.algorithm, keyData.key, { iv });
        const encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);

        const authTag = cipher.getAuthTag();

        // Create encrypted file structure
        const encryptedFile = {
            header: {
                version: 1,
                algorithm: this.config.algorithm,
                keyId: keyData.id,
                iv: iv.toString(this.config.encoding),
                authTag: authTag.toString(this.config.encoding),
                metadata,
                encryptedAt: Date.now(),
                originalSize: data.length
            },
            data: encrypted.toString(this.config.encoding)
        };

        const output = outputPath || `${inputPath}.encrypted`;
        await fs.writeFile(output, JSON.stringify(encryptedFile, null, 2));

        return {
            inputPath,
            outputPath: output,
            keyId: keyData.id,
            originalSize: data.length,
            encryptedSize: Buffer.byteLength(JSON.stringify(encryptedFile))
        };
    }

    /**
     * Decrypt file
     */
    async decryptFile(encryptedPath, outputPath = null) {
        const encryptedContent = await fs.readFile(encryptedPath, 'utf8');
        const encryptedFile = JSON.parse(encryptedContent);
        
        const keyData = this.keys.get(encryptedFile.header.keyId) ||
                       this.keyHistory.get(encryptedFile.header.keyId);
        
        if (!keyData) {
            throw new Error('Decryption key not found');
        }

        const decipher = crypto.createDecipher(
            encryptedFile.header.algorithm,
            keyData.key,
            {
                iv: Buffer.from(encryptedFile.header.iv, this.config.encoding)
            }
        );

        decipher.setAuthTag(
            Buffer.from(encryptedFile.header.authTag, this.config.encoding)
        );

        const encryptedData = Buffer.from(encryptedFile.data, this.config.encoding);
        const decrypted = Buffer.concat([
            decipher.update(encryptedData),
            decipher.final()
        ]);

        const output = outputPath || encryptedPath.replace('.encrypted', '');
        await fs.writeFile(output, decrypted);

        return {
            encryptedPath,
            outputPath: output,
            keyId: encryptedFile.header.keyId,
            metadata: encryptedFile.header.metadata,
            originalSize: encryptedFile.header.originalSize,
            decryptedSize: decrypted.length,
            encryptedAt: encryptedFile.header.encryptedAt,
            decryptedAt: Date.now()
        };
    }

    /**
     * Encrypt database field
     */
    encryptField(value, fieldName, keyId = null) {
        if (value === null || value === undefined) {
            return value;
        }

        const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
        const metadata = { fieldName, originalType: typeof value };
        
        return this.encrypt(stringValue, keyId, metadata);
    }

    /**
     * Decrypt database field
     */
    decryptField(encryptedValue, expectedType = 'string') {
        if (!encryptedValue) {
            return encryptedValue;
        }

        try {
            const decrypted = this.decrypt(encryptedValue);
            
            // Convert back to original type if needed
            if (expectedType === 'object' || expectedType === 'array') {
                return JSON.parse(decrypted.data);
            } else if (expectedType === 'number') {
                return Number(decrypted.data);
            } else if (expectedType === 'boolean') {
                return decrypted.data === 'true';
            }
            
            return decrypted.data;
        } catch (error) {
            // If decryption fails, might be unencrypted data
            return encryptedValue;
        }
    }

    /**
     * Batch encrypt multiple fields
     */
    encryptFields(data, encryptedFields, keyId = null) {
        const result = { ...data };
        
        for (const field of encryptedFields) {
            if (result[field] !== undefined) {
                result[field] = this.encryptField(result[field], field, keyId);
            }
        }
        
        return result;
    }

    /**
     * Batch decrypt multiple fields
     */
    decryptFields(data, encryptedFields, fieldTypes = {}) {
        const result = { ...data };
        
        for (const field of encryptedFields) {
            if (result[field] !== undefined) {
                const expectedType = fieldTypes[field] || 'string';
                result[field] = this.decryptField(result[field], expectedType);
            }
        }
        
        return result;
    }

    /**
     * Re-encrypt data with new key (for key rotation)
     */
    reencrypt(encryptedPayload, newKeyId = null) {
        const decrypted = this.decrypt(encryptedPayload);
        return this.encrypt(decrypted.data, newKeyId, decrypted.metadata);
    }

    /**
     * Secure delete of key
     */
    deleteKey(keyId) {
        const keyData = this.keys.get(keyId);
        if (keyData) {
            // Overwrite key data with random bytes
            keyData.key.fill(0);
            crypto.randomFillSync(keyData.key);
            keyData.salt.fill(0);
            crypto.randomFillSync(keyData.salt);
            
            this.keys.delete(keyId);
            
            if (this.currentKeyId === keyId) {
                this.currentKeyId = null;
            }
            
            return true;
        }
        return false;
    }

    /**
     * Check if key rotation is needed
     */
    isKeyRotationNeeded(keyId = null) {
        const keyData = this.keys.get(keyId || this.currentKeyId);
        if (!keyData) {
            return true; // No key exists, rotation needed
        }

        const age = Date.now() - keyData.rotatedAt;
        return age > this.config.keyRotationInterval;
    }

    /**
     * Get key information (without exposing the actual key)
     */
    getKeyInfo(keyId = null) {
        const keyData = this.keys.get(keyId || this.currentKeyId);
        if (!keyData) {
            return null;
        }

        return {
            id: keyData.id,
            algorithm: keyData.algorithm,
            createdAt: keyData.createdAt,
            rotatedAt: keyData.rotatedAt,
            version: keyData.version,
            status: keyData.status,
            deprecatedAt: keyData.deprecatedAt
        };
    }

    /**
     * List all keys (without exposing actual key material)
     */
    listKeys() {
        const keys = [];
        
        for (const [id, keyData] of this.keys.entries()) {
            keys.push(this.getKeyInfo(id));
        }
        
        return keys.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Export key for backup (encrypted with master key)
     */
    exportKey(keyId, masterPassword) {
        const keyData = this.keys.get(keyId);
        if (!keyData) {
            throw new Error('Key not found');
        }

        const salt = crypto.randomBytes(this.config.saltLength);
        const masterKey = this.deriveKeyFromPassword(masterPassword, salt);
        
        const exportData = {
            keyId: keyData.id,
            keyMaterial: keyData.key.toString('hex'),
            salt: keyData.salt.toString('hex'),
            algorithm: keyData.algorithm,
            createdAt: keyData.createdAt,
            version: keyData.version
        };

        const iv = crypto.randomBytes(this.config.ivLength);
        const cipher = crypto.createCipher(this.config.algorithm, masterKey, { iv });
        
        let encrypted = cipher.update(JSON.stringify(exportData), 'utf8', 'base64');
        encrypted += cipher.final('base64');
        
        const authTag = cipher.getAuthTag();

        return {
            encryptedKey: encrypted,
            iv: iv.toString('base64'),
            authTag: authTag.toString('base64'),
            salt: salt.toString('base64'),
            exportedAt: Date.now()
        };
    }

    /**
     * Import key from backup
     */
    importKey(exportedKey, masterPassword) {
        const masterKey = this.deriveKeyFromPassword(
            masterPassword,
            Buffer.from(exportedKey.salt, 'base64')
        );

        const decipher = crypto.createDecipher(
            this.config.algorithm,
            masterKey,
            {
                iv: Buffer.from(exportedKey.iv, 'base64')
            }
        );

        decipher.setAuthTag(Buffer.from(exportedKey.authTag, 'base64'));

        let decrypted = decipher.update(exportedKey.encryptedKey, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        const keyData = JSON.parse(decrypted);
        
        const importedKey = {
            id: keyData.keyId,
            key: Buffer.from(keyData.keyMaterial, 'hex'),
            salt: Buffer.from(keyData.salt, 'hex'),
            algorithm: keyData.algorithm,
            createdAt: keyData.createdAt,
            rotatedAt: Date.now(),
            version: keyData.version,
            status: 'active',
            imported: true,
            importedAt: Date.now()
        };

        this.keys.set(importedKey.id, importedKey);
        
        return importedKey.id;
    }

    /**
     * Cleanup old keys and history
     */
    cleanup(retentionPeriod = 90 * 24 * 60 * 60 * 1000) { // 90 days
        const cutoff = Date.now() - retentionPeriod;
        
        // Clean up key history
        for (const [keyId, keyData] of this.keyHistory.entries()) {
            if (keyData.deprecatedAt && keyData.deprecatedAt < cutoff) {
                // Securely overwrite key data
                keyData.key.fill(0);
                keyData.salt.fill(0);
                this.keyHistory.delete(keyId);
            }
        }

        // Clean up deprecated keys
        for (const [keyId, keyData] of this.keys.entries()) {
            if (keyData.status === 'deprecated' && 
                keyData.deprecatedAt && 
                keyData.deprecatedAt < cutoff) {
                this.deleteKey(keyId);
            }
        }
    }
}

module.exports = DataAtRestEncryption;