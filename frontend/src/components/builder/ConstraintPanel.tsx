'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Info,
  Clock,
  MapPin,
  Users,
  Zap,
  Settings,
  Filter,
  Plus,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

import { FlexTimeCard } from '../ui/FlexTimeCard';
import { FlexTimeShinyButton } from '../ui/FlexTimeShinyButton';
import { FTIcon } from '../ui/FTIcon';

// Types for constraint management
export interface Constraint {
  id: string;
  name: string;
  type: 'hard' | 'soft';
  category: 'travel' | 'rest' | 'venue' | 'broadcast' | 'academic' | 'competitive';
  description: string;
  weight: number;
  active: boolean;
  sportSpecific?: string[];
}

export interface ConstraintViolation {
  id: string;
  constraintId: string;
  gameId?: string;
  type: 'error' | 'warning' | 'info';
  severity: number;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
}

interface ConstraintPanelProps {
  violations: ConstraintViolation[];
  constraints: Constraint[];
  visible: boolean;
  onVisibilityChange: (visible: boolean) => void;
  onConstraintUpdate: (constraint: Constraint) => void;
  onAutoFix?: (violationId: string) => void;
  sport: string;
}

// Pre-built constraint templates for Big 12 sports
const constraintTemplates: Record<string, Constraint[]> = {
  football: [
    {
      id: 'fb-rest-period',
      name: 'Minimum Rest Period',
      type: 'hard',
      category: 'rest',
      description: 'Teams must have at least 6 days between games',
      weight: 10,
      active: true,
      sportSpecific: ['football']
    },
    {
      id: 'fb-bye-weeks',
      name: 'Bye Week Requirement',
      type: 'hard',
      category: 'rest',
      description: 'Each team must have 1-2 bye weeks during season',
      weight: 9,
      active: true,
      sportSpecific: ['football']
    },
    {
      id: 'fb-rivalry-protection',
      name: 'Rivalry Game Protection',
      type: 'soft',
      category: 'competitive',
      description: 'Maintain traditional rivalry matchups',
      weight: 8,
      active: true,
      sportSpecific: ['football']
    }
  ],
  basketball: [
    {
      id: 'bb-back-to-back',
      name: 'No Back-to-Back Games',
      type: 'soft',
      category: 'rest',
      description: 'Avoid scheduling games on consecutive days',
      weight: 7,
      active: true,
      sportSpecific: ['mens-basketball', 'womens-basketball']
    },
    {
      id: 'bb-exam-periods',
      name: 'Academic Calendar',
      type: 'hard',
      category: 'academic',
      description: 'No games during final exam periods',
      weight: 10,
      active: true,
      sportSpecific: ['mens-basketball', 'womens-basketball']
    }
  ],
  baseball: [
    {
      id: 'bb-weather-windows',
      name: 'Weather Considerations',
      type: 'soft',
      category: 'venue',
      description: 'Consider regional weather patterns for outdoor games',
      weight: 6,
      active: true,
      sportSpecific: ['baseball', 'softball']
    },
    {
      id: 'bb-series-format',
      name: 'Series Scheduling',
      type: 'hard',
      category: 'competitive',
      description: 'Schedule games in weekend series format',
      weight: 9,
      active: true,
      sportSpecific: ['baseball', 'softball']
    }
  ]
};

