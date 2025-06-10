// Constraint Template System - Main template management and orchestration
// Version 2.0 - Complete template-based constraint creation system

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintParameters,
  ConstraintScope,
  ConstraintEvaluator,
  ConstraintMetadata,
  Schedule,
  Game,
  Team
} from '../types';
import { TemplateValidator } from './TemplateValidator';
import { StandardTemplates } from './StandardTemplates';

export interface ConstraintTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  type: ConstraintType;
  defaultHardness: ConstraintHardness;
  parameterDefinitions: ParameterDefinition[];
  scopeOptions: ScopeOptions;
  evaluatorTemplate: string; // Template string for evaluator function
  examples: TemplateExample[];
  tags: string[];
  version: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum TemplateCategory {
  CONSECUTIVE = 'consecutive',
  SEPARATION = 'separation',
  BALANCE = 'balance',
  TRAVEL = 'travel',
  VENUE = 'venue',
  TIMING = 'timing',
  FAIRNESS = 'fairness',
  CUSTOM = 'custom'
}

export interface ParameterDefinition {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'date' | 'array' | 'enum';
  required: boolean;
  defaultValue?: any;
  validation?: ParameterValidation;
  description: string;
  displayName: string;
  enumValues?: string[];
  arrayType?: string;
}

export interface ParameterValidation {
  min?: number;
  max?: number;
  pattern?: string;
  custom?: (value: any) => boolean;
  errorMessage?: string;
}

export interface ScopeOptions {
  requiresSports: boolean;
  requiresTeams: boolean;
  requiresVenues: boolean;
  requiresTimeframes: boolean;
  requiresConferences: boolean;
  requiresDivisions: boolean;
  customScopes?: string[];
}

export interface TemplateExample {
  name: string;
  description: string;
  parameters: ConstraintParameters;
  scope: Partial<ConstraintScope>;
}

export interface TemplateInstance {
  templateId: string;
  name: string;
  parameters: ConstraintParameters;
  scope: ConstraintScope;
  hardness: ConstraintHardness;
  weight: number;
}

export class ConstraintTemplateSystem {
  private templates: Map<string, ConstraintTemplate> = new Map();
  private validator: TemplateValidator;
  private evaluatorCache: Map<string, ConstraintEvaluator> = new Map();

  constructor() {
    this.validator = new TemplateValidator();
    this.loadStandardTemplates();
  }

  /**
   * Load all standard pre-built templates
   */
  private loadStandardTemplates(): void {
    const standardTemplates = StandardTemplates.getAllTemplates();
    standardTemplates.forEach(template => {
      this.registerTemplate(template);
    });
  }

  /**
   * Register a new constraint template
   */
  public registerTemplate(template: ConstraintTemplate): void {
    // Validate template structure
    const validation = this.validator.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(`Invalid template: ${validation.errors.join(', ')}`);
    }

