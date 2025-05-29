/**
 * LearningSystem.js
 * Manages the learning loop for the scheduling system.
 * Integrates with the Intelligence Engine for recommendations and learning.
 */
class LearningSystem {
  constructor(intelligenceEngineClient) {
    this.intelligenceEngine = intelligenceEngineClient;
    this.localHistoricalData = [];
    console.log('Learning System initialized');
    
    // Initialize connection to Intelligence Engine if available
    if (this.intelligenceEngine) {
      this.intelligenceEngine.initialize()
        .then(result => {
          console.log(`Intelligence Engine connection ${result.success ? 'successful' : 'failed'}`);
        })
        .catch(error => {
          console.error('Error initializing Intelligence Engine connection:', error);
        });
    }
  }
  
  async getRecommendations(params) {
    try {
      console.log(`Getting recommendations for ${params.sportType}`);
      
      // First try to get recommendations from the Intelligence Engine
      if (this.intelligenceEngine && this.intelligenceEngine.isConnected) {
        try {
          console.log('Requesting recommendations from Intelligence Engine');
          const ieRecommendations = await this.intelligenceEngine.getRecommendations(params);
          if (ieRecommendations) {
            console.log('Received recommendations from Intelligence Engine');
            return ieRecommendations;
          }
        } catch (error) {
          console.error('Error getting recommendations from Intelligence Engine:', error);
        }
      }
      
      // Fall back to local recommendations
      console.log('Using local recommendations');
      return this._getLocalRecommendations(params);
    } catch (error) {
      console.error('Error in getRecommendations:', error);
      return this._getDefaultRecommendations(params);
    }
  }
  
