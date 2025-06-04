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
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import { FTGanttMatrixViews } from '@/src/components/builder/FTGanttMatrixViews'
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
  Save,
  Grid3X3,
  GanttChart,
  List,
  Layout,
  Home
} from 'lucide-react'

// Sports data
const sports = [
  { id: 'football', name: 'Football', season: 'Fall', icon: '🏈', teams: 16 },
  { id: 'basketball-m', name: "Men's Basketball", season: 'Winter', icon: '🏀', teams: 16 },
  { id: 'basketball-w', name: "Women's Basketball", season: 'Winter', icon: '🏀', teams: 16 },
  { id: 'baseball', name: 'Baseball', season: 'Spring', icon: '⚾', teams: 14 },
  { id: 'softball', name: 'Softball', season: 'Spring', icon: '🥎', teams: 11 },
  { id: 'soccer', name: 'Soccer', season: 'Fall', icon: '⚽', teams: 16 }
]

// Sample games data for calendar
const generateSampleGames = () => {
  const games = []
  const today = new Date()
  
  for (let i = 0; i < 20; i++) {
    const gameDate = new Date(today)
    gameDate.setDate(today.getDate() + i * 4)
    
    games.push({
      day: gameDate,
      events: [{
        id: i,
        name: `Game ${i + 1}`,
        time: `${Math.floor(Math.random() * 4) + 12}:${Math.random() > 0.5 ? '00' : '30'} PM`,
        datetime: gameDate.toISOString()
      }]
    })
  }
  
  return games
}

// Builder tools
const builderTools = [
  { icon: <Calendar className="w-5 h-5" />, color: 'blue', label: 'Calendar View' },
  { icon: <GanttChart className="w-5 h-5" />, color: 'green', label: 'Gantt Chart' },
  { icon: <Grid3X3 className="w-5 h-5" />, color: 'purple', label: 'Matrix View' },
  { icon: <MapPin className="w-5 h-5" />, color: 'orange', label: 'Venue Manager' },
  { icon: <Users className="w-5 h-5" />, color: 'red', label: 'Team Manager' },
  { icon: <Trophy className="w-5 h-5" />, color: 'indigo', label: 'Championships' }
]

interface FTBuilderCompleteProps {
  className?: string
}

