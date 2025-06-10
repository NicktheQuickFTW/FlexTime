'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Palette, 
  Monitor, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database, 
  Zap, 
  Globe,
  Save,
  RotateCcw,
  User,
  Settings as SettingsIcon
} from 'lucide-react'
import { FlexTimeShinyButton } from './FlexTimeShinyButton'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

// 21st-dev inspired glassmorphic section component
const SettingsSection = ({ 
  title, 
  icon: Icon, 
  children, 
  description 
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode
  description?: string 
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white/[0.05] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/[0.12] transition-all duration-300"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-xl bg-[color:var(--ft-neon)]/20 border border-[color:var(--ft-neon)]/30">
        <Icon size={20} className="text-[color:var(--ft-neon)]" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400">{description}</p>
        )}
      </div>
    </div>
    {children}
  </motion.div>
)

// Toggle switch component with 21st-dev styling
const ToggleSwitch = ({ 
  enabled, 
  onChange, 
  label, 
  description 
}: { 
  enabled: boolean
  onChange: (value: boolean) => void
  label: string
  description?: string 
}) => (
  <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-xl border border-white/[0.05] hover:border-white/[0.1] transition-all">
    <div>
      <label className="text-white font-medium">{label}</label>
      {description && (
        <p className="text-sm text-gray-400 mt-1">{description}</p>
      )}
    </div>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
        enabled ? 'bg-[color:var(--ft-neon)]' : 'bg-white/20'
      }`}
    >
      <motion.div
        animate={{ x: enabled ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-colors ${
          enabled ? 'bg-black' : 'bg-white'
        }`}
      />
    </button>
  </div>
)

// Select component with futuristic styling
const FuturisticSelect = ({ 
  value, 
  onChange, 
  options, 
  label 
}: { 
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label: string 
}) => (
  <div className="space-y-2">
    <label className="text-white font-medium">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white/[0.08] backdrop-blur-xl border border-white/[0.15] rounded-xl px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[color:var(--ft-neon)]/50 focus:border-[color:var(--ft-neon)]/50 transition-all"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} className="bg-black text-white">
          {option.label}
        </option>
      ))}
    </select>
  </div>
)

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState({
    theme: 'dark',
    notifications: true,
    autoSave: true,
    dataSync: true,
    animationsEnabled: true,
    language: 'en',
    timezone: 'America/Chicago',
    aiOptimization: true,
    realTimeUpdates: true
  })

  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    // Load settings from localStorage or API
    const savedSettings = localStorage.getItem('flextime-settings')
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings))
    }
  }, [])

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = () => {
    localStorage.setItem('flextime-settings', JSON.stringify(settings))
    setHasChanges(false)
    // Here you would also send to your API
  }

  const resetSettings = () => {
    const defaultSettings = {
      theme: 'dark',
      notifications: true,
      autoSave: true,
      dataSync: true,
      animationsEnabled: true,
      language: 'en',
      timezone: 'America/Chicago',
      aiOptimization: true,
      realTimeUpdates: true
    }
    setSettings(defaultSettings)
    setHasChanges(true)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-black/80 backdrop-blur-xl border border-white/10 rounded-3xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[color:var(--ft-neon)]/20 border border-[color:var(--ft-neon)]/30">
                  <SettingsIcon size={24} className="text-[color:var(--ft-neon)]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">FlexTime Settings</h2>
                  <p className="text-sm text-gray-400">Configure your scheduling platform</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <div className="grid gap-6 max-w-4xl mx-auto">
                
                {/* Appearance Settings */}
                <SettingsSection
                  title="Appearance"
                  icon={Palette}
                  description="Customize the look and feel"
                >
                  <div className="space-y-4">
                    <FuturisticSelect
                      label="Theme"
                      value={settings.theme}
                      onChange={(value) => updateSetting('theme', value)}
                      options={[
                        { value: 'dark', label: 'Dark Mode' },
                        { value: 'light', label: 'Light Mode' },
                        { value: 'auto', label: 'System Default' }
                      ]}
                    />
                    
                    <ToggleSwitch
                      enabled={settings.animationsEnabled}
                      onChange={(value) => updateSetting('animationsEnabled', value)}
                      label="Animations"
                      description="Enable smooth transitions and effects"
                    />
                  </div>
                </SettingsSection>

                {/* Notifications */}
                <SettingsSection
                  title="Notifications"
                  icon={Bell}
                  description="Control how you receive updates"
                >
                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={settings.notifications}
                      onChange={(value) => updateSetting('notifications', value)}
                      label="Push Notifications"
                      description="Get notified about schedule changes"
                    />
                    
                    <ToggleSwitch
                      enabled={settings.realTimeUpdates}
                      onChange={(value) => updateSetting('realTimeUpdates', value)}
                      label="Real-time Updates"
                      description="Live sync across all devices"
                    />
                  </div>
                </SettingsSection>

                {/* Performance */}
                <SettingsSection
                  title="Performance"
                  icon={Zap}
                  description="Optimize system performance"
                >
                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={settings.aiOptimization}
                      onChange={(value) => updateSetting('aiOptimization', value)}
                      label="AI Optimization"
                      description="Use AI to enhance scheduling performance"
                    />
                    
                    <ToggleSwitch
                      enabled={settings.autoSave}
                      onChange={(value) => updateSetting('autoSave', value)}
                      label="Auto-save"
                      description="Automatically save changes"
                    />
                  </div>
                </SettingsSection>

                {/* Data & Privacy */}
                <SettingsSection
                  title="Data & Privacy"
                  icon={Shield}
                  description="Manage your data preferences"
                >
                  <div className="space-y-4">
                    <ToggleSwitch
                      enabled={settings.dataSync}
                      onChange={(value) => updateSetting('dataSync', value)}
                      label="Cloud Sync"
                      description="Sync data across devices"
                    />
                    
                    <FuturisticSelect
                      label="Region"
                      value={settings.timezone}
                      onChange={(value) => updateSetting('timezone', value)}
                      options={[
                        { value: 'America/New_York', label: 'Eastern Time' },
                        { value: 'America/Chicago', label: 'Central Time' },
                        { value: 'America/Denver', label: 'Mountain Time' },
                        { value: 'America/Los_Angeles', label: 'Pacific Time' }
                      ]}
                    />
                  </div>
                </SettingsSection>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 text-yellow-400 text-sm"
                  >
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                    Unsaved changes
                  </motion.div>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <FlexTimeShinyButton
                  variant="secondary"
                  onClick={resetSettings}
                  className="px-4 py-2"
                >
                  <RotateCcw size={16} className="mr-2" />
                  Reset
                </FlexTimeShinyButton>
                
                <FlexTimeShinyButton
                  variant="neon"
                  onClick={saveSettings}
                  disabled={!hasChanges}
                  className="px-6 py-2"
                >
                  <Save size={16} className="mr-2" />
                  Save Changes
                </FlexTimeShinyButton>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}