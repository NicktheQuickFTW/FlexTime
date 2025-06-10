/**
 * Constraint Migrator - Main migration tool for converting legacy constraints to UCDL format
 * 
 * This tool provides automated migration capabilities for:
 * - Legacy constraint class-based definitions
 * - Sport-specific constraint systems
 * - Database-stored constraint configurations
 * - Custom constraint implementations
 */

import { 
  UnifiedConstraint,
  ConstraintType,
  ConstraintScope,
  ConstraintCategory,
  ConstraintPriority,
  ResolutionStrategy,
  TemporalPattern,
  ParameterTypes
} from '../../ucdl/types';
import { LegacyConstraintParser } from './LegacyConstraintParser';
import { MigrationValidators } from './MigrationValidators';
import { MigrationReport } from './MigrationReport';
import * as path from 'path';
import * as fs from 'fs/promises';

// Legacy constraint structure interface
interface LegacyConstraint {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  parameters?: Record<string, any>;
  weight?: number;
  priority?: number | string;
  isHard?: boolean;
  // Additional legacy fields
  [key: string]: any;
}

// Migration options
interface MigrationOptions {
  validateOutput?: boolean;
  preserveMetadata?: boolean;
  generateBackup?: boolean;
  batchSize?: number;
  dryRun?: boolean;
  logLevel?: 'verbose' | 'normal' | 'quiet';
}

// Migration result for tracking
interface MigrationResult {
  constraintId: string;
  originalFormat: string;
  success: boolean;
  migratedConstraint?: UnifiedConstraint;
  errors?: string[];
  warnings?: string[];
}

/**
 * Main constraint migrator class
 */
export class ConstraintMigrator {
  private parser: LegacyConstraintParser;
  private validators: MigrationValidators;
  private report: MigrationReport;
  private options: Required<MigrationOptions>;
  
  constructor(options: MigrationOptions = {}) {
    this.parser = new LegacyConstraintParser();
    this.validators = new MigrationValidators();
    this.report = new MigrationReport();
    
    // Set default options
    this.options = {
      validateOutput: true,
      preserveMetadata: true,
      generateBackup: true,
      batchSize: 100,
      dryRun: false,
      logLevel: 'normal',
      ...options
    };
  }

  /**
   * Migrate a single legacy constraint to UCDL format
   */
  async migrateSingleConstraint(
    legacyConstraint: LegacyConstraint | string,
    format: 'object' | 'class' | 'database' = 'object'
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    
    try {
      // Parse legacy constraint based on format
      let parsedConstraint: LegacyConstraint;
      if (typeof legacyConstraint === 'string') {
        parsedConstraint = await this.parser.parseFromString(legacyConstraint, format);
      } else {
        parsedConstraint = legacyConstraint;
      }
      
      // Convert to UCDL format
      const ucdlConstraint = this.convertToUCDL(parsedConstraint);
      
      // Validate if requested
      if (this.options.validateOutput) {
        const validationResult = await this.validators.validateConstraint(ucdlConstraint);
        if (!validationResult.isValid) {
          return {
            constraintId: ucdlConstraint.id,
            originalFormat: format,
            success: false,
            errors: validationResult.errors,
            warnings: validationResult.warnings
          };
        }
      }
      
      // Record migration
      const result: MigrationResult = {
        constraintId: ucdlConstraint.id,
        originalFormat: format,
        success: true,
        migratedConstraint: ucdlConstraint,
        warnings: []
      };
      
      this.report.addMigration(result, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      const result: MigrationResult = {
        constraintId: legacyConstraint.id || 'unknown',
        originalFormat: format,
        success: false,
        errors: [error.message]
      };
      
      this.report.addMigration(result, Date.now() - startTime);
      return result;
    }
  }

  /**
   * Migrate constraints from a file
   */
  async migrateFromFile(filePath: string): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    try {
      // Generate backup if requested
      if (this.options.generateBackup && !this.options.dryRun) {
        await this.createBackup(filePath);
      }
      
      // Read and parse file
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const constraints = await this.parser.parseFile(filePath, fileContent);
      
      // Migrate in batches
      for (let i = 0; i < constraints.length; i += this.options.batchSize) {
        const batch = constraints.slice(i, i + this.options.batchSize);
        const batchResults = await Promise.all(
          batch.map(constraint => this.migrateSingleConstraint(constraint))
        );
        results.push(...batchResults);
        
        if (this.options.logLevel !== 'quiet') {
          console.log(`Migrated batch ${i / this.options.batchSize + 1} of ${Math.ceil(constraints.length / this.options.batchSize)}`);
        }
      }
      
      // Write migrated constraints if not dry run
      if (!this.options.dryRun) {
        await this.writeMigratedFile(filePath, results);
      }
      
    } catch (error) {
      console.error(`Error migrating file ${filePath}:`, error);
      throw error;
    }
    
    return results;
  }

