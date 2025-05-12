import { useEffect, useState } from 'react';
import { SportType } from '../types';
import { getSportConfig, getSportTypeById, SportConfig } from '../config/sportConfig';

/**
 * Hook to get sport-specific configuration based on sport ID or type
 * @param sportIdOrType - Either a sport ID (number) or SportType enum value
 * @returns SportConfig object with sport-specific settings
 */
export const useSportConfig = (sportIdOrType: number | SportType) => {
  const [sportConfig, setSportConfig] = useState<SportConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      
      // Determine the sport type based on the input
      let sportType: SportType;
      
      if (typeof sportIdOrType === 'number') {
        // Convert sport ID to SportType
        sportType = getSportTypeById(sportIdOrType);
      } else {
        // Already a SportType
        sportType = sportIdOrType;
      }
      
      // Get the configuration for this sport
      const config = getSportConfig(sportType);
      setSportConfig(config);
      setError(null);
    } catch (err) {
      console.error('Error loading sport configuration:', err);
      setError('Failed to load sport configuration');
    } finally {
      setLoading(false);
    }
  }, [sportIdOrType]);

  return { sportConfig, loading, error };
};

export default useSportConfig;
