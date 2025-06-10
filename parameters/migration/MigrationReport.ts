/**
 * Migration Report - Generate comprehensive reports for constraint migrations
 * 
 * Features:
 * - Detailed migration statistics
 * - Success/failure analysis
 * - Performance metrics
 * - Validation summaries
 * - Recommendations for improvement
 * - Export to multiple formats (JSON, HTML, Markdown)
 */

import * as fs from 'fs/promises';
import * as path from 'path';

// Migration statistics
interface MigrationStats {
  totalConstraints: number;
  successfulMigrations: number;
  failedMigrations: number;
  warningCount: number;
  averageMigrationTime: number;
  averageQualityScore: number;
  constraintsByType: Record<string, number>;
  constraintsByCategory: Record<string, number>;
  errorFrequency: Record<string, number>;
}

// Individual migration entry
interface MigrationEntry {
  constraintId: string;
  originalFormat: string;
  success: boolean;
  duration: number;
  timestamp: string;
  errors?: string[];
  warnings?: string[];
  qualityScore?: number;
  performanceImpact?: 'low' | 'medium' | 'high';
}

// Report section
interface ReportSection {
  title: string;
  content: string | any;
  level: 1 | 2 | 3;
}

/**
 * Migration report generator
 */
export class MigrationReport {
  private entries: MigrationEntry[];
  private startTime: Date;
  private endTime?: Date;
  private metadata: Record<string, any>;
  
