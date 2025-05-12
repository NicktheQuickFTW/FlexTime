import { SeasonDates, TournamentInfo } from '../models/SeasonDates';
import { SportType } from '../types';

/**
 * Men's Basketball season dates for the next five seasons
 * Based on Big 12 Conference scheduling parameters
 */
export const menBasketballSeasonDates: Omit<SeasonDates, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    sportId: 2, // Men's Basketball
    season: '2025-26',
    firstPracticeDate: '2025-10-01', // Varies by institution
    firstGameDate: '2025-11-03',
    conferencePlayStartDate: '2026-01-02',
    conferencePlayEndDate: '2026-03-07',
    conferenceChampionshipStartDate: '2026-03-10',
    conferenceChampionshipEndDate: '2026-03-14',
    postseasonStartDate: '2026-03-17',
    postseasonEndDate: '2026-04-06',
    conferenceWindows: 19,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '18 games played over 19 windows (includes one bye per team)'
  },
  {
    sportId: 2, // Men's Basketball
    season: '2026-27',
    firstPracticeDate: '2026-10-01', // Varies by institution
    firstGameDate: '2026-11-02',
    conferencePlayStartDate: '2027-01-01',
    conferencePlayEndDate: '2027-03-06',
    conferenceChampionshipStartDate: '2027-03-09',
    conferenceChampionshipEndDate: '2027-03-13',
    postseasonStartDate: '2027-03-16',
    postseasonEndDate: '2027-04-05',
    conferenceWindows: 19,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '18 games played over 19 windows (includes one bye per team)'
  },
  {
    sportId: 2, // Men's Basketball
    season: '2027-28',
    firstPracticeDate: '2027-10-01', // Varies by institution
    firstGameDate: '2027-11-01',
    conferencePlayStartDate: '2026-12-31',
    conferencePlayEndDate: '2028-03-04',
    conferenceChampionshipStartDate: '2028-03-07',
    conferenceChampionshipEndDate: '2028-03-11',
    postseasonStartDate: '2028-03-14',
    postseasonEndDate: '2028-04-03',
    conferenceWindows: 19,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '18 games played over 19 windows (includes one bye per team)'
  },
  {
    sportId: 2, // Men's Basketball
    season: '2028-29',
    firstPracticeDate: '2028-10-01', // Varies by institution
    firstGameDate: '2028-10-30',
    conferencePlayStartDate: '2028-12-29',
    conferencePlayEndDate: '2029-03-03',
    conferenceChampionshipStartDate: '2029-03-06',
    conferenceChampionshipEndDate: '2029-03-10',
    postseasonStartDate: '2029-03-13',
    postseasonEndDate: '2029-04-02',
    conferenceWindows: 19,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '18 games played over 19 windows (includes one bye per team)'
  },
  {
    sportId: 2, // Men's Basketball
    season: '2029-30',
    firstPracticeDate: '2029-10-01', // Varies by institution
    firstGameDate: '2029-11-05',
    conferencePlayStartDate: '2029-12-31',
    conferencePlayEndDate: '2030-03-09',
    conferenceChampionshipStartDate: '2030-03-12',
    conferenceChampionshipEndDate: '2030-03-16',
    postseasonStartDate: '2030-03-19',
    postseasonEndDate: '2030-04-08',
    conferenceWindows: 19,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '18 games played over 19 windows (includes one bye per team)'
  }
];

/**
 * Women's Basketball season dates for the next five seasons
 * Based on Big 12 Conference scheduling parameters
 */
export const womenBasketballSeasonDates: Omit<SeasonDates, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    sportId: 3, // Women's Basketball
    season: '2025-26',
    firstPracticeDate: '2025-10-01', // Varies by institution
    firstGameDate: '2025-11-03',
    conferencePlayStartDate: '2025-12-20',
    conferencePlayEndDate: '2026-02-28',
    conferenceChampionshipStartDate: '2026-03-04',
    conferenceChampionshipEndDate: '2026-03-09',
    postseasonStartDate: '2026-03-18',
    postseasonEndDate: '2026-04-05',
    conferenceWindows: 20,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '20 games played over 20 windows'
  },
  {
    sportId: 3, // Women's Basketball
    season: '2026-27',
    firstPracticeDate: '2026-10-01', // Varies by institution
    firstGameDate: '2026-11-02',
    conferencePlayStartDate: '2026-12-19',
    conferencePlayEndDate: '2027-02-27',
    conferenceChampionshipStartDate: '2027-03-03',
    conferenceChampionshipEndDate: '2027-03-08',
    postseasonStartDate: '2027-03-17',
    postseasonEndDate: '2027-04-04',
    conferenceWindows: 20,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '20 games played over 20 windows'
  },
  {
    sportId: 3, // Women's Basketball
    season: '2027-28',
    firstPracticeDate: '2027-10-01', // Varies by institution
    firstGameDate: '2027-11-01',
    conferencePlayStartDate: '2027-12-18',
    conferencePlayEndDate: '2028-02-26',
    conferenceChampionshipStartDate: '2028-03-01',
    conferenceChampionshipEndDate: '2028-03-06',
    postseasonStartDate: '2028-03-15',
    postseasonEndDate: '2028-04-02',
    conferenceWindows: 20,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '20 games played over 20 windows'
  },
  {
    sportId: 3, // Women's Basketball
    season: '2028-29',
    firstPracticeDate: '2028-10-01', // Varies by institution
    firstGameDate: '2028-10-30',
    conferencePlayStartDate: '2028-12-16',
    conferencePlayEndDate: '2029-02-24',
    conferenceChampionshipStartDate: '2029-02-28',
    conferenceChampionshipEndDate: '2029-03-05',
    postseasonStartDate: '2029-03-14',
    postseasonEndDate: '2029-04-01',
    conferenceWindows: 20,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '20 games played over 20 windows'
  },
  {
    sportId: 3, // Women's Basketball
    season: '2029-30',
    firstPracticeDate: '2029-10-01', // Varies by institution
    firstGameDate: '2029-11-05',
    conferencePlayStartDate: '2029-12-22',
    conferencePlayEndDate: '2030-03-02',
    conferenceChampionshipStartDate: '2030-03-06',
    conferenceChampionshipEndDate: '2030-03-11',
    postseasonStartDate: '2030-03-20',
    postseasonEndDate: '2030-04-07',
    conferenceWindows: 20,
    venueInfo: 'Big 12 Championship: Kansas City',
    notes: '20 games played over 20 windows'
  }
];

