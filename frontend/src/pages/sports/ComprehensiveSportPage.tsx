'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Users, 
  BarChart3, 
  FileText, 
  Settings, 
  Trophy, 
  MapPin,
  Download,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  Phone
} from 'lucide-react'
import { scheduleApi } from '../../utils/scheduleApi'

interface ComprehensiveSportPageProps {
  sportId: number
  sportName: string
}

interface TabConfig {
  id: string
  label: string
  icon: React.ReactNode
  userTypes: ('coach' | 'admin' | 'conference')[]
}

const TABS: TabConfig[] = [
  { id: 'overview', label: 'Overview', icon: <Trophy className="w-4 h-4" />, userTypes: ['coach', 'admin', 'conference'] },
  { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" />, userTypes: ['coach', 'admin', 'conference'] },
  { id: 'teams', label: 'Teams', icon: <Users className="w-4 h-4" />, userTypes: ['coach', 'admin', 'conference'] },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" />, userTypes: ['admin', 'conference'] },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" />, userTypes: ['admin', 'conference'] },
  { id: 'admin', label: 'Admin Tools', icon: <Settings className="w-4 h-4" />, userTypes: ['admin', 'conference'] },
]

const SPORT_CONFIGS = {
  'football': {
    season: 'Fall 2024',
    championship: 'Big 12 Championship Game',
    venues: 16,
    teams: 16,
    games: 72,
    primaryColor: '#FF7300',
    gradient: 'from-orange-500 to-red-600'
  },
  'mens-basketball': {
    season: '2024-25',
    championship: 'Big 12 Tournament',
    venues: 16,
    teams: 16,
    games: 144,
    primaryColor: '#1e40af',
    gradient: 'from-blue-500 to-purple-600'
  },
  'baseball': {
    season: 'Spring 2025',
    championship: 'Big 12 Tournament',
    venues: 14,
    teams: 14,
    games: 168,
    primaryColor: '#059669',
    gradient: 'from-green-500 to-blue-500'
  },
  'volleyball': {
    season: 'Fall 2024',
    championship: 'Big 12 Tournament',
    venues: 15,
    teams: 15,
    games: 90,
    primaryColor: '#7c3aed',
    gradient: 'from-purple-500 to-pink-500'
  }
}