  constructor() {
    this.entries = [];
    this.startTime = new Date();
    this.metadata = {
      version: '1.0.0',
      tool: 'UCDL Constraint Migrator',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  /**
   * Add a migration result to the report
   */
  addMigration(result: {
    constraintId: string;
    originalFormat: string;
    success: boolean;
    errors?: string[];
    warnings?: string[];
    migratedConstraint?: any;
  }, duration: number): void {
    const entry: MigrationEntry = {
      constraintId: result.constraintId,
      originalFormat: result.originalFormat,
      success: result.success,
      duration,
      timestamp: new Date().toISOString(),
      errors: result.errors,
      warnings: result.warnings
    };
    
    // Calculate quality score if migration was successful
    if (result.success && result.migratedConstraint) {
      entry.qualityScore = this.calculateQualityScore(result.migratedConstraint);
      entry.performanceImpact = this.assessPerformanceImpact(result.migratedConstraint);
    }
    
    this.entries.push(entry);
  }

  /**
   * Finalize the report
   */
  finalize(): void {
    this.endTime = new Date();
  }

  /**
   * Generate report statistics
   */
  private generateStatistics(): MigrationStats {
    const stats: MigrationStats = {
      totalConstraints: this.entries.length,
      successfulMigrations: 0,
      failedMigrations: 0,
      warningCount: 0,
      averageMigrationTime: 0,
      averageQualityScore: 0,
      constraintsByType: {},
      constraintsByCategory: {},
      errorFrequency: {}
    };
    
    let totalTime = 0;
    let totalQualityScore = 0;
    let qualityScoreCount = 0;
    
    this.entries.forEach(entry => {
      // Count successes and failures
      if (entry.success) {
        stats.successfulMigrations++;
      } else {
        stats.failedMigrations++;
      }
      
      // Count warnings
      stats.warningCount += (entry.warnings?.length || 0);
      
      // Sum migration times
      totalTime += entry.duration;
      
      // Sum quality scores
      if (entry.qualityScore !== undefined) {
        totalQualityScore += entry.qualityScore;
        qualityScoreCount++;
      }
      
      // Count errors
      entry.errors?.forEach(error => {
        const errorType = this.categorizeError(error);
        stats.errorFrequency[errorType] = (stats.errorFrequency[errorType] || 0) + 1;
      });
    });
    
    // Calculate averages
    stats.averageMigrationTime = this.entries.length > 0 
      ? totalTime / this.entries.length 
      : 0;
      
    stats.averageQualityScore = qualityScoreCount > 0 
      ? totalQualityScore / qualityScoreCount 
      : 0;
    
    return stats;
  }

  /**
   * Generate report summary
   */
  private generateSummary(stats: MigrationStats): string {
    const successRate = stats.totalConstraints > 0 
      ? (stats.successfulMigrations / stats.totalConstraints * 100).toFixed(1)
      : '0';
      
    const duration = this.endTime 
      ? (this.endTime.getTime() - this.startTime.getTime()) / 1000
      : 0;
    
    return `
# Migration Summary

- **Total Constraints**: ${stats.totalConstraints}
- **Successful Migrations**: ${stats.successfulMigrations} (${successRate}%)
- **Failed Migrations**: ${stats.failedMigrations}
- **Total Warnings**: ${stats.warningCount}
- **Average Migration Time**: ${stats.averageMigrationTime.toFixed(2)}ms
- **Average Quality Score**: ${stats.averageQualityScore.toFixed(1)}/100
- **Total Duration**: ${duration.toFixed(2)}s
    `.trim();
  }

  /**
   * Generate detailed findings
   */
  private generateFindings(): ReportSection[] {
    const sections: ReportSection[] = [];
    const stats = this.generateStatistics();
    
    // Success/Failure Analysis
    const failures = this.entries.filter(e => !e.success);
    if (failures.length > 0) {
      sections.push({
        title: 'Failed Migrations',
        level: 2,
        content: this.formatFailures(failures)
      });
    }
    
    // Common Errors
    if (Object.keys(stats.errorFrequency).length > 0) {
      sections.push({
        title: 'Common Errors',
        level: 2,
        content: this.formatErrorFrequency(stats.errorFrequency)
      });
    }
    
    // Performance Analysis
    const highImpact = this.entries.filter(e => e.performanceImpact === 'high');
    if (highImpact.length > 0) {
      sections.push({
        title: 'High Performance Impact Constraints',
        level: 2,
        content: this.formatPerformanceImpact(highImpact)
      });
    }
    
    // Quality Analysis
    const lowQuality = this.entries.filter(e => 
      e.qualityScore !== undefined && e.qualityScore < 70
    );
    if (lowQuality.length > 0) {
      sections.push({
        title: 'Low Quality Migrations',
        level: 2,
        content: this.formatQualityIssues(lowQuality)
      });
    }
    
    // Warnings Summary
    const warnings = this.entries.filter(e => e.warnings && e.warnings.length > 0);
    if (warnings.length > 0) {
      sections.push({
        title: 'Migration Warnings',
        level: 2,
        content: this.formatWarnings(warnings)
      });
    }
    
    return sections;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const stats = this.generateStatistics();
    
    // Success rate recommendations
    if (stats.successfulMigrations < stats.totalConstraints * 0.9) {
      recommendations.push(
        'Consider reviewing failed migrations and updating the parser to handle edge cases'
      );
    }
    
    // Performance recommendations
    const highImpactCount = this.entries.filter(e => e.performanceImpact === 'high').length;
    if (highImpactCount > stats.totalConstraints * 0.2) {
      recommendations.push(
        'Many constraints have high performance impact. Consider optimizing constraint scope and conditions'
      );
    }
    
    // Quality recommendations
    if (stats.averageQualityScore < 80) {
      recommendations.push(
        'Average quality score is below 80. Consider adding more metadata and documentation to constraints'
      );
    }
    
    // Error pattern recommendations
    const topErrors = Object.entries(stats.errorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
      
    topErrors.forEach(([errorType, count]) => {
      if (count > 5) {
        recommendations.push(
          `Address recurring ${errorType} errors (${count} occurrences)`
        );
      }
    });
    
    return recommendations;
  }

  /**
   * Export report as JSON
   */
  async exportJSON(outputPath: string): Promise<void> {
    const stats = this.generateStatistics();
    
    const report = {
      metadata: {
        ...this.metadata,
        generatedAt: new Date().toISOString(),
        startTime: this.startTime.toISOString(),
        endTime: this.endTime?.toISOString(),
      },
      summary: {
        totalConstraints: stats.totalConstraints,
        successfulMigrations: stats.successfulMigrations,
        failedMigrations: stats.failedMigrations,
        successRate: stats.totalConstraints > 0 
          ? stats.successfulMigrations / stats.totalConstraints 
          : 0,
        averageMigrationTime: stats.averageMigrationTime,
        averageQualityScore: stats.averageQualityScore
      },
      statistics: stats,
      entries: this.entries,
      recommendations: this.generateRecommendations()
    };
    
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');
  }

  /**
   * Export report as Markdown
   */
  async exportMarkdown(outputPath: string): Promise<void> {
    const stats = this.generateStatistics();
    const sections: string[] = [];
    
    // Header
    sections.push(`# UCDL Constraint Migration Report

Generated: ${new Date().toISOString()}
Version: ${this.metadata.version}
`);
    
    // Summary
    sections.push(this.generateSummary(stats));
    
    // Statistics
    sections.push(`
## Migration Statistics

### Success Metrics
- Success Rate: ${(stats.successfulMigrations / stats.totalConstraints * 100).toFixed(1)}%
- Failed Migrations: ${stats.failedMigrations}
- Total Warnings: ${stats.warningCount}

### Performance Metrics
- Average Migration Time: ${stats.averageMigrationTime.toFixed(2)}ms
- Total Duration: ${this.endTime ? ((this.endTime.getTime() - this.startTime.getTime()) / 1000).toFixed(2) : 'N/A'}s

### Quality Metrics
- Average Quality Score: ${stats.averageQualityScore.toFixed(1)}/100
`);
    
    // Detailed Findings
    const findings = this.generateFindings();
    findings.forEach(section => {
      const heading = '#'.repeat(section.level + 1);
      sections.push(`${heading} ${section.title}\n\n${section.content}`);
    });
    
    // Recommendations
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      sections.push(`
## Recommendations

${recommendations.map(r => `- ${r}`).join('\n')}
`);
    }
    
    // Detailed Migration Log
    sections.push(this.generateDetailedLog());
    
    await fs.writeFile(outputPath, sections.join('\n\n'), 'utf-8');
  }

  /**
   * Export report as HTML
   */
  async exportHTML(outputPath: string): Promise<void> {
    const stats = this.generateStatistics();
    const markdownContent = await this.generateMarkdownContent();
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UCDL Constraint Migration Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1, h2, h3 {
            color: #333;
        }
        h1 {
            border-bottom: 3px solid #0066cc;
            padding-bottom: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            border-left: 4px solid #0066cc;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #0066cc;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .error { color: #dc3545; }
        .recommendation {
            background-color: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 15px;
            margin: 10px 0;
        }
        pre {
            background-color: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>UCDL Constraint Migration Report</h1>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.totalConstraints}</div>
                <div class="stat-label">Total Constraints</div>
            </div>
            <div class="stat-card">
                <div class="stat-value success">${stats.successfulMigrations}</div>
                <div class="stat-label">Successful Migrations</div>
            </div>
            <div class="stat-card">
                <div class="stat-value error">${stats.failedMigrations}</div>
                <div class="stat-label">Failed Migrations</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.averageQualityScore.toFixed(1)}/100</div>
                <div class="stat-label">Average Quality Score</div>
            </div>
        </div>
        
        ${this.convertMarkdownToHTML(markdownContent)}
    </div>
</body>
</html>
    `;
    
    await fs.writeFile(outputPath, html, 'utf-8');
  }

  /**
   * Save report in specified format
   */
  async save(outputPath: string): Promise<void> {
    const ext = path.extname(outputPath).toLowerCase();
    
    switch (ext) {
      case '.json':
        await this.exportJSON(outputPath);
        break;
      case '.md':
      case '.markdown':
        await this.exportMarkdown(outputPath);
        break;
      case '.html':
        await this.exportHTML(outputPath);
        break;
      default:
        throw new Error(`Unsupported export format: ${ext}`);
    }
  }

  /**
   * Calculate quality score for a constraint
   */
  private calculateQualityScore(constraint: any): number {
    let score = 0;
    
    // Basic completeness (40 points)
    if (constraint.id) score += 5;
    if (constraint.name) score += 5;
    if (constraint.description && constraint.description.length > 20) score += 10;
    if (constraint.type) score += 5;
    if (constraint.scope) score += 5;
    if (constraint.category) score += 5;
    if (constraint.priority) score += 5;
    
    // Advanced features (30 points)
    if (constraint.conditions && constraint.conditions.length > 0) score += 10;
    if (constraint.parameters && Object.keys(constraint.parameters).length > 0) score += 10;
    if (constraint.resolutionStrategy) score += 5;
    if (constraint.fallbackOptions && constraint.fallbackOptions.length > 0) score += 5;
    
    // Metadata quality (20 points)
    if (constraint.metadata?.documentation) score += 10;
    if (constraint.metadata?.tags && constraint.metadata.tags.length > 0) score += 5;
    if (constraint.metadata?.author && constraint.metadata.author !== 'migration_tool') score += 5;
    
    // Relationships (10 points)
    if (constraint.dependsOn && constraint.dependsOn.length > 0) score += 5;
    if (constraint.affects && constraint.affects.length > 0) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Assess performance impact
   */
  private assessPerformanceImpact(constraint: any): 'low' | 'medium' | 'high' {
    let impact = 0;
    
    // Scope-based impact
    if (constraint.scope === 'global') impact += 3;
    else if (constraint.scope === 'sport') impact += 2;
    else if (constraint.scope === 'team') impact += 1;
    
    // Type-based impact
    if (constraint.type === 'hard') impact += 2;
    
    // Complexity-based impact
    const conditionCount = constraint.conditions?.length || 0;
    const paramCount = Object.keys(constraint.parameters || {}).length;
    
    impact += Math.floor(conditionCount / 3);
    impact += Math.floor(paramCount / 5);
    
    if (impact >= 6) return 'high';
    if (impact >= 3) return 'medium';
    return 'low';
  }

  /**
   * Categorize error messages
   */
  private categorizeError(error: string): string {
    if (error.includes('Missing required field')) return 'missing_field';
    if (error.includes('Invalid') && error.includes('type')) return 'invalid_type';
    if (error.includes('Invalid') && error.includes('format')) return 'invalid_format';
    if (error.includes('parse') || error.includes('Parse')) return 'parse_error';
    if (error.includes('constraint') || error.includes('Constraint')) return 'constraint_error';
    return 'other';
  }

  /**
   * Format failure entries
   */
  private formatFailures(failures: MigrationEntry[]): string {
    const lines: string[] = [];
    
    failures.forEach(entry => {
      lines.push(`### ${entry.constraintId}`);
      lines.push(`- Format: ${entry.originalFormat}`);
      lines.push(`- Timestamp: ${entry.timestamp}`);
      
      if (entry.errors && entry.errors.length > 0) {
        lines.push('- Errors:');
        entry.errors.forEach(error => {
          lines.push(`  - ${error}`);
        });
      }
      
      lines.push('');
    });
    
    return lines.join('\n');
  }

