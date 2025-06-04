'use client'

import React from 'react'
import { Timeline, AnimatedTimeline, FlexTimeTimeline, TimelineEntry } from '@/src/components/ui/Timeline'
import { Calendar, Trophy, Users, Zap } from 'lucide-react'

export default function TimelineDemo() {
  const timelineData: TimelineEntry[] = [
    {
      title: "FlexTime Platform Launch",
      date: "January 2025",
      icon: <Zap className="w-3 h-3" />,
      content: (
        <div>
          <p className="mb-4">
            Revolutionary AI-powered scheduling platform debuts for Big 12 Conference, 
            transforming how collegiate athletics manages complex multi-sport schedules.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>16 member universities integrated</li>
            <li>23 sports categories supported</li>
            <li>98% schedule optimization achieved</li>
          </ul>
        </div>
      )
    },
    {
      title: "COMPASS Analytics Integration",
      date: "March 2025",
      icon: <Calendar className="w-3 h-3" />,
      content: (
        <div>
          <p className="mb-4">
            Advanced predictive analytics engine deployed, providing real-time 
            performance metrics and intelligent scheduling recommendations.
          </p>
          <div className="bg-black/20 p-4 rounded-lg mt-4">
            <h4 className="font-semibold mb-2">Key Features:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Real-time conflict detection</li>
              <li>Weather-based adjustments</li>
              <li>Travel optimization algorithms</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "HELiiX Intelligence Engine",
      date: "June 2025",
      icon: <Trophy className="w-3 h-3" />,
      content: (
        <div>
          <p className="mb-4">
            Machine learning-powered optimization engine launches, utilizing Python-based 
            algorithms for advanced constraint solving and schedule generation.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-cyan-400/10 p-3 rounded-lg border border-cyan-400/20">
              <div className="text-cyan-400 font-mono text-lg font-bold">2.3s</div>
              <div className="text-xs">Average generation time</div>
            </div>
            <div className="bg-cyan-400/10 p-3 rounded-lg border border-cyan-400/20">
              <div className="text-cyan-400 font-mono text-lg font-bold">99.7%</div>
              <div className="text-xs">Constraint satisfaction rate</div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Multi-Sport Championship Support",
      date: "September 2025",
      icon: <Users className="w-3 h-3" />,
      content: (
        <div>
          <p className="mb-4">
            Comprehensive championship scheduling capabilities deployed across all 
            Big 12 sports, with automatic tournament bracket generation and venue optimization.
          </p>
          <div className="mt-4 p-4 bg-gradient-to-r from-cyan-400/5 to-blue-500/5 rounded-lg border border-cyan-400/20">
            <h4 className="font-semibold text-cyan-400 mb-2">Championship Sports Supported:</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <span>Football</span>
              <span>Basketball</span>
              <span>Baseball</span>
              <span>Softball</span>
              <span>Soccer</span>
              <span>Wrestling</span>
              <span>Tennis</span>
              <span>Track & Field</span>
              <span>Swimming</span>
            </div>
          </div>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="pt-24 pb-16 text-center">
        <h1 className="hero-title text-4xl md:text-6xl mb-6 text-white">
          FLEXTIME TIMELINE
        </h1>
        <p className="hero-subtitle text-xl text-gray-400 max-w-2xl mx-auto">
          The evolution of AI-powered sports scheduling
        </p>
      </div>

      {/* Timeline Sections */}
      <div className="max-w-6xl mx-auto px-6 space-y-24">
        
        {/* Basic Timeline */}
        <section>
          <h2 className="section-header text-2xl mb-12 text-cyan-400">
            Basic Timeline
          </h2>
          <Timeline data={timelineData} />
        </section>

        {/* Animated Timeline */}
        <section>
          <h2 className="section-header text-2xl mb-12 text-cyan-400">
            Animated Timeline
          </h2>
          <AnimatedTimeline data={timelineData} />
        </section>

        {/* FlexTime Branded Timeline */}
        <section>
          <h2 className="section-header text-2xl mb-12 text-cyan-400">
            FlexTime Timeline
          </h2>
          <FlexTimeTimeline data={timelineData} />
        </section>

      </div>

      {/* Footer */}
      <div className="pt-32 pb-16 text-center">
        <div className="text-gray-500 text-sm">
          FlexTime Platform • Big 12 Conference Scheduling
        </div>
      </div>
    </div>
  )
}