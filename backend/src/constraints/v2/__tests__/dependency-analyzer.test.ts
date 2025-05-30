import { DependencyAnalyzer } from '../engines/DependencyAnalyzer';
import { UnifiedConstraint } from '../types';

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;
  let constraints: UnifiedConstraint[];

  beforeEach(() => {
    analyzer = new DependencyAnalyzer();
    
    constraints = [
      {
        id: 'venue-availability',
        type: 'venue',
        sport: 'football',
        name: 'Venue Availability',
        version: '1.0.0',
        priority: 'required',
        evaluate: jest.fn(),
        dependencies: [],
        metadata: {
          author: 'system',
          tags: ['venue'],
          description: 'Ensures venue is available',
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'team-availability',
        type: 'team',
        sport: 'football',
        name: 'Team Availability',
        version: '1.0.0',
        priority: 'required',
        evaluate: jest.fn(),
        dependencies: ['venue-availability'],
        metadata: {
          author: 'system',
          tags: ['team'],
          description: 'Ensures teams are available',
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'tv-requirements',
        type: 'broadcast',
        sport: 'football',
        name: 'TV Requirements',
        version: '1.0.0',
        priority: 'high',
        evaluate: jest.fn(),
        dependencies: ['team-availability', 'venue-availability'],
        metadata: {
          author: 'system',
          tags: ['broadcast'],
          description: 'TV broadcast requirements',
          created: new Date(),
          updated: new Date()
        }
      },
      {
        id: 'weather-conditions',
        type: 'environmental',
        sport: 'football',
        name: 'Weather Conditions',
        version: '1.0.0',
        priority: 'medium',
        evaluate: jest.fn(),
        dependencies: ['venue-availability'],
        metadata: {
          author: 'system',
          tags: ['weather'],
          description: 'Weather impact on games',
          created: new Date(),
          updated: new Date()
        }
      }
    ];
  });

  describe('Dependency Graph Building', () => {
    test('should build dependency graph from constraints', () => {
      const graph = analyzer.buildDependencyGraph(constraints);
      
      expect(graph.nodes).toHaveLength(4);
      expect(graph.edges).toHaveLength(4);
      
      // Check specific edges
      expect(graph.edges).toContainEqual({
        from: 'team-availability',
        to: 'venue-availability'
      });
      expect(graph.edges).toContainEqual({
        from: 'tv-requirements',
        to: 'team-availability'
      });
    });

    test('should handle constraints with no dependencies', () => {
      const singleConstraint = [constraints[0]]; // venue-availability has no deps
      const graph = analyzer.buildDependencyGraph(singleConstraint);
      
      expect(graph.nodes).toHaveLength(1);
      expect(graph.edges).toHaveLength(0);
    });

    test('should handle empty constraint list', () => {
      const graph = analyzer.buildDependencyGraph([]);
      
      expect(graph.nodes).toHaveLength(0);
      expect(graph.edges).toHaveLength(0);
    });
  });

  describe('Cycle Detection', () => {
    test('should detect circular dependencies', () => {
      const cyclicConstraints = [
        {
          ...constraints[0],
          dependencies: ['team-availability'] // Create cycle
        },
        constraints[1],
        constraints[2]
      ];
      
      const cycles = analyzer.detectCycles(cyclicConstraints);
      
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('venue-availability');
      expect(cycles[0]).toContain('team-availability');
    });

    test('should detect self-dependencies', () => {
      const selfDepConstraint = {
        ...constraints[0],
        dependencies: ['venue-availability'] // Self dependency
      };
      
      const cycles = analyzer.detectCycles([selfDepConstraint]);
      
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toEqual(['venue-availability']);
    });

    test('should handle no cycles', () => {
      const cycles = analyzer.detectCycles(constraints);
      expect(cycles).toHaveLength(0);
    });

    test('should detect complex cycles', () => {
      const complexConstraints = [
        { ...constraints[0], id: 'A', dependencies: ['B'] },
        { ...constraints[0], id: 'B', dependencies: ['C'] },
        { ...constraints[0], id: 'C', dependencies: ['D'] },
        { ...constraints[0], id: 'D', dependencies: ['B'] }, // Cycle: B->C->D->B
        { ...constraints[0], id: 'E', dependencies: ['A'] }
      ];
      
      const cycles = analyzer.detectCycles(complexConstraints);
      
      expect(cycles).toHaveLength(1);
      expect(cycles[0]).toContain('B');
      expect(cycles[0]).toContain('C');
      expect(cycles[0]).toContain('D');
    });
  });

  describe('Topological Sorting', () => {
    test('should sort constraints by dependencies', () => {
      const sorted = analyzer.topologicalSort(constraints);
      
      expect(sorted).toHaveLength(4);
      
      // venue-availability should come before its dependents
      const venueIndex = sorted.findIndex(c => c.id === 'venue-availability');
      const teamIndex = sorted.findIndex(c => c.id === 'team-availability');
      const tvIndex = sorted.findIndex(c => c.id === 'tv-requirements');
      const weatherIndex = sorted.findIndex(c => c.id === 'weather-conditions');
      
      expect(venueIndex).toBeLessThan(teamIndex);
      expect(venueIndex).toBeLessThan(tvIndex);
      expect(venueIndex).toBeLessThan(weatherIndex);
      expect(teamIndex).toBeLessThan(tvIndex);
    });

    test('should throw error on cyclic dependencies', () => {
      const cyclicConstraints = [
        { ...constraints[0], dependencies: ['team-availability'] },
        constraints[1]
      ];
      
      expect(() => analyzer.topologicalSort(cyclicConstraints))
        .toThrow('Circular dependency detected');
    });

    test('should handle parallel constraints', () => {
      const parallelConstraints = [
        constraints[0], // venue-availability
        { ...constraints[1], id: 'team-a', dependencies: ['venue-availability'] },
        { ...constraints[1], id: 'team-b', dependencies: ['venue-availability'] }
      ];
      
      const sorted = analyzer.topologicalSort(parallelConstraints);
      
      expect(sorted[0].id).toBe('venue-availability');
      // team-a and team-b can be in any order after venue
      expect(['team-a', 'team-b']).toContain(sorted[1].id);
      expect(['team-a', 'team-b']).toContain(sorted[2].id);
    });
  });

  describe('Dependency Analysis', () => {
    test('should find all dependents of a constraint', () => {
      const dependents = analyzer.getDependents('venue-availability', constraints);
      
      expect(dependents).toHaveLength(3);
      expect(dependents.map(c => c.id)).toContain('team-availability');
      expect(dependents.map(c => c.id)).toContain('tv-requirements');
      expect(dependents.map(c => c.id)).toContain('weather-conditions');
    });

    test('should find direct dependents only', () => {
      const directDependents = analyzer.getDirectDependents(
        'venue-availability',
        constraints
      );
      
      expect(directDependents).toHaveLength(2);
      expect(directDependents.map(c => c.id)).toContain('team-availability');
      expect(directDependents.map(c => c.id)).toContain('weather-conditions');
      expect(directDependents.map(c => c.id)).not.toContain('tv-requirements');
    });

    test('should find all dependencies of a constraint', () => {
      const dependencies = analyzer.getDependencies(
        'tv-requirements',
        constraints
      );
      
      expect(dependencies).toHaveLength(2);
      expect(dependencies.map(c => c.id)).toContain('team-availability');
      expect(dependencies.map(c => c.id)).toContain('venue-availability');
    });

    test('should calculate dependency depth', () => {
      const depths = analyzer.calculateDependencyDepths(constraints);
      
      expect(depths['venue-availability']).toBe(0);
      expect(depths['team-availability']).toBe(1);
      expect(depths['weather-conditions']).toBe(1);
      expect(depths['tv-requirements']).toBe(2);
    });
  });

  describe('Parallel Execution Groups', () => {
    test('should group constraints for parallel execution', () => {
      const groups = analyzer.getParallelExecutionGroups(constraints);
      
      expect(groups).toHaveLength(3);
      expect(groups[0].map(c => c.id)).toContain('venue-availability');
      expect(groups[1].map(c => c.id)).toContain('team-availability');
      expect(groups[1].map(c => c.id)).toContain('weather-conditions');
      expect(groups[2].map(c => c.id)).toContain('tv-requirements');
    });

    test('should handle independent constraints', () => {
      const independentConstraints = [
        { ...constraints[0], id: 'c1', dependencies: [] },
        { ...constraints[0], id: 'c2', dependencies: [] },
        { ...constraints[0], id: 'c3', dependencies: [] }
      ];
      
      const groups = analyzer.getParallelExecutionGroups(independentConstraints);
      
      expect(groups).toHaveLength(1);
      expect(groups[0]).toHaveLength(3);
    });
  });

  describe('Missing Dependencies', () => {
    test('should detect missing dependencies', () => {
      const constraintsWithMissing = [
        constraints[0],
        {
          ...constraints[1],
          dependencies: ['venue-availability', 'non-existent-constraint']
        }
      ];
      
      const missing = analyzer.findMissingDependencies(constraintsWithMissing);
      
      expect(missing).toHaveLength(1);
      expect(missing[0].constraintId).toBe('team-availability');
      expect(missing[0].missingDependencies).toContain('non-existent-constraint');
    });

    test('should handle no missing dependencies', () => {
      const missing = analyzer.findMissingDependencies(constraints);
      expect(missing).toHaveLength(0);
    });
  });

  describe('Optimization Suggestions', () => {
    test('should suggest dependency optimizations', () => {
      const suggestions = analyzer.suggestOptimizations(constraints);
      
      expect(suggestions).toBeDefined();
      expect(suggestions).toHaveProperty('parallelizableGroups');
      expect(suggestions).toHaveProperty('criticalPath');
      expect(suggestions).toHaveProperty('redundantDependencies');
    });

    test('should identify redundant dependencies', () => {
      const redundantConstraints = [
        constraints[0],
        constraints[1],
        {
          ...constraints[2],
          dependencies: [
            'team-availability',
            'venue-availability' // Redundant - already depends via team-availability
          ]
        }
      ];
      
      const suggestions = analyzer.suggestOptimizations(redundantConstraints);
      
      expect(suggestions.redundantDependencies).toHaveLength(1);
      expect(suggestions.redundantDependencies[0]).toMatchObject({
        constraintId: 'tv-requirements',
        redundant: ['venue-availability'],
        reason: expect.stringContaining('transitive')
      });
    });
  });

  describe('Visualization', () => {
    test('should generate dependency graph visualization', () => {
      const viz = analyzer.visualizeDependencies(constraints);
      
      expect(viz).toHaveProperty('nodes');
      expect(viz).toHaveProperty('edges');
      expect(viz).toHaveProperty('layout');
      expect(viz.nodes).toHaveLength(4);
      expect(viz.edges).toHaveLength(4);
    });

    test('should generate DOT format for Graphviz', () => {
      const dot = analyzer.toDOT(constraints);
      
      expect(dot).toContain('digraph');
      expect(dot).toContain('venue-availability');
      expect(dot).toContain('team-availability');
      expect(dot).toContain('->');
    });
  });
});