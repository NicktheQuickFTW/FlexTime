'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  GraduationCap,
  MapPin,
  Trophy,
  Users,
  Search,
  Grid,
  List,
  Award,
  ArrowRight
} from 'lucide-react'

// 21st-dev inspired glassmorphic school card
const SchoolCard = ({ 
  school, 
  index, 
  viewMode = 'grid' 
}: { 
  school: any
  index: number
  viewMode?: 'grid' | 'list'
}) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.03 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={`group relative ${viewMode === 'list' ? 'w-full' : ''}`}
    >
      <Link href={`/universities/${school.slug}`}>
        <motion.div
          whileHover={{ y: -8, scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`
            relative overflow-hidden
            bg-white/[0.08] dark:bg-white/[0.04] 
            backdrop-blur-xl backdrop-saturate-150
            border border-white/[0.15] dark:border-white/[0.08]
            rounded-2xl p-6
            shadow-[0_8px_32px_rgba(0,0,0,0.12)]
            hover:shadow-[0_20px_64px_rgba(0,191,255,0.2)]
            hover:border-[color:var(--ft-neon)]/30
            transition-all duration-500
            ${viewMode === 'list' ? 'flex items-center gap-6' : 'h-80'}
          `}
        >
          {/* School color accent */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
            style={{ backgroundColor: school.primaryColor }}
          />
          
          {/* Animated background gradient */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 0.1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-gradient-to-br from-[color:var(--ft-neon)] to-blue-600 rounded-2xl"
          />
          
          {/* Content */}
          <div className={`relative z-10 ${viewMode === 'list' ? 'flex-1' : 'h-full flex flex-col'}`}>
            
            {/* Header */}
            <div className={`flex items-start gap-4 mb-4 ${viewMode === 'list' ? 'mb-0' : ''}`}>
              <motion.div
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.3 }}
                className="w-16 h-16 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-2 flex-shrink-0"
                style={{ borderColor: school.primaryColor + '40' }}
              >
                {/* Primary team logo */}
                <img 
                  src={`/logos/teams/${school.logoSlug}.svg`}
                  alt={`${school.name} logo`}
                  className="w-full h-full object-contain"
                />
              </motion.div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white group-hover:text-[color:var(--ft-neon)] transition-colors">
                  {school.name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <MapPin size={12} />
                  {school.location}
                </div>
                <div className="text-xs text-gray-500 mt-1">{school.nickname}</div>
              </div>
              
              {/* Championship indicator */}
              {school.recentChampions > 0 && (
                <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg px-2 py-1">
                  <Trophy size={12} className="text-yellow-400" />
                  <span className="text-xs text-yellow-400 font-medium">{school.recentChampions}</span>
                </div>
              )}
            </div>

            {viewMode === 'grid' && (
              <>
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-lg font-bold text-[color:var(--ft-neon)]">{school.totalSports}</div>
                    <div className="text-xs text-gray-400">Sports</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-lg font-bold text-[color:var(--ft-neon)]">{school.enrollment}</div>
                    <div className="text-xs text-gray-400">Students</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-lg font-bold text-[color:var(--ft-neon)]">{school.founded}</div>
                    <div className="text-xs text-gray-400">Founded</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className="text-lg font-bold text-[color:var(--ft-neon)]">{school.conference}</div>
                    <div className="text-xs text-gray-400">Years</div>
                  </div>
                </div>

                {/* Notable Sports */}
                <div className="space-y-2 mb-4">
                  <div className="text-xs text-gray-400 font-medium">Notable Programs:</div>
                  {school.notableSports.slice(0, 3).map((sport: string, i: number) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <div className="w-1 h-1 rounded-full bg-[color:var(--ft-neon)]" />
                      {sport}
                    </motion.div>
                  ))}
                </div>

                {/* Action button */}
                <div className="mt-auto">
                  <motion.div
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-2 text-[color:var(--ft-neon)] text-sm font-medium"
                  >
                    <GraduationCap size={14} />
                    View University
                    <ArrowRight size={14} />
                  </motion.div>
                </div>
              </>
            )}

            {viewMode === 'list' && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-sm text-gray-400">{school.totalSports} sports</div>
                  <div className="text-sm text-gray-400">{school.enrollment} students</div>
                  <div className="text-sm text-gray-400">Founded {school.founded}</div>
                </div>
                <ArrowRight className="text-[color:var(--ft-neon)] group-hover:translate-x-2 transition-transform" size={20} />
              </div>
            )}
          </div>

          {/* Hover glow effect */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: isHovered ? 0.15 : 0, scale: isHovered ? 1.2 : 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: school.primaryColor }}
          />
        </motion.div>
      </Link>
    </motion.div>
  )
}

