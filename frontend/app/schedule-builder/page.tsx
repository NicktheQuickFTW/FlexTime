'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  X
} from 'lucide-react';

// Import FlexTime components
import { FlexTimeCard } from '../../src/components/ui/FlexTimeCard';
import { FlexTimeShinyButton } from '../../src/components/ui/FlexTimeShinyButton';
import FTIcon from '../../src/components/ui/FTIcon';
import FTLogo from '../../src/components/ui/FTLogo';
import { 
  ConstraintPanel,
  type ConstraintViolation as ConstraintPanelViolation,
  type Constraint as ConstraintPanelConstraint
} from '../../src/components/builder/ConstraintPanel';
import { ScheduleGanttMatrix } from '../../src/components/scheduler/ScheduleGanttMatrix';
import { MatchupMatrix } from '../../src/components/scheduler/MatchupMatrix';

// Import the real API
import { 
  scheduleApi, 
  type Schedule, 
  type Team, 
  type Constraint, 
  type ScheduleGenerationOptions 
} from '../../src/utils/scheduleApi';

// Additional types for UI state
interface UIState {
  loading: boolean;
  optimizing: boolean;
  saving: boolean;
  error: string | null;
}

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
  const [constraints, setConstraints] = useState<ConstraintPanelConstraint[]>([]);
  const [violations, setViolations] = useState<ConstraintPanelViolation[]>([]);
  const [ui, setUi] = useState<UIState>({
    loading: false,
    optimizing: false,
    saving: false,
    error: null
  });
  const [showConstraints, setShowConstraints] = useState(true);

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
      
      // Transform the API constraints to match ConstraintPanel expectations
      const adaptedConstraints: ConstraintPanelConstraint[] = constraintsData.map(constraint => ({
        id: constraint.id,
        name: constraint.name,
        type: constraint.type as 'hard' | 'soft',
        // Map string category to expected union type
        category: (constraint.category as 'travel' | 'rest' | 'venue' | 'broadcast' | 'academic' | 'competitive'),
        description: constraint.description,
        weight: constraint.weight,
        active: constraint.active,
        sportSpecific: constraint.sport_specific
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
      
      // Transform the API response to match the ConstraintPanel component expectations
      const adaptedViolations: ConstraintPanelViolation[] = violationsData.map(violation => {
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
                            <div key={game.id || index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                              <div className="flex justify-between items-center">
                                <div className="flex-1">
                                  <div className="text-black dark:text-white font-medium">
                                    {teams.find(t => t.team_id === game.home_team_id)?.name || `Team ${game.home_team_id}`}
                                    <span className="text-gray-600 dark:text-gray-400 mx-2">vs</span>
                                    {teams.find(t => t.team_id === game.away_team_id)?.name || `Team ${game.away_team_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {game.game_date} at {game.game_time} • {game.venue_name}
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
                        
                        {/* Simple calendar-style view */}
                        <div className="grid gap-4">
                          {(() => {
                            const groupedGames = currentSchedule.games.reduce((acc, game) => {
                              const date = game.game_date;
                              if (!acc[date]) acc[date] = [];
                              acc[date].push(game);
                              return acc;
                            }, {} as Record<string, any[]>);
                            
                            return Object.entries(groupedGames).map(([date, games]) => (
                              <div key={date} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="font-medium text-white mb-2">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                <div className="space-y-2">
                                  {games.map((game, index) => (
                                    <div key={game.id || index} className="text-sm text-gray-300">
                                      {game.game_time} - {teams.find(t => t.team_id === game.home_team_id)?.name || `Team ${game.home_team_id}`} vs {teams.find(t => t.team_id === game.away_team_id)?.name || `Team ${game.away_team_id}`}
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
                          <h3 className="text-xl font-bold text-white mb-2">Schedule Analytics</h3>
                          <p className="text-gray-400">Performance metrics and analysis for {currentSchedule.name}</p>
                        </div>
                        
                        {/* Basic metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{currentSchedule.games.length}</div>
                            <div className="text-sm text-gray-400">Total Games</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{teams.length}</div>
                            <div className="text-sm text-gray-400">Teams</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-2xl font-bold text-[color:var(--ft-neon)]">
                              {Math.round((currentSchedule.games.length / teams.length) * 10) / 10}
                            </div>
                            <div className="text-sm text-gray-400">Games per Team</div>
                          </div>
                          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="text-2xl font-bold text-[color:var(--ft-neon)]">
                              {(() => {
                                const dateRange = currentSchedule.games.reduce((acc, game) => {
                                  const date = new Date(game.game_date);
                                  if (!acc.start || date < acc.start) acc.start = date;
                                  if (!acc.end || date > acc.end) acc.end = date;
                                  return acc;
                                }, {} as {start?: Date, end?: Date});
                                
                                if (dateRange.start && dateRange.end) {
                                  const diffTime = Math.abs(dateRange.end.getTime() - dateRange.start.getTime());
                                  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
                                }
                                return 0;
                              })()}
                            </div>
                            <div className="text-sm text-gray-400">Weeks Span</div>
                          </div>
                        </div>
                        
                        {/* Game status breakdown */}
                        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h4 className="text-lg font-medium text-white mb-4">Game Status Breakdown</h4>
                          <div className="space-y-2">
                            {(() => {
                              const statusCounts = currentSchedule.games.reduce((acc, game) => {
                                acc[game.status] = (acc[game.status] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>);
                              
                              return Object.entries(statusCounts).map(([status, count]) => (
                                <div key={status} className="flex justify-between items-center">
                                  <span className="text-gray-300 capitalize">{status}</span>
                                  <span className="text-white font-medium">{count} games</span>
                                </div>
                              ));
                            })()}
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

            {/* Constraint panel */}
            <ConstraintPanel
              violations={violations}
              constraints={constraints}
              visible={showConstraints}
              onVisibilityChange={setShowConstraints}
              onConstraintUpdate={handleConstraintUpdate}
              onAutoFix={handleAutoFix}
              sport={selectedSport}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}