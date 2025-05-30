/**
 * Multi-Factor Authentication (MFA) Service
 * Provides TOTP, SMS, and email-based 2FA implementation
 */

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

class MFAService {
    constructor(config) {
        this.config = {
            issuer: config.issuer || 'Flextime',
            totpWindow: config.totpWindow || 2, // Allow 2 time steps variance
            smsProvider: config.smsProvider, // Twilio, AWS SNS, etc.
            emailProvider: config.emailProvider, // SendGrid, SES, etc.
            backupCodesCount: config.backupCodesCount || 10,
            ...config
        };

        // In production, store in database/Redis
        this.userSecrets = new Map();
        this.pendingVerifications = new Map();
        this.backupCodes = new Map();
    }

    /**
     * Generate TOTP secret for user
     */
    generateTOTPSecret(userId, userEmail) {
        const secret = speakeasy.generateSecret({
            name: `${this.config.issuer} (${userEmail})`,
            issuer: this.config.issuer,
            length: 32
        });

        // Store secret for user
        this.userSecrets.set(userId, {
            secret: secret.base32,
            verified: false,
            createdAt: Date.now()
        });

        return {
            secret: secret.base32,
            qrCodeUrl: secret.otpauth_url
        };
    }

    /**
     * Generate QR code for TOTP setup
     */
    async generateQRCode(userId) {
        const userSecret = this.userSecrets.get(userId);
        if (!userSecret) {
            throw new Error('No TOTP secret found for user');
        }

        const otpauth_url = speakeasy.otpauthURL({
            secret: userSecret.secret,
            label: `${this.config.issuer}`,
            issuer: this.config.issuer,
            encoding: 'base32'
        });

        const qrCodeDataUrl = await QRCode.toDataURL(otpauth_url);
        return qrCodeDataUrl;
    }

    /**
     * Verify TOTP token
     */
    verifyTOTP(userId, token) {
        const userSecret = this.userSecrets.get(userId);
        if (!userSecret) {
            throw new Error('No TOTP secret found for user');
        }

        const verified = speakeasy.totp.verify({
            secret: userSecret.secret,
            encoding: 'base32',
            token: token,
            window: this.config.totpWindow
        });

        if (verified && !userSecret.verified) {
            // Mark TOTP as verified for first-time setup
            userSecret.verified = true;
            this.generateBackupCodes(userId);
        }

        return verified;
    }

    /**
     * Generate backup codes
     */
    generateBackupCodes(userId) {
        const codes = [];
        for (let i = 0; i < this.config.backupCodesCount; i++) {
            codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
        }

        this.backupCodes.set(userId, {
            codes: codes.map(code => ({ code, used: false })),
            generatedAt: Date.now()
        });

        return codes;
    }

    /**
     * Verify backup code
     */
    verifyBackupCode(userId, code) {
        const userBackupCodes = this.backupCodes.get(userId);
        if (!userBackupCodes) {
            return false;
        }

        const codeEntry = userBackupCodes.codes.find(
            entry => entry.code === code.toUpperCase() && !entry.used
        );

        if (codeEntry) {
            codeEntry.used = true;
            return true;
        }

        return false;
    }

    /**
     * Send SMS verification code
     */
    async sendSMSCode(userId, phoneNumber) {
        const code = this.generateNumericCode(6);
        const verificationId = uuidv4();

        // Store pending verification
        this.pendingVerifications.set(verificationId, {
            userId,
            code,
            type: 'sms',
            phoneNumber,
            expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
            attempts: 0
        });

        // Send SMS using configured provider
        if (this.config.smsProvider) {
            await this.config.smsProvider.send(phoneNumber, 
                `Your ${this.config.issuer} verification code is: ${code}`
            );
        }

        return { verificationId, expiresIn: 600 };
    }

    /**
     * Send email verification code
     */
    async sendEmailCode(userId, email) {
        const code = this.generateNumericCode(6);
        const verificationId = uuidv4();

        // Store pending verification
        this.pendingVerifications.set(verificationId, {
            userId,
            code,
            type: 'email',
            email,
            expiresAt: Date.now() + (15 * 60 * 1000), // 15 minutes
            attempts: 0
        });

        // Send email using configured provider
        if (this.config.emailProvider) {
            await this.config.emailProvider.send(email, 
                `${this.config.issuer} Verification Code`,
                `Your verification code is: ${code}`
            );
        }

        return { verificationId, expiresIn: 900 };
    }

