'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FlexTimePrimaryButton, FlexTimeSecondaryButton } from '@/src/components/ui/FlexTimeShinyButton'

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
          className="space-y-4 mb-12"
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
          className="max-w-4xl mx-auto space-y-4 mb-16"
        >
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            The competition has heightened — now every advantage counts.
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
            Our AI ensures your schedule works as hard as your athletes.
          </p>
          <div className="space-y-2 mt-6">
            <p className="text-black dark:text-white font-semibold text-xl">
              Optimize every matchup. Minimize every obstacle.
            </p>
            <p className="text-black dark:text-white font-semibold text-xl">
              Maximize every opportunity.
            </p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
        >
          <Link href="/schedules">
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

        {/* Bottom divider line */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mt-32 mx-auto w-96 h-px bg-gradient-to-r from-transparent via-[color:var(--ft-neon-glow)] to-transparent"
        />
      </div>

      {/* Bottom section preview removed */}

      {/* AI Processing indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-4 w-full flex justify-center"
      >
        <div className="flex items-center space-x-2 text-[color:var(--ft-neon)] text-sm">
          <div className="w-2 h-2 bg-[color:var(--ft-neon)] rounded-full animate-pulse"></div>
          <span>AI Scheduling Agent: Processing</span>
        </div>
      </motion.div>
    </section>
  )
}