export const ConstraintPanel: React.FC<ConstraintPanelProps> = ({
  violations,
  constraints,
  visible,
  onVisibilityChange,
  onConstraintUpdate,
  onAutoFix,
  sport
}) => {
  const [activeTab, setActiveTab] = useState<'violations' | 'constraints'>('violations');
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warning' | 'info'>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  // Get sport-specific constraints
  const sportConstraints = constraints.filter(c => 
    !c.sportSpecific || c.sportSpecific.includes(sport)
  );

  // Filter violations by type
  const filteredViolations = violations.filter(v => 
    filterType === 'all' || v.type === filterType
  );

  // Group violations by severity
  const violationStats = {
    error: violations.filter(v => v.type === 'error').length,
    warning: violations.filter(v => v.type === 'warning').length,
    info: violations.filter(v => v.type === 'info').length
  };

  // Violation type configurations
  const violationTypes = [
    { key: 'error', label: 'Errors', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20' },
    { key: 'warning', label: 'Warnings', icon: Info, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20' },
    { key: 'info', label: 'Info', icon: CheckCircle, color: 'text-blue-400', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20' }
  ];

  // Constraint category icons
  const categoryIcons = {
    travel: MapPin,
    rest: Clock,
    venue: MapPin,
    broadcast: Zap,
    academic: Users,
    competitive: Users
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="w-96 h-full bg-white/90 dark:bg-black/40 hover:bg-white dark:hover:bg-black/60 backdrop-blur-xl border-2 border-[#00bfff] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-[0_0_20px_rgba(0,191,255,0.3)] hover:shadow-[0_0_30px_rgba(0,191,255,0.5)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Settings size={20} className="text-[color:var(--ft-neon)]" />
              <h3 className="text-lg font-bold text-black dark:text-white">Constraints</h3>
            </div>
            <button
              onClick={() => onVisibilityChange(false)}
              className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <EyeOff size={16} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-white/10">
            {[
              { key: 'violations', label: 'Violations', count: violations.length },
              { key: 'constraints', label: 'Rules', count: sportConstraints.length }
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === key
                    ? 'text-[color:var(--ft-neon)] border-[color:var(--ft-neon)]'
                    : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-black dark:hover:text-white'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'violations' && (
              <div className="h-full flex flex-col">
                {/* Violation Stats */}
                <div className="p-4 border-b border-white/10">
                  <div className="grid grid-cols-3 gap-2">
                    {violationTypes.map(({ key, label, icon: Icon, color }) => (
                      <button
                        key={key}
                        onClick={() => setFilterType(filterType === key ? 'all' : key as any)}
                        className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                          filterType === key ? 'bg-white/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <Icon size={16} className={color} />
                        <span className={`text-xs ${color}`}>{violationStats[key as keyof typeof violationStats]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Violations List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {filteredViolations.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle size={32} className="mx-auto text-green-400 mb-2" />
                      <p className="text-gray-400">No violations found</p>
                    </div>
                  ) : (
                    filteredViolations.map((violation) => {
                      const typeConfig = violationTypes.find(t => t.key === violation.type);
                      const Icon = typeConfig?.icon || Info;
                      
                      return (
                        <motion.div
                          key={violation.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-3 rounded-lg border ${typeConfig?.bgColor} ${typeConfig?.borderColor}`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon size={16} className={`${typeConfig?.color} mt-0.5 flex-shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white font-medium">{violation.message}</p>
                              {violation.suggestion && (
                                <p className="text-xs text-gray-400 mt-1">{violation.suggestion}</p>
                              )}
                              {violation.autoFixable && onAutoFix && (
                                <FlexTimeShinyButton
                                  variant="secondary"
                                  onClick={() => onAutoFix(violation.id)}
                                  className="mt-2 px-2 py-1 text-xs"
                                >
                                  <Zap size={12} />
                                  Auto Fix
                                </FlexTimeShinyButton>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {activeTab === 'constraints' && (
              <div className="h-full flex flex-col">
                {/* Constraint Controls */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={showOnlyActive}
                        onChange={(e) => setShowOnlyActive(e.target.checked)}
                        className="rounded"
                      />
                      Show only active
                    </label>
                    <FlexTimeShinyButton
                      variant="secondary"
                      className="px-2 py-1 text-xs"
                    >
                      <Plus size={12} />
                      Add Rule
                    </FlexTimeShinyButton>
                  </div>
                </div>

                {/* Constraints List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {sportConstraints
                    .filter(c => !showOnlyActive || c.active)
                    .map((constraint) => {
                      const CategoryIcon = categoryIcons[constraint.category] || Settings;
                      
                      return (
                        <motion.div
                          key={constraint.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 border border-white/10 rounded-lg p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <CategoryIcon size={16} className="text-[color:var(--ft-neon)] mt-0.5" />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-medium text-white">{constraint.name}</h4>
                                  <span className={`px-1.5 py-0.5 text-xs rounded ${
                                    constraint.type === 'hard' 
                                      ? 'bg-red-500/20 text-red-400' 
                                      : 'bg-yellow-500/20 text-yellow-400'
                                  }`}>
                                    {constraint.type}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{constraint.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs text-gray-500">Weight: {constraint.weight}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-500 capitalize">{constraint.category}</span>
                                </div>
                              </div>
                            </div>
                            
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={constraint.active}
                                onChange={(e) => onConstraintUpdate({
                                  ...constraint,
                                  active: e.target.checked
                                })}
                                className="sr-only"
                              />
                              <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${
                                constraint.active ? 'bg-[color:var(--ft-neon)]' : 'bg-gray-600'
                              }`}>
                                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                  constraint.active ? 'translate-x-3' : 'translate-x-0'
                                }`} />
                              </div>
                            </label>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConstraintPanel;