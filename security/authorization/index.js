/**
 * Authorization Module Index
 * Combines RBAC and Policy-Based Access Control
 */

const RBACService = require('./rbac');
const PolicyEngine = require('./policy-engine');

class AuthorizationService {
    constructor(config = {}) {
        this.config = {
            mode: config.mode || 'hybrid', // 'rbac', 'policy', 'hybrid'
            defaultDecision: config.defaultDecision || 'deny',
            combiningAlgorithm: config.combiningAlgorithm || 'rbac-first',
            ...config
        };

        // Initialize services
        this.rbac = new RBACService(config.rbac || {});
        this.policy = new PolicyEngine(config.policy || {});
        
        // Decision log
        this.decisions = [];
    }

    /**
     * Main authorization check
     */
    async authorize(subject, resource, action, context = {}) {
        const request = {
            subject,
            resource,
            action,
            timestamp: Date.now()
        };

        let decision;

        switch (this.config.mode) {
            case 'rbac':
                decision = this.authorizeRBAC(subject, resource, action, context);
                break;
            
            case 'policy':
                decision = await this.authorizePolicy(request, context);
                break;
            
            case 'hybrid':
                decision = await this.authorizeHybrid(request, context);
                break;
            
            default:
                throw new Error(`Unknown authorization mode: ${this.config.mode}`);
        }

        // Log decision
        this.logDecision(request, decision, context);

        return decision;
    }

    /**
     * RBAC-only authorization
     */
    authorizeRBAC(subject, resource, action, context) {
        const userId = subject.id || subject.sub;
        const permission = this.buildPermissionString(resource, action);
        const scope = context.scope || 'global';

        const hasPermission = this.rbac.hasPermission(userId, permission, scope, context);

        return {
            decision: hasPermission ? 'permit' : 'deny',
            reason: hasPermission ? 'RBAC permission granted' : 'RBAC permission denied',
            method: 'rbac',
            details: {
                userId,
                permission,
                scope,
                userRoles: Array.from(this.rbac.getUserRoles(userId, scope)),
                userPermissions: Array.from(this.rbac.getUserPermissions(userId, scope))
            }
        };
    }

    /**
     * Policy-only authorization
     */
    async authorizePolicy(request, context) {
        const decision = await this.policy.evaluate(request, context);
        
        return {
            ...decision,
            method: 'policy'
        };
    }

    /**
     * Hybrid authorization combining RBAC and policies
     */
    async authorizeHybrid(request, context) {
        const rbacDecision = this.authorizeRBAC(
            request.subject, 
            request.resource, 
            request.action, 
            context
        );

        const policyDecision = await this.authorizePolicy(request, context);

        return this.combineDecisions(rbacDecision, policyDecision);
    }

    /**
     * Combine RBAC and policy decisions
     */
    combineDecisions(rbacDecision, policyDecision) {
        const decisions = [rbacDecision, policyDecision];
        
        switch (this.config.combiningAlgorithm) {
            case 'rbac-first':
                if (rbacDecision.decision === 'permit') {
                    return {
                        ...rbacDecision,
                        method: 'hybrid-rbac-first',
                        policyChecked: false
                    };
                }
                return {
                    ...policyDecision,
                    method: 'hybrid-rbac-first',
                    rbacResult: rbacDecision.decision,
                    fallbackToPolicy: true
                };

            case 'policy-first':
                if (policyDecision.decision === 'permit') {
                    return {
                        ...policyDecision,
                        method: 'hybrid-policy-first',
                        rbacChecked: false
                    };
                }
                return {
                    ...rbacDecision,
                    method: 'hybrid-policy-first',
                    policyResult: policyDecision.decision,
                    fallbackToRBAC: true
                };

            case 'permit-overrides':
                const permitDecision = decisions.find(d => d.decision === 'permit');
                return permitDecision || {
                    decision: 'deny',
                    reason: 'Both RBAC and policy denied',
                    method: 'hybrid-permit-overrides',
                    rbacResult: rbacDecision.decision,
                    policyResult: policyDecision.decision
                };

            case 'deny-overrides':
                const denyDecision = decisions.find(d => d.decision === 'deny');
                return denyDecision || {
                    decision: 'permit',
                    reason: 'Both RBAC and policy permitted',
                    method: 'hybrid-deny-overrides',
                    rbacResult: rbacDecision.decision,
                    policyResult: policyDecision.decision
                };

            case 'unanimous':
                if (rbacDecision.decision === policyDecision.decision) {
                    return {
                        decision: rbacDecision.decision,
                        reason: `Unanimous ${rbacDecision.decision}`,
                        method: 'hybrid-unanimous',
                        rbacResult: rbacDecision.decision,
                        policyResult: policyDecision.decision
                    };
                }
                return {
                    decision: this.config.defaultDecision,
                    reason: 'RBAC and policy decisions conflict',
                    method: 'hybrid-unanimous',
                    rbacResult: rbacDecision.decision,
                    policyResult: policyDecision.decision,
                    conflict: true
                };

            default:
                return {
                    decision: this.config.defaultDecision,
                    reason: `Unknown combining algorithm: ${this.config.combiningAlgorithm}`,
                    method: 'hybrid-unknown',
                    rbacResult: rbacDecision.decision,
                    policyResult: policyDecision.decision
                };
        }
    }