  /**
   * Format error frequency
   */
  private formatErrorFrequency(frequency: Record<string, number>): string {
    const sorted = Object.entries(frequency)
      .sort(([, a], [, b]) => b - a);
    
    const lines: string[] = [];
    lines.push('| Error Type | Count |');
    lines.push('|------------|-------|');
    
    sorted.forEach(([type, count]) => {
      lines.push(`| ${type} | ${count} |`);
    });
    
    return lines.join('\n');
  }

  /**
   * Format performance impact entries
   */
  private formatPerformanceImpact(entries: MigrationEntry[]): string {
    const lines: string[] = [];
    
    lines.push('| Constraint ID | Performance Impact | Duration (ms) |');
    lines.push('|---------------|-------------------|---------------|');
    
    entries.forEach(entry => {
      lines.push(`| ${entry.constraintId} | ${entry.performanceImpact} | ${entry.duration.toFixed(2)} |`);
    });
    
    return lines.join('\n');
  }

  /**
   * Format quality issues
   */
  private formatQualityIssues(entries: MigrationEntry[]): string {
    const lines: string[] = [];
    
    lines.push('| Constraint ID | Quality Score | Issues |');
    lines.push('|---------------|---------------|--------|');
    
    entries.forEach(entry => {
      const issues: string[] = [];
      if (entry.qualityScore! < 50) issues.push('Very low quality');
      if (entry.warnings && entry.warnings.length > 3) issues.push('Many warnings');
      
      lines.push(`| ${entry.constraintId} | ${entry.qualityScore}/100 | ${issues.join(', ') || 'Low score'} |`);
    });
    
    return lines.join('\n');
  }

