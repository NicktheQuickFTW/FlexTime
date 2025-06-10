"use client"

import { useState } from "react"
import { Box } from '@mui/material'
import { motion } from 'framer-motion'

interface ThemeToggleProps {
  className?: string
  onToggle?: (isDark: boolean) => void
}

export function ThemeToggle({ className, onToggle }: ThemeToggleProps) {
  const [isDark, setIsDark] = useState(true)

  const handleToggle = () => {
    const newValue = !isDark
    setIsDark(newValue)
    onToggle?.(newValue)
  }

  return (
    <Box
      onClick={handleToggle}
      sx={{
        display: 'flex',
        width: 64, // w-16
        height: 32, // h-8
        p: 0.5, // p-1
        borderRadius: '16px', // rounded-full
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        background: isDark 
          ? '#0a0a0a' // bg-zinc-950
          : '#ffffff', // bg-white
        border: `1px solid ${isDark 
          ? 'rgba(63, 63, 70, 1)' // border-zinc-800
          : 'rgba(228, 228, 231, 1)'}`, // border-zinc-200
        position: 'relative',
        '&:hover': {
          transform: 'scale(1.05)',
        },
      }}
      role="button"
      tabIndex={0}
      className={className}
    >
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        width: '100%',
        position: 'relative',
      }}>
        {/* Sliding Toggle Circle */}
        <motion.div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: 24, // w-6
            height: 24, // h-6
            borderRadius: '50%',
            background: isDark 
              ? '#27272a' // bg-zinc-800
              : '#e5e7eb', // bg-gray-200
            position: 'absolute',
            zIndex: 2,
          }}
          animate={{
            x: isDark ? 0 : 32, // translate-x-0 or translate-x-8
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
          }}
        >
          {isDark ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: '#ffffff' }}
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: '#374151' }}
            >
              <circle cx="12" cy="12" r="5"/>
              <path d="m12 1-2 2"/>
              <path d="m12 21-2 2"/>
              <path d="m4.22 4.22-1.42 1.42"/>
              <path d="m18.36 18.36-1.42 1.42"/>
              <path d="m1 12 2-2"/>
              <path d="m21 12 2-2"/>
              <path d="m4.22 19.78-1.42-1.42"/>
              <path d="m18.36 5.64-1.42-1.42"/>
            </svg>
          )}
        </motion.div>

        {/* Static Background Icons */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          zIndex: 1,
        }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ 
              color: isDark ? '#6b7280' : 'transparent',
              transition: 'color 0.3s ease',
            }}
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </Box>

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: 24,
          height: 24,
          borderRadius: '50%',
          zIndex: 1,
        }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ 
              color: !isDark ? '#000000' : 'transparent',
              transition: 'color 0.3s ease',
            }}
          >
            <circle cx="12" cy="12" r="5"/>
            <path d="m12 1-2 2"/>
            <path d="m12 21-2 2"/>
            <path d="m4.22 4.22-1.42 1.42"/>
            <path d="m18.36 18.36-1.42 1.42"/>
            <path d="m1 12 2-2"/>
            <path d="m21 12 2-2"/>
            <path d="m4.22 19.78-1.42-1.42"/>
            <path d="m18.36 5.64-1.42-1.42"/>
          </svg>
        </Box>
      </Box>
    </Box>
  )
}