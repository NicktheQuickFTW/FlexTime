'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FlexTimePrimaryButton, FlexTimeSecondaryButton } from '@/components/ui/FlexTimeShinyButton'

export function FlexTimeHero() {
  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-100 dark:from-gray-950 dark:via-black dark:to-gray-900 text-black dark:text-white flex flex-col justify-center items-center relative overflow-hidden">
      {/* Background geometric pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 border border-[color:var(--ft-glass-border)] rotate-45"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 border border-[color:var(--ft-glass-border)] rotate-12"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
        {/* "What's Next" tagline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <span className="text-[color:var(--ft-neon)] text-sm font-medium tracking-widest uppercase">
            "What's Next" is here.
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="space-y-4 mb-10"
        >
          <h1 className="ft-font-brand text-6xl md:text-7xl lg:text-8xl font-black leading-none tracking-tight">
            <div className="text-black dark:text-white">THE LANDSCAPE IS</div>
            <div className="text-black dark:text-white">EVOLVING.</div>
            <div className="font-bold mt-4 bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent">SO SHOULD YOU.</div>
          </h1>
        </motion.div>

        {/* Supporting text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-4xl mx-auto space-y-0.5 mb-10"
        >
          <p className="text-gray-600 dark:text-gray-300 text-lg ft-font-ui">
            The competition has heightened — now every advantage counts.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-lg ft-font-ui">
            Our AI ensures your schedule works as hard as your athletes.
          </p>
          <div className="space-y-1 mt-6">
            <p className="text-black dark:text-white font-semibold text-lg">
              Minimize every obstacle. Optimize every matchup. Maximize every opportunity.
            </p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-10"
        >
          <Link href="/schedule-builder">
            <FlexTimePrimaryButton className="px-8 py-4 text-lg font-bold">
              CREATE SCHEDULE →
            </FlexTimePrimaryButton>
          </Link>
          <Link href="/analytics">
            <FlexTimeSecondaryButton className="px-8 py-4 text-lg font-medium">
              VIEW ANALYTICS DASHBOARD
            </FlexTimeSecondaryButton>
          </Link>
        </motion.div>

        {/* AI Processing indicator - moved above divider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="mb-10 mt-12 w-full flex justify-center"
        >
          <div className="flex items-center space-x-2 text-[color:var(--ft-neon)] text-sm">
            <div className="w-2 h-2 bg-[color:var(--ft-neon)] rounded-full animate-pulse"></div>
            <span>AI Scheduling Agent: Processing</span>
          </div>
        </motion.div>
        
        {/* Bottom divider line - enhanced for visibility */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1.2, delay: 1.2 }}
          className="mx-auto relative mt-10"
        >
          <div className="w-full max-w-4xl h-1 bg-gradient-to-r from-transparent via-[color:var(--ft-neon)] to-transparent shadow-[0_0_12px_var(--ft-neon-glow)]"></div>
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-2 rounded-full bg-[color:var(--ft-neon)] animate-pulse shadow-[0_0_15px_var(--ft-neon-glow)]"></div>
        </motion.div>
      </div>

      {/* Bottom section preview removed */}

      {/* AI Processing indicator moved above divider */}
    </section>
  )
}