export function FTBuilderComplete({ className }: FTBuilderCompleteProps) {
  const [selectedSport, setSelectedSport] = useState('football')
  const [viewMode, setViewMode] = useState<'calendar' | 'gantt' | 'matrix' | 'list'>('calendar')
  const [ganttMatrixMode, setGanttMatrixMode] = useState<'gantt' | 'matrix'>('gantt')
  const [isGenerating, setIsGenerating] = useState(false)
  const [gamesData] = useState(generateSampleGames())
  const [isFullscreen, setIsFullscreen] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsGenerating(false)
  }

  const viewModes = [
    { id: 'calendar', name: 'Calendar View', icon: Calendar, description: 'Monthly calendar with games' },
    { id: 'gantt', name: 'Gantt View', icon: GanttChart, description: 'Timeline project view' },
    { id: 'matrix', name: 'Matrix View', icon: Grid3X3, description: 'Team vs team grid' },
    { id: 'list', name: 'List View', icon: List, description: 'Simple game list' }
  ]

  return (
    <div className={`min-h-screen bg-black text-white relative overflow-hidden ${className}`}>
      
      {/* Background Effects */}
      {!isFullscreen && (
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-cyan-400/20 rotate-45"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-cyan-400/10 rotate-12"></div>
        </div>
      )}

      {/* Header */}
      {!isFullscreen && (
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 p-6 border-b border-white/10 bg-black/50 backdrop-blur-xl"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="hero-title text-3xl font-bold text-white mb-2">
                FT BUILDER SUITE
              </h1>
              <p className="text-sm text-gray-400">
                Complete scheduling solution with Calendar, Gantt, and Matrix views
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <FlexTimeSecondaryButton 
                className="px-4 py-2"
                onClick={() => setIsFullscreen(true)}
              >
                <Layout className="w-4 h-4 mr-2" />
                Fullscreen
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
      )}

      {/* Builder Tools Slider */}
      {!isFullscreen && (
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 py-6 border-b border-white/5"
        >
          <div className="max-w-7xl mx-auto px-6 mb-4">
            <h3 className="text-lg font-semibold text-cyan-400 mb-2">Builder Tools</h3>
          </div>
          <InfiniteSlider duration={25} durationOnHover={40} className="py-4">
            {builderTools.map((tool, index) => (
              <motion.div
                key={`${tool.label}-${index}`}
                className="mx-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (tool.label === 'Calendar View') setViewMode('calendar')
                  if (tool.label === 'Gantt Chart') setViewMode('gantt')
                  if (tool.label === 'Matrix View') setViewMode('matrix')
                }}
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
      )}

      {/* Main Content */}
      <div className={`${isFullscreen ? 'p-0' : 'max-w-7xl mx-auto p-6'} relative z-10`}>
        
        {!isFullscreen ? (
          <div className="grid grid-cols-12 gap-6">
            
            {/* Left Sidebar */}
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-3 space-y-6"
            >
              {/* View Mode Selection */}
              <FlexTimeNeonCard
                title="View Mode"
                subtitle="Choose display type"
                icon={<Eye className="w-6 h-6" />}
              >
                <div className="space-y-2">
                  {viewModes.map((mode) => {
                    const IconComponent = mode.icon
                    return (
                      <motion.button
                        key={mode.id}
                        onClick={() => setViewMode(mode.id as any)}
                        className={`w-full p-3 rounded-lg transition-all text-left ${
                          viewMode === mode.id
                            ? 'bg-cyan-400/20 border border-cyan-400/50'
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <IconComponent className="w-4 h-4 text-cyan-400" />
                          <div>
                            <div className="font-semibold text-sm">{mode.name}</div>
                            <div className="text-xs text-white/60">{mode.description}</div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </FlexTimeNeonCard>

              {/* Sport Selection */}
              <FlexTimeGlassCard
                title="Select Sport"
                subtitle="Choose sport to schedule"
                icon={<Trophy className="w-6 h-6" />}
              >
                <div className="space-y-2">
                  {sports.slice(0, 3).map((sport) => (
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
                          <div className="text-xs text-white/60">{sport.teams} teams</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </FlexTimeGlassCard>

              {/* Quick Stats */}
              <FlexTimeFrostedCard
                title="Schedule Stats"
                subtitle="Current metrics"
                icon={<BarChart3 className="w-6 h-6" />}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">{gamesData.length}</div>
                    <div className="text-xs text-white/60">Games Scheduled</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">16</div>
                    <div className="text-xs text-white/60">Teams Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">3</div>
                    <div className="text-xs text-white/60">Conflicts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-400">78%</div>
                    <div className="text-xs text-white/60">Complete</div>
                  </div>
                </div>
              </FlexTimeFrostedCard>
            </motion.aside>

            {/* Main Content Area */}
            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="col-span-9"
            >
              <AnimatePresence mode="wait">
                {/* Calendar View */}
                {viewMode === 'calendar' && (
                  <motion.div
                    key="calendar"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FlexTimeFrostedCard className="h-[700px] overflow-hidden">
                      <div className="h-full bg-white/5 rounded-lg">
                        <FullScreenCalendar data={gamesData} />
                      </div>
                    </FlexTimeFrostedCard>
                  </motion.div>
                )}

                {/* Gantt/Matrix Views */}
                {(viewMode === 'gantt' || viewMode === 'matrix') && (
                  <motion.div
                    key="gantt-matrix"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FTGanttMatrixViews 
                      viewMode={viewMode === 'gantt' ? 'gantt' : 'matrix'}
                      onViewChange={(mode) => setViewMode(mode)}
                    />
                  </motion.div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <motion.div
                    key="list"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FlexTimeFrostedCard
                      title="Schedule List View"
                      subtitle="Chronological game listing"
                      icon={<List className="w-6 h-6" />}
                      className="h-[700px]"
                    >
                      <div className="h-full flex flex-col items-center justify-center text-center">
                        <List className="w-16 h-16 text-cyan-400 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">List View</h3>
                        <p className="text-white/60 mb-6 max-w-md">
                          Simple chronological listing of all scheduled games with filtering options.
                        </p>
                        <FlexTimeNeonButton className="px-6 py-3">
                          <Plus className="w-4 h-4 mr-2" />
                          Coming Soon
                        </FlexTimeNeonButton>
                      </div>
                    </FlexTimeFrostedCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.main>
          </div>
        ) : (
          // Fullscreen Mode
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-screen bg-black/95 backdrop-blur-xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h1 className="text-lg font-semibold bg-gradient-to-r from-black to-[color:var(--ft-neon)] bg-clip-text text-transparent">
                FlexTime Builder - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
              </h1>
              <FlexTimeSecondaryButton 
                className="px-4 py-2"
                onClick={() => setIsFullscreen(false)}
              >
                <Home className="w-4 h-4 mr-2" />
                Exit Fullscreen
              </FlexTimeSecondaryButton>
            </div>
            
            <div className="h-[calc(100vh-73px)]">
              {viewMode === 'calendar' && <FullScreenCalendar data={gamesData} />}
              {(viewMode === 'gantt' || viewMode === 'matrix') && (
                <div className="p-6">
                  <FTGanttMatrixViews 
                    viewMode={viewMode === 'gantt' ? 'gantt' : 'matrix'}
                    onViewChange={(mode) => setViewMode(mode)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Status Bar */}
      {!isFullscreen && (
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
                <span className="text-white/60">Builder Active</span>
              </div>
              <div className="text-white/60">
                View: <span className="text-cyan-400 font-semibold capitalize">{viewMode}</span>
              </div>
              <div className="text-white/60">
                Sport: <span className="text-cyan-400 font-semibold">
                  {sports.find(s => s.id === selectedSport)?.name}
                </span>
              </div>
            </div>
            <div className="text-xs bg-gradient-to-r from-black to-[color:var(--ft-neon)] bg-clip-text text-transparent opacity-70">
              FlexTime Builder Suite • Complete Scheduling Platform
            </div>
          </div>
        </motion.footer>
      )}
    </div>
  )
}