"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface IconItem {
  icon: React.ReactNode
  size: 'sm' | 'md' | 'lg'
}

interface AnimatedCardProps {
  title: string
  description: string
  icons?: IconItem[]
  className?: string
  variant?: 'default' | 'metal' | 'glass'
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16'
}

export function AnimatedCard({ 
  title, 
  description, 
  icons = [], 
  className,
  variant = 'default' 
}: AnimatedCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'metal':
        return {
          background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
        }
      case 'glass':
        return {
          background: 'rgba(0,0,0,0.4)',
          border: '1px solid rgba(0,191,255,0.2)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 0 40px rgba(0,191,255,0.1)'
        }
      default:
        return {
          background: '#000000',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)'
        }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-8 transition-all duration-300",
        "hover:shadow-2xl",
        className
      )}
      style={getVariantStyles()}
    >
      {/* Metal sheen effect */}
      <motion.div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.05) 50%, transparent 70%)',
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: ['translateX(-100%)', 'translateX(100%)']
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          repeatDelay: 3,
          ease: "linear"
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        <h3 className="ft-font-brand text-2xl font-bold text-white mb-3 tracking-tight">
          {title}
        </h3>
        <p className="ft-font-body text-gray-300 leading-relaxed mb-8">
          {description}
        </p>

        {/* Animated Icons */}
        {icons.length > 0 && (
          <div className="flex items-center justify-center space-x-4">
            {icons.map((iconItem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: 0.2 + index * 0.1,
                  type: "spring",
                  stiffness: 300,
                  damping: 20
                }}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  transition: { duration: 0.2 }
                }}
                className={cn(
                  "flex items-center justify-center rounded-full",
                  "bg-white/5 border border-white/10 backdrop-blur-sm",
                  "hover:bg-white/10 hover:border-white/20",
                  "transition-all duration-300",
                  sizeClasses[iconItem.size]
                )}
                style={{
                  boxShadow: `0 0 20px rgba(0,191,255,${0.1 + index * 0.05})`
                }}
              >
                <motion.div
                  animate={{ 
                    y: [0, -2, 0],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    delay: index * 0.5,
                    ease: "easeInOut"
                  }}
                  className="text-white/80 hover:text-white transition-colors duration-300"
                >
                  {iconItem.icon}
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Subtle glow effect */}
      <div 
        className="absolute inset-0 opacity-20 rounded-2xl"
        style={{
          background: 'radial-gradient(circle at 50% 0%, rgba(0,191,255,0.1) 0%, transparent 50%)'
        }}
      />
    </motion.div>
  )
}

// FlexTime-specific icons
export const FlexTimeIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2L3 7v10c0 5.55 3.84 9.74 9 9.74s9-4.19 9-9.74V7l-9-5z"/>
    <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
)

export const ScheduleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2"/>
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

export const AIIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5l-4.24 4.24m-6.72 0L1.5 6.5m17 11l-4.24-4.24m-6.72 0L1.5 17.5" stroke="currentColor" strokeWidth="2"/>
  </svg>
)

// Demo component
export function AnimatedCardDemo() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <AnimatedCard
        title="FlexTime Builder"
        description="Advanced scheduling engine with AI-powered optimization for Big 12 Conference sports."
        variant="metal"
        icons={[
          { icon: <FlexTimeIcon className="w-4 h-4" />, size: "sm" },
          { icon: <ScheduleIcon className="w-6 h-6" />, size: "md" },
          { icon: <AIIcon className="w-8 h-8" />, size: "lg" },
        ]}
      />
      
      <AnimatedCard
        title="COMPASS Analytics"
        description="Real-time performance metrics and predictive analytics for optimal scheduling decisions."
        variant="glass"
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
  )
}