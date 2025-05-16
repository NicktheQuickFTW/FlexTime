/**
 * FlexApp Hook
 * 
 * This hook provides access to the core FlexTime application functionality,
 * replacing the external Context7 dependency with local implementations.
 */

import { useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';

// Create a context for FlexApp services
const FlexAppContext = createContext(null);

/**
 * FlexApp Provider that gives access to all FlexTime services
 */
export const FlexAppProvider = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Base URL for API requests
  const API_BASE_URL = '/api';
  
  // Initialize the services
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Get service status
        const statusResponse = await axios.get(`${API_BASE_URL}/scheduling-service/status`);
        const assistantResponse = await axios.get(`${API_BASE_URL}/virtual-assistant/status`);
        
        if (statusResponse.data.success && assistantResponse.data.success) {
          setIsInitialized(true);
        } else {
          setError('One or more services failed to initialize');
        }
      } catch (error) {
        setError(`Failed to initialize services: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeServices();
  }, []);
  
  /**
   * Resolve a library ID (replaces Context7's resolveLibraryId)
   * 
   * @param {string} libraryName - Name of the library to resolve
   * @returns {Promise<Object>} Library information
   */
  const resolveLibraryId = async (libraryName) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/virtual-assistant/resolve-library-id`, {
        libraryName
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to resolve library ID: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Get library documentation (replaces Context7's getLibraryDocs)
   * 
   * @param {string} libraryId - ID of the library to get docs for
   * @param {Object} options - Options for the request
   * @returns {Promise<Object>} Library documentation
   */
  const getLibraryDocs = async (libraryId, options = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/virtual-assistant/get-library-docs`, {
        libraryId,
        ...options
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get library docs: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Detect patterns in data (replaces Context7's detectPatterns)
   * 
   * @param {Object} options - Options for pattern detection
   * @returns {Promise<Object>} Detected patterns
   */
  const detectPatterns = async (options = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/virtual-assistant/detect-patterns`, options);
      return response.data;
    } catch (error) {
      console.error(`Failed to detect patterns: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Generate recommendations (replaces Context7's generateRecommendations)
   * 
   * @param {Object} options - Options for recommendation generation
   * @returns {Promise<Object>} Generated recommendations
   */
  const generateRecommendations = async (options = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/virtual-assistant/generate-recommendations`, options);
      return response.data;
    } catch (error) {
      console.error(`Failed to generate recommendations: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Get scheduling recommendations
   * 
   * @param {Object} parameters - Scheduling parameters
   * @returns {Promise<Object>} Scheduling recommendations
   */
  const getSchedulingRecommendations = async (parameters) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scheduling-service/recommendations`, parameters);
      return response.data;
    } catch (error) {
      console.error(`Failed to get scheduling recommendations: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Get learning insights
   * 
   * @param {Object} parameters - Query parameters
   * @returns {Promise<Object>} Learning insights
   */
  const getLearningInsights = async (parameters = {}) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scheduling-service/learning/insights`, {
        params: parameters
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to get learning insights: ${error.message}`);
      throw error;
    }
  };
  
  /**
   * Optimize a schedule
   * 
   * @param {Object} schedule - Schedule to optimize
   * @param {Array} constraints - Constraints to apply
   * @param {Object} options - Optimization options
   * @returns {Promise<Object>} Optimized schedule
   */
  const optimizeSchedule = async (schedule, constraints = [], options = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scheduling-service/optimize`, {
        schedule,
        constraints,
        options
      });
      return response.data;
    } catch (error) {
      console.error(`Failed to optimize schedule: ${error.message}`);
      throw error;
    }
  };
  
  // Create the context value with all services
  const contextValue = {
    // Status properties
    isInitialized,
    loading,
    error,
    
    // Former Context7 methods
    resolveLibraryId,
    getLibraryDocs,
    detectPatterns,
    generateRecommendations,
    
    // Scheduling service methods
    getSchedulingRecommendations,
    getLearningInsights,
    optimizeSchedule
  };
  
  return (
    <FlexAppContext.Provider value={contextValue}>
      {children}
    </FlexAppContext.Provider>
  );
};

/**
 * Hook for accessing FlexApp services
 * 
 * @returns {Object} FlexApp services and state
 */
export const useFlexApp = () => {
  const context = useContext(FlexAppContext);
  
  if (!context) {
    throw new Error('useFlexApp must be used within a FlexAppProvider');
  }
  
  return context;
};

export default useFlexApp;