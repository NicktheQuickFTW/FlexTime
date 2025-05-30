// Template Builder - Visual constraint template creation and editing
// Version 2.0 - Interactive template building system

import {
  ConstraintTemplate,
  TemplateCategory,
  ParameterDefinition,
  ScopeOptions,
  TemplateExample,
  ConstraintTemplateSystem
} from './ConstraintTemplateSystem';
import { ConstraintType, ConstraintHardness } from '../types';

export interface TemplateBuilderConfig {
  allowCustomEvaluators: boolean;
  validateOnBuild: boolean;
  autoGenerateExamples: boolean;
  supportedLanguages: string[];
}

export interface BuilderStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  data?: any;
}

export interface EvaluatorSnippet {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters: string[];
  category: string;
}

export class TemplateBuilder {
  private config: TemplateBuilderConfig;
  private currentTemplate: Partial<ConstraintTemplate>;
  private steps: BuilderStep[];
  private evaluatorSnippets: Map<string, EvaluatorSnippet>;
  private templateSystem: ConstraintTemplateSystem;

  constructor(config?: Partial<TemplateBuilderConfig>) {
    this.config = {
      allowCustomEvaluators: true,
      validateOnBuild: true,
      autoGenerateExamples: true,
      supportedLanguages: ['javascript'],
      ...config
    };

    this.templateSystem = new ConstraintTemplateSystem();
    this.initializeSteps();
    this.loadEvaluatorSnippets();
    this.reset();
  }

  /**
   * Initialize builder steps
   */
  private initializeSteps(): void {
    this.steps = [
      {
        id: 'basic-info',
        name: 'Basic Information',
        description: 'Set template name, description, and category',
        required: true,
        completed: false
      },
      {
        id: 'constraint-type',
        name: 'Constraint Type',
        description: 'Select the type and default hardness',
        required: true,
        completed: false
      },
      {
        id: 'parameters',
        name: 'Parameters',
        description: 'Define constraint parameters',
        required: true,
        completed: false
      },
      {
        id: 'scope',
        name: 'Scope Options',
        description: 'Configure scope requirements',
        required: true,
        completed: false
      },
      {
        id: 'evaluator',
        name: 'Evaluator Logic',
        description: 'Build the evaluation function',
        required: true,
        completed: false
      },
      {
        id: 'examples',
        name: 'Examples',
        description: 'Add usage examples',
        required: false,
        completed: false
      },
      {
        id: 'metadata',
        name: 'Metadata',
        description: 'Add tags and additional information',
        required: false,
        completed: false
      }
    ];
  }

  /**
   * Load pre-built evaluator snippets
   */
  private loadEvaluatorSnippets(): void {
    this.evaluatorSnippets = new Map([
      ['consecutive-check', {
        id: 'consecutive-check',
        name: 'Consecutive Games Check',
        description: 'Check for consecutive games pattern',
        code: `
// Check consecutive games
let consecutiveCount = 1;
let maxConsecutive = 0;

for (let i = 1; i < games.length; i++) {
  const daysDiff = utils.daysBetween(games[i-1].date, games[i].date);
  
  if (daysDiff <= {{daysBetween}}) {
    consecutiveCount++;
    maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
  } else {
    consecutiveCount = 1;
  }
}`,
        parameters: ['daysBetween'],
        category: 'temporal'
      }],
      ['home-away-balance', {
        id: 'home-away-balance',
        name: 'Home/Away Balance Check',
        description: 'Calculate home/away game balance',
        code: `
// Calculate home/away balance
const homeGames = utils.getHomeGames(teamGames, teamId);
const awayGames = utils.getAwayGames(teamGames, teamId);
const imbalance = Math.abs(homeGames.length - awayGames.length);`,
        parameters: [],
        category: 'balance'
      }],
      ['distance-calculation', {
        id: 'distance-calculation',
        name: 'Distance Calculation',
        description: 'Calculate distance between venues',
        code: `
// Calculate distance between venues
const calculateDistance = (venue1, venue2) => {
  const R = 3959; // Earth radius in miles
  const lat1 = venue1.location.latitude * Math.PI / 180;
  const lat2 = venue2.location.latitude * Math.PI / 180;
  const deltaLat = (venue2.location.latitude - venue1.location.latitude) * Math.PI / 180;
  const deltaLon = (venue2.location.longitude - venue1.location.longitude) * Math.PI / 180;
  
  const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
            Math.cos(lat1) * Math.cos(lat2) *
            Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  
  return R * c;
};`,
        parameters: [],
        category: 'spatial'
      }],
      ['week-grouping', {
        id: 'week-grouping',
        name: 'Week Grouping',
        description: 'Group games by week',
        code: `
// Group games by week
const gamesByWeek = {};

games.forEach(game => {
  const week = game.week || Math.floor((game.date - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  if (!gamesByWeek[week]) {
    gamesByWeek[week] = [];
  }
  gamesByWeek[week].push(game);
});`,
        parameters: [],
        category: 'temporal'
      }],
      ['violation-builder', {
        id: 'violation-builder',
        name: 'Violation Builder',
        description: 'Create violation object',
        code: `
// Create violation
violations.push({
  type: '{{violationType}}',
  severity: '{{severity}}',
  affectedEntities: [{{entities}}],
  description: \`{{description}}\`,
  possibleResolutions: [{{resolutions}}]
});`,
        parameters: ['violationType', 'severity', 'entities', 'description', 'resolutions'],
        category: 'utility'
      }]
    ]);
  }

