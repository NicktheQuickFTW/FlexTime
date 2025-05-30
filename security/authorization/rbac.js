/**
 * Role-Based Access Control (RBAC) Service
 * Provides comprehensive RBAC implementation with hierarchical roles
 */

const { v4: uuidv4 } = require('uuid');

class RBACService {
    constructor(config = {}) {
        this.config = {
            caseSensitive: config.caseSensitive || false,
            allowRoleInheritance: config.allowRoleInheritance !== false,
            maxRoleDepth: config.maxRoleDepth || 5,
            ...config
        };

        // Core RBAC data structures
        this.roles = new Map();
        this.permissions = new Map();
        this.userRoles = new Map();
        this.roleHierarchy = new Map();
        this.rolePermissions = new Map();
    }

    /**
     * Create a new role
     */
    createRole(roleData) {
        const role = {
            id: roleData.id || uuidv4(),
            name: this.normalizeName(roleData.name),
            displayName: roleData.displayName || roleData.name,
            description: roleData.description || '',
            category: roleData.category || 'default',
            isSystem: roleData.isSystem || false,
            metadata: roleData.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (this.roles.has(role.name)) {
            throw new Error(`Role '${role.name}' already exists`);
        }

        this.roles.set(role.name, role);
        this.rolePermissions.set(role.name, new Set());
        this.roleHierarchy.set(role.name, new Set());

        return role;
    }

    /**
     * Create a new permission
     */
    createPermission(permissionData) {
        const permission = {
            id: permissionData.id || uuidv4(),
            name: this.normalizeName(permissionData.name),
            displayName: permissionData.displayName || permissionData.name,
            description: permissionData.description || '',
            resource: permissionData.resource,
            action: permissionData.action,
            scope: permissionData.scope || 'global',
            metadata: permissionData.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        if (this.permissions.has(permission.name)) {
            throw new Error(`Permission '${permission.name}' already exists`);
        }

        this.permissions.set(permission.name, permission);
        return permission;
    }

    /**
     * Assign role to user
     */
    assignRoleToUser(userId, roleName, scope = 'global', metadata = {}) {
        const normalizedRole = this.normalizeName(roleName);
        
        if (!this.roles.has(normalizedRole)) {
            throw new Error(`Role '${roleName}' does not exist`);
        }

        if (!this.userRoles.has(userId)) {
            this.userRoles.set(userId, new Map());
        }

        const userRoleMap = this.userRoles.get(userId);
        const assignmentKey = `${normalizedRole}:${scope}`;

        userRoleMap.set(assignmentKey, {
            role: normalizedRole,
            scope,
            metadata,
            assignedAt: Date.now()
        });

        return true;
    }

    /**
     * Remove role from user
     */
    removeRoleFromUser(userId, roleName, scope = 'global') {
        const normalizedRole = this.normalizeName(roleName);
        const userRoleMap = this.userRoles.get(userId);
        
        if (!userRoleMap) {
            return false;
        }

        const assignmentKey = `${normalizedRole}:${scope}`;
        return userRoleMap.delete(assignmentKey);
    }

    /**
     * Assign permission to role
     */
    assignPermissionToRole(roleName, permissionName) {
        const normalizedRole = this.normalizeName(roleName);
        const normalizedPermission = this.normalizeName(permissionName);

        if (!this.roles.has(normalizedRole)) {
            throw new Error(`Role '${roleName}' does not exist`);
        }

        if (!this.permissions.has(normalizedPermission)) {
            throw new Error(`Permission '${permissionName}' does not exist`);
        }

        const rolePermissions = this.rolePermissions.get(normalizedRole);
        rolePermissions.add(normalizedPermission);

        return true;
    }

    /**
     * Remove permission from role
     */
    removePermissionFromRole(roleName, permissionName) {
        const normalizedRole = this.normalizeName(roleName);
        const normalizedPermission = this.normalizeName(permissionName);

        const rolePermissions = this.rolePermissions.get(normalizedRole);
        if (!rolePermissions) {
            return false;
        }

        return rolePermissions.delete(normalizedPermission);
    }

    /**
     * Create role hierarchy (parent -> child relationship)
     */
    createRoleHierarchy(parentRoleName, childRoleName) {
        const normalizedParent = this.normalizeName(parentRoleName);
        const normalizedChild = this.normalizeName(childRoleName);

        if (!this.roles.has(normalizedParent)) {
            throw new Error(`Parent role '${parentRoleName}' does not exist`);
        }

        if (!this.roles.has(normalizedChild)) {
            throw new Error(`Child role '${childRoleName}' does not exist`);
        }

        // Prevent circular dependencies
        if (this.wouldCreateCircularDependency(normalizedParent, normalizedChild)) {
            throw new Error('Role hierarchy would create circular dependency');
        }

        // Check depth limit
        if (this.getRoleDepth(normalizedChild) >= this.config.maxRoleDepth) {
            throw new Error(`Role hierarchy depth limit (${this.config.maxRoleDepth}) exceeded`);
        }

        const parentHierarchy = this.roleHierarchy.get(normalizedParent);
        parentHierarchy.add(normalizedChild);

        return true;
    }

    /**
     * Remove role hierarchy relationship
     */
    removeRoleHierarchy(parentRoleName, childRoleName) {
        const normalizedParent = this.normalizeName(parentRoleName);
        const normalizedChild = this.normalizeName(childRoleName);

        const parentHierarchy = this.roleHierarchy.get(normalizedParent);
        if (!parentHierarchy) {
            return false;
        }

        return parentHierarchy.delete(normalizedChild);
    }

    /**
     * Check if user has permission
     */
    hasPermission(userId, permissionName, scope = 'global', context = {}) {
        const normalizedPermission = this.normalizeName(permissionName);
        const userPermissions = this.getUserPermissions(userId, scope);

        // Direct permission check
        if (userPermissions.has(normalizedPermission)) {
            return this.evaluatePermissionContext(normalizedPermission, context);
        }

        // Check for wildcard permissions
        for (const permission of userPermissions) {
            if (this.matchesWildcard(permission, normalizedPermission)) {
                return this.evaluatePermissionContext(permission, context);
            }
        }

        return false;
    }

    /**
     * Check if user has role
     */
    hasRole(userId, roleName, scope = 'global') {
        const normalizedRole = this.normalizeName(roleName);
        const userRoles = this.getUserRoles(userId, scope);
        
        return userRoles.has(normalizedRole);
    }

    /**
     * Get all user roles (including inherited)
     */
    getUserRoles(userId, scope = 'global') {
        const userRoleMap = this.userRoles.get(userId);
        const allRoles = new Set();

        if (!userRoleMap) {
            return allRoles;
        }

        // Get direct roles for scope
        for (const [assignmentKey, assignment] of userRoleMap.entries()) {
            if (assignment.scope === scope || scope === '*') {
                allRoles.add(assignment.role);
                
                // Add inherited roles if enabled
                if (this.config.allowRoleInheritance) {
                    this.getInheritedRoles(assignment.role, allRoles);
                }
            }
        }

        return allRoles;
    }

    /**
     * Get all user permissions (from roles and direct assignments)
     */
    getUserPermissions(userId, scope = 'global') {
        const userRoles = this.getUserRoles(userId, scope);
        const allPermissions = new Set();

        // Get permissions from all user roles
        for (const roleName of userRoles) {
            const rolePermissions = this.rolePermissions.get(roleName);
            if (rolePermissions) {
                for (const permission of rolePermissions) {
                    allPermissions.add(permission);
                }
            }
        }

        return allPermissions;
    }

    /**
     * Get inherited roles recursively
     */
    getInheritedRoles(roleName, visited = new Set()) {
        if (visited.has(roleName)) {
            return visited; // Prevent infinite recursion
        }

        visited.add(roleName);
        const childRoles = this.roleHierarchy.get(roleName);

        if (childRoles) {
            for (const childRole of childRoles) {
                this.getInheritedRoles(childRole, visited);
            }
        }

        return visited;
    }

    /**
     * Check if role hierarchy would create circular dependency
     */
    wouldCreateCircularDependency(parentRole, childRole) {
        const childHierarchy = this.roleHierarchy.get(childRole);
        if (!childHierarchy) {
            return false;
        }

        return this.getInheritedRoles(childRole).has(parentRole);
    }

    /**
     * Get role depth in hierarchy
     */
    getRoleDepth(roleName, visited = new Set()) {
        if (visited.has(roleName)) {
            return 0; // Prevent infinite recursion
        }

        visited.add(roleName);
        const childRoles = this.roleHierarchy.get(roleName);
        
        if (!childRoles || childRoles.size === 0) {
            return 0;
        }

        let maxDepth = 0;
        for (const childRole of childRoles) {
            const depth = this.getRoleDepth(childRole, new Set(visited));
            maxDepth = Math.max(maxDepth, depth + 1);
        }

        return maxDepth;
    }

    /**
     * Match permission against wildcard pattern
     */
    matchesWildcard(pattern, permission) {
        // Convert wildcard pattern to regex
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        const regex = new RegExp(`^${regexPattern}$`, this.config.caseSensitive ? '' : 'i');
        return regex.test(permission);
    }

    /**
     * Evaluate permission context (for attribute-based checks)
     */
    evaluatePermissionContext(permissionName, context) {
        const permission = this.permissions.get(permissionName);
        if (!permission || !permission.metadata.contextRules) {
            return true; // No context rules, allow
        }

        // Implement context evaluation logic
        // This is a simplified version - in production, use a proper policy engine
        const rules = permission.metadata.contextRules;
        
        for (const rule of rules) {
            if (!this.evaluateRule(rule, context)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluate a single context rule
     */
    evaluateRule(rule, context) {
        const { field, operator, value } = rule;
        const contextValue = context[field];

        switch (operator) {
            case 'eq':
                return contextValue === value;
            case 'ne':
                return contextValue !== value;
            case 'in':
                return Array.isArray(value) && value.includes(contextValue);
            case 'nin':
                return Array.isArray(value) && !value.includes(contextValue);
            case 'gt':
                return contextValue > value;
            case 'gte':
                return contextValue >= value;
            case 'lt':
                return contextValue < value;
            case 'lte':
                return contextValue <= value;
            case 'exists':
                return (contextValue !== undefined) === value;
            case 'regex':
                return new RegExp(value).test(contextValue);
            default:
                return false;
        }
    }

    /**
     * Normalize role/permission names
     */
    normalizeName(name) {
        return this.config.caseSensitive ? name : name.toLowerCase();
    }

    /**
     * Get role details
     */
    getRole(roleName) {
        const normalizedRole = this.normalizeName(roleName);
        return this.roles.get(normalizedRole);
    }

    /**
     * Get permission details
     */
    getPermission(permissionName) {
        const normalizedPermission = this.normalizeName(permissionName);
        return this.permissions.get(normalizedPermission);
    }

    /**
     * List all roles
     */
    listRoles(filter = {}) {
        const roles = Array.from(this.roles.values());
        
        if (filter.category) {
            return roles.filter(role => role.category === filter.category);
        }
        
        if (filter.system !== undefined) {
            return roles.filter(role => role.isSystem === filter.system);
        }
        
        return roles;
    }

    /**
     * List all permissions
     */
    listPermissions(filter = {}) {
        const permissions = Array.from(this.permissions.values());
        
        if (filter.resource) {
            return permissions.filter(perm => perm.resource === filter.resource);
        }
        
        if (filter.action) {
            return permissions.filter(perm => perm.action === filter.action);
        }
        
        return permissions;
    }

    /**
     * Delete role
     */
    deleteRole(roleName) {
        const normalizedRole = this.normalizeName(roleName);
        const role = this.roles.get(normalizedRole);
        
        if (!role) {
            return false;
        }

        if (role.isSystem) {
            throw new Error('Cannot delete system role');
        }

        // Remove from all users
        for (const [userId, userRoleMap] of this.userRoles.entries()) {
            for (const [assignmentKey, assignment] of userRoleMap.entries()) {
                if (assignment.role === normalizedRole) {
                    userRoleMap.delete(assignmentKey);
                }
            }
        }

        // Remove from role hierarchy
        this.roleHierarchy.delete(normalizedRole);
        for (const [parent, children] of this.roleHierarchy.entries()) {
            children.delete(normalizedRole);
        }

        // Remove role permissions
        this.rolePermissions.delete(normalizedRole);
        
        // Delete the role
        this.roles.delete(normalizedRole);
        
        return true;
    }

    /**
     * Delete permission
     */
    deletePermission(permissionName) {
        const normalizedPermission = this.normalizeName(permissionName);
        
        if (!this.permissions.has(normalizedPermission)) {
            return false;
        }

        // Remove from all roles
        for (const [roleName, permissions] of this.rolePermissions.entries()) {
            permissions.delete(normalizedPermission);
        }

        // Delete the permission
        this.permissions.delete(normalizedPermission);
        
        return true;
    }

    /**
     * Express middleware for RBAC authorization
     */
    middleware(requiredPermission, options = {}) {
        const {
            scope = 'global',
            contextExtractor = (req) => ({}),
            onUnauthorized = (req, res) => {
                res.status(403).json({ error: 'Insufficient permissions' });
            }
        } = options;

        return (req, res, next) => {
            const userId = req.user?.sub || req.user?.id;
            
            if (!userId) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const context = contextExtractor(req);
            const hasPermission = this.hasPermission(userId, requiredPermission, scope, context);
            
            if (!hasPermission) {
                return onUnauthorized(req, res);
            }

            next();
        };
    }

    /**
     * Export RBAC configuration
     */
    exportConfiguration() {
        return {
            roles: Array.from(this.roles.values()),
            permissions: Array.from(this.permissions.values()),
            rolePermissions: Object.fromEntries(
                Array.from(this.rolePermissions.entries()).map(
                    ([role, perms]) => [role, Array.from(perms)]
                )
            ),
            roleHierarchy: Object.fromEntries(
                Array.from(this.roleHierarchy.entries()).map(
                    ([parent, children]) => [parent, Array.from(children)]
                )
            )
        };
    }

    /**
     * Import RBAC configuration
     */
    importConfiguration(config) {
        // Clear existing data
        this.roles.clear();
        this.permissions.clear();
        this.rolePermissions.clear();
        this.roleHierarchy.clear();

        // Import roles
        for (const role of config.roles) {
            this.roles.set(role.name, role);
            this.rolePermissions.set(role.name, new Set());
            this.roleHierarchy.set(role.name, new Set());
        }

        // Import permissions
        for (const permission of config.permissions) {
            this.permissions.set(permission.name, permission);
        }

        // Import role permissions
        for (const [roleName, permissions] of Object.entries(config.rolePermissions)) {
            this.rolePermissions.set(roleName, new Set(permissions));
        }

        // Import role hierarchy
        for (const [parent, children] of Object.entries(config.roleHierarchy)) {
            this.roleHierarchy.set(parent, new Set(children));
        }
    }
}

module.exports = RBACService;