  /**
   * Migrate all constraints in a directory
   */
  async migrateDirectory(
    dirPath: string,
    pattern: RegExp = /\.(js|ts|json)$/
  ): Promise<Map<string, MigrationResult[]>> {
    const results = new Map<string, MigrationResult[]>();
    
    try {
      const files = await fs.readdir(dirPath);
      const constraintFiles = files.filter(file => pattern.test(file));
      
      for (const file of constraintFiles) {
        const filePath = path.join(dirPath, file);
        const fileStats = await fs.stat(filePath);
        
        if (fileStats.isFile()) {
          if (this.options.logLevel !== 'quiet') {
            console.log(`Migrating ${file}...`);
          }
          
          const fileResults = await this.migrateFromFile(filePath);
          results.set(filePath, fileResults);
        }
      }
      
    } catch (error) {
      console.error(`Error migrating directory ${dirPath}:`, error);
      throw error;
    }
    
    return results;
  }

  /**
   * Convert legacy constraint to UCDL format
   */
  private convertToUCDL(legacy: LegacyConstraint): UnifiedConstraint {
    // Generate ID if not present
    const id = legacy.id || `migrated_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Map legacy type to UCDL type
    const type = this.mapConstraintType(legacy);
    
    // Map legacy scope
    const scope = this.mapConstraintScope(legacy);
    
    // Map legacy category
    const category = this.mapConstraintCategory(legacy);
    
    // Map priority
    const priority = this.mapConstraintPriority(legacy);
    
    // Convert parameters
    const parameters = this.convertParameters(legacy.parameters || {});
    
    // Build UCDL constraint
    const ucdlConstraint = {
      id,
      name: legacy.name,
      description: legacy.description || `Migrated from legacy constraint: ${legacy.name}`,
      version: '1.0.0',
      type,
      scope,
      category,
      priority,
      parameters,
      conditions: this.extractConditions(legacy),
      weight: legacy.weight || 1.0,
      penalty: this.calculatePenalty(legacy),
      resolutionStrategy: this.determineResolutionStrategy(legacy),
      fallbackOptions: [],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        author: 'migration_tool',
        tags: ['migrated', 'legacy'],
        migrationInfo: {
          originalFormat: 'legacy',
          migrationDate: new Date().toISOString(),
          migrationVersion: '1.0.0',
          originalData: this.options.preserveMetadata ? legacy : undefined
        }
      },
      isActive: true,
      dependsOn: [],
      affects: []
    };
    
    return ucdlConstraint;
  }

  /**
   * Map legacy constraint type to UCDL type
   */
  private mapConstraintType(legacy: LegacyConstraint): ConstraintType {
    if (legacy.isHard || legacy.type?.toLowerCase() === 'hard') {
      return ConstraintType.HARD;
    } else if (legacy.type?.toLowerCase() === 'soft') {
      return ConstraintType.SOFT;
    } else if (legacy.type?.toLowerCase() === 'flexible') {
      return ConstraintType.FLEXIBLE;
    } else if (legacy.type?.toLowerCase() === 'conditional') {
      return ConstraintType.CONDITIONAL;
    }
    
    // Default based on other properties
    return legacy.weight && legacy.weight < 1 ? ConstraintType.SOFT : ConstraintType.HARD;
  }

  /**
   * Map legacy constraint scope
   */
  private mapConstraintScope(legacy: LegacyConstraint): ConstraintScope {
    const name = legacy.name?.toLowerCase() || '';
    const category = legacy.category?.toLowerCase() || '';
    
    if (name.includes('global') || category.includes('global')) {
      return ConstraintScope.GLOBAL;
    } else if (name.includes('sport') || category.includes('sport')) {
      return ConstraintScope.SPORT;
    } else if (name.includes('team')) {
      return ConstraintScope.TEAM;
    } else if (name.includes('game')) {
      return ConstraintScope.GAME;
    } else if (name.includes('venue')) {
      return ConstraintScope.VENUE;
    } else if (name.includes('date') || name.includes('time')) {
      return ConstraintScope.DATE;
    } else if (name.includes('season')) {
      return ConstraintScope.SEASON;
    } else if (name.includes('tournament') || name.includes('championship')) {
      return ConstraintScope.TOURNAMENT;
    }
    
    // Default to GAME scope
    return ConstraintScope.GAME;
  }

  /**
   * Map legacy constraint category
   */
  private mapConstraintCategory(legacy: LegacyConstraint): ConstraintCategory {
    const category = legacy.category?.toLowerCase() || '';
    const name = legacy.name?.toLowerCase() || '';
    
    if (category.includes('rest') || category.includes('wellness')) {
      return ConstraintCategory.WELLNESS;
    } else if (category.includes('travel')) {
      return ConstraintCategory.TRAVEL;
    } else if (category.includes('venue') || category.includes('location')) {
      return ConstraintCategory.SPATIAL;
    } else if (category.includes('time') || category.includes('date') || category.includes('schedule')) {
      return ConstraintCategory.TEMPORAL;
    } else if (category.includes('competitive') || category.includes('balance')) {
      return ConstraintCategory.COMPETITIVE;
    } else if (category.includes('broadcast') || category.includes('tv')) {
      return ConstraintCategory.BROADCAST;
    } else if (category.includes('academic')) {
      return ConstraintCategory.ACADEMIC;
    } else if (category.includes('rule') || category.includes('regulatory')) {
      return ConstraintCategory.REGULATORY;
    }
    
    // Default to OPERATIONAL
    return ConstraintCategory.OPERATIONAL;
  }

  /**
   * Map legacy priority
   */
  private mapConstraintPriority(legacy: LegacyConstraint): ConstraintPriority {
    if (typeof legacy.priority === 'number') {
      // Map numeric priority (assuming 1-5 scale)
      return Math.max(1, Math.min(5, Math.round(legacy.priority)));
    }
    
    const priority = legacy.priority?.toLowerCase() || '';
    if (priority.includes('critical') || priority.includes('highest')) {
      return ConstraintPriority.CRITICAL;
    } else if (priority.includes('high')) {
      return ConstraintPriority.HIGH;
    } else if (priority.includes('medium')) {
      return ConstraintPriority.MEDIUM;
    } else if (priority.includes('low')) {
      return ConstraintPriority.LOW;
    } else if (priority.includes('optional')) {
      return ConstraintPriority.OPTIONAL;
    }
    
    // Default based on type
    return legacy.isHard ? ConstraintPriority.HIGH : ConstraintPriority.MEDIUM;
  }

  /**
   * Convert legacy parameters to UCDL format
   */
  private convertParameters(legacyParams: Record<string, any>): Record<string, any> {
    const converted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(legacyParams)) {
      // Convert common parameter patterns
      if (key.includes('min') || key.includes('max')) {
        converted[key] = {
          type: typeof value === 'number' ? ParameterTypes.INTEGER : ParameterTypes.FLOAT,
          value,
          required: true
        };
      } else if (key.includes('date') || key.includes('Date')) {
        converted[key] = {
          type: ParameterTypes.DATE,
          value,
          required: true
        };
      } else if (key.includes('days') || key.includes('Days')) {
        converted[key] = {
          type: ParameterTypes.DAYS_COUNT,
          value,
          required: true
        };
      } else if (Array.isArray(value)) {
        converted[key] = {
          type: ParameterTypes.ARRAY,
          value,
          required: false
        };
      } else {
        // Default conversion
        converted[key] = {
          type: this.inferParameterType(value),
          value,
          required: false
        };
      }
    }
    
    return converted;
  }

  /**
   * Infer parameter type from value
   */
  private inferParameterType(value: any): ParameterTypes {
    if (typeof value === 'boolean') return ParameterTypes.BOOLEAN;
    if (typeof value === 'number') {
      return Number.isInteger(value) ? ParameterTypes.INTEGER : ParameterTypes.FLOAT;
    }
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}/.test(value)) return ParameterTypes.DATE;
      if (/^\d{2}:\d{2}/.test(value)) return ParameterTypes.TIME;
    }
    if (Array.isArray(value)) return ParameterTypes.ARRAY;
    if (typeof value === 'object') return ParameterTypes.OBJECT;
    
    return ParameterTypes.OBJECT;
  }

  /**
   * Extract conditions from legacy constraint
   */
  private extractConditions(legacy: LegacyConstraint): any[] {
    const conditions = [];
    
    // Extract common condition patterns
    if (legacy.appliesTo) {
      conditions.push({
        type: 'filter',
        field: 'entity',
        operator: 'in',
        value: Array.isArray(legacy.appliesTo) ? legacy.appliesTo : [legacy.appliesTo]
      });
    }
    
    if (legacy.dateRange) {
      conditions.push({
        type: 'temporal',
        pattern: TemporalPattern.DATE_RANGE,
        start: legacy.dateRange.start,
        end: legacy.dateRange.end
      });
    }
    
    if (legacy.sportType) {
      conditions.push({
        type: 'filter',
        field: 'sport',
        operator: 'equals',
        value: legacy.sportType
      });
    }
    
    return conditions;
  }

  /**
   * Calculate penalty value for soft constraints
   */
  private calculatePenalty(legacy: LegacyConstraint): number {
    if (legacy.penalty) return legacy.penalty;
    if (legacy.isHard) return 1000; // High penalty for hard constraints
    
    // Calculate based on weight
    const weight = legacy.weight || 1.0;
    return Math.round(weight * 10);
  }

  /**
   * Determine resolution strategy
   */
  private determineResolutionStrategy(legacy: LegacyConstraint): ResolutionStrategy {
    if (legacy.isHard || legacy.type === 'hard') {
      return ResolutionStrategy.STRICT;
    }
    
    if (legacy.allowOverride || legacy.flexible) {
      return ResolutionStrategy.OVERRIDE;
    }
    
    if (legacy.negotiable) {
      return ResolutionStrategy.NEGOTIATE;
    }
    
    return ResolutionStrategy.FALLBACK;
  }

  /**
   * Create backup of original file
   */
  private async createBackup(filePath: string): Promise<void> {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    if (this.options.logLevel !== 'quiet') {
      console.log(`Created backup: ${backupPath}`);
    }
  }

  /**
   * Write migrated constraints to file
   */
  private async writeMigratedFile(
    originalPath: string,
    results: MigrationResult[]
  ): Promise<void> {
    const successfulMigrations = results
      .filter(r => r.success && r.migratedConstraint)
      .map(r => r.migratedConstraint);
    
    if (successfulMigrations.length === 0) {
      console.warn(`No successful migrations for ${originalPath}`);
      return;
    }
    
    const outputPath = originalPath.replace(/\.(js|ts|json)$/, '.ucdl.json');
    const content = JSON.stringify(successfulMigrations, null, 2);
    
    await fs.writeFile(outputPath, content, 'utf-8');
    
    if (this.options.logLevel !== 'quiet') {
      console.log(`Wrote ${successfulMigrations.length} migrated constraints to ${outputPath}`);
    }
  }

  /**
   * Get migration report
   */
  getReport(): MigrationReport {
    return this.report;
  }

  /**
   * Generate and save migration report
   */
  async saveReport(outputPath: string): Promise<void> {
    await this.report.save(outputPath);
  }
}

export default ConstraintMigrator;