/**
 * Model for storing season dates for different sports
 * This includes key dates like first practice, first games, conference play, and tournaments
 */
export interface SeasonDates {
  id: number;
  sportId: number;
  season: string; // e.g., "2025-26"
  firstPracticeDate: string; // ISO date format
  firstGameDate: string; // ISO date format
  conferencePlayStartDate: string; // ISO date format
  conferencePlayEndDate: string; // ISO date format
  conferenceChampionshipStartDate: string; // ISO date format
  conferenceChampionshipEndDate: string; // ISO date format
  postseasonStartDate: string; // ISO date format
  postseasonEndDate: string; // ISO date format
  conferenceWindows: number; // Number of scheduling windows
  notes?: string; // Additional notes about the season
  venueInfo?: string; // Information about championship venues
  createdAt: string; // ISO date format
  updatedAt: string; // ISO date format
}

/**
 * Model for storing NCAA tournament information
 */
export interface TournamentInfo {
  id: number;
  seasonId: number; // References SeasonDates.id
  tournamentName: string; // e.g., "NCAA Tournament", "Big 12 Championship"
  roundName: string; // e.g., "First Four", "1st & 2nd Rounds", "Regionals", "Final Four"
  startDate: string; // ISO date format
  endDate: string; // ISO date format
  location: string; // e.g., "Indianapolis", "Kansas City"
  notes?: string;
}

/**
 * Model for storing scheduling rules specific to a season
 */
export interface SchedulingRules {
  id: number;
  seasonId: number; // References SeasonDates.id
  totalGames: number;
  totalWindows: number;
  playTwiceCount: number;
  playOnceCount: number;
  hasBye: boolean;
  coreRules: string[]; // Array of core scheduling rules
  softRules: string[]; // Array of soft scheduling rules
}
