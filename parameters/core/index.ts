/**
 * Core constraint engine exports
 */

export { ConstraintEngine } from './ConstraintEngine';
export { ConflictResolver } from './ConflictResolver';
export { ConstraintRegistry } from './ConstraintRegistry';
export { PerformanceMonitor } from './PerformanceMonitor';
export { CacheManager } from './CacheManager';

// Export types
export * from './types';

// Version info
export const VERSION = '2.0.0';
export const BUILD_DATE = new Date().toISOString();