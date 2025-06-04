"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface FlexTimeCardProps {
  children?: React.ReactNode
  title?: string
  subtitle?: string
  icon?: React.ReactNode
  variant?: 'glass' | 'glass-neon' | 'glass-frosted' | 'glass-dark'
  className?: string
  hover?: boolean
  animated?: boolean
  glowDot?: boolean
  particles?: boolean
  borderAnimation?: boolean
}

export function FlexTimeCard({ 
  children,
  title,
  subtitle,
  icon,
  variant = 'glass',
  className,
  hover = true,
  animated = true,
  glowDot = true,
  particles = true,
  borderAnimation = true
}: FlexTimeCardProps) {
  const getVariantClass = () => {
    switch (variant) {
      case 'glass-neon': return 'ft-glass-neon'
      case 'glass-frosted': return 'ft-glass-frosted'
      case 'glass-dark': return 'ft-glass-dark'
      default: return 'ft-glass-card'
    }
  }

  const cardContent = (
    <div className={cn(
      "relative overflow-hidden rounded-2xl p-6 transition-all duration-300",
      getVariantClass(),
      "dark:bg-black/40 bg-white/10 dark:border-white/10 border-white/60 dark:backdrop-blur-xl backdrop-blur-xl hover:bg-white dark:hover:bg-black/60 transition-all duration-300",
      className
    )}>
      {/* Animated background particles */}
      {particles && (
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
      )}

      {/* Glowing dot indicator */}
      {glowDot && (
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
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header with icon and title */}
        {(icon || title || subtitle) && (
          <div className="mb-4">
            {icon && (
              <motion.div 
                className="mb-4 text-white/60"
                initial={animated ? { scale: 0 } : {}}
                animate={animated ? { scale: 1 } : {}}
                transition={{ delay: 0.3, type: "spring" }}
              >
                {icon}
              </motion.div>
            )}
            
            {title && (
              <motion.h3
                className="ft-font-brand text-xl font-bold text-gray-900 dark:text-white mb-2"
                initial={animated ? { opacity: 0, y: 20 } : {}}
                animate={animated ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 }}
              >
                {title}
              </motion.h3>
            )}
            
            {subtitle && (
              <motion.p
                className="ft-font-ui text-sm font-medium text-gray-600 dark:text-white/70 uppercase tracking-wider"
                initial={animated ? { opacity: 0 } : {}}
                animate={animated ? { opacity: 1 } : {}}
                transition={{ delay: 0.4 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}

        {/* Main content */}
        {children && (
          <motion.div
            className="ft-glass-text"
            initial={animated ? { opacity: 0, y: 10 } : {}}
            animate={animated ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5 }}
          >
            {children}
          </motion.div>
        )}
      </div>

      {/* Border lines animation */}
      {borderAnimation && (
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
      )}
    </div>
  )

  // Wrap with motion if animations are enabled
  if (animated || hover) {
    return (
      <motion.div
        initial={animated ? { opacity: 0, scale: 0.9, y: 20 } : {}}
        animate={animated ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={animated ? { 
          duration: 0.6,
          type: "spring",
          stiffness: 300,
          damping: 20
        } : {}}
        whileHover={hover ? { 
          scale: 1.02,
          transition: { duration: 0.2 }
        } : {}}
      >
        {cardContent}
      </motion.div>
    )
  }

  return <div>{cardContent}</div>
}

// Preset variants for common use cases
export const FlexTimeGlassCard: React.FC<Omit<FlexTimeCardProps, 'variant'>> = (props) => (
  <FlexTimeCard variant="glass" {...props} />
)

export const FlexTimeNeonCard: React.FC<Omit<FlexTimeCardProps, 'variant'>> = (props) => (
  <FlexTimeCard variant="glass-neon" {...props} />
)

export const FlexTimeFrostedCard: React.FC<Omit<FlexTimeCardProps, 'variant'>> = (props) => (
  <FlexTimeCard variant="glass-frosted" {...props} />
)

export const FlexTimeDarkCard: React.FC<Omit<FlexTimeCardProps, 'variant'>> = (props) => (
  <FlexTimeCard variant="glass-dark" {...props} />
)

// Simple card without animations for performance-critical areas
export const FlexTimeStaticCard: React.FC<FlexTimeCardProps> = (props) => (
  <FlexTimeCard 
    {...props} 
    animated={false} 
    hover={false} 
    particles={false} 
    borderAnimation={false}
    glowDot={false}
  />
)