import { UnifiedConstraint } from '../types';

export interface ConstraintDependency {
  constraint: UnifiedConstraint;
  dependencies: string[]; // Constraint IDs this depends on
  dependents: string[]; // Constraint IDs that depend on this
  level: number; // Topological level (0 = no dependencies)
  circular: boolean; // Part of circular dependency
}

export interface DependencyGraph {
  nodes: Map<string, ConstraintDependency>;
  edges: Map<string, Set<string>>; // adjacency list
  levels: Map<number, string[]>; // constraints by topological level
  hasCircularDependencies: boolean;
  circularGroups: string[][]; // groups of constraints in circular dependencies
}

export interface DependencyAnalysis {
  graph: DependencyGraph;
  executionOrder: string[]; // Optimal execution order
  parallelGroups: string[][]; // Groups that can be executed in parallel
  criticalPath: string[]; // Longest dependency chain
  bottlenecks: string[]; // Constraints with most dependents
}

export class DependencyAnalyzer {
  analyze(constraints: UnifiedConstraint[]): Map<string, ConstraintDependency> {
    const graph = this.buildDependencyGraph(constraints);
    this.detectCircularDependencies(graph);
    this.calculateTopologicalLevels(graph);
    
    return graph.nodes;
  }

  analyzeComplete(constraints: UnifiedConstraint[]): DependencyAnalysis {
    const graph = this.buildDependencyGraph(constraints);
    this.detectCircularDependencies(graph);
    this.calculateTopologicalLevels(graph);
    
    const executionOrder = this.calculateExecutionOrder(graph);
    const parallelGroups = this.identifyParallelGroups(graph);
    const criticalPath = this.findCriticalPath(graph);
    const bottlenecks = this.identifyBottlenecks(graph);

    return {
      graph,
      executionOrder,
      parallelGroups,
      criticalPath,
      bottlenecks
    };
  }

  private buildDependencyGraph(constraints: UnifiedConstraint[]): DependencyGraph {
    const nodes = new Map<string, ConstraintDependency>();
    const edges = new Map<string, Set<string>>();

    // Initialize nodes
    for (const constraint of constraints) {
      nodes.set(constraint.id, {
        constraint,
        dependencies: constraint.dependencies || [],
        dependents: [],
        level: -1,
        circular: false
      });

      edges.set(constraint.id, new Set(constraint.dependencies || []));
    }

    // Build reverse dependencies (dependents)
    for (const constraint of constraints) {
      if (constraint.dependencies) {
        for (const depId of constraint.dependencies) {
          const depNode = nodes.get(depId);
          if (depNode) {
            depNode.dependents.push(constraint.id);
          }
        }
      }
    }

    // Also check for conflicts
    for (const constraint of constraints) {
      if (constraint.conflictsWith) {
        for (const conflictId of constraint.conflictsWith) {
          // Add bidirectional conflict edges
          edges.get(constraint.id)?.add(conflictId);
          edges.get(conflictId)?.add(constraint.id);
        }
      }
    }

    return {
      nodes,
      edges,
      levels: new Map(),
      hasCircularDependencies: false,
      circularGroups: []
    };
  }

  private detectCircularDependencies(graph: DependencyGraph): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const circularGroups: string[][] = [];

    const detectCycle = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const dependencies = graph.edges.get(nodeId) || new Set();
      
