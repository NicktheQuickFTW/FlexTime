'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { InfiniteSlider } from '@/src/components/concepts/infinite-slider'
import { 
  FlexTimeCard, 
  FlexTimeNeonCard, 
  FlexTimeGlassCard, 
  FlexTimeFrostedCard 
} from '@/src/components/ui/FlexTimeCard'
import { FlexTimePrimaryButton, FlexTimeSecondaryButton, FlexTimeNeonButton } from '@/src/components/ui/FlexTimeShinyButton'
import { Component as GlassIcons } from '@/components/ui/glass-icons'
import { 
  Calendar, 
  Zap, 
  Trophy, 
  Users, 
  Settings, 
  BarChart3, 
  Shield, 
  Clock,
  Plus,
  Filter,
  Search,
  MapPin,
  Star,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Eye,
  Edit3,
  Save
} from 'lucide-react'

// Mock data for Big 12 teams
const big12Teams = [
  { id: 1, name: 'Arizona', shortName: 'ARIZ', color: '#003366', logo: '🐻' },
  { id: 2, name: 'Arizona State', shortName: 'ASU', color: '#8C1D40', logo: '😈' },
  { id: 3, name: 'Baylor', shortName: 'BAY', color: '#003015', logo: '🐻' },
  { id: 4, name: 'BYU', shortName: 'BYU', color: '#002E5D', logo: '🦅' },
  { id: 5, name: 'Cincinnati', shortName: 'CIN', color: '#E00122', logo: '🐻' },
  { id: 6, name: 'Colorado', shortName: 'COL', color: '#CFB87C', logo: '🦬' },
  { id: 7, name: 'Houston', shortName: 'HOU', color: '#C8102E', logo: '🐆' },
  { id: 8, name: 'Iowa State', shortName: 'ISU', color: '#C8102E', logo: '🌪️' },
  { id: 9, name: 'Kansas', shortName: 'KU', color: '#0051BA', logo: '🐦' },
  { id: 10, name: 'Kansas State', shortName: 'KSU', color: '#512888', logo: '🐾' },
  { id: 11, name: 'Oklahoma State', shortName: 'OSU', color: '#FF7300', logo: '🤠' },
  { id: 12, name: 'TCU', shortName: 'TCU', color: '#4D1979', logo: '🐸' },
  { id: 13, name: 'Texas Tech', shortName: 'TTU', color: '#CC0000', logo: '⚡' },
  { id: 14, name: 'UCF', shortName: 'UCF', color: '#FFC904', logo: '⚔️' },
  { id: 15, name: 'Utah', shortName: 'UTE', color: '#CC0000', logo: '🏔️' },
  { id: 16, name: 'West Virginia', shortName: 'WVU', color: '#002855', logo: '⛰️' }
]

// Sports data
const sports = [
  { id: 'football', name: 'Football', season: 'Fall', icon: '🏈', teams: 16 },
  { id: 'basketball-m', name: "Men's Basketball", season: 'Winter', icon: '🏀', teams: 16 },
  { id: 'basketball-w', name: "Women's Basketball", season: 'Winter', icon: '🏀', teams: 16 },
  { id: 'baseball', name: 'Baseball', season: 'Spring', icon: '⚾', teams: 14 },
  { id: 'softball', name: 'Softball', season: 'Spring', icon: '🥎', teams: 11 },
  { id: 'soccer', name: 'Soccer', season: 'Fall', icon: '⚽', teams: 16 }
]

// Builder tools
const builderTools = [
  { icon: <Calendar className="w-5 h-5" />, color: 'blue', label: 'Calendar' },
  { icon: <MapPin className="w-5 h-5" />, color: 'green', label: 'Venues' },
  { icon: <Users className="w-5 h-5" />, color: 'purple', label: 'Teams' },
  { icon: <Trophy className="w-5 h-5" />, color: 'orange', label: 'Championships' },
  { icon: <Settings className="w-5 h-5" />, color: 'red', label: 'Constraints' },
  { icon: <BarChart3 className="w-5 h-5" />, color: 'indigo', label: 'Analytics' }
]

interface FTBuilderProps {
  className?: string
}

