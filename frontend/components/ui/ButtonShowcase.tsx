'use client'

import React from 'react'
import { 
  FlexTimeShinyButton, 
  FlexTimePrimaryButton, 
  FlexTimeSecondaryButton, 
  FlexTimeNeonButton, 
  FlexTimeGlassButton 
} from '@/components/ui/FlexTimeShinyButton'
import { Calendar, Zap, Trophy, Users } from 'lucide-react'

export function ButtonShowcase() {
  return (
    <div className="min-h-screen bg-black text-white py-24">
      <div className="max-w-6xl mx-auto px-6">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="hero-title text-4xl md:text-6xl mb-6 text-white">
            FLEXTIME SHINY BUTTONS
          </h1>
          <p className="hero-subtitle text-xl text-gray-400 max-w-2xl mx-auto">
            Animated button components with FlexTime branding and glass morphism effects
          </p>
        </div>

        {/* Button Variants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
          
          {/* Primary Variant */}
          <div className="ft-glass-card p-8 rounded-xl">
            <h3 className="card-title text-xl mb-4 text-cyan-400">Primary Button</h3>
            <p className="ft-glass-text-muted mb-6">
              Main call-to-action with cyan background and black text
            </p>
            <div className="space-y-4">
              <FlexTimePrimaryButton>
                CREATE SCHEDULE
              </FlexTimePrimaryButton>
              <FlexTimePrimaryButton className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                FULL WIDTH BUTTON
              </FlexTimePrimaryButton>
            </div>
          </div>

          {/* Secondary Variant */}
          <div className="ft-glass-card p-8 rounded-xl">
            <h3 className="card-title text-xl mb-4 text-cyan-400">Secondary Button</h3>
            <p className="ft-glass-text-muted mb-6">
              Secondary actions with transparent background and border
            </p>
            <div className="space-y-4">
              <FlexTimeSecondaryButton>
                VIEW ANALYTICS
              </FlexTimeSecondaryButton>
              <FlexTimeSecondaryButton className="w-full">
                <Trophy className="w-4 h-4 mr-2" />
                EXPLORE FEATURES
              </FlexTimeSecondaryButton>
            </div>
          </div>

          {/* Neon Variant */}
          <div className="ft-glass-card p-8 rounded-xl">
            <h3 className="card-title text-xl mb-4 text-cyan-400">Neon Button</h3>
            <p className="ft-glass-text-muted mb-6">
              High-impact buttons with glowing neon effects
            </p>
            <div className="space-y-4">
              <FlexTimeNeonButton>
                LAUNCH AI ENGINE
              </FlexTimeNeonButton>
              <FlexTimeNeonButton className="w-full">
                <Zap className="w-4 h-4 mr-2" />
                ACTIVATE HELIIX
              </FlexTimeNeonButton>
            </div>
          </div>

          {/* Glass Variant */}
          <div className="ft-glass-card p-8 rounded-xl">
            <h3 className="card-title text-xl mb-4 text-cyan-400">Glass Button</h3>
            <p className="ft-glass-text-muted mb-6">
              Subtle glass morphism with backdrop blur effects
            </p>
            <div className="space-y-4">
              <FlexTimeGlassButton>
                TEAM MANAGEMENT
              </FlexTimeGlassButton>
              <FlexTimeGlassButton className="w-full">
                <Users className="w-4 h-4 mr-2" />
                BIG 12 SCHOOLS
              </FlexTimeGlassButton>
            </div>
          </div>
        </div>

        {/* Custom Variant Examples */}
        <div className="ft-glass-card p-8 rounded-xl mb-16">
          <h3 className="card-title text-xl mb-4 text-cyan-400">Custom Variants</h3>
          <p className="ft-glass-text-muted mb-6">
            Mix and match with custom styling and different sizes
          </p>
          <div className="flex flex-wrap gap-4 items-center">
            <FlexTimeShinyButton variant="primary" className="px-4 py-2 text-sm">
              Small
            </FlexTimeShinyButton>
            <FlexTimeShinyButton variant="secondary" className="px-6 py-3">
              Medium
            </FlexTimeShinyButton>
            <FlexTimeShinyButton variant="neon" className="px-8 py-4 text-lg">
              Large
            </FlexTimeShinyButton>
            <FlexTimeShinyButton variant="glass" className="px-12 py-6 text-xl">
              Extra Large
            </FlexTimeShinyButton>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="ft-glass-card p-8 rounded-xl">
          <h3 className="card-title text-xl mb-4 text-cyan-400">Real-World Usage</h3>
          <p className="ft-glass-text-muted mb-6">
            Button combinations for common FlexTime interface patterns
          </p>
          
          {/* Hero Actions */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 text-white">Hero Section Actions</h4>
            <div className="flex flex-col sm:flex-row gap-4">
              <FlexTimePrimaryButton className="px-8 py-4 text-lg">
                GET STARTED →
              </FlexTimePrimaryButton>
              <FlexTimeSecondaryButton className="px-8 py-4 text-lg">
                LEARN MORE
              </FlexTimeSecondaryButton>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold mb-4 text-white">Navigation Actions</h4>
            <div className="flex flex-wrap gap-3">
              <FlexTimeGlassButton className="px-4 py-2">
                Dashboard
              </FlexTimeGlassButton>
              <FlexTimeGlassButton className="px-4 py-2">
                Schedules
              </FlexTimeGlassButton>
              <FlexTimeGlassButton className="px-4 py-2">
                Analytics
              </FlexTimeGlassButton>
              <FlexTimeNeonButton className="px-4 py-2">
                AI Engine
              </FlexTimeNeonButton>
            </div>
          </div>

          {/* Form Actions */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-white">Form Actions</h4>
            <div className="flex gap-3">
              <FlexTimePrimaryButton>
                Save Changes
              </FlexTimePrimaryButton>
              <FlexTimeSecondaryButton>
                Cancel
              </FlexTimeSecondaryButton>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}