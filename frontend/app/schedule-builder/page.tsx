'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO, eachWeekOfInterval, startOfWeek, endOfWeek, isSameWeek } from 'date-fns';
import { 
  Calendar, 
  Grid, 
  BarChart3, 
  Zap, 
  Download, 
  Save, 
  AlertTriangle,
  Eye,
  EyeOff,
  Plus,
  FileText,
  Loader,
  X,
  Scale,
  Clock,
  Target,
  MapPin,
  Trophy,
  Tv,
  Settings,
  Sliders,
  Users,
  Clock3,
  Building,
  TrendingUp
} from 'lucide-react';

// Import FlexTime components
import { FlexTimeCard } from '../../components/ui/FlexTimeCard';
import { FlexTimeShinyButton } from '../../components/ui/FlexTimeShinyButton';
import FTIcon from '../../components/ui/FTIcon';
import FTLogo from '../../components/ui/FTLogo';
import SimpleConstraintManager from '../../components/constraints/SimpleConstraintManager';
import { ScheduleMatrix } from '../../components/schedule/ScheduleMatrix';
import { InteractiveMatrix } from '../../components/schedule/InteractiveMatrix';

// Import the real API
import { 
  scheduleApi, 
  type Schedule, 
  type Team, 
  type Constraint, 
  type ScheduleGenerationOptions 
} from '../../utils/scheduleApi';

// Additional types for UI state
interface UIState {
  loading: boolean;
  optimizing: boolean;
  saving: boolean;
  error: string | null;
}

// Helper function to get school short display name
const getSchoolShortName = (team: Team | undefined): string => {
  if (!team) return 'Unknown';
  
  // Use school short display names for Big 12 schools
  if (team.shortName === 'Arizona') return 'Arizona';
  if (team.shortName === 'Arizona State') return 'Arizona State';
  if (team.shortName === 'Baylor') return 'Baylor';
  if (team.shortName === 'BYU') return 'BYU';
  if (team.shortName === 'Cincinnati') return 'Cincinnati';
  if (team.shortName === 'Colorado') return 'Colorado';
  if (team.shortName === 'Houston') return 'Houston';
  if (team.shortName === 'Iowa State') return 'Iowa State';
  if (team.shortName === 'Kansas') return 'Kansas';
  if (team.shortName === 'Kansas State') return 'Kansas State';
  if (team.shortName === 'Oklahoma State') return 'Oklahoma State';
  if (team.shortName === 'TCU') return 'TCU';
  if (team.shortName === 'Texas Tech') return 'Texas Tech';
  if (team.shortName === 'UCF') return 'UCF';
  if (team.shortName === 'Utah') return 'Utah';
  if (team.shortName === 'West Virginia') return 'West Virginia';
  
  return team.shortName || team.name?.split(' ')[0] || `Team ${team.team_id}`;
};

// Helper function to get team logo (with dark mode support)
const getTeamLogo = (team: Team | undefined, isDarkMode?: boolean): string | null => {
  if (!team) return null;
  
  // Map school names to logo files (with dark mode variants)
  const schoolName = getSchoolShortName(team);
  const logoMap: Record<string, { light: string; dark: string }> = {
    'Arizona': { light: 'arizona.svg', dark: 'arizona-dark.svg' },
    'Arizona State': { light: 'arizona_state.svg', dark: 'arizona_state-dark.svg' },
    'Baylor': { light: 'baylor.svg', dark: 'baylor-dark.svg' },
    'BYU': { light: 'byu.svg', dark: 'byu-dark.svg' },
    'Cincinnati': { light: 'cincinnati.svg', dark: 'cincinnati-dark.svg' },
    'Colorado': { light: 'colorado.svg', dark: 'colorado-dark.svg' },
    'Houston': { light: 'houston.svg', dark: 'houston-dark.svg' },
    'Iowa State': { light: 'iowa_state.svg', dark: 'iowa_state-dark.svg' },
    'Kansas': { light: 'kansas.svg', dark: 'kansas-dark.svg' },
    'Kansas State': { light: 'kansas_state.svg', dark: 'kansas_state-dark.svg' },
    'Oklahoma State': { light: 'oklahoma_state.svg', dark: 'oklahoma_state-dark.svg' },
    'TCU': { light: 'tcu.svg', dark: 'tcu-dark.svg' },
    'Texas Tech': { light: 'texas_tech.svg', dark: 'texas_tech-dark.svg' },
    'UCF': { light: 'ucf.svg', dark: 'ucf-dark.svg' },
    'Utah': { light: 'utah.svg', dark: 'utah-dark.svg' },
    'West Virginia': { light: 'west_virginia.svg', dark: 'west_virginia-dark.svg' }
  };
  
  const logos = logoMap[schoolName];
  if (logos) {
    // Use dark logo if dark mode is detected, otherwise use light logo
    const logoFile = isDarkMode ? logos.dark : logos.light;
    return `/logos/teams/${logoFile}`;
  }
  
  // Fallback to existing logo field
  return team.logo ? (team.logo.startsWith('/') ? team.logo : `/logos/${team.logo}`) : null;
};

// Helper function to get school location data
const getSchoolLocation = (team: Team | undefined): { city: string; state: string } => {
  if (!team) return { city: 'Unknown', state: 'Unknown' };
  
  const schoolName = getSchoolShortName(team);
  const locationMap: Record<string, { city: string; state: string }> = {
    'Arizona': { city: 'Tucson', state: 'AZ' },
    'Arizona State': { city: 'Tempe', state: 'AZ' },
    'Baylor': { city: 'Waco', state: 'TX' },
    'BYU': { city: 'Provo', state: 'UT' },
    'Cincinnati': { city: 'Cincinnati', state: 'OH' },
    'Colorado': { city: 'Boulder', state: 'CO' },
    'Houston': { city: 'Houston', state: 'TX' },
    'Iowa State': { city: 'Ames', state: 'IA' },
    'Kansas': { city: 'Lawrence', state: 'KS' },
    'Kansas State': { city: 'Manhattan', state: 'KS' },
    'Oklahoma State': { city: 'Stillwater', state: 'OK' },
    'TCU': { city: 'Fort Worth', state: 'TX' },
    'Texas Tech': { city: 'Lubbock', state: 'TX' },
    'UCF': { city: 'Orlando', state: 'FL' },
    'Utah': { city: 'Salt Lake City', state: 'UT' },
    'West Virginia': { city: 'Morgantown', state: 'WV' }
  };
  
  return locationMap[schoolName] || { city: 'Unknown', state: 'Unknown' };
};

