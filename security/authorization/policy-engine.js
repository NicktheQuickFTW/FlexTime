/**
 * Policy-Based Access Control (PBAC) Engine
 * Provides attribute-based and policy-driven access control
 */

const { v4: uuidv4 } = require('uuid');

class PolicyEngine {
    constructor(config = {}) {
        this.config = {
            defaultDecision: config.defaultDecision || 'deny',
            combiningAlgorithm: config.combiningAlgorithm || 'deny-overrides',
            enableCaching: config.enableCaching !== false,
            cacheSize: config.cacheSize || 1000,
            ...config
        };

        // Policy storage
        this.policies = new Map();
        this.policySets = new Map();
        this.attributes = new Map();
        
        // Decision cache
        this.decisionCache = new Map();
        this.cacheStats = { hits: 0, misses: 0 };
    }

    /**
     * Create a new policy
     */
    createPolicy(policyData) {
        const policy = {
            id: policyData.id || uuidv4(),
            name: policyData.name,
            description: policyData.description || '',
            target: policyData.target || {},
            rules: policyData.rules || [],
            effect: policyData.effect || 'permit', // permit or deny
            condition: policyData.condition || null,
            priority: policyData.priority || 0,
            enabled: policyData.enabled !== false,
            metadata: policyData.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.validatePolicy(policy);
        this.policies.set(policy.id, policy);
        this.clearCache();

        return policy;
    }

    /**
     * Create a policy set (collection of policies)
     */
    createPolicySet(policySetData) {
        const policySet = {
            id: policySetData.id || uuidv4(),
            name: policySetData.name,
            description: policySetData.description || '',
            target: policySetData.target || {},
            policies: policySetData.policies || [],
            combiningAlgorithm: policySetData.combiningAlgorithm || this.config.combiningAlgorithm,
            priority: policySetData.priority || 0,
            enabled: policySetData.enabled !== false,
            metadata: policySetData.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        this.validatePolicySet(policySet);
        this.policySets.set(policySet.id, policySet);
        this.clearCache();

        return policySet;
    }

    /**
     * Evaluate access request against policies
     */
    async evaluate(request, context = {}) {
        const requestKey = this.generateRequestKey(request, context);
        
        // Check cache first
        if (this.config.enableCaching && this.decisionCache.has(requestKey)) {
            this.cacheStats.hits++;
            return this.decisionCache.get(requestKey);
        }

        this.cacheStats.misses++;

        // Build evaluation context
        const evalContext = {
            subject: request.subject || {},
            resource: request.resource || {},
            action: request.action || {},
            environment: request.environment || {},
            ...context
        };

        // Find applicable policies
        const applicablePolicies = this.findApplicablePolicies(evalContext);
        
        // Evaluate policies
        const decision = await this.evaluatePolicies(applicablePolicies, evalContext);

        // Cache the decision
        if (this.config.enableCaching) {
            this.cacheDecision(requestKey, decision);
        }

        return decision;
    }

    /**
     * Find policies applicable to the request
     */
    findApplicablePolicies(context) {
        const applicable = [];

        // Check individual policies
        for (const policy of this.policies.values()) {
            if (this.isPolicyApplicable(policy, context)) {
                applicable.push({ type: 'policy', policy });
            }
        }

        // Check policy sets
        for (const policySet of this.policySets.values()) {
            if (this.isPolicySetApplicable(policySet, context)) {
                const setApplicable = [];
                for (const policyId of policySet.policies) {
                    const policy = this.policies.get(policyId);
                    if (policy && this.isPolicyApplicable(policy, context)) {
                        setApplicable.push(policy);
                    }
                }
                if (setApplicable.length > 0) {
                    applicable.push({ 
                        type: 'policySet', 
                        policySet, 
                        policies: setApplicable 
                    });
                }
            }
        }

        // Sort by priority
        return applicable.sort((a, b) => {
            const priorityA = a.policy?.priority || a.policySet?.priority || 0;
            const priorityB = b.policy?.priority || b.policySet?.priority || 0;
            return priorityB - priorityA; // Higher priority first
        });
    }

    /**
     * Check if policy is applicable to context
     */
    isPolicyApplicable(policy, context) {
        if (!policy.enabled) {
            return false;
        }

        return this.matchesTarget(policy.target, context);
    }

    /**
     * Check if policy set is applicable to context
     */
    isPolicySetApplicable(policySet, context) {
        if (!policySet.enabled) {
            return false;
        }

        return this.matchesTarget(policySet.target, context);
    }

    /**
     * Check if context matches target criteria
     */
    matchesTarget(target, context) {
        if (!target || Object.keys(target).length === 0) {
            return true; // Empty target matches everything
        }

        for (const [attribute, matcher] of Object.entries(target)) {
            if (!this.matchesAttribute(attribute, matcher, context)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if attribute matches criteria
     */
    matchesAttribute(attributePath, matcher, context) {
        const value = this.getAttributeValue(attributePath, context);
        
        if (typeof matcher === 'string' || typeof matcher === 'number' || typeof matcher === 'boolean') {
            return value === matcher;
        }

        if (Array.isArray(matcher)) {
            return matcher.includes(value);
        }

        if (typeof matcher === 'object' && matcher !== null) {
            return this.evaluateAttributeMatcher(value, matcher);
        }

        return false;
    }

    /**
     * Get attribute value from context using dot notation
     */
    getAttributeValue(path, context) {
        const parts = path.split('.');
        let current = context;

        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            } else {
                return undefined;
            }
        }

        return current;
    }

    /**
     * Evaluate attribute matcher
     */
    evaluateAttributeMatcher(value, matcher) {
        if (matcher.eq !== undefined) {
            return value === matcher.eq;
        }

        if (matcher.ne !== undefined) {
            return value !== matcher.ne;
        }

        if (matcher.in !== undefined) {
            return Array.isArray(matcher.in) && matcher.in.includes(value);
        }

        if (matcher.nin !== undefined) {
            return Array.isArray(matcher.nin) && !matcher.nin.includes(value);
        }

        if (matcher.gt !== undefined) {
            return value > matcher.gt;
        }

        if (matcher.gte !== undefined) {
            return value >= matcher.gte;
        }

        if (matcher.lt !== undefined) {
            return value < matcher.lt;
        }

        if (matcher.lte !== undefined) {
            return value <= matcher.lte;
        }

        if (matcher.regex !== undefined) {
            return new RegExp(matcher.regex).test(value);
        }

        if (matcher.exists !== undefined) {
            return (value !== undefined) === matcher.exists;
        }

        if (matcher.startsWith !== undefined) {
            return typeof value === 'string' && value.startsWith(matcher.startsWith);
        }

        if (matcher.endsWith !== undefined) {
            return typeof value === 'string' && value.endsWith(matcher.endsWith);
        }

        if (matcher.contains !== undefined) {
            return typeof value === 'string' && value.includes(matcher.contains);
        }

        return false;
    }

    /**
     * Evaluate applicable policies
     */
    async evaluatePolicies(applicablePolicies, context) {
        if (applicablePolicies.length === 0) {
            return {
                decision: this.config.defaultDecision,
                reason: 'No applicable policies found',
                obligations: [],
                advice: []
            };
        }

        const decisions = [];

        for (const item of applicablePolicies) {
            if (item.type === 'policy') {
                const decision = await this.evaluatePolicy(item.policy, context);
                decisions.push(decision);
            } else if (item.type === 'policySet') {
                const decision = await this.evaluatePolicySet(item.policySet, item.policies, context);
                decisions.push(decision);
            }
        }

        return this.combineDecisions(decisions, this.config.combiningAlgorithm);
    }

    /**
     * Evaluate a single policy
     */
    async evaluatePolicy(policy, context) {
        // Evaluate policy condition if present
        if (policy.condition && !this.evaluateCondition(policy.condition, context)) {
            return {
                decision: 'not-applicable',
                reason: 'Policy condition not met',
                policy: policy.id
            };
        }

        // Evaluate policy rules
        const ruleDecisions = [];
        for (const rule of policy.rules) {
            const ruleDecision = await this.evaluateRule(rule, context);
            ruleDecisions.push(ruleDecision);
        }

        // If no rules, policy effect applies directly
        if (ruleDecisions.length === 0) {
            return {
                decision: policy.effect,
                reason: `Policy ${policy.name} has no rules`,
                policy: policy.id,
                obligations: policy.obligations || [],
                advice: policy.advice || []
            };
        }

        // Combine rule decisions
        const combinedDecision = this.combineDecisions(ruleDecisions, 'first-applicable');
        
        return {
            ...combinedDecision,
            policy: policy.id
        };
    }

    /**
     * Evaluate a policy set
     */
    async evaluatePolicySet(policySet, policies, context) {
        const policyDecisions = [];

        for (const policy of policies) {
            const decision = await this.evaluatePolicy(policy, context);
            if (decision.decision !== 'not-applicable') {
                policyDecisions.push(decision);
            }
        }

        if (policyDecisions.length === 0) {
            return {
                decision: 'not-applicable',
                reason: 'No applicable policies in set',
                policySet: policySet.id
            };
        }

        const combinedDecision = this.combineDecisions(policyDecisions, policySet.combiningAlgorithm);
        
        return {
            ...combinedDecision,
            policySet: policySet.id
        };
    }

    /**
     * Evaluate a rule
     */
    async evaluateRule(rule, context) {
        if (rule.condition && !this.evaluateCondition(rule.condition, context)) {
            return {
                decision: 'not-applicable',
                reason: 'Rule condition not met',
                rule: rule.id
            };
        }

        return {
            decision: rule.effect || 'permit',
            reason: rule.description || 'Rule matched',
            rule: rule.id,
            obligations: rule.obligations || [],
            advice: rule.advice || []
        };
    }

    /**
     * Evaluate condition expression
     */
    evaluateCondition(condition, context) {
        if (typeof condition === 'boolean') {
            return condition;
        }

        if (typeof condition === 'string') {
            // Simple attribute reference
            return !!this.getAttributeValue(condition, context);
        }

        if (typeof condition === 'object' && condition !== null) {
            return this.evaluateConditionObject(condition, context);
        }

        return false;
    }

    /**
     * Evaluate complex condition object
     */
    evaluateConditionObject(condition, context) {
        // Logical operators
        if (condition.and) {
            return condition.and.every(cond => this.evaluateCondition(cond, context));
        }

        if (condition.or) {
            return condition.or.some(cond => this.evaluateCondition(cond, context));
        }

        if (condition.not) {
            return !this.evaluateCondition(condition.not, context);
        }

        // Comparison operators
        if (condition.attribute) {
            const value = this.getAttributeValue(condition.attribute, context);
            return this.evaluateAttributeMatcher(value, condition);
        }

        return false;
    }

    /**
     * Combine multiple decisions using specified algorithm
     */
    combineDecisions(decisions, algorithm) {
        if (decisions.length === 0) {
            return {
                decision: this.config.defaultDecision,
                reason: 'No decisions to combine'
            };
        }

        const obligations = [];
        const advice = [];

        // Collect obligations and advice
        for (const decision of decisions) {
            if (decision.obligations) {
                obligations.push(...decision.obligations);
            }
            if (decision.advice) {
                advice.push(...decision.advice);
            }
        }

        switch (algorithm) {
            case 'permit-overrides':
                for (const decision of decisions) {
                    if (decision.decision === 'permit') {
                        return {
                            decision: 'permit',
                            reason: 'Permit overrides',
                            obligations,
                            advice
                        };
                    }
                }
                return {
                    decision: 'deny',
                    reason: 'No permit found',
                    obligations,
                    advice
                };

            case 'deny-overrides':
                for (const decision of decisions) {
                    if (decision.decision === 'deny') {
                        return {
                            decision: 'deny',
                            reason: 'Deny overrides',
                            obligations,
                            advice
                        };
                    }
                }
                for (const decision of decisions) {
                    if (decision.decision === 'permit') {
                        return {
                            decision: 'permit',
                            reason: 'Permit found, no deny',
                            obligations,
                            advice
                        };
                    }
                }
                return {
                    decision: this.config.defaultDecision,
                    reason: 'No applicable decisions',
                    obligations,
                    advice
                };

            case 'first-applicable':
                const firstApplicable = decisions.find(d => d.decision !== 'not-applicable');
                return firstApplicable || {
                    decision: this.config.defaultDecision,
                    reason: 'No applicable decision found',
                    obligations,
                    advice
                };

            case 'only-one-applicable':
                const applicable = decisions.filter(d => d.decision !== 'not-applicable');
                if (applicable.length === 1) {
                    return applicable[0];
                } else if (applicable.length === 0) {
                    return {
                        decision: this.config.defaultDecision,
                        reason: 'No applicable decisions',
                        obligations,
                        advice
                    };
                } else {
                    return {
                        decision: 'indeterminate',
                        reason: 'Multiple applicable decisions',
                        obligations,
                        advice
                    };
                }

            default:
                return {
                    decision: this.config.defaultDecision,
                    reason: `Unknown combining algorithm: ${algorithm}`,
                    obligations,
                    advice
                };
        }
    }

    /**
     * Validate policy structure
     */
    validatePolicy(policy) {
        if (!policy.name) {
            throw new Error('Policy name is required');
        }

        if (!['permit', 'deny'].includes(policy.effect)) {
            throw new Error('Policy effect must be "permit" or "deny"');
        }

        if (policy.rules) {
            for (const rule of policy.rules) {
                this.validateRule(rule);
            }
        }
    }

    /**
     * Validate policy set structure
     */
    validatePolicySet(policySet) {
        if (!policySet.name) {
            throw new Error('Policy set name is required');
        }

        if (!policySet.policies || !Array.isArray(policySet.policies)) {
            throw new Error('Policy set must contain an array of policy IDs');
        }
    }

    /**
     * Validate rule structure
     */
    validateRule(rule) {
        if (rule.effect && !['permit', 'deny'].includes(rule.effect)) {
            throw new Error('Rule effect must be "permit" or "deny"');
        }
    }

    /**
     * Generate cache key for request
     */
    generateRequestKey(request, context) {
        return JSON.stringify({ request, context });
    }

    /**
     * Cache decision
     */
    cacheDecision(key, decision) {
        if (this.decisionCache.size >= this.config.cacheSize) {
            // Remove oldest entry (simple LRU)
            const firstKey = this.decisionCache.keys().next().value;
            this.decisionCache.delete(firstKey);
        }

        this.decisionCache.set(key, {
            ...decision,
            cachedAt: Date.now()
        });
    }

    /**
     * Clear decision cache
     */
    clearCache() {
        this.decisionCache.clear();
        this.cacheStats = { hits: 0, misses: 0 };
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        const total = this.cacheStats.hits + this.cacheStats.misses;
        return {
            ...this.cacheStats,
            hitRate: total > 0 ? this.cacheStats.hits / total : 0,
            size: this.decisionCache.size
        };
    }

    /**
     * Delete policy
     */
    deletePolicy(policyId) {
        const deleted = this.policies.delete(policyId);
        if (deleted) {
            this.clearCache();
        }
        return deleted;
    }

    /**
     * Delete policy set
     */
    deletePolicySet(policySetId) {
        const deleted = this.policySets.delete(policySetId);
        if (deleted) {
            this.clearCache();
        }
        return deleted;
    }

    /**
     * Update policy
     */
    updatePolicy(policyId, updates) {
        const policy = this.policies.get(policyId);
        if (!policy) {
            throw new Error('Policy not found');
        }

        const updatedPolicy = {
            ...policy,
            ...updates,
            updatedAt: Date.now()
        };

        this.validatePolicy(updatedPolicy);
        this.policies.set(policyId, updatedPolicy);
        this.clearCache();

        return updatedPolicy;
    }

    /**
     * Update policy set
     */
    updatePolicySet(policySetId, updates) {
        const policySet = this.policySets.get(policySetId);
        if (!policySet) {
            throw new Error('Policy set not found');
        }

        const updatedPolicySet = {
            ...policySet,
            ...updates,
            updatedAt: Date.now()
        };

        this.validatePolicySet(updatedPolicySet);
        this.policySets.set(policySetId, updatedPolicySet);
        this.clearCache();

        return updatedPolicySet;
    }

    /**
     * Export all policies and policy sets
     */
    exportPolicies() {
        return {
            policies: Array.from(this.policies.values()),
            policySets: Array.from(this.policySets.values())
        };
    }

    /**
     * Import policies and policy sets
     */
    importPolicies(data) {
        if (data.policies) {
            for (const policy of data.policies) {
                this.policies.set(policy.id, policy);
            }
        }

        if (data.policySets) {
            for (const policySet of data.policySets) {
                this.policySets.set(policySet.id, policySet);
            }
        }

        this.clearCache();
    }

    /**
     * Express middleware for policy-based authorization
     */
    middleware(options = {}) {
        const {
            contextExtractor = (req) => ({
                subject: req.user || {},
                resource: { path: req.path, method: req.method },
                action: { type: req.method.toLowerCase() },
                environment: { 
                    timestamp: Date.now(),
                    ip: req.ip,
                    userAgent: req.headers['user-agent']
                }
            }),
            onDeny = (req, res, decision) => {
                res.status(403).json({ 
                    error: 'Access denied',
                    reason: decision.reason 
                });
            },
            onError = (req, res, error) => {
                res.status(500).json({ 
                    error: 'Policy evaluation error',
                    message: error.message 
                });
            }
        } = options;

        return async (req, res, next) => {
            try {
                const context = contextExtractor(req);
                const decision = await this.evaluate(context.resource, context);

                if (decision.decision === 'permit') {
                    // Attach obligations and advice to request
                    req.policyDecision = decision;
                    next();
                } else {
                    onDeny(req, res, decision);
                }
            } catch (error) {
                onError(req, res, error);
            }
        };
    }
}

module.exports = PolicyEngine;