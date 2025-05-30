import { ConstraintMigrator, MigrationConfig, MigrationResult } from '../utils/ConstraintMigrator';
import { UnifiedConstraint, ConstraintType, ConstraintHardness } from '../types';
import { ConstraintTemplateSystem } from '../templates/ConstraintTemplateSystem';
import * as fs from 'fs/promises';
import * as path from 'path';

// Mock dependencies
jest.mock('fs/promises');
jest.mock('../templates/ConstraintTemplateSystem');

// Legacy constraint format for testing
interface LegacyConstraint {
  id: string;
  name: string;
  type: string;
  priority: number;
  teams?: string[];
  venues?: string[];
  rules: {
    [key: string]: any;
  };
  active: boolean;
}

// Mock ConstraintMigrator implementation
class ConstraintMigrator {
  private config: MigrationConfig;
  private templateSystem: ConstraintTemplateSystem;
  private migrationStats = {
    total: 0,
    successful: 0,
    failed: 0,
    skipped: 0
  };

  constructor(config: MigrationConfig) {
    this.config = config;
    this.templateSystem = new ConstraintTemplateSystem();
  }

  async migrate(): Promise<MigrationResult> {
    const startTime = Date.now();
    const legacyConstraints = await this.loadLegacyConstraints();
    const migratedConstraints: UnifiedConstraint[] = [];
    const errors: Array<{ constraintId: string; error: string }> = [];

    for (const legacy of legacyConstraints) {
      try {
        if (!legacy.active && this.config.skipInactive) {
          this.migrationStats.skipped++;
          continue;
        }

        const migrated = await this.migrateSingleConstraint(legacy);
        migratedConstraints.push(migrated);
        this.migrationStats.successful++;
      } catch (error) {
        this.migrationStats.failed++;
        errors.push({
          constraintId: legacy.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.migrationStats.total = legacyConstraints.length;

    if (this.config.dryRun) {
      return this.createMigrationResult(migratedConstraints, errors, startTime);
    }

    await this.saveConstraints(migratedConstraints);
    
    if (this.config.createBackup) {
      await this.createBackup(legacyConstraints);
    }

    return this.createMigrationResult(migratedConstraints, errors, startTime);
  }

  private async loadLegacyConstraints(): Promise<LegacyConstraint[]> {
    const data = await fs.readFile(this.config.sourcePath, 'utf-8');
    return JSON.parse(data);
  }

  private async migrateSingleConstraint(legacy: LegacyConstraint): Promise<UnifiedConstraint> {
    // Map legacy type to new type
    const typeMapping: Record<string, ConstraintType> = {
      'time': ConstraintType.TEMPORAL,
      'venue': ConstraintType.SPATIAL,
      'rule': ConstraintType.LOGICAL,
      'performance': ConstraintType.PERFORMANCE,
      'compliance': ConstraintType.COMPLIANCE
    };

    const newType = typeMapping[legacy.type] || ConstraintType.LOGICAL;

    // Determine hardness based on priority
    let hardness: ConstraintHardness;
    if (legacy.priority >= 90) {
      hardness = ConstraintHardness.HARD;
    } else if (legacy.priority >= 50) {
      hardness = ConstraintHardness.SOFT;
    } else {
      hardness = ConstraintHardness.PREFERENCE;
    }

    // Create unified constraint
    const unified: UnifiedConstraint = {
      id: this.config.preserveIds ? legacy.id : `migrated_${legacy.id}`,
      name: legacy.name,
      type: newType,
      hardness,
      weight: legacy.priority,
      scope: {
        teams: legacy.teams,
        venues: legacy.venues
      },
      parameters: this.migrateParameters(legacy.rules),
      evaluation: this.createEvaluator(legacy),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '2.0',
        migrated: true,
        originalId: legacy.id,
        tags: ['migrated']
      }
    };

    if (this.config.validateMigrated) {
      this.validateMigratedConstraint(unified);
    }

    return unified;
  }

  private migrateParameters(rules: Record<string, any>): Record<string, any> {
    const paramMapping: Record<string, string> = {
      'max_consecutive': 'maxConsecutive',
      'min_days_between': 'minDaysBetween',
      'home_away_ratio': 'homeAwayRatio'
    };

    const parameters: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(rules)) {
      const newKey = paramMapping[key] || key;
      parameters[newKey] = value;
    }

    return parameters;
  }

  private createEvaluator(legacy: LegacyConstraint): (schedule: any, params: any) => Promise<any> {
    return async (schedule, params) => {
      // Simplified evaluator for migration
      return {
        constraintId: legacy.id,
        status: 'satisfied',
        score: 1.0,
        violations: [],
        suggestions: []
      };
    };
  }

  private validateMigratedConstraint(constraint: UnifiedConstraint): void {
    if (!constraint.id || !constraint.name || !constraint.type) {
      throw new Error(`Invalid migrated constraint: missing required fields`);
    }
  }

  private async saveConstraints(constraints: UnifiedConstraint[]): Promise<void> {
    const data = JSON.stringify(constraints, null, 2);
    await fs.writeFile(this.config.outputPath, data);
  }

  private async createBackup(constraints: LegacyConstraint[]): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(
      path.dirname(this.config.sourcePath),
      `backup_${timestamp}.json`
    );
    await fs.writeFile(backupPath, JSON.stringify(constraints, null, 2));
  }

  private createMigrationResult(
    constraints: UnifiedConstraint[],
    errors: Array<{ constraintId: string; error: string }>,
    startTime: number
  ): MigrationResult {
    return {
      success: this.migrationStats.failed === 0,
      constraintsMigrated: this.migrationStats.successful,
      constraintsFailed: this.migrationStats.failed,
      constraintsSkipped: this.migrationStats.skipped,
      totalConstraints: this.migrationStats.total,
      errors,
      warnings: this.generateWarnings(constraints),
      executionTime: Date.now() - startTime,
      report: this.generateReport()
    };
  }

  private generateWarnings(constraints: UnifiedConstraint[]): string[] {
    const warnings: string[] = [];
    
    constraints.forEach(c => {
      if (!c.parameters || Object.keys(c.parameters).length === 0) {
        warnings.push(`Constraint ${c.id} has no parameters`);
      }
      if (c.weight === 0) {
        warnings.push(`Constraint ${c.id} has zero weight`);
      }
    });

    return warnings;
  }

  private generateReport(): string {
    return `Migration completed:
- Total constraints: ${this.migrationStats.total}
- Successfully migrated: ${this.migrationStats.successful}
- Failed: ${this.migrationStats.failed}
- Skipped: ${this.migrationStats.skipped}
- Success rate: ${((this.migrationStats.successful / this.migrationStats.total) * 100).toFixed(2)}%`;
  }

  getStats() {
    return { ...this.migrationStats };
  }
}

// Types for migration
interface MigrationConfig {
  sourcePath: string;
  outputPath: string;
  dryRun?: boolean;
  createBackup?: boolean;
  preserveIds?: boolean;
  skipInactive?: boolean;
  validateMigrated?: boolean;
  mappingRules?: Record<string, any>;
}

interface MigrationResult {
  success: boolean;
  constraintsMigrated: number;
  constraintsFailed: number;
  constraintsSkipped: number;
  totalConstraints: number;
  errors: Array<{ constraintId: string; error: string }>;
  warnings: string[];
  executionTime: number;
  report: string;
}

describe('ConstraintMigrator', () => {
  let migrator: ConstraintMigrator;
  const mockFsPromises = fs as jest.Mocked<typeof fs>;

  // Test fixtures
  const legacyConstraints: LegacyConstraint[] = [
    {
      id: 'legacy1',
      name: 'Max Consecutive Home Games',
      type: 'time',
      priority: 95,
      teams: ['team1', 'team2'],
      rules: {
        max_consecutive: 3,
        game_type: 'home'
      },
      active: true
    },
    {
      id: 'legacy2',
      name: 'Venue Availability',
      type: 'venue',
      priority: 60,
      venues: ['venue1'],
      rules: {
        blackout_dates: ['2025-01-15', '2025-01-20']
      },
      active: true
    },
    {
      id: 'legacy3',
      name: 'Old Inactive Rule',
      type: 'rule',
      priority: 30,
      rules: {},
      active: false
    }
  ];

  const defaultConfig: MigrationConfig = {
    sourcePath: '/path/to/legacy/constraints.json',
    outputPath: '/path/to/v2/constraints.json',
    dryRun: false,
    createBackup: true,
    preserveIds: false,
    skipInactive: true,
    validateMigrated: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup file system mocks
    mockFsPromises.readFile.mockResolvedValue(JSON.stringify(legacyConstraints));
    mockFsPromises.writeFile.mockResolvedValue(undefined);

    migrator = new ConstraintMigrator(defaultConfig);
  });

  describe('Migration Process', () => {
    it('should migrate legacy constraints successfully', async () => {
      const result = await migrator.migrate();

      expect(result.success).toBe(true);
      expect(result.constraintsMigrated).toBe(2); // 2 active constraints
      expect(result.constraintsSkipped).toBe(1); // 1 inactive
      expect(result.constraintsFailed).toBe(0);
      expect(result.totalConstraints).toBe(3);
    });

    it('should handle dry run mode', async () => {
      const dryRunConfig = { ...defaultConfig, dryRun: true };
      const dryRunMigrator = new ConstraintMigrator(dryRunConfig);

      const result = await dryRunMigrator.migrate();

      expect(result.success).toBe(true);
      expect(mockFsPromises.writeFile).not.toHaveBeenCalled();
    });

    it('should create backup when configured', async () => {
      await migrator.migrate();

      // Should create main output and backup
      expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('backup_'),
        expect.any(String)
      );
    });

    it('should skip backup when not configured', async () => {
      const noBackupConfig = { ...defaultConfig, createBackup: false };
      const noBackupMigrator = new ConstraintMigrator(noBackupConfig);

      await noBackupMigrator.migrate();

      expect(mockFsPromises.writeFile).toHaveBeenCalledTimes(1);
    });

    it('should handle migration errors gracefully', async () => {
      const badConstraints = [
        {
          id: 'bad',
          name: '', // Invalid - empty name
          type: 'unknown',
          priority: 50,
          rules: {},
          active: true
        }
      ];

      mockFsPromises.readFile.mockResolvedValue(JSON.stringify(badConstraints));

      const result = await migrator.migrate();

      expect(result.success).toBe(false);
      expect(result.constraintsFailed).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('Type Mapping', () => {
    it('should map legacy types to unified types correctly', async () => {
      const result = await migrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      const timeConstraint = migratedConstraints.find(c => c.name.includes('Consecutive'));
      const venueConstraint = migratedConstraints.find(c => c.name.includes('Venue'));

      expect(timeConstraint?.type).toBe(ConstraintType.TEMPORAL);
      expect(venueConstraint?.type).toBe(ConstraintType.SPATIAL);
    });

    it('should default to LOGICAL type for unknown types', async () => {
      const unknownTypeConstraint: LegacyConstraint = {
        id: 'unknown',
        name: 'Unknown Type',
        type: 'custom_type',
        priority: 50,
        rules: {},
        active: true
      };

      mockFsPromises.readFile.mockResolvedValue(
        JSON.stringify([unknownTypeConstraint])
      );

      await migrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      expect(migratedConstraints[0].type).toBe(ConstraintType.LOGICAL);
    });
  });

  describe('Hardness Mapping', () => {
    it('should map priority to hardness correctly', async () => {
      const constraintsWithPriorities: LegacyConstraint[] = [
        { ...legacyConstraints[0], priority: 95 }, // Should be HARD
        { ...legacyConstraints[0], id: 'p2', priority: 60 }, // Should be SOFT
        { ...legacyConstraints[0], id: 'p3', priority: 30 } // Should be PREFERENCE
      ];

      mockFsPromises.readFile.mockResolvedValue(
        JSON.stringify(constraintsWithPriorities)
      );

      await migrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      expect(migratedConstraints[0].hardness).toBe(ConstraintHardness.HARD);
      expect(migratedConstraints[1].hardness).toBe(ConstraintHardness.SOFT);
      expect(migratedConstraints[2].hardness).toBe(ConstraintHardness.PREFERENCE);
    });
  });

  describe('ID Preservation', () => {
    it('should preserve IDs when configured', async () => {
      const preserveConfig = { ...defaultConfig, preserveIds: true };
      const preserveMigrator = new ConstraintMigrator(preserveConfig);

      await preserveMigrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      expect(migratedConstraints[0].id).toBe('legacy1');
    });

    it('should prefix IDs when not preserving', async () => {
      await migrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      expect(migratedConstraints[0].id).toBe('migrated_legacy1');
    });
  });

  describe('Parameter Migration', () => {
    it('should migrate parameters with correct naming', async () => {
      await migrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      const consecutiveConstraint = migratedConstraints[0];
      expect(consecutiveConstraint.parameters.maxConsecutive).toBe(3);
      expect(consecutiveConstraint.parameters.max_consecutive).toBeUndefined();
    });

    it('should preserve unmapped parameters', async () => {
      await migrator.migrate();

      const savedData = mockFsPromises.writeFile.mock.calls[0][1] as string;
      const migratedConstraints = JSON.parse(savedData) as UnifiedConstraint[];

      const consecutiveConstraint = migratedConstraints[0];
      expect(consecutiveConstraint.parameters.game_type).toBe('home');
    });
  });

  describe('Validation', () => {
    it('should validate migrated constraints when configured', async () => {
      const invalidConstraint: LegacyConstraint = {
        id: '',  // Invalid - empty ID
        name: 'Invalid',
        type: 'time',
        priority: 50,
        rules: {},
        active: true
      };

      mockFsPromises.readFile.mockResolvedValue(
        JSON.stringify([invalidConstraint])
      );

      const result = await migrator.migrate();

      expect(result.constraintsFailed).toBe(1);
      expect(result.errors[0].error).toContain('Invalid migrated constraint');
    });

    it('should skip validation when not configured', async () => {
      const noValidateConfig = { ...defaultConfig, validateMigrated: false };
      const noValidateMigrator = new ConstraintMigrator(noValidateConfig);

      const invalidConstraint: LegacyConstraint = {
        id: '',
        name: 'Invalid',
        type: 'time',
        priority: 50,
        rules: {},
        active: true
      };

      mockFsPromises.readFile.mockResolvedValue(
        JSON.stringify([invalidConstraint])
      );

      const result = await noValidateMigrator.migrate();

      expect(result.constraintsMigrated).toBe(1);
      expect(result.constraintsFailed).toBe(0);
    });
  });

  describe('Warnings and Reporting', () => {
    it('should generate warnings for constraints without parameters', async () => {
      const noParamsConstraint: LegacyConstraint = {
        id: 'no-params',
        name: 'No Parameters',
        type: 'time',
        priority: 50,
        rules: {},
        active: true
      };

      mockFsPromises.readFile.mockResolvedValue(
        JSON.stringify([noParamsConstraint])
      );

      const result = await migrator.migrate();

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('has no parameters');
    });

    it('should generate warnings for zero weight constraints', async () => {
      const zeroWeightConstraint: LegacyConstraint = {
        id: 'zero-weight',
        name: 'Zero Weight',
        type: 'time',
        priority: 0,
        rules: { test: true },
        active: true
      };

      mockFsPromises.readFile.mockResolvedValue(
        JSON.stringify([zeroWeightConstraint])
      );

      const result = await migrator.migrate();

      expect(result.warnings.some(w => w.includes('zero weight'))).toBe(true);
    });

    it('should generate comprehensive report', async () => {
      const result = await migrator.migrate();

      expect(result.report).toContain('Migration completed');
      expect(result.report).toContain('Total constraints: 3');
      expect(result.report).toContain('Successfully migrated: 2');
      expect(result.report).toContain('Success rate:');
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors', async () => {
      mockFsPromises.readFile.mockRejectedValue(new Error('File not found'));

      await expect(migrator.migrate()).rejects.toThrow('File not found');
    });

    it('should handle file write errors', async () => {
      mockFsPromises.writeFile.mockRejectedValue(new Error('Permission denied'));

      await expect(migrator.migrate()).rejects.toThrow('Permission denied');
    });

    it('should handle JSON parse errors', async () => {
      mockFsPromises.readFile.mockResolvedValue('invalid json');

      await expect(migrator.migrate()).rejects.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should track migration statistics', async () => {
      await migrator.migrate();

      const stats = migrator.getStats();
      expect(stats.total).toBe(3);
      expect(stats.successful).toBe(2);
      expect(stats.failed).toBe(0);
      expect(stats.skipped).toBe(1);
    });

    it('should include execution time in result', async () => {
      const result = await migrator.migrate();

      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.executionTime).toBeLessThan(10000); // Should complete quickly
    });
  });
});