import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDrag } from 'react-dnd';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip, 
  Avatar, 
  Tooltip,
  IconButton,
  Alert,
  Stack
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  SportsTennis as SportsIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { Game, Constraint, Conflict } from '../../types';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  onUpdate: (gameId: string, updates: Partial<Game>) => Promise<void>;
  conflicts?: Conflict[];
  isOptimized?: boolean;
  isSelected?: boolean;
  onClick?: (game: Game) => void;
  onEdit?: (game: Game) => void;
}

// Team color mapping for Big 12 teams
const getTeamColors = (homeTeam?: any, awayTeam?: any) => {
  const teamColorMap: Record<string, { primary: string; secondary: string }> = {
    'Arizona': { primary: '#CC0033', secondary: '#002244' },
    'Arizona State': { primary: '#8C1538', secondary: '#FFC627' },
    'Baylor': { primary: '#003015', secondary: '#FFB81C' },
    'BYU': { primary: '#002E5D', secondary: '#FFFFFF' },
    'Cincinnati': { primary: '#E00122', secondary: '#000000' },
    'Colorado': { primary: '#CFB87C', secondary: '#000000' },
    'Houston': { primary: '#C8102E', secondary: '#FFFFFF' },
    'Iowa State': { primary: '#CC0000', secondary: '#F1BE48' },
    'Kansas': { primary: '#0051BA', secondary: '#E8000D' },
    'Kansas State': { primary: '#512888', secondary: '#FFFFFF' },
    'Oklahoma State': { primary: '#FF7300', secondary: '#000000' },
    'TCU': { primary: '#4D1979', secondary: '#A3A3A3' },
    'Texas Tech': { primary: '#CC0000', secondary: '#000000' },
    'UCF': { primary: '#BA9B37', secondary: '#000000' },
    'Utah': { primary: '#CC0000', secondary: '#FFFFFF' },
    'West Virginia': { primary: '#002855', secondary: '#EAAA00' }
  };

  const homeColors = teamColorMap[homeTeam?.institution?.name] || { primary: '#00bfff', secondary: '#0088ff' };
  const awayColors = teamColorMap[awayTeam?.institution?.name] || { primary: '#666666', secondary: '#999999' };

  return {
    home: homeColors.primary,
    away: awayColors.primary,
    homeSecondary: homeColors.secondary,
    awaySecondary: awayColors.secondary
  };
};

// Get team logo URL (placeholder implementation)
const getTeamLogo = (teamName: string): string => {
  const logoName = teamName?.toLowerCase().replace(/\s+/g, '-') || 'default';
  return `/assets/logos/teams/${logoName}.png`;
};