      for (const depId of dependencies) {
        if (!visited.has(depId)) {
          if (detectCycle(depId, [...path])) {
            return true;
          }
        } else if (recursionStack.has(depId)) {
          // Found a cycle
          const cycleStart = path.indexOf(depId);
          const cycle = path.slice(cycleStart);
          cycle.push(depId); // Complete the cycle
          
          circularGroups.push(cycle);
          
          // Mark all nodes in cycle
          for (const id of cycle) {
            const node = graph.nodes.get(id);
            if (node) {
              node.circular = true;
            }
          }
          
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    // Check each unvisited node
    for (const [nodeId] of graph.nodes) {
      if (!visited.has(nodeId)) {
        detectCycle(nodeId, []);
      }
    }

    graph.hasCircularDependencies = circularGroups.length > 0;
    graph.circularGroups = circularGroups;
  }

  private calculateTopologicalLevels(graph: DependencyGraph): void {
    if (graph.hasCircularDependencies) {
      // Handle circular dependencies by treating circular groups as single units
      this.calculateLevelsWithCircular(graph);
      return;
    }

    const inDegree = new Map<string, number>();
    const queue: string[] = [];

    // Calculate in-degrees
    for (const [nodeId] of graph.nodes) {
      inDegree.set(nodeId, 0);
    }

    for (const [, dependencies] of graph.edges) {
      for (const depId of dependencies) {
        inDegree.set(depId, (inDegree.get(depId) || 0) + 1);
      }
    }

    // Find nodes with no dependencies
    for (const [nodeId, degree] of inDegree) {
      if (degree === 0) {
        queue.push(nodeId);
        const node = graph.nodes.get(nodeId)!;
        node.level = 0;
      }
    }

    // Process nodes level by level
    let currentLevel = 0;
    while (queue.length > 0) {
      const levelSize = queue.length;
      graph.levels.set(currentLevel, [...queue]);

      for (let i = 0; i < levelSize; i++) {
        const nodeId = queue.shift()!;
        const node = graph.nodes.get(nodeId)!;

        // Process dependents
        for (const depId of node.dependents) {
          inDegree.set(depId, (inDegree.get(depId) || 0) - 1);
          
          if (inDegree.get(depId) === 0) {
            queue.push(depId);
            const depNode = graph.nodes.get(depId)!;
            depNode.level = currentLevel + 1;
          }
        }
      }

      currentLevel++;
    }
  }

  private calculateLevelsWithCircular(graph: DependencyGraph): void {
    // Treat each circular group as a single unit
    const circularGroupMap = new Map<string, number>();
    
    graph.circularGroups.forEach((group, index) => {
      for (const nodeId of group) {
        circularGroupMap.set(nodeId, index);
      }
    });

    // Create a condensed graph where circular groups are single nodes
    const condensedGraph = this.createCondensedGraph(graph, circularGroupMap);
    
    // Calculate levels on condensed graph
    this.calculateTopologicalLevels(condensedGraph);

    // Apply levels back to original graph
    for (const [nodeId, node] of graph.nodes) {
      const groupId = circularGroupMap.get(nodeId);
      if (groupId !== undefined) {
        const condensedNodeId = `group_${groupId}`;
        const condensedNode = condensedGraph.nodes.get(condensedNodeId);
        if (condensedNode) {
          node.level = condensedNode.level;
        }
      }
    }
  }

  private createCondensedGraph(
    graph: DependencyGraph,
    circularGroupMap: Map<string, number>
  ): DependencyGraph {
    const condensedNodes = new Map<string, ConstraintDependency>();
    const condensedEdges = new Map<string, Set<string>>();

    // Create nodes for circular groups
    const processedGroups = new Set<number>();
    for (const [nodeId, groupId] of circularGroupMap) {
      if (!processedGroups.has(groupId)) {
        const groupNodeId = `group_${groupId}`;
        const node = graph.nodes.get(nodeId)!;
        
        condensedNodes.set(groupNodeId, {
          constraint: node.constraint, // Representative constraint
          dependencies: [],
          dependents: [],
          level: -1,
          circular: true
        });
        
        condensedEdges.set(groupNodeId, new Set());
        processedGroups.add(groupId);
      }
    }

    // Add non-circular nodes
    for (const [nodeId, node] of graph.nodes) {
      if (!circularGroupMap.has(nodeId)) {
        condensedNodes.set(nodeId, { ...node });
        condensedEdges.set(nodeId, new Set());
      }
    }

    // Build edges for condensed graph
    for (const [nodeId, dependencies] of graph.edges) {
      const sourceId = circularGroupMap.has(nodeId)
        ? `group_${circularGroupMap.get(nodeId)}`
        : nodeId;

      for (const depId of dependencies) {
        const targetId = circularGroupMap.has(depId)
          ? `group_${circularGroupMap.get(depId)}`
          : depId;

        if (sourceId !== targetId) {
          condensedEdges.get(sourceId)?.add(targetId);
        }
      }
    }

    return {
      nodes: condensedNodes,
      edges: condensedEdges,
      levels: new Map(),
      hasCircularDependencies: false,
      circularGroups: []
    };
  }

  private calculateExecutionOrder(graph: DependencyGraph): string[] {
    const order: string[] = [];
    
    // Process by levels
    const levels = Array.from(graph.levels.keys()).sort((a, b) => a - b);
    
    for (const level of levels) {
      const nodesAtLevel = graph.levels.get(level) || [];
      
      // Within a level, sort by number of dependents (process bottlenecks first)
      nodesAtLevel.sort((a, b) => {
        const nodeA = graph.nodes.get(a)!;
        const nodeB = graph.nodes.get(b)!;
        return nodeB.dependents.length - nodeA.dependents.length;
      });

      order.push(...nodesAtLevel);
    }

    // Add any nodes not in levels (e.g., from circular dependencies)
    for (const [nodeId] of graph.nodes) {
      if (!order.includes(nodeId)) {
        order.push(nodeId);
      }
    }

    return order;
  }

  private identifyParallelGroups(graph: DependencyGraph): string[][] {
    const parallelGroups: string[][] = [];

    // Group by level - all constraints at the same level can run in parallel
    const levels = Array.from(graph.levels.keys()).sort((a, b) => a - b);
    
    for (const level of levels) {
      const group = graph.levels.get(level) || [];
      if (group.length > 0) {
        parallelGroups.push([...group]);
      }
    }

    // Handle circular dependencies as a single group
    if (graph.hasCircularDependencies) {
      for (const circularGroup of graph.circularGroups) {
        parallelGroups.push([...circularGroup]);
      }
    }

    return parallelGroups;
  }

  private findCriticalPath(graph: DependencyGraph): string[] {
    if (graph.nodes.size === 0) return [];

    const memo = new Map<string, string[]>();

    const findLongestPath = (nodeId: string): string[] => {
      if (memo.has(nodeId)) {
        return memo.get(nodeId)!;
      }

      const node = graph.nodes.get(nodeId);
      if (!node || node.dependents.length === 0) {
        memo.set(nodeId, [nodeId]);
        return [nodeId];
      }

      let longestPath: string[] = [nodeId];
      
      for (const depId of node.dependents) {
        const depPath = findLongestPath(depId);
        if (depPath.length + 1 > longestPath.length) {
          longestPath = [nodeId, ...depPath];
        }
      }

      memo.set(nodeId, longestPath);
      return longestPath;
    };

    // Find the longest path starting from any node
    let criticalPath: string[] = [];
    
    for (const [nodeId] of graph.nodes) {
      const path = findLongestPath(nodeId);
      if (path.length > criticalPath.length) {
        criticalPath = path;
      }
    }

    return criticalPath;
  }

  private identifyBottlenecks(graph: DependencyGraph): string[] {
    const bottlenecks: Array<{ id: string; score: number }> = [];

    for (const [nodeId, node] of graph.nodes) {
      // Bottleneck score based on:
      // 1. Number of direct dependents
      // 2. Total number of transitive dependents
      // 3. Position in critical path
      
      const directDependents = node.dependents.length;
      const transitiveDependents = this.countTransitiveDependents(nodeId, graph);
      const inCriticalPath = this.findCriticalPath(graph).includes(nodeId) ? 10 : 0;
      
      const score = directDependents * 2 + transitiveDependents + inCriticalPath;
      
      if (score > 0) {
        bottlenecks.push({ id: nodeId, score });
      }
    }

    // Sort by score and return top bottlenecks
    bottlenecks.sort((a, b) => b.score - a.score);
    
    return bottlenecks
      .slice(0, Math.min(10, Math.ceil(bottlenecks.length * 0.2))) // Top 20% or max 10
      .map(b => b.id);
  }

  private countTransitiveDependents(nodeId: string, graph: DependencyGraph): number {
    const visited = new Set<string>();
    
    const count = (id: string): number => {
      if (visited.has(id)) return 0;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return 0;

      let total = node.dependents.length;
      for (const depId of node.dependents) {
        total += count(depId);
      }

      return total;
    };

    return count(nodeId);
  }

  // Utility methods for optimization
  canParallelize(constraint1: string, constraint2: string, graph: DependencyGraph): boolean {
    // Check if constraints have any dependency relationship
    const node1 = graph.nodes.get(constraint1);
    const node2 = graph.nodes.get(constraint2);

    if (!node1 || !node2) return false;

    // Check direct dependencies
    if (node1.dependencies.includes(constraint2) || 
        node2.dependencies.includes(constraint1)) {
      return false;
    }

    // Check if they're in the same circular group
    for (const group of graph.circularGroups) {
      if (group.includes(constraint1) && group.includes(constraint2)) {
        return false;
      }
    }

    // Check if they're at the same level (same level = can parallelize)
    return node1.level === node2.level;
  }

  getDependencyChain(constraintId: string, graph: DependencyGraph): string[] {
    const chain: string[] = [];
    const visited = new Set<string>();

    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);

      const node = graph.nodes.get(id);
      if (!node) return;

      for (const depId of node.dependencies) {
        traverse(depId);
      }

      chain.push(id);
    };

    traverse(constraintId);
    return chain;
  }
}