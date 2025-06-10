'use client'

import React from 'react'
import { 
  FlexTimeCard, 
  FlexTimeGlassCard, 
  FlexTimeNeonCard, 
  FlexTimeFrostedCard, 
  FlexTimeDarkCard,
  FlexTimeStaticCard
} from '@/src/components/ui/FlexTimeCard'
import { FlexTimePrimaryButton, FlexTimeSecondaryButton } from '@/src/components/ui/FlexTimeShinyButton'
import { Calendar, Zap, Trophy, Users, Settings, BarChart3, Shield, Clock } from 'lucide-react'

export function FlexTimeCardShowcase() {
  return (
    <div className="min-h-screen bg-black text-white py-24">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="hero-title text-4xl md:text-6xl mb-6 text-white">
            FLEXTIME CARDS
          </h1>
          <p className="hero-subtitle text-xl text-gray-400 max-w-2xl mx-auto">
            Beautiful glass morphism cards with the same aesthetic as GlassCounterCard
          </p>
        </div>

        {/* Basic Variants */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">Card Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <FlexTimeGlassCard
              title="Glass Card"
              subtitle="Default variant"
              icon={<Calendar className="w-6 h-6" />}
            >
              <p className="text-sm leading-relaxed">
                The standard glass morphism card with subtle transparency and backdrop blur effects.
              </p>
            </FlexTimeGlassCard>

            <FlexTimeNeonCard
              title="Neon Card"
              subtitle="High impact"
              icon={<Zap className="w-6 h-6" />}
            >
              <p className="text-sm leading-relaxed">
                Enhanced with cyan neon accents and glowing effects for important content.
              </p>
            </FlexTimeNeonCard>

            <FlexTimeFrostedCard
              title="Frosted Card"
              subtitle="Premium feel"
              icon={<Trophy className="w-6 h-6" />}
            >
              <p className="text-sm leading-relaxed">
                Advanced frosted glass effect with enhanced saturation and blur.
              </p>
            </FlexTimeFrostedCard>

            <FlexTimeDarkCard
              title="Dark Card"
              subtitle="Low profile"
              icon={<Shield className="w-6 h-6" />}
            >
              <p className="text-sm leading-relaxed">
                Darker variant perfect for secondary content and background information.
              </p>
            </FlexTimeDarkCard>

          </div>
        </section>

        {/* Content Examples */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">Real-World Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature Card */}
            <FlexTimeNeonCard
              title="AI Schedule Optimizer"
              subtitle="Core Feature"
              icon={<Zap className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <p className="text-sm leading-relaxed">
                  Advanced machine learning algorithms optimize your Big 12 Conference schedules 
                  for maximum efficiency and minimal conflicts.
                </p>
                <div className="flex gap-2">
                  <FlexTimePrimaryButton className="text-xs px-4 py-2">
                    Learn More
                  </FlexTimePrimaryButton>
                </div>
              </div>
            </FlexTimeNeonCard>

            {/* Stats Card */}
            <FlexTimeGlassCard
              title="Performance Metrics"
              subtitle="Analytics Dashboard"
              icon={<BarChart3 className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">98%</div>
                    <div className="text-xs text-white/60">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-cyan-400">2.3s</div>
                    <div className="text-xs text-white/60">Avg Generation</div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed">
                  Real-time performance insights across all scheduling operations.
                </p>
              </div>
            </FlexTimeGlassCard>

            {/* Team Card */}
            <FlexTimeFrostedCard
              title="Big 12 Teams"
              subtitle="16 Universities"
              icon={<Users className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {['Texas', 'OU', 'KU', 'OSU'].map((team) => (
                    <span key={team} className="px-2 py-1 bg-white/10 rounded text-xs">
                      {team}
                    </span>
                  ))}
                  <span className="px-2 py-1 bg-cyan-400/20 rounded text-xs text-cyan-400">
                    +12 more
                  </span>
                </div>
                <p className="text-xs leading-relaxed">
                  Complete integration with all Big 12 Conference member institutions.
                </p>
              </div>
            </FlexTimeFrostedCard>

          </div>
        </section>

        {/* Interactive Features */}
        <section className="mb-20">
          <h2 className="section-header text-2xl mb-12 text-cyan-400">Interactive Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Settings Card */}
            <FlexTimeCard
              variant="glass"
              title="System Configuration"
              subtitle="Settings Panel"
              icon={<Settings className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Optimization</span>
                    <div className="w-10 h-5 bg-cyan-400 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Real-time Updates</span>
                    <div className="w-10 h-5 bg-white/20 rounded-full relative">
                      <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weather Integration</span>
                    <div className="w-10 h-5 bg-cyan-400 rounded-full relative">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-black rounded-full"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <FlexTimePrimaryButton className="text-xs px-4 py-2 flex-1">
                    Save Changes
                  </FlexTimePrimaryButton>
                  <FlexTimeSecondaryButton className="text-xs px-4 py-2">
                    Reset
                  </FlexTimeSecondaryButton>
                </div>
              </div>
            </FlexTimeCard>

            {/* Status Card */}
            <FlexTimeCard
              variant="glass-neon"
              title="System Status"
              subtitle="Real-time monitoring"
              icon={<Clock className="w-8 h-8" />}
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Database</span>
                    <span className="text-xs text-green-400 font-semibold">ONLINE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">AI Engine</span>
                    <span className="text-xs text-green-400 font-semibold">ACTIVE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Weather API</span>
                    <span className="text-xs text-yellow-400 font-semibold">SYNCING</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Notifications</span>
                    <span className="text-xs text-green-400 font-semibold">ENABLED</span>
                  </div>
                </div>
                <div className="pt-2 text-xs text-white/60">
                  Last updated: 2 minutes ago
                </div>
              </div>
            </FlexTimeCard>

          </div>
        </section>

        {/* Performance Comparison */}
        <section>
          <h2 className="section-header text-2xl mb-12 text-cyan-400">Performance Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <FlexTimeCard
              title="Full Animation Card"
              subtitle="Complete experience"
              icon={<Zap className="w-6 h-6" />}
              animated={true}
              hover={true}
              particles={true}
              borderAnimation={true}
              glowDot={true}
            >
              <p className="text-sm leading-relaxed">
                This card includes all animations: particles, border animations, glowing dot, 
                hover effects, and entrance animations. Perfect for hero sections and important content.
              </p>
            </FlexTimeCard>

            <FlexTimeStaticCard
              title="Static Card"
              subtitle="Performance optimized"
              icon={<Shield className="w-6 h-6" />}
            >
              <p className="text-sm leading-relaxed">
                This card has animations disabled for better performance in lists, 
                tables, or areas with many cards. Same beautiful aesthetic, optimized rendering.
              </p>
            </FlexTimeStaticCard>

          </div>
        </section>

      </div>
    </div>
  )
}