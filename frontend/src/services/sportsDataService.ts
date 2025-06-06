/**
 * FlexTime Big 12 Sports Data Service
 * 
 * Comprehensive sports data service for the Big 12 Command Center
 * Handles teams, standings, games, scores, and external integrations
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

// Types for sports data
export interface Big12Team {
  team_id: number;
  sport_id: number;
  school_id: number;
  sport: string;
  name: string;
  abbreviation: string;
  primary_color: string;
  secondary_color: string;
  conference: string;
  city: string;
  state: string;
  season_record: string;
  conference_record: string;
  national_ranking: number;
  head_coach: string;
  facility_name: string;
  facility_capacity: number;
  compass_rating: number;
  compass_overall_score: number;
  logo?: string;
}

export interface Big12Sport {
  sport_id: number;
  sport_name: string;
  code: string;
  gender: string;
  season_type: string;
  team_count: number;
  championship_format: string;
  championship_location: string;
  championship_date: string;
  scheduled_by_flextime: boolean;
}

export interface StandingsEntry {
  team: Big12Team;
  conference_wins: number;
  conference_losses: number;
  overall_wins: number;
  overall_losses: number;
  win_percentage: number;
  streak: string;
  last_10: string;
  compass_rating: number;
  position: number;
}

export interface GameResult {
  game_id: string;
  home_team: Big12Team;
  away_team: Big12Team;
  home_score: number;
  away_score: number;
  game_date: string;
  status: 'completed' | 'in_progress' | 'scheduled';
  venue: string;
  attendance?: number;
  tv_network?: string;
}

export interface UpcomingGame {
  game_id: string;
  home_team: Big12Team;
  away_team: Big12Team;
  game_date: string;
  game_time: string;
  venue: string;
  tv_network?: string;
  ticket_url?: string;
  preview_url?: string;
}

export interface ExternalLink {
  name: string;
  url: string;
  icon: string;
  description: string;
  category: 'scheduling' | 'analytics' | 'communication' | 'media' | 'operations';
}

class SportsDataService {
  private baseUrl: string;
  private cache = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Get all Big 12 sports
   */
  async getAllSports(): Promise<Big12Sport[]> {
    const cacheKey = 'all_sports';
    const cached = this.getCachedData<Big12Sport[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/api/sports`);
      if (!response.ok) throw new Error('Failed to fetch sports');
      
      const sports = await response.json();
      this.setCachedData(cacheKey, sports);
      return sports;
    } catch (error) {
      // Return mock data for development
      return this.getMockSports();
    }
  }

  /**
   * Get all teams for a specific sport
   */
  async getTeamsBySport(sportId: number): Promise<Big12Team[]> {
    const cacheKey = `teams_sport_${sportId}`;
    const cached = this.getCachedData<Big12Team[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/api/sports/${sportId}/teams`);
      if (!response.ok) throw new Error('Failed to fetch teams');
      
      const teams = await response.json();
      this.setCachedData(cacheKey, teams);
      return teams;
    } catch (error) {
      return this.getMockTeams(sportId);
    }
  }

  /**
   * Get current standings for a sport
   */
  async getStandings(sportId: number): Promise<StandingsEntry[]> {
    const cacheKey = `standings_${sportId}`;
    const cached = this.getCachedData<StandingsEntry[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await fetch(`${this.baseUrl}/api/sports/${sportId}/standings`);
      if (!response.ok) throw new Error('Failed to fetch standings');
      
      const standings = await response.json();
      this.setCachedData(cacheKey, standings);
      return standings;
    } catch (error) {
      return this.getMockStandings(sportId);
    }
  }

  /**
   * Get recent games and scores
   */
  async getRecentGames(sportId?: number, limit: number = 20): Promise<GameResult[]> {
    const cacheKey = `recent_games_${sportId || 'all'}_${limit}`;
    const cached = this.getCachedData<GameResult[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = sportId 
        ? `${this.baseUrl}/api/sports/${sportId}/games/recent?limit=${limit}`
        : `${this.baseUrl}/api/games/recent?limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch recent games');
      
      const games = await response.json();
      this.setCachedData(cacheKey, games);
      return games;
    } catch (error) {
      return this.getMockRecentGames(sportId, limit);
    }
  }

  /**
   * Get upcoming games
   */
  async getUpcomingGames(sportId?: number, limit: number = 20): Promise<UpcomingGame[]> {
    const cacheKey = `upcoming_games_${sportId || 'all'}_${limit}`;
    const cached = this.getCachedData<UpcomingGame[]>(cacheKey);
    if (cached) return cached;

    try {
      const url = sportId 
        ? `${this.baseUrl}/api/sports/${sportId}/games/upcoming?limit=${limit}`
        : `${this.baseUrl}/api/games/upcoming?limit=${limit}`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch upcoming games');
      
      const games = await response.json();
      this.setCachedData(cacheKey, games);
      return games;
    } catch (error) {
      return this.getMockUpcomingGames(sportId, limit);
    }
  }

  /**
   * Get external links for the command center
   */
  getExternalLinks(): ExternalLink[] {
    return [
      {
        name: 'RefQuest',
        url: 'https://refquest.big12sports.com',
        icon: 'whistle',
        description: 'Official referee assignment system',
        category: 'scheduling'
      },
      {
        name: 'Teamworks',
        url: 'https://teamworks.com',
        icon: 'users',
        description: 'Team communication and organization',
        category: 'communication'
      },
      {
        name: 'Big 12 Notion',
        url: 'https://notion.so/big12',
        icon: 'file-text',
        description: 'Conference documentation and planning',
        category: 'operations'
      },
      {
        name: 'ESPN Big 12',
        url: 'https://espn.com/college-sports/conference/_/id/4',
        icon: 'tv',
        description: 'Live scores and highlights',
        category: 'media'
      },
      {
        name: 'Big 12 Analytics',
        url: 'https://analytics.big12sports.com',
        icon: 'bar-chart',
        description: 'Conference performance metrics',
        category: 'analytics'
      },
      {
        name: 'COMPASS Dashboard',
        url: '/dashboard/compass',
        icon: 'compass',
        description: 'AI-powered team analysis',
        category: 'analytics'
      },
      {
        name: 'FlexTime Scheduler',
        url: '/schedule-builder',
        icon: 'calendar',
        description: 'Intelligent schedule creation',
        category: 'scheduling'
      },
      {
        name: 'Venue Management',
        url: '/venues',
        icon: 'map-pin',
        description: 'Facility and venue coordination',
        category: 'operations'
      }
    ];
  }

  // Mock data for development
  private getMockSports(): Big12Sport[] {
    return [
      {
        sport_id: 1,
        sport_name: 'Football',
        code: 'FB',
        gender: 'M',
        season_type: 'Fall',
        team_count: 16,
        championship_format: 'Playoff',
        championship_location: 'Arlington, TX',
        championship_date: 'December 2, 2025',
        scheduled_by_flextime: true
      },
      {
        sport_id: 2,
        sport_name: 'Men\'s Basketball',
        code: 'MBB',
        gender: 'M',
        season_type: 'Winter',
        team_count: 16,
        championship_format: 'Tournament',
        championship_location: 'Kansas City, MO',
        championship_date: 'March 14-17, 2025',
        scheduled_by_flextime: true
      },
      {
        sport_id: 3,
        sport_name: 'Women\'s Basketball',
        code: 'WBB',
        gender: 'W',
        season_type: 'Winter',
        team_count: 16,
        championship_format: 'Tournament',
        championship_location: 'Kansas City, MO',
        championship_date: 'March 11-14, 2025',
        scheduled_by_flextime: true
      }
    ];
  }

  private getMockTeams(sportId: number): Big12Team[] {
    const teams = [
      {
        team_id: 101,
        sport_id: sportId,
        school_id: 1,
        sport: 'Football',
        name: 'Kansas Jayhawks',
        abbreviation: 'KU',
        primary_color: '#0051ba',
        secondary_color: '#e31837',
        conference: 'Big 12',
        city: 'Lawrence',
        state: 'Kansas',
        season_record: '8-4',
        conference_record: '6-3',
        national_ranking: 15,
        head_coach: 'Lance Leipold',
        facility_name: 'David Booth Kansas Memorial Stadium',
        facility_capacity: 50250,
        compass_rating: 8.5,
        compass_overall_score: 85
      },
      {
        team_id: 102,
        sport_id: sportId,
        school_id: 2,
        sport: 'Football',
        name: 'Texas Longhorns',
        abbreviation: 'TEX',
        primary_color: '#bf5700',
        secondary_color: '#ffffff',
        conference: 'Big 12',
        city: 'Austin',
        state: 'Texas',
        season_record: '11-1',
        conference_record: '8-1',
        national_ranking: 3,
        head_coach: 'Steve Sarkisian',
        facility_name: 'Darrell K Royal Stadium',
        facility_capacity: 100119,
        compass_rating: 9.2,
        compass_overall_score: 92
      }
    ];
    return teams;
  }

  private getMockStandings(sportId: number): StandingsEntry[] {
    const teams = this.getMockTeams(sportId);
    return teams.map((team, index) => ({
      team,
      conference_wins: 8 - index,
      conference_losses: index + 1,
      overall_wins: 11 - index,
      overall_losses: index + 1,
      win_percentage: (11 - index) / (12),
      streak: index === 0 ? 'W5' : 'L1',
      last_10: '8-2',
      compass_rating: team.compass_rating,
      position: index + 1
    }));
  }

  private getMockRecentGames(sportId?: number, limit: number = 20): GameResult[] {
    return [
      {
        game_id: '1',
        home_team: this.getMockTeams(1)[0],
        away_team: this.getMockTeams(1)[1],
        home_score: 24,
        away_score: 21,
        game_date: '2025-06-03T19:00:00Z',
        status: 'completed',
        venue: 'David Booth Kansas Memorial Stadium',
        attendance: 47850,
        tv_network: 'ESPN'
      }
    ];
  }

  private getMockUpcomingGames(sportId?: number, limit: number = 20): UpcomingGame[] {
    return [
      {
        game_id: '2',
        home_team: this.getMockTeams(1)[1],
        away_team: this.getMockTeams(1)[0],
        game_date: '2025-06-10',
        game_time: '7:00 PM CT',
        venue: 'Darrell K Royal Stadium',
        tv_network: 'FOX',
        ticket_url: 'https://texassports.com/tickets',
        preview_url: 'https://big12sports.com/preview'
      }
    ];
  }
}

export const sportsDataService = new SportsDataService();
export default sportsDataService;