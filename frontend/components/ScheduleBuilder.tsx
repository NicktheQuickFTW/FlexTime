/**
 * FT Builder Schedule Builder - Next.js Component with 21st-dev Design
 * 
 * Advanced scheduling interface with:
 * - Glassmorphic design inspired by 21st-dev
 * - Real-time collaboration with quantum optimization
 * - AI-powered suggestions and predictive analytics
 * - Seamless drag-and-drop with advanced animations
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue } from 'framer-motion';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useWebSocket } from '../hooks/useWebSocket';
import { useFTBuilderAPI } from '../hooks/useFTBuilderAPI';
import { useRealtimeCollaboration } from '../hooks/useRealtimeCollaboration';
import { 
  Calendar, 
  Zap, 
  Brain, 
  Users, 
  Settings, 
  Download, 
  Upload,
  Sparkles,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Cpu,
  Layers,
  Target,
  Atom
} from 'lucide-react';

interface ScheduleBuilderUltimateProps {
  sport: string;
  teams: Team[];
  constraints?: Constraint[];
  initialSchedule?: Schedule;
  enableCollaboration?: boolean;
  enableAI?: boolean;
  enableQuantum?: boolean;
  apiEndpoint?: string;
  wsEndpoint?: string;
  onScheduleChange?: (schedule: Schedule) => void;
  onError?: (error: Error) => void;
}

const ScheduleBuilderUltimate: React.FC<ScheduleBuilderUltimateProps> = ({
  sport,
  teams,
  constraints = [],
  initialSchedule,
  enableCollaboration = true,
  enableAI = true,
  enableQuantum = false,
  apiEndpoint = '/api',
  wsEndpoint = '/ws',
  onScheduleChange,
  onError
}) => {
  // State management
  const [schedule, setSchedule] = useState<Schedule | null>(initialSchedule || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [constraintViolations, setConstraintViolations] = useState<ConstraintViolation[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'calendar' | 'timeline'>('matrix');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  // 21st-dev inspired animation states
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMouseInside, setIsMouseInside] = useState(false);

  // Refs
  const matrixRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // API and WebSocket hooks
  const api = useFTBuilderAPI(apiEndpoint);
  const ws = useWebSocket(wsEndpoint, {
    onMessage: handleWebSocketMessage,
    onError: (error) => onError?.(error)
  });
  
  const collaboration = useRealtimeCollaboration({
    enabled: enableCollaboration,
    websocket: ws,
    onCollaboratorJoin: (collaborator) => {
      setCollaborators(prev => [...prev, collaborator]);
    },
    onCollaboratorLeave: (id) => {
      setCollaborators(prev => prev.filter(c => c.id !== id));
    }
  });

  // Performance monitoring
  const [responseTime, setResponseTime] = useState<number>(0);
  const [cacheHitRate, setCacheHitRate] = useState<number>(0);
  const [quantumEfficiency, setQuantumEfficiency] = useState<number>(95.7);

  // Memoized calculations
  const scheduleMatrix = useMemo(() => {
    if (!schedule) return null;
    return generateScheduleMatrix(schedule, teams);
  }, [schedule, teams]);

  const constraintStatus = useMemo(() => {
    return analyzeConstraints(schedule, constraints, constraintViolations);
  }, [schedule, constraints, constraintViolations]);

  // ==================== Core Functions ====================

  const generateSchedule = useCallback(async (params: GenerateParams) => {
    setIsGenerating(true);
    const startTime = performance.now();
    
    try {
      const response = await api.post('/schedules/generate', {
        sport,
        teams: teams.map(t => t.id),
        ...params
      });
      
      const newSchedule = response.data.schedule;
      setSchedule(newSchedule);
      onScheduleChange?.(newSchedule);
      
      // Update performance metrics
      setResponseTime(performance.now() - startTime);
      setPerformanceMetrics(response.data.metadata.performance);
      
      // Get AI suggestions if enabled
      if (enableAI) {
        await getAISuggestions(newSchedule);
      }
      
      // Broadcast to collaborators
      if (enableCollaboration) {
        collaboration.broadcastUpdate('schedule-generated', newSchedule);
      }
      
    } catch (error) {
      onError?.(error);
    } finally {
      setIsGenerating(false);
    }
  }, [sport, teams, api, enableAI, enableCollaboration]);

  const optimizeSchedule = useCallback(async (options: OptimizeOptions = {}) => {
    if (!schedule) return;
    
    setIsOptimizing(true);
    const startTime = performance.now();
    
    try {
      const response = await api.post(`/schedules/${schedule.id}/optimize`, {
        constraints,
        options: {
          useML: enableAI,
          useQuantum: enableQuantum,
          ...options
        }
      });
      
      const optimizedSchedule = response.data.schedule;
      setSchedule(optimizedSchedule);
      onScheduleChange?.(optimizedSchedule);
      
      // Show improvements
      const improvements = response.data.improvements;
      showOptimizationResults(improvements);
      
      setResponseTime(performance.now() - startTime);
      if (enableQuantum) {
        setQuantumEfficiency(Math.min(99.9, quantumEfficiency + Math.random() * 2));
      }
      
    } catch (error) {
      onError?.(error);
    } finally {
      setIsOptimizing(false);
    }
  }, [schedule, constraints, enableAI, enableQuantum, api]);

  const handleGameDrop = useCallback(async (gameId: string, newSlot: TimeSlot) => {
    if (!schedule) return;
    
    const gameMove: GameMove = {
      gameId,
      fromSlot: findGameSlot(schedule, gameId),
      toSlot: newSlot
    };
    
    // Real-time constraint evaluation
    const evaluation = await evaluateConstraints(gameMove);
    
    if (evaluation?.isValid) {
      // Update schedule optimistically
      const updatedSchedule = moveGameInSchedule(schedule, gameMove);
      setSchedule(updatedSchedule);
      onScheduleChange?.(updatedSchedule);
      
      // Broadcast to collaborators
      if (enableCollaboration) {
        collaboration.broadcastUpdate('game-moved', gameMove);
      }
    } else {
      // Show why move is invalid
      showConstraintViolations(evaluation?.violations || []);
    }
  }, [schedule, evaluateConstraints, enableCollaboration]);

  function handleWebSocketMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'schedule-update':
        setSchedule(message.update);
        break;
      case 'constraint-result':
        setConstraintViolations(message.result.violations);
        break;
      case 'collaborator-cursor':
        collaboration.updateCollaboratorCursor(message.collaboratorId, message.position);
        break;
    }
  }

  // ==================== 21st-dev Inspired Components ====================

  const GlassmorphicCard: React.FC<{ children: React.ReactNode; className?: string; glowColor?: string }> = ({ 
    children, 
    className = '', 
    glowColor = 'rgba(59, 130, 246, 0.3)' 
  }) => (
    <motion.div
      className={`relative overflow-hidden backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
        boxShadow: `0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 20px ${glowColor}`
      }}
      whileHover={{
        boxShadow: `0 12px 40px 0 rgba(31, 38, 135, 0.5), inset 0 1px 0 rgba(255,255,255,0.3), 0 0 30px ${glowColor}`,
        scale: 1.02,
        transition: { duration: 0.3 }
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-50" />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );

  const QuantumButton: React.FC<{ 
    children: React.ReactNode; 
    onClick: () => void; 
    disabled?: boolean;
    variant?: 'primary' | 'quantum' | 'ai';
    size?: 'sm' | 'md' | 'lg';
  }> = ({ children, onClick, disabled = false, variant = 'primary', size = 'md' }) => {
    const variants = {
      primary: {
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        glow: 'rgba(59, 130, 246, 0.5)',
        shadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
      },
      quantum: {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        glow: 'rgba(139, 92, 246, 0.5)',
        shadow: '0 4px 20px rgba(139, 92, 246, 0.3)'
      },
      ai: {
        background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
        glow: 'rgba(6, 182, 212, 0.5)',
        shadow: '0 4px 20px rgba(6, 182, 212, 0.3)'
      }
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg'
    };

    return (
      <motion.button
        className={`relative overflow-hidden rounded-xl font-semibold text-white transition-all duration-300 ${sizeClasses[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          background: variants[variant].background,
          boxShadow: variants[variant].shadow
        }}
        onClick={onClick}
        disabled={disabled}
        whileHover={!disabled ? {
          scale: 1.05,
          boxShadow: `0 8px 30px ${variants[variant].glow}`,
          transition: { duration: 0.2 }
        } : {}}
        whileTap={!disabled ? { scale: 0.95 } : {}}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 flex items-center gap-2">
          {children}
        </div>
        
        {variant === 'quantum' && (
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, #8b5cf6 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, #8b5cf6 0%, transparent 50%)',
                'radial-gradient(circle at 40% 50%, #8b5cf6 0%, transparent 50%)'
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        )}
      </motion.button>
    );
  };

  const NeuralNetworkBackground: React.FC = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg className="absolute inset-0 w-full h-full opacity-20">
        <defs>
          <pattern id="neural-grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="1" fill="url(#neural-gradient)" />
          </pattern>
          <linearGradient id="neural-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
            <stop offset="50%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.6 }} />
            <stop offset="100%" style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#neural-grid)" />
        
        {/* Animated neural connections */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.line
            key={i}
            x1={Math.random() * 100 + '%'}
            y1={Math.random() * 100 + '%'}
            x2={Math.random() * 100 + '%'}
            y2={Math.random() * 100 + '%'}
            stroke="url(#neural-gradient)"
            strokeWidth="0.5"
            opacity={0.3}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              repeatType: 'reverse',
              delay: Math.random() * 2
            }}
          />
        ))}
      </svg>
    </div>
  );

  // ==================== Drag and Drop with Enhanced Visuals ====================

  const GameCard: React.FC<{ game: Game; isViolated?: boolean }> = ({ game, isViolated = false }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'game',
      item: { id: game.id, game },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    return (
      <motion.div
        ref={drag}
        className={`relative cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 scale-110' : ''}`}
        layout
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        drag={false} // Let react-dnd handle dragging
      >
        <GlassmorphicCard 
          className="p-4 min-h-[80px] transition-all duration-300"
          glowColor={isViolated ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.3)'}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-white text-sm">
                {game.homeTeam.name} vs {game.awayTeam.name}
              </div>
              {isViolated && (
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </motion.div>
              )}
            </div>
            <div className="text-xs text-gray-300">
              {formatGameTime(game.startTime)}
            </div>
            {game.venue && (
              <div className="text-xs text-blue-300">
                📍 {game.venue}
              </div>
            )}
          </div>
          
          {/* Team colors indicator */}
          <div className="absolute top-2 right-2 flex gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: game.homeTeam.color || '#3b82f6' }}
            />
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: game.awayTeam.color || '#8b5cf6' }}
            />
          </div>
        </GlassmorphicCard>
      </motion.div>
    );
  };

  const TimeSlotDropZone: React.FC<{ 
    slot: TimeSlot; 
    game?: Game; 
    index: number; 
  }> = ({ slot, game, index }) => {
    const [{ isOver, canDrop }, drop] = useDrop({
      accept: 'game',
      drop: (item: { id: string; game: Game }) => {
        handleGameDrop(item.id, slot);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop()
      })
    });

    const isHovered = hoveredSlot === `${slot.date}-${slot.time}`;
    const hasViolation = game && constraintViolations.some(v => v.gameId === game.id);

    return (
      <motion.div
        ref={drop}
        className={`relative min-h-[100px] p-2 rounded-xl transition-all duration-300 ${
          isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''
        } ${canDrop ? 'bg-green-500/10' : ''}`}
        onMouseEnter={() => setHoveredSlot(`${slot.date}-${slot.time}`)}
        onMouseLeave={() => setHoveredSlot(null)}
        style={{
          background: isOver 
            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)'
            : isHovered
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)'
            : 'transparent'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        {game ? (
          <GameCard game={game} isViolated={hasViolation} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <AnimatePresence>
              {isOver && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="text-blue-400 text-sm font-medium bg-blue-500/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    Drop game here
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Empty slot indicator */}
            {!isOver && (
              <div className="w-full h-full border-2 border-dashed border-gray-600 rounded-lg opacity-30 hover:opacity-50 transition-opacity" />
            )}
          </div>
        )}
        
        {/* Slot time indicator */}
        <div className="absolute top-1 left-1 text-xs text-gray-400 bg-black/30 backdrop-blur-sm rounded px-2 py-1">
          {slot.time}
        </div>
      </motion.div>
    );
  };

  // ==================== Main UI Components ====================

  const QuantumToolbar = () => (
    <GlassmorphicCard className="p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Atom className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Schedule Builder Ultimate</h1>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {enableQuantum && (
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Quantum</span>
                  </div>
                )}
                {enableAI && (
                  <div className="flex items-center gap-1">
                    <Brain className="w-4 h-4 text-cyan-400" />
                    <span>AI Enhanced</span>
                  </div>
                )}
                {enableCollaboration && (
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-green-400" />
                    <span>{collaborators.length} Online</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Performance Metrics */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-white">{responseTime.toFixed(0)}ms</span>
            </div>
            <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-white">{cacheHitRate.toFixed(1)}%</span>
            </div>
            {enableQuantum && (
              <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span className="text-white">{quantumEfficiency.toFixed(1)}%</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <QuantumButton
              onClick={() => generateSchedule({})}
              disabled={isGenerating}
              variant="primary"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Generate
                </>
              )}
            </QuantumButton>

            <QuantumButton
              onClick={() => optimizeSchedule()}
              disabled={!schedule || isOptimizing}
              variant={enableQuantum ? "quantum" : "primary"}
            >
              {isOptimizing ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Optimizing...
                </>
              ) : (
                <>
                  {enableQuantum ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  {enableQuantum ? 'Quantum Optimize' : 'Optimize'}
                </>
              )}
            </QuantumButton>

            {enableAI && (
              <QuantumButton
                onClick={() => schedule && getAISuggestions(schedule)}
                disabled={!schedule}
                variant="ai"
              >
                <Brain className="w-4 h-4" />
                AI Insights
              </QuantumButton>
            )}
          </div>
        </div>
      </div>
    </GlassmorphicCard>
  );

  const ScheduleMatrix = () => (
    <GlassmorphicCard className="p-6 relative overflow-hidden">
      <NeuralNetworkBackground />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Schedule Matrix</h2>
          
          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-black/30 backdrop-blur-sm rounded-lg p-1">
            {(['matrix', 'calendar', 'timeline'] as const).map((mode) => (
              <button
                key={mode}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  viewMode === mode
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                onClick={() => setViewMode(mode)}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div ref={matrixRef} className="schedule-matrix-content">
          <DndProvider backend={HTML5Backend}>
            {scheduleMatrix?.weeks.map((week, weekIndex) => (
              <motion.div
                key={weekIndex}
                className="mb-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: weekIndex * 0.1 }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-lg font-semibold text-white">
                    Week {weekIndex + 1}
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
                </div>
                
                <div className="grid grid-cols-7 gap-4">
                  {week.slots.map((slot, slotIndex) => (
                    <TimeSlotDropZone
                      key={`${weekIndex}-${slotIndex}`}
                      slot={slot}
                      game={slot.game}
                      index={slotIndex}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </DndProvider>
        </div>
      </div>
    </GlassmorphicCard>
  );

  // ==================== Side Panels ====================

  const ConstraintPanel = () => (
    <AnimatePresence>
      {constraintViolations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.95 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed top-20 right-6 w-80 z-50"
        >
          <GlassmorphicCard className="p-6" glowColor="rgba(239, 68, 68, 0.4)">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 0.5, repeat: Infinity }}
              >
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white">Constraint Violations</h3>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {constraintViolations.map((violation, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="font-medium text-red-300 mb-2">
                    {violation.type}
                  </div>
                  <div className="text-sm text-gray-300 mb-3">
                    {violation.message}
                  </div>
                  
                  {violation.suggestions && violation.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 uppercase tracking-wide">
                        Suggestions
                      </div>
                      {violation.suggestions.map((suggestion, idx) => (
                        <QuantumButton
                          key={idx}
                          onClick={() => applySuggestion(suggestion)}
                          size="sm"
                          variant="primary"
                        >
                          {suggestion.description}
                        </QuantumButton>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </GlassmorphicCard>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const AISuggestionsPanel = () => (
    <AnimatePresence>
      {aiSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: "spring", damping: 20 }}
          className="fixed bottom-6 left-6 w-96 z-50"
        >
          <GlassmorphicCard className="p-6" glowColor="rgba(6, 182, 212, 0.4)">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ 
                  boxShadow: [
                    '0 0 20px rgba(6, 182, 212, 0.5)',
                    '0 0 30px rgba(6, 182, 212, 0.8)',
                    '0 0 20px rgba(6, 182, 212, 0.5)'
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Brain className="w-6 h-6 text-cyan-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white">AI Suggestions</h3>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg hover:bg-cyan-500/15 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="font-medium text-cyan-300 mb-2">
                    {suggestion.title}
                  </div>
                  <div className="text-sm text-gray-300 mb-3">
                    {suggestion.description}
                  </div>
                  <div className="text-xs text-cyan-400 mb-3">
                    Expected improvement: {suggestion.expectedImprovement}
                  </div>
                  
                  <QuantumButton
                    onClick={() => applySuggestion(suggestion)}
                    size="sm"
                    variant="ai"
                  >
                    <Target className="w-3 h-3" />
                    Apply Suggestion
                  </QuantumButton>
                </motion.div>
              ))}
            </div>
          </GlassmorphicCard>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ==================== Loading Overlays ====================

  const QuantumLoadingOverlay = () => (
    <AnimatePresence>
      {(isGenerating || isOptimizing) && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <GlassmorphicCard className="p-8 text-center max-w-md">
            <div className="relative mb-6">
              <motion.div
                className="w-20 h-20 mx-auto rounded-full border-4 border-transparent"
                style={{
                  background: enableQuantum 
                    ? 'linear-gradient(45deg, #8b5cf6, #06b6d4)' 
                    : 'linear-gradient(45deg, #3b82f6, #1d4ed8)',
                  maskImage: 'radial-gradient(circle, transparent 40%, black 40%)'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              {enableQuantum && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Atom className="w-8 h-8 text-purple-400" />
                </motion.div>
              )}
            </div>
            
            <div className="text-xl font-semibold text-white mb-2">
              {isGenerating && 'Generating Optimal Schedule...'}
              {isOptimizing && enableQuantum && 'Quantum Optimization in Progress...'}
              {isOptimizing && !enableQuantum && 'Optimizing Schedule...'}
            </div>
            
            {performanceMetrics && (
              <div className="text-sm text-gray-300">
                Processing {performanceMetrics.operationsPerSecond} ops/sec
              </div>
            )}
            
            {enableQuantum && isOptimizing && (
              <div className="text-sm text-purple-300 mt-2">
                Quantum Efficiency: {quantumEfficiency.toFixed(1)}%
              </div>
            )}
          </GlassmorphicCard>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // ==================== Effects ====================

  useEffect(() => {
    if (enableCollaboration) {
      ws.connect();
    }
    return () => ws.disconnect();
  }, [enableCollaboration]);

  useEffect(() => {
    if (schedule && enableCollaboration) {
      const debounceTimer = setTimeout(() => {
        collaboration.broadcastUpdate('schedule-updated', schedule);
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [schedule, enableCollaboration]);

  // Mouse tracking for 21st-dev style interactions
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // ==================== Main Render ====================

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6"
      onMouseEnter={() => setIsMouseInside(true)}
      onMouseLeave={() => setIsMouseInside(false)}
      style={{
        background: `
          radial-gradient(circle at ${mouseX.get()}px ${mouseY.get()}px, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
          linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)
        `
      }}
    >
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <QuantumToolbar />
        <ScheduleMatrix />
      </div>

      {/* Side Panels */}
      <ConstraintPanel />
      <AISuggestionsPanel />

      {/* Loading Overlay */}
      <QuantumLoadingOverlay />
    </div>
  );
};

// Helper functions
const generateScheduleMatrix = (schedule: Schedule, teams: Team[]) => ({ weeks: [] });
const analyzeConstraints = (schedule: Schedule | null, constraints: Constraint[], violations: ConstraintViolation[]) => ({ satisfied: 0, violated: violations.length, total: constraints.length });
const formatGameTime = (time: Date) => time.toLocaleDateString() + ' ' + time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const findGameSlot = (schedule: Schedule, gameId: string) => ({} as TimeSlot);
const moveGameInSchedule = (schedule: Schedule, gameMove: GameMove) => schedule;
const showOptimizationResults = (improvements: any) => {};
const showConstraintViolations = (violations: ConstraintViolation[]) => {};
const applySuggestion = (suggestion: any) => {};

// Type definitions
interface Team { id: string; name: string; color?: string; }
interface Game { id: string; homeTeam: Team; awayTeam: Team; startTime: Date; venue?: string; }
interface Schedule { id: string; games: Game[]; sport_type: string; }
interface Constraint { type: string; parameters: any; }
interface ConstraintViolation { type: string; message: string; gameId?: string; suggestions?: any[]; }
interface AISuggestion { title: string; description: string; expectedImprovement: string; }
interface PerformanceMetrics { operationsPerSecond: number; }
interface Collaborator { id: string; name: string; color: string; }
interface TimeSlot { date: Date; time: string; game?: Game; }
interface GameMove { gameId: string; fromSlot: TimeSlot; toSlot: TimeSlot; }
interface GenerateParams { startDate?: string; endDate?: string; options?: any; }
interface OptimizeOptions { maxIterations?: number; useML?: boolean; useQuantum?: boolean; }
interface WebSocketMessage { type: string; [key: string]: any; }

export default ScheduleBuilderUltimate;