export function FTBuilder({ className }: FTBuilderProps) {
  const [selectedSport, setSelectedSport] = useState('football')
  const [builderMode, setBuilderMode] = useState<'design' | 'optimize' | 'preview'>('design')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showTeamDetails, setShowTeamDetails] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsGenerating(false)
  }

  return (
    <div className={`min-h-screen bg-black text-white relative overflow-hidden ${className}`}>
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-cyan-400/20 rotate-45"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-cyan-400/10 rotate-12"></div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 p-6 border-b border-white/10 bg-black/50 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="hero-title text-3xl font-bold text-white mb-2">
              FT BUILDER
            </h1>
            <p className="text-sm text-gray-400">
              Next-generation AI-powered schedule builder for Big 12 Conference
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <FlexTimeSecondaryButton className="px-4 py-2">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </FlexTimeSecondaryButton>
            <FlexTimeSecondaryButton className="px-4 py-2">
              <Download className="w-4 h-4 mr-2" />
              Export
            </FlexTimeSecondaryButton>
            <FlexTimePrimaryButton 
              className="px-6 py-2"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.div>
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Generate Schedule
                </>
              )}
            </FlexTimePrimaryButton>
          </div>
        </div>
      </motion.header>

      {/* Builder Tools Slider */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 py-6 border-b border-white/5"
      >
        <div className="max-w-7xl mx-auto px-6 mb-4">
          <h3 className="text-lg font-semibold text-cyan-400 mb-2">Builder Tools</h3>
        </div>
        <InfiniteSlider duration={30} durationOnHover={60} className="py-4">
          {builderTools.map((tool, index) => (
            <motion.div
              key={`${tool.label}-${index}`}
              className="mx-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FlexTimeGlassCard className="w-32 h-32 p-4 cursor-pointer">
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="mb-3 text-cyan-400">
                    {tool.icon}
                  </div>
                  <span className="text-xs font-medium text-center">{tool.label}</span>
                </div>
              </FlexTimeGlassCard>
            </motion.div>
          ))}
        </InfiniteSlider>
      </motion.section>

      {/* Main Builder Interface */}
      <div className="max-w-7xl mx-auto p-6 grid grid-cols-12 gap-6 relative z-10">
        
        {/* Left Sidebar - Sports & Teams */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="col-span-3 space-y-6"
        >
          {/* Sport Selection */}
          <FlexTimeNeonCard
            title="Select Sport"
            subtitle="Choose sport to schedule"
            icon={<Trophy className="w-6 h-6" />}
          >
            <div className="space-y-2">
              {sports.map((sport) => (
                <motion.button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className={`w-full p-3 rounded-lg transition-all text-left ${
                    selectedSport === sport.id
                      ? 'bg-cyan-400/20 border border-cyan-400/50'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{sport.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{sport.name}</div>
                      <div className="text-xs text-white/60">{sport.teams} teams • {sport.season}</div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </FlexTimeNeonCard>

          {/* Teams Panel */}
          <FlexTimeGlassCard
            title="Big 12 Teams"
            subtitle="16 member universities"
            icon={<Users className="w-6 h-6" />}
          >
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {big12Teams.map((team) => (
                <motion.div
                  key={team.id}
                  className="flex items-center gap-3 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  whileHover={{ x: 4 }}
                >
                  <span className="text-lg">{team.logo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{team.name}</div>
                    <div className="text-xs text-white/60">{team.shortName}</div>
                  </div>
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                </motion.div>
              ))}
            </div>
          </FlexTimeGlassCard>
        </motion.aside>

        {/* Center - Schedule Canvas */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="col-span-6"
        >
          <FlexTimeFrostedCard
            title="Schedule Canvas"
            subtitle="Drag & drop schedule builder"
            icon={<Calendar className="w-6 h-6" />}
            className="h-[600px]"
          >
            <div className="h-full relative">
              {/* Mode Switcher */}
              <div className="flex gap-2 mb-4">
                {['design', 'optimize', 'preview'].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBuilderMode(mode as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      builderMode === mode
                        ? 'bg-cyan-400 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {mode === 'design' && <Edit3 className="w-4 h-4 mr-2 inline" />}
                    {mode === 'optimize' && <Zap className="w-4 h-4 mr-2 inline" />}
                    {mode === 'preview' && <Eye className="w-4 h-4 mr-2 inline" />}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>

              {/* Canvas Content */}
              <div className="flex-1 bg-white/5 rounded-lg p-6 border-2 border-dashed border-white/20 min-h-[400px] relative">
                <AnimatePresence mode="wait">
                  {builderMode === 'design' && (
                    <motion.div
                      key="design"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="h-full flex flex-col items-center justify-center text-center"
                    >
                      <Calendar className="w-16 h-16 text-cyan-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Design Mode</h3>
                      <p className="text-white/60 mb-6 max-w-md">
                        Drag teams, set dates, and manually arrange your schedule structure.
                      </p>
                      <FlexTimeNeonButton className="px-6 py-3">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Game
                      </FlexTimeNeonButton>
                    </motion.div>
                  )}

                  {builderMode === 'optimize' && (
                    <motion.div
                      key="optimize"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="h-full flex flex-col items-center justify-center text-center"
                    >
                      <Zap className="w-16 h-16 text-cyan-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">AI Optimization</h3>
                      <p className="text-white/60 mb-6 max-w-md">
                        Let HELiiX Intelligence Engine automatically optimize your schedule using advanced algorithms.
                      </p>
                      <FlexTimePrimaryButton 
                        className="px-6 py-3"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                      >
                        <Zap className="w-4 h-4 mr-2" />
                        Start Optimization
                      </FlexTimePrimaryButton>
                    </motion.div>
                  )}

                  {builderMode === 'preview' && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="h-full flex flex-col items-center justify-center text-center"
                    >
                      <Eye className="w-16 h-16 text-cyan-400 mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Preview & Export</h3>
                      <p className="text-white/60 mb-6 max-w-md">
                        Review your completed schedule and export in multiple formats.
                      </p>
                      <div className="flex gap-3">
                        <FlexTimeSecondaryButton className="px-4 py-2">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </FlexTimeSecondaryButton>
                        <FlexTimeSecondaryButton className="px-4 py-2">
                          <Save className="w-4 h-4 mr-2" />
                          Save Draft
                        </FlexTimeSecondaryButton>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </FlexTimeFrostedCard>
        </motion.main>

        {/* Right Sidebar - AI & Controls */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="col-span-3 space-y-6"
        >
          {/* AI Assistant */}
          <FlexTimeNeonCard
            title="HELiiX Assistant"
            subtitle="AI scheduling agent"
            icon={<Zap className="w-6 h-6" />}
          >
            <div className="space-y-4">
              <div className="p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-400">ONLINE</span>
                </div>
                <p className="text-sm text-white/80">
                  Ready to optimize your {sports.find(s => s.id === selectedSport)?.name} schedule.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Constraint Compliance</span>
                  <span className="font-mono text-cyan-400">98.7%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Travel Optimization</span>
                  <span className="font-mono text-cyan-400">94.3%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Venue Utilization</span>
                  <span className="font-mono text-cyan-400">89.1%</span>
                </div>
              </div>
            </div>
          </FlexTimeNeonCard>

          {/* Quick Actions */}
          <FlexTimeGlassCard
            title="Quick Actions"
            subtitle="Builder shortcuts"
            icon={<Settings className="w-6 h-6" />}
          >
            <div className="space-y-3">
              <FlexTimeSecondaryButton className="w-full justify-start px-4 py-3">
                <Filter className="w-4 h-4 mr-3" />
                Set Constraints
              </FlexTimeSecondaryButton>
              <FlexTimeSecondaryButton className="w-full justify-start px-4 py-3">
                <MapPin className="w-4 h-4 mr-3" />
                Manage Venues
              </FlexTimeSecondaryButton>
              <FlexTimeSecondaryButton className="w-full justify-start px-4 py-3">
                <Clock className="w-4 h-4 mr-3" />
                Set Blackout Dates
              </FlexTimeSecondaryButton>
              <FlexTimeSecondaryButton className="w-full justify-start px-4 py-3">
                <BarChart3 className="w-4 h-4 mr-3" />
                View Analytics
              </FlexTimeSecondaryButton>
            </div>
          </FlexTimeGlassCard>

          {/* Schedule Stats */}
          <FlexTimeFrostedCard
            title="Schedule Stats"
            subtitle="Current metrics"
            icon={<BarChart3 className="w-6 h-6" />}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">0</div>
                <div className="text-xs text-white/60">Games Scheduled</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">16</div>
                <div className="text-xs text-white/60">Teams Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">0</div>
                <div className="text-xs text-white/60">Conflicts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-400">100%</div>
                <div className="text-xs text-white/60">Completion</div>
              </div>
            </div>
          </FlexTimeFrostedCard>
        </motion.aside>
      </div>

      {/* Bottom Status Bar */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="relative z-10 p-4 border-t border-white/10 bg-black/50 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/60">System Online</span>
            </div>
            <div className="text-white/60">
              Sport: <span className="text-cyan-400 font-semibold">
                {sports.find(s => s.id === selectedSport)?.name}
              </span>
            </div>
            <div className="text-white/60">
              Mode: <span className="text-cyan-400 font-semibold capitalize">{builderMode}</span>
            </div>
          </div>
          <div className="text-xs bg-gradient-to-r from-black to-[color:var(--ft-neon)] bg-clip-text text-transparent opacity-70">
            FlexTime Builder v2.0 • HELiiX Intelligence Engine
          </div>
        </div>
      </motion.footer>
    </div>
  )
}