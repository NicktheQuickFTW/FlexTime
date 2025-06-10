// Weather Limitations - Big 12 Conference
// Technical constraints based on weather conditions and safety requirements

import {
  UnifiedConstraint,
  ConstraintType,
  ConstraintHardness,
  ConstraintResult,
  ConstraintStatus,
  Schedule,
  Game,
  ConstraintParameters,
  ConstraintViolation,
  ConstraintSuggestion
} from '../../types';

export const weatherLimitations: UnifiedConstraint[] = [
  {
    id: 'weather-safety-limits',
    name: 'Weather Safety Limitations',
    type: ConstraintType.SAFETY,
    hardness: ConstraintHardness.HARD,
    weight: 100,
    scope: {
      sports: ['Baseball', 'Softball', 'Soccer', 'Tennis'],
      venues: ['outdoor']
    },
    parameters: {
      temperatureLimits: {
        minimum: 35, // Fahrenheit
        maximum: 105 // Fahrenheit
      },
      windSpeedLimit: 35, // mph
      precipitationTypes: ['rain', 'snow', 'hail'],
      lightningPolicy: 'mandatory_delay',
      airQualityIndex: {
        maximum: 150 // Unhealthy for sensitive groups
      }
    },
    description: 'Enforces safety limitations based on weather conditions',
    
    evaluate: async (game: Game, context: any): Promise<ConstraintResult> => {
      const violations: ConstraintViolation[] = [];
      const suggestions: ConstraintSuggestion[] = [];
      
      // Check if this is an outdoor sport
      const outdoorSports = ['Baseball', 'Softball', 'Soccer', 'Tennis'];
      if (!outdoorSports.includes(game.sport)) {
        return {
          constraintId: 'weather-safety-limits',
          status: ConstraintStatus.NOT_APPLICABLE,
          score: 1,
          violations: [],
          suggestions: [],
          metadata: { reason: 'Indoor sport' }
        };
      }
      
      // Weather evaluation would typically integrate with weather APIs
      // For now, we'll simulate the evaluation logic
      
      const forecast = await getWeatherForecast(game.venueId, game.date);
      
      if (forecast) {
        // Temperature check
        if (forecast.temperature < this.parameters.temperatureLimits.minimum) {
          violations.push({
            type: 'temperature_violation',
            severity: 'critical',
            message: `Temperature ${forecast.temperature}°F below minimum safe level (${this.parameters.temperatureLimits.minimum}°F)`,
            suggestedFix: 'Reschedule to warmer conditions or move to indoor facility'
          });
        }
        
        if (forecast.temperature > this.parameters.temperatureLimits.maximum) {
          violations.push({
            type: 'temperature_violation',
            severity: 'critical',
            message: `Temperature ${forecast.temperature}°F above maximum safe level (${this.parameters.temperatureLimits.maximum}°F)`,
            suggestedFix: 'Reschedule to cooler conditions or adjust start time'
          });
        }
        
        // Wind speed check
        if (forecast.windSpeed > this.parameters.windSpeedLimit) {
          violations.push({
            type: 'wind_violation',
            severity: 'high',
            message: `Wind speed ${forecast.windSpeed} mph exceeds safe limit (${this.parameters.windSpeedLimit} mph)`,
            suggestedFix: 'Monitor conditions and be prepared to postpone'
          });
        }
        
        // Precipitation check
        if (forecast.precipitation && this.parameters.precipitationTypes.includes(forecast.precipitationType)) {
          violations.push({
            type: 'precipitation_violation',
            severity: 'high',
            message: `${forecast.precipitationType} forecast during game time`,
            suggestedFix: 'Monitor weather and have contingency plan ready'
          });
        }
      }
      
      return {
        constraintId: 'weather-safety-limits',
        status: violations.length > 0 ? ConstraintStatus.VIOLATED : ConstraintStatus.SATISFIED,
        score: violations.length > 0 ? 0 : 1,
        violations,
        suggestions,
        metadata: {
          forecast,
          outdoorSport: true
        }
      };
    }
  }
];

// Mock weather forecast function (would integrate with actual weather API)
async function getWeatherForecast(venueId: string, date: string) {
  // This would integrate with a weather service API
  return {
    temperature: 72,
    windSpeed: 15,
    precipitation: false,
    precipitationType: null,
    lightningRisk: 'low',
    airQualityIndex: 85
  };
}

export default weatherLimitations;