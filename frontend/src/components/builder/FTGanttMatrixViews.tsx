'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/concepts/table/table"
import { 
  FlexTimeCard, 
  FlexTimeNeonCard, 
  FlexTimeGlassCard 
} from '@/src/components/ui/FlexTimeCard'
import { 
  Calendar, 
  GanttChart, 
  Grid3X3, 
  Clock,
  MapPin,
  Users,
  Check,
  X,
  Eye,
  Edit3,
  MoreVertical
} from 'lucide-react'

// Big 12 teams data
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
  { id: 12, name: 'TCU', shortName: 'TCU', color: '#4D1979', logo: '🐸' }
]

// Generate weeks for Gantt chart
const generateWeeks = () => {
  const weeks = []
  const startDate = new Date('2024-09-01') // Start of season
  
  for (let i = 0; i < 16; i++) { // 16-week season
    const weekStart = new Date(startDate)
    weekStart.setDate(startDate.getDate() + (i * 7))
    weeks.push({
      id: i + 1,
      label: `Week ${i + 1}`,
      date: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: weekStart
    })
  }
  
  return weeks
}

// Generate team schedule matrix
const generateTeamMatrix = () => {
  const matrix: any = {}
  big12Teams.forEach(team => {
    matrix[team.id] = {}
    big12Teams.forEach(opponent => {
      if (team.id !== opponent.id) {
        // Randomly assign some games
        matrix[team.id][opponent.id] = Math.random() > 0.8 ? {
          scheduled: true,
          week: Math.floor(Math.random() * 16) + 1,
          homeGame: Math.random() > 0.5,
          venue: Math.random() > 0.5 ? 'Home' : 'Away'
        } : null
      }
    })
  })
  return matrix
}

// Generate Gantt chart data
const generateGanttData = () => {
  const weeks = generateWeeks()
  return big12Teams.map(team => {
    const games = weeks.map(week => {
      // Random chance of having a game this week
      if (Math.random() > 0.7) {
        const opponent = big12Teams.find(t => t.id !== team.id && Math.random() > 0.5)
        return {
          week: week.id,
          opponent: opponent?.shortName || 'BYE',
          isHome: Math.random() > 0.5,
          venue: Math.random() > 0.5 ? 'Home' : 'Away',
          status: Math.random() > 0.8 ? 'conflict' : 'scheduled'
        }
      }
      return null
    })
    
    return {
      team,
      games: games.filter(Boolean)
    }
  })
}

interface ViewProps {
  viewMode: 'gantt' | 'matrix'
  onViewChange: (mode: 'gantt' | 'matrix') => void
}