  /**
   * Reset the builder to initial state
   */
  public reset(): void {
    this.currentTemplate = {
      id: '',
      name: '',
      description: '',
      version: '1.0.0',
      author: 'Template Builder',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.steps.forEach(step => {
      step.completed = false;
      step.data = undefined;
    });
  }

  /**
   * Set basic information
   */
  public setBasicInfo(
    name: string,
    description: string,
    category: TemplateCategory
  ): void {
    this.currentTemplate.name = name;
    this.currentTemplate.description = description;
    this.currentTemplate.category = category;
    this.currentTemplate.id = this.generateTemplateId(name);
    
    this.markStepComplete('basic-info', { name, description, category });
  }

  /**
   * Set constraint type information
   */
  public setConstraintType(
    type: ConstraintType,
    defaultHardness: ConstraintHardness
  ): void {
    this.currentTemplate.type = type;
    this.currentTemplate.defaultHardness = defaultHardness;
    
    this.markStepComplete('constraint-type', { type, defaultHardness });
  }

  /**
   * Add a parameter definition
   */
  public addParameter(parameter: ParameterDefinition): void {
    if (!this.currentTemplate.parameterDefinitions) {
      this.currentTemplate.parameterDefinitions = [];
    }
    
    this.currentTemplate.parameterDefinitions.push(parameter);
    this.updateStepData('parameters', this.currentTemplate.parameterDefinitions);
  }

  /**
   * Remove a parameter
   */
  public removeParameter(parameterName: string): void {
    if (!this.currentTemplate.parameterDefinitions) return;
    
    this.currentTemplate.parameterDefinitions = 
      this.currentTemplate.parameterDefinitions.filter(p => p.name !== parameterName);
    
    this.updateStepData('parameters', this.currentTemplate.parameterDefinitions);
  }

  /**
   * Set scope options
   */
  public setScopeOptions(scopeOptions: ScopeOptions): void {
    this.currentTemplate.scopeOptions = scopeOptions;
    this.markStepComplete('scope', scopeOptions);
  }

  /**
   * Build evaluator from snippets and custom code
   */
  public buildEvaluator(components: EvaluatorComponent[]): void {
    const evaluatorCode = this.assembleEvaluator(components);
    this.currentTemplate.evaluatorTemplate = evaluatorCode;
    this.markStepComplete('evaluator', { components, code: evaluatorCode });
  }

  /**
   * Add an example
   */
  public addExample(example: TemplateExample): void {
    if (!this.currentTemplate.examples) {
      this.currentTemplate.examples = [];
    }
    
    this.currentTemplate.examples.push(example);
    this.updateStepData('examples', this.currentTemplate.examples);
  }

  /**
   * Set metadata
   */
  public setMetadata(tags: string[], additionalInfo?: any): void {
    this.currentTemplate.tags = tags;
    if (additionalInfo) {
      this.currentTemplate = { ...this.currentTemplate, ...additionalInfo };
    }
    
    this.markStepComplete('metadata', { tags, additionalInfo });
  }

  /**
   * Build the final template
   */
  public build(): ConstraintTemplate {
    // Validate all required steps are complete
    const incompleteSteps = this.steps
      .filter(s => s.required && !s.completed)
      .map(s => s.name);
    
    if (incompleteSteps.length > 0) {
      throw new Error(`Incomplete required steps: ${incompleteSteps.join(', ')}`);
    }

    // Auto-generate examples if configured
    if (this.config.autoGenerateExamples && !this.currentTemplate.examples?.length) {
      this.currentTemplate.examples = this.generateExamples();
    }

    // Create the final template
    const template: ConstraintTemplate = {
      id: this.currentTemplate.id!,
      name: this.currentTemplate.name!,
      description: this.currentTemplate.description!,
      category: this.currentTemplate.category!,
      type: this.currentTemplate.type!,
      defaultHardness: this.currentTemplate.defaultHardness!,
      parameterDefinitions: this.currentTemplate.parameterDefinitions || [],
      scopeOptions: this.currentTemplate.scopeOptions!,
      evaluatorTemplate: this.currentTemplate.evaluatorTemplate!,
      examples: this.currentTemplate.examples || [],
      tags: this.currentTemplate.tags || [],
      version: this.currentTemplate.version!,
      author: this.currentTemplate.author!,
      createdAt: this.currentTemplate.createdAt!,
      updatedAt: new Date()
    };

    // Validate if configured
    if (this.config.validateOnBuild) {
      const validation = this.templateSystem['validator'].validateTemplate(template);
      if (!validation.valid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }
    }

    return template;
  }

  /**
   * Get current progress
   */
  public getProgress(): BuilderProgress {
    const totalSteps = this.steps.length;
    const completedSteps = this.steps.filter(s => s.completed).length;
    const requiredSteps = this.steps.filter(s => s.required).length;
    const completedRequired = this.steps.filter(s => s.required && s.completed).length;

    return {
      totalSteps,
      completedSteps,
      requiredSteps,
      completedRequired,
      percentComplete: Math.round((completedSteps / totalSteps) * 100),
      canBuild: completedRequired === requiredSteps,
      steps: this.steps.map(s => ({ ...s }))
    };
  }

  /**
   * Get available snippets for a category
   */
  public getSnippets(category?: string): EvaluatorSnippet[] {
    const snippets = Array.from(this.evaluatorSnippets.values());
    return category 
      ? snippets.filter(s => s.category === category)
      : snippets;
  }

  /**
   * Create custom snippet
   */
  public createSnippet(snippet: EvaluatorSnippet): void {
    this.evaluatorSnippets.set(snippet.id, snippet);
  }

  /**
   * Preview the template
   */
  public preview(): Partial<ConstraintTemplate> {
    return { ...this.currentTemplate };
  }

  /**
   * Load template for editing
   */
  public loadTemplate(template: ConstraintTemplate): void {
    this.reset();
    this.currentTemplate = { ...template };
    
    // Mark steps as complete based on loaded data
    if (template.name && template.description && template.category) {
      this.markStepComplete('basic-info', {
        name: template.name,
        description: template.description,
        category: template.category
      });
    }
    
    if (template.type && template.defaultHardness) {
      this.markStepComplete('constraint-type', {
        type: template.type,
        defaultHardness: template.defaultHardness
      });
    }
    
    if (template.parameterDefinitions?.length > 0) {
      this.markStepComplete('parameters', template.parameterDefinitions);
    }
    
    if (template.scopeOptions) {
      this.markStepComplete('scope', template.scopeOptions);
    }
    
    if (template.evaluatorTemplate) {
      this.markStepComplete('evaluator', { code: template.evaluatorTemplate });
    }
    
    if (template.examples?.length > 0) {
      this.markStepComplete('examples', template.examples);
    }
    
    if (template.tags?.length > 0) {
      this.markStepComplete('metadata', { tags: template.tags });
    }
  }

  /**
   * Generate template ID from name
   */
  private generateTemplateId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }

