'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  Target, 
  Zap,
  Eye,
  Calendar,
  Users,
  Globe,
  ChevronDown,
  Filter,
  Download,
  Maximize2
} from 'lucide-react'
import { FlexTimeShinyButton } from '../../src/components/ui/FlexTimeShinyButton'

// 21st-dev inspired glassmorphic card component
const GlassCard = ({ children, className = '', hover = true }: { 
  children: React.ReactNode, 
  className?: string,
  hover?: boolean 
}) => (
  <motion.div
    whileHover={hover ? { y: -2, scale: 1.02 } : {}}
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={`
      bg-white/[0.08] dark:bg-white/[0.04] 
      backdrop-blur-xl backdrop-saturate-150
      border border-white/[0.15] dark:border-white/[0.08]
      rounded-2xl p-6
      shadow-[0_8px_32px_rgba(0,0,0,0.12)]
      hover:shadow-[0_16px_64px_rgba(0,191,255,0.15)]
      transition-all duration-300
      ${className}
    `}
  >
    {children}
  </motion.div>
)

// Animated metric component with 21st-dev style
const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color = "cyan",
  prefix = "",
  suffix = ""
}: {
  title: string
  value: number | string
  change?: number
  icon: React.ElementType
  color?: "cyan" | "green" | "purple" | "orange"
  prefix?: string
  suffix?: string
}) => {
  const [animatedValue, setAnimatedValue] = useState(0)
  
  useEffect(() => {
    if (typeof value === 'number') {
      const timer = setTimeout(() => setAnimatedValue(value), 100)
      return () => clearTimeout(timer)
    }
  }, [value])

  const colorClasses = {
    cyan: "text-cyan-400 bg-cyan-500/20 border-cyan-500/30",
    green: "text-green-400 bg-green-500/20 border-green-500/30", 
    purple: "text-purple-400 bg-purple-500/20 border-purple-500/30",
    orange: "text-orange-400 bg-orange-500/20 border-orange-500/30"
  }

  return (
    <GlassCard className="relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl border ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
        {change && (
          <span className={`text-sm font-medium ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
            {change > 0 ? '+' : ''}{change}%
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-2xl font-bold text-white">
          {prefix}
          {typeof value === 'number' ? (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
            >
              {animatedValue.toLocaleString()}
            </motion.span>
          ) : value}
          {suffix}
        </h3>
        <p className="text-gray-400 text-sm font-medium">{title}</p>
      </div>
      
      {/* Subtle glow effect */}
      <div className={`absolute -top-10 -right-10 w-20 h-20 ${colorClasses[color].split(' ')[2]} opacity-20 rounded-full blur-xl`} />
    </GlassCard>
  )
}

// Interactive chart placeholder (21st-dev style)
const ChartCard = ({ title, type = "area" }: { title: string, type?: string }) => (
  <GlassCard className="min-h-[320px]">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="flex gap-2">
        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Filter size={16} className="text-gray-400" />
        </button>
        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
          <Maximize2 size={16} className="text-gray-400" />
        </button>
      </div>
    </div>
    
    {/* Animated chart placeholder */}
    <div className="h-[240px] relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-white/5">
      <div className="absolute inset-0 flex items-end justify-around p-4 space-x-2">
        {Array.from({ length: 12 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${Math.random() * 80 + 20}%` }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: "easeOut" }}
            className="bg-gradient-to-t from-cyan-500/80 to-cyan-400/40 rounded-t-sm flex-1 max-w-[20px]"
          />
        ))}
      </div>
      
      {/* Overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
    </div>
  </GlassCard>
)

export default function Analytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d')
  const [selectedSport, setSelectedSport] = useState('all')

  const timeframes = [
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '1Y', value: '1y' }
  ]

  const sports = [
    { label: 'All Sports', value: 'all' },
    { label: 'Football', value: 'football' },
    { label: 'Basketball', value: 'basketball' },
    { label: 'Baseball', value: 'baseball' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent ft-font-brand uppercase tracking-wide">
              HELiiX INTELLIGENCE
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg ft-font-ui leading-tight max-w-2xl mx-auto">
              Real-time performance insights and predictive analytics for Big 12 Conference sports scheduling
            </p>
          </motion.div>

          {/* Control Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8"
          >
            <div className="flex gap-4">
              {/* Timeframe Selector */}
              <div className="flex bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl rounded-xl p-1 border border-white/[0.15]">
                {timeframes.map((tf) => (
                  <button
                    key={tf.value}
                    onClick={() => setSelectedTimeframe(tf.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTimeframe === tf.value
                        ? 'bg-[color:var(--ft-neon)] text-black'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {/* Sport Selector */}
              <div className="relative">
                <select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  className="appearance-none bg-white/[0.08] dark:bg-white/[0.04] backdrop-blur-xl border border-white/[0.15] rounded-xl px-4 py-2 pr-10 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  {sports.map((sport) => (
                    <option key={sport.value} value={sport.value} className="bg-black text-white">
                      {sport.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>

            <div className="flex gap-2">
              <FlexTimeShinyButton variant="secondary" className="px-4 py-2">
                <Download size={16} className="mr-2" />
                Export
              </FlexTimeShinyButton>
              <FlexTimeShinyButton variant="neon" className="px-4 py-2">
                <Eye size={16} className="mr-2" />
                Live View
              </FlexTimeShinyButton>
            </div>
          </motion.div>

          {/* Key Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <MetricCard
              title="Schedules Generated"
              value={1247}
              change={12.5}
              icon={Calendar}
              color="cyan"
            />
            <MetricCard
              title="Active Teams"
              value={16}
              icon={Users}
              color="green"
            />
            <MetricCard
              title="Optimization Rate"
              value={98.7}
              suffix="%"
              change={3.2}
              icon={Target}
              color="purple"
            />
            <MetricCard
              title="Avg Generation Time"
              value="1.8s"
              change={-15.3}
              icon={Zap}
              color="orange"
            />
          </motion.div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <ChartCard title="Schedule Performance" type="area" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <ChartCard title="Constraint Violations" type="bar" />
            </motion.div>
          </div>

          {/* Sports Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Big 12 Sports Overview</h3>
                <Activity className="text-cyan-400" size={24} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { sport: 'Football', teams: 16, schedules: 128, status: 'active' },
                  { sport: 'Basketball', teams: 16, schedules: 256, status: 'active' },
                  { sport: 'Baseball', teams: 14, schedules: 180, status: 'optimizing' },
                  { sport: 'Volleyball', teams: 15, schedules: 200, status: 'active' }
                ].map((sport, index) => (
                  <motion.div
                    key={sport.sport}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.9 + index * 0.1 }}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-white">{sport.sport}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        sport.status === 'active' ? 'bg-green-500/20 text-green-400' :
                        sport.status === 'optimizing' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {sport.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Teams:</span>
                        <span className="text-white font-medium">{sport.teams}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Schedules:</span>
                        <span className="text-white font-medium">{sport.schedules}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Real-time Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="mt-8"
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Live Activity Feed</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-400">Real-time</span>
                </div>
              </div>
              
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {[
                  { action: 'Basketball schedule optimized', time: '2 min ago', type: 'success' },
                  { action: 'Football venue conflict detected', time: '5 min ago', type: 'warning' },
                  { action: 'Baseball schedule generated', time: '8 min ago', type: 'info' },
                  { action: 'Volleyball constraints updated', time: '12 min ago', type: 'info' },
                  { action: 'System optimization completed', time: '15 min ago', type: 'success' }
                ].map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 1.1 + index * 0.1 }}
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-all"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      activity.type === 'success' ? 'bg-green-400' :
                      activity.type === 'warning' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1">
                      <span className="text-white text-sm">{activity.action}</span>
                    </div>
                    <span className="text-gray-400 text-xs">{activity.time}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  )
}