export function FTGanttMatrixViews({ viewMode, onViewChange }: ViewProps) {
  const [weeks] = useState(generateWeeks())
  const [ganttData] = useState(generateGanttData())
  const [matrixData] = useState(generateTeamMatrix())

  return (
    <div className="space-y-6">
      
      {/* View Toggle */}
      <div className="flex gap-4">
        <motion.button
          onClick={() => onViewChange('gantt')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'gantt'
              ? 'bg-cyan-400 text-black'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <GanttChart className="w-4 h-4" />
          Gantt View
        </motion.button>
        
        <motion.button
          onClick={() => onViewChange('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'matrix'
              ? 'bg-cyan-400 text-black'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Grid3X3 className="w-4 h-4" />
          Matrix View
        </motion.button>
      </div>

      {/* Gantt Chart View */}
      {viewMode === 'gantt' && (
        <FlexTimeGlassCard
          title="Schedule Gantt Chart"
          subtitle="Timeline view of all team schedules"
          icon={<GanttChart className="w-6 h-6" />}
          className="overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table className="bg-white/5">
              <TableHeader>
                <TableRow className="border-y-0 *:border-white/20 hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableHead className="sticky left-0 bg-black/50 backdrop-blur-xl min-w-[120px]">
                    Team
                  </TableHead>
                  {weeks.map((week) => (
                    <TableHead 
                      key={week.id} 
                      className="text-center min-w-[80px] text-cyan-400 font-semibold"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs">{week.label}</span>
                        <span className="text-xs text-white/60">{week.date}</span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {ganttData.map((teamData) => (
                  <TableRow 
                    key={teamData.team.id} 
                    className="*:border-white/20 hover:bg-white/5 [&>:not(:last-child)]:border-r"
                  >
                    <TableCell className="sticky left-0 bg-black/50 backdrop-blur-xl font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{teamData.team.logo}</span>
                        <div>
                          <div className="font-semibold text-white">{teamData.team.shortName}</div>
                          <div className="text-xs text-white/60">{teamData.team.name}</div>
                        </div>
                      </div>
                    </TableCell>
                    {weeks.map((week) => {
                      const game = teamData.games.find(g => g?.week === week.id)
                      return (
                        <TableCell key={week.id} className="text-center p-2">
                          {game ? (
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              game.status === 'conflict' 
                                ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                                : game.isHome
                                ? 'bg-cyan-400/20 text-cyan-400 border border-cyan-400/50'
                                : 'bg-white/10 text-white border border-white/20'
                            }`}>
                              <div className="font-semibold">{game.opponent}</div>
                              <div className="text-xs opacity-70">
                                {game.isHome ? 'HOME' : 'AWAY'}
                              </div>
                            </div>
                          ) : (
                            <div className="text-white/30 text-xs">BYE</div>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </FlexTimeGlassCard>
      )}

      {/* Matrix View */}
      {viewMode === 'matrix' && (
        <FlexTimeGlassCard
          title="Team vs Team Matrix"
          subtitle="Head-to-head scheduling grid"
          icon={<Grid3X3 className="w-6 h-6" />}
          className="overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table className="bg-white/5">
              <TableHeader>
                <TableRow className="border-y-0 *:border-white/20 hover:bg-transparent [&>:not(:last-child)]:border-r">
                  <TableHead className="sticky left-0 bg-black/50 backdrop-blur-xl">
                    Teams
                  </TableHead>
                  {big12Teams.map((team) => (
                    <TableHead 
                      key={team.id} 
                      className="h-auto rotate-180 py-3 text-cyan-400 [writing-mode:vertical-lr] min-w-[60px]"
                    >
                      {team.shortName}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {big12Teams.map((homeTeam) => (
                  <TableRow 
                    key={homeTeam.id} 
                    className="*:border-white/20 hover:bg-white/5 [&>:not(:last-child)]:border-r"
                  >
                    <TableHead className="sticky left-0 bg-black/50 backdrop-blur-xl font-medium">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{homeTeam.logo}</span>
                        <div>
                          <div className="font-semibold text-white">{homeTeam.shortName}</div>
                          <div className="text-xs text-white/60">{homeTeam.name}</div>
                        </div>
                      </div>
                    </TableHead>
                    {big12Teams.map((awayTeam) => (
                      <TableCell key={awayTeam.id} className="text-center p-2">
                        {homeTeam.id === awayTeam.id ? (
                          <div className="w-6 h-6 bg-white/20 rounded-full mx-auto"></div>
                        ) : (
                          <div className="space-y-1">
                            {matrixData[homeTeam.id]?.[awayTeam.id] ? (
                              <div className="space-y-1">
                                <Check
                                  className="inline-flex stroke-green-400 mx-auto"
                                  size={16}
                                  strokeWidth={2}
                                />
                                <div className="text-xs">
                                  <div className="text-cyan-400 font-semibold">
                                    W{matrixData[homeTeam.id][awayTeam.id].week}
                                  </div>
                                  <div className="text-white/60">
                                    {matrixData[homeTeam.id][awayTeam.id].venue}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <X
                                className="inline-flex stroke-red-400 mx-auto opacity-50"
                                size={16}
                                strokeWidth={2}
                              />
                            )}
                          </div>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </FlexTimeGlassCard>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FlexTimeNeonCard
          title="Schedule Completion"
          subtitle="Overall progress"
          icon={<Calendar className="w-6 h-6" />}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-cyan-400 mb-2">78%</div>
            <div className="text-sm text-white/60">Games Scheduled</div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-3">
              <div className="bg-cyan-400 h-2 rounded-full" style={{width: '78%'}}></div>
            </div>
          </div>
        </FlexTimeNeonCard>

        <FlexTimeGlassCard
          title="Conflicts Detected"
          subtitle="Scheduling issues"
          icon={<Clock className="w-6 h-6" />}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-red-400 mb-2">3</div>
            <div className="text-sm text-white/60">Conflicts to Resolve</div>
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                Action Required
              </span>
            </div>
          </div>
        </FlexTimeGlassCard>

        <FlexTimeGlassCard
          title="Venue Utilization"
          subtitle="Stadium usage"
          icon={<MapPin className="w-6 h-6" />}
        >
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">92%</div>
            <div className="text-sm text-white/60">Optimal Usage</div>
            <div className="w-full bg-white/10 rounded-full h-2 mt-3">
              <div className="bg-green-400 h-2 rounded-full" style={{width: '92%'}}></div>
            </div>
          </div>
        </FlexTimeGlassCard>
      </div>
    </div>
  )
}