"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GlassCounterCardProps {
  target?: number
  duration?: number
  label?: string
  suffix?: string
  icon?: React.ReactNode
  variant?: 'glass' | 'glass-neon' | 'glass-frosted' | 'glass-dark'
  className?: string
}

export function GlassCounterCard({ 
  target = 777000, 
  duration = 2000,
  label = "Views",
  suffix = "",
  icon,
  variant = 'glass',
  className
}: GlassCounterCardProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let start = 0
    const end = target
    const range = end - start
    if (range <= 0) return

    const increment = Math.ceil(end / (duration / 50))
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        start = end
        clearInterval(timer)
      }
      setCount(start)
    }, 50)

    return () => clearInterval(timer)
  }, [target, duration])

  const formatDisplay = (num: number) => {
    if (num < 1000) return num.toString()
    if (num < 1000000) return `${Math.floor(num / 1000)}k`
    return `${Math.floor(num / 1000000)}M`
  }

  const getVariantClass = () => {
    switch (variant) {
      case 'glass-neon': return 'ft-glass-neon'
      case 'glass-frosted': return 'ft-glass-frosted'
      case 'glass-dark': return 'ft-glass-dark'
      default: return 'ft-glass-card'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        duration: 0.6,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
        getVariantClass(),
        className
      )}
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
            style={{
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`
            }}
          />
        ))}
      </div>

      {/* Glowing dot indicator */}
      <motion.div
        className="absolute top-4 right-4 w-3 h-3 rounded-full"
        style={{
          background: variant === 'glass-neon' ? '#00bfff' : '#ffffff',
          boxShadow: variant === 'glass-neon' 
            ? '0 0 15px rgba(0, 191, 255, 0.8)' 
            : '0 0 15px rgba(255, 255, 255, 0.6)'
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {icon && (
          <motion.div 
            className="mb-4 text-white/60"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            {icon}
          </motion.div>
        )}
        
        <motion.div
          className="ft-font-brand text-4xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {formatDisplay(count)}{suffix}
        </motion.div>
        
        <motion.div
          className="ft-font-ui text-sm font-medium text-white/70 uppercase tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {label}
        </motion.div>
      </div>

      {/* Border lines animation */}
      <div className="absolute inset-0 rounded-2xl">
        <motion.div
          className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        />
        <motion.div
          className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        />
        <motion.div
          className="absolute left-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        />
        <motion.div
          className="absolute right-0 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-white/30 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        />
      </div>
    </motion.div>
  )
}

// Demo component with different variants
export function GlassCounterDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-black min-h-screen">
      <GlassCounterCard
        target={1250000}
        label="Schedule Views"
        variant="glass-neon"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L3 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-9-5z"/>
          </svg>
        }
      />
      
      <GlassCounterCard
        target={45}
        label="Active Games"
        variant="glass-frosted"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8M12 8v8" stroke="black" strokeWidth="2"/>
          </svg>
        }
      />
      
      <GlassCounterCard
        target={16}
        label="Big 12 Schools"
        variant="glass-dark"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        }
      />
      
      <GlassCounterCard
        target={98}
        suffix="%"
        label="Optimization"
        variant="glass"
        icon={
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3v18h18V3H3zm8 16H9v-6h2v6zm4 0h-2V7h2v12z"/>
          </svg>
        }
      />
    </div>
  )
}