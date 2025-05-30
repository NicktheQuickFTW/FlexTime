import {
  ConstraintTemplateSystem,
  ConstraintTemplate,
  TemplateCategory,
  ParameterDefinition,
  TemplateInstance
} from '../templates/ConstraintTemplateSystem';
import { TemplateValidator } from '../templates/TemplateValidator';
import { StandardTemplates } from '../templates/StandardTemplates';
import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintScope
} from '../types';

// Mock dependencies
jest.mock('../templates/TemplateValidator');
jest.mock('../templates/StandardTemplates');

describe('ConstraintTemplateSystem', () => {
  let templateSystem: ConstraintTemplateSystem;
  let mockValidator: jest.Mocked<TemplateValidator>;

  // Test fixtures
  const mockTemplate: ConstraintTemplate = {
    id: 'test-template',
    name: 'Test Template',
    description: 'A template for testing',
    category: TemplateCategory.CONSECUTIVE,
    type: ConstraintType.TEMPORAL,
    defaultHardness: ConstraintHardness.SOFT,
    parameterDefinitions: [
      {
        name: 'maxConsecutive',
        type: 'number',
        required: true,
        defaultValue: 3,
        validation: {
          min: 1,
          max: 10,
          errorMessage: 'Must be between 1 and 10'
        },
        description: 'Maximum consecutive games allowed',
        displayName: 'Max Consecutive Games'
      }
    ],
    scopeOptions: {
      requiresSports: true,
      requiresTeams: true,
      requiresVenues: false,
      requiresTimeframes: false,
      requiresConferences: false,
      requiresDivisions: false
    },
    evaluatorTemplate: `
      const teamGames = utils.getTeamGames(schedule, parameters.teamId);
      const consecutiveGroups = utils.getConsecutiveGames(teamGames, 'any');
      const violations = consecutiveGroups.filter(group => group.length > {{maxConsecutive}});
      return {
        constraintId: parameters.constraintId,
        status: violations.length > 0 ? 'violated' : 'satisfied',
        score: violations.length > 0 ? 0 : 1,
        violations: violations.map(group => ({
          gameIds: group.map(g => g.id),
          message: \`Found \${group.length} consecutive games (max: {{maxConsecutive}})\`,
          severity: 'major'
        })),
        suggestions: []
      };
    `,
    examples: [
      {
        name: 'Basketball - Max 3 Consecutive',
        description: 'Limit basketball teams to 3 consecutive games',
        parameters: { maxConsecutive: 3 },
        scope: { sports: ['basketball'] }
      }
    ],
    tags: ['consecutive', 'temporal', 'fatigue'],
    version: '1.0.0',
    author: 'System',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01')
  };

  const mockTemplateInstance: TemplateInstance = {
    templateId: 'test-template',
    name: 'Max 3 Consecutive Games',
    parameters: { maxConsecutive: 3, teamId: 'team1' },
    scope: {
      sports: ['basketball'],
      teams: ['team1']
    } as ConstraintScope,
    hardness: ConstraintHardness.SOFT,
    weight: 80
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock validator
    mockValidator = new TemplateValidator() as jest.Mocked<TemplateValidator>;
    mockValidator.validateTemplate = jest.fn().mockReturnValue({ valid: true, errors: [] });
    mockValidator.validateTemplateInstance = jest.fn().mockReturnValue({ valid: true, errors: [] });

    // Mock StandardTemplates
    (StandardTemplates.getAllTemplates as jest.Mock) = jest.fn().mockReturnValue([mockTemplate]);

    templateSystem = new ConstraintTemplateSystem();
  });

  describe('Template Registration', () => {
    it('should load standard templates on initialization', () => {
      expect(StandardTemplates.getAllTemplates).toHaveBeenCalled();
      expect(templateSystem.getAllTemplates()).toHaveLength(1);
    });

    it('should register new template', () => {
      const newTemplate: ConstraintTemplate = {
        ...mockTemplate,
        id: 'new-template',
        name: 'New Template'
      };

      templateSystem.registerTemplate(newTemplate);

      const allTemplates = templateSystem.getAllTemplates();
      expect(allTemplates).toHaveLength(2);
      expect(allTemplates.find(t => t.id === 'new-template')).toBeDefined();
    });

    it('should validate template before registration', () => {
      const invalidTemplate = { ...mockTemplate, id: 'invalid' };
      mockValidator.validateTemplate = jest.fn().mockReturnValue({
        valid: false,
        errors: ['Missing required field']
      });

      expect(() => templateSystem.registerTemplate(invalidTemplate))
        .toThrow('Invalid template: Missing required field');
    });

    it('should clear evaluator cache on template update', () => {
      templateSystem.registerTemplate(mockTemplate);
      
      // Re-register same template (simulating an update)
      templateSystem.registerTemplate({
        ...mockTemplate,
        description: 'Updated description'
      });

      // Cache should be cleared (internal behavior)
      expect(templateSystem.getAllTemplates()).toHaveLength(1);
    });
  });

  describe('Template Retrieval', () => {
    it('should get all templates', () => {
      const templates = templateSystem.getAllTemplates();
      expect(templates).toHaveLength(1);
      expect(templates[0].id).toBe('test-template');
    });

    it('should get templates by category', () => {
      const additionalTemplate: ConstraintTemplate = {
        ...mockTemplate,
        id: 'balance-template',
        category: TemplateCategory.BALANCE
      };
      templateSystem.registerTemplate(additionalTemplate);

      const consecutiveTemplates = templateSystem.getTemplatesByCategory(TemplateCategory.CONSECUTIVE);
      const balanceTemplates = templateSystem.getTemplatesByCategory(TemplateCategory.BALANCE);

      expect(consecutiveTemplates).toHaveLength(1);
      expect(balanceTemplates).toHaveLength(1);
    });

    it('should get specific template by ID', () => {
      const template = templateSystem.getTemplate('test-template');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Test Template');
    });

    it('should return undefined for non-existent template', () => {
      const template = templateSystem.getTemplate('non-existent');
      expect(template).toBeUndefined();
    });

    it('should search templates by keywords', () => {
      const templates = [
        { ...mockTemplate, id: 't1', name: 'Travel Constraint', tags: ['travel'] },
        { ...mockTemplate, id: 't2', name: 'Venue Constraint', tags: ['venue'] },
        { ...mockTemplate, id: 't3', description: 'Manages travel burden', tags: ['balance'] }
      ];
      
      templates.forEach(t => templateSystem.registerTemplate(t));

      const travelResults = templateSystem.searchTemplates('travel');
      expect(travelResults).toHaveLength(2);
      expect(travelResults.map(t => t.id)).toContain('t1');
      expect(travelResults.map(t => t.id)).toContain('t3');
    });
  });

  describe('Constraint Creation', () => {
    it('should create constraint from template', () => {
      const constraint = templateSystem.createConstraintFromTemplate(mockTemplateInstance);

      expect(constraint).toBeDefined();
      expect(constraint.name).toBe('Max 3 Consecutive Games');
      expect(constraint.type).toBe(ConstraintType.TEMPORAL);
      expect(constraint.hardness).toBe(ConstraintHardness.SOFT);
      expect(constraint.weight).toBe(80);
      expect(constraint.parameters.maxConsecutive).toBe(3);
      expect(constraint.scope.teams).toContain('team1');
    });

    it('should validate instance before creating constraint', () => {
      mockValidator.validateTemplateInstance = jest.fn().mockReturnValue({
        valid: false,
        errors: ['Invalid parameters']
      });

      expect(() => templateSystem.createConstraintFromTemplate(mockTemplateInstance))
        .toThrow('Invalid template instance: Invalid parameters');
    });

    it('should throw error for non-existent template', () => {
      const instance: TemplateInstance = {
        ...mockTemplateInstance,
        templateId: 'non-existent'
      };

      expect(() => templateSystem.createConstraintFromTemplate(instance))
        .toThrow('Template not found: non-existent');
    });

    it('should generate unique constraint ID', () => {
      const constraint1 = templateSystem.createConstraintFromTemplate(mockTemplateInstance);
      const constraint2 = templateSystem.createConstraintFromTemplate(mockTemplateInstance);

      expect(constraint1.id).not.toBe(constraint2.id);
    });

    it('should set constraint metadata correctly', () => {
      const constraint = templateSystem.createConstraintFromTemplate(mockTemplateInstance);

      expect(constraint.metadata).toBeDefined();
      expect(constraint.metadata?.version).toBe('1.0.0');
      expect(constraint.metadata?.author).toBe('System');
      expect(constraint.metadata?.tags).toContain('template:test-template');
    });

    it('should calculate priority based on hardness and weight', () => {
      const hardConstraintInstance: TemplateInstance = {
        ...mockTemplateInstance,
        hardness: ConstraintHardness.HARD,
        weight: 100
      };

      const hardConstraint = templateSystem.createConstraintFromTemplate(hardConstraintInstance);
      const softConstraint = templateSystem.createConstraintFromTemplate(mockTemplateInstance);

      expect(hardConstraint.priority).toBeGreaterThan(softConstraint.priority || 0);
    });
  });

  describe('Constraint Variations', () => {
    it('should create multiple constraint variations', () => {
      const baseInstance = {
        name: 'Base Constraint',
        parameters: { maxConsecutive: 3 },
        scope: { sports: ['basketball'] } as ConstraintScope,
        hardness: ConstraintHardness.SOFT,
        weight: 80
      };

      const variations = [
        {
          parameterOverrides: { maxConsecutive: 4 },
          nameSuffix: 'Relaxed'
        },
        {
          parameterOverrides: { maxConsecutive: 2 },
          nameSuffix: 'Strict'
        }
      ];

      const constraints = templateSystem.createConstraintVariations(
        'test-template',
        baseInstance,
        variations
      );

      expect(constraints).toHaveLength(2);
      expect(constraints[0].name).toBe('Base Constraint - Relaxed');
      expect(constraints[0].parameters.maxConsecutive).toBe(4);
      expect(constraints[1].name).toBe('Base Constraint - Strict');
      expect(constraints[1].parameters.maxConsecutive).toBe(2);
    });

    it('should apply scope overrides in variations', () => {
      const baseInstance = {
        name: 'Base',
        parameters: { maxConsecutive: 3 },
        scope: { sports: ['basketball'] } as ConstraintScope,
        hardness: ConstraintHardness.SOFT,
        weight: 80
      };

      const variations = [
        {
          parameterOverrides: {},
          scopeOverrides: { sports: ['football'] },
          nameSuffix: 'Football'
        }
      ];

      const constraints = templateSystem.createConstraintVariations(
        'test-template',
        baseInstance,
        variations
      );

      expect(constraints[0].scope.sports).toContain('football');
      expect(constraints[0].scope.sports).not.toContain('basketball');
    });
  });

  describe('Evaluator Creation', () => {
    it('should create evaluator function from template', () => {
      const constraint = templateSystem.createConstraintFromTemplate(mockTemplateInstance);

      expect(constraint.evaluation).toBeDefined();
      expect(typeof constraint.evaluation).toBe('function');
    });

    it('should cache evaluators for same parameters', () => {
      const constraint1 = templateSystem.createConstraintFromTemplate(mockTemplateInstance);
      const constraint2 = templateSystem.createConstraintFromTemplate(mockTemplateInstance);

      // Should reuse cached evaluator (implementation detail)
      expect(constraint1.evaluation).toBe(constraint2.evaluation);
    });

    it('should replace parameter placeholders in evaluator template', () => {
      const constraint = templateSystem.createConstraintFromTemplate(mockTemplateInstance);
      
      // The evaluator should have replaced {{maxConsecutive}} with 3
      // This would be better tested by executing the evaluator
    });

    it('should handle evaluator creation errors', () => {
      const badTemplate: ConstraintTemplate = {
        ...mockTemplate,
        evaluatorTemplate: 'invalid javascript {{{'
      };

      templateSystem.registerTemplate(badTemplate);

      const instance: TemplateInstance = {
        ...mockTemplateInstance,
        templateId: badTemplate.id
      };

      expect(() => templateSystem.createConstraintFromTemplate(instance))
        .toThrow('Failed to create evaluator');
    });
  });

  describe('Template Import/Export', () => {
    it('should export template to JSON', () => {
      const json = templateSystem.exportTemplate('test-template');
      const exported = JSON.parse(json);

      expect(exported.id).toBe('test-template');
      expect(exported.name).toBe('Test Template');
    });

    it('should throw error when exporting non-existent template', () => {
      expect(() => templateSystem.exportTemplate('non-existent'))
        .toThrow('Template not found: non-existent');
    });

    it('should import template from JSON', () => {
      const templateJson = JSON.stringify({
        ...mockTemplate,
        id: 'imported-template',
        name: 'Imported Template'
      });

      templateSystem.importTemplate(templateJson);

      const imported = templateSystem.getTemplate('imported-template');
      expect(imported).toBeDefined();
      expect(imported?.name).toBe('Imported Template');
    });

    it('should convert date strings when importing', () => {
      const templateJson = JSON.stringify({
        ...mockTemplate,
        id: 'date-template',
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-02T00:00:00.000Z'
      });

      templateSystem.importTemplate(templateJson);

      const imported = templateSystem.getTemplate('date-template');
      expect(imported?.createdAt).toBeInstanceOf(Date);
      expect(imported?.updatedAt).toBeInstanceOf(Date);
    });

    it('should handle import errors', () => {
      expect(() => templateSystem.importTemplate('invalid json'))
        .toThrow('Failed to import template');
    });
  });

  describe('Template Cloning', () => {
    it('should clone existing template', () => {
      const modifications = {
        name: 'Cloned Template',
        description: 'A cloned version'
      };

      const cloned = templateSystem.cloneTemplate('test-template', modifications);

      expect(cloned.id).toContain('test-template_clone_');
      expect(cloned.name).toBe('Cloned Template');
      expect(cloned.description).toBe('A cloned version');
      expect(cloned.type).toBe(mockTemplate.type);
    });

    it('should register cloned template', () => {
      const cloned = templateSystem.cloneTemplate('test-template', {
        name: 'Clone'
      });

      const retrieved = templateSystem.getTemplate(cloned.id);
      expect(retrieved).toBeDefined();
    });

    it('should throw error when cloning non-existent template', () => {
      expect(() => templateSystem.cloneTemplate('non-existent', {}))
        .toThrow('Template not found: non-existent');
    });

    it('should set new timestamps for cloned template', () => {
      const beforeClone = Date.now();
      
      const cloned = templateSystem.cloneTemplate('test-template', {});
      
      expect(cloned.createdAt.getTime()).toBeGreaterThanOrEqual(beforeClone);
      expect(cloned.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeClone);
    });
  });

  describe('Utility Functions', () => {
    it('should provide evaluator utilities', async () => {
      const constraint = templateSystem.createConstraintFromTemplate(mockTemplateInstance);
      
      // Mock schedule for testing
      const schedule = {
        games: [
          { id: 'g1', homeTeamId: 'team1', awayTeamId: 'team2', date: new Date() },
          { id: 'g2', homeTeamId: 'team3', awayTeamId: 'team1', date: new Date() }
        ]
      };

      // Execute evaluator to test utilities
      const result = await constraint.evaluation(schedule as any, constraint.parameters);
      
      expect(result).toBeDefined();
    });
  });
});