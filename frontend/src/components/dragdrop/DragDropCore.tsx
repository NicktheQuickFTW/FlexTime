import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Box, Alert, Snackbar, Portal, Typography } from '@mui/material';
import { ConstraintType, ConstraintCategory, Game, Team, Venue } from '../../types';

// Drag & Drop Types
export interface DragItem {
  id: string;
  type: 'game' | 'team' | 'date' | 'constraint';
  data: Game | Team | string | any;
  metadata?: {
    originalPosition?: { row: number; col: number };
    source?: string;
    [key: string]: any;
  };
}

export interface DropTarget {
  id: string;
  type: 'matrix-cell' | 'planner' | 'constraint-zone' | 'trash';
  position?: { row: number; col: number };
  accepts: string[];
  data?: any;
  metadata?: {
    date?: string;
    venue?: Venue;
    homeTeam?: Team;
    awayTeam?: Team;
    [key: string]: any;
  };
}

export interface Conflict {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'rest-days' | 'venue-unavailable' | 'team-unavailable' | 'consecutive-games' | 'travel-burden' | 'resource-conflict';
  message: string;
  details: string;
  affectedItems: string[];
  suggestedResolution?: string;
  autoResolvable: boolean;
  timestamp: number;
}

export interface DragDropContextValue {
  draggedItem: DragItem | null;
  dropTarget: DropTarget | null;
  conflicts: Conflict[];
  isDragging: boolean;
  conflictPreview: Conflict[];
  
  // Methods
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  setDropTarget: (target: DropTarget | null) => void;
  handleDragOver: (target: DropTarget) => Promise<void>;
  clearConflicts: () => void;
  detectConflicts: (item: DragItem, target: DropTarget) => Promise<Conflict[]>;
}

// Context
const DragDropContext = createContext<DragDropContextValue | null>(null);

export const useDragDrop = () => {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
};

// Provider Props
interface DragDropProviderProps {
  children: React.ReactNode;
  onDrop: (item: DragItem, target: DropTarget) => Promise<void>;
  onConflictDetected: (conflicts: Conflict[]) => void;
  constraints?: any[];
  scheduleData?: any;
  enableRealTimeValidation?: boolean;
}

