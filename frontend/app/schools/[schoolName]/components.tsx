'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { 
  MapPin,
  Calendar,
  Users,
  Award,
  TrendingUp,
  Activity,
  Crown,
  Medal,
  Search,
  ArrowLeft,
  ChevronRight
} from 'lucide-react'

import { Team } from '../../../src/data/big12-universities-complete'

// 21st-dev inspired team card component
export const TeamCard = ({ 
  team, 
  index, 
  universityColors 
}: { 
  team: Team
  index: number
  universityColors: { primary: string; secondary: string }
}) => {
  const [isHovered, setIsHovered] = useState(false)

  const getPerformanceLevel = (level: string) => {
    switch (level) {
      case 'Elite': return { color: '#FFD700', icon: Crown }
      case 'Excellent': return { color: '#C0C0C0', icon: Medal }
      case 'Strong': return { color: '#CD7F32', icon: Award }
      case 'Developing': return { color: '#00bfff', icon: TrendingUp }
      default: return { color: '#6B7280', icon: Activity }
    }
  }

  const performance = getPerformanceLevel(team.performanceLevel)
  const PerformanceIcon = performance.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group relative"
    >
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-6 hover:shadow-[0_20px_64px_rgba(0,191,255,0.15)] hover:border-[color:var(--ft-neon)]/30 transition-all duration-500"
      >
        {/* Sport accent */}
        <div 
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ backgroundColor: universityColors.primary }}
        />
        
        {/* Animated background gradient */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 0.08 : 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-gradient-to-br from-[color:var(--ft-neon)] to-blue-600 rounded-2xl"
        />
        
        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-[color:var(--ft-neon)] transition-colors uppercase tracking-wide">
                {team.sport}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                <span className="capitalize">{team.gender}</span>
                {team.division && (
                  <>
                    <span>•</span>
                    <span>{team.division}</span>
                  </>
                )}
              </div>
            </div>
            
            <div 
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
              style={{ 
                backgroundColor: performance.color + '20',
                color: performance.color,
                border: `1px solid ${performance.color}30`
              }}
            >
              <PerformanceIcon size={12} />
              {team.performanceLevel}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {team.recentRecord && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Recent Record</p>
                <p className="text-base font-medium text-white">{team.recentRecord}</p>
              </div>
            )}
            
            {team.conference && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Conference</p>
                <p className="text-base font-medium text-white">{team.conference}</p>
              </div>
            )}
            
            {team.ranking && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">National Ranking</p>
                <p className="text-base font-medium text-white">#{team.ranking}</p>
              </div>
            )}
            
            {team.championships && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <p className="text-xs text-gray-400 mb-1">Championships</p>
                <p className="text-base font-medium text-white">{team.championships}</p>
              </div>
            )}
          </div>
          
          {/* Details link */}
          <div className="border-t border-white/10 pt-4 mt-2">
            <Link 
              href="#" 
              className="text-sm text-[color:var(--ft-neon)] hover:text-white transition-colors flex items-center gap-1"
            >
              View team details
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// University stat component
export const UniversityStat = ({ 
  value, 
  label, 
  icon: Icon, 
  delay = 0,
  color = 'var(--ft-neon)'
}: { 
  value: string | number
  label: string
  icon: React.ElementType
  delay?: number
  color?: string
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-6 group hover:shadow-[0_20px_64px_rgba(0,191,255,0.15)] hover:border-[color:var(--ft-neon)]/30 transition-all duration-500"
    >
      <div className="flex items-center mb-3">
        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mr-3" style={{ color }}>
          <Icon size={20} />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-gray-400">{label}</div>
        </div>
      </div>
    </motion.div>
  )
}

export const TeamsSection = ({ 
  university,
  teams
}: { 
  university: any,
  teams: Team[]
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Categories for filtering
  const categories = ['all', 'men', 'women', 'coed']

  // Filter teams based on search and category
  const filteredTeams = teams.filter((team) => {
    const matchesSearch = team.sport.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || team.gender.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
    >
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wide">Athletic Programs</h2>
        
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search sports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-xl pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-neon)]/50 w-48"
            />
          </div>

          {/* Category Filter */}
          <div className="flex bg-white/[0.08] backdrop-blur-xl rounded-xl p-1 border border-white/[0.15]">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  selectedCategory === category
                    ? 'bg-[color:var(--ft-neon)] text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedCategory + searchTerm}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          {filteredTeams.map((team, index) => (
            <TeamCard
              key={`${team.sport}-${team.gender}`}
              team={team}
              index={index}
              universityColors={{
                primary: university.primaryColor,
                secondary: university.secondaryColor || university.primaryColor
              }}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* No results */}
      {filteredTeams.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-500/20 rounded-xl flex items-center justify-center">
            <Activity className="text-gray-400" size={24} />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No teams found</h3>
          <p className="text-gray-400">Try adjusting your search or category filter</p>
        </motion.div>
      )}
    </motion.div>
  )
}

export const UniversityHero = ({
  university,
  stats
}: {
  university: any,
  stats: Array<{
    value: string | number;
    label: string;
    icon: React.ElementType;
    delay?: number;
    color?: string;
  }>
}) => {
  return (
    <>
      {/* Back link */}
      <Link href="/sports" className="inline-flex items-center gap-2 text-gray-400 hover:text-[color:var(--ft-neon)] transition-colors mb-8">
        <ArrowLeft size={18} />
        Back to School Directory
      </Link>
      
      <div className="flex flex-col lg:flex-row gap-8 mb-12">
        {/* University Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative w-60 h-60 flex-shrink-0 overflow-hidden rounded-2xl bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] flex items-center justify-center p-8"
        >
          <div className="relative w-full h-full">
            <img 
              src={university.logoUrl || '/logo-placeholder.png'} 
              alt={`${university.name} logo`} 
              className="object-contain w-full h-full"
            />
          </div>
        </motion.div>
        
        {/* University Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1"
        >
          <div className="mb-4">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-2 uppercase tracking-wide bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent">
              {university.name}
            </h1>
            <div className="flex items-center gap-2 text-gray-400">
              <MapPin size={16} />
              <span>{university.location}</span>
            </div>
          </div>

          <div className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-2xl p-6 mb-6">
            <p className="text-white leading-relaxed">{university.description}</p>
          </div>
          
          {/* Key Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <UniversityStat
                key={stat.label}
                value={stat.value}
                label={stat.label}
                icon={stat.icon}
                delay={0.2 + index * 0.1}
                color={stat.color}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </>
  )
}
