import { SeasonDatesService } from '../services/seasonDatesService';
import { 
  menBasketballSeasonDates, 
  womenBasketballSeasonDates,
  menBasketballTournamentInfo,
  womenBasketballTournamentInfo
} from '../data/basketballSeasonDates';

/**
 * Utility function to seed the database with basketball scheduling data
 * This should be called during application initialization or via an admin function
 */
export const seedBasketballData = async (): Promise<void> => {
  try {
    console.log('Starting to seed basketball scheduling data...');
    
    // Seed Men's Basketball season dates
    const menSeasonsMap = new Map<string, number>();
    for (const seasonData of menBasketballSeasonDates) {
      console.log(`Seeding Men's Basketball data for season ${seasonData.season}...`);
      const createdSeason = await SeasonDatesService.createSeasonDates(seasonData);
      menSeasonsMap.set(seasonData.season, createdSeason.id);
      console.log(`Created Men's Basketball season data with ID: ${createdSeason.id}`);
    }
    
    // Seed Women's Basketball season dates
    const womenSeasonsMap = new Map<string, number>();
    for (const seasonData of womenBasketballSeasonDates) {
      console.log(`Seeding Women's Basketball data for season ${seasonData.season}...`);
      const createdSeason = await SeasonDatesService.createSeasonDates(seasonData);
      womenSeasonsMap.set(seasonData.season, createdSeason.id);
      console.log(`Created Women's Basketball season data with ID: ${createdSeason.id}`);
    }
    
    // Seed Men's Basketball tournament info
    const menTournamentInfoBySeason = groupTournamentInfoBySeason(menBasketballTournamentInfo);
    for (const [season, tournamentInfoList] of Object.entries(menTournamentInfoBySeason)) {
      const seasonId = menSeasonsMap.get(season);
      if (seasonId) {
        for (const tournamentInfo of tournamentInfoList) {
          await SeasonDatesService.createTournamentInfo({
            ...tournamentInfo,
            seasonId
          });
        }
        console.log(`Created tournament info for Men's Basketball season ${season}`);
      }
    }
    
    // Seed Women's Basketball tournament info
    const womenTournamentInfoBySeason = groupTournamentInfoBySeason(womenBasketballTournamentInfo);
    for (const [season, tournamentInfoList] of Object.entries(womenTournamentInfoBySeason)) {
      const seasonId = womenSeasonsMap.get(season);
      if (seasonId) {
        for (const tournamentInfo of tournamentInfoList) {
          await SeasonDatesService.createTournamentInfo({
            ...tournamentInfo,
            seasonId
          });
        }
        console.log(`Created tournament info for Women's Basketball season ${season}`);
      }
    }
    
    console.log('Successfully seeded all basketball scheduling data!');
  } catch (error) {
    console.error('Error seeding basketball data:', error);
    throw error;
  }
};

/**
 * Helper function to group tournament info by season based on date ranges
 * @param tournamentInfo Array of tournament info objects
 * @returns Object with seasons as keys and arrays of tournament info as values
 */
const groupTournamentInfoBySeason = (tournamentInfo: any[]): Record<string, any[]> => {
  const result: Record<string, any[]> = {};
  
  // Define season ranges
  const seasonRanges = [
    { season: '2025-26', startYear: 2025, endYear: 2026 },
    { season: '2026-27', startYear: 2026, endYear: 2027 },
    { season: '2027-28', startYear: 2027, endYear: 2028 },
    { season: '2028-29', startYear: 2028, endYear: 2029 },
    { season: '2029-30', startYear: 2029, endYear: 2030 }
  ];
  
  // Initialize result object
  seasonRanges.forEach(range => {
    result[range.season] = [];
  });
  
  // Group tournament info by season
  tournamentInfo.forEach(info => {
    const startDate = new Date(info.startDate);
    const startYear = startDate.getFullYear();
    
    const matchingSeason = seasonRanges.find(range => 
      (startYear === range.startYear && startDate.getMonth() >= 7) || // After July of start year
      (startYear === range.endYear && startDate.getMonth() <= 6)      // Before July of end year
    );
    
    if (matchingSeason) {
      result[matchingSeason.season].push(info);
    }
  });
  
  return result;
};

export default seedBasketballData;
