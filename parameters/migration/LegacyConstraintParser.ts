/**
 * Legacy Constraint Parser - Parse various legacy constraint formats
 * 
 * Supports parsing:
 * - JavaScript class-based constraints
 * - JSON configuration objects
 * - Database constraint records
 * - Sport-specific constraint systems
 * - Custom constraint implementations
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

// Legacy constraint patterns
interface ParsedConstraint {
  id?: string;
  name: string;
  description?: string;
  type?: string;
  category?: string;
  parameters?: Record<string, any>;
  weight?: number;
  priority?: number | string;
  isHard?: boolean;
  metadata?: Record<string, any>;
  [key: string]: any;
}

// Parser options
interface ParserOptions {
  inferTypes?: boolean;
  extractMethods?: boolean;
  parseComments?: boolean;
  followImports?: boolean;
}

/**
 * Parser for legacy constraint formats
 */
export class LegacyConstraintParser {
  private options: Required<ParserOptions>;
  private constraintPatterns: Map<string, RegExp>;
  
  constructor(options: ParserOptions = {}) {
    this.options = {
      inferTypes: true,
      extractMethods: true,
      parseComments: true,
      followImports: false,
      ...options
    };
    
    // Initialize common constraint patterns
    this.constraintPatterns = new Map([
      ['className', /class\s+(\w+)(?:Constraint)?\s+extends\s+(?:Constraint|BaseConstraint)/],
      ['constraintType', /(?:type|constraintType)\s*[=:]\s*['"`](\w+)['"`]/],
      ['isHard', /(?:isHard|hard)\s*[=:]\s*(true|false)/],
      ['priority', /(?:priority)\s*[=:]\s*(?:['"`])?(\w+)(?:['"`])?/],
      ['weight', /(?:weight)\s*[=:]\s*([\d.]+)/]
    ]);
  }

  /**
   * Parse constraint from string content
   */
  async parseFromString(
    content: string,
    format: 'object' | 'class' | 'database' = 'object'
  ): Promise<ParsedConstraint> {
    switch (format) {
      case 'object':
        return this.parseObjectConstraint(content);
      case 'class':
        return this.parseClassConstraint(content);
      case 'database':
        return this.parseDatabaseConstraint(content);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Parse constraints from file
   */
  async parseFile(filePath: string, content?: string): Promise<ParsedConstraint[]> {
    if (!content) {
      content = await fs.readFile(filePath, 'utf-8');
    }
    
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.json':
        return this.parseJSONFile(content);
      case '.js':
      case '.ts':
        return this.parseJavaScriptFile(content, filePath);
      default:
        throw new Error(`Unsupported file extension: ${ext}`);
    }
  }

  /**
   * Parse JSON constraint file
   */
  private parseJSONFile(content: string): ParsedConstraint[] {
    try {
      const data = JSON.parse(content);
      
      // Handle array of constraints
      if (Array.isArray(data)) {
        return data.map(item => this.normalizeConstraint(item));
      }
      
      // Handle single constraint
      if (data.constraints && Array.isArray(data.constraints)) {
        return data.constraints.map(item => this.normalizeConstraint(item));
      }
      
      // Treat entire object as single constraint
      return [this.normalizeConstraint(data)];
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  /**
   * Parse JavaScript/TypeScript constraint file
   */
  private async parseJavaScriptFile(
    content: string,
    filePath: string
  ): Promise<ParsedConstraint[]> {
    const constraints: ParsedConstraint[] = [];
    
    try {
      // Parse AST
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['typescript', 'classProperties', 'decorators-legacy']
      });
      
      // Find constraint classes
      traverse(ast, {
        ClassDeclaration: (path) => {
          const constraint = this.extractClassConstraint(path.node, content);
          if (constraint) {
            constraints.push(constraint);
          }
        },
        
        // Find constraint objects
        VariableDeclarator: (path) => {
          if (this.isConstraintObject(path.node)) {
            const constraint = this.extractObjectConstraint(path.node);
            if (constraint) {
              constraints.push(constraint);
            }
          }
        },
        
        // Find exported constraint arrays
        ExportNamedDeclaration: (path) => {
          if (path.node.declaration && t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach(declarator => {
              if (t.isArrayExpression(declarator.init)) {
                const arrayConstraints = this.extractArrayConstraints(declarator.init);
                constraints.push(...arrayConstraints);
              }
            });
          }
        }
      });
      
      // Extract constraints from module exports
      const exportedConstraints = this.extractModuleExports(ast, content);
      constraints.push(...exportedConstraints);
      
    } catch (error) {
      console.error(`Error parsing JavaScript file ${filePath}:`, error);
      throw error;
    }
    
    return constraints;
  }

  /**
   * Extract constraint from class declaration
   */
  private extractClassConstraint(
    node: t.ClassDeclaration,
    content: string
  ): ParsedConstraint | null {
    const className = node.id?.name;
    if (!className) return null;
    
    // Check if it's a constraint class
    const superClass = node.superClass;
    if (!superClass || !this.isConstraintClass(superClass)) {
      return null;
    }
    
    const constraint: ParsedConstraint = {
      name: className.replace(/Constraint$/, ''),
      metadata: {
        sourceType: 'class',
        className
      }
    };
    
    // Extract constructor parameters
    const constructor = node.body.body.find(
      member => t.isClassMethod(member) && member.key.name === 'constructor'
    ) as t.ClassMethod | undefined;
    
    if (constructor) {
      this.extractConstructorInfo(constructor, constraint);
    }
    
    // Extract class properties
    node.body.body.forEach(member => {
      if (t.isClassProperty(member)) {
        this.extractClassProperty(member, constraint);
      }
    });
    
    // Extract evaluate method if present
    const evaluateMethod = node.body.body.find(
      member => t.isClassMethod(member) && member.key.name === 'evaluate'
    ) as t.ClassMethod | undefined;
    
    if (evaluateMethod && this.options.extractMethods) {
      constraint.metadata.hasEvaluateMethod = true;
      constraint.metadata.evaluateComplexity = this.calculateMethodComplexity(evaluateMethod);
    }
    
    // Extract JSDoc comments if available
    if (this.options.parseComments && node.leadingComments) {
      const jsdoc = this.parseJSDocComments(node.leadingComments);
      if (jsdoc.description) constraint.description = jsdoc.description;
      if (jsdoc.params) constraint.metadata.jsdocParams = jsdoc.params;
    }
    
    return constraint;
  }

  /**
   * Check if a node represents a constraint class
   */
  private isConstraintClass(node: t.Expression): boolean {
    if (t.isIdentifier(node)) {
      const name = node.name.toLowerCase();
      return name.includes('constraint') || name === 'baseconstraint';
    }
    return false;
  }

  /**
   * Extract information from constructor
   */
  private extractConstructorInfo(
    constructor: t.ClassMethod,
    constraint: ParsedConstraint
  ): void {
    // Extract parameters
    const params = constructor.params;
    if (params.length > 0) {
      constraint.metadata.constructorParams = params.map((param, index) => {
        if (t.isIdentifier(param)) {
          return { name: param.name, index };
        }
        return { name: `param${index}`, index };
      });
    }
    
    // Look for super() call to extract constraint details
    traverse(constructor, {
      CallExpression(path) {
        if (t.isSuper(path.node.callee)) {
          const args = path.node.arguments;
          
          // Common pattern: super(id, name, description, type, category, parameters, weight)
          if (args.length >= 2) {
            // Extract name (usually second argument)
            if (t.isStringLiteral(args[1])) {
              constraint.name = args[1].value;
            }
            
            // Extract description (usually third argument)
            if (args.length > 2 && t.isStringLiteral(args[2])) {
              constraint.description = args[2].value;
            }
            
            // Extract type (usually fourth argument)
            if (args.length > 3) {
              constraint.type = this.extractArgumentValue(args[3]);
            }
            
            // Extract category (usually fifth argument)
            if (args.length > 4) {
              constraint.category = this.extractArgumentValue(args[4]);
            }
            
            // Extract parameters (usually sixth argument)
            if (args.length > 5 && t.isObjectExpression(args[5])) {
              constraint.parameters = this.extractObjectLiteral(args[5]);
            }
            
            // Extract weight (usually seventh argument)
            if (args.length > 6 && t.isNumericLiteral(args[6])) {
              constraint.weight = args[6].value;
            }
          }
        }
      }
    }, constructor.scope);
  }

  /**
   * Extract class property value
   */
  private extractClassProperty(
    property: t.ClassProperty,
    constraint: ParsedConstraint
  ): void {
    const key = t.isIdentifier(property.key) ? property.key.name : null;
    if (!key) return;
    
    const value = this.extractNodeValue(property.value);
    
    switch (key) {
      case 'name':
        constraint.name = value;
        break;
      case 'description':
        constraint.description = value;
        break;
      case 'type':
      case 'constraintType':
        constraint.type = value;
        break;
      case 'category':
        constraint.category = value;
        break;
      case 'weight':
        constraint.weight = value;
        break;
      case 'priority':
        constraint.priority = value;
        break;
      case 'isHard':
      case 'hard':
        constraint.isHard = value;
        break;
      case 'parameters':
      case 'params':
        constraint.parameters = value;
        break;
      default:
        // Store other properties in metadata
        if (!constraint.metadata) constraint.metadata = {};
        constraint.metadata[key] = value;
    }
  }

  /**
   * Extract value from AST node
   */
  private extractNodeValue(node: t.Node | null | undefined): any {
    if (!node) return undefined;
    
    if (t.isStringLiteral(node)) return node.value;
    if (t.isNumericLiteral(node)) return node.value;
    if (t.isBooleanLiteral(node)) return node.value;
    if (t.isNullLiteral(node)) return null;
    if (t.isIdentifier(node)) return node.name;
    
    if (t.isObjectExpression(node)) {
      return this.extractObjectLiteral(node);
    }
    
    if (t.isArrayExpression(node)) {
      return node.elements.map(el => this.extractNodeValue(el));
    }
    
    // For member expressions like ConstraintType.HARD
    if (t.isMemberExpression(node)) {
      const object = t.isIdentifier(node.object) ? node.object.name : '';
      const property = t.isIdentifier(node.property) ? node.property.name : '';
      return `${object}.${property}`;
    }
    
    return undefined;
  }

  /**
   * Extract object literal to plain object
   */
  private extractObjectLiteral(node: t.ObjectExpression): Record<string, any> {
    const obj: Record<string, any> = {};
    
    node.properties.forEach(prop => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        obj[prop.key.name] = this.extractNodeValue(prop.value);
      }
    });
    
    return obj;
  }

  /**
   * Extract argument value with type inference
   */
  private extractArgumentValue(node: t.Node): any {
    const value = this.extractNodeValue(node);
    
    // Handle common enum patterns
    if (typeof value === 'string' && value.includes('.')) {
      const parts = value.split('.');
      if (parts[0] === 'ConstraintType') {
        return parts[1].toLowerCase();
      }
    }
    
    return value;
  }

  /**
   * Check if variable declarator is a constraint object
   */
  private isConstraintObject(node: t.VariableDeclarator): boolean {
    const id = node.id;
    if (!t.isIdentifier(id)) return false;
    
    const name = id.name.toLowerCase();
    return name.includes('constraint') || name.includes('rule');
  }

  /**
   * Extract constraint from object declaration
   */
  private extractObjectConstraint(node: t.VariableDeclarator): ParsedConstraint | null {
    if (!t.isObjectExpression(node.init)) return null;
    
    const obj = this.extractObjectLiteral(node.init);
    const name = t.isIdentifier(node.id) ? node.id.name : 'Unknown';
    
    return this.normalizeConstraint({
      ...obj,
      name: obj.name || name,
      metadata: {
        ...obj.metadata,
        sourceType: 'object',
        variableName: name
      }
    });
  }

  /**
   * Extract constraints from array expression
   */
  private extractArrayConstraints(node: t.ArrayExpression): ParsedConstraint[] {
    const constraints: ParsedConstraint[] = [];
    
    node.elements.forEach(element => {
      if (t.isObjectExpression(element)) {
        const obj = this.extractObjectLiteral(element);
        constraints.push(this.normalizeConstraint(obj));
      }
    });
    
    return constraints;
  }

  /**
   * Extract constraints from module exports
   */
  private extractModuleExports(ast: t.File, content: string): ParsedConstraint[] {
    const constraints: ParsedConstraint[] = [];
    
    traverse(ast, {
      ExportDefaultDeclaration: (path) => {
        const declaration = path.node.declaration;
        
        if (t.isObjectExpression(declaration)) {
          const obj = this.extractObjectLiteral(declaration);
          if (this.looksLikeConstraint(obj)) {
            constraints.push(this.normalizeConstraint(obj));
          }
        }
        
        if (t.isArrayExpression(declaration)) {
          const arrayConstraints = this.extractArrayConstraints(declaration);
          constraints.push(...arrayConstraints);
        }
      }
    });
    
    return constraints;
  }

  /**
   * Calculate method complexity for migration hints
   */
  private calculateMethodComplexity(method: t.ClassMethod): number {
    let complexity = 1; // Base complexity
    
    traverse(method, {
      IfStatement: () => complexity++,
      ConditionalExpression: () => complexity++,
      ForStatement: () => complexity += 2,
      WhileStatement: () => complexity += 2,
      DoWhileStatement: () => complexity += 2,
      SwitchCase: () => complexity++,
      LogicalExpression: (path) => {
        if (path.node.operator === '&&' || path.node.operator === '||') {
          complexity++;
        }
      }
    }, method.scope);
    
    return complexity;
  }

  /**
   * Parse JSDoc comments
   */
  private parseJSDocComments(comments: t.Comment[]): any {
    const jsdoc: any = {};
    
    comments.forEach(comment => {
      if (comment.type === 'CommentBlock' && comment.value.includes('*')) {
        const lines = comment.value.split('\n');
        
        lines.forEach(line => {
          const trimmed = line.trim().replace(/^\*\s*/, '');
          
          // Extract description
          if (!trimmed.startsWith('@') && trimmed.length > 0 && !jsdoc.description) {
            jsdoc.description = trimmed;
          }
          
          // Extract @param tags
          const paramMatch = trimmed.match(/@param\s+{(\w+)}\s+(\w+)\s*-?\s*(.*)$/);
          if (paramMatch) {
            if (!jsdoc.params) jsdoc.params = [];
            jsdoc.params.push({
              type: paramMatch[1],
              name: paramMatch[2],
              description: paramMatch[3]
            });
          }
        });
      }
    });
    
    return jsdoc;
  }

  /**
   * Parse object constraint format
   */
  private parseObjectConstraint(content: string): ParsedConstraint {
    try {
      const obj = JSON.parse(content);
      return this.normalizeConstraint(obj);
    } catch {
      // If not valid JSON, try to evaluate as JavaScript object
      try {
        // eslint-disable-next-line no-eval
        const obj = eval(`(${content})`);
        return this.normalizeConstraint(obj);
      } catch (error) {
        throw new Error(`Failed to parse object constraint: ${error.message}`);
      }
    }
  }

  /**
   * Parse class-based constraint format
   */
  private parseClassConstraint(content: string): ParsedConstraint {
    const constraint: ParsedConstraint = {
      name: 'Unknown',
      metadata: { sourceType: 'class' }
    };
    
    // Extract class name
    const classMatch = content.match(this.constraintPatterns.get('className')!);
    if (classMatch) {
      constraint.name = classMatch[1];
      constraint.metadata.className = classMatch[1];
    }
    
    // Extract constraint properties using regex patterns
    for (const [key, pattern] of this.constraintPatterns) {
      if (key === 'className') continue;
      
      const match = content.match(pattern);
      if (match) {
        switch (key) {
          case 'constraintType':
            constraint.type = match[1];
            break;
          case 'isHard':
            constraint.isHard = match[1] === 'true';
            break;
          case 'priority':
            constraint.priority = isNaN(Number(match[1])) ? match[1] : Number(match[1]);
            break;
          case 'weight':
            constraint.weight = parseFloat(match[1]);
            break;
        }
      }
    }
    
    // Try to extract constructor call
    const constructorMatch = content.match(/super\s*\([^)]+\)/);
    if (constructorMatch) {
      this.parseConstructorCall(constructorMatch[0], constraint);
    }
    
    return constraint;
  }

  /**
   * Parse constructor call for constraint details
   */
  private parseConstructorCall(call: string, constraint: ParsedConstraint): void {
    // Remove 'super(' and ')' and split arguments
    const argsString = call.replace(/super\s*\(/, '').replace(/\)$/, '');
    
    // Simple argument parsing (this is approximate)
    const args = this.parseArguments(argsString);
    
    // Map common constructor patterns
    if (args.length >= 2) constraint.name = this.cleanStringLiteral(args[1]);
    if (args.length >= 3) constraint.description = this.cleanStringLiteral(args[2]);
    if (args.length >= 4) constraint.type = this.cleanEnumValue(args[3]);
    if (args.length >= 5) constraint.category = this.cleanEnumValue(args[4]);
  }

  /**
   * Parse function arguments (simplified)
   */
  private parseArguments(argsString: string): string[] {
    const args: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];
      
      if ((char === '"' || char === "'" || char === '`') && argsString[i - 1] !== '\\') {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      if (!inString) {
        if (char === '(' || char === '[' || char === '{') depth++;
        if (char === ')' || char === ']' || char === '}') depth--;
        
        if (char === ',' && depth === 0) {
          args.push(current.trim());
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current.trim()) {
      args.push(current.trim());
    }
    
    return args;
  }

  /**
   * Clean string literal value
   */
  private cleanStringLiteral(value: string): string {
    return value.replace(/^['"`]|['"`]$/g, '');
  }

  /**
   * Clean enum value
   */
  private cleanEnumValue(value: string): string {
    const parts = value.split('.');
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Parse database constraint format
   */
  private parseDatabaseConstraint(content: string): ParsedConstraint {
    try {
      const record = JSON.parse(content);
      
      // Map database fields to constraint structure
      return this.normalizeConstraint({
        id: record.constraint_id || record.id,
        name: record.constraint_name || record.name,
        description: record.constraint_description || record.description,
        type: record.constraint_type || record.type,
        category: record.constraint_category || record.category,
        parameters: record.parameters || record.constraint_parameters,
        weight: record.weight || record.constraint_weight,
        priority: record.priority || record.constraint_priority,
        isHard: record.is_hard || record.hard_constraint,
        metadata: {
          sourceType: 'database',
          tableName: record._table,
          createdAt: record.created_at,
          updatedAt: record.updated_at
        }
      });
    } catch (error) {
      throw new Error(`Failed to parse database constraint: ${error.message}`);
    }
  }

  /**
   * Check if object looks like a constraint
   */
  private looksLikeConstraint(obj: any): boolean {
    // Must have at least a name or type
    if (!obj.name && !obj.type && !obj.constraintType) return false;
    
    // Check for common constraint properties
    const constraintProps = [
      'name', 'type', 'category', 'description', 'weight',
      'priority', 'parameters', 'evaluate', 'isHard', 'constraint'
    ];
    
    const objKeys = Object.keys(obj);
    const matchCount = objKeys.filter(key => 
      constraintProps.includes(key) || key.toLowerCase().includes('constraint')
    ).length;
    
    return matchCount >= 2;
  }

  /**
   * Normalize constraint object structure
   */
  private normalizeConstraint(obj: any): ParsedConstraint {
    const normalized: ParsedConstraint = {
      name: obj.name || obj.constraintName || 'Unnamed Constraint',
      ...obj
    };
    
    // Normalize type field
    if (obj.constraintType && !obj.type) {
      normalized.type = obj.constraintType;
      delete normalized.constraintType;
    }
    
    // Normalize hard/soft constraint indication
    if (obj.hard !== undefined && obj.isHard === undefined) {
      normalized.isHard = obj.hard;
      delete normalized.hard;
    }
    
    // Ensure metadata object exists
    if (!normalized.metadata) {
      normalized.metadata = {};
    }
    
    // Store original format info
    normalized.metadata.originalFormat = { ...obj };
    
    return normalized;
  }
}

export default LegacyConstraintParser;