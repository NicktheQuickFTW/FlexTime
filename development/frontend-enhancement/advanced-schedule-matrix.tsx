/**
 * Advanced Interactive Schedule Matrix for FlexTime
 * 
 * Features:
 * - Drag and drop game scheduling
 * - Visual constraint violation indicators
 * - Real-time conflict detection
 * - Multiple view modes (weekly, monthly, season)
 * - Optimization suggestions
 * - Undo/redo functionality
 */

import React, { 
  useState, 
  useEffect, 
  useCallback, 
  useMemo, 
  useRef,
  MouseEvent
} from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Zoom,
  Fade,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  Divider
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  AutoAwesome as OptimizeIcon,
  Visibility as ViewIcon,
  Home as HomeIcon,
  Flight as AwayIcon,
  LocationOn as VenueIcon,
  Schedule as TimeIcon,
  Group as TeamIcon
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import { DndProvider, useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

// Import our collaboration system
import { useCollaboration, ScheduleChange } from './websocket-collaboration-system';

// Types for the schedule matrix
export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
  conference?: string;
  division?: string;
}

export interface Venue {
  id: string;
  name: string;
  location: string;
  capacity: number;
  availability: Date[];
}

export interface Game {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: Date;
  venue: Venue;
  time?: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  conflicts: Conflict[];
  isHighlighted?: boolean;
  isDragging?: boolean;
}

export interface Conflict {
  id: string;
  type: 'venue' | 'travel' | 'rest' | 'television' | 'constraint';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestedResolution?: string;
}

export interface TimeSlot {
  date: Date;
  time: string;
  isAvailable: boolean;
  games: Game[];
  conflicts: Conflict[];
}

export interface MatrixCell {
  date: Date;
  timeSlot: string;
  games: Game[];
  canAcceptDrop: boolean;
  conflicts: Conflict[];
  optimizationScore?: number;
}

// Drag and Drop Types
const ItemTypes = {
  GAME: 'game',
  UNSCHEDULED_GAME: 'unscheduled_game'
};

// Game Card Component with Drag Functionality
interface DraggableGameProps {
  game: Game;
  onGameUpdate: (gameId: string, updates: Partial<Game>) => void;
  onConflictClick: (conflict: Conflict) => void;
  isInMatrix?: boolean;
}