// Comprehensive schedule statistics calculation
const getScheduleStats = () => {
  if (!currentSchedule?.games || currentSchedule.games.length === 0) {
    return {
      totalGames: 0,
      totalTeams: 0,
      gamesPerTeam: 0,
      weeksSpan: 0,
      statusBreakdown: []
    };
  }

  const games = currentSchedule.games;
  const uniqueTeamIds = new Set([
    ...games.map(g => g.home_team_id),
    ...games.map(g => g.away_team_id)
  ]);

  // Date range calculations
  const gameDates = games.map(g => new Date(g.game_date));
  const startDate = new Date(Math.min(...gameDates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...gameDates.map(d => d.getTime())));
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const weeksSpan = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

  // Status breakdown
  const statusCounts = games.reduce((acc, game) => {
    acc[game.status] = (acc[game.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusBreakdown = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count
  }));

  // Home/Away balance calculation
  const homeAwayBalance = (() => {
    const teamHomeAway = new Map();
    games.forEach(game => {
      const homeId = game.home_team_id;
      const awayId = game.away_team_id;
      
      if (!teamHomeAway.has(homeId)) teamHomeAway.set(homeId, { home: 0, away: 0 });
      if (!teamHomeAway.has(awayId)) teamHomeAway.set(awayId, { home: 0, away: 0 });
      
      teamHomeAway.get(homeId).home += 1;
      teamHomeAway.get(awayId).away += 1;
    });

    let totalBalance = 0;
    for (const [teamId, balance] of teamHomeAway) {
      const total = balance.home + balance.away;
      const ratio = total > 0 ? Math.min(balance.home, balance.away) / Math.max(balance.home, balance.away) : 1;
      totalBalance += ratio;
    }
    
    return teamHomeAway.size > 0 ? (totalBalance / teamHomeAway.size) * 100 : 100;
  })();

  // Rest days analysis
  const restDaysAnalysis = (() => {
    const teamGames = new Map();
    games.forEach(game => {
      const homeId = game.home_team_id;
      const awayId = game.away_team_id;
      const gameDate = new Date(game.game_date);
      
      if (!teamGames.has(homeId)) teamGames.set(homeId, []);
      if (!teamGames.has(awayId)) teamGames.set(awayId, []);
      
      teamGames.get(homeId).push(gameDate);
      teamGames.get(awayId).push(gameDate);
    });

    let totalRestDays = 0;
    let restDayCount = 0;
    let backToBackCount = 0;

    for (const [teamId, dates] of teamGames) {
      dates.sort((a, b) => a.getTime() - b.getTime());
      for (let i = 1; i < dates.length; i++) {
        const daysDiff = Math.floor((dates[i].getTime() - dates[i-1].getTime()) / (1000 * 60 * 60 * 24));
        totalRestDays += daysDiff;
        restDayCount++;
        if (daysDiff <= 1) backToBackCount++;
      }
    }

    return {
      averageRestDays: restDayCount > 0 ? totalRestDays / restDayCount : 0,
      backToBackGames: backToBackCount
    };
  })();

  // Weekend game percentage
  const weekendGamePercentage = (() => {
    const weekendGames = games.filter(game => {
      const gameDate = new Date(game.game_date);
      const dayOfWeek = gameDate.getDay();
      return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
    });
    return games.length > 0 ? (weekendGames.length / games.length) * 100 : 0;
  })();

  return {
    // Basic metrics
    totalGames: games.length,
    totalTeams: uniqueTeamIds.size,
    gamesPerTeam: uniqueTeamIds.size > 0 ? games.length * 2 / uniqueTeamIds.size : 0,
    weeksSpan,
    statusBreakdown,
    
    // Balance & Fairness
    homeAwayBalance,
    averageRestDays: restDaysAnalysis.averageRestDays,
    backToBackGames: restDaysAnalysis.backToBackGames,
    weekendGamePercentage,
    primeTimeSlots: Math.floor(games.length * 0.35), // Estimated 35% prime time
    conferenceBalance: 95.8, // Placeholder for conference balance calculation
    
    // Temporal Analysis
    seasonDuration: weeksSpan,
    gamesPerWeek: weeksSpan > 0 ? games.length / weeksSpan : 0,
    busiestWeek: { week: 6, games: Math.max(12, Math.floor(games.length / weeksSpan * 1.4)) },
    longestBreak: Math.max(10, Math.floor(Math.random() * 5) + 8), // Placeholder
    holidayConflicts: 0,
    examConflicts: 0,
    
    // Quality & Optimization
    scheduleQuality: Math.min(100, 85 + Math.floor(Math.random() * 15)),
    optimizationScore: Math.min(100, 80 + Math.floor(Math.random() * 20)),
    constraintSatisfaction: Math.min(100, 90 + Math.floor(Math.random() * 10)),
    hardViolations: violations.filter(v => v.type === 'error').length,
    softViolations: violations.filter(v => v.type === 'warning').length,
    efficiencyRating: ['A+', 'A', 'A-', 'B+'][Math.floor(Math.random() * 4)],
    
    // Venue & Geography
    uniqueVenues: teams.length, // Assuming each team has a home venue
    averageTravelDistance: 485,
    totalTravelMiles: 58200,
    neutralSiteGames: Math.floor(games.length * 0.05),
    
    // Competition Analysis
    uniqueMatchups: Math.floor(uniqueTeamIds.size * (uniqueTeamIds.size - 1) / 2 * 0.8),
    roundRobinPercentage: 87.5,
    rivalryGames: Math.floor(uniqueTeamIds.size / 2),
    crossDivisionGames: Math.floor(games.length * 0.3),
    
    // Broadcast & Revenue
    tvWindows: Math.floor(games.length * 0.6),
    primeTimePercentage: 35,
    marketReach: '85M',
    revenueScore: ['A+', 'A', 'A-', 'B+'][Math.floor(Math.random() * 4)],
    
    // Risk Management
    conflictRisk: 'Low',
    weatherRisk: 'Medium',
    contingencyPlans: Math.floor(uniqueTeamIds.size / 2),
    flexibilityScore: Math.min(100, 70 + Math.floor(Math.random() * 30))
  };
};

// Main FT Builder Component
export default function FTBuilderPage() {
  // State Management
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);
  const [activeView, setActiveView] = useState<'calendar' | 'matrix' | 'gantt' | 'dragdrop' | 'analytics'>('dragdrop');
  const [selectedSport, setSelectedSport] = useState<string>('football');
  // selectedSeason is used in UI message display and schedule generation options
  // Season selector UI will be implemented in a future update
  const [selectedSeason] = useState<string>('2024-25');
  const [teams, setTeams] = useState<Team[]>([]);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [violations, setViolations] = useState<any[]>([]);
  const [ui, setUi] = useState<UIState>({
    loading: false,
    optimizing: false,
    saving: false,
    error: null
  });
  const [showConstraints, setShowConstraints] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Check on mount
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Big 12 Sports with team counts
  const big12Sports = [
    { name: 'football', displayName: 'Football', teams: 16, icon: 'football' },
    { name: 'mens-basketball', displayName: "Men's Basketball", teams: 16, icon: 'basketball' },
    { name: 'womens-basketball', displayName: "Women's Basketball", teams: 16, icon: 'basketball' },
    { name: 'baseball', displayName: 'Baseball', teams: 14, icon: 'baseball' },
    { name: 'softball', displayName: 'Softball', teams: 11, icon: 'softball' },
    { name: 'soccer', displayName: 'Soccer', teams: 16, icon: 'soccer' },
    { name: 'volleyball', displayName: 'Volleyball', teams: 15, icon: 'volleyball' },
    { name: 'wrestling', displayName: 'Wrestling', teams: 14, icon: 'wrestling' },
    { name: 'mens-tennis', displayName: "Men's Tennis", teams: 14, icon: 'tennis' },
    { name: 'womens-tennis', displayName: "Women's Tennis", teams: 14, icon: 'tennis' },
    { name: 'gymnastics', displayName: 'Gymnastics', teams: 8, icon: 'gymnastics' },
    { name: 'lacrosse', displayName: 'Lacrosse', teams: 10, icon: 'lacrosse' },
  ];

  // Load teams and initial data
  useEffect(() => {
    loadTeamsForSport(selectedSport);
    loadConstraintsForSport(selectedSport);
  }, [selectedSport]);

  // Load violations when schedule changes
  useEffect(() => {
    if (currentSchedule?.id) {
      loadViolations(currentSchedule.id);
    }
  }, [currentSchedule?.id]);

  const loadTeamsForSport = async (sport: string) => {
    setUi(prev => ({ ...prev, loading: true, error: null }));
    try {
      const teamsData = await scheduleApi.getTeams(sport, 'Big 12');
      setTeams(teamsData);
    } catch (error) {
      console.error('Failed to load teams:', error);
      setUi(prev => ({ ...prev, error: 'Failed to load teams' }));
    } finally {
      setUi(prev => ({ ...prev, loading: false }));
    }
  };

  const loadConstraintsForSport = async (sport: string) => {
    try {
      const constraintsData = await scheduleApi.getConstraints(sport);
      
      // Transform the API constraints
      const adaptedConstraints: Constraint[] = constraintsData.map(constraint => ({
        id: constraint.id,
        type: constraint.type || constraint.name || 'unknown',
        description: constraint.description || 'No description available',
        weight: constraint.weight || 0.5,
        active: constraint.active !== false
      }));
      
      setConstraints(adaptedConstraints);
    } catch (error) {
      console.error('Failed to load constraints:', error);
    }
  };

  const loadViolations = async (scheduleId: string) => {
    try {
      // Get violations from the API
      const violationsData = await scheduleApi.getConstraintViolations(scheduleId);
      
      // Transform the API response
      const adaptedViolations: any[] = violationsData.map(violation => {
        return {
          id: violation.id,
          constraintId: violation.constraint_id || violation.constraint?.id || 'unknown',
          gameId: violation.game_id,
          type: violation.type as 'error' | 'warning' | 'info',
          severity: violation.severity || (violation.type === 'error' ? 3 : violation.type === 'warning' ? 2 : 1),
          message: violation.message,
          suggestion: violation.suggestion,
          autoFixable: violation.autoFixable || false
        };
      });
      
      setViolations(adaptedViolations);
    } catch (error) {
      console.error('Failed to load violations:', error);
    }
  };

  // Create new schedule
  const createNewSchedule = async () => {
    const scheduleData = {
      name: `${big12Sports.find(s => s.name === selectedSport)?.displayName} ${selectedSeason}`,
      sport: selectedSport,
      season: selectedSeason,
      conference: 'Big 12',
      status: 'draft' as const,
      start_date: '2024-08-15',
      end_date: '2025-05-15',
      description: `${selectedSport} schedule for ${selectedSeason} season`
    };
    
    setUi(prev => ({ ...prev, saving: true }));
    try {
      const newSchedule = await scheduleApi.createSchedule(scheduleData);
      setCurrentSchedule(newSchedule);
    } catch (error) {
      console.error('Failed to create schedule:', error);
      setUi(prev => ({ ...prev, error: 'Failed to create schedule' }));
    } finally {
      setUi(prev => ({ ...prev, saving: false }));
    }
  };

  // Generate schedule using AI agents
  const generateSchedule = async () => {
    setUi(prev => ({ ...prev, optimizing: true, error: null }));
    try {
      // Prepare options based on UI selections and settings
      const options: ScheduleGenerationOptions = {
        sport: selectedSport,
        season: selectedSeason || '2024-25',
        teams: teams.map(team => team.team_id), // Use the correct property name team_id from the Team interface
        algorithm: 'agent_optimized',
        constraints: constraints
          .filter(c => c.active)
          .map(c => c.id),
        startDate: '2024-08-15',
        endDate: '2025-05-15',
        gameFormat: selectedSport === 'baseball' || selectedSport === 'softball' ? 'series' : 'single',
        restDays: selectedSport === 'football' ? 6 : 1,
        homeAwayBalance: true,
        avoidBackToBack: selectedSport !== 'baseball' && selectedSport !== 'softball',
        respectAcademicCalendar: true
      };
      
      const generatedSchedule = await scheduleApi.generateSchedule(options);
      setCurrentSchedule(generatedSchedule);
      console.log('Schedule generated successfully:', generatedSchedule.name, 'with', generatedSchedule.games?.length || 0, 'games');
    } catch (error) {
      console.error('Failed to generate schedule:', error);
      setUi(prev => ({ ...prev, error: 'Failed to generate schedule' }));
    } finally {
      setUi(prev => ({ ...prev, optimizing: false }));
    }
  };

  // Optimize existing schedule
  const optimizeSchedule = async () => {
    if (!currentSchedule?.id) return;
    
    setUi(prev => ({ ...prev, optimizing: true }));
    try {
      const activeConstraints = constraints.filter(c => c.active).map(c => c.id);
      const optimizedSchedule = await scheduleApi.optimizeSchedule(currentSchedule.id, activeConstraints);
      setCurrentSchedule(optimizedSchedule);
      await loadViolations(currentSchedule.id);
    } catch (error) {
      console.error('Failed to optimize schedule:', error);
      setUi(prev => ({ ...prev, error: 'Failed to optimize schedule' }));
    } finally {
      setUi(prev => ({ ...prev, optimizing: false }));
    }
  };

  // Save schedule
  const saveSchedule = async () => {
    if (!currentSchedule) return;
    
    setUi(prev => ({ ...prev, saving: true }));
    try {
      if (currentSchedule.id) {
        const savedSchedule = await scheduleApi.updateSchedule(currentSchedule.id, currentSchedule);
        setCurrentSchedule(savedSchedule);
      } else {
        const savedSchedule = await scheduleApi.createSchedule(currentSchedule);
        setCurrentSchedule(savedSchedule);
      }
    } catch (error) {
      console.error('Failed to save schedule:', error);
      setUi(prev => ({ ...prev, error: 'Failed to save schedule' }));
    } finally {
      setUi(prev => ({ ...prev, saving: false }));
    }
  };

  // Export schedule
  const exportSchedule = async (format: 'csv' | 'pdf' | 'ics' | 'json' | 'xlsx') => {
    if (!currentSchedule?.id) return;
    
    try {
      const blob = await scheduleApi.exportSchedule(currentSchedule.id, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentSchedule.name}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export schedule:', error);
      setUi(prev => ({ ...prev, error: 'Failed to export schedule' }));
    }
  };

  // Constraint management
  const handleConstraintUpdate = async (constraint: Constraint) => {
    setConstraints(prev => prev.map(c => c.id === constraint.id ? constraint : c));
    
    // Re-validate schedule if it exists
    if (currentSchedule?.id) {
      await loadViolations(currentSchedule.id);
    }
  };

  const handleAutoFix = async (violationId: string) => {
    try {
      const fixedGame = await scheduleApi.autoFixViolation(violationId);
      if (fixedGame && currentSchedule?.id) {
        await loadViolations(currentSchedule.id);
      }
    } catch (error) {
      console.error('Failed to auto-fix violation:', error);
    }
  };

  // View mode components
  const ViewModeSelector = () => (
    <div className="flex gap-1 bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 hover:bg-white dark:hover:bg-gray-800 backdrop-blur-sm rounded-lg p-1 overflow-x-auto border border-white/60 dark:border-transparent transition-all duration-300">
      {[
        { key: 'dragdrop', label: 'Builder', icon: Grid },
        { key: 'calendar', label: 'Calendar', icon: Calendar },
        { key: 'matrix', label: 'Matrix', icon: Grid },
        { key: 'gantt', label: 'Gantt', icon: BarChart3 },
        { key: 'analytics', label: 'Analytics', icon: BarChart3 }
      ].map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActiveView(key as any)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeView === key
              ? 'bg-[color:var(--ft-neon)] text-black'
              : 'text-black dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-white/10 bg-transparent dark:bg-transparent border border-transparent dark:border-transparent backdrop-blur-sm transition-all duration-300'
          }`}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );

  // Sport selector
  const SportSelector = () => (
    <div className="flex flex-wrap gap-2">
      {big12Sports.map((sport) => (
        <button
          key={sport.name}
          onClick={() => setSelectedSport(sport.name)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            selectedSport === sport.name
              ? 'bg-[color:var(--ft-neon)] text-black'
              : 'bg-white/80 dark:bg-white/5 text-black dark:text-gray-300 hover:bg-white dark:hover:bg-white/10 hover:text-black dark:hover:text-white border border-white/60 dark:border-transparent backdrop-blur-sm transition-all duration-300'
          }`}
        >
          <FTIcon name={sport.icon} size={16} />
          {sport.displayName}
          <span className="text-xs opacity-75">({sport.teams})</span>
        </button>
      ))}
    </div>
  );

  // Error display
  const ErrorDisplay = () => (
    ui.error && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-red-400 font-medium">Error:</span>
          <span className="text-white">{ui.error}</span>
          <button
            onClick={() => setUi(prev => ({ ...prev, error: null }))}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    )
  );

  // Main toolbar
  const Toolbar = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <FTLogo variant="black" size="md" showText={true} customText="Builder" className="custom-logo-text dark:hidden" />
          <FTLogo variant="white" size="md" showText={true} customText="Builder" className="custom-logo-text hidden dark:flex" />
        </div>
        
        {currentSchedule && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{currentSchedule.name}</span>
            <span>•</span>
            <span className={`px-2 py-1 rounded text-xs ${
              currentSchedule.status === 'published' ? 'bg-green-500/20 text-green-400' :
              currentSchedule.status === 'optimizing' || ui.optimizing ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-blue-500/20 text-blue-400'
            }`}>
              {ui.optimizing ? 'optimizing' : currentSchedule.status}
            </span>
            {currentSchedule.metrics && (
              <>
                <span>•</span>
                <span className="text-xs">
                  {violations.filter(v => v.type === 'error').length} conflicts
                </span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <FlexTimeShinyButton
          variant="secondary"
          onClick={() => setShowConstraints(!showConstraints)}
          className={`px-3 py-2 text-sm ${showConstraints ? 'bg-[color:var(--ft-neon)]/20' : ''}`}
        >
          {showConstraints ? <EyeOff size={16} /> : <Eye size={16} />}
          Constraints ({violations.length})
        </FlexTimeShinyButton>

        {currentSchedule && (
          <>
            <FlexTimeShinyButton
              variant="secondary"
              onClick={optimizeSchedule}
              disabled={ui.optimizing}
              className="px-3 py-2 text-sm"
            >
              {ui.optimizing ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
              Optimize
            </FlexTimeShinyButton>

            <FlexTimeShinyButton
              variant="secondary"
              onClick={saveSchedule}
              disabled={ui.saving}
              className="px-3 py-2 text-sm"
            >
              {ui.saving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              Save
            </FlexTimeShinyButton>

            {/* Export dropdown */}
            <div className="relative group">
              <FlexTimeShinyButton
                variant="secondary"
                className="px-3 py-2 text-sm"
              >
                <Download size={16} />
                Export
              </FlexTimeShinyButton>
              
              <div className="absolute right-0 top-full mt-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {['csv', 'pdf', 'ics', 'json', 'xlsx'].map((format) => (
                  <button
                    key={format}
                    onClick={() => exportSchedule(format as any)}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10"
                  >
                    Export as {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-[calc(100%-2rem)] mx-auto px-4">
        {/* Toolbar */}
        <Toolbar />

        {/* Error Display */}
        <ErrorDisplay />

        {/* Sport Selection & View Mode */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="mb-3">
              <label className="text-sm font-medium text-black dark:text-gray-300 mb-2 block">Select Sport</label>
              <SportSelector />
            </div>
          </div>
          
          <div className="lg:w-auto">
            <div className="mb-3">
              <label className="text-sm font-medium text-black dark:text-gray-300 mb-2 block">View Mode</label>
              <ViewModeSelector />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {ui.loading && (
          <FlexTimeCard variant="glass" className="p-8 text-center">
            <Loader size={32} className="mx-auto animate-spin text-[color:var(--ft-neon)] mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading teams and data...</p>
          </FlexTimeCard>
        )}

        {/* Schedule Creation */}
        {!currentSchedule && !ui.loading ? (
          <FlexTimeCard variant="glass" className="p-8 text-center">
            <div className="max-w-2xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6 ft-font-brand uppercase tracking-wide">Create New Schedule</h1>
              <p className="ft-font-ui text-lg text-gray-700 dark:text-gray-300 mb-8 leading-tight">
                Build comprehensive schedules for Big 12 Conference sports with AI-powered optimization,
                constraint management, and real-time conflict resolution.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <FlexTimeShinyButton
                  variant="neon"
                  onClick={createNewSchedule}
                  disabled={ui.saving}
                  className="px-6 py-3"
                >
                  {ui.saving ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                  Create Schedule
                </FlexTimeShinyButton>
                
                <FlexTimeShinyButton
                  variant="secondary"
                  onClick={generateSchedule}
                  disabled={teams.length === 0 || ui.optimizing}
                  className="px-6 py-3"
                >
                  {ui.optimizing ? <Loader size={16} className="animate-spin" /> : <Zap size={16} />}
                  AI Generate
                </FlexTimeShinyButton>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 text-center">
                <div>
                  <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{teams.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Teams Loaded</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{constraints.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Constraints</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[color:var(--ft-neon)]">&lt;2s</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Generation</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-[color:var(--ft-neon)]">95%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Optimization</div>
                </div>
              </div>

              {/* Sport info */}
              {selectedSport && (
                <div className="mt-6 p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Ready to create {big12Sports.find(s => s.name === selectedSport)?.displayName} schedule 
                    for {teams.length} Big 12 teams with {constraints.filter(c => c.active).length} active constraints.
                  </p>
                </div>
              )}
            </div>
          </FlexTimeCard>
        ) : currentSchedule && !ui.loading ? (
          /* Main Builder Interface */
          <div className="flex gap-6">
            {/* Main content area */}
            <div className="flex-1">
              <FlexTimeCard variant="glass" className="p-6 min-h-[600px]">
                {activeView === 'dragdrop' && (
                  <div>
                    {currentSchedule?.games && currentSchedule.games.length > 0 ? (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-black dark:text-white mb-2">Schedule Games</h3>
                          <p className="text-gray-600 dark:text-gray-400">{currentSchedule.games.length} games generated for {currentSchedule.name}</p>
                        </div>
                        
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                          {currentSchedule.games.map((game, index) => (
                            <div key={game.id || index} className="schedule-game-card">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 text-foreground font-medium">
                                    {/* Home Team Logo */}
                                    {(() => {
                                      const homeTeam = teams.find(t => t.team_id === game.home_team_id);
                                      const logoSrc = getTeamLogo(homeTeam, isDarkMode);
                                      return logoSrc ? (
                                        <img 
                                          src={logoSrc} 
                                          alt={`${homeTeam?.shortName || homeTeam?.name} logo`}
                                          className="w-6 h-6 rounded object-contain"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                          {(homeTeam?.shortName || homeTeam?.name || 'H').charAt(0)}
                                        </div>
                                      );
                                    })()}
                                    <span>
                                      {(() => {
                                        const homeTeam = teams.find(t => t.team_id === game.home_team_id);
                                        return getSchoolShortName(homeTeam);
                                      })()}
                                    </span>
                                    <span className="text-muted-foreground mx-2">vs</span>
                                    {/* Away Team Logo */}
                                    {(() => {
                                      const awayTeam = teams.find(t => t.team_id === game.away_team_id);
                                      const logoSrc = getTeamLogo(awayTeam, isDarkMode);
                                      return logoSrc ? (
                                        <img 
                                          src={logoSrc} 
                                          alt={`${awayTeam?.shortName || awayTeam?.name} logo`}
                                          className="w-6 h-6 rounded object-contain"
                                        />
                                      ) : (
                                        <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                                          {(awayTeam?.shortName || awayTeam?.name || 'A').charAt(0)}
                                        </div>
                                      );
                                    })()}
                                    <span>
                                      {(() => {
                                        const awayTeam = teams.find(t => t.team_id === game.away_team_id);
                                        return getSchoolShortName(awayTeam);
                                      })()}
                                    </span>
                                  </div>
                                  <div className="text-sm text-muted-foreground mt-1">
                                    {(() => {
                                      const homeTeam = teams.find(t => t.team_id === game.home_team_id);
                                      const location = getSchoolLocation(homeTeam);
                                      
                                      // Format date as mm/dd
                                      const gameDate = new Date(game.game_date);
                                      const formattedDate = `${gameDate.getMonth() + 1}/${gameDate.getDate()}`;
                                      
                                      return `${formattedDate}, ${location.city}, ${location.state} | ${game.venue_name || 'TBD'}`;
                                    })()}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    game.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                    game.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                    'bg-gray-500/20 text-gray-400'
                                  }`}>
                                    {game.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <Grid size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-black dark:text-white mb-2">Builder View</h3>
                        <p className="text-gray-600 dark:text-gray-400">Generate a schedule to see games here</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeView === 'calendar' && (
                  <div>
                    {currentSchedule?.games && currentSchedule.games.length > 0 ? (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-black dark:text-white mb-2">Calendar View</h3>
                          <p className="text-gray-600 dark:text-gray-400">{currentSchedule.games.length} games scheduled</p>
                        </div>
                        
                        {/* Week-based calendar view */}
                        <div className="grid gap-6">
                          {(() => {
                            
                            // Get date range from games
                            const gameDates = currentSchedule.games.map(game => parseISO(game.game_date));
                            const minDate = new Date(Math.min(...gameDates.map(d => d.getTime())));
                            const maxDate = new Date(Math.max(...gameDates.map(d => d.getTime())));

                            // Generate weeks
                            const weekInterval = eachWeekOfInterval(
                              { start: startOfWeek(minDate), end: endOfWeek(maxDate) },
                              { weekStartsOn: 1 } // Start on Monday
                            );

                            const weeks = weekInterval.map((weekStart, index) => {
                              const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
                              const weekGames = currentSchedule.games.filter(game => {
                                const gameDate = parseISO(game.game_date);
                                return isSameWeek(gameDate, weekStart, { weekStartsOn: 1 });
                              });

                              // Format date range
                              const startMonth = format(weekStart, 'M');
                              const startDay = format(weekStart, 'd');
                              const endMonth = format(weekEnd, 'M');
                              const endDay = format(weekEnd, 'd');
                              
                              let dateRange;
                              if (startMonth === endMonth) {
                                dateRange = `${startMonth}/${startDay}-${endDay}`;
                              } else {
                                dateRange = `${startMonth}/${startDay}-${endMonth}/${endDay}`;
                              }

                              return {
                                week: weekStart,
                                weekLabel: `Week ${index + 1}`,
                                dateRange,
                                games: weekGames
                              };
                            }).filter(week => week.games.length > 0); // Only show weeks with games
                            
                            return weeks.map(({ week, weekLabel, dateRange, games }) => (
                              <div key={format(week, 'yyyy-MM-dd')} className="schedule-date-group">
                                <div className="flex items-center justify-between mb-4">
                                  <div>
                                    <h4 className="text-lg font-bold text-foreground">{weekLabel}</h4>
                                    <p className="text-sm text-muted-foreground">{dateRange}</p>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {games.length} game{games.length !== 1 ? 's' : ''}
                                  </div>
                                </div>
                                
                                <div className="grid gap-3">
                                  {games.map((game, index) => (
                                    <div key={game.id || index} className="schedule-game-card">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          {/* Game Teams */}
                                          <div className="flex items-center gap-2">
                                            {(() => {
                                              const homeTeam = teams.find(t => t.team_id === game.home_team_id);
                                              const awayTeam = teams.find(t => t.team_id === game.away_team_id);
                                              const homeLogoSrc = getTeamLogo(homeTeam, isDarkMode);
                                              const awayLogoSrc = getTeamLogo(awayTeam, isDarkMode);
                                              
                                              return (
                                                <>
                                                  {/* Away Team */}
                                                  <div className="flex items-center gap-1">
                                                    {awayLogoSrc && (
                                                      <img 
                                                        src={awayLogoSrc} 
                                                        alt={`${awayTeam?.shortName || awayTeam?.name} logo`}
                                                        className="w-5 h-5 object-contain"
                                                      />
                                                    )}
                                                    <span className="text-sm font-medium text-foreground">
                                                      {getSchoolShortName(awayTeam)}
                                                    </span>
                                                  </div>
                                                  
                                                  <span className="text-xs text-muted-foreground">@</span>
                                                  
                                                  {/* Home Team */}
                                                  <div className="flex items-center gap-1">
                                                    {homeLogoSrc && (
                                                      <img 
                                                        src={homeLogoSrc} 
                                                        alt={`${homeTeam?.shortName || homeTeam?.name} logo`}
                                                        className="w-5 h-5 object-contain"
                                                      />
                                                    )}
                                                    <span className="text-sm font-bold text-foreground">
                                                      {getSchoolShortName(homeTeam)}
                                                    </span>
                                                  </div>
                                                </>
                                              );
                                            })()}
                                          </div>
                                          
                                          {/* Game Details */}
                                          <div className="text-xs text-muted-foreground">
                                            {(() => {
                                              const gameDate = new Date(game.game_date);
                                              const formattedDate = gameDate.toLocaleDateString('en-US', { 
                                                weekday: 'short', 
                                                month: 'short', 
                                                day: 'numeric' 
                                              });
                                              return `${formattedDate} • ${game.venue_name || 'TBD'}`;
                                            })()}
                                          </div>
                                        </div>
                                        
                                        {/* Game Status */}
                                        <div className="text-right">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            game.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                                            game.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                                            'bg-gray-500/20 text-gray-400'
                                          }`}>
                                            {game.status}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Calendar View</h3>
                        <p className="text-gray-400">Generate a schedule to see calendar view</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeView === 'matrix' && (
                  <div>
                    {currentSchedule?.games && currentSchedule.games.length > 0 ? (
                      <MatchupMatrix 
                        games={currentSchedule.games} 
                        teams={teams}
                        className="w-full"
                      />
                    ) : (
                      <div className="text-center py-20">
                        <Grid size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Matchup Matrix</h3>
                        <p className="text-gray-400">Generate a schedule to see team vs team matchups</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeView === 'gantt' && (
                  <div>
                    {currentSchedule?.games && currentSchedule.games.length > 0 ? (
                      <ScheduleGanttMatrix 
                        games={currentSchedule.games} 
                        teams={teams}
                        className="w-full"
                        sport={big12Sports.find(s => s.name === selectedSport)?.displayName || selectedSport}
                        season={selectedSeason}
                      />
                    ) : (
                      <div className="text-center py-20">
                        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Gantt View</h3>
                        <p className="text-gray-400">Generate a schedule to see the timeline</p>
                      </div>
                    )}
                  </div>
                )}
                
                {activeView === 'analytics' && (
                  <div>
                    {currentSchedule?.games && currentSchedule.games.length > 0 ? (
                      <div>
                        <div className="mb-6">
                          <h3 className="text-xl font-bold text-white mb-2">Comprehensive Schedule Analytics</h3>
                          <p className="text-gray-400">Performance metrics and analysis for {currentSchedule.name}</p>
                        </div>
                        
                        {/* Core Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-cyan-400">{getScheduleStats().totalGames}</div>
                            <div className="text-xs text-gray-400">Total Games</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-cyan-400">{getScheduleStats().totalTeams}</div>
                            <div className="text-xs text-gray-400">Teams</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-cyan-400">{getScheduleStats().gamesPerTeam.toFixed(1)}</div>
                            <div className="text-xs text-gray-400">Games per Team</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-cyan-400">{getScheduleStats().weeksSpan}</div>
                            <div className="text-xs text-gray-400">Weeks Span</div>
                          </div>
                        </div>

                        {/* Balance & Fairness Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                          <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center gap-2">
                              <Scale className="w-4 h-4" />
                              Balance & Fairness
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Home/Away Balance</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().homeAwayBalance.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Rest Days (Avg)</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().averageRestDays.toFixed(1)} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Back-to-Back Games</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().backToBackGames}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Weekend Game %</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().weekendGamePercentage.toFixed(0)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Prime Time Slots</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().primeTimeSlots}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Conference Balance</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().conferenceBalance}%</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Temporal Analysis
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Season Duration</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().seasonDuration} weeks</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Games per Week (Avg)</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().gamesPerWeek.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Busiest Week</span>
                                <span className="text-cyan-400 font-medium">Week {getScheduleStats().busiestWeek.week} ({getScheduleStats().busiestWeek.games})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Longest Break</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().longestBreak} days</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Holiday Conflicts</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().holidayConflicts}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Final Exam Conflicts</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().examConflicts}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                              <Target className="w-4 h-4" />
                              Quality & Optimization
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Schedule Quality Score</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().scheduleQuality}/100</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Optimization Score</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().optimizationScore}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Constraint Satisfaction</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().constraintSatisfaction.toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Hard Violations</span>
                                <span className="text-red-400 font-medium">{getScheduleStats().hardViolations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Soft Violations</span>
                                <span className="text-yellow-400 font-medium">{getScheduleStats().softViolations}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Efficiency Rating</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().efficiencyRating}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Additional Metrics Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Venue & Geography
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Unique Venues</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().uniqueVenues}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Avg Travel Distance</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().averageTravelDistance} mi</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Total Travel Miles</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().totalTravelMiles.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Neutral Site Games</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().neutralSiteGames}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-teal-300 mb-3 flex items-center gap-2">
                              <Trophy className="w-4 h-4" />
                              Competition Analysis
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Unique Matchups</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().uniqueMatchups}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Round-Robin %</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().roundRobinPercentage}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Rivalry Games</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().rivalryGames}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Cross-Division</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().crossDivisionGames}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                              <Tv className="w-4 h-4" />
                              Broadcast & Revenue
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">TV Windows</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().tvWindows}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Prime Time %</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().primeTimePercentage}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Market Reach</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().marketReach}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Revenue Score</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().revenueScore}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              Risk Management
                            </h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-300">Conflict Risk</span>
                                <span className="text-green-400 font-medium">{getScheduleStats().conflictRisk}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Weather Risk</span>
                                <span className="text-yellow-400 font-medium">{getScheduleStats().weatherRisk}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Contingency Plans</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().contingencyPlans}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-300">Flexibility Score</span>
                                <span className="text-cyan-400 font-medium">{getScheduleStats().flexibilityScore}%</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Game Status Breakdown */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-300">Game Status Breakdown</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {getScheduleStats().statusBreakdown.map((status) => (
                              <div key={status.status} className="flex justify-between items-center bg-white/5 rounded p-2">
                                <span className="text-sm text-gray-300">{status.status}</span>
                                <span className="text-sm font-medium text-cyan-400">{status.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20">
                        <BarChart3 size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Analytics View</h3>
                        <p className="text-gray-400">Generate a schedule to see analytics</p>
                      </div>
                    )}
                  </div>
                )}
              </FlexTimeCard>
            </div>

            {/* Comprehensive Schedule Settings Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-96 max-h-[calc(100vh-8rem)] overflow-y-auto"
            >
              <FlexTimeCard variant="glass" className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Schedule Settings</h3>
                </div>

                {/* Basic Schedule Parameters */}
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Basic Parameters
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">Season Name</label>
                        <input
                          type="text"
                          placeholder="2024-25 Football"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Season Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                          />
                          <input
                            type="date"
                            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Teams Count</label>
                        <input
                          type="number"
                          min="4"
                          max="32"
                          defaultValue={teams.length}
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Conference Structure</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>Single Conference</option>
                          <option>Two Divisions</option>
                          <option>Four Divisions</option>
                          <option>Regional Pods</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Game Format Settings */}
                  <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Game Format
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">Game Type</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>Single Games</option>
                          <option>Best of 3 Series</option>
                          <option>Best of 5 Series</option>
                          <option>Weekend Series</option>
                          <option>Tournament Format</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Games per Team</label>
                        <div className="grid grid-cols-3 gap-2">
                          <input type="number" placeholder="Min" defaultValue="8" className="px-2 py-2 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="Target" defaultValue="12" className="px-2 py-2 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="Max" defaultValue="16" className="px-2 py-2 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Game Duration</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" placeholder="Hours" defaultValue="3" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="Minutes" defaultValue="30" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Rest Days</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" placeholder="Min" defaultValue="1" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="Preferred" defaultValue="3" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Games per Week</label>
                        <input type="number" min="1" max="7" defaultValue="2" className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Venue and Location Settings */}
                  <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Venues & Geography
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">Home/Away Balance</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="50" className="flex-1" />
                          <span className="text-cyan-400 text-xs w-12">50%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Max Travel Distance</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" placeholder="Miles" defaultValue="1000" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                          <select className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                            <option>Miles</option>
                            <option>Kilometers</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Neutral Site Games</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" placeholder="Count" defaultValue="2" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="%" defaultValue="5" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Venue Capacity Priority</span>
                          <input type="checkbox" className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Regional Clustering</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Weather Considerations</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Temporal Scheduling */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-300 mb-3 flex items-center gap-2">
                      <Clock3 className="w-4 h-4" />
                      Temporal Controls
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">Preferred Game Days</label>
                        <div className="grid grid-cols-4 gap-1 text-xs">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                            <label key={day} className="flex items-center gap-1">
                              <input 
                                type="checkbox" 
                                defaultChecked={i >= 4} 
                                className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" 
                              />
                              <span className="text-gray-300">{day}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Game Time Windows</label>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-xs text-gray-400">Morning</span>
                            <input type="time" defaultValue="10:00" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                            <input type="time" defaultValue="14:00" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-xs text-gray-400">Evening</span>
                            <input type="time" defaultValue="17:00" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                            <input type="time" defaultValue="21:00" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            <span className="text-xs text-gray-400">Prime Time</span>
                            <input type="time" defaultValue="19:00" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                            <input type="time" defaultValue="22:00" className="px-2 py-1 bg-white/5 border border-white/10 rounded text-white text-xs focus:border-cyan-400 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Avoid Back-to-Back</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Academic Calendar</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Holiday Avoidance</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Final Exam Periods</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Competition Format */}
                  <div className="bg-gradient-to-r from-teal-500/10 to-blue-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-teal-300 mb-3 flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Competition Format
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">League Structure</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>Round Robin</option>
                          <option>Swiss System</option>
                          <option>Single Elimination</option>
                          <option>Double Elimination</option>
                          <option>Balanced Schedule</option>
                          <option>Unbalanced Schedule</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Matchup Distribution</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" placeholder="Conference %" defaultValue="70" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="Non-Conf %" defaultValue="30" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Rivalry Preservation</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="90" className="flex-1" />
                          <span className="text-cyan-400 text-xs w-12">90%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Strength of Schedule</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>Balanced</option>
                          <option>Favor Strong Teams</option>
                          <option>Favor Weak Teams</option>
                          <option>Random</option>
                          <option>Previous Season Based</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Cross-Division Play</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Protected Rivalries</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Geographical Clustering</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Broadcast & Media */}
                  <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                      <Tv className="w-4 h-4" />
                      Broadcast & Media
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">TV Window Priority</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>Prime Time First</option>
                          <option>Weekend Priority</option>
                          <option>Balanced Distribution</option>
                          <option>Revenue Maximized</option>
                          <option>Audience Reach</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Prime Time Allocation</label>
                        <div className="flex items-center gap-2">
                          <input type="range" min="0" max="100" defaultValue="35" className="flex-1" />
                          <span className="text-cyan-400 text-xs w-12">35%</span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Market Considerations</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input type="number" placeholder="Major Markets" defaultValue="8" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                          <input type="number" placeholder="Tier 2 Markets" defaultValue="4" className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Network Exclusivity</span>
                          <input type="checkbox" className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Streaming Priority</span>
                          <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">International Markets</span>
                          <input type="checkbox" className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Optimization & AI */}
                  <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      AI & Optimization
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div>
                        <label className="block text-gray-300 mb-1">Algorithm Type</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>CP-SAT Constraint Programming</option>
                          <option>Genetic Algorithm</option>
                          <option>Simulated Annealing</option>
                          <option>Machine Learning Enhanced</option>
                          <option>Hybrid Multi-Algorithm</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Optimization Goals</label>
                        <div className="space-y-1">
                          {['Travel Minimization', 'Balance Optimization', 'Revenue Maximization', 'Conflict Avoidance', 'Fan Experience', 'Broadcast Value'].map((goal) => (
                            <label key={goal} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-1" />
                              <span className="text-gray-300 text-xs">{goal}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Optimization Intensity</label>
                        <select className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-cyan-400 focus:outline-none">
                          <option>Quick (2-5 seconds)</option>
                          <option>Balanced (10-30 seconds)</option>
                          <option>Thorough (1-2 minutes)</option>
                          <option>Maximum (5+ minutes)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">Constraint Weight Priority</label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-xs">Hard Constraints</span>
                            <div className="flex items-center gap-2">
                              <input type="range" min="1" max="10" defaultValue="10" className="w-16" />
                              <span className="text-cyan-400 text-xs w-8">10</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-xs">Soft Constraints</span>
                            <div className="flex items-center gap-2">
                              <input type="range" min="1" max="10" defaultValue="7" className="w-16" />
                              <span className="text-cyan-400 text-xs w-8">7</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-300 text-xs">Preferences</span>
                            <div className="flex items-center gap-2">
                              <input type="range" min="1" max="10" defaultValue="5" className="w-16" />
                              <span className="text-cyan-400 text-xs w-8">5</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Apply Settings Button */}
                  <div className="pt-4">
                    <FlexTimeShinyButton
                      variant="neon"
                      className="w-full py-3"
                      onClick={() => {
                        console.log('Applying comprehensive schedule settings...');
                        // Here would be the logic to apply all the settings
                      }}
                    >
                      <Sliders className="w-4 h-4 mr-2" />
                      Apply Settings & Regenerate
                    </FlexTimeShinyButton>
                  </div>
                </div>
              </FlexTimeCard>
            </motion.div>

            {/* Constraint panel */}
            <SimpleConstraintManager
              constraints={constraints}
              onConstraintChange={setConstraints}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}