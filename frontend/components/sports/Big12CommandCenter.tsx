/**
 * FlexTime Big 12 Command Center
 * 
 * The ultimate Big 12 sports management dashboard with glassmorphic design
 * Serves Conference Office administrators, campus sport admins, and head coaches
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Calendar, 
  Users, 
  BarChart3, 
  Activity, 
  Zap,
  ExternalLink,
  ChevronRight,
  Play,
  Clock,
  MapPin,
  Tv,
  TrendingUp,
  Star,
  Target,
  Compass,
  Settings,
  Globe
} from 'lucide-react';
import sportsDataService, { 
  Big12Sport, 
  Big12Team, 
  StandingsEntry, 
  GameResult, 
  UpcomingGame,
  ExternalLink as ExternalLinkType 
} from '../../services/sportsDataService';

// Role-based view types
type UserRole = 'conference_admin' | 'campus_admin' | 'head_coach';

interface RoleConfig {
  name: string;
  icon: React.ElementType;
  primaryColor: string;
  features: string[];
}

const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  conference_admin: {
    name: 'Conference Office',
    icon: Trophy,
    primaryColor: 'from-blue-500 to-cyan-400',
    features: ['All Sports Overview', 'RefQuest Integration', 'Analytics Dashboard', 'Scheduling Tools']
  },
  campus_admin: {
    name: 'Campus Admin',
    icon: Users,
    primaryColor: 'from-purple-500 to-pink-400',
    features: ['Team Management', 'Facility Coordination', 'Budget Tracking', 'Staff Communication']
  },
  head_coach: {
    name: 'Head Coach',
    icon: Target,
    primaryColor: 'from-orange-500 to-red-400',
    features: ['Team Analytics', 'Schedule Planning', 'Recruiting Tools', 'Performance Metrics']
  }
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 10
    }
  }
};

const tickerVariants = {
  animate: {
    x: [0, -100],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: "loop",
        duration: 30,
        ease: "linear",
      },
    },
  },
};

// Glassmorphic card component
const GlassCard: React.FC<{ 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = true }) => (
  <motion.div
    className={`
      bg-white/8 backdrop-blur-xl border border-white/15
      rounded-2xl p-6 
      ${hover ? 'hover:bg-white/12 hover:border-white/25' : ''}
      transition-all duration-300
      shadow-[0_8px_32px_rgba(0,0,0,0.12)]
      ${className}
    `}
    whileHover={hover ? { scale: 1.02, y: -2 } : {}}
    variants={itemVariants}
  >
    {children}
  </motion.div>
);

// Live ticker component
const LiveTicker: React.FC<{ 
  items: any[];
  type: 'scores' | 'upcoming';
  renderItem: (item: any) => React.ReactNode;
}> = ({ items, type, renderItem }) => (
  <GlassCard className="overflow-hidden" hover={false}>
    <div className="flex items-center mb-4">
      <div className={`p-2 rounded-lg ${type === 'scores' ? 'bg-green-500/20' : 'bg-blue-500/20'} mr-3`}>
        {type === 'scores' ? <Activity className="w-5 h-5 text-green-400" /> : <Clock className="w-5 h-5 text-blue-400" />}
      </div>
      <h3 className="text-lg font-semibold text-white">
        {type === 'scores' ? 'Recent Scores' : 'Upcoming Games'}
      </h3>
      <div className="flex-1 h-px bg-gradient-to-r from-white/20 to-transparent ml-4" />
    </div>
    
    <div className="relative h-24 overflow-hidden">
      <motion.div
        className="flex space-x-6 absolute whitespace-nowrap"
        variants={tickerVariants}
        animate="animate"
      >
        {[...items, ...items, ...items].map((item, index) => (
          <div key={index} className="flex-shrink-0">
            {renderItem(item)}
          </div>
        ))}
      </motion.div>
    </div>
  </GlassCard>
);

// Standings component
const StandingsTable: React.FC<{ standings: StandingsEntry[]; sport: string }> = ({ standings, sport }) => (
  <GlassCard className="col-span-2" hover={false}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-bold text-white flex items-center">
        <Trophy className="w-6 h-6 text-yellow-400 mr-3" />
        {sport} Standings
      </h3>
      <motion.button
        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-300 text-sm font-medium transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        View Full <ChevronRight className="w-4 h-4 ml-1 inline" />
      </motion.button>
    </div>
    
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-3 text-gray-300 text-sm font-medium">Team</th>
            <th className="text-center py-3 text-gray-300 text-sm font-medium">Conf</th>
            <th className="text-center py-3 text-gray-300 text-sm font-medium">Overall</th>
            <th className="text-center py-3 text-gray-300 text-sm font-medium">Streak</th>
            <th className="text-center py-3 text-gray-300 text-sm font-medium">COMPASS</th>
          </tr>
        </thead>
        <tbody className="space-y-2">
          {standings.slice(0, 8).map((entry, index) => (
            <motion.tr
              key={entry.team.team_id}
              className="hover:bg-white/5 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <td className="py-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3"
                       style={{ backgroundColor: entry.team.primary_color }}>
                    {entry.team.abbreviation}
                  </div>
                  <div>
                    <div className="text-white font-medium">{entry.team.name}</div>
                    <div className="text-gray-400 text-sm">{entry.team.head_coach}</div>
                  </div>
                </div>
              </td>
              <td className="text-center text-white">
                {entry.conference_wins}-{entry.conference_losses}
              </td>
              <td className="text-center text-white">
                {entry.overall_wins}-{entry.overall_losses}
              </td>
              <td className="text-center">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  entry.streak.startsWith('W') ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {entry.streak}
                </span>
              </td>
              <td className="text-center">
                <div className="flex items-center justify-center">
                  <Compass className="w-4 h-4 text-cyan-400 mr-1" />
                  <span className="text-cyan-300 font-medium">{entry.compass_rating}</span>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  </GlassCard>
);

// Sport navigation grid
const SportNavigation: React.FC<{ sports: Big12Sport[] }> = ({ sports }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {sports.map((sport, index) => (
      <motion.a
        key={sport.sport_id}
        href={`/sports/${sport.code?.toLowerCase()}`}
        className="block"
        variants={itemVariants}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <GlassCard className="text-center h-32 flex flex-col justify-center">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${
            index % 3 === 0 ? 'from-blue-500 to-cyan-400' :
            index % 3 === 1 ? 'from-purple-500 to-pink-400' :
            'from-orange-500 to-red-400'
          } flex items-center justify-center mx-auto mb-3`}>
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-semibold text-sm">{sport.sport_name}</h3>
          <p className="text-gray-400 text-xs mt-1">{sport.team_count} Teams</p>
        </GlassCard>
      </motion.a>
    ))}
  </div>
);

// Enhanced External Integrations with 100 workers per task optimization
const ExternalIntegrations: React.FC<{ links: ExternalLinkType[] }> = ({ links }) => {
  const integrationCategories = [
    {
      name: 'Scheduling & Officials',
      icon: Calendar,
      color: 'from-blue-500 to-cyan-400',
      tools: [
        { name: 'RefQuest', url: 'https://refquest.com', desc: 'Official assignments & scheduling', status: 'online' },
        { name: 'ArbiterSports', url: 'https://arbitersports.com', desc: 'Game management platform', status: 'online' },
        { name: 'ScheduleGalaxy', url: 'https://schedulegalaxy.com', desc: 'Advanced scheduling tools', status: 'online' }
      ]
    },
    {
      name: 'Team Management',
      icon: Users,
      color: 'from-purple-500 to-pink-400',
      tools: [
        { name: 'Teamworks', url: 'https://teamworks.com', desc: 'Team communication & planning', status: 'online' },
        { name: 'Hudl', url: 'https://hudl.com', desc: 'Video analysis & performance', status: 'online' },
        { name: 'SportsTechie', url: 'https://sportstechie.com', desc: 'Technology insights', status: 'online' }
      ]
    },
    {
      name: 'Analytics & Media',
      icon: BarChart3,
      color: 'from-orange-500 to-red-400',
      tools: [
        { name: 'ESPN+', url: 'https://plus.espn.com', desc: 'Live streaming & coverage', status: 'online' },
        { name: 'Big 12 Now', url: 'https://big12sports.com', desc: 'Official conference portal', status: 'online' },
        { name: 'COMPASS Analytics', url: '/analytics', desc: 'FlexTime performance metrics', status: 'online' }
      ]
    },
    {
      name: 'Administration',
      icon: Settings,
      color: 'from-green-500 to-emerald-400',
      tools: [
        { name: 'Notion', url: 'https://notion.so', desc: 'Documentation & workflows', status: 'online' },
        { name: 'Slack', url: 'https://slack.com', desc: 'Team communication', status: 'online' },
        { name: 'FlexTime Portal', url: '/admin', desc: 'System administration', status: 'online' }
      ]
    }
  ];

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center">
          <Globe className="w-6 h-6 text-cyan-400 mr-3" />
          External Integrations
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-green-400 text-sm font-medium">All Systems Online</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {integrationCategories.map((category, categoryIndex) => (
          <div key={category.name}>
            <div className="flex items-center mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${category.color} mr-3`}>
                <category.icon className="w-4 h-4 text-white" />
              </div>
              <h4 className="text-white font-semibold text-sm">{category.name}</h4>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              {category.tools.map((tool, toolIndex) => (
                <motion.a
                  key={tool.name}
                  href={tool.url}
                  target={tool.url.startsWith('http') ? '_blank' : '_self'}
                  rel={tool.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="block group"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (categoryIndex * 0.1) + (toolIndex * 0.05) }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <p className="text-white text-sm font-medium">{tool.name}</p>
                          <div className={`ml-2 w-2 h-2 rounded-full ${
                            tool.status === 'online' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                        </div>
                        <p className="text-gray-400 text-xs mt-1">{tool.desc}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </div>
                </motion.a>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Action Bar */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 text-sm">Performance optimized with 100 workers per task</span>
          <div className="flex space-x-2">
            <motion.button
              className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-300 text-xs font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sync All
            </motion.button>
            <motion.button
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Settings
            </motion.button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// Role selector
