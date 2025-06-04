'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { GlassCounterCard } from '@/src/components/ui/GlassCounterCard'
import { AnimatedCard, ScheduleIcon, AIIcon, FlexTimeIcon } from '@/src/components/ui/AnimatedCard'
import { Big12WeatherGrid } from '@/src/components/dashboard/WeatherDashboard'
import Link from 'next/link'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 text-black dark:text-white">

      <div className="max-w-7xl mx-auto p-6 pt-20 space-y-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="ft-font-brand text-6xl font-bold text-black dark:text-white mb-4">
            FLEXTIME COMMAND CENTER
          </h1>
          <p className="ft-font-ui text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-tight">
            Advanced AI-powered scheduling with glass morphism design and real-time Big 12 monitoring
          </p>
        </motion.div>

        {/* Glass Counter Cards Grid */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold text-black dark:text-white text-center">
            REAL-TIME PERFORMANCE METRICS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCounterCard
              target={1250000}
              label="Schedule Views"
              variant="glass-neon"
              icon={<FlexTimeIcon className="w-6 h-6" />}
            />
            <GlassCounterCard
              target={45}
              label="Active Games"
              variant="glass-frosted"
              icon={<ScheduleIcon className="w-6 h-6" />}
            />
            <GlassCounterCard
              target={16}
              label="Big 12 Schools"
              variant="glass-dark"
              icon={<AIIcon className="w-6 h-6" />}
            />
            <GlassCounterCard
              target={98}
              suffix="%"
              label="Optimization"
              variant="glass"
              icon={<FlexTimeIcon className="w-6 h-6" />}
            />
          </div>
        </section>

        {/* Animated Cards Section */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold text-black dark:text-white text-center">
            FLEXTIME CORE SYSTEMS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedCard
              title="Schedule Builder"
              description="Advanced scheduling engine with AI-powered optimization for Big 12 Conference sports."
              variant="glass"
              icons={[
                { icon: <FlexTimeIcon className="w-4 h-4" />, size: "sm" },
                { icon: <ScheduleIcon className="w-6 h-6" />, size: "md" },
                { icon: <AIIcon className="w-8 h-8" />, size: "lg" },
              ]}
            />
            
            <AnimatedCard
              title="COMPASS Analytics"
              description="Real-time performance metrics and predictive analytics for optimal scheduling decisions."
              variant="metal"
              icons={[
                { icon: <AIIcon className="w-4 h-4" />, size: "sm" },
                { icon: <FlexTimeIcon className="w-6 h-6" />, size: "md" },
                { icon: <ScheduleIcon className="w-4 h-4" />, size: "sm" },
              ]}
            />
            
            <AnimatedCard
              title="Weather Integration"
              description="Live weather data across all 16 Big 12 venues for informed scheduling."
              variant="default"
              icons={[
                { icon: <ScheduleIcon className="w-6 h-6" />, size: "md" },
                { icon: <AIIcon className="w-4 h-4" />, size: "sm" },
              ]}
            />
          </div>
        </section>

        {/* Dashboard Controls */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold text-black dark:text-white text-center">
            DASHBOARD CONTROL CENTER
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar */}
            <div className="bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-xl border-2 border-[#00bfff] rounded-2xl p-6 transition-all duration-300 shadow-[0_0_20px_rgba(0,191,255,0.3)] hover:shadow-[0_0_30px_rgba(0,191,255,0.5)]">
              <h3 className="ft-font-brand text-lg font-bold text-black dark:text-white mb-4">QUICK ACTIONS</h3>
              <div className="space-y-3">
                <Link href="/schedule-builder" className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-gray-200 dark:border-white/10 hover:border-[color:var(--ft-neon)] transition-all duration-300 text-black dark:text-white">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--ft-neon)] animate-pulse"></div>
                  Create Schedule
                </Link>
                <Link href="/teams" className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-gray-200 dark:border-white/10 hover:border-[color:var(--ft-neon)] transition-all duration-300 text-black dark:text-white">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--ft-neon)] animate-pulse"></div>
                  Manage Teams
                </Link>
                <Link href="/analytics" className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-gray-200 dark:border-white/10 hover:border-[color:var(--ft-neon)] transition-all duration-300 text-black dark:text-white">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--ft-neon)] animate-pulse"></div>
                  View Analytics
                </Link>
                <Link href="/venues" className="flex items-center gap-3 p-3 rounded-lg bg-white/50 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 border border-gray-200 dark:border-white/10 hover:border-[color:var(--ft-neon)] transition-all duration-300 text-black dark:text-white">
                  <div className="w-2 h-2 rounded-full bg-[color:var(--ft-neon)] animate-pulse"></div>
                  Venue Status
                </Link>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-xl border-2 border-[#00bfff] rounded-2xl p-6 h-full transition-all duration-300 shadow-[0_0_20px_rgba(0,191,255,0.3)] hover:shadow-[0_0_30px_rgba(0,191,255,0.5)]">
                <h3 className="ft-font-brand text-lg font-bold text-black dark:text-white mb-4">SYSTEM OVERVIEW</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/70 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                    <h4 className="text-black dark:text-white font-semibold mb-2">Active Systems</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">AI Engine</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[color:var(--ft-neon)] font-medium">ONLINE</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Database</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[color:var(--ft-neon)] font-medium">CONNECTED</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Weather API</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[color:var(--ft-neon)] font-medium">ACTIVE</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/70 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg p-4">
                    <h4 className="text-black dark:text-white font-semibold mb-2">Recent Activity</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[color:var(--ft-neon)]"></div>
                        <span className="text-gray-600 dark:text-gray-400">Schedule updated for Basketball</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[color:var(--ft-neon)]"></div>
                        <span className="text-gray-600 dark:text-gray-400">Weather sync completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-[color:var(--ft-neon)]"></div>
                        <span className="text-gray-600 dark:text-gray-400">AI optimization finished</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Weather Grid Section */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold text-black dark:text-white text-center">
            BIG 12 VENUE WEATHER
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full rounded-xl overflow-hidden"
          >
            <Big12WeatherGrid />
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="bg-white/90 dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/10 p-6 rounded-xl text-center">
          <p className="text-gray-600 dark:text-gray-400 ft-font-ui">
            FLEXTIME COMMAND CENTER - ADVANCED SCHEDULING PLATFORM
          </p>
        </footer>
      </div>
    </div>
  )
}