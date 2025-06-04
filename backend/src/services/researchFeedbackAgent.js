/**
 * Research Feedback Agent
 * 
 * Monitors research quality and provides feedback for continuous improvement:
 * - Tracks accuracy over time
 * - Identifies patterns in failures
 * - Suggests optimizations
 * - Manages feedback loops
 * - Adjusts confidence thresholds
 */

const EventEmitter = require('events');
const moment = require('moment');
const stats = require('simple-statistics');

class ResearchFeedbackAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      analysisInterval: config.analysisInterval || 3600000, // 1 hour
      feedbackThreshold: config.feedbackThreshold || 0.8,
      learningRate: config.learningRate || 0.1,
      memorySize: config.memorySize || 1000,
      ...config
    };
    
    this.memory = {
      researches: [],
      validations: [],
      failures: [],
      successes: []
    };
    
    this.patterns = {
      failurePatterns: new Map(),
      successPatterns: new Map(),
      timePatterns: new Map()
    };
    
    this.recommendations = [];
    this.performanceMetrics = this.initializeMetrics();
  }

  initializeMetrics() {
    return {
      accuracy: { current: 0, history: [], target: 0.9 },
      confidence: { current: 0.7, history: [], optimal: 0.7 },
      completeness: { current: 0, history: [], target: 0.95 },
      timeliness: { current: 0, history: [], target: 0.9 },
      apiEfficiency: { current: 0, history: [], target: 0.8 }
    };
  }

  async initialize() {
    console.log('🔄 Initializing Research Feedback Agent...');
    
    // Start analysis cycle
    this.startAnalysisCycle();
    
    // Load historical data if available
    await this.loadHistoricalData();
    
    console.log('✅ Feedback Agent initialized');
  }

  startAnalysisCycle() {
    this.analysisInterval = setInterval(async () => {
      await this.performAnalysis();
    }, this.config.analysisInterval);
  }

  async recordResearchOutcome(research) {
    // Add to memory with size limit
    this.memory.researches.push({
      timestamp: new Date(),
      type: research.type,
      sport: research.sport,
      team: research.team,
      success: research.success,
      confidence: research.confidence,
      duration: research.duration,
      apiCalls: research.apiCalls,
      errors: research.errors || []
    });
    
    // Maintain memory size
    if (this.memory.researches.length > this.config.memorySize) {
      this.memory.researches.shift();
    }
    
    // Categorize outcome
    if (research.success) {
      this.recordSuccess(research);
    } else {
      this.recordFailure(research);
    }
  }

  recordSuccess(research) {
    const pattern = this.extractPattern(research);
    
    this.memory.successes.push({
      timestamp: new Date(),
      pattern,
      confidence: research.confidence
    });
    
    // Update success patterns
    const key = this.getPatternKey(pattern);
    const current = this.patterns.successPatterns.get(key) || { count: 0, avgConfidence: 0 };
    
    this.patterns.successPatterns.set(key, {
      count: current.count + 1,
      avgConfidence: (current.avgConfidence * current.count + research.confidence) / (current.count + 1),
      lastSeen: new Date()
    });
  }

  recordFailure(research) {
    const pattern = this.extractPattern(research);
    const failureReason = this.categorizeFailure(research.errors);
    
    this.memory.failures.push({
      timestamp: new Date(),
      pattern,
      reason: failureReason,
      errors: research.errors
    });
    
    // Update failure patterns
    const key = this.getPatternKey(pattern);
    const current = this.patterns.failurePatterns.get(key) || { count: 0, reasons: {} };
    
    current.count++;
    current.reasons[failureReason] = (current.reasons[failureReason] || 0) + 1;
    current.lastSeen = new Date();
    
    this.patterns.failurePatterns.set(key, current);
  }

  extractPattern(research) {
    return {
      type: research.type,
      sport: research.sport,
      timeOfDay: moment(research.timestamp).hour(),
      dayOfWeek: moment(research.timestamp).day(),
      hasTeam: !!research.team,
      apiProvider: research.apiProvider || 'perplexity'
    };
  }

  getPatternKey(pattern) {
    return `${pattern.type}_${pattern.sport}_${pattern.timeOfDay}_${pattern.dayOfWeek}`;
  }

  categorizeFailure(errors) {
    if (!errors || errors.length === 0) return 'unknown';
    
    const errorMessages = errors.map(e => e.message || e).join(' ');
    
    if (errorMessages.includes('rate limit')) return 'rate_limit';
    if (errorMessages.includes('timeout')) return 'timeout';
    if (errorMessages.includes('validation')) return 'validation_failed';
    if (errorMessages.includes('not found')) return 'data_not_found';
    if (errorMessages.includes('api')) return 'api_error';
    
    return 'other';
  }

  async performAnalysis() {
    console.log('📊 Performing feedback analysis...');
    
    try {
      // Calculate performance metrics
      this.updatePerformanceMetrics();
      
      // Identify patterns
      const patterns = this.identifySignificantPatterns();
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(patterns);
      
      // Adjust system parameters
      await this.adjustSystemParameters(recommendations);
      
      // Emit feedback report
      this.emit('feedback_analysis', {
        timestamp: new Date(),
        metrics: this.performanceMetrics,
        patterns,
        recommendations,
        adjustments: this.lastAdjustments
      });
      
      console.log('✅ Feedback analysis completed');
      
    } catch (error) {
      console.error('❌ Feedback analysis error:', error);
    }
  }

  updatePerformanceMetrics() {
    const recentResearches = this.memory.researches.slice(-100);
    
    if (recentResearches.length === 0) return;
    
    // Calculate accuracy
    const successful = recentResearches.filter(r => r.success).length;
    this.performanceMetrics.accuracy.current = successful / recentResearches.length;
    this.performanceMetrics.accuracy.history.push({
      timestamp: new Date(),
      value: this.performanceMetrics.accuracy.current
    });
    
    // Calculate average confidence
    const avgConfidence = stats.mean(recentResearches.map(r => r.confidence || 0));
    this.performanceMetrics.confidence.current = avgConfidence;
    
    // Calculate completeness (researches without missing data)
    const complete = recentResearches.filter(r => !r.errors?.some(e => e.includes('missing'))).length;
    this.performanceMetrics.completeness.current = complete / recentResearches.length;
    
    // Calculate timeliness (researches completed within expected time)
    const timely = recentResearches.filter(r => r.duration < 30000).length; // 30s threshold
    this.performanceMetrics.timeliness.current = timely / recentResearches.length;
    
    // Calculate API efficiency
    const avgApiCalls = stats.mean(recentResearches.map(r => r.apiCalls || 1));
    this.performanceMetrics.apiEfficiency.current = 1 / avgApiCalls; // Fewer calls = higher efficiency
  }

  identifySignificantPatterns() {
    const patterns = {
      problematic: [],
      successful: [],
      temporal: []
    };
    
    // Identify problematic patterns (high failure rate)
    for (const [key, data] of this.patterns.failurePatterns) {
      const successData = this.patterns.successPatterns.get(key);
      const totalAttempts = data.count + (successData?.count || 0);
      const failureRate = data.count / totalAttempts;
      
      if (failureRate > 0.3 && totalAttempts > 5) {
        patterns.problematic.push({
          pattern: key,
          failureRate,
          totalAttempts,
          mainReason: Object.entries(data.reasons)
            .sort(([,a], [,b]) => b - a)[0][0]
        });
      }
    }
    
    // Identify successful patterns (high success + confidence)
    for (const [key, data] of this.patterns.successPatterns) {
      if (data.count > 10 && data.avgConfidence > 0.85) {
        patterns.successful.push({
          pattern: key,
          successCount: data.count,
          avgConfidence: data.avgConfidence
        });
      }
    }
    
    // Identify temporal patterns
    const hourlySuccess = this.analyzeHourlyPatterns();
    if (hourlySuccess.bestHours.length > 0) {
      patterns.temporal.push({
        type: 'hourly',
        bestHours: hourlySuccess.bestHours,
        worstHours: hourlySuccess.worstHours
      });
    }
    
    return patterns;
  }

  analyzeHourlyPatterns() {
    const hourlyStats = {};
    
    // Group by hour
    this.memory.researches.forEach(r => {
      const hour = moment(r.timestamp).hour();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { success: 0, total: 0 };
      }
      hourlyStats[hour].total++;
      if (r.success) hourlyStats[hour].success++;
    });
    
    // Calculate success rates
    const hourlyRates = Object.entries(hourlyStats)
      .map(([hour, stats]) => ({
        hour: parseInt(hour),
        successRate: stats.success / stats.total,
        sampleSize: stats.total
      }))
      .filter(h => h.sampleSize > 5) // Minimum sample size
      .sort((a, b) => b.successRate - a.successRate);
    
    return {
      bestHours: hourlyRates.slice(0, 3).map(h => h.hour),
      worstHours: hourlyRates.slice(-3).map(h => h.hour)
    };
  }

  generateRecommendations(patterns) {
    const recommendations = [];
    
    // Based on accuracy
    if (this.performanceMetrics.accuracy.current < this.performanceMetrics.accuracy.target) {
      recommendations.push({
        type: 'accuracy',
        severity: 'high',
        message: `Accuracy ${(this.performanceMetrics.accuracy.current * 100).toFixed(1)}% below target ${(this.performanceMetrics.accuracy.target * 100)}%`,
        action: 'increase_validation_threshold'
      });
    }
    
    // Based on problematic patterns
    patterns.problematic.forEach(problem => {
      if (problem.mainReason === 'rate_limit') {
        recommendations.push({
          type: 'rate_limit',
          severity: 'medium',
          message: `High rate limit failures for pattern ${problem.pattern}`,
          action: 'reduce_api_frequency',
          params: { pattern: problem.pattern, reduction: 0.7 }
        });
      } else if (problem.mainReason === 'timeout') {
        recommendations.push({
          type: 'timeout',
          severity: 'medium',
          message: `Frequent timeouts for pattern ${problem.pattern}`,
          action: 'increase_timeout',
          params: { pattern: problem.pattern, increase: 1.5 }
        });
      }
    });
    
    // Based on temporal patterns
    if (patterns.temporal.length > 0) {
      const temporal = patterns.temporal[0];
      recommendations.push({
        type: 'scheduling',
        severity: 'low',
        message: `Better success rates during hours: ${temporal.bestHours.join(', ')}`,
        action: 'adjust_schedule',
        params: { preferredHours: temporal.bestHours }
      });
    }
    
    // Based on API efficiency
    if (this.performanceMetrics.apiEfficiency.current < this.performanceMetrics.apiEfficiency.target) {
      recommendations.push({
        type: 'efficiency',
        severity: 'medium',
        message: 'High API usage detected',
        action: 'optimize_queries',
        params: { targetReduction: 0.2 }
      });
    }
    
    return recommendations;
  }

  async adjustSystemParameters(recommendations) {
    this.lastAdjustments = [];
    
    for (const rec of recommendations) {
      if (rec.severity === 'high' || (rec.severity === 'medium' && Math.random() > 0.5)) {
        const adjustment = await this.applyRecommendation(rec);
        if (adjustment) {
          this.lastAdjustments.push(adjustment);
        }
      }
    }
    
    // Learn from adjustments
    if (this.lastAdjustments.length > 0) {
      this.emit('system_adjusted', {
        timestamp: new Date(),
        adjustments: this.lastAdjustments
      });
    }
  }

  async applyRecommendation(recommendation) {
    switch (recommendation.action) {
      case 'increase_validation_threshold':
        const newThreshold = Math.min(0.9, this.performanceMetrics.confidence.optimal + 0.05);
        this.performanceMetrics.confidence.optimal = newThreshold;
        return {
          type: 'confidence_threshold',
          oldValue: this.performanceMetrics.confidence.optimal - 0.05,
          newValue: newThreshold
        };
        
      case 'reduce_api_frequency':
        // This would communicate with the scheduler
        this.emit('adjust_frequency', {
          pattern: recommendation.params.pattern,
          factor: recommendation.params.reduction
        });
        return {
          type: 'api_frequency',
          pattern: recommendation.params.pattern,
          reduction: recommendation.params.reduction
        };
        
      case 'adjust_schedule':
        // Communicate with scheduler to prefer certain hours
        this.emit('adjust_schedule', {
          preferredHours: recommendation.params.preferredHours
        });
        return {
          type: 'schedule',
          preferredHours: recommendation.params.preferredHours
        };
        
      default:
        return null;
    }
  }

  async loadHistoricalData() {
    // This would load from database
    // Placeholder for now
    console.log('📂 Loading historical feedback data...');
  }

  getInsights() {
    const insights = [];
    
    // Accuracy trend
    if (this.performanceMetrics.accuracy.history.length > 10) {
      const recent = this.performanceMetrics.accuracy.history.slice(-10);
      const trend = this.calculateTrend(recent.map(h => h.value));
      
      insights.push({
        type: 'accuracy_trend',
        trend: trend > 0 ? 'improving' : 'declining',
        magnitude: Math.abs(trend),
        message: `Research accuracy is ${trend > 0 ? 'improving' : 'declining'} at ${(Math.abs(trend) * 100).toFixed(1)}% per analysis cycle`
      });
    }
    
    // Most problematic patterns
    const topProblems = Array.from(this.patterns.failurePatterns.entries())
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 3);
    
    if (topProblems.length > 0) {
      insights.push({
        type: 'problem_patterns',
        patterns: topProblems.map(([pattern, data]) => ({
          pattern,
          failures: data.count,
          mainReason: Object.entries(data.reasons)
            .sort(([,a], [,b]) => b - a)[0][0]
        }))
      });
    }
    
    // Optimization opportunities
    const avgDuration = stats.mean(this.memory.researches.map(r => r.duration || 0));
    if (avgDuration > 20000) {
      insights.push({
        type: 'performance',
        metric: 'duration',
        value: avgDuration,
        message: `Average research duration is ${(avgDuration / 1000).toFixed(1)}s - optimization recommended`
      });
    }
    
    return insights;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    
    const xValues = values.map((_, i) => i);
    const slope = stats.linearRegression([xValues, values]).m;
    
    return slope;
  }

  reset() {
    this.memory = {
      researches: [],
      validations: [],
      failures: [],
      successes: []
    };
    
    this.patterns = {
      failurePatterns: new Map(),
      successPatterns: new Map(),
      timePatterns: new Map()
    };
    
    this.performanceMetrics = this.initializeMetrics();
    console.log('🔄 Feedback agent reset');
  }

  stop() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
    }
    console.log('🛑 Feedback agent stopped');
  }
}

module.exports = ResearchFeedbackAgent;