    /**
     * Build permission string from resource and action
     */
    buildPermissionString(resource, action) {
        if (typeof resource === 'string' && typeof action === 'string') {
            return `${resource}:${action}`;
        }

        if (typeof resource === 'object' && typeof action === 'object') {
            const resourceType = resource.type || resource.name || 'resource';
            const actionType = action.type || action.name || 'action';
            return `${resourceType}:${actionType}`;
        }

        return 'unknown:unknown';
    }

    /**
     * Check if user has specific role
     */
    hasRole(userId, roleName, scope = 'global') {
        return this.rbac.hasRole(userId, roleName, scope);
    }

    /**
     * Check if user has specific permission
     */
    hasPermission(userId, permission, scope = 'global', context = {}) {
        return this.rbac.hasPermission(userId, permission, scope, context);
    }

    /**
     * Get user roles
     */
    getUserRoles(userId, scope = 'global') {
        return this.rbac.getUserRoles(userId, scope);
    }

    /**
     * Get user permissions
     */
    getUserPermissions(userId, scope = 'global') {
        return this.rbac.getUserPermissions(userId, scope);
    }

    /**
     * Assign role to user
     */
    assignRole(userId, roleName, scope = 'global', metadata = {}) {
        return this.rbac.assignRoleToUser(userId, roleName, scope, metadata);
    }

    /**
     * Remove role from user
     */
    removeRole(userId, roleName, scope = 'global') {
        return this.rbac.removeRoleFromUser(userId, roleName, scope);
    }

    /**
     * Create role
     */
    createRole(roleData) {
        return this.rbac.createRole(roleData);
    }

    /**
     * Create permission
     */
    createPermission(permissionData) {
        return this.rbac.createPermission(permissionData);
    }

    /**
     * Create policy
     */
    createPolicy(policyData) {
        return this.policy.createPolicy(policyData);
    }

    /**
     * Create policy set
     */
    createPolicySet(policySetData) {
        return this.policy.createPolicySet(policySetData);
    }

    /**
     * Batch authorization for multiple requests
     */
    async authorizeBatch(requests) {
        const results = [];
        
        for (const request of requests) {
            try {
                const decision = await this.authorize(
                    request.subject,
                    request.resource,
                    request.action,
                    request.context || {}
                );
                results.push({
                    request: request.id || results.length,
                    decision
                });
            } catch (error) {
                results.push({
                    request: request.id || results.length,
                    error: error.message
                });
            }
        }

        return results;
    }

    /**
     * Get authorization statistics
     */
    getStats() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const recentDecisions = this.decisions.filter(d => d.timestamp > now - oneHour);

        const stats = {
            totalDecisions: this.decisions.length,
            recentDecisions: recentDecisions.length,
            permitRate: 0,
            denyRate: 0,
            methodBreakdown: {},
            rbacStats: {
                roles: this.rbac.roles.size,
                permissions: this.rbac.permissions.size,
                userRoleAssignments: this.rbac.userRoles.size
            },
            policyStats: {
                policies: this.policy.policies.size,
                policySets: this.policy.policySets.size,
                cacheStats: this.policy.getCacheStats()
            }
        };

        if (recentDecisions.length > 0) {
            const permits = recentDecisions.filter(d => d.decision.decision === 'permit').length;
            const denies = recentDecisions.filter(d => d.decision.decision === 'deny').length;
            
            stats.permitRate = permits / recentDecisions.length;
            stats.denyRate = denies / recentDecisions.length;

            // Method breakdown
            const methodCounts = {};
            for (const decision of recentDecisions) {
                const method = decision.decision.method || 'unknown';
                methodCounts[method] = (methodCounts[method] || 0) + 1;
            }
            stats.methodBreakdown = methodCounts;
        }

