/**
 * Research Validation Agent
 * 
 * Validates research data quality with:
 * - Data completeness checks
 * - Consistency validation across sources
 * - Confidence scoring
 * - Conflict resolution
 * - Freshness tracking
 */

const EventEmitter = require('events');
const { Sequelize } = require('sequelize');
const moment = require('moment');

class ResearchValidationAgent extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      minConfidence: config.minConfidence || 0.7,
      maxDataAge: config.maxDataAge || 7, // days
      requiredFields: config.requiredFields || this.getDefaultRequiredFields(),
      validationRules: config.validationRules || this.getDefaultValidationRules(),
      ...config
    };
    
    this.validationStats = {
      processed: 0,
      passed: 0,
      failed: 0,
      conflicts: 0
    };
  }

  getDefaultRequiredFields() {
    return {
      comprehensive: [
        'teamName', 'sport', 'season', 'record', 'headCoach',
        'compassRating', 'keyPlayers', 'strengths', 'weaknesses'
      ],
      transfer_portal: [
        'teamName', 'sport', 'transfers', 'impactAssessment'
      ],
      recruiting: [
        'teamName', 'sport', 'recruitingClass', 'topProspects', 'classRanking'
      ],
      compass_ratings: [
        'teamName', 'sport', 'overallRating', 'components'
      ]
    };
  }

  getDefaultValidationRules() {
    return {
      compassRating: {
        type: 'range',
        min: 0,
        max: 100,
        required: true
      },
      record: {
        type: 'pattern',
        pattern: /^\d{1,2}-\d{1,2}$/,
        required: false
      },
      confidence: {
        type: 'range',
        min: 0,
        max: 1,
        required: true
      },
      dataAge: {
        type: 'function',
        validate: (date) => {
          const age = moment().diff(moment(date), 'days');
          return age <= this.config.maxDataAge;
        }
      }
    };
  }

  async validateResearchData(data, type = 'comprehensive') {
    console.log(`🔍 Validating ${type} research data`);
    const startTime = Date.now();
    
    const validation = {
      id: `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: new Date(),
      data,
      errors: [],
      warnings: [],
      confidence: 1.0,
      status: 'pending'
    };
    
    try {
      // Step 1: Required fields validation
      const fieldValidation = this.validateRequiredFields(data, type);
      validation.errors.push(...fieldValidation.errors);
      validation.warnings.push(...fieldValidation.warnings);
      validation.confidence *= fieldValidation.confidence;
      
      // Step 2: Data type and format validation
      const formatValidation = this.validateDataFormats(data);
      validation.errors.push(...formatValidation.errors);
      validation.warnings.push(...formatValidation.warnings);
      validation.confidence *= formatValidation.confidence;
      
      // Step 3: Business rule validation
      const ruleValidation = await this.validateBusinessRules(data, type);
      validation.errors.push(...ruleValidation.errors);
      validation.warnings.push(...ruleValidation.warnings);
      validation.confidence *= ruleValidation.confidence;
      
      // Step 4: Cross-reference validation
      const crossValidation = await this.validateCrossReferences(data, type);
      validation.errors.push(...crossValidation.errors);
      validation.warnings.push(...crossValidation.warnings);
      validation.confidence *= crossValidation.confidence;
      
      // Step 5: Freshness validation
      const freshnessValidation = this.validateDataFreshness(data);
      validation.errors.push(...freshnessValidation.errors);
      validation.warnings.push(...freshnessValidation.warnings);
      validation.confidence *= freshnessValidation.confidence;
      
      // Determine overall status
      if (validation.errors.length > 0) {
        validation.status = 'failed';
        this.validationStats.failed++;
      } else if (validation.confidence < this.config.minConfidence) {
        validation.status = 'low_confidence';
        validation.warnings.push(`Confidence ${validation.confidence.toFixed(2)} below threshold ${this.config.minConfidence}`);
      } else {
        validation.status = 'passed';
        this.validationStats.passed++;
      }
      
      this.validationStats.processed++;
      
      const duration = Date.now() - startTime;
      validation.duration = duration;
      
      console.log(`✅ Validation completed in ${duration}ms - Status: ${validation.status}`);
      
      // Emit validation result
      this.emit('validation_completed', validation);
      
      return validation;
      
    } catch (error) {
      console.error('❌ Validation error:', error);
      validation.status = 'error';
      validation.errors.push({
        field: 'system',
        message: error.message,
        severity: 'critical'
      });
      
      this.emit('validation_error', { validation, error });
      return validation;
    }
  }

  validateRequiredFields(data, type) {
    const result = {
      errors: [],
      warnings: [],
      confidence: 1.0
    };
    
    const requiredFields = this.config.requiredFields[type] || [];
    let missingFields = 0;
    
    for (const field of requiredFields) {
      if (!this.hasField(data, field)) {
        result.errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'high'
        });
        missingFields++;
      }
    }
    
    // Adjust confidence based on missing fields
    if (missingFields > 0) {
      result.confidence = Math.max(0.5, 1 - (missingFields * 0.1));
    }
    
    return result;
  }

  validateDataFormats(data) {
    const result = {
      errors: [],
      warnings: [],
      confidence: 1.0
    };
    
    // Validate COMPASS rating format
    if (data.compassRating !== undefined) {
      const rating = parseFloat(data.compassRating);
      if (isNaN(rating) || rating < 0 || rating > 100) {
        result.errors.push({
          field: 'compassRating',
          message: `Invalid COMPASS rating: ${data.compassRating}`,
          severity: 'high'
        });
        result.confidence *= 0.7;
      }
    }
    
    // Validate record format
    if (data.record && !this.isValidRecord(data.record)) {
      result.warnings.push({
        field: 'record',
        message: `Unusual record format: ${data.record}`,
        severity: 'medium'
      });
      result.confidence *= 0.9;
    }
    
    // Validate dates
    if (data.lastUpdated && !moment(data.lastUpdated).isValid()) {
      result.errors.push({
        field: 'lastUpdated',
        message: `Invalid date format: ${data.lastUpdated}`,
        severity: 'medium'
      });
    }
    
    // Validate arrays
    const arrayFields = ['transfers', 'recruitingClass', 'keyPlayers'];
    for (const field of arrayFields) {
      if (data[field] && !Array.isArray(data[field])) {
        result.errors.push({
          field,
          message: `Expected array for '${field}', got ${typeof data[field]}`,
          severity: 'medium'
        });
      }
    }
    
    return result;
  }

  async validateBusinessRules(data, type) {
    const result = {
      errors: [],
      warnings: [],
      confidence: 1.0
    };
    
    // Sport-specific validation
    if (data.sport && data.teamName) {
      const isValidTeam = await this.validateTeamSportCombination(data.teamName, data.sport);
      if (!isValidTeam) {
        result.errors.push({
          field: 'team_sport',
          message: `Invalid team-sport combination: ${data.teamName} - ${data.sport}`,
          severity: 'high'
        });
        result.confidence *= 0.5;
      }
    }
    
    // Transfer portal validation
    if (type === 'transfer_portal' && data.transfers) {
      for (const transfer of data.transfers) {
        if (!transfer.player || !transfer.previousSchool) {
          result.warnings.push({
            field: 'transfers',
            message: 'Incomplete transfer information',
            severity: 'low'
          });
          result.confidence *= 0.95;
        }
      }
    }
    
    // Recruiting validation
    if (type === 'recruiting' && data.classRanking) {
      const ranking = parseInt(data.classRanking);
      if (ranking < 1 || ranking > 200) {
        result.warnings.push({
          field: 'classRanking',
          message: `Unusual class ranking: ${ranking}`,
          severity: 'medium'
        });
        result.confidence *= 0.9;
      }
    }
    
    // COMPASS component validation
    if (data.components) {
      const validComponents = ['competitive', 'operational', 'market', 'performance', 'analytics'];
      for (const component of Object.keys(data.components)) {
        if (!validComponents.includes(component)) {
          result.warnings.push({
            field: 'components',
            message: `Unknown COMPASS component: ${component}`,
            severity: 'low'
          });
        }
      }
    }
    
    return result;
  }

  async validateCrossReferences(data, type) {
    const result = {
      errors: [],
      warnings: [],
      confidence: 1.0
    };
    
    // Check for conflicting data from different sources
    if (data.sources && data.sources.length > 1) {
      const conflicts = await this.detectConflicts(data);
      
      for (const conflict of conflicts) {
        result.warnings.push({
          field: conflict.field,
          message: `Conflicting values: ${conflict.values.join(' vs ')}`,
          severity: 'medium',
          sources: conflict.sources
        });
        result.confidence *= 0.85;
        this.validationStats.conflicts++;
      }
    }
    
    // Validate against known database values
    if (data.teamName && data.sport) {
      const dbValidation = await this.validateAgainstDatabase(data);
      if (dbValidation.discrepancies.length > 0) {
        for (const discrepancy of dbValidation.discrepancies) {
          result.warnings.push({
            field: discrepancy.field,
            message: `Database mismatch: ${discrepancy.message}`,
            severity: 'low'
          });
          result.confidence *= 0.95;
        }
      }
    }
    
    return result;
  }

  validateDataFreshness(data) {
    const result = {
      errors: [],
      warnings: [],
      confidence: 1.0
    };
    
    const now = moment();
    
    // Check research timestamp
    if (data.researchTimestamp) {
      const age = now.diff(moment(data.researchTimestamp), 'days');
      
      if (age > this.config.maxDataAge) {
        result.errors.push({
          field: 'researchTimestamp',
          message: `Data is ${age} days old (max: ${this.config.maxDataAge})`,
          severity: 'high'
        });
        result.confidence *= 0.6;
      } else if (age > this.config.maxDataAge * 0.7) {
        result.warnings.push({
          field: 'researchTimestamp',
          message: `Data is ${age} days old and should be refreshed soon`,
          severity: 'low'
        });
        result.confidence *= 0.9;
      }
    }
    
    // Check season relevance
    if (data.season) {
      const currentSeason = this.getCurrentSeason();
      if (data.season !== currentSeason) {
        result.warnings.push({
          field: 'season',
          message: `Data is for ${data.season}, current season is ${currentSeason}`,
          severity: 'medium'
        });
        result.confidence *= 0.8;
      }
    }
    
    return result;
  }

  async detectConflicts(data) {
    const conflicts = [];
    
    // This would implement sophisticated conflict detection
    // For now, basic implementation
    if (data.compassRating && data.alternateRating) {
      const diff = Math.abs(data.compassRating - data.alternateRating);
      if (diff > 10) {
        conflicts.push({
          field: 'compassRating',
          values: [data.compassRating, data.alternateRating],
          sources: data.sources || ['unknown']
        });
      }
    }
    
    return conflicts;
  }

  async validateAgainstDatabase(data) {
    // This would query the database for validation
    // Placeholder implementation
    return {
      discrepancies: []
    };
  }

  async validateTeamSportCombination(teamName, sport) {
    // Validate that team participates in sport
    // This would check against database
    return true; // Placeholder
  }

  hasField(data, field) {
    // Support nested field checking with dot notation
    const parts = field.split('.');
    let current = data;
    
    for (const part of parts) {
      if (!current || typeof current !== 'object' || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return current !== undefined && current !== null && current !== '';
  }

  isValidRecord(record) {
    // Validate win-loss record format
    return /^\d{1,3}-\d{1,3}(-\d{1,3})?$/.test(record);
  }

  getCurrentSeason() {
    const now = moment();
    const year = now.year();
    const month = now.month() + 1;
    
    // Academic year runs August to July
    if (month >= 8) {
      return `${year}-${(year + 1).toString().substr(2)}`;
    } else {
      return `${year - 1}-${year.toString().substr(2)}`;
    }
  }

  async resolveConflicts(conflicts, strategy = 'highest_confidence') {
    const resolved = [];
    
    for (const conflict of conflicts) {
      let resolution;
      
      switch (strategy) {
        case 'highest_confidence':
          resolution = conflict.values.reduce((best, current) => 
            current.confidence > best.confidence ? current : best
          );
          break;
          
        case 'most_recent':
          resolution = conflict.values.reduce((best, current) => 
            moment(current.timestamp).isAfter(moment(best.timestamp)) ? current : best
          );
          break;
          
        case 'consensus':
          // Find most common value
          const counts = {};
          conflict.values.forEach(v => {
            counts[v.value] = (counts[v.value] || 0) + 1;
          });
          const consensusValue = Object.entries(counts)
            .sort(([,a], [,b]) => b - a)[0][0];
          resolution = conflict.values.find(v => v.value === consensusValue);
          break;
          
        default:
          resolution = conflict.values[0];
      }
      
      resolved.push({
        field: conflict.field,
        original: conflict.values,
        resolved: resolution,
        strategy
      });
    }
    
    return resolved;
  }

  getValidationStats() {
    return {
      ...this.validationStats,
      successRate: this.validationStats.processed > 0 
        ? (this.validationStats.passed / this.validationStats.processed * 100).toFixed(2) + '%'
        : '0%',
      conflictRate: this.validationStats.processed > 0
        ? (this.validationStats.conflicts / this.validationStats.processed * 100).toFixed(2) + '%'
        : '0%'
    };
  }

  resetStats() {
    this.validationStats = {
      processed: 0,
      passed: 0,
      failed: 0,
      conflicts: 0
    };
  }
}

module.exports = ResearchValidationAgent;