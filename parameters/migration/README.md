# UCDL Constraint Migration Tools

Automated tools for migrating legacy constraints to the Unified Constraint Definition Language (UCDL) format.

## Overview

The UCDL Migration Tools provide a comprehensive solution for converting existing constraint definitions from various legacy formats to the standardized UCDL format. This ensures consistency, improves maintainability, and enables advanced constraint management features.

## Features

- **Multi-format Support**: Migrate constraints from JavaScript classes, JSON objects, database records, and custom implementations
- **Intelligent Parsing**: Advanced AST-based parsing for JavaScript/TypeScript constraint files
- **Comprehensive Validation**: Validate migrated constraints for structure, types, business logic, and performance impact
- **Detailed Reporting**: Generate migration reports in JSON, Markdown, and HTML formats
- **Batch Processing**: Efficiently migrate large numbers of constraints with configurable batch sizes
- **Backup Generation**: Automatic backup creation before modifying files
- **Dry Run Mode**: Test migrations without making actual changes

## Components

### 1. ConstraintMigrator

The main migration tool that orchestrates the entire migration process.

```typescript
import { ConstraintMigrator } from './ConstraintMigrator';

const migrator = new ConstraintMigrator({
  validateOutput: true,      // Validate migrated constraints
  preserveMetadata: true,    // Keep original metadata
  generateBackup: true,      // Create backups before changes
  batchSize: 100,           // Process constraints in batches
  dryRun: false,            // Actually perform migration
  logLevel: 'normal'        // Logging verbosity
});
```

### 2. LegacyConstraintParser

Parses legacy constraint formats using AST analysis and pattern matching.

**Supported Formats:**
- JavaScript/TypeScript classes extending `Constraint` or `BaseConstraint`
- JSON configuration files
- Database record formats
- Custom constraint objects

### 3. MigrationValidators

Validates migrated constraints for UCDL compliance.

**Validation Checks:**
- Required field presence
- Type correctness
- Enum value validity
- Business logic consistency
- Performance impact assessment
- Cross-constraint relationships

### 4. MigrationReport

Generates comprehensive reports about the migration process.

**Report Formats:**
- **JSON**: Complete data for programmatic analysis
- **Markdown**: Human-readable summary and details
- **HTML**: Interactive report with statistics and visualizations

## Usage

### Basic Migration

```typescript
// Migrate a single constraint
const legacyConstraint = {
  name: 'Minimum Rest Days',
  type: 'HARD',
  category: 'REST',
  parameters: { minDays: 2 }
};

const result = await migrator.migrateSingleConstraint(legacyConstraint);
```

### File Migration

```typescript
// Migrate all constraints in a file
const results = await migrator.migrateFromFile('./constraints/basketball.js');
```

### Directory Migration

```typescript
// Migrate all constraint files in a directory
const results = await migrator.migrateDirectory('./constraints', /\.js$/);

// Generate report
const report = migrator.getReport();
await report.save('./migration-report.html');
```

## Migration Process

1. **Parsing**: Extract constraint definitions from source format
2. **Mapping**: Convert legacy fields to UCDL structure
3. **Enhancement**: Add required UCDL fields and metadata
4. **Validation**: Ensure compliance with UCDL specification
5. **Output**: Generate migrated constraint files

## Field Mapping

### Type Mapping
- `HARD` / `isHard: true` → `ConstraintType.HARD`
- `SOFT` / `isHard: false` → `ConstraintType.SOFT`
- `FLEXIBLE` → `ConstraintType.FLEXIBLE`
- `CONDITIONAL` → `ConstraintType.CONDITIONAL`

### Scope Detection
Based on constraint name and category:
- Contains "global" → `ConstraintScope.GLOBAL`
- Contains "sport" → `ConstraintScope.SPORT`
- Contains "team" → `ConstraintScope.TEAM`
- Contains "venue" → `ConstraintScope.VENUE`
- Contains "tournament" → `ConstraintScope.TOURNAMENT`

### Category Mapping
- `REST` / `WELLNESS` → `ConstraintCategory.WELLNESS`
- `TRAVEL` → `ConstraintCategory.TRAVEL`
- `VENUE` / `LOCATION` → `ConstraintCategory.SPATIAL`
- `TIME` / `DATE` → `ConstraintCategory.TEMPORAL`
- `BROADCAST` / `TV` → `ConstraintCategory.BROADCAST`

## Validation Rules

### Structure Validation
- All required fields must be present
- ID must be alphanumeric with hyphens/underscores
- Version must follow semantic versioning
- Weight must be between 0-10

### Type Validation
- Enum values must be valid UCDL types
- Priority must be integer 1-5
- Boolean fields must be boolean type

### Business Logic Validation
- Hard constraints should have high penalties (≥100)
- Critical priority constraints should be hard type
- Tournament constraints should have appropriate categories

## Report Interpretation

### Quality Score (0-100)
- **90-100**: Excellent migration quality
- **80-89**: Good quality with minor improvements possible
- **70-79**: Acceptable but should add documentation
- **<70**: Needs improvement in completeness

### Performance Impact
- **Low**: Minimal scheduler impact
- **Medium**: Moderate impact, acceptable for most cases
- **High**: May significantly affect scheduling performance

## Best Practices

1. **Review Warnings**: Even successful migrations may have warnings worth addressing
2. **Test Thoroughly**: Use dry run mode first to preview changes
3. **Backup Data**: Always enable backup generation for production migrations
4. **Validate Results**: Review the migration report for quality scores and recommendations
5. **Incremental Migration**: Migrate constraints in logical groups rather than all at once

## Troubleshooting

### Common Issues

1. **Parse Errors**: Ensure JavaScript files have valid syntax
2. **Missing Fields**: Legacy constraints may lack required UCDL fields
3. **Type Mismatches**: Review type mappings in the migration configuration
4. **Circular Dependencies**: Check cross-constraint relationships

### Debug Mode

Enable verbose logging for detailed migration information:

```typescript
const migrator = new ConstraintMigrator({
  logLevel: 'verbose'
});
```

## Examples

See `example-usage.ts` for comprehensive examples covering:
- Single constraint migration
- File-based migration
- Directory batch migration
- Custom class migration
- Validation workflows
- Report generation

## API Reference

### ConstraintMigrator

```typescript
class ConstraintMigrator {
  constructor(options?: MigrationOptions)
  
  async migrateSingleConstraint(
    constraint: LegacyConstraint | string,
    format?: 'object' | 'class' | 'database'
  ): Promise<MigrationResult>
  
  async migrateFromFile(filePath: string): Promise<MigrationResult[]>
  
  async migrateDirectory(
    dirPath: string,
    pattern?: RegExp
  ): Promise<Map<string, MigrationResult[]>>
  
  getReport(): MigrationReport
  async saveReport(outputPath: string): Promise<void>
}
```

### MigrationValidators

```typescript
class MigrationValidators {
  async validateConstraint(constraint: any): Promise<ValidationResult>
  async validateBatch(constraints: any[]): Promise<Map<string, ValidationResult>>
}
```

### MigrationReport

```typescript
class MigrationReport {
  addMigration(result: MigrationResult, duration: number): void
  finalize(): void
  async save(outputPath: string): Promise<void>
  async exportJSON(outputPath: string): Promise<void>
  async exportMarkdown(outputPath: string): Promise<void>
  async exportHTML(outputPath: string): Promise<void>
}
```

## Contributing

When extending the migration tools:

1. Add new format support in `LegacyConstraintParser`
2. Update validation rules in `MigrationValidators`
3. Enhance field mappings in `ConstraintMigrator`
4. Add test cases for new scenarios