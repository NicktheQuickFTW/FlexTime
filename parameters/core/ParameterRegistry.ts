const logger = require('/Users/nickw/Documents/GitHub/Flextime/FlexTime/utils/logger.js');
import {
  Constraint,
  ConstraintType,
  ConstraintPriority,
  ConstraintMetadata,
  ConstraintDependency,
  ConstraintGroup
} from '../types';

/**
 * Central registry for all constraints
 */
export class ConstraintRegistry {
  private logger: any;
  private constraints: Map<string, Constraint>;
  private constraintsByType: Map<ConstraintType, Set<string>>;
  private constraintsByPriority: Map<ConstraintPriority, Set<string>>;
  private constraintGroups: Map<string, ConstraintGroup>;
  private dependencies: Map<string, ConstraintDependency[]>;
  private metadata: Map<string, ConstraintMetadata>;
  private isInitialized: boolean;

  constructor(options: {
    logLevel?: string;
  } = {}) {
    this.logger = logger;

    this.constraints = new Map();
    this.constraintsByType = new Map();
    this.constraintsByPriority = new Map();
    this.constraintGroups = new Map();
    this.dependencies = new Map();
    this.metadata = new Map();
    this.isInitialized = false;

    this.logger.info('ConstraintRegistry initialized');
  }

  /**
   * Initialize the registry with default constraints
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('Registry already initialized');
      return;
    }

    try {
      // Initialize type and priority maps
      this._initializeMaps();
      
      // Load built-in constraints
      await this._loadBuiltInConstraints();
      
      // Validate dependencies
      this._validateDependencies();
      
      this.isInitialized = true;
      this.logger.info('Registry initialization complete', {
        totalConstraints: this.constraints.size,
        groups: this.constraintGroups.size
      });
    } catch (error) {
      this.logger.error('Failed to initialize registry', { error });
      throw error;
    }
  }

  /**
   * Register a constraint
   */
  public register(constraint: Constraint): void {
    if (!constraint.id || !constraint.type) {
      throw new Error('Constraint must have id and type');
    }

    // Check for duplicate
    if (this.constraints.has(constraint.id)) {
      throw new Error(`Constraint already registered: ${constraint.id}`);
    }

    try {
      // Validate constraint
      this._validateConstraint(constraint);

      // Store constraint
      this.constraints.set(constraint.id, constraint);

      // Update type index
      const typeSet = this.constraintsByType.get(constraint.type) || new Set();
      typeSet.add(constraint.id);
      this.constraintsByType.set(constraint.type, typeSet);

      // Update priority index
      const prioritySet = this.constraintsByPriority.get(constraint.priority) || new Set();
      prioritySet.add(constraint.id);
      this.constraintsByPriority.set(constraint.priority, prioritySet);

      // Store metadata
      if (constraint.metadata) {
        this.metadata.set(constraint.id, constraint.metadata);
      }

      // Register dependencies
      if (constraint.dependencies) {
        this.dependencies.set(constraint.id, constraint.dependencies);
      }

      this.logger.info('Constraint registered', {
        id: constraint.id,
        type: constraint.type,
        priority: constraint.priority
      });
    } catch (error) {
      this.logger.error('Failed to register constraint', {
        constraintId: constraint.id,
        error
      });
      throw error;
    }
  }

  /**
   * Unregister a constraint
   */
  public unregister(constraintId: string): boolean {
    const constraint = this.constraints.get(constraintId);
    if (!constraint) {
      this.logger.warn('Constraint not found for unregistration', { constraintId });
      return false;
    }

    try {
      // Check for dependent constraints
      const dependents = this._findDependentConstraints(constraintId);
      if (dependents.length > 0) {
        throw new Error(
          `Cannot unregister: ${dependents.length} constraints depend on ${constraintId}`
        );
      }

      // Remove from all indexes
      this.constraints.delete(constraintId);
      
      const typeSet = this.constraintsByType.get(constraint.type);
      if (typeSet) {
        typeSet.delete(constraintId);
      }

      const prioritySet = this.constraintsByPriority.get(constraint.priority);
      if (prioritySet) {
        prioritySet.delete(constraintId);
      }

      this.metadata.delete(constraintId);
      this.dependencies.delete(constraintId);

      // Remove from groups
      for (const [groupId, group] of this.constraintGroups) {
        group.constraintIds = group.constraintIds.filter(id => id !== constraintId);
      }

      this.logger.info('Constraint unregistered', { constraintId });
      return true;
    } catch (error) {
      this.logger.error('Failed to unregister constraint', {
        constraintId,
        error
      });
      throw error;
    }
  }