export default function ComprehensiveSportPage({ sportName }: ComprehensiveSportPageProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [userType, setUserType] = useState<'coach' | 'admin' | 'conference'>('coach')
  const [scheduleData, setScheduleData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const sportConfig = SPORT_CONFIGS[sportName as keyof typeof SPORT_CONFIGS] || SPORT_CONFIGS['football']

  useEffect(() => {
    loadData()
  }, [sportName])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const schedules = await scheduleApi.getSchedules(sportName)
      setScheduleData(schedules)
    } catch (error) {
      console.error('Error loading sport data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredTabs = TABS.filter(tab => tab.userTypes.includes(userType))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      
      {/* Sport Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative pt-24 pb-16 px-6"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/80 to-slate-900/90"></div>
        <div className="absolute inset-0 bg-[url('/patterns/hexagon-pattern.svg')] opacity-10"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center space-y-6 mb-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center space-x-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-8 py-4"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${sportConfig.gradient} flex items-center justify-center shadow-lg`}>
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Big 12 {sportName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h1>
                <p className="text-white/80 text-lg">{sportConfig.season} • {sportConfig.championship}</p>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{sportConfig.teams}</div>
                <div className="text-white/70 text-sm">Teams</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{sportConfig.venues}</div>
                <div className="text-white/70 text-sm">Venues</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{sportConfig.games}</div>
                <div className="text-white/70 text-sm">Games</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-[color:var(--ft-neon)] mb-2">98%</div>
                <div className="text-white/70 text-sm">Optimization</div>
              </div>
            </motion.div>
          </div>

          {/* User Type Selector */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-2 flex">
              {[
                { key: 'coach', label: 'Coach View', icon: <Users className="w-4 h-4" /> },
                { key: 'admin', label: 'Admin View', icon: <Settings className="w-4 h-4" /> },
                { key: 'conference', label: 'Conference View', icon: <Trophy className="w-4 h-4" /> }
              ].map(type => (
                <button
                  key={type.key}
                  onClick={() => setUserType(type.key as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 ${
                    userType === type.key
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {type.icon}
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Navigation Tabs */}
      <motion.section 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="sticky top-20 z-40 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10"
      >
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-1 overflow-x-auto py-4">
            {filteredTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg whitespace-nowrap transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-[color:var(--ft-neon)] text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && <OverviewSection sportName={sportName} sportConfig={sportConfig} />}
            {activeTab === 'schedule' && <ScheduleSection scheduleData={scheduleData} sportName={sportName} />}
            {activeTab === 'teams' && <TeamsSection sportName={sportName} />}
            {activeTab === 'analytics' && <AnalyticsSection sportName={sportName} />}
            {activeTab === 'documents' && <DocumentsSection sportName={sportName} />}
            {activeTab === 'admin' && <AdminToolsSection />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Overview Section Component  
function OverviewSection({ sportConfig }: { sportName: string, sportConfig: any }) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
            <button className="text-[color:var(--ft-neon)] hover:text-[color:var(--ft-neon)]/80 transition-colors">
              <ExternalLink className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { type: 'schedule', message: 'Schedule updated for Week 8', time: '2 hours ago', icon: <Calendar className="w-4 h-4" /> },
              { type: 'conflict', message: 'Conflict resolved: Kansas vs K-State', time: '4 hours ago', icon: <AlertTriangle className="w-4 h-4" /> },
              { type: 'venue', message: 'Venue capacity updated: Memorial Stadium', time: '6 hours ago', icon: <MapPin className="w-4 h-4" /> },
              { type: 'analytics', message: 'Weekly analytics report generated', time: '1 day ago', icon: <BarChart3 className="w-4 h-4" /> }
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className={`p-2 rounded-lg ${
                  activity.type === 'conflict' ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400' :
                  activity.type === 'schedule' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                  activity.type === 'venue' ? 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400'
                }`}>
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium">{activity.message}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-4">
            {[
              { label: 'Schedule Game', icon: <Calendar className="w-5 h-5" />, color: 'blue' },
              { label: 'View Conflicts', icon: <AlertTriangle className="w-5 h-5" />, color: 'red' },
              { label: 'Export Schedule', icon: <Download className="w-5 h-5" />, color: 'green' },
              { label: 'Contact Directory', icon: <Phone className="w-5 h-5" />, color: 'purple' }
            ].map((action, index) => (
              <button
                key={index}
                className={`w-full flex items-center space-x-3 p-4 rounded-xl transition-all duration-200 ${
                  action.color === 'blue' ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400' :
                  action.color === 'red' ? 'bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400' :
                  action.color === 'green' ? 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400' :
                  'bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400'
                }`}
              >
                {action.icon}
                <span className="font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Games */}
      <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Upcoming Games</h3>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-[color:var(--ft-neon)] text-white rounded-lg hover:bg-[color:var(--ft-neon)]/80 transition-colors">
              This Week
            </button>
            <button className="px-4 py-2 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
              All Games
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { homeTeam: 'Kansas', awayTeam: 'Kansas State', date: 'Nov 15', time: '7:00 PM', venue: 'Allen Fieldhouse' },
            { homeTeam: 'Texas Tech', awayTeam: 'Baylor', date: 'Nov 17', time: '8:00 PM', venue: 'United Supermarkets Arena' },
            { homeTeam: 'Arizona', awayTeam: 'Arizona State', date: 'Nov 19', time: '9:00 PM', venue: 'McKale Center' }
          ].map((game, index) => (
            <div key={index} className="bg-gray-50 dark:bg-white/5 rounded-xl p-6 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">{game.date} • {game.time}</div>
                <div className="w-2 h-2 bg-[color:var(--ft-neon)] rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900 dark:text-white">{game.awayTeam}</span>
                  <span className="text-gray-500 dark:text-gray-400">@</span>
                </div>
                <div className="font-semibold text-gray-900 dark:text-white">{game.homeTeam}</div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{game.venue}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Placeholder components for other sections
function ScheduleSection({ sportName }: { scheduleData: any[], sportName: string }) {
  return (
    <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Schedule Management</h3>
      <p className="text-gray-600 dark:text-gray-400">Schedule content for {sportName} will be implemented here.</p>
    </div>
  )
}

function TeamsSection({ sportName }: { sportName: string }) {
  return (
    <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Teams Directory</h3>
      <p className="text-gray-600 dark:text-gray-400">Teams content for {sportName} will be implemented here.</p>
    </div>
  )
}


function AnalyticsSection({ sportName }: { sportName: string }) {
  return (
    <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Analytics Dashboard</h3>
      <p className="text-gray-600 dark:text-gray-400">Analytics content for {sportName} will be implemented here.</p>
    </div>
  )
}

function DocumentsSection({ sportName }: { sportName: string }) {
  return (
    <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Documents & Resources</h3>
      <p className="text-gray-600 dark:text-gray-400">Documents content for {sportName} will be implemented here.</p>
    </div>
  )
}

function AdminToolsSection() {
  return (
    <div className="space-y-8">
      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: 'Schedule Game', 
            description: 'Create new game',
            icon: <Calendar className="w-6 h-6" />, 
            color: 'blue',
            action: 'primary'
          },
          { 
            title: 'Resolve Conflicts', 
            description: '3 conflicts pending',
            icon: <AlertTriangle className="w-6 h-6" />, 
            color: 'red',
            action: 'urgent'
          },
          { 
            title: 'Venue Management', 
            description: 'Manage venues',
            icon: <MapPin className="w-6 h-6" />, 
            color: 'green',
            action: 'normal'
          },
          { 
            title: 'Reports', 
            description: 'Generate reports',
            icon: <FileText className="w-6 h-6" />, 
            color: 'purple',
            action: 'normal'
          }
        ].map((tool, index) => (
          <div key={index} className={`bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-xl p-6 hover:bg-white dark:hover:bg-black/60 transition-all duration-200 cursor-pointer group ${
            tool.action === 'urgent' ? 'ring-2 ring-red-500/20' : ''
          }`}>
            <div className={`p-3 rounded-lg mb-4 ${
              tool.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/20' :
              tool.color === 'red' ? 'bg-red-100 dark:bg-red-900/20' :
              tool.color === 'green' ? 'bg-green-100 dark:bg-green-900/20' :
              'bg-purple-100 dark:bg-purple-900/20'
            }`}>
              <div className={`${
                tool.color === 'blue' ? 'text-blue-600 dark:text-blue-400' :
                tool.color === 'red' ? 'text-red-600 dark:text-red-400' :
                tool.color === 'green' ? 'text-green-600 dark:text-green-400' :
                'text-purple-600 dark:text-purple-400'
              }`}>
                {tool.icon}
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{tool.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
          </div>
        ))}
      </div>

      {/* Constraint Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Constraint Management</h3>
            <button className="flex items-center space-x-2 px-4 py-2 bg-[color:var(--ft-neon)] text-white rounded-lg hover:bg-[color:var(--ft-neon)]/80 transition-colors">
              <Settings className="w-4 h-4" />
              <span>Configure</span>
            </button>
          </div>
          
          <div className="space-y-4">
            {[
              { name: 'Rest Days Between Games', value: '3 days minimum', status: 'active', violations: 0 },
              { name: 'Maximum Consecutive Away', value: '2 games maximum', status: 'active', violations: 2 },
              { name: 'Travel Distance Limit', value: '1000 miles', status: 'active', violations: 1 },
              { name: 'Academic Calendar', value: 'No finals week games', status: 'active', violations: 0 }
            ].map((constraint, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">{constraint.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{constraint.value}</p>
                </div>
                <div className="flex items-center space-x-3">
                  {constraint.violations > 0 && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs rounded-full">
                      {constraint.violations} violations
                    </span>
                  )}
                  <div className={`w-3 h-3 rounded-full ${
                    constraint.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conflict Resolution */}
        <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Active Conflicts</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-red-600 dark:text-red-400 font-medium">3 Urgent</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {[
              { 
                type: 'Travel', 
                description: 'Kansas to Arizona: 1,200 miles exceeds limit',
                severity: 'high',
                date: 'Nov 15, 2024'
              },
              { 
                type: 'Rest Days', 
                description: 'Texas Tech: Only 1 day between games',
                severity: 'medium',
                date: 'Nov 12, 2024'
              },
              { 
                type: 'Venue', 
                description: 'Baylor: Arena double-booked',
                severity: 'high',
                date: 'Nov 10, 2024'
              }
            ].map((conflict, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        conflict.severity === 'high' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {conflict.type}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{conflict.date}</span>
                    </div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{conflict.description}</p>
                  </div>
                  <button className="ml-4 px-3 py-1 bg-[color:var(--ft-neon)] text-white text-xs rounded hover:bg-[color:var(--ft-neon)]/80 transition-colors">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduling Tools */}
      <div className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Scheduling Tools</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Bulk Operations</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Import Schedule</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Upload CSV or Excel file</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Generate Template</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Create round-robin schedule</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Optimize Schedule</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">AI-powered optimization</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Reports & Analytics</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Travel Report</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Distance and cost analysis</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Conflict Analysis</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Constraint violations summary</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Performance Metrics</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Schedule quality scores</div>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white">Communication</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Send Updates</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Notify all stakeholders</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Conference Call</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Schedule coordination meeting</div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-white/5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                <div className="font-medium text-gray-900 dark:text-white">Approval Workflow</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Submit for review</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}