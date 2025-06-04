'use client'

import React from 'react'
import { FlexTimeNeonCard, FlexTimeGlassCard, FlexTimeFrostedCard } from '@/src/components/ui/FlexTimeCard'
import SystemMonitor from '@/components/ui/system-monitor'
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
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  Database,
  Globe
} from 'lucide-react'

// Glass Icons data for FlexTime
const flexTimeGlassIcons = [
  { icon: <Calendar className="w-6 h-6" />, color: 'blue', label: 'Scheduling' },
  { icon: <Zap className="w-6 h-6" />, color: 'purple', label: 'AI Engine' },
  { icon: <Trophy className="w-6 h-6" />, color: 'orange', label: 'Championships' },
  { icon: <Users className="w-6 h-6" />, color: 'green', label: 'Teams' },
  { icon: <BarChart3 className="w-6 h-6" />, color: 'indigo', label: 'Analytics' },
  { icon: <Settings className="w-6 h-6" />, color: 'red', label: 'Settings' }
]

// System performance data for FlexTime context
const systemMetrics = [
  { label: 'Schedule Generation', value: '2.3s', icon: Clock, status: 'optimal' },
  { label: 'Constraint Solving', value: '98.7%', icon: Shield, status: 'excellent' },
  { label: 'Database Performance', value: '45ms', icon: Database, status: 'good' },
  { label: 'API Response Time', value: '120ms', icon: Globe, status: 'good' }
]

export function FlexTimeSystemMonitor() {
  return (
    <div className="min-h-screen bg-black text-white py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="hero-title text-4xl md:text-6xl mb-6 text-white">
            FLEXTIME SYSTEM MONITOR
          </h1>
          <p className="hero-subtitle text-xl text-gray-400 max-w-2xl mx-auto">
            Real-time monitoring with glass morphism aesthetics and advanced system metrics
          </p>
        </div>

        {/* Glass Icons Section */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">Glass Icon Navigation</h2>
          <FlexTimeGlassCard className="p-8">
            <GlassIcons items={flexTimeGlassIcons} className="!gap-8" />
          </FlexTimeGlassCard>
        </section>

        {/* System Performance Cards */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">FlexTime Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {systemMetrics.map((metric, index) => (
              <FlexTimeNeonCard
                key={metric.label}
                title={metric.value}
                subtitle={metric.label}
                icon={<metric.icon className="w-8 h-8" />}
                className="text-center"
              >
                <div className="mt-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    metric.status === 'excellent' ? 'bg-green-500/20 text-green-400' :
                    metric.status === 'optimal' ? 'bg-cyan-400/20 text-cyan-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {metric.status.toUpperCase()}
                  </span>
                </div>
              </FlexTimeNeonCard>
            ))}
          </div>
        </section>

        {/* AI Engine Status */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">HELiiX Intelligence Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <FlexTimeFrostedCard
              title="Scheduling Agents"
              subtitle="Active Workers"
              icon={<Cpu className="w-8 h-8" />}
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Basketball Optimizer</span>
                  <span className="text-xs text-green-400 font-semibold">RUNNING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Football Scheduler</span>
                  <span className="text-xs text-green-400 font-semibold">RUNNING</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Conflict Resolver</span>
                  <span className="text-xs text-yellow-400 font-semibold">IDLE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Travel Optimizer</span>
                  <span className="text-xs text-green-400 font-semibold">RUNNING</span>
                </div>
              </div>
            </FlexTimeFrostedCard>

            <FlexTimeGlassCard
              title="Memory Usage"
              subtitle="System Resources"
              icon={<HardDrive className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache</span>
                    <span className="font-mono">2.4GB</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-cyan-400 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Models</span>
                    <span className="font-mono">1.8GB</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-blue-400 h-2 rounded-full" style={{width: '45%'}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Constraints</span>
                    <span className="font-mono">512MB</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-green-400 h-2 rounded-full" style={{width: '25%'}}></div>
                  </div>
                </div>
              </div>
            </FlexTimeGlassCard>

            <FlexTimeNeonCard
              title="Network Status"
              subtitle="Data Flow"
              icon={<Wifi className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-cyan-400 mb-1">847</div>
                  <div className="text-xs text-white/60">Requests/min</div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-white">12ms</div>
                    <div className="text-xs text-white/60">Avg Latency</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">99.8%</div>
                    <div className="text-xs text-white/60">Uptime</div>
                  </div>
                </div>
              </div>
            </FlexTimeNeonCard>

          </div>
        </section>

        {/* Recent Activity */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">Recent System Activity</h2>
          <FlexTimeGlassCard
            title="Activity Log"
            subtitle="Last 24 hours"
            icon={<Activity className="w-8 h-8" />}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Basketball schedule optimized</div>
                  <div className="text-xs text-white/60">2 minutes ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Weather data synchronized</div>
                  <div className="text-xs text-white/60">5 minutes ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Constraint conflict resolved</div>
                  <div className="text-xs text-white/60">12 minutes ago</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <div className="flex-1">
                  <div className="text-sm font-medium">Database backup completed</div>
                  <div className="text-xs text-white/60">1 hour ago</div>
                </div>
              </div>
            </div>
          </FlexTimeGlassCard>
        </section>

      </div>

      {/* Floating System Monitor (from 21st.dev) */}
      <SystemMonitor />
    </div>
  )
}