"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { GlassCounterCard } from '@/components/ui/GlassCounterCard'
import { AnimatedCard } from '@/components/ui/AnimatedCard'
import { ScheduleIcon, AIIcon, FlexTimeIcon } from '@/components/ui/AnimatedCard'

export function GlassShowcase() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Glass Navigation */}
      <nav className="ft-glass-nav p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="ft-font-brand text-2xl font-bold ft-glass-text-accent">
            FlexTime Glass Showcase
          </div>
          <div className="flex gap-4">
            <button className="ft-glass-button">Dashboard</button>
            <button className="ft-glass-button-neon">Schedule</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="ft-font-brand text-6xl font-bold ft-glass-text mb-4">
            Glass Design System
          </h1>
          <p className="ft-font-body text-xl ft-glass-text-muted max-w-2xl mx-auto">
            Premium glass morphism effects with metal accents and subtle neon blue highlights
          </p>
        </motion.div>

        {/* Counter Cards Grid */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold ft-glass-text-accent text-center">
            Glass Counter Cards
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

        {/* Glass Card Variants */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold ft-glass-text-accent text-center">
            Glass Card Variants
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="ft-glass-card p-6 rounded-xl space-y-3">
              <h3 className="ft-font-brand text-lg font-bold ft-glass-text">Standard Glass</h3>
              <p className="ft-glass-text-muted">Basic glass card with subtle effects</p>
            </div>
            <div className="ft-glass-neon p-6 rounded-xl space-y-3">
              <h3 className="ft-font-brand text-lg font-bold ft-glass-text">Neon Glass</h3>
              <p className="ft-glass-text-muted">Glass with neon blue accents</p>
            </div>
            <div className="ft-glass-frosted p-6 rounded-xl space-y-3">
              <h3 className="ft-font-brand text-lg font-bold ft-glass-text">Frosted Glass</h3>
              <p className="ft-glass-text-muted">Heavy frosted glass effect</p>
            </div>
            <div className="ft-glass-dark p-6 rounded-xl space-y-3">
              <h3 className="ft-font-brand text-lg font-bold ft-glass-text">Dark Glass</h3>
              <p className="ft-glass-text-muted">Dark glass with heavy blur</p>
            </div>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold ft-glass-text-accent text-center">
            Interactive Glass Elements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Buttons */}
            <div className="ft-glass-panel p-8 space-y-4">
              <h3 className="ft-font-brand text-xl font-bold ft-glass-text mb-4">Glass Buttons</h3>
              <div className="space-y-3">
                <button className="ft-glass-button w-full">Standard Glass Button</button>
                <button className="ft-glass-button-neon w-full">Neon Glass Button</button>
                <button className="ft-metal-card p-3 rounded-lg w-full transition-all hover:scale-105">
                  Metal Button
                </button>
              </div>
            </div>

            {/* Form Elements */}
            <div className="ft-glass-panel p-8 space-y-4">
              <h3 className="ft-font-brand text-xl font-bold ft-glass-text mb-4">Glass Forms</h3>
              <div className="space-y-3">
                <input 
                  className="ft-glass-input w-full" 
                  placeholder="Glass input field..."
                />
                <input 
                  className="ft-glass-input w-full" 
                  placeholder="Another glass input..."
                />
                <button className="ft-glass-button-neon w-full">Submit</button>
              </div>
            </div>
          </div>
        </section>

        {/* Animated Cards Section */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold ft-glass-text-accent text-center">
            Animated Glass Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatedCard
              title="FlexTime Builder"
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

        {/* Layout Components */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold ft-glass-text-accent text-center">
            Glass Layout Components
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
            
            {/* Sidebar */}
            <div className="ft-glass-sidebar p-6 rounded-xl">
              <h3 className="ft-font-brand text-lg font-bold ft-glass-text mb-4">Glass Sidebar</h3>
              <div className="space-y-2">
                <div className="ft-glass-button text-left w-full p-2">Dashboard</div>
                <div className="ft-glass-button text-left w-full p-2">Schedules</div>
                <div className="ft-glass-button text-left w-full p-2">Analytics</div>
                <div className="ft-glass-button text-left w-full p-2">Settings</div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-4">
              <div className="ft-glass-panel p-6 h-full rounded-xl">
                <h3 className="ft-font-brand text-lg font-bold ft-glass-text mb-4">Main Content Panel</h3>
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="ft-glass-card p-4 rounded-lg">
                    <div className="h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded"></div>
                  </div>
                  <div className="ft-glass-card p-4 rounded-lg">
                    <div className="h-full bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Text Effects */}
        <section className="space-y-6">
          <h2 className="ft-font-brand text-3xl font-bold ft-glass-text-accent text-center">
            Glass Text Effects
          </h2>
          <div className="ft-glass-panel p-8 text-center space-y-4">
            <p className="ft-glass-text text-2xl">Standard glass text with subtle shadow</p>
            <p className="ft-glass-text-muted text-xl">Muted glass text for secondary content</p>
            <p className="ft-glass-text-accent text-3xl ft-font-brand">Neon accent text with glow effect</p>
            <p className="ft-neon-glow text-2xl ft-font-brand">Full neon glow text effect</p>
          </div>
        </section>

        {/* Footer */}
        <footer className="ft-glass-nav p-6 rounded-xl text-center">
          <p className="ft-glass-text-muted">
            FlexTime Glass Design System - Premium glass morphism effects
          </p>
        </footer>
      </div>
    </div>
  )
}