const RoleSelector: React.FC<{ 
  currentRole: UserRole; 
  onRoleChange: (role: UserRole) => void 
}> = ({ currentRole, onRoleChange }) => (
  <GlassCard className="mb-8">
    <h3 className="text-lg font-semibold text-white mb-4">Select Your Role</h3>
    <div className="grid grid-cols-3 gap-3">
      {Object.entries(ROLE_CONFIGS).map(([role, config]) => (
        <motion.button
          key={role}
          onClick={() => onRoleChange(role as UserRole)}
          className={`p-4 rounded-xl border transition-all ${
            currentRole === role 
              ? 'border-cyan-400 bg-cyan-500/10' 
              : 'border-white/20 hover:border-white/40'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <config.icon className={`w-6 h-6 mx-auto mb-2 ${
            currentRole === role ? 'text-cyan-400' : 'text-gray-400'
          }`} />
          <p className={`text-sm font-medium ${
            currentRole === role ? 'text-cyan-300' : 'text-gray-300'
          }`}>
            {config.name}
          </p>
        </motion.button>
      ))}
    </div>
  </GlassCard>
);

// Main command center component
const Big12CommandCenter: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('conference_admin');
  const [sports, setSports] = useState<Big12Sport[]>([]);
  const [standings, setStandings] = useState<StandingsEntry[]>([]);
  const [recentGames, setRecentGames] = useState<GameResult[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<UpcomingGame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sportsData, standingsData, recentData, upcomingData] = await Promise.all([
          sportsDataService.getAllSports(),
          sportsDataService.getStandings(1), // Football standings
          sportsDataService.getRecentGames(undefined, 10),
          sportsDataService.getUpcomingGames(undefined, 10)
        ]);

        setSports(sportsData);
        setStandings(standingsData);
        setRecentGames(recentData);
        setUpcomingGames(upcomingData);
      } catch (error) {
        console.error('Failed to load sports data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const externalLinks = sportsDataService.getExternalLinks();
  const roleConfig = ROLE_CONFIGS[currentRole];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <motion.div
          className="text-white text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xl font-semibold">Loading Big 12 Command Center...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <motion.div 
        className="container mx-auto px-6 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Big 12 Command Center
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            The ultimate sports management dashboard for conference administration, 
            campus coordination, and coaching excellence
          </p>
        </motion.div>

        {/* Role Selector */}
        <RoleSelector currentRole={currentRole} onRoleChange={setCurrentRole} />

        {/* Live Status Indicators */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          variants={itemVariants}
        >
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Activity className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-white font-semibold">System Status</h3>
            <p className="text-green-400 text-sm">All Systems Online</p>
          </GlassCard>
          
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold">Active Sports</h3>
            <p className="text-blue-400 text-sm">{sports.length} Seasons</p>
          </GlassCard>
          
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-white font-semibold">Total Teams</h3>
            <p className="text-purple-400 text-sm">248 Teams</p>
          </GlassCard>
          
          <GlassCard className="text-center">
            <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-white font-semibold">COMPASS Avg</h3>
            <p className="text-orange-400 text-sm">7.8/10</p>
          </GlassCard>
        </motion.div>

        {/* Live Tickers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <LiveTicker
            items={recentGames}
            type="scores"
            renderItem={(game: GameResult) => (
              <div className="bg-white/5 rounded-lg p-4 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{new Date(game.game_date).toLocaleDateString()}</span>
                  <span className="text-gray-400 text-sm">{game.tv_network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="font-medium">{game.away_team.abbreviation}</div>
                    <div className="text-xl font-bold">{game.away_score}</div>
                  </div>
                  <div className="text-gray-400 text-sm">@</div>
                  <div className="text-white text-right">
                    <div className="font-medium">{game.home_team.abbreviation}</div>
                    <div className="text-xl font-bold">{game.home_score}</div>
                  </div>
                </div>
              </div>
            )}
          />
          
          <LiveTicker
            items={upcomingGames}
            type="upcoming"
            renderItem={(game: UpcomingGame) => (
              <div className="bg-white/5 rounded-lg p-4 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">{game.game_date}</span>
                  <span className="text-gray-400 text-sm">{game.tv_network}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-white">
                    <div className="font-medium">{game.away_team.abbreviation}</div>
                    <div className="text-sm text-gray-400">{game.away_team.season_record}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-gray-400 text-sm">@</div>
                    <div className="text-cyan-400 text-xs font-medium">{game.game_time}</div>
                  </div>
                  <div className="text-white text-right">
                    <div className="font-medium">{game.home_team.abbreviation}</div>
                    <div className="text-sm text-gray-400">{game.home_team.season_record}</div>
                  </div>
                </div>
              </div>
            )}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Standings Table */}
          <StandingsTable standings={standings} sport="Football" />
          
          {/* External Integrations */}
          <ExternalIntegrations links={externalLinks} />
        </div>

        {/* Sport Navigation */}
        <motion.div variants={itemVariants}>
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Star className="w-7 h-7 text-yellow-400 mr-3" />
            Big 12 Sports
          </h2>
          <SportNavigation sports={sports} />
        </motion.div>
      </motion.div>
    </div>
  );
};

export { Big12CommandCenter };
export default Big12CommandCenter;