        return stats;
    }

    /**
     * Log authorization decision
     */
    logDecision(request, decision, context) {
        this.decisions.push({
            request,
            decision,
            context,
            timestamp: Date.now()
        });

        // Keep only last 10000 decisions
        if (this.decisions.length > 10000) {
            this.decisions.shift();
        }
    }

    /**
     * Get recent authorization decisions
     */
    getRecentDecisions(limit = 100) {
        return this.decisions.slice(-limit);
    }

    /**
     * Express middleware for authorization
     */
    middleware(requiredPermission, options = {}) {
        const {
            scope = 'global',
            contextExtractor = (req) => ({
                ip: req.ip,
                userAgent: req.headers['user-agent'],
                timestamp: Date.now()
            }),
            onUnauthorized = (req, res, decision) => {
                res.status(403).json({
                    error: 'Access denied',
                    reason: decision.reason,
                    method: decision.method
                });
            },
            onError = (req, res, error) => {
                res.status(500).json({
                    error: 'Authorization error',
                    message: error.message
                });
            }
        } = options;

        return async (req, res, next) => {
            try {
                const user = req.user;
                if (!user) {
                    return res.status(401).json({ error: 'Authentication required' });
                }

                const context = {
                    ...contextExtractor(req),
                    scope
                };

                const resource = {
                    type: 'api',
                    path: req.path,
                    method: req.method
                };

                const action = {
                    type: requiredPermission || req.method.toLowerCase()
                };

                const decision = await this.authorize(user, resource, action, context);

                if (decision.decision === 'permit') {
                    req.authorizationDecision = decision;
                    next();
                } else {
                    onUnauthorized(req, res, decision);
                }
            } catch (error) {
                onError(req, res, error);
            }
        };
    }

    /**
     * Initialize with default roles and permissions
     */
    initializeDefaults() {
        // Create default roles
        const defaultRoles = [
            {
                name: 'admin',
                displayName: 'Administrator',
                description: 'Full system access',
                category: 'system',
                isSystem: true
            },
            {
                name: 'user',
                displayName: 'User',
                description: 'Basic user access',
                category: 'user'
            },
            {
                name: 'guest',
                displayName: 'Guest',
                description: 'Limited read-only access',
                category: 'user'
            }
        ];

        // Create default permissions
        const defaultPermissions = [
            {
                name: 'system:admin',
                displayName: 'System Administration',
                description: 'Full system administration access',
                resource: 'system',
                action: 'admin'
            },
            {
                name: 'user:read',
                displayName: 'Read Users',
                description: 'Read user information',
                resource: 'user',
                action: 'read'
            },
            {
                name: 'user:write',
                displayName: 'Write Users',
                description: 'Create and update users',
                resource: 'user',
                action: 'write'
            },
            {
                name: 'schedule:read',
                displayName: 'Read Schedules',
                description: 'View schedules',
                resource: 'schedule',
                action: 'read'
            },
            {
                name: 'schedule:write',
                displayName: 'Write Schedules',
                description: 'Create and update schedules',
                resource: 'schedule',
                action: 'write'
            }
        ];

        // Create roles and permissions
        for (const role of defaultRoles) {
            try {
                this.createRole(role);
            } catch (error) {
                // Role might already exist
            }
        }

        for (const permission of defaultPermissions) {
            try {
                this.createPermission(permission);
            } catch (error) {
                // Permission might already exist
            }
        }

        // Assign permissions to roles
        this.rbac.assignPermissionToRole('admin', 'system:admin');
        this.rbac.assignPermissionToRole('admin', 'user:read');
        this.rbac.assignPermissionToRole('admin', 'user:write');
        this.rbac.assignPermissionToRole('admin', 'schedule:read');
        this.rbac.assignPermissionToRole('admin', 'schedule:write');

        this.rbac.assignPermissionToRole('user', 'user:read');
        this.rbac.assignPermissionToRole('user', 'schedule:read');
        this.rbac.assignPermissionToRole('user', 'schedule:write');

        this.rbac.assignPermissionToRole('guest', 'schedule:read');

        // Create role hierarchy
        this.rbac.createRoleHierarchy('admin', 'user');
        this.rbac.createRoleHierarchy('user', 'guest');
    }

    /**
     * Export configuration
     */
    exportConfiguration() {
        return {
            rbac: this.rbac.exportConfiguration(),
            policies: this.policy.exportPolicies(),
            config: this.config
        };
    }

    /**
     * Import configuration
     */
    importConfiguration(config) {
        if (config.rbac) {
            this.rbac.importConfiguration(config.rbac);
        }
        
        if (config.policies) {
            this.policy.importPolicies(config.policies);
        }

        if (config.config) {
            this.config = { ...this.config, ...config.config };
        }
    }
}

module.exports = {
    AuthorizationService,
    RBACService,
    PolicyEngine
};