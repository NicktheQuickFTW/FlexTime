/**
 * Teams Management Page - FlexTime Big 12 Conference
 * 
 * Comprehensive team management interface with Big 12 Conference branding,
 * CRUD operations, sport filtering, and conference affiliation tracking.
 * 
 * Following FlexTime UI standards with glassmorphic styling, gradient text,
 * and consistent CSS variables.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  PlusCircle,
  Edit,
  Trash2,
  MoreVertical,
  Trophy,
  MapPin,
  Star,
  Users,
  GraduationCap,
  BarChart3,
  BadgeCheck,
  Filter,
  X,
  ChevronDown
} from 'lucide-react';

import { FlexTimeShinyButton } from '../components/ui/FlexTimeShinyButton';

// Enhanced interfaces following FlexTime architecture
interface Team {
  id: string;
  name: string;
  school: string;
  sport: string;
  conference: string;
  division?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  location: {
    city: string;
    state: string;
  };
  venue: string;
  coach: string;
  founded: number;
  championships: number;
  currentRanking?: number;
  status: 'active' | 'inactive' | 'suspended';
  stats: {
    wins: number;
    losses: number;
    ties?: number;
  };
}

// Big 12 Conference Schools Data with correct team information
const BIG12_TEAMS = [
  { id: 'arizona', name: 'University of Arizona', abbreviation: 'ARIZ', primaryColor: '#003366', city: 'Tucson', state: 'AZ' },
  { id: 'arizona-state', name: 'Arizona State University', abbreviation: 'ASU', primaryColor: '#8C1D40', city: 'Tempe', state: 'AZ' },
  { id: 'baylor', name: 'Baylor University', abbreviation: 'BU', primaryColor: '#003015', city: 'Waco', state: 'TX' },
  { id: 'byu', name: 'Brigham Young University', abbreviation: 'BYU', primaryColor: '#002E5D', city: 'Provo', state: 'UT' },
  { id: 'ucf', name: 'University of Central Florida', abbreviation: 'UCF', primaryColor: '#0B2540', city: 'Orlando', state: 'FL' },
  { id: 'cincinnati', name: 'University of Cincinnati', abbreviation: 'CIN', primaryColor: '#C6011F', city: 'Cincinnati', state: 'OH' },
  { id: 'colorado', name: 'University of Colorado Boulder', abbreviation: 'CU', primaryColor: '#97233F', city: 'Boulder', state: 'CO' },
  { id: 'houston', name: 'University of Houston', abbreviation: 'UH', primaryColor: '#C8102E', city: 'Houston', state: 'TX' },
  { id: 'iowa-state', name: 'Iowa State University', abbreviation: 'ISU', primaryColor: '#C8102E', city: 'Ames', state: 'IA' },
  { id: 'kansas', name: 'University of Kansas', abbreviation: 'KU', primaryColor: '#0051BA', city: 'Lawrence', state: 'KS' },
  { id: 'kansas-state', name: 'Kansas State University', abbreviation: 'KSU', primaryColor: '#512888', city: 'Manhattan', state: 'KS' },
  { id: 'oklahoma-state', name: 'Oklahoma State University', abbreviation: 'OSU', primaryColor: '#FF7300', city: 'Stillwater', state: 'OK' },
  { id: 'tcu', name: 'Texas Christian University', abbreviation: 'TCU', primaryColor: '#4D1979', city: 'Fort Worth', state: 'TX' },
  { id: 'texas-tech', name: 'Texas Tech University', abbreviation: 'TTU', primaryColor: '#E60000', city: 'Lubbock', state: 'TX' },
  { id: 'utah', name: 'University of Utah', abbreviation: 'UTAH', primaryColor: '#E03A3E', city: 'Salt Lake City', state: 'UT' },
  { id: 'west-virginia', name: 'University of West Virginia', abbreviation: 'WVU', primaryColor: '#1F4E79', city: 'Morgantown', state: 'WV' }
];

const BIG12_SCHOOLS = BIG12_TEAMS.map(team => team.name);

const SPORTS_LIST = [
  'Football', 'Men\'s Basketball', 'Women\'s Basketball', 'Baseball', 'Softball',
  'Soccer', 'Volleyball', 'Tennis', 'Golf', 'Track & Field', 'Swimming', 
  'Wrestling', 'Gymnastics', 'Lacrosse'
];

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);

  // Mock data generation using correct Big 12 team information
  useEffect(() => {
    const generateMockTeams = (): Team[] => {
      const mockTeams: Team[] = [];
      
      BIG12_TEAMS.forEach((teamInfo) => {
        SPORTS_LIST.slice(0, 8).forEach((sport, index) => {
          const teamName = getTeamName(teamInfo.name, sport);
          mockTeams.push({
            id: `${teamInfo.id}-${sport.toLowerCase().replace(/\s+/g, '-')}`,
            name: teamName,
            school: teamInfo.name,
            sport,
            conference: 'Big 12',
            division: 'Division I',
            logo: `https://via.placeholder.com/60x60/${teamInfo.primaryColor.replace('#', '')}/ffffff?text=${teamInfo.abbreviation}`,
            primaryColor: teamInfo.primaryColor,
            secondaryColor: '#ffffff',
            location: {
              city: teamInfo.city,
              state: teamInfo.state
            },
            venue: getVenueName(teamInfo.name, sport),
            coach: `Coach ${teamInfo.abbreviation}`,
            founded: 1950 + Math.floor(Math.random() * 50),
            championships: Math.floor(Math.random() * 5),
            currentRanking: Math.random() > 0.7 ? Math.floor(Math.random() * 25) + 1 : undefined,
            status: Math.random() > 0.1 ? 'active' : 'inactive',
            stats: {
              wins: Math.floor(Math.random() * 30),
              losses: Math.floor(Math.random() * 10),
              ties: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : undefined
            }
          });
        });
      });
      
      return mockTeams;
    };

    // Helper function to get appropriate team names
    const getTeamName = (school: string, sport: string): string => {
      const schoolMap: { [key: string]: string } = {
        'University of Arizona': 'Wildcats',
        'Arizona State University': 'Sun Devils',
        'Baylor University': 'Bears',
        'Brigham Young University': 'Cougars',
        'University of Cincinnati': 'Bearcats',
        'University of Colorado Boulder': 'Buffaloes',
        'University of Houston': 'Cougars',
        'Iowa State University': 'Cyclones',
        'University of Kansas': 'Jayhawks',
        'Kansas State University': 'Wildcats',
        'Oklahoma State University': 'Cowboys',
        'Texas Christian University': 'Horned Frogs',
        'Texas Tech University': 'Red Raiders',
        'University of Central Florida': 'Knights',
        'University of Utah': 'Utes',
        'University of West Virginia': 'Mountaineers'
      };
      
      const mascot = schoolMap[school] || 'Team';
      
      if (sport === 'Women\'s Basketball' || sport === 'Softball' || sport === 'Volleyball') {
        // Some schools have Lady variations
        if (school === 'Baylor University') return 'Lady Bears';
        if (school === 'Texas Tech University') return 'Lady Red Raiders';
      }
      
      return mascot;
    };

    // Helper function to get appropriate venue names
    const getVenueName = (school: string, sport: string): string => {
      const venueMap: { [key: string]: { [key: string]: string } } = {
        'University of Arizona': {
          'Football': 'Arizona Stadium',
          'Men\'s Basketball': 'McKale Center',
          'Women\'s Basketball': 'McKale Center',
          'Baseball': 'Hi Corbett Field'
        },
        'Arizona State University': {
          'Football': 'Sun Devil Stadium',
          'Men\'s Basketball': 'Desert Financial Arena',
          'Women\'s Basketball': 'Desert Financial Arena',
          'Baseball': 'Phoenix Municipal Stadium'
        },
        'Baylor University': {
          'Football': 'McLane Stadium',
          'Men\'s Basketball': 'Ferrell Center',
          'Women\'s Basketball': 'Ferrell Center',
          'Baseball': 'Baylor Ballpark'
        },
        'University of Kansas': {
          'Football': 'David Booth Kansas Memorial Stadium',
          'Men\'s Basketball': 'Allen Fieldhouse',
          'Women\'s Basketball': 'Allen Fieldhouse',
          'Baseball': 'Hoglund Ballpark'
        },
        'Texas Christian University': {
          'Football': 'Amon G. Carter Stadium',
          'Men\'s Basketball': 'Ed & Rae Schollmaier Arena',
          'Women\'s Basketball': 'Ed & Rae Schollmaier Arena',
          'Baseball': 'Lupton Stadium'
        }
      };
      
      return venueMap[school]?.[sport] || `${school.split(' ')[0]} ${sport} Facility`;
    };

    setTimeout(() => {
      setTeams(generateMockTeams());
      setLoading(false);
    }, 1000);
  }, []);

  // Filtered teams based on search and filters
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.sport.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = selectedSport === 'All' || team.sport === selectedSport;
      const matchesSchool = selectedSchool === 'All' || team.school === selectedSchool;
      
      return matchesSearch && matchesSport && matchesSchool;
    });
  }, [teams, searchTerm, selectedSport, selectedSchool]);

  // Stats for summary cards
  const stats = useMemo(() => ({
    total: teams.length,
    active: teams.filter(t => t.status === 'active').length,
    sports: new Set(teams.map(t => t.sport)).size,
    schools: new Set(teams.map(t => t.school)).size
  }), [teams]);

  const handleDropdownToggle = (teamId: string) => {
    setShowDropdown(showDropdown === teamId ? null : teamId);
    setSelectedTeam(teams.find(t => t.id === teamId) || null);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
    setShowDropdown(null);
  };

  const handleDelete = (team: Team) => {
    setTeams(teams.filter(t => t.id !== team.id));
    setShowDropdown(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'inactive': return 'bg-yellow-500 text-white';
      case 'suspended': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const TeamCard: React.FC<{ team: Team; index: number }> = ({ team, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:transform hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:border-[color:var(--ft-neon)] group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xs"
            style={{ backgroundColor: team.primaryColor }}
          >
            {BIG12_TEAMS.find(t => t.name === team.school)?.abbreviation || team.school.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
              {BIG12_TEAMS.find(t => t.name === team.school)?.abbreviation || team.school.split(' ')[0]} {team.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {team.sport}
            </p>
            {team.currentRanking && (
              <div className="flex items-center space-x-1 mt-1">
                <Star className="w-4 h-4 text-[color:var(--ft-neon)]" />
                <span className="text-[color:var(--ft-neon)] text-sm font-medium">
                  #{team.currentRanking}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Dropdown Menu */}
        <div className="relative">
          <button
            onClick={() => handleDropdownToggle(team.id)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          
          {showDropdown === team.id && (
            <div className="absolute right-0 top-10 bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl shadow-lg z-10 min-w-[150px]">
              <button
                onClick={() => handleEdit(team)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/5 flex items-center space-x-2 rounded-t-xl"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Team</span>
              </button>
              <button
                onClick={() => handleDelete(team)}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/5 flex items-center space-x-2 text-red-500 rounded-b-xl"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Team</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(team.status)}`}>
          {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
        </span>
      </div>

      {/* Stats */}
      <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">W-L</p>
            <p className="font-bold text-gray-900 dark:text-white">
              {team.stats.wins}-{team.stats.losses}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Coach</p>
            <p className="font-bold text-gray-900 dark:text-white">
              {team.coach.split(' ')[1]}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 text-xs">Titles</p>
            <p className="font-bold text-gray-900 dark:text-white">
              {team.championships}
            </p>
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400 text-sm">
        <MapPin className="w-4 h-4" />
        <span>{team.location.city}, {team.location.state}</span>
      </div>

      {/* Actions */}
      <div className="flex space-x-2 mt-4">
        <FlexTimeShinyButton
          variant="glass"
          onClick={() => handleEdit(team)}
          className="flex-1 text-sm py-2"
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          View Stats
        </FlexTimeShinyButton>
        <FlexTimeShinyButton
          variant="secondary"
          onClick={() => handleEdit(team)}
          className="flex-1 text-sm py-2"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </FlexTimeShinyButton>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      <div className="container mx-auto px-6 py-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold mb-4 ft-font-brand bg-gradient-to-r from-black dark:from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent">
            INSIDE THE 12
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Comprehensive team management for Big 12 Conference sports
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Teams', value: stats.total, icon: Users, color: 'from-blue-500 to-cyan-500' },
            { label: 'Active Teams', value: stats.active, icon: BadgeCheck, color: 'from-green-500 to-emerald-500' },
            { label: 'Sports', value: stats.sports, icon: Trophy, color: 'from-orange-500 to-red-500' },
            { label: 'Schools', value: stats.schools, icon: GraduationCap, color: 'from-purple-500 to-pink-500' }
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {stat.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teams, schools, or sports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[color:var(--ft-neon)] transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-4">
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="px-4 py-3 bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[color:var(--ft-neon)] transition-colors min-w-[120px]"
            >
              <option value="All">All Sports</option>
              {SPORTS_LIST.map(sport => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>

            <select
              value={selectedSchool}
              onChange={(e) => setSelectedSchool(e.target.value)}
              className="px-4 py-3 bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-[color:var(--ft-neon)] transition-colors min-w-[120px]"
            >
              <option value="All">All Schools</option>
              {BIG12_SCHOOLS.map(school => (
                <option key={school} value={school}>{school}</option>
              ))}
            </select>

            <FlexTimeShinyButton
              variant="neon"
              onClick={() => {
                setEditingTeam(null);
                setIsDialogOpen(true);
              }}
              className="px-6 py-3"
            >
              <PlusCircle className="w-5 h-5 mr-2" />
              Add Team
            </FlexTimeShinyButton>
          </div>
        </div>

        {/* Teams Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <div
                key={index}
                className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-6 animate-pulse"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              </div>
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-2xl p-8 max-w-md mx-auto">
              <Users className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                No teams found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No teams match your search criteria. Try adjusting your filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredTeams.map((team, index) => (
                <TeamCard key={team.id} team={team} index={index} />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Add/Edit Dialog */}
        {isDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingTeam ? 'Edit Team' : 'Add New Team'}
                </h2>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              <div className="text-center py-8">
                <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Team form will be implemented here with all necessary fields for creating/editing teams.
                </p>
              </div>

              <div className="flex space-x-3 justify-end">
                <FlexTimeShinyButton
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-6 py-2"
                >
                  Cancel
                </FlexTimeShinyButton>
                <FlexTimeShinyButton
                  variant="neon"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-6 py-2"
                >
                  {editingTeam ? 'Update' : 'Create'} Team
                </FlexTimeShinyButton>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teams;