const DraggableGame: React.FC<DraggableGameProps> = ({
  game,
  onGameUpdate,
  onConflictClick,
  isInMatrix = false
}) => {
  const theme = useTheme();
  const { sendScheduleChange } = useCollaboration();
  
  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.GAME,
    item: { game, source: isInMatrix ? 'matrix' : 'sidebar' },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      if (item && dropResult) {
        // Handle the drop result
        onGameUpdate(game.id, { ...dropResult });
        
        // Send collaboration event
        sendScheduleChange({
          type: 'game_moved',
          gameId: game.id,
          oldValue: { date: game.date, venue: game.venue },
          newValue: dropResult
        });
      }
    }
  });

  const getConflictSeverityColor = (severity: Conflict['severity']) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const hasConflicts = game.conflicts.length > 0;
  const maxSeverity = game.conflicts.length > 0 
    ? game.conflicts.reduce((max, conflict) => {
        const severityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityOrder[conflict.severity] > severityOrder[max] ? conflict.severity : max;
      }, 'low' as Conflict['severity'])
    : 'low';

  return (
    <Card
      ref={drag}
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'rotate(5deg)' : 'none',
        transition: 'all 0.2s ease',
        border: hasConflicts ? `2px solid ${getConflictSeverityColor(maxSeverity)}` : '1px solid transparent',
        borderRadius: 2,
        background: hasConflicts 
          ? `linear-gradient(135deg, ${alpha(getConflictSeverityColor(maxSeverity), 0.1)}, ${alpha(getConflictSeverityColor(maxSeverity), 0.05)})`
          : theme.palette.background.paper,
        '&:hover': {
          transform: isDragging ? 'rotate(5deg)' : 'translateY(-2px)',
          boxShadow: theme.shadows[8]
        },
        '&:active': {
          cursor: 'grabbing'
        },
        minHeight: 80,
        position: 'relative'
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <DragIcon sx={{ color: 'text.secondary', fontSize: 16 }} />
          <Typography variant="caption" color="text.secondary">
            {format(game.date, 'MMM d')}
          </Typography>
          {game.time && (
            <Typography variant="caption" color="text.secondary">
              {game.time}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <HomeIcon sx={{ fontSize: 14, color: game.homeTeam.color }} />
            <Typography variant="body2" fontWeight={600}>
              {game.homeTeam.shortName}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">vs</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AwayIcon sx={{ fontSize: 14, color: game.awayTeam.color }} />
            <Typography variant="body2" fontWeight={600}>
              {game.awayTeam.shortName}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
          <VenueIcon sx={{ fontSize: 12, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {game.venue.name}
          </Typography>
        </Box>
        
        {hasConflicts && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {game.conflicts.slice(0, 2).map((conflict, index) => (
              <Chip
                key={conflict.id}
                label={conflict.type}
                size="small"
                onClick={() => onConflictClick(conflict)}
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  backgroundColor: alpha(getConflictSeverityColor(conflict.severity), 0.2),
                  color: getConflictSeverityColor(conflict.severity),
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            ))}
            {game.conflicts.length > 2 && (
              <Chip
                label={`+${game.conflicts.length - 2}`}
                size="small"
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
            )}
          </Box>
        )}
        
        <Chip
          label={game.status}
          size="small"
          color={game.status === 'confirmed' ? 'success' : game.status === 'scheduled' ? 'primary' : 'default'}
          sx={{ 
            position: 'absolute', 
            top: 8, 
            right: 8,
            height: 20,
            fontSize: '0.6rem'
          }}
        />
      </CardContent>
    </Card>
  );
};

// Matrix Cell Component with Drop Functionality
interface MatrixCellProps {
  cell: MatrixCell;
  onGameDrop: (game: Game, targetCell: MatrixCell) => void;
  onCellClick: (cell: MatrixCell) => void;
  isHighlighted?: boolean;
}

const MatrixCell: React.FC<MatrixCellProps> = ({
  cell,
  onGameDrop,
  onCellClick,
  isHighlighted = false
}) => {
  const theme = useTheme();
  
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ItemTypes.GAME,
    drop: (item: { game: Game; source: string }, monitor) => {
      if (monitor.didDrop()) return;
      onGameDrop(item.game, cell);
      return { date: cell.date, timeSlot: cell.timeSlot };
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver({ shallow: true }),
      canDrop: monitor.canDrop() && cell.canAcceptDrop
    })
  });

  const getCellBackgroundColor = () => {
    if (isOver && canDrop) return alpha(theme.palette.success.main, 0.2);
    if (isOver && !canDrop) return alpha(theme.palette.error.main, 0.2);
    if (isHighlighted) return alpha(theme.palette.primary.main, 0.1);
    if (cell.conflicts.length > 0) return alpha(theme.palette.warning.main, 0.1);
    if (cell.optimizationScore && cell.optimizationScore > 0.8) return alpha(theme.palette.success.main, 0.05);
    return theme.palette.background.paper;
  };

  const getBorderColor = () => {
    if (isOver && canDrop) return theme.palette.success.main;
    if (isOver && !canDrop) return theme.palette.error.main;
    if (cell.conflicts.length > 0) return theme.palette.warning.main;
    return alpha(theme.palette.divider, 0.3);
  };

  return (
    <Box
      ref={drop}
      onClick={() => onCellClick(cell)}
      sx={{
        minHeight: 120,
        border: `2px solid ${getBorderColor()}`,
        borderRadius: 1,
        backgroundColor: getCellBackgroundColor(),
        transition: 'all 0.2s ease',
        cursor: canDrop ? 'copy' : 'pointer',
        position: 'relative',
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
        {format(cell.date, 'EEE M/d')}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {cell.timeSlot}
      </Typography>
      
      {cell.games.map((game, index) => (
        <Box
          key={game.id}
          sx={{
            backgroundColor: alpha(theme.palette.primary.main, 0.1),
            borderRadius: 0.5,
            p: 0.5,
            fontSize: '0.7rem'
          }}
        >
          <Typography variant="caption" noWrap>
            {game.homeTeam.shortName} vs {game.awayTeam.shortName}
          </Typography>
        </Box>
      ))}
      
      {cell.conflicts.length > 0 && (
        <WarningIcon 
          sx={{ 
            position: 'absolute', 
            top: 4, 
            right: 4, 
            fontSize: 16,
            color: theme.palette.warning.main 
          }} 
        />
      )}
      
      {cell.optimizationScore && cell.optimizationScore > 0.8 && (
        <CheckIcon 
          sx={{ 
            position: 'absolute', 
            bottom: 4, 
            right: 4, 
            fontSize: 16,
            color: theme.palette.success.main 
          }} 
        />
      )}
    </Box>
  );
};

// Main Schedule Matrix Component
interface AdvancedScheduleMatrixProps {
  teams: Team[];
  venues: Venue[];
  games: Game[];
  onGameUpdate: (gameId: string, updates: Partial<Game>) => void;
  onOptimize?: () => void;
  loading?: boolean;
}

export const AdvancedScheduleMatrix: React.FC<AdvancedScheduleMatrixProps> = ({
  teams,
  venues,
  games,
  onGameUpdate,
  onOptimize,
  loading = false
}) => {
  const theme = useTheme();
  const { conflicts, onConflictDetected } = useCollaboration();
  
  // State management
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'season'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [history, setHistory] = useState<Game[][]>([games]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [timeSlots] = useState(['9:00 AM', '12:00 PM', '3:00 PM', '6:00 PM', '9:00 PM']);
  
  // Calculate date range based on view mode
  const dateRange = useMemo(() => {
    switch (viewMode) {
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate)
        });
      case 'month':
        // For simplicity, showing 4 weeks
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: addDays(startOfWeek(currentDate), 27)
        });
      case 'season':
        // Show key dates throughout season
        return eachDayOfInterval({
          start: new Date(currentDate.getFullYear(), 8, 1), // September
          end: new Date(currentDate.getFullYear() + 1, 3, 30) // April
        }).filter((date, index) => index % 7 === 0); // Every week
      default:
        return [];
    }
  }, [viewMode, currentDate]);

  // Create matrix cells
  const matrixCells = useMemo(() => {
    const cells: MatrixCell[][] = [];
    
    dateRange.forEach(date => {
      const daySlots: MatrixCell[] = [];
      
      timeSlots.forEach(timeSlot => {
        const cellGames = games.filter(game => 
          isSameDay(game.date, date) && game.time === timeSlot
        );
        
        const cellConflicts = cellGames.flatMap(game => game.conflicts);
        
        const cell: MatrixCell = {
          date,
          timeSlot,
          games: cellGames,
          canAcceptDrop: cellGames.length === 0, // Can only drop if empty
          conflicts: cellConflicts,
          optimizationScore: Math.random() // Mock optimization score
        };
        
        daySlots.push(cell);
      });
      
      cells.push(daySlots);
    });
    
    return cells;
  }, [dateRange, timeSlots, games]);

  // Handle game drop
  const handleGameDrop = useCallback((game: Game, targetCell: MatrixCell) => {
    if (!targetCell.canAcceptDrop) return;
    
    const updatedGame: Partial<Game> = {
      date: targetCell.date,
      time: targetCell.timeSlot
    };
    
    onGameUpdate(game.id, updatedGame);
    
    // Add to history for undo/redo
    const newHistory = history.slice(0, historyIndex + 1);
    const updatedGames = games.map(g => 
      g.id === game.id ? { ...g, ...updatedGame } : g
    );
    newHistory.push(updatedGames);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [games, onGameUpdate, history, historyIndex]);

  // Handle cell click
  const handleCellClick = useCallback((cell: MatrixCell) => {
    // Could open a dialog to schedule a new game
    console.log('Cell clicked:', cell);
  }, []);

  // Undo/Redo functionality
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  
  const handleUndo = useCallback(() => {
    if (canUndo) {
      setHistoryIndex(historyIndex - 1);
      // Apply previous state
      history[historyIndex - 1].forEach(game => {
        onGameUpdate(game.id, game);
      });
    }
  }, [canUndo, historyIndex, history, onGameUpdate]);
  
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setHistoryIndex(historyIndex + 1);
      // Apply next state
      history[historyIndex + 1].forEach(game => {
        onGameUpdate(game.id, game);
      });
    }
  }, [canRedo, historyIndex, history, onGameUpdate]);

  // Unscheduled games
  const unscheduledGames = games.filter(game => !game.date);

  return (
    <DndProvider backend={HTML5Backend}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header Controls */}
        <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Interactive Schedule Matrix
            </Typography>
            
            <Stack direction="row" spacing={2} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>View</InputLabel>
                <Select
                  value={viewMode}
                  label="View"
                  onChange={(e) => setViewMode(e.target.value as any)}
                >
                  <MenuItem value="week">Week</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="season">Season</MenuItem>
                </Select>
              </FormControl>
              
              <Tooltip title="Undo">
                <span>
                  <IconButton onClick={handleUndo} disabled={!canUndo}>
                    <UndoIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Tooltip title="Redo">
                <span>
                  <IconButton onClick={handleRedo} disabled={!canRedo}>
                    <RedoIcon />
                  </IconButton>
                </span>
              </Tooltip>
              
              <Button
                variant="contained"
                startIcon={<OptimizeIcon />}
                onClick={onOptimize}
                disabled={loading}
              >
                Optimize
              </Button>
            </Stack>
          </Box>
          
          {loading && <LinearProgress sx={{ borderRadius: 1 }} />}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, overflow: 'hidden' }}>
          {/* Unscheduled Games Sidebar */}
          <Paper sx={{ width: 300, p: 2, borderRadius: 2, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Unscheduled Games ({unscheduledGames.length})
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={1}>
              {unscheduledGames.map(game => (
                <DraggableGame
                  key={game.id}
                  game={game}
                  onGameUpdate={onGameUpdate}
                  onConflictClick={setSelectedConflict}
                  isInMatrix={false}
                />
              ))}
            </Stack>
          </Paper>

          {/* Schedule Matrix */}
          <Paper sx={{ flexGrow: 1, p: 2, borderRadius: 2, overflow: 'auto' }}>
            <Box sx={{ minWidth: 800 }}>
              {/* Time slot headers */}
              <Grid container spacing={1} sx={{ mb: 1 }}>
                <Grid item xs={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                </Grid>
                {timeSlots.map(slot => (
                  <Grid item xs={2} key={slot}>
                    <Typography variant="subtitle2" color="text.secondary" align="center">
                      {slot}
                    </Typography>
                  </Grid>
                ))}
              </Grid>

              {/* Matrix rows */}
              {matrixCells.map((daySlots, dayIndex) => (
                <Grid container spacing={1} key={dayIndex} sx={{ mb: 1 }}>
                  <Grid item xs={2}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      height: '100%',
                      minHeight: 120,
                      p: 1
                    }}>
                      <Typography variant="body2" fontWeight={600}>
                        {format(daySlots[0].date, 'EEE MMM d')}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {daySlots.map((cell, slotIndex) => (
                    <Grid item xs={2} key={slotIndex}>
                      <MatrixCell
                        cell={cell}
                        onGameDrop={handleGameDrop}
                        onCellClick={handleCellClick}
                      />
                    </Grid>
                  ))}
                </Grid>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Conflict Detail Dialog */}
        <Dialog
          open={selectedConflict !== null}
          onClose={() => setSelectedConflict(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Conflict Details</DialogTitle>
          <DialogContent>
            {selectedConflict && (
              <Alert severity={selectedConflict.severity === 'critical' ? 'error' : 'warning'}>
                <Typography variant="h6" gutterBottom>
                  {selectedConflict.type.toUpperCase()} Conflict
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedConflict.message}
                </Typography>
                {selectedConflict.suggestedResolution && (
                  <Typography variant="body2" color="text.secondary">
                    <strong>Suggested Resolution:</strong> {selectedConflict.suggestedResolution}
                  </Typography>
                )}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedConflict(null)}>Close</Button>
            <Button variant="contained">Apply Suggestion</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DndProvider>
  );
};

export default AdvancedScheduleMatrix;