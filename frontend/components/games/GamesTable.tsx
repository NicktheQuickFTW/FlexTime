import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Game } from '../../types';
import { ScheduleService } from '../../services/api';

interface GamesTableProps {
  games: Game[];
  scheduleId: number;
  onGameUpdated: () => void;
}

const GamesTable: React.FC<GamesTableProps> = ({ games, scheduleId, onGameUpdated }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (gameId: number) => {
    setGameToDelete(gameId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (gameToDelete) {
      try {
        const response = await ScheduleService.deleteGame(scheduleId, gameToDelete);
        if (response.success) {
          onGameUpdated();
        } else {
          setError(response.error || 'Failed to delete game');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    }
    setDeleteDialogOpen(false);
    setGameToDelete(null);
  };

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

  if (games.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Games
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          This schedule doesn't have any games yet.
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<EventIcon />}
          onClick={() => navigate(`/schedules/${scheduleId}/games/new`)}
        >
          Add First Game
        </Button>
      </Paper>
    );
  }

  return (
    <Box>
      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Home Team</TableCell>
              <TableCell>Away Team</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {games
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((game) => (
                <TableRow key={game.game_id}>
                  <TableCell>
                    {game.date ? new Date(game.date).toLocaleDateString() : 'TBD'}
                  </TableCell>
                  <TableCell>
                    {game.time || 'TBD'}
                  </TableCell>
                  <TableCell>
                    {game.homeTeam?.name || `Team ID: ${game.home_team_id}`}
                  </TableCell>
                  <TableCell>
                    {game.awayTeam?.name || `Team ID: ${game.away_team_id}`}
                  </TableCell>
                  <TableCell>
                    {game.venue?.name || (game.venue_id ? `Venue ID: ${game.venue_id}` : 'TBD')}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={game.status ? game.status.charAt(0).toUpperCase() + game.status.slice(1) : 'Scheduled'} 
                      size="small"
                      sx={{ 
                        bgcolor: getStatusColor(game.status),
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit Game">
                      <IconButton 
                        size="small"
                        onClick={() => navigate(`/schedules/${scheduleId}/games/${game.game_id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Game">
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => handleDeleteClick(game.game_id!)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={games.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this game? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GamesTable;
