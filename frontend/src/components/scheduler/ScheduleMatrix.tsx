import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider, useDrop, useDrag } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './ScheduleMatrix.css';

// Types
interface TimeSlot {
  id: string;
  date: string;
  time: string;
  venue?: string;
  venueId?: string;
  capacity: number;
  occupied: boolean;
  conflicts: string[];
}

interface Game {
  id: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  slotId?: string;
  date?: string;
  time?: string;
  venue?: string;
  status: 'scheduled' | 'pending' | 'conflict';
  priority: number;
  constraints: string[];
}

interface Schedule {
  id: string;
  name: string;
  sport: string;
  season: string;
  dateRange: {
    start: string;
    end: string;
  };
  venues: string[];
  teams: string[];
}

interface Constraint {
  id: string;
  type: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  affectedGames: string[];
}

interface ConflictResult {
  id: string;
  gameId?: string;
  slotId?: string;
  type: 'venue' | 'team' | 'time' | 'travel';
  severity: 'high' | 'medium' | 'low';
  description: string;
}

interface ScheduleMatrixProps {
  schedule: Schedule;
  games: Game[];
  constraints: Constraint[];
  onGameMove: (gameId: string, newSlot: TimeSlot) => Promise<void>;
  viewMode: 'timeline' | 'calendar' | 'matrix';
}

// Drop Zone Component
interface DropZoneProps {
  slot: TimeSlot;
  onDrop: (gameId: string, newSlot: TimeSlot) => Promise<void>;
  conflicts: ConflictResult[];
  children: React.ReactNode;
}

