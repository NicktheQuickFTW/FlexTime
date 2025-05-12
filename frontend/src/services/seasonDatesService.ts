import axios from 'axios';
import { SeasonDates, TournamentInfo, SchedulingRules } from '../models/SeasonDates';
import { SportType } from '../types';

// Base URL for the API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Service for managing season dates and scheduling information
 */
export const SeasonDatesService = {
  /**
   * Get all season dates for a specific sport
   * @param sportType The sport type to get season dates for
   * @returns Promise with an array of season dates
   */
  getSeasonDates: async (sportType: SportType): Promise<SeasonDates[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/season-dates`, {
        params: { sportType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching season dates:', error);
      throw error;
    }
  },

  /**
   * Get season dates for a specific sport and season
   * @param sportType The sport type to get season dates for
   * @param season The season to get dates for (e.g., "2025-26")
   * @returns Promise with the season dates
   */
  getSeasonDatesBySeason: async (sportType: SportType, season: string): Promise<SeasonDates> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/season-dates/by-season`, {
        params: { sportType, season }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching season dates for ${season}:`, error);
      throw error;
    }
  },

  /**
   * Create new season dates
   * @param seasonDates The season dates to create
   * @returns Promise with the created season dates
   */
  createSeasonDates: async (seasonDates: Omit<SeasonDates, 'id' | 'createdAt' | 'updatedAt'>): Promise<SeasonDates> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/season-dates`, seasonDates);
      return response.data;
    } catch (error) {
      console.error('Error creating season dates:', error);
      throw error;
    }
  },

  /**
   * Update existing season dates
   * @param id The ID of the season dates to update
   * @param seasonDates The updated season dates
   * @returns Promise with the updated season dates
   */
  updateSeasonDates: async (id: number, seasonDates: Partial<SeasonDates>): Promise<SeasonDates> => {
    try {
      const response = await axios.put(`${API_BASE_URL}/season-dates/${id}`, seasonDates);
      return response.data;
    } catch (error) {
      console.error(`Error updating season dates with ID ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get tournament information for a specific season
   * @param seasonId The ID of the season to get tournament info for
   * @returns Promise with an array of tournament info
   */
  getTournamentInfo: async (seasonId: number): Promise<TournamentInfo[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tournament-info`, {
        params: { seasonId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching tournament info for season ${seasonId}:`, error);
      throw error;
    }
  },

  /**
   * Create new tournament information
   * @param tournamentInfo The tournament info to create
   * @returns Promise with the created tournament info
   */
  createTournamentInfo: async (tournamentInfo: Omit<TournamentInfo, 'id'>): Promise<TournamentInfo> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/tournament-info`, tournamentInfo);
      return response.data;
    } catch (error) {
      console.error('Error creating tournament info:', error);
      throw error;
    }
  },

  /**
   * Get scheduling rules for a specific season
   * @param seasonId The ID of the season to get scheduling rules for
   * @returns Promise with the scheduling rules
   */
  getSchedulingRules: async (seasonId: number): Promise<SchedulingRules> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/scheduling-rules/${seasonId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching scheduling rules for season ${seasonId}:`, error);
      throw error;
    }
  },

  /**
   * Create new scheduling rules
   * @param schedulingRules The scheduling rules to create
   * @returns Promise with the created scheduling rules
   */
  createSchedulingRules: async (schedulingRules: Omit<SchedulingRules, 'id'>): Promise<SchedulingRules> => {
    try {
      const response = await axios.post(`${API_BASE_URL}/scheduling-rules`, schedulingRules);
      return response.data;
    } catch (error) {
      console.error('Error creating scheduling rules:', error);
      throw error;
    }
  }
};

export default SeasonDatesService;