// Main Provider Component
export const DragDropProvider: React.FC<DragDropProviderProps> = ({ 
  children, 
  onDrop, 
  onConflictDetected,
  constraints = [],
  scheduleData = {},
  enableRealTimeValidation = true
}) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dropTarget, setDropTargetState] = useState<DropTarget | null>(null);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [conflictPreview, setConflictPreview] = useState<Conflict[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showConflictAlert, setShowConflictAlert] = useState(false);
  
  const conflictDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastConflictCheckRef = useRef<string>('');

  // Conflict Detection Logic
  const detectConflicts = useCallback(async (item: DragItem, target: DropTarget): Promise<Conflict[]> => {
    if (!enableRealTimeValidation) return [];
    
    const detectedConflicts: Conflict[] = [];
    const timestamp = Date.now();

    try {
      // Game placement conflicts
      if (item.type === 'game' && target.type === 'matrix-cell') {
        const game = item.data as Game;
        const { row, col } = target.position || { row: 0, col: 0 };
        const targetDate = target.metadata?.date;
        const targetVenue = target.metadata?.venue;

        // Check rest days constraint
        if (scheduleData.games) {
          const existingGames = scheduleData.games.filter((g: Game) => 
            g.home_team_id === game.home_team_id || 
            g.away_team_id === game.away_team_id ||
            g.home_team_id === game.away_team_id || 
            g.away_team_id === game.home_team_id
          );

          for (const existingGame of existingGames) {
            if (existingGame.date && targetDate) {
              const daysDiff = Math.abs(
                (new Date(targetDate).getTime() - new Date(existingGame.date).getTime()) / (1000 * 60 * 60 * 24)
              );
              
              if (daysDiff < 1) {
                detectedConflicts.push({
                  id: `rest-days-${timestamp}-${detectedConflicts.length}`,
                  severity: 'high',
                  type: 'rest-days',
                  message: 'Insufficient rest period between games',
                  details: `Teams need at least 1 day rest between games. Current gap: ${daysDiff.toFixed(1)} days`,
                  affectedItems: [game.game_id?.toString() || '', existingGame.game_id?.toString() || ''],
                  suggestedResolution: 'Move one of the games to a different date',
                  autoResolvable: false,
                  timestamp
                });
              }
            }
          }
        }

        // Check venue unavailability
        if (targetVenue?.unavailableDates && targetDate) {
          const isVenueUnavailable = targetVenue.unavailableDates.some(unavailableDate => 
            new Date(unavailableDate).toDateString() === new Date(targetDate).toDateString()
          );

          if (isVenueUnavailable) {
            detectedConflicts.push({
              id: `venue-unavailable-${timestamp}-${detectedConflicts.length}`,
              severity: 'critical',
              type: 'venue-unavailable',
              message: 'Venue is unavailable on selected date',
              details: `${targetVenue.name} is not available on ${targetDate}`,
              affectedItems: [game.game_id?.toString() || '', targetVenue.venue_id?.toString() || ''],
              suggestedResolution: 'Select a different date or venue',
              autoResolvable: false,
              timestamp
            });
          }
        }

        // Check for consecutive away games
        const consecutiveAwayGames = scheduleData.games?.filter((g: Game) => 
          g.away_team_id === game.away_team_id
        ).length || 0;

        if (consecutiveAwayGames >= 3) {
          detectedConflicts.push({
            id: `consecutive-away-${timestamp}-${detectedConflicts.length}`,
            severity: 'medium',
            type: 'consecutive-games',
            message: 'Too many consecutive away games',
            details: `Team would have ${consecutiveAwayGames + 1} consecutive away games`,
            affectedItems: [game.game_id?.toString() || ''],
            suggestedResolution: 'Schedule a home game to break the sequence',
            autoResolvable: true,
            timestamp
          });
        }

        // Check capacity constraints
        if (targetVenue && game.homeTeam && game.awayTeam) {
          const estimatedAttendance = Math.max(
            (game.homeTeam as any).averageAttendance || 0,
            (game.awayTeam as any).averageAttendance || 0
          );

          if (estimatedAttendance > targetVenue.capacity) {
            detectedConflicts.push({
              id: `capacity-${timestamp}-${detectedConflicts.length}`,
              severity: 'medium',
              type: 'resource-conflict',
              message: 'Venue capacity may be insufficient',
              details: `Estimated attendance (${estimatedAttendance}) exceeds venue capacity (${targetVenue.capacity})`,
              affectedItems: [game.game_id?.toString() || '', targetVenue.venue_id?.toString() || ''],
              suggestedResolution: 'Consider a larger venue or adjust expectations',
              autoResolvable: false,
              timestamp
            });
          }
        }
      }

      // Team scheduling conflicts
      if (item.type === 'team' && target.type === 'matrix-cell') {
        const team = item.data as Team;
        const targetDate = target.metadata?.date;

        // Check if team already has a game on this date
        const existingGameOnDate = scheduleData.games?.find((g: Game) => 
          (g.home_team_id === team.team_id || g.away_team_id === team.team_id) && 
          g.date === targetDate
        );

        if (existingGameOnDate) {
          detectedConflicts.push({
            id: `team-conflict-${timestamp}-${detectedConflicts.length}`,
            severity: 'critical',
            type: 'team-unavailable',
            message: 'Team already has a game on this date',
            details: `${team.name} is already scheduled to play on ${targetDate}`,
            affectedItems: [team.team_id?.toString() || '', existingGameOnDate.game_id?.toString() || ''],
            suggestedResolution: 'Choose a different date for this matchup',
            autoResolvable: false,
            timestamp
          });
        }
      }

      // Constraint-specific validations
      constraints.forEach(constraint => {
        if (constraint.type === ConstraintType.REST_DAYS) {
          const minRestDays = constraint.parameters.minDays || 1;
          // Add specific rest days validation logic here
        }

        if (constraint.type === ConstraintType.VENUE_UNAVAILABILITY) {
          const unavailableDates = constraint.parameters.dates || [];
          const targetDate = target.metadata?.date;
          
          if (unavailableDates.includes(targetDate)) {
            detectedConflicts.push({
              id: `constraint-venue-${timestamp}-${detectedConflicts.length}`,
              severity: 'high',
              type: 'venue-unavailable',
              message: 'Date conflicts with venue unavailability constraint',
              details: `Venue is marked as unavailable on ${targetDate} due to constraint rules`,
              affectedItems: [constraint.constraint_id?.toString() || ''],
              suggestedResolution: 'Select a different date',
              autoResolvable: false,
              timestamp
            });
          }
        }
      });

    } catch (error) {
      console.error('Error during conflict detection:', error);
      detectedConflicts.push({
        id: `error-${timestamp}`,
        severity: 'low',
        type: 'resource-conflict',
        message: 'Unable to validate placement',
        details: 'An error occurred during conflict detection',
        affectedItems: [],
        suggestedResolution: 'Manual verification recommended',
        autoResolvable: false,
        timestamp
      });
    }

    return detectedConflicts;
  }, [constraints, scheduleData, enableRealTimeValidation]);

  // Real-time conflict detection during drag
  const handleDragOver = useCallback(async (target: DropTarget) => {
    if (!draggedItem || !enableRealTimeValidation) return;
    
    // Debounce conflict detection
    if (conflictDetectionTimeoutRef.current) {
      clearTimeout(conflictDetectionTimeoutRef.current);
    }

    const checkKey = `${draggedItem.id}-${target.id}`;
    if (lastConflictCheckRef.current === checkKey) return;

    conflictDetectionTimeoutRef.current = setTimeout(async () => {
      try {
        const detectedConflicts = await detectConflicts(draggedItem, target);
        setConflictPreview(detectedConflicts);
        
        if (detectedConflicts.length > 0) {
          onConflictDetected(detectedConflicts);
          setShowConflictAlert(true);
        }
        
        lastConflictCheckRef.current = checkKey;
      } catch (error) {
        console.error('Error in handleDragOver:', error);
      }
    }, 150); // 150ms debounce
  }, [draggedItem, detectConflicts, onConflictDetected, enableRealTimeValidation]);

  // Drag operations
  const startDrag = useCallback((item: DragItem) => {
    setDraggedItem(item);
    setIsDragging(true);
    setConflicts([]);
    setConflictPreview([]);
  }, []);

  const endDrag = useCallback(() => {
    setDraggedItem(null);
    setIsDragging(false);
    setDropTargetState(null);
    setConflictPreview([]);
    
    if (conflictDetectionTimeoutRef.current) {
      clearTimeout(conflictDetectionTimeoutRef.current);
    }
    lastConflictCheckRef.current = '';
  }, []);

  const setDropTarget = useCallback((target: DropTarget | null) => {
    setDropTargetState(target);
    if (target && draggedItem) {
      handleDragOver(target);
    }
  }, [draggedItem, handleDragOver]);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setConflictPreview([]);
    setShowConflictAlert(false);
  }, []);

  // Context value
  const contextValue: DragDropContextValue = {
    draggedItem,
    dropTarget,
    conflicts,
    isDragging,
    conflictPreview,
    startDrag,
    endDrag,
    setDropTarget,
    handleDragOver,
    clearConflicts,
    detectConflicts
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (conflictDetectionTimeoutRef.current) {
        clearTimeout(conflictDetectionTimeoutRef.current);
      }
    };
  }, []);

  return (
    <DragDropContext.Provider value={contextValue}>
      {children}
      
      {/* Conflict Alert */}
      <Snackbar
        open={showConflictAlert && conflictPreview.length > 0}
        autoHideDuration={4000}
        onClose={() => setShowConflictAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity={conflictPreview.some(c => c.severity === 'critical') ? 'error' : 
                   conflictPreview.some(c => c.severity === 'high') ? 'warning' : 'info'}
          onClose={() => setShowConflictAlert(false)}
          sx={{ minWidth: '400px' }}
        >
          <Typography variant="subtitle2">
            {conflictPreview.length} conflict{conflictPreview.length !== 1 ? 's' : ''} detected
          </Typography>
          <Typography variant="body2">
            {conflictPreview[0]?.message}
            {conflictPreview.length > 1 && ` and ${conflictPreview.length - 1} more`}
          </Typography>
        </Alert>
      </Snackbar>

      {/* Drag Preview Overlay */}
      {isDragging && draggedItem && (
        <Portal>
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 9999,
              '& .drag-preview': {
                position: 'absolute',
                backgroundColor: 'rgba(0, 102, 204, 0.1)',
                border: '2px dashed #0066cc',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0066cc',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 20px rgba(0, 102, 204, 0.3)',
                transform: 'translate(-50%, -50%)',
                whiteSpace: 'nowrap',
                maxWidth: '200px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }
            }}
          >
            <div className="drag-preview">
              {draggedItem.type === 'game' ? 
                `Game: ${(draggedItem.data as Game).homeTeam?.name} vs ${(draggedItem.data as Game).awayTeam?.name}` :
                draggedItem.type === 'team' ?
                `Team: ${(draggedItem.data as Team).name}` :
                `${draggedItem.type}: ${draggedItem.id}`
              }
            </div>
          </Box>
        </Portal>
      )}
    </DragDropContext.Provider>
  );
};