// Format game time display
const formatGameTime = (date?: string, time?: string): string => {
  if (!date) return 'TBD';
  
  const gameDate = new Date(date);
  const dateStr = gameDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  if (time) {
    const timeStr = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dateStr} ${timeStr}`;
  }
  
  return dateStr;
};

// Get conflict severity color
const getConflictColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#ff1744';
    case 'high': return '#ff9800';
    case 'medium': return '#ffc107';
    case 'low': return '#4caf50';
    default: return '#9e9e9e';
  }
};

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  onUpdate, 
  conflicts = [], 
  isOptimized = false,
  isSelected = false,
  onClick,
  onEdit
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  // Set up drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: 'GAME',
    item: { type: 'game', id: game.game_id, game },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: (item, monitor) => {
      // Handle drag end if needed
      const dropResult = monitor.getDropResult();
      if (dropResult && item.game) {
        // Handle the drop result
        console.log('Game dropped:', item.game, 'to:', dropResult);
      }
    }
  });

  const hasConflicts = conflicts.length > 0;
  const criticalConflicts = conflicts.filter(c => c.severity === 'critical');
  const teamColors = getTeamColors(game.homeTeam, game.awayTeam);

  const handleCardClick = useCallback(() => {
    if (onClick) {
      onClick(game);
    }
  }, [onClick, game]);

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(game);
    }
  }, [onEdit, game]);

  // Card animation variants
  const cardVariants = {
    idle: { 
      scale: 1, 
      rotateZ: 0,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
    },
    hover: { 
      scale: 1.02,
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
    },
    drag: { 
      scale: 1.05, 
      rotateZ: 2,
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)'
    },
    selected: {
      scale: 1.01,
      boxShadow: `0 0 0 2px ${teamColors.home}, 0 8px 24px rgba(0, 0, 0, 0.25)`
    }
  };

  return (
    <motion.div
      ref={drag}
      className={`ft-game-card ${hasConflicts ? 'ft-game-card--conflict' : ''} ${isOptimized ? 'ft-game-card--optimized' : ''}`}
      variants={cardVariants}
      initial="idle"
      animate={isSelected ? 'selected' : isDragging ? 'drag' : 'idle'}
      whileHover={!isDragging ? 'hover' : undefined}
      onClick={handleCardClick}
      style={{
        opacity: isDragging ? 0.7 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        position: 'relative',
        width: '100%',
        maxWidth: '400px'
      }}
    >
      <Card
        sx={{
          background: `linear-gradient(135deg, ${teamColors.home}15 0%, ${teamColors.away}15 100%)`,
          backdropFilter: 'blur(10px)',
          border: hasConflicts 
            ? `2px solid ${getConflictColor(criticalConflicts[0]?.severity || 'medium')}` 
            : `1px solid rgba(255, 255, 255, 0.1)`,
          borderRadius: '16px',
          position: 'relative',
          overflow: 'visible',
          transition: 'all 0.3s ease',
          '&:hover': {
            '& .edit-button': {
              opacity: 1
            }
          }
        }}
      >
        {/* Status indicators */}
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
          <Stack direction="row" spacing={0.5}>
            {isOptimized && (
              <Tooltip title="AI Optimized">
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Optimized"
                  size="small"
                  color="success"
                  variant="filled"
                />
              </Tooltip>
            )}
            {hasConflicts && (
              <Tooltip title={`${conflicts.length} conflict${conflicts.length > 1 ? 's' : ''}`}>
                <Chip
                  icon={<WarningIcon />}
                  label={conflicts.length}
                  size="small"
                  sx={{ 
                    backgroundColor: getConflictColor(criticalConflicts[0]?.severity || 'medium'),
                    color: 'white'
                  }}
                />
              </Tooltip>
            )}
          </Stack>
        </Box>

        {/* Edit button */}
        {onEdit && (
          <IconButton
            className="edit-button"
            onClick={handleEdit}
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              opacity: 0,
              transition: 'opacity 0.2s ease',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              zIndex: 2,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            size="small"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}

        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Team matchup */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            {/* Away team */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Avatar
                src={getTeamLogo(game.awayTeam?.institution?.name || '')}
                alt={game.awayTeam?.institution?.name}
                sx={{ 
                  width: 32, 
                  height: 32, 
                  mr: 1,
                  backgroundColor: teamColors.away
                }}
              >
                <SportsIcon />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight="bold" color="text.primary">
                  {game.awayTeam?.institution?.abbreviation || 'TBD'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Away
                </Typography>
              </Box>
            </Box>

            {/* VS indicator */}
            <Box sx={{ px: 1 }}>
              <Typography variant="h6" color="text.secondary" fontWeight="bold">
                @
              </Typography>
            </Box>

            {/* Home team */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <Box sx={{ textAlign: 'right', mr: 1 }}>
                <Typography variant="body2" fontWeight="bold" color="text.primary">
                  {game.homeTeam?.institution?.abbreviation || 'TBD'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Home
                </Typography>
              </Box>
              <Avatar
                src={getTeamLogo(game.homeTeam?.institution?.name || '')}
                alt={game.homeTeam?.institution?.name}
                sx={{ 
                  width: 32, 
                  height: 32,
                  backgroundColor: teamColors.home
                }}
              >
                <SportsIcon />
              </Avatar>
            </Box>
          </Box>

          {/* Game details */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScheduleIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {formatGameTime(game.date, game.time)}
              </Typography>
            </Box>
            
            {game.status && (
              <Chip
                label={game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                size="small"
                variant="outlined"
                color={game.status === 'completed' ? 'success' : 'default'}
              />
            )}
          </Box>

          {/* Venue information */}
          {game.venue && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary" noWrap>
                {game.venue.name}
              </Typography>
            </Box>
          )}

          {/* Conflict alerts */}
          {hasConflicts && (
            <Box sx={{ mt: 2 }}>
              {conflicts.slice(0, 2).map((conflict, index) => (
                <Alert
                  key={index}
                  severity={conflict.severity === 'critical' ? 'error' : 'warning'}
                  sx={{ 
                    mb: index < conflicts.length - 1 ? 1 : 0,
                    '& .MuiAlert-message': { fontSize: '0.75rem' }
                  }}
                >
                  {conflict.message}
                </Alert>
              ))}
              {conflicts.length > 2 && (
                <Typography variant="caption" color="text.secondary">
                  +{conflicts.length - 2} more conflict{conflicts.length - 2 > 1 ? 's' : ''}
                </Typography>
              )}
            </Box>
          )}
        </CardContent>

        {/* Loading overlay */}
        {isLoading && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '16px'
            }}
          >
            <Typography color="white">Updating...</Typography>
          </Box>
        )}
      </Card>
    </motion.div>
  );
};

export default GameCard;