/**
 * NCAA Tournament information for Men's Basketball
 */
export const menBasketballTournamentInfo: Omit<TournamentInfo, 'id' | 'seasonId'>[] = [
  // 2025-26 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'First Four',
    startDate: '2026-03-17',
    endDate: '2026-03-18',
    location: 'TBD',
    notes: 'First Four games'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: '1st & 2nd Rounds',
    startDate: '2026-03-19',
    endDate: '2026-03-22',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2026-03-26',
    endDate: '2026-03-29',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2026-04-04',
    endDate: '2026-04-06',
    location: 'Indianapolis',
    notes: 'National semifinals and championship game'
  },
  
  // 2026-27 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'First Four',
    startDate: '2027-03-16',
    endDate: '2027-03-17',
    location: 'TBD',
    notes: 'First Four games'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: '1st & 2nd Rounds',
    startDate: '2027-03-18',
    endDate: '2027-03-21',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2027-03-25',
    endDate: '2027-03-28',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2027-04-03',
    endDate: '2027-04-05',
    location: 'Detroit',
    notes: 'National semifinals and championship game'
  },
  
  // 2027-28 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'First Four',
    startDate: '2028-03-14',
    endDate: '2028-03-15',
    location: 'TBD',
    notes: 'First Four games'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: '1st & 2nd Rounds',
    startDate: '2028-03-16',
    endDate: '2028-03-19',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2028-03-23',
    endDate: '2028-03-26',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2028-04-01',
    endDate: '2028-04-03',
    location: 'Las Vegas',
    notes: 'National semifinals and championship game'
  },
  
  // 2028-29 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'First Four',
    startDate: '2029-03-13',
    endDate: '2029-03-14',
    location: 'TBD',
    notes: 'First Four games'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: '1st & 2nd Rounds',
    startDate: '2029-03-15',
    endDate: '2029-03-18',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2029-03-22',
    endDate: '2029-03-25',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2029-03-31',
    endDate: '2029-04-02',
    location: 'Indianapolis',
    notes: 'National semifinals and championship game'
  },
  
  // 2029-30 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'First Four',
    startDate: '2030-03-19',
    endDate: '2030-03-20',
    location: 'TBD',
    notes: 'First Four games'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: '1st & 2nd Rounds',
    startDate: '2030-03-21',
    endDate: '2030-03-24',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2030-03-28',
    endDate: '2030-03-31',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2030-04-06',
    endDate: '2030-04-08',
    location: 'North Texas',
    notes: 'National semifinals and championship game'
  }
];

/**
 * NCAA Tournament information for Women's Basketball
 */
export const womenBasketballTournamentInfo: Omit<TournamentInfo, 'id' | 'seasonId'>[] = [
  // 2025-26 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Early Rounds',
    startDate: '2026-03-18',
    endDate: '2026-03-23',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2026-03-27',
    endDate: '2026-03-30',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2026-04-03',
    endDate: '2026-04-05',
    location: 'Phoenix',
    notes: 'National semifinals and championship game'
  },
  
  // 2026-27 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Early Rounds',
    startDate: '2027-03-17',
    endDate: '2027-03-22',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2027-03-26',
    endDate: '2027-03-29',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2027-04-02',
    endDate: '2027-04-04',
    location: 'Columbus',
    notes: 'National semifinals and championship game'
  },
  
  // 2027-28 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Early Rounds',
    startDate: '2028-03-15',
    endDate: '2028-03-20',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2028-03-24',
    endDate: '2028-03-27',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2028-03-31',
    endDate: '2028-04-02',
    location: 'Indianapolis',
    notes: 'National semifinals and championship game'
  },
  
  // 2028-29 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Early Rounds',
    startDate: '2029-03-14',
    endDate: '2029-03-19',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2029-03-23',
    endDate: '2029-03-26',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2029-03-30',
    endDate: '2029-04-01',
    location: 'San Antonio',
    notes: 'National semifinals and championship game'
  },
  
  // 2029-30 Season
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Early Rounds',
    startDate: '2030-03-20',
    endDate: '2030-03-25',
    location: 'Various',
    notes: 'First and second round games at various locations'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Regionals',
    startDate: '2030-03-29',
    endDate: '2030-04-01',
    location: 'Various',
    notes: 'Regional semifinals and finals'
  },
  {
    tournamentName: 'NCAA Tournament',
    roundName: 'Final Four',
    startDate: '2030-04-05',
    endDate: '2030-04-07',
    location: 'Portland',
    notes: 'National semifinals and championship game'
  }
];