  /**
   * Get a constraint by ID
   */
  public get(constraintId: string): Constraint | undefined {
    return this.constraints.get(constraintId);
  }

  /**
   * Get all constraints
   */
  public getAll(): Constraint[] {
    return Array.from(this.constraints.values());
  }

  /**
   * Get constraints by type
   */
  public getByType(type: ConstraintType): Constraint[] {
    const ids = this.constraintsByType.get(type) || new Set();
    return Array.from(ids)
      .map(id => this.constraints.get(id))
      .filter((c): c is Constraint => c !== undefined);
  }

  /**
   * Get constraints by priority
   */
  public getByPriority(priority: ConstraintPriority): Constraint[] {
    const ids = this.constraintsByPriority.get(priority) || new Set();
    return Array.from(ids)
      .map(id => this.constraints.get(id))
      .filter((c): c is Constraint => c !== undefined);
  }

  /**
   * Get constraints by group
   */
  public getByGroup(groupId: string): Constraint[] {
    const group = this.constraintGroups.get(groupId);
    if (!group) {
      return [];
    }

    return group.constraintIds
      .map(id => this.constraints.get(id))
      .filter((c): c is Constraint => c !== undefined);
  }

  /**
   * Create a constraint group
   */
  public createGroup(group: ConstraintGroup): void {
    if (this.constraintGroups.has(group.id)) {
      throw new Error(`Group already exists: ${group.id}`);
    }

    // Validate all constraints exist
    for (const constraintId of group.constraintIds) {
      if (!this.constraints.has(constraintId)) {
        throw new Error(`Constraint not found: ${constraintId}`);
      }
    }

    this.constraintGroups.set(group.id, group);
    this.logger.info('Constraint group created', {
      groupId: group.id,
      constraintCount: group.constraintIds.length
    });
  }

  /**
   * Delete a constraint group
   */
  public deleteGroup(groupId: string): boolean {
    const deleted = this.constraintGroups.delete(groupId);
    if (deleted) {
      this.logger.info('Constraint group deleted', { groupId });
    }
    return deleted;
  }

  /**
   * Get constraint dependencies
   */
  public getDependencies(constraintId: string): ConstraintDependency[] {
    return this.dependencies.get(constraintId) || [];
  }

  /**
   * Get dependent constraints
   */
  public getDependents(constraintId: string): string[] {
    return this._findDependentConstraints(constraintId);
  }

  /**
   * Check if a constraint has dependencies
   */
  public hasDependencies(constraintId: string): boolean {
    const deps = this.dependencies.get(constraintId);
    return deps !== undefined && deps.length > 0;
  }

  /**
   * Get constraint metadata
   */
  public getMetadata(constraintId: string): ConstraintMetadata | undefined {
    return this.metadata.get(constraintId);
  }

  /**
   * Update constraint metadata
   */
  public updateMetadata(
    constraintId: string,
    metadata: Partial<ConstraintMetadata>
  ): void {
    const existing = this.metadata.get(constraintId) || {};
    this.metadata.set(constraintId, { ...existing, ...metadata });
    this.logger.info('Constraint metadata updated', { constraintId });
  }

  /**
   * Get registry statistics
   */
  public getStats(): {
    totalConstraints: number;
    byType: Record<ConstraintType, number>;
    byPriority: Record<ConstraintPriority, number>;
    groups: number;
    withDependencies: number;
  } {
    const stats = {
      totalConstraints: this.constraints.size,
      byType: {} as Record<ConstraintType, number>,
      byPriority: {} as Record<ConstraintPriority, number>,
      groups: this.constraintGroups.size,
      withDependencies: 0
    };

    // Count by type
    for (const [type, ids] of this.constraintsByType) {
      stats.byType[type] = ids.size;
    }

    // Count by priority
    for (const [priority, ids] of this.constraintsByPriority) {
      stats.byPriority[priority] = ids.size;
    }

    // Count constraints with dependencies
    for (const [, deps] of this.dependencies) {
      if (deps.length > 0) {
        stats.withDependencies++;
      }
    }

    return stats;
  }

  /**
   * Export registry as JSON
   */
  public export(): {
    constraints: Array<Constraint & { dependencies?: ConstraintDependency[] }>;
    groups: ConstraintGroup[];
    metadata: Record<string, ConstraintMetadata>;
  } {
    const constraints = Array.from(this.constraints.values()).map(c => ({
      ...c,
      dependencies: this.dependencies.get(c.id)
    }));

    const groups = Array.from(this.constraintGroups.values());
    const metadata: Record<string, ConstraintMetadata> = {};
    
    for (const [id, meta] of this.metadata) {
      metadata[id] = meta;
    }

    return { constraints, groups, metadata };
  }

