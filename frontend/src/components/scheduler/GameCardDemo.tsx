import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, Container, Typography, Grid, Paper } from '@mui/material';
import { GameCard } from './GameCard';
import { Game, Conflict } from '../../types';

// Mock data for demonstration
const mockGame: Game = {
  game_id: 1,
  home_team_id: 1,
  away_team_id: 2,
  venue_id: 1,
  date: '2025-05-30',
  time: '19:00',
  status: 'scheduled',
  homeTeam: {
    team_id: 1,
    name: 'Kansas Jayhawks',
    code: 'KU',
    institution: {
      school_id: 1,
      name: 'Kansas',
      abbreviation: 'KU',
      mascot: 'Jayhawks',
      primary_color: '#0051BA',
      secondary_color: '#E8000D'
    }
  },
  awayTeam: {
    team_id: 2,
    name: 'Texas Tech Red Raiders',
    code: 'TTU',
    institution: {
      school_id: 2,
      name: 'Texas Tech',
      abbreviation: 'TTU',
      mascot: 'Red Raiders',
      primary_color: '#CC0000',
      secondary_color: '#000000'
    }
  },
  venue: {
    venue_id: 1,
    name: 'Allen Fieldhouse',
    capacity: 16300,
    location: {
      latitude: 38.9517,
      longitude: -95.2478,
      name: 'Allen Fieldhouse',
      city: 'Lawrence',
      state: 'Kansas'
    }
  }
};

const mockConflicts: Conflict[] = [
  {
    type: 'schedule',
    severity: 'medium',
    message: 'Less than 48 hours rest between games',
    gameId: '1'
  },
  {
    type: 'travel',
    severity: 'low',
    message: 'Long travel distance from previous game',
    gameId: '1'
  }
];

const GameCardDemo: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameData, setGameData] = useState<Game>(mockGame);

  const handleGameUpdate = async (gameId: string, updates: Partial<Game>) => {
    console.log('Updating game:', gameId, updates);
    setGameData(prev => ({ ...prev, ...updates }));
  };

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    console.log('Game selected:', game);
  };

  const handleGameEdit = (game: Game) => {
    console.log('Edit game:', game);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" gutterBottom align="center">
          GameCard Component Demo
        </Typography>
        
        <Typography variant="body1" paragraph align="center" color="text.secondary">
          This demonstrates the draggable GameCard component with various states and features.
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {/* Normal game card */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Normal Game
              </Typography>
              <GameCard
                game={gameData}
                onUpdate={handleGameUpdate}
                onClick={handleGameClick}
                onEdit={handleGameEdit}
                isSelected={selectedGame?.game_id === gameData.game_id}
              />
            </Paper>
          </Grid>

          {/* Game with conflicts */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Game with Conflicts
              </Typography>
              <GameCard
                game={{ ...gameData, game_id: 2 }}
                onUpdate={handleGameUpdate}
                conflicts={mockConflicts}
                onClick={handleGameClick}
                onEdit={handleGameEdit}
              />
            </Paper>
          </Grid>

          {/* Optimized game */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                AI Optimized Game
              </Typography>
              <GameCard
                game={{ ...gameData, game_id: 3 }}
                onUpdate={handleGameUpdate}
                isOptimized={true}
                onClick={handleGameClick}
                onEdit={handleGameEdit}
              />
            </Paper>
          </Grid>

          {/* Game with conflicts and optimized */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Optimized with Conflicts
              </Typography>
              <GameCard
                game={{ ...gameData, game_id: 4 }}
                onUpdate={handleGameUpdate}
                conflicts={[mockConflicts[0]]}
                isOptimized={true}
                onClick={handleGameClick}
                onEdit={handleGameEdit}
              />
            </Paper>
          </Grid>

          {/* Game in different status */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Completed Game
              </Typography>
              <GameCard
                game={{ 
                  ...gameData, 
                  game_id: 5, 
                  status: 'completed',
                  date: '2025-05-25'
                }}
                onUpdate={handleGameUpdate}
                onClick={handleGameClick}
              />
            </Paper>
          </Grid>

          {/* TBD Game */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                TBD Game
              </Typography>
              <GameCard
                game={{ 
                  ...gameData, 
                  game_id: 6,
                  date: undefined,
                  time: undefined,
                  venue: undefined
                }}
                onUpdate={handleGameUpdate}
                onClick={handleGameClick}
                onEdit={handleGameEdit}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* Instructions */}
        <Box sx={{ mt: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Demo Instructions:
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Drag and Drop:</strong> Try dragging the game cards around
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Click to Select:</strong> Click on a card to select it
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Edit Button:</strong> Hover over a card to see the edit button (top-left)
          </Typography>
          <Typography variant="body2" paragraph>
            • <strong>Conflicts:</strong> Cards with conflicts show warning indicators
          </Typography>
          <Typography variant="body2">
            • <strong>Optimized:</strong> AI-optimized cards have a special border animation
          </Typography>
        </Box>
      </Container>
    </DndProvider>
  );
};

export default GameCardDemo;