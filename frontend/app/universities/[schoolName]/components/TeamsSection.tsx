'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Activity,
  Crown,
  Medal,
  Award,
  TrendingUp
} from 'lucide-react'
import { University, Team } from '../../../../src/data/big12-universities-complete'

interface TeamsSectionProps {
  university: University
}

// 21st-dev inspired team card component
const TeamCard = ({ 
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
                <div className="text-sm font-bold text-[color:var(--ft-neon)]">{team.recentRecord}</div>
                <div className="text-xs text-gray-400">Record</div>
              </div>
            )}
            {team.ranking && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-sm font-bold text-[color:var(--ft-neon)]">#{team.ranking}</div>
                <div className="text-xs text-gray-400">Ranking</div>
              </div>
            )}
            {team.championships && team.championships > 0 && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-sm font-bold text-[color:var(--ft-neon)]">{team.championships}</div>
                <div className="text-xs text-gray-400">Titles</div>
              </div>
            )}
            {team.conference && (
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="text-sm font-bold text-[color:var(--ft-neon)]">{team.conference}</div>
                <div className="text-xs text-gray-400">Conference</div>
              </div>
            )}
          </div>

          {/* Coach */}
          {team.headCoach && (
            <div className="mb-4">
              <div className="text-xs text-gray-400 font-medium mb-1">Head Coach:</div>
              <div className="text-sm text-gray-300">{team.headCoach}</div>
            </div>
          )}

          {/* Notable Achievements */}
          {team.notableAchievements && team.notableAchievements.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs text-gray-400 font-medium">Recent Achievements:</div>
              {team.notableAchievements.slice(0, 2).map((achievement: string, i: number) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="flex items-center gap-2 text-sm text-gray-300"
                >
                  <div className="w-1 h-1 rounded-full bg-[color:var(--ft-neon)]" />
                  {achievement}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Hover glow effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: isHovered ? 0.1 : 0, scale: isHovered ? 1.1 : 0.8 }}
          transition={{ duration: 0.3 }}
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl pointer-events-none"
          style={{ backgroundColor: universityColors.primary }}
        />
      </motion.div>
    </motion.div>
  )
}

export default function TeamsSection({ university }: TeamsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Filter teams based on category and search
  const categories = ['all', 'football', 'basketball', 'baseball', 'olympic']
  
  const filteredTeams = university.teams.filter(team => {
    const matchesSearch = team.sport.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      (selectedCategory === 'football' && team.sport.toLowerCase().includes('football')) ||
      (selectedCategory === 'basketball' && team.sport.toLowerCase().includes('basketball')) ||
      (selectedCategory === 'baseball' && team.sport.toLowerCase().includes('baseball')) ||
      (selectedCategory === 'olympic' && !['football', 'basketball', 'baseball'].some(s => team.sport.toLowerCase().includes(s)))
    
    return matchesSearch && matchesCategory
  })

  return (
    <div className="relative pb-16">
      <div className="max-w-7xl mx-auto px-6">
        {/* Teams Section */}
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
      </div>
    </div>
  )
}