    /**
     * Verify SMS/Email code
     */
    verifyCode(verificationId, code) {
        const verification = this.pendingVerifications.get(verificationId);
        
        if (!verification) {
            throw new Error('Verification not found');
        }

        if (Date.now() > verification.expiresAt) {
            this.pendingVerifications.delete(verificationId);
            throw new Error('Verification code expired');
        }

        verification.attempts++;

        if (verification.attempts > 3) {
            this.pendingVerifications.delete(verificationId);
            throw new Error('Too many verification attempts');
        }

        if (verification.code !== code) {
            throw new Error('Invalid verification code');
        }

        // Clean up successful verification
        this.pendingVerifications.delete(verificationId);
        
        return {
            verified: true,
            userId: verification.userId,
            type: verification.type
        };
    }

    /**
     * Check if user has MFA enabled
     */
    isMFAEnabled(userId) {
        const userSecret = this.userSecrets.get(userId);
        return userSecret && userSecret.verified;
    }

    /**
     * Disable MFA for user
     */
    disableMFA(userId) {
        this.userSecrets.delete(userId);
        this.backupCodes.delete(userId);
        
        // Clean up any pending verifications
        for (const [id, verification] of this.pendingVerifications.entries()) {
            if (verification.userId === userId) {
                this.pendingVerifications.delete(id);
            }
        }
        
        return true;
    }

    /**
     * Get user MFA status
     */
    getMFAStatus(userId) {
        const userSecret = this.userSecrets.get(userId);
        const backupCodes = this.backupCodes.get(userId);
        
        return {
            enabled: userSecret && userSecret.verified,
            totpSetup: !!userSecret,
            backupCodesCount: backupCodes ? 
                backupCodes.codes.filter(c => !c.used).length : 0,
            setupDate: userSecret ? userSecret.createdAt : null
        };
    }

    /**
     * Verify any MFA method (TOTP, backup code, or pending verification)
     */
    verifyMFA(userId, credential, type = 'totp') {
        switch (type) {
            case 'totp':
                return this.verifyTOTP(userId, credential);
            
            case 'backup':
                return this.verifyBackupCode(userId, credential);
            
            case 'sms':
            case 'email':
                // credential should be { verificationId, code }
                return this.verifyCode(credential.verificationId, credential.code);
            
            default:
                throw new Error('Invalid MFA type');
        }
    }

    /**
     * Generate numeric verification code
     */
    generateNumericCode(length = 6) {
        const digits = '0123456789';
        let code = '';
        for (let i = 0; i < length; i++) {
            code += digits[Math.floor(Math.random() * digits.length)];
        }
        return code;
    }

    /**
     * Middleware for Express.js MFA verification
     */
    requireMFA(options = {}) {
        const {
            skipForDisabled = false,
            allowBackupCodes = true
        } = options;

        return (req, res, next) => {
            const userId = req.user?.sub || req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'User not authenticated' });
            }

            const mfaStatus = this.getMFAStatus(userId);
            
            // Skip MFA if not enabled and skipForDisabled is true
            if (!mfaStatus.enabled && skipForDisabled) {
                return next();
            }

            // Check for MFA credentials in request
            const mfaToken = req.headers['x-mfa-token'];
            const mfaType = req.headers['x-mfa-type'] || 'totp';
            
            if (!mfaToken) {
                return res.status(401).json({ 
                    error: 'MFA token required',
                    mfaRequired: true,
                    mfaStatus
                });
            }

            try {
                let verified = false;
                
                if (mfaType === 'backup' && allowBackupCodes) {
                    verified = this.verifyBackupCode(userId, mfaToken);
                } else if (mfaType === 'totp') {
                    verified = this.verifyTOTP(userId, mfaToken);
                } else if (mfaType === 'sms' || mfaType === 'email') {
                    const verificationId = req.headers['x-verification-id'];
                    if (!verificationId) {
                        return res.status(400).json({ error: 'Verification ID required' });
                    }
                    const result = this.verifyCode(verificationId, mfaToken);
                    verified = result.verified;
                }

                if (!verified) {
                    return res.status(401).json({ 
                        error: 'Invalid MFA token',
                        mfaRequired: true 
                    });
                }

                // MFA verified, continue
                req.mfaVerified = true;
                next();
                
            } catch (error) {
                return res.status(401).json({ 
                    error: error.message,
                    mfaRequired: true 
                });
            }
        };
    }

    /**
     * Clean up expired verifications
     */
    cleanup() {
        const now = Date.now();
        
        for (const [id, verification] of this.pendingVerifications.entries()) {
            if (now > verification.expiresAt) {
                this.pendingVerifications.delete(id);
            }
        }
    }
}

module.exports = MFAService;