  /**
   * Format warnings
   */
  private formatWarnings(entries: MigrationEntry[]): string {
    const lines: string[] = [];
    const warningTypes = new Map<string, number>();
    
    entries.forEach(entry => {
      entry.warnings?.forEach(warning => {
        const type = this.categorizeError(warning);
        warningTypes.set(type, (warningTypes.get(type) || 0) + 1);
      });
    });
    
    lines.push('### Warning Summary');
    lines.push('');
    lines.push('| Warning Type | Count |');
    lines.push('|--------------|-------|');
    
    Array.from(warningTypes.entries())
      .sort(([, a], [, b]) => b - a)
      .forEach(([type, count]) => {
        lines.push(`| ${type} | ${count} |`);
      });
    
    return lines.join('\n');
  }

  /**
   * Generate detailed migration log
   */
  private generateDetailedLog(): string {
    const lines: string[] = [];
    
    lines.push('## Detailed Migration Log');
    lines.push('');
    lines.push('| Timestamp | Constraint ID | Status | Duration | Quality | Warnings |');
    lines.push('|-----------|---------------|--------|----------|---------|----------|');
    
    this.entries.slice(-50).forEach(entry => {
      const status = entry.success ? '✅' : '❌';
      const quality = entry.qualityScore !== undefined ? `${entry.qualityScore}/100` : 'N/A';
      const warnings = entry.warnings?.length || 0;
      
      lines.push(
        `| ${new Date(entry.timestamp).toLocaleTimeString()} | ${entry.constraintId} | ${status} | ${entry.duration.toFixed(1)}ms | ${quality} | ${warnings} |`
      );
    });
    
    if (this.entries.length > 50) {
      lines.push('');
      lines.push(`*Showing last 50 of ${this.entries.length} entries*`);
    }
    
    return lines.join('\n');
  }

  /**
   * Generate markdown content for HTML export
   */
  private async generateMarkdownContent(): Promise<string> {
    const stats = this.generateStatistics();
    const sections: string[] = [];
    
    sections.push(this.generateSummary(stats));
    
    const findings = this.generateFindings();
    findings.forEach(section => {
      sections.push(`## ${section.title}\n\n${section.content}`);
    });
    
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      sections.push(`## Recommendations\n\n${recommendations.map(r => `- ${r}`).join('\n')}`);
    }
    
    return sections.join('\n\n');
  }

  /**
   * Convert markdown to HTML (simple implementation)
   */
  private convertMarkdownToHTML(markdown: string): string {
    return markdown
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^\* (.+)/gim, '<li>$1</li>')
      .replace(/^- (.+)/gim, '<li>$1</li>')
      .replace(/\*\*(.+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>')
      .replace(/<li>/g, '<ul><li>')
      .replace(/<\/li>/g, '</li></ul>')
      .replace(/<\/ul><ul>/g, '');
  }
}

export default MigrationReport;