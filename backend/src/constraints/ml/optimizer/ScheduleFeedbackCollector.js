/**
 * Schedule Feedback Collector
 * Collects and manages feedback data for continuous learning
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class ScheduleFeedbackCollector extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            maxStorageSize: 10000,
            feedbackRetentionDays: 90,
            batchSize: 100,
            anonymize: true,
            aggregationInterval: 60 * 60 * 1000, // 1 hour
            ...options
        };

        // Storage for feedback data
        this.optimizationFeedback = new Map();
        this.userFeedback = new Map();
        this.performanceMetrics = new Map();
        this.aggregatedData = new Map();

        // Feedback categories
        this.feedbackTypes = {
            OPTIMIZATION: 'optimization',
            USER_SATISFACTION: 'user_satisfaction',
            CONSTRAINT_VIOLATION: 'constraint_violation',
            PERFORMANCE: 'performance',
            SCHEDULE_QUALITY: 'schedule_quality'
        };

        // Automatic cleanup and aggregation
        this.initializeCleanupSchedule();
        this.initializeAggregationSchedule();
    }

    /**
     * Collect optimization feedback
     */
    async collectOptimizationFeedback(scheduleData, optimizationResult, features) {
        const feedbackId = uuidv4();
        const timestamp = new Date();

        const feedback = {
            id: feedbackId,
            type: this.feedbackTypes.OPTIMIZATION,
            timestamp,
            scheduleId: scheduleData.id || 'unknown',
            features: this.sanitizeFeatures(features),
            optimizationResult: this.sanitizeOptimizationResult(optimizationResult),
            constraints: this.extractConstraintData(scheduleData, optimizationResult),
            performance: {
                optimizationTime: optimizationResult.duration || 0,
                iterations: optimizationResult.iterations || 0,
                convergenceRate: this.calculateConvergenceRate(optimizationResult),
                finalScore: optimizationResult.satisfactionScore || 0
            },
            metadata: {
                userId: scheduleData.userId || 'anonymous',
                sportType: scheduleData.sportType || 'unknown',
                seasonType: scheduleData.seasonType || 'regular',
                conferenceId: scheduleData.conferenceId || 'unknown'
            }
        };

        // Store feedback
        this.optimizationFeedback.set(feedbackId, feedback);

        // Emit event for real-time processing
        this.emit('optimization-feedback-collected', feedback);

        // Cleanup if storage is full
        await this.enforceStorageLimit();

        return feedbackId;
    }

    /**
     * Collect user satisfaction feedback
     */
    async collectUserFeedback(scheduleId, userId, satisfactionData) {
        const feedbackId = uuidv4();
        const timestamp = new Date();

        const feedback = {
            id: feedbackId,
            type: this.feedbackTypes.USER_SATISFACTION,
            timestamp,
            scheduleId,
            userId: this.options.anonymize ? this.anonymizeUserId(userId) : userId,
            satisfaction: {
                overall: satisfactionData.overall || 0,
                scheduleQuality: satisfactionData.scheduleQuality || 0,
                constraintSatisfaction: satisfactionData.constraintSatisfaction || 0,
                travelOptimization: satisfactionData.travelOptimization || 0,
                venueUtilization: satisfactionData.venueUtilization || 0
            },
            comments: satisfactionData.comments || '',
            issues: satisfactionData.issues || [],
            suggestions: satisfactionData.suggestions || [],
            rating: satisfactionData.rating || 0, // 1-5 scale
            wouldRecommend: satisfactionData.wouldRecommend || false
        };

        this.userFeedback.set(feedbackId, feedback);
        this.emit('user-feedback-collected', feedback);

        await this.enforceStorageLimit();
        return feedbackId;
    }

    /**
     * Collect constraint violation feedback
     */
    async collectConstraintViolationFeedback(scheduleId, violations, context) {
        const feedbackId = uuidv4();
        const timestamp = new Date();

        const feedback = {
            id: feedbackId,
            type: this.feedbackTypes.CONSTRAINT_VIOLATION,
            timestamp,
            scheduleId,
            violations: violations.map(violation => ({
                constraintId: violation.constraintId,
                type: violation.type,
                severity: violation.severity,
                description: violation.description,
                affectedGames: violation.affectedGames || [],
                resolution: violation.resolution || null,
                resolutionTime: violation.resolutionTime || null
            })),
            context: {
                scheduleVersion: context.scheduleVersion || 1,
                optimizationIteration: context.optimizationIteration || 0,
                constraintWeights: context.constraintWeights || {},
                schedulePhase: context.schedulePhase || 'unknown'
            }
        };

        this.optimizationFeedback.set(feedbackId, feedback);
        this.emit('violation-feedback-collected', feedback);

        await this.enforceStorageLimit();
        return feedbackId;
    }

    /**
     * Collect performance metrics
     */
    async collectPerformanceMetrics(scheduleId, metrics) {
        const feedbackId = uuidv4();
        const timestamp = new Date();

        const feedback = {
            id: feedbackId,
            type: this.feedbackTypes.PERFORMANCE,
            timestamp,
            scheduleId,
            metrics: {
                generationTime: metrics.generationTime || 0,
                memoryUsage: metrics.memoryUsage || 0,
                cpuUsage: metrics.cpuUsage || 0,
                optimizationSteps: metrics.optimizationSteps || 0,
                convergenceTime: metrics.convergenceTime || 0,
                violationCount: metrics.violationCount || 0,
                satisfactionScore: metrics.satisfactionScore || 0
            },
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                architecture: process.arch,
                totalMemory: process.memoryUsage().heapTotal,
                freeMemory: process.memoryUsage().heapUsed
            }
        };

        this.performanceMetrics.set(feedbackId, feedback);
        this.emit('performance-metrics-collected', feedback);

        await this.enforceStorageLimit();
        return feedbackId;
    }

    /**
     * Get historical feedback for ML training
     */
    async getHistoricalFeedback(options = {}) {
        const {
            type = null,
            startDate = null,
            endDate = null,
            scheduleId = null,
            userId = null,
            limit = this.options.batchSize
        } = options;

        let feedback = [];

        // Collect from all feedback types
        const allFeedback = [
            ...Array.from(this.optimizationFeedback.values()),
            ...Array.from(this.userFeedback.values()),
            ...Array.from(this.performanceMetrics.values())
        ];

        // Apply filters
        feedback = allFeedback.filter(item => {
            if (type && item.type !== type) return false;
            if (startDate && item.timestamp < startDate) return false;
            if (endDate && item.timestamp > endDate) return false;
            if (scheduleId && item.scheduleId !== scheduleId) return false;
            if (userId && item.userId !== userId) return false;
            return true;
        });

        // Sort by timestamp (newest first)
        feedback.sort((a, b) => b.timestamp - a.timestamp);

        // Apply limit
        if (limit) {
            feedback = feedback.slice(0, limit);
        }

        return feedback;
    }

    /**
     * Get aggregated feedback data
     */
    async getAggregatedFeedback(timeWindow = '24h') {
        const windowMs = this.parseTimeWindow(timeWindow);
        const cutoffTime = new Date(Date.now() - windowMs);

        const aggregationKey = `${timeWindow}_${cutoffTime.toISOString().split('T')[0]}`;
        
        if (this.aggregatedData.has(aggregationKey)) {
            return this.aggregatedData.get(aggregationKey);
        }

        // Aggregate recent feedback
        const recentFeedback = await this.getHistoricalFeedback({
            startDate: cutoffTime,
            limit: null
        });

        const aggregation = this.aggregateFeedbackData(recentFeedback);
        
        // Cache aggregation
        this.aggregatedData.set(aggregationKey, aggregation);
        
        return aggregation;
    }

    /**
     * Get feedback statistics
     */
    async getFeedbackStatistics() {
        const stats = {
            totalFeedback: this.optimizationFeedback.size + this.userFeedback.size + this.performanceMetrics.size,
            byType: {
                optimization: this.optimizationFeedback.size,
                userSatisfaction: this.userFeedback.size,
                performance: this.performanceMetrics.size
            },
            recentActivity: await this.getRecentActivityStats(),
            averages: await this.calculateAverageMetrics(),
            trends: await this.calculateTrends()
        };

        return stats;
    }

    /**
     * Sanitize features for storage
     */
    sanitizeFeatures(features) {
        return {
            gameCount: features.gameCount || 0,
            teamCount: features.teamCount || 0,
            venueCount: features.venueCount || 0,
            constraintCount: features.constraintCount || 0,
            seasonLength: features.seasonLength || 0,
            complexityScore: features.complexityScore || 0,
            // Remove sensitive data
            ...(this.options.anonymize ? {} : features)
        };
    }

    /**
     * Sanitize optimization result for storage
     */
    sanitizeOptimizationResult(result) {
        return {
            iterations: result.iterations || 0,
            satisfactionScore: result.satisfactionScore || 0,
            constraintViolations: (result.constraintViolations || []).map(v => ({
                type: v.type,
                severity: v.severity,
                count: v.count || 1
            })),
            convergenceHistory: (result.convergenceHistory || []).slice(-10), // Keep last 10 points
            duration: result.duration || 0
        };
    }

    /**
     * Extract constraint data from schedule and result
     */
    extractConstraintData(scheduleData, optimizationResult) {
        const constraints = {};

        // Extract constraint weights used
        if (optimizationResult.weights) {
            for (const [constraintId, weight] of optimizationResult.weights) {
                constraints[constraintId] = {
                    weight,
                    satisfied: this.wasConstraintSatisfied(constraintId, optimizationResult),
                    violationCount: this.getConstraintViolationCount(constraintId, optimizationResult)
                };
            }
        }

        return constraints;
    }

    /**
     * Calculate convergence rate from optimization result
     */
    calculateConvergenceRate(optimizationResult) {
        const history = optimizationResult.convergenceHistory || [];
        if (history.length < 2) return 0;

        const improvements = [];
        for (let i = 1; i < history.length; i++) {
            const improvement = history[i].bestScore - history[i-1].bestScore;
            improvements.push(improvement);
        }

        return improvements.reduce((sum, imp) => sum + Math.max(0, imp), 0) / improvements.length;
    }

    /**
     * Anonymize user ID
     */
    anonymizeUserId(userId) {
        // Simple hash-based anonymization
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(userId).digest('hex').substring(0, 8);
    }

    /**
     * Enforce storage limits
     */
    async enforceStorageLimit() {
        const totalSize = this.optimizationFeedback.size + this.userFeedback.size + this.performenceMetrics.size;
        
        if (totalSize > this.options.maxStorageSize) {
            await this.cleanupOldData();
        }
    }

    /**
     * Cleanup old data based on retention policy
     */
    async cleanupOldData() {
        const cutoffDate = new Date(Date.now() - (this.options.feedbackRetentionDays * 24 * 60 * 60 * 1000));

        // Cleanup optimization feedback
        for (const [id, feedback] of this.optimizationFeedback) {
            if (feedback.timestamp < cutoffDate) {
                this.optimizationFeedback.delete(id);
            }
        }

        // Cleanup user feedback
        for (const [id, feedback] of this.userFeedback) {
            if (feedback.timestamp < cutoffDate) {
                this.userFeedback.delete(id);
            }
        }

        // Cleanup performance metrics
        for (const [id, feedback] of this.performanceMetrics) {
            if (feedback.timestamp < cutoffDate) {
                this.performanceMetrics.delete(id);
            }
        }

        this.emit('data-cleanup-completed', { cutoffDate });
    }

    /**
     * Initialize cleanup schedule
     */
    initializeCleanupSchedule() {
        // Run cleanup daily
        setInterval(() => {
            this.cleanupOldData().catch(error => {
                console.error('Error during scheduled cleanup:', error);
            });
        }, 24 * 60 * 60 * 1000);
    }

    /**
     * Initialize aggregation schedule
     */
    initializeAggregationSchedule() {
        setInterval(() => {
            this.generatePeriodicAggregations().catch(error => {
                console.error('Error during aggregation:', error);
            });
        }, this.options.aggregationInterval);
    }

    /**
     * Generate periodic aggregations
     */
    async generatePeriodicAggregations() {
        const timeWindows = ['1h', '6h', '24h', '7d'];
        
        for (const window of timeWindows) {
            await this.getAggregatedFeedback(window);
        }
    }

    /**
     * Parse time window string to milliseconds
     */
    parseTimeWindow(timeWindow) {
        const units = {
            's': 1000,
            'm': 60 * 1000,
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        };

        const match = timeWindow.match(/^(\d+)([smhdw])$/);
        if (!match) return 24 * 60 * 60 * 1000; // Default to 24 hours

        const [, amount, unit] = match;
        return parseInt(amount) * units[unit];
    }

    /**
     * Aggregate feedback data
     */
    aggregateFeedbackData(feedback) {
        const aggregation = {
            totalFeedback: feedback.length,
            byType: {},
            averageMetrics: {},
            trends: {},
            topIssues: [],
            improvements: []
        };

        // Group by type
        for (const item of feedback) {
            aggregation.byType[item.type] = (aggregation.byType[item.type] || 0) + 1;
        }

        // Calculate averages
        const satisfactionFeedback = feedback.filter(f => f.type === this.feedbackTypes.USER_SATISFACTION);
        if (satisfactionFeedback.length > 0) {
            aggregation.averageMetrics.userSatisfaction = 
                satisfactionFeedback.reduce((sum, f) => sum + (f.satisfaction?.overall || 0), 0) / satisfactionFeedback.length;
        }

        const optimizationFeedback = feedback.filter(f => f.type === this.feedbackTypes.OPTIMIZATION);
        if (optimizationFeedback.length > 0) {
            aggregation.averageMetrics.optimizationScore = 
                optimizationFeedback.reduce((sum, f) => sum + (f.performance?.finalScore || 0), 0) / optimizationFeedback.length;
        }

        return aggregation;
    }

    /**
     * Get recent activity statistics
     */
    async getRecentActivityStats() {
        const last24h = await this.getHistoricalFeedback({
            startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        });

        return {
            feedbackCount: last24h.length,
            uniqueSchedules: new Set(last24h.map(f => f.scheduleId)).size,
            uniqueUsers: new Set(last24h.map(f => f.userId).filter(Boolean)).size
        };
    }

    /**
     * Calculate average metrics
     */
    async calculateAverageMetrics() {
        const allFeedback = await this.getHistoricalFeedback({ limit: null });
        
        // Implementation would calculate various averages
        return {
            averageOptimizationTime: 0,
            averageSatisfactionScore: 0,
            averageConstraintViolations: 0
        };
    }

    /**
     * Calculate trends
     */
    async calculateTrends() {
        // Implementation would analyze trends over time
        return {
            satisfactionTrend: 'stable',
            violationTrend: 'decreasing',
            performanceTrend: 'improving'
        };
    }

    /**
     * Get storage statistics
     */
    getStorageStats() {
        return {
            optimizationFeedback: this.optimizationFeedback.size,
            userFeedback: this.userFeedback.size,
            performanceMetrics: this.performanceMetrics.size,
            aggregatedData: this.aggregatedData.size,
            totalSize: this.optimizationFeedback.size + this.userFeedback.size + this.performanceMetrics.size
        };
    }

    /**
     * Export feedback data
     */
    async exportFeedback(format = 'json', options = {}) {
        const feedback = await this.getHistoricalFeedback(options);
        
        switch (format) {
            case 'json':
                return JSON.stringify(feedback, null, 2);
            case 'csv':
                return this.convertToCSV(feedback);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    /**
     * Convert feedback to CSV format
     */
    convertToCSV(feedback) {
        if (feedback.length === 0) return '';

        const headers = ['id', 'type', 'timestamp', 'scheduleId', 'userId'];
        const rows = feedback.map(item => [
            item.id,
            item.type,
            item.timestamp.toISOString(),
            item.scheduleId,
            item.userId || ''
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    }

    /**
     * Cleanup resources
     */
    destroy() {
        // Clear all data
        this.optimizationFeedback.clear();
        this.userFeedback.clear();
        this.performanceMetrics.clear();
        this.aggregatedData.clear();
        
        this.removeAllListeners();
    }
}

module.exports = { ScheduleFeedbackCollector };