  /**
   * Mark a step as complete
   */
  private markStepComplete(stepId: string, data: any): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
      step.data = data;
    }
  }

  /**
   * Update step data without marking complete
   */
  private updateStepData(stepId: string, data: any): void {
    const step = this.steps.find(s => s.id === stepId);
    if (step) {
      step.data = data;
      step.completed = data && (Array.isArray(data) ? data.length > 0 : true);
    }
  }

  /**
   * Assemble evaluator from components
   */
  private assembleEvaluator(components: EvaluatorComponent[]): string {
    const sections: string[] = [
      '// Auto-generated evaluator function',
      'const violations = [];',
      'const suggestions = [];',
      ''
    ];

    // Add parameter extraction
    if (this.currentTemplate.parameterDefinitions) {
      this.currentTemplate.parameterDefinitions.forEach(param => {
        sections.push(`const ${param.name} = {{${param.name}}};`);
      });
      sections.push('');
    }

    // Add component code
    components.forEach(component => {
      if (component.type === 'snippet') {
        const snippet = this.evaluatorSnippets.get(component.snippetId!);
        if (snippet) {
          sections.push(`// ${snippet.name}`);
          sections.push(snippet.code);
          sections.push('');
        }
      } else if (component.type === 'custom') {
        sections.push('// Custom code');
        sections.push(component.customCode!);
        sections.push('');
      }
    });

    // Add standard return structure
    sections.push(`
// Calculate final results
const satisfied = violations.length === 0;
const score = satisfied ? 1.0 : Math.max(0, 1 - violations.length * 0.1);

return {
  constraintId: parameters.constraintId,
  status: satisfied ? 'satisfied' : 'violated',
  satisfied,
  score,
  message: satisfied 
    ? 'Constraint satisfied' 
    : \`Found \${violations.length} violations\`,
  violations,
  suggestions
};`);

    return sections.join('\n');
  }

  /**
   * Generate example configurations
   */
  private generateExamples(): TemplateExample[] {
    const examples: TemplateExample[] = [];
    
    // Generate a default example
    const defaultParams: any = {};
    this.currentTemplate.parameterDefinitions?.forEach(param => {
      defaultParams[param.name] = param.defaultValue;
    });

    examples.push({
      name: 'Default Configuration',
      description: `Default ${this.currentTemplate.name} configuration`,
      parameters: defaultParams,
      scope: this.generateExampleScope()
    });

    return examples;
  }

  /**
   * Generate example scope based on scope options
   */
  private generateExampleScope(): Partial<ConstraintScope> {
    const scope: any = {};
    const options = this.currentTemplate.scopeOptions;
    
    if (options?.requiresSports) {
      scope.sports = ['basketball'];
    }
    if (options?.requiresTeams) {
      scope.teams = ['team1', 'team2'];
    }
    if (options?.requiresVenues) {
      scope.venues = ['venue1'];
    }
    if (options?.requiresConferences) {
      scope.conferences = ['Conference1'];
    }
    
    return scope;
  }
}