  /**
   * Import constraints from JSON
   */
  public import(data: {
    constraints: Array<Constraint & { dependencies?: ConstraintDependency[] }>;
    groups?: ConstraintGroup[];
  }): void {
    try {
      // Clear existing data
      this.clear();

      // Import constraints
      for (const constraint of data.constraints) {
        const { dependencies, ...constraintData } = constraint;
        this.register(constraintData);
        
        if (dependencies) {
          this.dependencies.set(constraint.id, dependencies);
        }
      }

      // Import groups
      if (data.groups) {
        for (const group of data.groups) {
          this.createGroup(group);
        }
      }

      // Validate after import
      this._validateDependencies();

      this.logger.info('Registry imported', {
        constraints: data.constraints.length,
        groups: data.groups?.length || 0
      });
    } catch (error) {
      this.logger.error('Failed to import registry', { error });
      throw error;
    }
  }

  /**
   * Clear all constraints
   */
  public clear(): void {
    this.constraints.clear();
    this.constraintsByType.clear();
    this.constraintsByPriority.clear();
    this.constraintGroups.clear();
    this.dependencies.clear();
    this.metadata.clear();
    this.isInitialized = false;
    this.logger.info('Registry cleared');
  }

  /**
   * Initialize type and priority maps
   */
  private _initializeMaps(): void {
    // Initialize type map
    const types: ConstraintType[] = [
      'hard', 'soft', 'preference', 'requirement', 'optimization'
    ];
    for (const type of types) {
      this.constraintsByType.set(type, new Set());
    }

    // Initialize priority map
    const priorities: ConstraintPriority[] = [
      'critical', 'high', 'medium', 'low', 'optional'
    ];
    for (const priority of priorities) {
      this.constraintsByPriority.set(priority, new Set());
    }
  }

  /**
   * Load built-in constraints
   */
  private async _loadBuiltInConstraints(): Promise<void> {
    // This is where you'd load default constraints
    // For now, we'll just log
    this.logger.info('Loading built-in constraints');
  }

  /**
   * Validate a constraint
   */
  private _validateConstraint(constraint: Constraint): void {
    // Validate required fields
    if (!constraint.name) {
      throw new Error('Constraint must have a name');
    }

    if (!constraint.evaluate || typeof constraint.evaluate !== 'function') {
      throw new Error('Constraint must have an evaluate function');
    }

    // Validate dependencies
    if (constraint.dependencies) {
      for (const dep of constraint.dependencies) {
        if (!dep.constraintId) {
          throw new Error('Dependency must have constraintId');
        }
        if (!dep.type) {
          throw new Error('Dependency must have type');
        }
      }
    }

    // Validate metadata
    if (constraint.metadata) {
      if (constraint.metadata.timeout && constraint.metadata.timeout < 0) {
        throw new Error('Timeout must be positive');
      }
    }
  }

  /**
   * Validate all dependencies
   */
  private _validateDependencies(): void {
    for (const [constraintId, deps] of this.dependencies) {
      for (const dep of deps) {
        if (!this.constraints.has(dep.constraintId)) {
          throw new Error(
            `Constraint ${constraintId} depends on non-existent constraint ${dep.constraintId}`
          );
        }
      }
    }

    // Check for circular dependencies
    const circular = this._detectCircularDependencies();
    if (circular.length > 0) {
      throw new Error(
        `Circular dependencies detected: ${circular.join(' -> ')}`
      );
    }
  }

  /**
   * Find constraints that depend on a given constraint
   */
  private _findDependentConstraints(constraintId: string): string[] {
    const dependents: string[] = [];

    for (const [id, deps] of this.dependencies) {
      if (deps.some(d => d.constraintId === constraintId)) {
        dependents.push(id);
      }
    }

    return dependents;
  }

  /**
   * Detect circular dependencies
   */
  private _detectCircularDependencies(): string[] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];

    const hasCycle = (constraintId: string): boolean => {
      visited.add(constraintId);
      recursionStack.add(constraintId);
      path.push(constraintId);

      const deps = this.dependencies.get(constraintId) || [];
      for (const dep of deps) {
        if (!visited.has(dep.constraintId)) {
          if (hasCycle(dep.constraintId)) {
            return true;
          }
        } else if (recursionStack.has(dep.constraintId)) {
          // Found cycle
          const cycleStart = path.indexOf(dep.constraintId);
          return true;
        }
      }

      recursionStack.delete(constraintId);
      path.pop();
      return false;
    };

    for (const constraintId of this.constraints.keys()) {
      if (!visited.has(constraintId)) {
        if (hasCycle(constraintId)) {
          return path;
        }
      }
    }

    return [];
  }
}