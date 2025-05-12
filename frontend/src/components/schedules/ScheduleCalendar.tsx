import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Schedule, Game } from '../../types';

interface ScheduleCalendarProps {
  schedule: Schedule;
  onGameUpdated: () => void;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  games: Game[];
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ schedule, onGameUpdated }) => {
  const [currentDate, setCurrentDate] = useState(new Date(schedule.start_date));
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gameDetailsOpen, setGameDetailsOpen] = useState(false);
  
  const navigate = useNavigate();

  // Generate calendar days for the current month view
  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calculate days from previous month to show
    const daysFromPrevMonth = firstDayOfWeek;
    
    // Calculate total days to show (previous month + current month + next month)
    const totalDays = 42; // 6 rows of 7 days
    
    const days: CalendarDay[] = [];
    
    // Add days from previous month
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = prevMonthDays - daysFromPrevMonth + 1; i <= prevMonthDays; i++) {
      const date = new Date(year, month - 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        games: getGamesForDate(date)
      });
    }
    
    // Add days from current month
    const currentMonthDays = lastDay.getDate();
    for (let i = 1; i <= currentMonthDays; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        games: getGamesForDate(date)
      });
    }
    
    // Add days from next month to fill the grid
    const remainingDays = totalDays - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        games: getGamesForDate(date)
      });
    }
    
    return days;
  };

  // Get games for a specific date
  const getGamesForDate = (date: Date): Game[] => {
    if (!schedule.games) return [];
    
    return schedule.games.filter(game => {
      if (!game.date) return false;
      
      const gameDate = new Date(game.date);
      return (
        gameDate.getFullYear() === date.getFullYear() &&
        gameDate.getMonth() === date.getMonth() &&
        gameDate.getDate() === date.getDate()
      );
    });
  };

  // Navigate to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  // Navigate to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Handle game click to show details
  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
    setGameDetailsOpen(true);
  };

  // Check if date is within schedule range
  const isDateInScheduleRange = (date: Date): boolean => {
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);
    
    return date >= startDate && date <= endDate;
  };

  // Get status color for game
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3'; // Blue
      case 'in_progress':
        return '#FFA726'; // Orange
      case 'completed':
        return '#66BB6A'; // Green
      case 'cancelled':
        return '#F44336'; // Red
      case 'postponed':
        return '#9E9E9E'; // Grey
      default:
        return '#2196F3'; // Blue
    }
  };

  // Get team name
  const getTeamName = (teamId: number): string => {
    if (!schedule.teams) return `Team ${teamId}`;
    
    const team = schedule.teams.find(t => t.team_id === teamId);
    return team ? team.name : `Team ${teamId}`;
  };

  // Get venue name
  const getVenueName = (venueId?: number): string => {
    if (!venueId) return 'TBD';
    
    // This is a placeholder. In a real app, you would fetch venue details from the API
    return `Venue ${venueId}`;
  };

  const calendarDays = generateCalendarDays();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={goToPreviousMonth}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </Typography>
        <IconButton onClick={goToNextMonth}>
          <ChevronRightIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        {daysOfWeek.map((day, index) => (
          <Box key={day} sx={{ flex: '1 1 calc(100% / 7)', textAlign: 'center' }}>
            <Typography 
              variant="subtitle2" 
              align="center"
              sx={{ 
                fontWeight: 'bold',
                pb: 1,
                color: index === 0 || index === 6 ? '#AB0520' : 'inherit' // Weekend days in Big 12 red
              }}
            >
              {day}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
        {calendarDays.map((day, index) => (
          <Box key={index} sx={{ flex: '1 1 calc(100% / 7)', height: 120, p: 1, borderRight: '1px solid #e0e0e0', borderBottom: '1px solid #e0e0e0', position: 'relative' }}>
            <Typography 
              variant="body2" 
              sx={{ 
                position: 'absolute',
                top: 5,
                right: 8,
                fontWeight: day.isCurrentMonth ? 'bold' : 'normal',
                color: day.isCurrentMonth ? (isDateInScheduleRange(day.date) ? 'text.primary' : 'text.secondary') : 'text.disabled'
              }}
            >
              {day.date.getDate()}
            </Typography>
            
            <Box sx={{ mt: 1, maxHeight: 85, overflowY: 'auto' }}>
              {day.games.map((game, gameIndex) => (
                <Chip
                  key={gameIndex}
                  label={`${getTeamName(game.home_team_id)} vs ${getTeamName(game.away_team_id)}`}
                  size="small"
                  onClick={() => handleGameClick(game)}
                  sx={{ 
                    mb: 0.5, 
                    width: '100%',
                    bgcolor: getStatusColor(game.status),
                    color: 'white',
                    '&:hover': {
                      bgcolor: getStatusColor(game.status),
                      filter: 'brightness(0.9)'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        ))}
      </Box>

      {/* Game Details Dialog */}
      <Dialog
        open={gameDetailsOpen}
        onClose={() => setGameDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedGame && (
          <>
            <DialogTitle>
              Game Details
              <IconButton
                aria-label="edit"
                onClick={() => {
                  setGameDetailsOpen(false);
                  navigate(`/schedules/${schedule.schedule_id}/games/${selectedGame.game_id}/edit`);
                }}
                sx={{ position: 'absolute', right: 8, top: 8 }}
              >
                <EditIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedGame.date ? new Date(selectedGame.date).toLocaleDateString() : 'TBD'}
                  </Typography>
                </Box>
                
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time
                  </Typography>
                  <Typography variant="body1">
                    {selectedGame.time || 'TBD'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Venue
                </Typography>
                <Typography variant="body1">
                  {getVenueName(selectedGame.venue_id)}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Home Team
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {getTeamName(selectedGame.home_team_id)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
                
                <Box sx={{ flex: '1 1 45%', minWidth: '120px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle2" color="text.secondary">
                        Away Team
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {getTeamName(selectedGame.away_team_id)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setGameDetailsOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ScheduleCalendar;
