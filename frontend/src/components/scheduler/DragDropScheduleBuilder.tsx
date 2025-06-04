import React, { useState, useEffect } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { useAnimation } from '../../contexts/AnimationContext';
import { useTheme } from '../../contexts/ThemeContext';
import './DragDropScheduleBuilder.css';

// Types
interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  date?: string;
  time?: string;
  venue?: string;
  constraints?: Constraint[];
}

interface TimeSlot {
  date: string;
  time: string;
  venue: string;
  occupied?: boolean;
  gameId?: string;
}

interface Constraint {
  id: string;
  type: 'rest_days' | 'travel_distance' | 'venue_conflict' | 'championship_date' | 'custom';
  severity: 'error' | 'warning' | 'info';
  message: string;
  affectedGames?: string[];
}

interface ConflictResult {
  hasConflicts: boolean;
  conflicts: Constraint[];
  warnings: Constraint[];
}

interface DragItem {
  type: 'GAME';
  game: Game;
  originalSlot?: TimeSlot;
}

// Draggable Game Card Component
const DraggableGameCard: React.FC<{
  game: Game;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}> = ({ game, onDragStart, onDragEnd }) => {
  const { animationQuality } = useAnimation();
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'GAME',
    item: { type: 'GAME', game },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    begin: () => onDragStart?.(),
    end: () => onDragEnd?.(),
  }));

  return (
    <motion.div
      ref={drag}
      className={`ft-draggable-game ${isDragging ? 'ft-dragging' : ''}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 2 : 0
      }}
      transition={{ duration: animationQuality === 'full' ? 0.2 : 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="ft-game-header">
        <span className="ft-game-sport">{game.sport}</span>
        <span className="ft-game-id">#{game.id}</span>
      </div>
      <div className="ft-game-teams">
        <div className="ft-team ft-team-away">{game.awayTeam}</div>
        <span className="ft-vs">@</span>
        <div className="ft-team ft-team-home">{game.homeTeam}</div>
      </div>
      {game.date && game.time && (
        <div className="ft-game-schedule">
          <span className="ft-game-date">{game.date}</span>
          <span className="ft-game-time">{game.time}</span>
        </div>
      )}
      {game.venue && (
        <div className="ft-game-venue">{game.venue}</div>
      )}
    </motion.div>
  );
};

// Droppable Time Slot Component
const DroppableTimeSlot: React.FC<{
  slot: TimeSlot;
  onDrop: (game: Game, slot: TimeSlot) => void;
  onDragOver: (game: Game, slot: TimeSlot) => void;
  conflicts?: Constraint[];
  isHighlighted?: boolean;
}> = ({ slot, onDrop, onDragOver, conflicts = [], isHighlighted }) => {
  const { animationQuality } = useAnimation();
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'GAME',
    drop: (item: DragItem) => onDrop(item.game, slot),
    hover: (item: DragItem) => onDragOver(item.game, slot),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }));

  const hasErrors = conflicts.some(c => c.severity === 'error');
  const hasWarnings = conflicts.some(c => c.severity === 'warning');

  return (
    <motion.div
      ref={drop}
      className={`
        ft-drop-zone 
        ${isOver ? 'ft-drop-zone-hover' : ''} 
        ${canDrop && !hasErrors ? 'ft-drop-zone-active' : ''}
        ${hasErrors ? 'ft-drop-zone-error' : ''}
        ${hasWarnings ? 'ft-drop-zone-warning' : ''}
        ${isHighlighted ? 'ft-drop-zone-highlighted' : ''}
        ${slot.occupied ? 'ft-drop-zone-occupied' : ''}
      `}
      animate={{
        scale: isOver ? 1.02 : 1,
        borderColor: hasErrors ? 'var(--ft-error)' : 
                    hasWarnings ? 'var(--ft-warning)' : 
                    isOver ? 'var(--ft-golden-hour)' : 'var(--ft-glass-border)'
      }}
      transition={{ duration: animationQuality === 'full' ? 0.3 : 0 }}
    >
      <div className="ft-slot-header">
        <span className="ft-slot-date">{slot.date}</span>
        <span className="ft-slot-time">{slot.time}</span>
      </div>
      <div className="ft-slot-venue">{slot.venue}</div>
      
      {slot.gameId && (
        <div className="ft-slot-occupied-indicator">
          <span>Occupied</span>
        </div>
      )}
      
      {conflicts.length > 0 && (
        <div className="ft-slot-conflicts">
          {conflicts.map((conflict, index) => (
            <div 
              key={index} 
              className={`ft-conflict-indicator ft-conflict-${conflict.severity}`}
            >
              <span className="ft-conflict-icon">
                {conflict.severity === 'error' ? '⚠️' : 
                 conflict.severity === 'warning' ? '⚡' : 'ℹ️'}
              </span>
              <span className="ft-conflict-message">{conflict.message}</span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

// Main Drag & Drop Schedule Builder Component
export const DragDropScheduleBuilder: React.FC<{
  games: Game[];
  timeSlots: TimeSlot[];
  constraints: Constraint[];
  onGameMove: (gameId: string, newSlot: TimeSlot) => Promise<void>;
  onConflictDetected?: (conflicts: ConflictResult) => void;
}> = ({ games, timeSlots, constraints, onGameMove, onConflictDetected }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { animationQuality } = useAnimation();
  const [unscheduledGames, setUnscheduledGames] = useState<Game[]>([]);
  const [scheduledGames, setScheduledGames] = useState<Map<string, Game>>(new Map());
  const [currentConflicts, setCurrentConflicts] = useState<Map<string, Constraint[]>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [draggedGame, setDraggedGame] = useState<Game | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize games
  useEffect(() => {
    const scheduled = new Map<string, Game>();
    const unscheduled: Game[] = [];
    
    games.forEach(game => {
      if (game.date && game.time) {
        const slotKey = `${game.date}-${game.time}-${game.venue}`;
        scheduled.set(slotKey, game);
      } else {
        unscheduled.push(game);
      }
    });
    
    setScheduledGames(scheduled);
    setUnscheduledGames(unscheduled);
  }, [games]);
  
  // Detect conflicts for a potential move
  const detectConflicts = async (
    game: Game, 
    slot: TimeSlot
  ): Promise<ConflictResult> => {
    const conflicts: Constraint[] = [];
    const warnings: Constraint[] = [];
    
    // Check venue conflicts
    const slotKey = `${slot.date}-${slot.time}-${slot.venue}`;
    if (scheduledGames.has(slotKey)) {
      conflicts.push({
        id: 'venue-conflict',
        type: 'venue_conflict',
        severity: 'error',
        message: 'This time slot is already occupied',
      });
    }
    
    // Check rest days between games
    const sameTeamGames = Array.from(scheduledGames.values()).filter(
      g => g.homeTeam === game.homeTeam || g.awayTeam === game.awayTeam ||
           g.homeTeam === game.awayTeam || g.awayTeam === game.homeTeam
    );
    
    sameTeamGames.forEach(otherGame => {
      if (otherGame.date) {
        const daysDiff = Math.abs(
          new Date(slot.date).getTime() - new Date(otherGame.date).getTime()
        ) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 2) {
          warnings.push({
            id: 'rest-days',
            type: 'rest_days',
            severity: 'warning',
            message: `Less than 2 days rest from game on ${otherGame.date}`,
          });
        }
      }
    });
    
    // Apply custom constraints
    constraints.forEach(constraint => {
      if (constraint.affectedGames?.includes(game.id)) {
        if (constraint.severity === 'error') {
          conflicts.push(constraint);
        } else {
          warnings.push(constraint);
        }
      }
    });
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
      warnings,
    };
  };
  
  // Handle drag start
  const handleDragStart = (game: Game) => {
    setDraggedGame(game);
    document.body.classList.add('ft-dragging-active');
  };
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedGame(null);
    setHoveredSlot(null);
    setCurrentConflicts(new Map());
    document.body.classList.remove('ft-dragging-active');
  };
  
  // Handle drag over slot
  const handleDragOver = async (game: Game, slot: TimeSlot) => {
    setHoveredSlot(slot);
    
    const conflicts = await detectConflicts(game, slot);
    const slotKey = `${slot.date}-${slot.time}-${slot.venue}`;
    
    setCurrentConflicts(prev => {
      const newMap = new Map(prev);
      newMap.set(slotKey, [...conflicts.conflicts, ...conflicts.warnings]);
      return newMap;
    });
    
    if (onConflictDetected) {
      onConflictDetected(conflicts);
    }
  };
  
  // Handle drop
  const handleDrop = async (game: Game, slot: TimeSlot) => {
    setIsProcessing(true);
    
    try {
      const conflicts = await detectConflicts(game, slot);
      
      if (!conflicts.hasConflicts) {
        // Optimistic update
        const slotKey = `${slot.date}-${slot.time}-${slot.venue}`;
        setScheduledGames(prev => {
          const newMap = new Map(prev);
          newMap.set(slotKey, { ...game, date: slot.date, time: slot.time, venue: slot.venue });
          return newMap;
        });
        
        setUnscheduledGames(prev => prev.filter(g => g.id !== game.id));
        
        // Send to server
        await onGameMove(game.id, slot);
        
        // Show success animation
        showSuccessToast('Game scheduled successfully');
      } else {
        // Show error
        showErrorToast('Cannot place game here due to conflicts');
      }
    } catch (error) {
      console.error('Failed to move game:', error);
      showErrorToast('Failed to schedule game');
      
      // Revert optimistic update
      // TODO: Implement revert logic
    } finally {
      setIsProcessing(false);
      handleDragEnd();
    }
  };
  
  // Touch backend for mobile support
  const backend = 'ontouchstart' in window ? TouchBackend : HTML5Backend;
  
  return (
    <DndProvider backend={backend}>
      <div className="ft-schedule-builder">
        {/* Unscheduled Games Panel */}
        <div className="ft-unscheduled-panel">
          <h3 className="ft-panel-title">Unscheduled Games</h3>
          <div className="ft-unscheduled-games">
            <AnimatePresence>
              {unscheduledGames.map((game) => (
                <DraggableGameCard
                  key={game.id}
                  game={game}
                  onDragStart={() => handleDragStart(game)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Schedule Grid */}
        <div className="ft-schedule-grid-container">
          <h3 className="ft-panel-title">Schedule Grid</h3>
          <div className="ft-schedule-grid">
            {timeSlots.map((slot) => {
              const slotKey = `${slot.date}-${slot.time}-${slot.venue}`;
              const conflicts = currentConflicts.get(slotKey) || [];
              const isHighlighted = hoveredSlot === slot;
              
              return (
                <DroppableTimeSlot
                  key={slotKey}
                  slot={slot}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  conflicts={conflicts}
                  isHighlighted={isHighlighted}
                />
              );
            })}
          </div>
        </div>
        
        {/* Conflict Resolution Panel */}
        {currentConflicts.size > 0 && (
          <motion.div 
            className="ft-conflict-panel"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h4>Detected Conflicts</h4>
            {Array.from(currentConflicts.values()).flat().map((conflict, index) => (
              <div key={index} className={`ft-conflict-item ft-conflict-${conflict.severity}`}>
                <span className="ft-conflict-type">{conflict.type}</span>
                <span className="ft-conflict-message">{conflict.message}</span>
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </DndProvider>
  );
};

// Helper functions for toast notifications
const showSuccessToast = (message: string) => {
  // TODO: Implement toast notification system
  console.log('Success:', message);
};

const showErrorToast = (message: string) => {
  // TODO: Implement toast notification system
  console.error('Error:', message);
};

export default DragDropScheduleBuilder;