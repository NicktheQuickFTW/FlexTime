"use client"

import React from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

export interface TimelineEntry {
  title: string
  content: React.ReactNode
  date?: string
  icon?: React.ReactNode
}

interface TimelineProps {
  data: TimelineEntry[]
  className?: string
}

export const Timeline = ({ data, className }: TimelineProps) => {
  return (
    <div className={cn("w-full font-sans", className)}>
      {data.map((item, index) => (
        <div key={index} className="flex justify-start pt-10 md:pt-20 md:gap-10">
          <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
            <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-black dark:bg-white flex items-center justify-center">
              {item.icon || (
                <div className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 p-2" />
              )}
            </div>
            <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-neutral-500 dark:text-neutral-500">
              {item.title}
            </h3>
          </div>

          <div className="relative pl-20 pr-4 md:pl-4 w-full">
            <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-neutral-500 dark:text-neutral-500">
              {item.title}
            </h3>
            {item.date && (
              <div className="text-sm text-neutral-400 dark:text-neutral-600 mb-4">
                {item.date}
              </div>
            )}
            <div className="text-neutral-800 dark:text-neutral-200">
              {item.content}
            </div>
          </div>
        </div>
      ))}
      <div
        style={{
          height: "100vh",
        }}
        className="hidden md:block"
      ></div>
    </div>
  )
}

// Enhanced Timeline with animations
export const AnimatedTimeline = ({ data, className }: TimelineProps) => {
  return (
    <div className={cn("w-full relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-8 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-neutral-200 dark:via-neutral-700 to-transparent" />
      
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          viewport={{ once: true }}
          className="relative flex items-start mb-12 last:mb-0"
        >
          {/* Timeline dot */}
          <div className="absolute left-6 w-4 h-4 bg-white dark:bg-black border-2 border-neutral-300 dark:border-neutral-600 rounded-full z-10 mt-2">
            {item.icon}
          </div>
          
          {/* Content */}
          <div className="ml-16 flex-1">
            {item.date && (
              <div className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                {item.date}
              </div>
            )}
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {item.title}
            </h3>
            <div className="text-neutral-700 dark:text-neutral-300">
              {item.content}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

// FlexTime branded timeline
export const FlexTimeTimeline = ({ data, className }: TimelineProps) => {
  return (
    <div className={cn("w-full relative", className)}>
      {/* Neon vertical line */}
      <div className="absolute left-8 top-0 h-full w-[2px] bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent" />
      
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: index * 0.15 }}
          viewport={{ once: true }}
          className="relative flex items-start mb-16 last:mb-0"
        >
          {/* Glowing timeline dot */}
          <div className="absolute left-6 w-4 h-4 bg-cyan-400 border-2 border-cyan-400 rounded-full z-10 mt-2 shadow-lg shadow-cyan-400/50">
            <div className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-20" />
            {item.icon && (
              <div className="absolute inset-0 flex items-center justify-center text-black text-xs">
                {item.icon}
              </div>
            )}
          </div>
          
          {/* Glass morphic content card */}
          <div className="ml-16 flex-1 ft-glass-card p-6 rounded-xl">
            {item.date && (
              <div className="text-sm text-cyan-400 font-mono mb-2 uppercase tracking-wider">
                {item.date}
              </div>
            )}
            <h3 className="hero-title text-xl mb-3 text-white">
              {item.title}
            </h3>
            <div className="ft-glass-text text-sm leading-relaxed">
              {item.content}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}