    this.templates.set(template.id, template);
    // Clear evaluator cache for this template
    this.evaluatorCache.delete(template.id);
  }

  /**
   * Get all available templates
   */
  public getAllTemplates(): ConstraintTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: TemplateCategory): ConstraintTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get a specific template
   */
  public getTemplate(templateId: string): ConstraintTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Search templates by tags or keywords
   */
  public searchTemplates(query: string): ConstraintTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Create a constraint instance from a template
   */
  public createConstraintFromTemplate(instance: TemplateInstance): UnifiedConstraint {
    const template = this.templates.get(instance.templateId);
    if (!template) {
      throw new Error(`Template not found: ${instance.templateId}`);
    }

    // Validate instance parameters
    const validation = this.validator.validateTemplateInstance(template, instance);
    if (!validation.valid) {
      throw new Error(`Invalid template instance: ${validation.errors.join(', ')}`);
    }

    // Generate unique ID for the constraint
    const constraintId = this.generateConstraintId(template.id, instance.name);

    // Get or create evaluator
    const evaluator = this.getOrCreateEvaluator(template, instance.parameters);

    // Create the unified constraint
    const constraint: UnifiedConstraint = {
      id: constraintId,
      name: instance.name,
      type: template.type,
      hardness: instance.hardness,
      weight: instance.weight,
      scope: instance.scope,
      parameters: instance.parameters,
      evaluation: evaluator,
      metadata: this.createMetadata(template, instance),
      cacheable: true,
      parallelizable: true,
      priority: this.calculatePriority(instance.hardness, instance.weight)
    };

    return constraint;
  }

  /**
   * Create multiple constraints from a template with variations
   */
  public createConstraintVariations(
    templateId: string,
    baseInstance: Omit<TemplateInstance, 'templateId'>,
    variations: Array<{
      parameterOverrides: Partial<ConstraintParameters>;
      scopeOverrides?: Partial<ConstraintScope>;
      nameSuffix: string;
    }>
  ): UnifiedConstraint[] {
    return variations.map(variation => {
      const instance: TemplateInstance = {
        templateId,
        name: `${baseInstance.name} - ${variation.nameSuffix}`,
        parameters: { ...baseInstance.parameters, ...variation.parameterOverrides },
        scope: variation.scopeOverrides 
          ? { ...baseInstance.scope, ...variation.scopeOverrides }
          : baseInstance.scope,
        hardness: baseInstance.hardness,
        weight: baseInstance.weight
      };
      return this.createConstraintFromTemplate(instance);
    });
  }

  /**
   * Get or create an evaluator function from template
   */
  private getOrCreateEvaluator(
    template: ConstraintTemplate,
    parameters: ConstraintParameters
  ): ConstraintEvaluator {
    const cacheKey = `${template.id}_${JSON.stringify(parameters)}`;
    
    if (this.evaluatorCache.has(cacheKey)) {
      return this.evaluatorCache.get(cacheKey)!;
    }

    // Create evaluator from template
    const evaluator = this.createEvaluatorFromTemplate(
      template.evaluatorTemplate,
      parameters
    );

    this.evaluatorCache.set(cacheKey, evaluator);
    return evaluator;
  }

  /**
   * Create an evaluator function from template string
   */
  private createEvaluatorFromTemplate(
    templateString: string,
    parameters: ConstraintParameters
  ): ConstraintEvaluator {
    // This is a simplified version - in production, you'd want more security
    // and proper sandboxing for template evaluation
    try {
      // Replace parameter placeholders in template
      let evaluatorCode = templateString;
      Object.entries(parameters).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        evaluatorCode = evaluatorCode.replace(
          new RegExp(placeholder, 'g'),
          JSON.stringify(value)
        );
      });

      // Create the evaluator function
      // eslint-disable-next-line no-new-func
      const evaluatorFunction = new Function(
        'schedule',
        'parameters',
        'utils',
        evaluatorCode
      );

      // Return wrapped evaluator with utilities
      return async (schedule: Schedule, params: ConstraintParameters) => {
        const utils = this.getEvaluatorUtils();
        return evaluatorFunction(schedule, { ...parameters, ...params }, utils);
      };
    } catch (error) {
      throw new Error(`Failed to create evaluator: ${error.message}`);
    }
  }

  /**
   * Get utility functions for evaluators
   */
  private getEvaluatorUtils() {
    return {
      // Date utilities
      daysBetween: (date1: Date, date2: Date) => {
        const diff = Math.abs(date2.getTime() - date1.getTime());
        return Math.floor(diff / (1000 * 60 * 60 * 24));
      },
      
      // Game filtering utilities
      getTeamGames: (schedule: Schedule, teamId: string) => {
        return schedule.games.filter(g => 
          g.homeTeamId === teamId || g.awayTeamId === teamId
        );
      },
      
      getHomeGames: (games: Game[], teamId: string) => {
        return games.filter(g => g.homeTeamId === teamId);
      },
      
      getAwayGames: (games: Game[], teamId: string) => {
        return games.filter(g => g.awayTeamId === teamId);
      },
      
      // Consecutive game utilities
      getConsecutiveGames: (games: Game[], type: 'home' | 'away' | 'any') => {
        const sortedGames = [...games].sort((a, b) => 
          a.date.getTime() - b.date.getTime()
        );
        
        const consecutiveGroups: Game[][] = [];
        let currentGroup: Game[] = [];
        
        sortedGames.forEach((game, index) => {
          if (currentGroup.length === 0) {
            currentGroup.push(game);
          } else {
            const lastGame = currentGroup[currentGroup.length - 1];
            const isConsecutive = type === 'any' ||
              (type === 'home' && game.homeTeamId === lastGame.homeTeamId) ||
              (type === 'away' && game.awayTeamId === lastGame.awayTeamId);
            
            if (isConsecutive) {
              currentGroup.push(game);
            } else {
              if (currentGroup.length > 1) {
                consecutiveGroups.push([...currentGroup]);
              }
              currentGroup = [game];
            }
          }
        });
        
        if (currentGroup.length > 1) {
          consecutiveGroups.push(currentGroup);
        }
        
        return consecutiveGroups;
      },
      
      // Balance calculation
      calculateBalance: (values: number[]) => {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => 
          sum + Math.pow(val - avg, 2), 0
        ) / values.length;
        return Math.sqrt(variance);
      }
    };
  }

  /**
   * Generate unique constraint ID
   */
  private generateConstraintId(templateId: string, name: string): string {
    const timestamp = Date.now();
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
    return `${templateId}_${sanitizedName}_${timestamp}`;
  }

  /**
   * Create metadata for constraint
   */
  private createMetadata(
    template: ConstraintTemplate,
    instance: TemplateInstance
  ): ConstraintMetadata {
    const now = new Date();
    return {
      createdAt: now,
      updatedAt: now,
      version: template.version,
      author: template.author,
      description: `${template.description} - ${instance.name}`,
      tags: [...template.tags, `template:${template.id}`],
      relatedConstraints: []
    };
  }

  /**
   * Calculate priority based on hardness and weight
   */
  private calculatePriority(hardness: ConstraintHardness, weight: number): number {
    const hardnessMultiplier = {
      [ConstraintHardness.HARD]: 1000,
      [ConstraintHardness.SOFT]: 100,
      [ConstraintHardness.PREFERENCE]: 10
    };
    return hardnessMultiplier[hardness] + weight;
  }

  /**
   * Export template to JSON
   */
  public exportTemplate(templateId: string): string {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }
    return JSON.stringify(template, null, 2);
  }

  /**
   * Import template from JSON
   */
  public importTemplate(jsonString: string): void {
    try {
      const template = JSON.parse(jsonString) as ConstraintTemplate;
      // Convert date strings back to Date objects
      template.createdAt = new Date(template.createdAt);
      template.updatedAt = new Date(template.updatedAt);
      this.registerTemplate(template);
    } catch (error) {
      throw new Error(`Failed to import template: ${error.message}`);
    }
  }

  /**
   * Clone and modify an existing template
   */
  public cloneTemplate(
    templateId: string,
    modifications: Partial<ConstraintTemplate>
  ): ConstraintTemplate {
    const original = this.templates.get(templateId);
    if (!original) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const cloned: ConstraintTemplate = {
      ...original,
      ...modifications,
      id: `${original.id}_clone_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.registerTemplate(cloned);
    return cloned;
  }
}

// Export singleton instance
export const templateSystem = new ConstraintTemplateSystem();