// Utility Hooks
export const useDragItem = (item: DragItem) => {
  const { startDrag, endDrag, isDragging, draggedItem } = useDragDrop();
  
  const isDraggedItem = draggedItem?.id === item.id;
  
  const dragProps = {
    draggable: true,
    onDragStart: () => startDrag(item),
    onDragEnd: endDrag,
    style: {
      opacity: isDraggedItem ? 0.5 : 1,
      cursor: 'grab',
      transition: 'opacity 0.2s ease'
    }
  };
  
  return { dragProps, isDragging: isDraggedItem };
};

export const useDropTarget = (target: DropTarget) => {
  const { setDropTarget, draggedItem, conflictPreview } = useDragDrop();
  
  const canDrop = draggedItem ? target.accepts.includes(draggedItem.type) : false;
  const hasConflicts = conflictPreview.length > 0;
  const conflictSeverity = conflictPreview.reduce((max, conflict) => {
    const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
    const currentSeverity = severityOrder[conflict.severity] || 0;
    const maxSeverity = severityOrder[max] || 0;
    return currentSeverity > maxSeverity ? conflict.severity : max;
  }, 'low' as Conflict['severity']);
  
  const dropProps = {
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      if (canDrop) {
        setDropTarget(target);
      }
    },
    onDragLeave: () => {
      setDropTarget(null);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      setDropTarget(null);
    },
    style: {
      backgroundColor: !canDrop ? 'transparent' : 
                     hasConflicts ? 
                       conflictSeverity === 'critical' ? 'rgba(244, 67, 54, 0.1)' :
                       conflictSeverity === 'high' ? 'rgba(255, 152, 0, 0.1)' :
                       'rgba(255, 193, 7, 0.1)' :
                     'rgba(76, 175, 80, 0.1)',
      border: !canDrop ? 'none' :
              hasConflicts ?
                conflictSeverity === 'critical' ? '2px dashed #f44336' :
                conflictSeverity === 'high' ? '2px dashed #ff9800' :
                '2px dashed #ffc107' :
              '2px dashed #4caf50',
      transition: 'all 0.2s ease'
    }
  };
  
  return { 
    dropProps, 
    canDrop, 
    hasConflicts, 
    conflictSeverity,
    conflicts: conflictPreview 
  };
};

export default DragDropProvider;