'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Settings, Target, Zap, Play, Pause, RotateCcw,
  ChevronDown, ChevronRight, Plus, X, Check, AlertTriangle, Info,
  MapPin, Users, Trophy, BookOpen, Wifi, Timer, Gauge, BarChart3,
  Filter, Search, Save, Download, Upload, RefreshCw, Eye, EyeOff,
  Command, Type, Hash, Globe
} from 'lucide-react';
import { FlexTimeCard } from '../ui/FlexTimeCard';
import { FlexTimeShinyButton } from '../ui/FlexTimeShinyButton';

// Types for comprehensive scheduling control
interface SchedulingSettings {
  // Basic Settings
  sport: string;
  season: string;
  conference: string;
  startDate: string;
  endDate: string;
  
  // Algorithm & Generation
  algorithm: 'round_robin' | 'partial_round_robin' | 'agent_optimized' | 'genetic' | 'simulated_annealing' | 'constraint_programming' | 'hybrid';
  gameFormat: 'single' | 'series' | 'doubleheader' | 'tournament';
  seriesLength?: number;
  
  // Scheduling Periods
  weekDefinition: 'standard' | 'academic' | 'sport_specific';
  seasonPhases: {
    preseason: { start: string; end: string; enabled: boolean };
    regular: { start: string; end: string; enabled: boolean };
    conference: { start: string; end: string; enabled: boolean };
    postseason: { start: string; end: string; enabled: boolean };
  };
  
  // Game Distribution
  gamesPerWeek: { min: number; max: number; preferred: number };
  gamesPerTeam: { min: number; max: number; target: number };
  homeAwayBalance: { enabled: boolean; tolerance: number };
  conferenceRatio: number; // 0-1, percentage of conference games
  
  // Time & Venue Controls
  gameSlots: {
    weekdays: { enabled: boolean; slots: string[] };
    weekends: { enabled: boolean; slots: string[] };
    holidays: { enabled: boolean; slots: string[] };
  };
  venuePreferences: {
    homePreference: number; // 0-1
    neutralSites: boolean;
    multiVenue: boolean;
  };
  
  // Rest & Travel
  restDays: {
    minimum: number;
    preferred: number;
    homeToAway: number;
    awayToHome: number;
    backToBack: boolean;
  };
  travelOptimization: {
    enabled: boolean;
    maxDistance: number;
    clustering: boolean;
    costWeight: number;
  };
  
  // Academic Integration
  academicCalendar: {
    respectExams: boolean;
    examPeriods: Array<{ start: string; end: string; severity: 'block' | 'discourage' }>;
    holidays: Array<{ date: string; severity: 'block' | 'discourage' }>;
    classSchedule: boolean;
  };
  
  // Broadcasting & Media
  broadcasting: {
    tvWindows: Array<{ day: string; time: string; priority: number }>;
    blackoutPeriods: Array<{ start: string; end: string; reason: string }>;
    primetime: { enabled: boolean; slots: string[] };
    streaming: { platforms: string[]; requirements: string[] };
  };
  
  // Special Events & Rivalries
  specialEvents: {
    rivalryGames: Array<{ teams: [number, number]; date?: string; priority: number }>;
    marqueeMatchups: Array<{ teams: [number, number]; timeSlot?: string; venue?: string }>;
    homecoming: Array<{ team: number; date?: string; opponent?: number }>;
    seniorNight: Array<{ team: number; date?: string }>;
  };
  
  // Weather & Environment
  weather: {
    considerWeather: boolean;
    indoorPreference: boolean;
    seasonalAdjustments: boolean;
    regions: Array<{ teams: number[]; restrictions: string[] }>;
  };
}

interface ConstraintDefinition {
  id: string;
  name: string;
  description: string;
  type: 'hard' | 'soft';
  category: 'time' | 'venue' | 'travel' | 'academic' | 'broadcast' | 'rivalry' | 'rest' | 'balance' | 'custom';
  sport: string;
  priority: number;
  weight: number;
  active: boolean;
  parameters: Record<string, any>;
  formula?: string;
  violation_penalty: number;
  auto_fixable: boolean;
  created_by: 'system' | 'user';
  command?: string; // For plain text constraint definition
}

