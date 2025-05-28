import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SportType } from '../types';
import { getSportConfig, getSportTypeById, SportConfig } from '../config/sportConfig';

// Define the context interface
interface SportConfigContextType {
  currentSportId: number | null;
  currentSportType: SportType | null;
  sportConfig: SportConfig | null;
  setSportById: (sportId: number) => void;
  setSportByType: (sportType: SportType) => void;
  loading: boolean;
  error: string | null;
}

// Create the context with a default value
const SportConfigContext = createContext<SportConfigContextType>({
  currentSportId: null,
  currentSportType: null,
  sportConfig: null,
  setSportById: () => {},
  setSportByType: () => {},
  loading: false,
  error: null
});

// Provider component
interface SportConfigProviderProps {
  children: ReactNode;
  defaultSportId?: number;
}

export const SportConfigProvider: React.FC<SportConfigProviderProps> = ({ 
  children, 
  defaultSportId = 1 // Default to Football (ID: 1)
}) => {
  const [currentSportId, setCurrentSportId] = useState<number | null>(defaultSportId);
  const [currentSportType, setCurrentSportType] = useState<SportType | null>(null);
  const [sportConfig, setSportConfig] = useState<SportConfig | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to set sport by ID
  const setSportById = (sportId: number) => {
    setCurrentSportId(sportId);
    try {
      const sportType = getSportTypeById(sportId);
      setCurrentSportType(sportType);
    } catch (err) {
      console.error('Error setting sport by ID:', err);
      setError('Invalid sport ID');
    }
  };

  // Function to set sport by type
  const setSportByType = (sportType: SportType) => {
    setCurrentSportType(sportType);
    // Map SportType back to ID (reverse mapping)
    const sportTypeValues = Object.values(SportType);
    const sportTypeIndex = sportTypeValues.indexOf(sportType);
    setCurrentSportId(sportTypeIndex + 1); // +1 because our IDs start at 1
  };

  // Update the sport config whenever the sport ID or type changes
  useEffect(() => {
    if (!currentSportId && !currentSportType) {
      return;
    }

    setLoading(true);
    try {
      // If we have a sport type, use it directly
      if (currentSportType) {
        const config = getSportConfig(currentSportType);
        setSportConfig(config);
      } 
      // Otherwise use the ID to get the type
      else if (currentSportId) {
        const sportType = getSportTypeById(currentSportId);
        setCurrentSportType(sportType);
        const config = getSportConfig(sportType);
        setSportConfig(config);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading sport configuration:', err);
      setError('Failed to load sport configuration');
      setSportConfig(null);
    } finally {
      setLoading(false);
    }
  }, [currentSportId, currentSportType]);

  // Initialize with default sport
  useEffect(() => {
    if (defaultSportId) {
      setSportById(defaultSportId);
    }
  }, [defaultSportId]);

  return (
    <SportConfigContext.Provider
      value={{
        currentSportId,
        currentSportType,
        sportConfig,
        setSportById,
        setSportByType,
        loading,
        error
      }}
    >
      {children}
    </SportConfigContext.Provider>
  );
};

// Custom hook to use the sport config context
export const useSportConfigContext = () => useContext(SportConfigContext);

export default SportConfigContext;
