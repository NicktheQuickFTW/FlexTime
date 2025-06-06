'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Trophy,
  Activity
} from 'lucide-react'
import { University } from '../../../../src/data/big12-universities-complete'

interface UniversityHeroProps {
  university: University
}

// University stat component
const UniversityStat = ({ 
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
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay }}
    className="bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-xl p-6 text-center hover:shadow-[0_12px_32px_rgba(0,191,255,0.15)] transition-all duration-300"
  >
    <div 
      className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center"
      style={{ 
        backgroundColor: `${color}20`,
        border: `1px solid ${color}30`
      }}
    >
      <Icon size={24} style={{ color }} />
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </motion.div>
)

export default function UniversityHero({ university }: UniversityHeroProps) {
  const teamStats = {
    total: university.teams.length,
    elite: university.teams.filter(t => t.performanceLevel === 'Elite').length,
    championships: university.teams.reduce((sum, t) => sum + (t.championships || 0), 0),
    rankedTeams: university.teams.filter(t => t.ranking && t.ranking <= 25).length
  }

  return (
    <div className="relative pt-24 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Back Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Link 
            href="/sports"
            className="inline-flex items-center gap-2 text-[color:var(--ft-neon)] hover:text-white transition-colors group"
          >
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Big 12 Schools
          </Link>
        </motion.div>

        {/* University Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-3xl p-8 mb-8 overflow-hidden"
        >
          {/* University color accent */}
          <div 
            className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl"
            style={{ backgroundColor: university.primaryColor }}
          />
          
          {/* Background glow */}
          <div 
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl opacity-5"
            style={{ backgroundColor: university.primaryColor }}
          />
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start gap-8">
              
              {/* Logo and basic info */}
              <div className="flex items-start gap-6">
                <motion.div
                  whileHover={{ rotate: 5, scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center p-3 flex-shrink-0"
                  style={{ borderColor: university.primaryColor + '40' }}
                >
                  <img 
                    src={`/logos/teams/${university.logoSlug}.svg`}
                    alt={`${university.name} logo`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/logos/placeholder.svg'
                    }}
                  />
                </motion.div>
                
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent uppercase tracking-wide">
                    {university.shortName || university.name.split(' ')[0]} {university.nickname}
                  </h1>
                  <h2 className="text-xl text-gray-300 mb-3">{university.name}</h2>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} />
                      {university.location}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      Founded {university.founded}
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={14} />
                      {university.enrollment} Students
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="flex-1 lg:text-right">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center lg:text-right">
                    <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{teamStats.total}</div>
                    <div className="text-xs text-gray-400">Sports</div>
                  </div>
                  <div className="text-center lg:text-right">
                    <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{teamStats.elite}</div>
                    <div className="text-xs text-gray-400">Elite Programs</div>
                  </div>
                  <div className="text-center lg:text-right">
                    <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{teamStats.championships}</div>
                    <div className="text-xs text-gray-400">Championships</div>
                  </div>
                  <div className="text-center lg:text-right">
                    <div className="text-2xl font-bold text-[color:var(--ft-neon)]">{teamStats.rankedTeams}</div>
                    <div className="text-xs text-gray-400">Ranked Teams</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* University Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <UniversityStat 
            value={university.enrollment} 
            label="Total Enrollment" 
            icon={Users} 
            delay={0.1}
            color={university.primaryColor}
          />
          <UniversityStat 
            value={university.founded} 
            label="Year Founded" 
            icon={Calendar} 
            delay={0.2}
            color={university.primaryColor}
          />
          <UniversityStat 
            value={`${university.conference} yrs`} 
            label="In Big 12" 
            icon={Trophy} 
            delay={0.3}
            color={university.primaryColor}
          />
          <UniversityStat 
            value={university.totalSports || teamStats.total} 
            label="Sports Programs" 
            icon={Activity} 
            delay={0.4}
            color={university.primaryColor}
          />
        </div>
      </div>
    </div>
  )
}