interface ScheduleMetrics {
  generation: {
    total_games: number;
    games_per_team: { min: number; max: number; avg: number };
    home_away_balance: number;
    conference_games: number;
    non_conference_games: number;
  };
  
  time_distribution: {
    weekday_games: number;
    weekend_games: number;
    primetime_games: number;
    time_slots: Record<string, number>;
  };
  
  travel: {
    total_miles: number;
    avg_miles_per_team: number;
    max_single_trip: number;
    travel_cost_estimate: number;
  };
  
  rest_patterns: {
    avg_rest_days: number;
    min_rest_days: number;
    back_to_back_games: number;
    extended_breaks: number;
  };
  
  venue_utilization: {
    home_games_per_venue: Record<string, number>;
    utilization_rate: number;
    venue_conflicts: number;
  };
  
  constraints: {
    hard_violations: number;
    soft_violations: number;
    total_penalty_score: number;
    satisfaction_rate: number;
  };
  
  quality_scores: {
    overall_score: number;
    balance_score: number;
    efficiency_score: number;
    fan_experience_score: number;
    broadcast_value_score: number;
  };
}

// Sport-specific constraint templates
const SPORT_CONSTRAINT_TEMPLATES = {
  football: [
    'Teams must have at least 6 days rest between games',
    'No team can play more than 2 away games in a row',
    'Rivalry games must be played in the final 3 weeks',
    'No games during exam week in December',
    'Conference championship game on first Saturday in December',
    'Homecoming games must be on Saturdays',
    'No Thursday games for teams traveling more than 500 miles',
    'Senior night must be the final home game'
  ],
  basketball: [
    'Teams must have at least 1 day rest between games',
    'No team can play more than 3 games in 7 days',
    'Conference tournament starts on Wednesday',
    'No games during final exam periods',
    'Double-headers allowed on weekends',
    'Rivalry games should be evenly distributed',
    'TV games have priority time slots',
    'No back-to-back road games exceeding 1000 miles'
  ],
  baseball: [
    'Series must be 3 games over consecutive days',
    'Teams need 1 day between series',
    'No games during inclement weather periods',
    'Conference tournament is 5 days',
    'Doubleheaders allowed on Saturdays',
    'No games during spring break',
    'Senior day on final home series',
    'Regional weather patterns affect scheduling'
  ]
};