// Hero stats component
const HeroStat = ({ 
  value, 
  label, 
  icon: Icon, 
  delay = 0 
}: { 
  value: string | number
  label: string
  icon: React.ElementType
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="text-center"
  >
    <div className="w-16 h-16 mx-auto mb-3 bg-[color:var(--ft-neon)]/20 border border-[color:var(--ft-neon)]/30 rounded-xl flex items-center justify-center">
      <Icon size={24} className="text-[color:var(--ft-neon)]" />
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </motion.div>
)

export default function SchoolsIndexPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterState, setFilterState] = useState('all')
  const [sortBy, setSortBy] = useState('id')

  // Big 12 Schools data with 21st-dev magic
  const schools = [
    {
      id: 1,
      name: 'University of Arizona',
      slug: 'arizona',
      nickname: 'Wildcats',
      logoSlug: 'arizona',
      location: 'Tucson, Arizona',
      founded: 1885,
      enrollment: '47,000',
      totalSports: 21,
      conference: 2,
      state: 'Arizona',
      primaryColor: '#003366',
      recentChampions: 2,
      notableSports: ['Basketball', 'Softball', 'Swimming']
    },
    {
      id: 2,
      name: 'Arizona State University',
      slug: 'arizona-state',
      nickname: 'Sun Devils',
      logoSlug: 'arizona_state',
      location: 'Tempe, Arizona',
      founded: 1885,
      enrollment: '83,000',
      totalSports: 24,
      conference: 2,
      state: 'Arizona',
      primaryColor: '#8C1D40',
      recentChampions: 1,
      notableSports: ['Wrestling', 'Baseball', 'Golf']
    },
    {
      id: 3,
      name: 'Baylor University',
      slug: 'baylor',
      nickname: 'Bears',
      logoSlug: 'baylor',
      location: 'Waco, Texas',
      founded: 1845,
      enrollment: '20,000',
      totalSports: 19,
      conference: 13,
      state: 'Texas',
      primaryColor: '#003015',
      recentChampions: 3,
      notableSports: ['Basketball', 'Football', 'Tennis']
    },
    {
      id: 4,
      name: 'Brigham Young University',
      slug: 'byu',
      nickname: 'Cougars',
      logoSlug: 'byu',
      location: 'Provo, Utah',
      founded: 1875,
      enrollment: '33,000',
      totalSports: 21,
      conference: 2,
      state: 'Utah',
      primaryColor: '#002E5D',
      recentChampions: 1,
      notableSports: ['Football', 'Cross Country', 'Volleyball']
    },
    {
      id: 5,
      name: 'University of Cincinnati',
      slug: 'cincinnati',
      nickname: 'Bearcats',
      logoSlug: 'cincinnati',
      location: 'Cincinnati, Ohio',
      founded: 1819,
      enrollment: '46,000',
      totalSports: 18,
      conference: 2,
      state: 'Ohio',
      primaryColor: '#E00122',
      recentChampions: 0,
      notableSports: ['Football', 'Basketball', 'Soccer']
    },
    {
      id: 6,
      name: 'University of Colorado Boulder',
      slug: 'colorado',
      nickname: 'Buffaloes',
      logoSlug: 'colorado',
      location: 'Boulder, Colorado',
      founded: 1876,
      enrollment: '35,000',
      totalSports: 17,
      conference: 13,
      state: 'Colorado',
      primaryColor: '#CFB87C',
      recentChampions: 0,
      notableSports: ['Football', 'Basketball', 'Skiing']
    },
    {
      id: 7,
      name: 'University of Houston',
      slug: 'houston',
      nickname: 'Cougars',
      logoSlug: 'houston',
      location: 'Houston, Texas',
      founded: 1927,
      enrollment: '47,000',
      totalSports: 17,
      conference: 2,
      state: 'Texas',
      primaryColor: '#C8102E',
      recentChampions: 1,
      notableSports: ['Basketball', 'Football', 'Golf']
    },
    {
      id: 8,
      name: 'Iowa State University',
      slug: 'iowa-state',
      nickname: 'Cyclones',
      logoSlug: 'iowa_state',
      location: 'Ames, Iowa',
      founded: 1858,
      enrollment: '31,000',
      totalSports: 18,
      conference: 13,
      state: 'Iowa',
      primaryColor: '#C8102E',
      recentChampions: 0,
      notableSports: ['Wrestling', 'Basketball', 'Track & Field']
    },
    {
      id: 9,
      name: 'University of Kansas',
      slug: 'kansas',
      nickname: 'Jayhawks',
      logoSlug: 'kansas',
      location: 'Lawrence, Kansas',
      founded: 1865,
      enrollment: '28,000',
      totalSports: 18,
      conference: 29,
      state: 'Kansas',
      primaryColor: '#0051BA',
      recentChampions: 4,
      notableSports: ['Basketball', 'Track & Field', 'Volleyball']
    },
    {
      id: 10,
      name: 'Kansas State University',
      slug: 'kansas-state',
      nickname: 'Wildcats',
      logoSlug: 'kansas_state',
      location: 'Manhattan, Kansas',
      founded: 1863,
      enrollment: '21,000',
      totalSports: 16,
      conference: 29,
      state: 'Kansas',
      primaryColor: '#512888',
      recentChampions: 0,
      notableSports: ['Football', 'Basketball', 'Baseball']
    },
    {
      id: 11,
      name: 'Oklahoma State University',
      slug: 'oklahoma-state',
      nickname: 'Cowboys',
      logoSlug: 'oklahoma_state',
      location: 'Stillwater, Oklahoma',
      founded: 1890,
      enrollment: '25,000',
      totalSports: 18,
      conference: 13,
      state: 'Oklahoma',
      primaryColor: '#FF7300',
      recentChampions: 2,
      notableSports: ['Wrestling', 'Golf', 'Equestrian']
    },
    {
      id: 12,
      name: 'Texas Christian University',
      slug: 'tcu',
      nickname: 'Horned Frogs',
      logoSlug: 'tcu',
      location: 'Fort Worth, Texas',
      founded: 1873,
      enrollment: '11,000',
      totalSports: 18,
      conference: 13,
      state: 'Texas',
      primaryColor: '#4D1979',
      recentChampions: 1,
      notableSports: ['Football', 'Basketball', 'Baseball']
    },
    {
      id: 13,
      name: 'Texas Tech University',
      slug: 'texas-tech',
      nickname: 'Red Raiders',
      logoSlug: 'texas_tech',
      location: 'Lubbock, Texas',
      founded: 1923,
      enrollment: '40,000',
      totalSports: 17,
      conference: 29,
      state: 'Texas',
      primaryColor: '#CC0000',
      recentChampions: 1,
      notableSports: ['Basketball', 'Football', 'Track & Field']
    },
    {
      id: 14,
      name: 'University of Central Florida',
      slug: 'ucf',
      nickname: 'Knights',
      logoSlug: 'ucf',
      location: 'Orlando, Florida',
      founded: 1963,
      enrollment: '68,000',
      totalSports: 16,
      conference: 2,
      state: 'Florida',
      primaryColor: '#000000',
      recentChampions: 0,
      notableSports: ['Football', 'Basketball', 'Soccer']
    },
    {
      id: 15,
      name: 'University of Utah',
      slug: 'utah',
      nickname: 'Utes',
      logoSlug: 'utah',
      location: 'Salt Lake City, Utah',
      founded: 1850,
      enrollment: '33,000',
      totalSports: 20,
      conference: 13,
      state: 'Utah',
      primaryColor: '#CC0000',
      recentChampions: 2,
      notableSports: ['Gymnastics', 'Skiing', 'Football']
    },
    {
      id: 16,
      name: 'West Virginia University',
      slug: 'west-virginia',
      nickname: 'Mountaineers',
      logoSlug: 'west_virginia',
      location: 'Morgantown, West Virginia',
      founded: 1867,
      enrollment: '26,000',
      totalSports: 18,
      conference: 13,
      state: 'West Virginia',
      primaryColor: '#002855',
      recentChampions: 1,
      notableSports: ['Football', 'Basketball', 'Wrestling']
    }
  ]

  // Get unique states for filtering
  const states = [...new Set(schools.map(school => school.state))].sort()

  // Filter and sort schools
  const filteredSchools = schools
    .filter(school => 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (filterState === 'all' || school.state === filterState)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'id': return a.id - b.id
        case 'name': return a.name.localeCompare(b.name)
        case 'enrollment': return parseInt(b.enrollment.replace(',', '')) - parseInt(a.enrollment.replace(',', ''))
        case 'founded': return a.founded - b.founded
        case 'sports': return b.totalSports - a.totalSports
        default: return a.id - b.id
      }
    })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      
      {/* Hero Section */}
      <div className="relative pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent ft-font-brand uppercase tracking-wide">
              ALWAYS BEEN &gt; 12
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-xl ft-font-ui leading-tight max-w-3xl mx-auto">
              Discover the 16 powerhouse institutions driving excellence in Big 12 Conference athletics
            </p>
          </motion.div>

          {/* Hero Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <HeroStat value="16" label="Universities" icon={GraduationCap} delay={0.2} />
            <HeroStat value="750K+" label="Total Students" icon={Users} delay={0.3} />
            <HeroStat value="290+" label="Sports Programs" icon={Trophy} delay={0.4} />
            <HeroStat value="150+" label="Years of Excellence" icon={Award} delay={0.5} />
          </div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8"
          >
            
            {/* Search & Filters */}
            <div className="flex flex-wrap gap-4 items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search universities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/[0.15] rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-neon)]/50 w-64"
                />
              </div>

              {/* State Filter */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
                className="bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/[0.15] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-neon)]/50"
              >
                <option value="all" className="bg-black">All States</option>
                {states.map(state => (
                  <option key={state} value={state} className="bg-black">{state}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/[0.15] rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-neon)]/50"
              >
                <option value="name" className="bg-black">Sort by Name</option>
                <option value="enrollment" className="bg-black">Sort by Enrollment</option>
                <option value="founded" className="bg-black">Sort by Founded</option>
                <option value="sports" className="bg-black">Sort by Sports</option>
              </select>
            </div>

            {/* View Controls */}
            <div className="flex gap-2">
              <div className="flex bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl rounded-xl p-1 border border-white/[0.15]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[color:var(--ft-neon)] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    viewMode === 'list'
                      ? 'bg-[color:var(--ft-neon)] text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Schools Grid/List */}
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }
            >
              {filteredSchools.map((school, index) => (
                <SchoolCard
                  key={school.slug}
                  school={school}
                  index={index}
                  viewMode={viewMode}
                />
              ))}
            </motion.div>
          </AnimatePresence>

          {/* No results */}
          {filteredSchools.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-500/20 rounded-xl flex items-center justify-center">
                <Search className="text-gray-400" size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No universities found</h3>
              <p className="text-gray-400">Try adjusting your search or filter criteria</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}