// Supporting interfaces
export interface EvaluatorComponent {
  type: 'snippet' | 'custom';
  snippetId?: string;
  customCode?: string;
  order: number;
}

export interface BuilderProgress {
  totalSteps: number;
  completedSteps: number;
  requiredSteps: number;
  completedRequired: number;
  percentComplete: number;
  canBuild: boolean;
  steps: BuilderStep[];
}

// Parameter builder helper
export class ParameterBuilder {
  static number(
    name: string,
    displayName: string,
    description: string,
    options?: {
      required?: boolean;
      defaultValue?: number;
      min?: number;
      max?: number;
    }
  ): ParameterDefinition {
    return {
      name,
      type: 'number',
      required: options?.required ?? true,
      defaultValue: options?.defaultValue,
      validation: {
        min: options?.min,
        max: options?.max
      },
      description,
      displayName
    };
  }

  static boolean(
    name: string,
    displayName: string,
    description: string,
    options?: {
      required?: boolean;
      defaultValue?: boolean;
    }
  ): ParameterDefinition {
    return {
      name,
      type: 'boolean',
      required: options?.required ?? false,
      defaultValue: options?.defaultValue ?? false,
      description,
      displayName
    };
  }

  static enum(
    name: string,
    displayName: string,
    description: string,
    enumValues: string[],
    options?: {
      required?: boolean;
      defaultValue?: string;
    }
  ): ParameterDefinition {
    return {
      name,
      type: 'enum',
      required: options?.required ?? true,
      defaultValue: options?.defaultValue ?? enumValues[0],
      enumValues,
      description,
      displayName
    };
  }

  static array(
    name: string,
    displayName: string,
    description: string,
    arrayType: string,
    options?: {
      required?: boolean;
      defaultValue?: any[];
    }
  ): ParameterDefinition {
    return {
      name,
      type: 'array',
      arrayType,
      required: options?.required ?? true,
      defaultValue: options?.defaultValue ?? [],
      description,
      displayName
    };
  }
}

// Export singleton instance
export const templateBuilder = new TemplateBuilder();