  async learnFromHistoricalData(scheduleData, feedback) {
    try {
      console.log(`Learning from feedback for schedule ${scheduleData.scheduleId}`);
      
      // Store data locally as a backup
      this._storeLocalHistoricalData(scheduleData, feedback);
      
      // Store data in the Intelligence Engine if available
      if (this.intelligenceEngine && this.intelligenceEngine.isConnected) {
        try {
          console.log('Storing experience in Intelligence Engine');
          const experience = this._formatExperience(scheduleData, feedback);
          await this.intelligenceEngine.storeExperience(experience);
          console.log('Experience stored in Intelligence Engine');
        } catch (error) {
          console.error('Error storing experience in Intelligence Engine:', error);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error in learnFromHistoricalData:', error);
      return { success: false, error: error.message };
    }
  }
  
  _storeLocalHistoricalData(scheduleData, feedback) {
    console.log('Storing historical data locally');
    this.localHistoricalData.push({
      timestamp: new Date().toISOString(),
      scheduleData,
      feedback
    });
    
    // Limit the size of local historical data
    if (this.localHistoricalData.length > 100) {
      this.localHistoricalData = this.localHistoricalData.slice(-100);
    }
  }
  
  _formatExperience(scheduleData, feedback) {
    return {
      type: 'schedule_feedback',
      sportType: scheduleData.sportType,
      season: scheduleData.season,
      algorithm: scheduleData.algorithm,
      metrics: scheduleData.metrics,
      feedback,
      timestamp: new Date().toISOString(),
      tags: [
        'schedule_feedback',
        scheduleData.sportType,
        scheduleData.season,
        scheduleData.algorithm,
        feedback.rating >= 4 ? 'positive_feedback' : 'needs_improvement'
      ]
    };
  }
  
  _getLocalRecommendations(params) {
    console.log('Generating local recommendations based on historical data');
    
    // Filter historical data by sport type
    const relevantData = this.localHistoricalData.filter(item => 
      item.scheduleData.sportType === params.sportType
    );
    
    if (relevantData.length === 0) {
      console.log('No relevant historical data found, using default recommendations');
      return this._getDefaultRecommendations(params);
    }
    
    // Find the most successful configurations
    const successfulConfigs = relevantData
      .filter(item => item.feedback && item.feedback.rating >= 4)
      .sort((a, b) => b.feedback.rating - a.feedback.rating);
    
    if (successfulConfigs.length > 0) {
      // Use the most successful configuration
      const bestConfig = successfulConfigs[0];
      console.log(`Using best configuration from historical data with rating ${bestConfig.feedback.rating}`);
      
      return {
        algorithm: bestConfig.scheduleData.algorithm,
        constraintWeights: bestConfig.scheduleData.constraintWeights || {
          travelDistance: 0.3,
          homeAwayBalance: 0.3,
          consecutiveGames: 0.2,
          rivalryGames: 0.1,
          venueAvailability: 0.1
        },
        optimizationIterations: bestConfig.scheduleData.optimizationIterations || 1000,
        parameters: bestConfig.scheduleData.parameters || {
          coolingRate: 0.95,
          initialTemperature: 100,
          neighborhoodSize: 10
        }
      };
    }
    
    console.log('No successful configurations found, using default recommendations');
    return this._getDefaultRecommendations(params);
  }
  
  _getDefaultRecommendations(params) {
    console.log('Using default recommendations');
    
    // Default recommendations based on sport type
    let algorithm = 'roundRobin';
    
    if (params.sportType === 'football') {
      algorithm = 'partialRoundRobin';
    } else if (['mens_basketball', 'womens_basketball', 'volleyball'].includes(params.sportType)) {
      algorithm = 'partialRoundRobin';
    }
    
    return {
      algorithm,
      constraintWeights: {
        travelDistance: 0.3,
        homeAwayBalance: 0.3,
        consecutiveGames: 0.2,
        rivalryGames: 0.1,
        venueAvailability: 0.1
      },
      optimizationIterations: 1000,
      parameters: {
        coolingRate: 0.95,
        initialTemperature: 100,
        neighborhoodSize: 10
      }
    };
  }
  
  async getInsights(params) {
    try {
      console.log(`Getting insights for ${params.sportType}`);
      
      // Try to get insights from the Intelligence Engine
      if (this.intelligenceEngine && this.intelligenceEngine.isConnected) {
        try {
          console.log('Requesting insights from Intelligence Engine');
          const ieInsights = await this.intelligenceEngine.getInsights(params);
          if (ieInsights) {
            console.log('Received insights from Intelligence Engine');
            return ieInsights;
          }
        } catch (error) {
          console.error('Error getting insights from Intelligence Engine:', error);
        }
      }
      
      // Fall back to local insights
      console.log('Using local insights');
      return this._getLocalInsights(params);
    } catch (error) {
      console.error('Error in getInsights:', error);
      return { insights: [] };
    }
  }
  
  _getLocalInsights(params) {
    console.log('Generating local insights based on historical data');
    
    // Simple local insights based on historical data
    const relevantData = this.localHistoricalData.filter(item => 
      item.scheduleData.sportType === params.sportType
    );
    
    if (relevantData.length === 0) {
      console.log('No relevant historical data found for insights');
      return { insights: [] };
    }
    
    // Calculate average metrics
    const metrics = relevantData.map(item => item.scheduleData.metrics);
    const avgQualityScore = metrics.reduce((sum, m) => sum + (m.qualityScore || 0), 0) / metrics.length;
    const avgTravelDistance = metrics.reduce((sum, m) => sum + (m.totalTravelDistance || 0), 0) / metrics.length;
    
    // Calculate algorithm success rates
    const algorithmCounts = {};
    const algorithmRatings = {};
    
    relevantData.forEach(item => {
      const algorithm = item.scheduleData.algorithm;
      const rating = item.feedback?.rating || 0;
      
      if (!algorithmCounts[algorithm]) {
        algorithmCounts[algorithm] = 0;
        algorithmRatings[algorithm] = 0;
      }
      
      algorithmCounts[algorithm]++;
      algorithmRatings[algorithm] += rating;
    });
    
    const algorithmPerformance = Object.keys(algorithmCounts).map(algorithm => ({
      algorithm,
      avgRating: algorithmRatings[algorithm] / algorithmCounts[algorithm],
      usageCount: algorithmCounts[algorithm]
    })).sort((a, b) => b.avgRating - a.avgRating);
    
    console.log(`Generated ${algorithmPerformance.length} algorithm performance insights`);
    
    return {
      insights: [
        {
          type: 'metric_summary',
          title: 'Average Schedule Quality',
          value: avgQualityScore.toFixed(1),
          description: 'Average quality score across all generated schedules'
        },
        {
          type: 'metric_summary',
          title: 'Average Travel Distance',
          value: `${Math.round(avgTravelDistance)} miles`,
          description: 'Average total travel distance across all schedules'
        },
        {
          type: 'algorithm_performance',
          title: 'Algorithm Performance',
          data: algorithmPerformance,
          description: 'Performance ratings of different scheduling algorithms'
        }
      ]
    };
  }
}

module.exports = LearningSystem;