export const ComprehensiveSchedulerControl: React.FC = () => {
  const [settings, setSettings] = useState<SchedulingSettings>({
    // Initialize with defaults
    sport: 'football',
    season: '2024-25',
    conference: 'Big 12',
    startDate: '2024-08-31',
    endDate: '2024-12-07',
    algorithm: 'agent_optimized',
    gameFormat: 'single',
    weekDefinition: 'standard',
    seasonPhases: {
      preseason: { start: '2024-08-31', end: '2024-09-07', enabled: false },
      regular: { start: '2024-09-07', end: '2024-11-30', enabled: true },
      conference: { start: '2024-11-30', end: '2024-12-07', enabled: true },
      postseason: { start: '2024-12-07', end: '2024-12-31', enabled: false }
    },
    gamesPerWeek: { min: 1, max: 2, preferred: 1 },
    gamesPerTeam: { min: 8, max: 12, target: 9 },
    homeAwayBalance: { enabled: true, tolerance: 0.1 },
    conferenceRatio: 0.67,
    gameSlots: {
      weekdays: { enabled: false, slots: [] },
      weekends: { enabled: true, slots: ['12:00', '15:30', '19:00'] },
      holidays: { enabled: false, slots: [] }
    },
    venuePreferences: {
      homePreference: 0.5,
      neutralSites: false,
      multiVenue: false
    },
    restDays: {
      minimum: 6,
      preferred: 7,
      homeToAway: 6,
      awayToHome: 6,
      backToBack: false
    },
    travelOptimization: {
      enabled: true,
      maxDistance: 1500,
      clustering: true,
      costWeight: 0.3
    },
    academicCalendar: {
      respectExams: true,
      examPeriods: [
        { start: '2024-12-09', end: '2024-12-16', severity: 'block' }
      ],
      holidays: [
        { date: '2024-11-28', severity: 'block' }, // Thanksgiving
        { date: '2024-11-29', severity: 'discourage' }
      ],
      classSchedule: true
    },
    broadcasting: {
      tvWindows: [
        { day: 'Saturday', time: '12:00', priority: 1 },
        { day: 'Saturday', time: '15:30', priority: 1 },
        { day: 'Saturday', time: '19:00', priority: 2 }
      ],
      blackoutPeriods: [],
      primetime: { enabled: true, slots: ['19:00', '20:00'] },
      streaming: { platforms: ['ESPN+', 'Fox Sports'], requirements: [] }
    },
    specialEvents: {
      rivalryGames: [],
      marqueeMatchups: [],
      homecoming: [],
      seniorNight: []
    },
    weather: {
      considerWeather: true,
      indoorPreference: false,
      seasonalAdjustments: true,
      regions: []
    }
  });

  const [constraints, setConstraints] = useState<ConstraintDefinition[]>([]);
  const [metrics, setMetrics] = useState<ScheduleMetrics | null>(null);
  const [activeSection, setActiveSection] = useState<string>('basic');
  const [constraintPanel, setConstraintPanel] = useState(true);
  const [newConstraintText, setNewConstraintText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchConstraints, setSearchConstraints] = useState('');

  // Load sport-specific constraints when sport changes
  useEffect(() => {
    const sportTemplates = SPORT_CONSTRAINT_TEMPLATES[settings.sport as keyof typeof SPORT_CONSTRAINT_TEMPLATES] || [];
    const sportConstraints: ConstraintDefinition[] = sportTemplates.map((template, index) => ({
      id: `${settings.sport}_${index}`,
      name: template,
      description: template,
      type: 'hard',
      category: 'custom',
      sport: settings.sport,
      priority: 1,
      weight: 1.0,
      active: true,
      parameters: {},
      violation_penalty: 100,
      auto_fixable: false,
      created_by: 'system',
      command: template
    }));
    setConstraints(sportConstraints);
  }, [settings.sport]);

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const addConstraint = () => {
    if (!newConstraintText.trim()) return;
    
    const newConstraint: ConstraintDefinition = {
      id: `custom_${Date.now()}`,
      name: newConstraintText,
      description: newConstraintText,
      type: 'soft',
      category: 'custom',
      sport: settings.sport,
      priority: 2,
      weight: 0.8,
      active: true,
      parameters: {},
      violation_penalty: 50,
      auto_fixable: false,
      created_by: 'user',
      command: newConstraintText
    };
    
    setConstraints(prev => [...prev, newConstraint]);
    setNewConstraintText('');
  };

  const toggleConstraint = (id: string) => {
    setConstraints(prev => prev.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ));
  };

  const removeConstraint = (id: string) => {
    setConstraints(prev => prev.filter(c => c.id !== id));
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    // Simulate schedule generation
    setTimeout(() => {
      setMetrics({
        generation: {
          total_games: 144,
          games_per_team: { min: 8, max: 10, avg: 9 },
          home_away_balance: 0.95,
          conference_games: 96,
          non_conference_games: 48
        },
        time_distribution: {
          weekday_games: 24,
          weekend_games: 120,
          primetime_games: 36,
          time_slots: { '12:00': 48, '15:30': 60, '19:00': 36 }
        },
        travel: {
          total_miles: 125000,
          avg_miles_per_team: 7812,
          max_single_trip: 1200,
          travel_cost_estimate: 450000
        },
        rest_patterns: {
          avg_rest_days: 7.2,
          min_rest_days: 6,
          back_to_back_games: 0,
          extended_breaks: 8
        },
        venue_utilization: {
          home_games_per_venue: {},
          utilization_rate: 0.87,
          venue_conflicts: 0
        },
        constraints: {
          hard_violations: 0,
          soft_violations: 3,
          total_penalty_score: 150,
          satisfaction_rate: 0.96
        },
        quality_scores: {
          overall_score: 94,
          balance_score: 92,
          efficiency_score: 96,
          fan_experience_score: 91,
          broadcast_value_score: 88
        }
      });
      setIsGenerating(false);
    }, 3000);
  };

  const sections = [
    { id: 'basic', name: 'Basic Settings', icon: Settings },
    { id: 'algorithm', name: 'Algorithm & Generation', icon: Zap },
    { id: 'periods', name: 'Time Periods', icon: Calendar },
    { id: 'distribution', name: 'Game Distribution', icon: BarChart3 },
    { id: 'venues', name: 'Venues & Travel', icon: MapPin },
    { id: 'academic', name: 'Academic Calendar', icon: BookOpen },
    { id: 'broadcast', name: 'Broadcasting', icon: Wifi },
    { id: 'special', name: 'Special Events', icon: Trophy },
    { id: 'weather', name: 'Weather & Environment', icon: Globe }
  ];

  const filteredConstraints = constraints.filter(c => 
    c.name.toLowerCase().includes(searchConstraints.toLowerCase()) ||
    c.category.toLowerCase().includes(searchConstraints.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
      {/* Main Control Panel */}
      <div className="xl:col-span-3 space-y-6">
        {/* Header */}
        <FlexTimeCard variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Comprehensive Scheduler Control</h1>
              <p className="text-gray-400">Complete control over every aspect of schedule generation</p>
            </div>
            <div className="flex items-center gap-3">
              <FlexTimeShinyButton
                variant="secondary"
                onClick={() => setConstraintPanel(!constraintPanel)}
                className="px-4 py-2"
              >
                {constraintPanel ? <EyeOff size={16} /> : <Eye size={16} />}
                Constraints
              </FlexTimeShinyButton>
              <FlexTimeShinyButton
                variant="neon"
                onClick={generateSchedule}
                disabled={isGenerating}
                className="px-6 py-2"
              >
                {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                Generate Schedule
              </FlexTimeShinyButton>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="flex flex-wrap gap-2 mb-6">
            {sections.map(({ id, name, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeSection === id
                    ? 'bg-[color:var(--ft-neon)]/20 text-[color:var(--ft-neon)] border border-[color:var(--ft-neon)]/30'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Icon size={16} />
                {name}
              </button>
            ))}
          </div>

          {/* Settings Sections */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeSection === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Sport</label>
                      <select
                        value={settings.sport}
                        onChange={(e) => updateSetting('sport', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="football">Football</option>
                        <option value="basketball">Basketball</option>
                        <option value="baseball">Baseball</option>
                        <option value="softball">Softball</option>
                        <option value="soccer">Soccer</option>
                        <option value="volleyball">Volleyball</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Season</label>
                      <select
                        value={settings.season}
                        onChange={(e) => updateSetting('season', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="2024-25">2024-25</option>
                        <option value="2025-26">2025-26</option>
                        <option value="2026-27">2026-27</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Conference</label>
                      <select
                        value={settings.conference}
                        onChange={(e) => updateSetting('conference', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="Big 12">Big 12</option>
                        <option value="SEC">SEC</option>
                        <option value="Big Ten">Big Ten</option>
                        <option value="ACC">ACC</option>
                        <option value="Pac-12">Pac-12</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Season Start Date</label>
                      <input
                        type="date"
                        value={settings.startDate}
                        onChange={(e) => updateSetting('startDate', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Season End Date</label>
                      <input
                        type="date"
                        value={settings.endDate}
                        onChange={(e) => updateSetting('endDate', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'algorithm' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Scheduling Algorithm</label>
                    <select
                      value={settings.algorithm}
                      onChange={(e) => updateSetting('algorithm', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="round_robin">Round Robin</option>
                      <option value="partial_round_robin">Partial Round Robin</option>
                      <option value="agent_optimized">AI Agent Optimized</option>
                      <option value="genetic">Genetic Algorithm</option>
                      <option value="simulated_annealing">Simulated Annealing</option>
                      <option value="constraint_programming">Constraint Programming</option>
                      <option value="hybrid">Hybrid Approach</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Game Format</label>
                      <select
                        value={settings.gameFormat}
                        onChange={(e) => updateSetting('gameFormat', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="single">Single Games</option>
                        <option value="series">Series</option>
                        <option value="doubleheader">Doubleheaders</option>
                        <option value="tournament">Tournament Style</option>
                      </select>
                    </div>
                    {settings.gameFormat === 'series' && (
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Series Length</label>
                        <input
                          type="number"
                          min="2"
                          max="5"
                          value={settings.seriesLength || 3}
                          onChange={(e) => updateSetting('seriesLength', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeSection === 'periods' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Week Definition</label>
                    <select
                      value={settings.weekDefinition}
                      onChange={(e) => updateSetting('weekDefinition', e.target.value)}
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="standard">Standard Week (Mon-Sun)</option>
                      <option value="academic">Academic Week (Sun-Sat)</option>
                      <option value="sport_specific">Sport-Specific Week</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">Season Phases</h4>
                    {Object.entries(settings.seasonPhases).map(([phase, config]) => (
                      <div key={phase} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-white capitalize">{phase} Season</label>
                          <input
                            type="checkbox"
                            checked={config.enabled}
                            onChange={(e) => updateSetting(`seasonPhases.${phase}.enabled`, e.target.checked)}
                            className="rounded"
                          />
                        </div>
                        {config.enabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                              <input
                                type="date"
                                value={config.start}
                                onChange={(e) => updateSetting(`seasonPhases.${phase}.start`, e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">End Date</label>
                              <input
                                type="date"
                                value={config.end}
                                onChange={(e) => updateSetting(`seasonPhases.${phase}.end`, e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === 'distribution' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Games Per Week</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="0"
                          max="7"
                          value={settings.gamesPerWeek.min}
                          onChange={(e) => updateSetting('gamesPerWeek.min', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Preferred</label>
                        <input
                          type="number"
                          min="0"
                          max="7"
                          value={settings.gamesPerWeek.preferred}
                          onChange={(e) => updateSetting('gamesPerWeek.preferred', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="0"
                          max="7"
                          value={settings.gamesPerWeek.max}
                          onChange={(e) => updateSetting('gamesPerWeek.max', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Games Per Team</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Minimum</label>
                        <input
                          type="number"
                          min="1"
                          value={settings.gamesPerTeam.min}
                          onChange={(e) => updateSetting('gamesPerTeam.min', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Target</label>
                        <input
                          type="number"
                          min="1"
                          value={settings.gamesPerTeam.target}
                          onChange={(e) => updateSetting('gamesPerTeam.target', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Maximum</label>
                        <input
                          type="number"
                          min="1"
                          value={settings.gamesPerTeam.max}
                          onChange={(e) => updateSetting('gamesPerTeam.max', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium text-white">Home/Away Balance</label>
                      <input
                        type="checkbox"
                        checked={settings.homeAwayBalance.enabled}
                        onChange={(e) => updateSetting('homeAwayBalance.enabled', e.target.checked)}
                        className="rounded"
                      />
                    </div>
                    {settings.homeAwayBalance.enabled && (
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Tolerance (0.0 = perfect, 0.2 = 20% variance)</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.homeAwayBalance.tolerance}
                          onChange={(e) => updateSetting('homeAwayBalance.tolerance', parseFloat(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Conference Game Ratio</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.conferenceRatio}
                      onChange={(e) => updateSetting('conferenceRatio', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>All Non-Conference</span>
                      <span>{Math.round(settings.conferenceRatio * 100)}% Conference</span>
                      <span>All Conference</span>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'venues' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Venue Preferences</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Home Game Preference</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.venuePreferences.homePreference}
                          onChange={(e) => updateSetting('venuePreferences.homePreference', parseFloat(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>Away Heavy</span>
                          <span>{Math.round(settings.venuePreferences.homePreference * 100)}% Home</span>
                          <span>Home Heavy</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">Allow Neutral Sites</label>
                        <input
                          type="checkbox"
                          checked={settings.venuePreferences.neutralSites}
                          onChange={(e) => updateSetting('venuePreferences.neutralSites', e.target.checked)}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">Multi-Venue Games</label>
                        <input
                          type="checkbox"
                          checked={settings.venuePreferences.multiVenue}
                          onChange={(e) => updateSetting('venuePreferences.multiVenue', e.target.checked)}
                          className="rounded"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Travel Optimization</h4>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-medium text-white">Enable Travel Optimization</label>
                      <input
                        type="checkbox"
                        checked={settings.travelOptimization.enabled}
                        onChange={(e) => updateSetting('travelOptimization.enabled', e.target.checked)}
                        className="rounded"
                      />
                    </div>

                    {settings.travelOptimization.enabled && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Maximum Travel Distance (miles)</label>
                          <input
                            type="number"
                            min="0"
                            value={settings.travelOptimization.maxDistance}
                            onChange={(e) => updateSetting('travelOptimization.maxDistance', parseInt(e.target.value))}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium text-white">Geographic Clustering</label>
                          <input
                            type="checkbox"
                            checked={settings.travelOptimization.clustering}
                            onChange={(e) => updateSetting('travelOptimization.clustering', e.target.checked)}
                            className="rounded"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Travel Cost Weight</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={settings.travelOptimization.costWeight}
                            onChange={(e) => updateSetting('travelOptimization.costWeight', parseFloat(e.target.value))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Ignore Cost</span>
                            <span>{Math.round(settings.travelOptimization.costWeight * 100)}% Weight</span>
                            <span>Minimize Cost</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Rest Days</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Minimum Rest Days</label>
                        <input
                          type="number"
                          min="0"
                          max="14"
                          value={settings.restDays.minimum}
                          onChange={(e) => updateSetting('restDays.minimum', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Preferred Rest Days</label>
                        <input
                          type="number"
                          min="0"
                          max="14"
                          value={settings.restDays.preferred}
                          onChange={(e) => updateSetting('restDays.preferred', parseInt(e.target.value))}
                          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <label className="text-sm font-medium text-white">Allow Back-to-Back Games</label>
                      <input
                        type="checkbox"
                        checked={settings.restDays.backToBack}
                        onChange={(e) => updateSetting('restDays.backToBack', e.target.checked)}
                        className="rounded"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'academic' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-medium text-white">Respect Academic Calendar</label>
                    <input
                      type="checkbox"
                      checked={settings.academicCalendar.respectExams}
                      onChange={(e) => updateSetting('academicCalendar.respectExams', e.target.checked)}
                      className="rounded"
                    />
                  </div>

                  {settings.academicCalendar.respectExams && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Exam Periods</h4>
                        {settings.academicCalendar.examPeriods.map((period, index) => (
                          <div key={index} className="bg-white/5 rounded-lg p-3 mb-2">
                            <div className="grid grid-cols-2 gap-3 mb-2">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                                <input
                                  type="date"
                                  value={period.start}
                                  onChange={(e) => {
                                    const newPeriods = [...settings.academicCalendar.examPeriods];
                                    newPeriods[index] = { ...period, start: e.target.value };
                                    updateSetting('academicCalendar.examPeriods', newPeriods);
                                  }}
                                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">End Date</label>
                                <input
                                  type="date"
                                  value={period.end}
                                  onChange={(e) => {
                                    const newPeriods = [...settings.academicCalendar.examPeriods];
                                    newPeriods[index] = { ...period, end: e.target.value };
                                    updateSetting('academicCalendar.examPeriods', newPeriods);
                                  }}
                                  className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                                />
                              </div>
                            </div>
                            <select
                              value={period.severity}
                              onChange={(e) => {
                                const newPeriods = [...settings.academicCalendar.examPeriods];
                                newPeriods[index] = { ...period, severity: e.target.value as 'block' | 'discourage' };
                                updateSetting('academicCalendar.examPeriods', newPeriods);
                              }}
                              className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                            >
                              <option value="block">Block Games</option>
                              <option value="discourage">Discourage Games</option>
                            </select>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newPeriods = [...settings.academicCalendar.examPeriods, 
                              { start: '', end: '', severity: 'block' as const }
                            ];
                            updateSetting('academicCalendar.examPeriods', newPeriods);
                          }}
                          className="text-[color:var(--ft-neon)] text-sm flex items-center gap-1"
                        >
                          <Plus size={14} /> Add Exam Period
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'broadcast' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">TV Windows</h4>
                    {settings.broadcasting.tvWindows.map((window, index) => (
                      <div key={index} className="bg-white/5 rounded-lg p-3 mb-2 grid grid-cols-3 gap-3">
                        <select
                          value={window.day}
                          onChange={(e) => {
                            const newWindows = [...settings.broadcasting.tvWindows];
                            newWindows[index] = { ...window, day: e.target.value };
                            updateSetting('broadcasting.tvWindows', newWindows);
                          }}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        >
                          <option value="Monday">Monday</option>
                          <option value="Tuesday">Tuesday</option>
                          <option value="Wednesday">Wednesday</option>
                          <option value="Thursday">Thursday</option>
                          <option value="Friday">Friday</option>
                          <option value="Saturday">Saturday</option>
                          <option value="Sunday">Sunday</option>
                        </select>
                        <input
                          type="time"
                          value={window.time}
                          onChange={(e) => {
                            const newWindows = [...settings.broadcasting.tvWindows];
                            newWindows[index] = { ...window, time: e.target.value };
                            updateSetting('broadcasting.tvWindows', newWindows);
                          }}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                        />
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={window.priority}
                          onChange={(e) => {
                            const newWindows = [...settings.broadcasting.tvWindows];
                            newWindows[index] = { ...window, priority: parseInt(e.target.value) };
                            updateSetting('broadcasting.tvWindows', newWindows);
                          }}
                          className="bg-white/10 border border-white/20 rounded px-2 py-1 text-white text-sm"
                          placeholder="Priority"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-white">Enable Primetime Slots</label>
                    <input
                      type="checkbox"
                      checked={settings.broadcasting.primetime.enabled}
                      onChange={(e) => updateSetting('broadcasting.primetime.enabled', e.target.checked)}
                      className="rounded"
                    />
                  </div>
                </div>
              )}

              {activeSection === 'special' && (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Rivalry Games</h4>
                    <p className="text-sm text-gray-400 mb-2">Configure rivalry matchups with special scheduling preferences</p>
                    <button className="text-[color:var(--ft-neon)] text-sm flex items-center gap-1">
                      <Plus size={14} /> Add Rivalry Game
                    </button>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Marquee Matchups</h4>
                    <p className="text-sm text-gray-400 mb-2">High-profile games for premium time slots</p>
                    <button className="text-[color:var(--ft-neon)] text-sm flex items-center gap-1">
                      <Plus size={14} /> Add Marquee Matchup
                    </button>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-white mb-4">Special Events</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-white">Homecoming Games</span>
                        <button className="text-[color:var(--ft-neon)] text-sm">Configure</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white">Senior Night</span>
                        <button className="text-[color:var(--ft-neon)] text-sm">Configure</button>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white">Conference Championships</span>
                        <button className="text-[color:var(--ft-neon)] text-sm">Configure</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'weather' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <label className="text-lg font-medium text-white">Consider Weather Patterns</label>
                    <input
                      type="checkbox"
                      checked={settings.weather.considerWeather}
                      onChange={(e) => updateSetting('weather.considerWeather', e.target.checked)}
                      className="rounded"
                    />
                  </div>

                  {settings.weather.considerWeather && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">Prefer Indoor Venues</label>
                        <input
                          type="checkbox"
                          checked={settings.weather.indoorPreference}
                          onChange={(e) => updateSetting('weather.indoorPreference', e.target.checked)}
                          className="rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white">Seasonal Adjustments</label>
                        <input
                          type="checkbox"
                          checked={settings.weather.seasonalAdjustments}
                          onChange={(e) => updateSetting('weather.seasonalAdjustments', e.target.checked)}
                          className="rounded"
                        />
                      </div>

                      <div>
                        <h4 className="text-sm font-medium text-white mb-2">Regional Weather Restrictions</h4>
                        <p className="text-xs text-gray-400 mb-2">Configure weather-based scheduling restrictions by region</p>
                        <button className="text-[color:var(--ft-neon)] text-sm flex items-center gap-1">
                          <Plus size={14} /> Add Weather Region
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </FlexTimeCard>

        {/* Metrics Dashboard */}
        {metrics && (
          <FlexTimeCard variant="glass" className="p-6">
            <h3 className="text-xl font-bold text-white mb-4">Schedule Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{metrics.generation.total_games}</div>
                <div className="text-sm text-gray-400">Total Games</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{metrics.quality_scores.overall_score}%</div>
                <div className="text-sm text-gray-400">Overall Score</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{metrics.constraints.hard_violations}</div>
                <div className="text-sm text-gray-400">Hard Violations</div>
              </div>
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{metrics.constraints.soft_violations}</div>
                <div className="text-sm text-gray-400">Soft Violations</div>
              </div>
            </div>
          </FlexTimeCard>
        )}
      </div>

      {/* Constraint Panel */}
      <AnimatePresence>
        {constraintPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="space-y-4"
          >
            <FlexTimeCard variant="glass" className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Scheduling Constraints</h3>
                <span className="text-sm text-gray-400">{constraints.filter(c => c.active).length} active</span>
              </div>

              {/* Search Constraints */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search constraints..."
                  value={searchConstraints}
                  onChange={(e) => setSearchConstraints(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-3 py-2 text-white placeholder-gray-400"
                />
              </div>

              {/* Add New Constraint */}
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <Command className="w-4 h-4 text-[color:var(--ft-neon)] mt-0.5" />
                  <span className="text-sm text-[color:var(--ft-neon)] font-medium">Add Constraint</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., 'No games during exam week' or 'Teams need 2 days rest'"
                    value={newConstraintText}
                    onChange={(e) => setNewConstraintText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addConstraint()}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 text-sm"
                  />
                  <button
                    onClick={addConstraint}
                    className="bg-[color:var(--ft-neon)]/20 border border-[color:var(--ft-neon)]/30 text-[color:var(--ft-neon)] rounded-lg px-3 py-2 hover:bg-[color:var(--ft-neon)]/30 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {/* Constraint List */}
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredConstraints.map((constraint) => (
                  <motion.div
                    key={constraint.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 rounded-lg border transition-all ${
                      constraint.active
                        ? 'bg-white/10 border-white/20'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleConstraint(constraint.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                            constraint.active
                              ? 'bg-[color:var(--ft-neon)] border-[color:var(--ft-neon)]'
                              : 'border-gray-400'
                          }`}
                        >
                          {constraint.active && <Check size={12} className="text-black" />}
                        </button>
                        <span className={`text-sm font-medium ${
                          constraint.type === 'hard' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {constraint.type.toUpperCase()}
                        </span>
                        <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-300">
                          {constraint.category}
                        </span>
                      </div>
                      {constraint.created_by === 'user' && (
                        <button
                          onClick={() => removeConstraint(constraint.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-white mb-2">{constraint.name}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Weight: {constraint.weight}</span>
                      <span>Priority: {constraint.priority}</span>
                      {constraint.violation_penalty > 0 && (
                        <span>Penalty: {constraint.violation_penalty}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </FlexTimeCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};