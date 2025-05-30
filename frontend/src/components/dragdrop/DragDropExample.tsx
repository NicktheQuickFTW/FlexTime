import React, { useState } from 'react';
import { Box, Paper, Typography, Grid, Chip } from '@mui/material';
import { 
  DragDropProvider, 
  useDragItem, 
  useDropTarget, 
  DragItem, 
  DropTarget, 
  Conflict 
} from './DragDropCore';
import { Game, Team } from '../../types';

// Example draggable game component
const DraggableGame: React.FC<{ game: Game }> = ({ game }) => {
  const dragItem: DragItem = {
    id: `game-${game.game_id}`,
    type: 'game',
    data: game,
    metadata: {
      source: 'game-planner'
    }
  };

  const { dragProps, isDragging } = useDragItem(dragItem);

  return (
    <Paper
      {...dragProps}
      sx={{
        p: 2,
        mb: 1,
        cursor: 'grab',
        backgroundColor: isDragging ? 'rgba(0, 102, 204, 0.1)' : 'white',
        border: isDragging ? '2px solid #0066cc' : '1px solid #e0e0e0',
        borderRadius: 2,
        '&:hover': {
          backgroundColor: 'rgba(0, 102, 204, 0.05)',
          transform: 'translateY(-2px)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        },
        transition: 'all 0.2s ease'
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {game.homeTeam?.name} vs {game.awayTeam?.name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {game.date || 'No date assigned'}
      </Typography>
    </Paper>
  );
};

// Example draggable team component
const DraggableTeam: React.FC<{ team: Team }> = ({ team }) => {
  const dragItem: DragItem = {
    id: `team-${team.team_id}`,
    type: 'team',
    data: team,
    metadata: {
      source: 'team-roster'
    }
  };

  const { dragProps, isDragging } = useDragItem(dragItem);

  return (
    <Chip
      {...dragProps}
      label={team.name}
      sx={{
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          backgroundColor: '#0066cc',
          color: 'white'
        }
      }}
    />
  );
};

// Example drop zone component (matrix cell)
const MatrixCell: React.FC<{ 
  row: number; 
  col: number; 
  date: string; 
  onGameDropped?: (game: Game, position: { row: number; col: number }) => void;
}> = ({ row, col, date, onGameDropped }) => {
  const dropTarget: DropTarget = {
    id: `cell-${row}-${col}`,
    type: 'matrix-cell',
    position: { row, col },
    accepts: ['game', 'team'],
    metadata: {
      date,
      row,
      col
    }
  };

  const { dropProps, canDrop, hasConflicts, conflictSeverity, conflicts } = useDropTarget(dropTarget);

  return (
    <Paper
      {...dropProps}
      sx={{
        minHeight: 100,
        p: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        position: 'relative',
        ...dropProps.style
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {new Date(date).toLocaleDateString()}
      </Typography>
      
      {hasConflicts && (
        <Box sx={{ position: 'absolute', top: 4, right: 4 }}>
          <Chip
            label={conflicts.length}
            size="small"
            color={
              conflictSeverity === 'critical' ? 'error' :
              conflictSeverity === 'high' ? 'warning' :
              'info'
            }
            sx={{ fontSize: '10px', height: 16 }}
          />
        </Box>
      )}
      
      {/* Conflict details tooltip could be added here */}
    </Paper>
  );
};

// Example planner area component
const PlannerArea: React.FC<{ games: Game[] }> = ({ games }) => {
  const dropTarget: DropTarget = {
    id: 'planner-area',
    type: 'planner',
    accepts: ['game'],
    metadata: {
      source: 'planner'
    }
  };

  const { dropProps, canDrop } = useDropTarget(dropTarget);

  return (
    <Paper
      {...dropProps}
      sx={{
        p: 2,
        minHeight: 200,
        backgroundColor: canDrop ? 'rgba(76, 175, 80, 0.05)' : 'white',
        border: canDrop ? '2px dashed #4caf50' : '1px solid #e0e0e0',
        borderRadius: 2,
        transition: 'all 0.2s ease'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Available Games
      </Typography>
      {games.map((game) => (
        <DraggableGame key={game.game_id} game={game} />
      ))}
    </Paper>
  );
};

// Main example component
const DragDropExample: React.FC = () => {
  const [scheduleMatrix, setScheduleMatrix] = useState<(Game | null)[][]>(
    Array(5).fill(null).map(() => Array(7).fill(null))
  );
  
  const [conflicts, setConflicts] = useState<Conflict[]>([]);

  // Sample data
  const sampleGames: Game[] = [
    {
      game_id: 1,
      home_team_id: 1,
      away_team_id: 2,
      homeTeam: { team_id: 1, name: 'Kansas Jayhawks', institution: { school_id: 1, name: 'University of Kansas', abbreviation: 'KU' } },
      awayTeam: { team_id: 2, name: 'Texas Longhorns', institution: { school_id: 2, name: 'University of Texas', abbreviation: 'UT' } }
    },
    {
      game_id: 2,
      home_team_id: 3,
      away_team_id: 4,
      homeTeam: { team_id: 3, name: 'Baylor Bears', institution: { school_id: 3, name: 'Baylor University', abbreviation: 'BU' } },
      awayTeam: { team_id: 4, name: 'TCU Horned Frogs', institution: { school_id: 4, name: 'Texas Christian University', abbreviation: 'TCU' } }
    }
  ];

  const sampleTeams: Team[] = [
    { team_id: 1, name: 'Kansas Jayhawks', institution: { school_id: 1, name: 'University of Kansas', abbreviation: 'KU' } },
    { team_id: 2, name: 'Texas Longhorns', institution: { school_id: 2, name: 'University of Texas', abbreviation: 'UT' } },
    { team_id: 3, name: 'Baylor Bears', institution: { school_id: 3, name: 'Baylor University', abbreviation: 'BU' } },
    { team_id: 4, name: 'TCU Horned Frogs', institution: { school_id: 4, name: 'Texas Christian University', abbreviation: 'TCU' } }
  ];

  // Handle drop operations
  const handleDrop = async (item: DragItem, target: DropTarget) => {
    console.log('Drop:', item, 'onto', target);
    
    if (item.type === 'game' && target.type === 'matrix-cell') {
      const game = item.data as Game;
      const { row, col } = target.position || { row: 0, col: 0 };
      
      // Update matrix
      const newMatrix = [...scheduleMatrix];
      newMatrix[row][col] = game;
      setScheduleMatrix(newMatrix);
      
      console.log(`Game ${game.game_id} placed at row ${row}, col ${col}`);
    }
  };

  // Handle conflict detection
  const handleConflictDetected = (detectedConflicts: Conflict[]) => {
    setConflicts(detectedConflicts);
    console.log('Conflicts detected:', detectedConflicts);
  };

  // Generate dates for matrix
  const generateDates = (weeks: number = 5) => {
    const dates: string[] = [];
    const startDate = new Date();
    for (let week = 0; week < weeks; week++) {
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        dates.push(date.toISOString().split('T')[0]);
      }
    }
    return dates;
  };

  const dates = generateDates();

  return (
    <DragDropProvider
      onDrop={handleDrop}
      onConflictDetected={handleConflictDetected}
      scheduleData={{ games: sampleGames, teams: sampleTeams }}
      enableRealTimeValidation={true}
    >
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
          Drag & Drop Schedule Builder
        </Typography>
        
        {/* Conflict Summary */}
        {conflicts.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" color="error" sx={{ mb: 1 }}>
              {conflicts.length} Conflict{conflicts.length !== 1 ? 's' : ''} Detected
            </Typography>
            {conflicts.map((conflict) => (
              <Chip
                key={conflict.id}
                label={conflict.message}
                color={
                  conflict.severity === 'critical' ? 'error' :
                  conflict.severity === 'high' ? 'warning' :
                  'info'
                }
                size="small"
                sx={{ mr: 1, mb: 1 }}
              />
            ))}
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Schedule Matrix */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Schedule Matrix
              </Typography>
              <Grid container spacing={1}>
                {scheduleMatrix.map((week, weekIndex) => (
                  <Grid item xs={12} key={weekIndex}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Week {weekIndex + 1}
                    </Typography>
                    <Grid container spacing={1}>
                      {week.map((cell, dayIndex) => (
                        <Grid item xs key={dayIndex}>
                          <MatrixCell
                            row={weekIndex}
                            col={dayIndex}
                            date={dates[weekIndex * 7 + dayIndex]}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Games Planner */}
              <PlannerArea games={sampleGames} />
              
              {/* Teams */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Teams
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {sampleTeams.map((team) => (
                    <DraggableTeam key={team.team_id} team={team} />
                  ))}
                </Box>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </DragDropProvider>
  );
};

export default DragDropExample;