const DropZone: React.FC<DropZoneProps> = ({ slot, onDrop, conflicts, children }) => {
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'game',
    drop: (item: { gameId: string }) => {
      onDrop(item.gameId, slot);
    },
    canDrop: () => !slot.occupied || slot.capacity > 1,
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const hasConflicts = conflicts.length > 0;
  const hasHighPriorityConflicts = conflicts.some(c => c.severity === 'high');

  return (
    <div
      ref={drop}
      className={`
        ft-drop-zone
        ${isOver ? 'ft-drop-zone--hover' : ''}
        ${canDrop ? 'ft-drop-zone--can-drop' : 'ft-drop-zone--cannot-drop'}
        ${slot.occupied ? 'ft-drop-zone--occupied' : 'ft-drop-zone--available'}
        ${hasConflicts ? 'ft-drop-zone--conflicts' : ''}
        ${hasHighPriorityConflicts ? 'ft-drop-zone--high-conflict' : ''}
      `}
      data-slot-id={slot.id}
      data-time={slot.time}
      data-venue={slot.venue}
    >
      <div className="ft-drop-zone-header">
        <span className="ft-slot-time">{slot.time}</span>
        {slot.venue && <span className="ft-slot-venue">{slot.venue}</span>}
        {hasConflicts && (
          <div className="ft-conflict-indicator">
            <span className="ft-conflict-count">{conflicts.length}</span>
            <div className="ft-conflict-tooltip">
              {conflicts.map(conflict => (
                <div key={conflict.id} className={`ft-conflict-item ft-conflict-${conflict.severity}`}>
                  {conflict.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="ft-drop-zone-content">
        {children}
      </div>

      {isOver && canDrop && (
        <div className="ft-drop-indicator">
          <div className="ft-drop-indicator-content">
            <span>Drop here to schedule</span>
          </div>
        </div>
      )}

      {isOver && !canDrop && (
        <div className="ft-drop-indicator ft-drop-indicator--invalid">
          <div className="ft-drop-indicator-content">
            <span>Cannot schedule here</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Game Card Component
interface GameCardProps {
  game: Game;
  onUpdate: (gameId: string, newSlot: TimeSlot) => Promise<void>;
  conflicts: ConflictResult[];
}

const GameCard: React.FC<GameCardProps> = ({ game, conflicts }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'game',
    item: { gameId: game.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const hasConflicts = conflicts.length > 0;
  const statusColor = {
    scheduled: 'var(--flextime-success)',
    pending: 'var(--flextime-warning)',
    conflict: 'var(--flextime-danger)'
  }[game.status];

  return (
    <div
      ref={drag}
      className={`
        ft-game-card
        ft-game-card--${game.status}
        ${isDragging ? 'ft-game-card--dragging' : ''}
        ${hasConflicts ? 'ft-game-card--conflicts' : ''}
      `}
      style={{ '--status-color': statusColor } as React.CSSProperties}
    >
      <div className="ft-game-card-header">
        <div className="ft-game-teams">
          <span className="ft-away-team">{game.awayTeam}</span>
          <span className="ft-vs">@</span>
          <span className="ft-home-team">{game.homeTeam}</span>
        </div>
        {hasConflicts && (
          <div className="ft-game-conflicts">
            <span className="ft-conflict-badge">{conflicts.length}</span>
          </div>
        )}
      </div>
      
      <div className="ft-game-card-body">
        <div className="ft-game-sport">{game.sport}</div>
        {game.venue && <div className="ft-game-venue">{game.venue}</div>}
        <div className="ft-game-priority">Priority: {game.priority}</div>
      </div>

      {hasConflicts && (
        <div className="ft-game-conflict-details">
          {conflicts.map(conflict => (
            <div key={conflict.id} className={`ft-conflict-detail ft-conflict-${conflict.severity}`}>
              <span className="ft-conflict-type">{conflict.type}</span>
              <span className="ft-conflict-description">{conflict.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Matrix Generator Functions
const generateTimelineMatrix = (schedule: Schedule, games: Game[]): TimeSlot[][] => {
  const startDate = new Date(schedule.dateRange.start);
  const endDate = new Date(schedule.dateRange.end);
  const matrix: TimeSlot[][] = [];
  
  const timeSlots = ['09:00', '12:00', '15:00', '18:00', '21:00'];
  
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const row: TimeSlot[] = [];
    const dateStr = date.toISOString().split('T')[0];
    
    timeSlots.forEach((time, index) => {
      schedule.venues.forEach((venue, venueIndex) => {
        const slotId = `${dateStr}-${time}-${venue}`;
        const occupiedGames = games.filter(g => g.slotId === slotId);
        
        row.push({
          id: slotId,
          date: dateStr,
          time,
          venue,
          venueId: `venue-${venueIndex}`,
          capacity: 1,
          occupied: occupiedGames.length > 0,
          conflicts: []
        });
      });
    });
    
    matrix.push(row);
  }
  
  return matrix;
};

const generateCalendarMatrix = (schedule: Schedule, games: Game[]): TimeSlot[][] => {
  const startDate = new Date(schedule.dateRange.start);
  const endDate = new Date(schedule.dateRange.end);
  const matrix: TimeSlot[][] = [];
  
  // Group by weeks
  let currentWeekStart = new Date(startDate);
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
  
  while (currentWeekStart <= endDate) {
    const week: TimeSlot[] = [];
    
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(currentWeekStart);
      currentDate.setDate(currentDate.getDate() + day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Create time slots for each day
      const timeSlots = ['Morning', 'Afternoon', 'Evening'];
      timeSlots.forEach(timeSlot => {
        const slotId = `${dateStr}-${timeSlot}`;
        const occupiedGames = games.filter(g => 
          g.date === dateStr && 
          g.time && timeSlot.toLowerCase().includes(g.time.split(':')[0] < '12' ? 'morning' : 
            g.time.split(':')[0] < '17' ? 'afternoon' : 'evening')
        );
        
        week.push({
          id: slotId,
          date: dateStr,
          time: timeSlot,
          capacity: 3,
          occupied: occupiedGames.length > 0,
          conflicts: []
        });
      });
    }
    
    matrix.push(week);
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }
  
  return matrix;
};

const generateGridMatrix = (schedule: Schedule, games: Game[]): TimeSlot[][] => {
  const matrix: TimeSlot[][] = [];
  const venues = schedule.venues;
  const times = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];
  
  times.forEach(time => {
    const row: TimeSlot[] = [];
    venues.forEach(venue => {
      const slotId = `${time}-${venue}`;
      const occupiedGames = games.filter(g => g.time === time && g.venue === venue);
      
      row.push({
        id: slotId,
        date: 'flexible',
        time,
        venue,
        capacity: 1,
        occupied: occupiedGames.length > 0,
        conflicts: []
      });
    });
    matrix.push(row);
  });
  
  return matrix;
};

// Main Schedule Matrix Component
export const ScheduleMatrix: React.FC<ScheduleMatrixProps> = ({ 
  schedule, 
  games, 
  constraints, 
  onGameMove, 
  viewMode 
}) => {
  const [matrix, setMatrix] = useState<TimeSlot[][]>([]);
  const [conflicts, setConflicts] = useState<ConflictResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [draggedGame, setDraggedGame] = useState<string | null>(null);

  // Generate matrix based on view mode
  const generateMatrix = useCallback((schedule: Schedule, viewMode: string, games: Game[]): TimeSlot[][] => {
    switch (viewMode) {
      case 'timeline':
        return generateTimelineMatrix(schedule, games);
      case 'calendar':
        return generateCalendarMatrix(schedule, games);
      case 'matrix':
      default:
        return generateGridMatrix(schedule, games);
    }
  }, []);

  useEffect(() => {
    const newMatrix = generateMatrix(schedule, viewMode, games);
    setMatrix(newMatrix);
  }, [schedule, viewMode, games, generateMatrix]);

  // Generate conflicts based on constraints
  useEffect(() => {
    const newConflicts: ConflictResult[] = [];
    
    constraints.forEach(constraint => {
      constraint.affectedGames.forEach(gameId => {
        const game = games.find(g => g.id === gameId);
        if (game) {
          newConflicts.push({
            id: `${constraint.id}-${gameId}`,
            gameId,
            slotId: game.slotId,
            type: constraint.type as any,
            severity: constraint.severity,
            description: constraint.description
          });
        }
      });
    });
    
    setConflicts(newConflicts);
  }, [constraints, games]);

  // Handle game move with conflict checking
  const handleGameMove = useCallback(async (gameId: string, newSlot: TimeSlot) => {
    setLoading(true);
    try {
      await onGameMove(gameId, newSlot);
    } catch (error) {
      console.error('Failed to move game:', error);
    } finally {
      setLoading(false);
    }
  }, [onGameMove]);

  // Unscheduled games (games without slots)
  const unscheduledGames = useMemo(() => {
    return games.filter(game => !game.slotId);
  }, [games]);

  // Get header labels based on view mode
  const getHeaderLabels = useCallback(() => {
    switch (viewMode) {
      case 'timeline':
        return schedule.venues;
      case 'calendar':
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      case 'matrix':
      default:
        return schedule.venues;
    }
  }, [viewMode, schedule.venues]);

  // Get row labels based on view mode
  const getRowLabel = useCallback((rowIndex: number) => {
    switch (viewMode) {
      case 'timeline': {
        const startDate = new Date(schedule.dateRange.start);
        const currentDate = new Date(startDate);
        currentDate.setDate(currentDate.getDate() + rowIndex);
        return currentDate.toLocaleDateString();
      }
      case 'calendar': {
        const startDate = new Date(schedule.dateRange.start);
        const weekStart = new Date(startDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (rowIndex * 7));
        return `Week of ${weekStart.toLocaleDateString()}`;
      }
      case 'matrix':
      default: {
        const times = [
          '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
          '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
        ];
        return times[rowIndex] || `Slot ${rowIndex + 1}`;
      }
    }
  }, [viewMode, schedule.dateRange.start]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={`ft-schedule-matrix ft-schedule-matrix--${viewMode}`}>
        {loading && (
          <div className="ft-matrix-loading">
            <div className="ft-loading-spinner"></div>
            <span>Updating schedule...</span>
          </div>
        )}

        {/* Unscheduled Games Pool */}
        {unscheduledGames.length > 0 && (
          <div className="ft-unscheduled-games">
            <h3>Unscheduled Games</h3>
            <div className="ft-unscheduled-games-list">
              {unscheduledGames.map(game => (
                <GameCard
                  key={game.id}
                  game={game}
                  onUpdate={handleGameMove}
                  conflicts={conflicts.filter(c => c.gameId === game.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Matrix Header */}
        <div className="ft-matrix-header">
          <div className="ft-matrix-corner"></div>
          {getHeaderLabels().map((label, index) => (
            <div key={index} className="ft-matrix-header-cell">
              {label}
            </div>
          ))}
        </div>

        {/* Matrix Body */}
        <div className="ft-matrix-body">
          {matrix.map((row, rowIndex) => (
            <div key={rowIndex} className="ft-matrix-row">
              <div className="ft-matrix-row-label">
                {getRowLabel(rowIndex)}
              </div>
              {row.map((slot, colIndex) => (
                <DropZone
                  key={`${rowIndex}-${colIndex}`}
                  slot={slot}
                  onDrop={handleGameMove}
                  conflicts={conflicts.filter(c => c.slotId === slot.id)}
                >
                  {games
                    .filter(game => game.slotId === slot.id)
                    .map(game => (
                      <GameCard
                        key={game.id}
                        game={game}
                        onUpdate={handleGameMove}
                        conflicts={conflicts.filter(c => c.gameId === game.id)}
                      />
                    ))}
                </DropZone>
              ))}
            </div>
          ))}
        </div>

        {/* Matrix Legend */}
        <div className="ft-matrix-legend">
          <div className="ft-legend-item">
            <div className="ft-legend-color ft-legend-available"></div>
            <span>Available</span>
          </div>
          <div className="ft-legend-item">
            <div className="ft-legend-color ft-legend-occupied"></div>
            <span>Occupied</span>
          </div>
          <div className="ft-legend-item">
            <div className="ft-legend-color ft-legend-conflict"></div>
            <span>Conflicts</span>
          </div>
          <div className="ft-legend-item">
            <div className="ft-legend-color ft-legend-high-conflict"></div>
            <span>High Priority Conflicts</span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="ft-matrix-stats">
          <div className="ft-stat">
            <span className="ft-stat-value">{games.length}</span>
            <span className="ft-stat-label">Total Games</span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat-value">{games.filter(g => g.status === 'scheduled').length}</span>
            <span className="ft-stat-label">Scheduled</span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat-value">{unscheduledGames.length}</span>
            <span className="ft-stat-label">Unscheduled</span>
          </div>
          <div className="ft-stat">
            <span className="ft-stat-value">{conflicts.filter(c => c.severity === 'high').length}</span>
            <span className="ft-stat-label">High Priority Conflicts</span>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ScheduleMatrix;