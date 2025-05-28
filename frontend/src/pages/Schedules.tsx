import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  TrendingUp as OptimizeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ScheduleService } from '../services/api';
import { Schedule, SportType } from '../types';

const Schedules: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<number | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = schedules.filter(schedule => 
        schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.season.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredSchedules(filtered);
    } else {
      setFilteredSchedules(schedules);
    }
  }, [searchTerm, schedules]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const response = await ScheduleService.getSchedules();
      if (response.success && response.data) {
        setSchedules(response.data);
        setFilteredSchedules(response.data);
      } else {
        setError(response.error || 'Failed to fetch schedules');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteClick = (scheduleId: number) => {
    setScheduleToDelete(scheduleId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (scheduleToDelete) {
      try {
        const response = await ScheduleService.deleteSchedule(scheduleToDelete);
        if (response.success) {
          // Remove the deleted schedule from the list
          setSchedules(schedules.filter(s => s.schedule_id !== scheduleToDelete));
          setFilteredSchedules(filteredSchedules.filter(s => s.schedule_id !== scheduleToDelete));
        } else {
          setError(response.error || 'Failed to delete schedule');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    }
    setDeleteDialogOpen(false);
    setScheduleToDelete(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setScheduleToDelete(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#FFA726'; // Orange
      case 'published':
        return '#66BB6A'; // Green
      case 'archived':
        return '#9E9E9E'; // Grey
      default:
        return '#2196F3'; // Blue
    }
  };

  const getSportName = (sportId: number): string => {
    // This is a placeholder. In a real app, you would fetch the sport name from the API
    const sportMap: Record<number, string> = {
      1: SportType.FOOTBALL,
      2: SportType.MENS_BASKETBALL,
      3: SportType.WOMENS_BASKETBALL,
      4: SportType.BASEBALL,
      5: SportType.SOFTBALL,
      6: SportType.VOLLEYBALL,
      7: SportType.SOCCER,
      8: SportType.TENNIS,
      9: SportType.GOLF,
      10: SportType.SWIMMING,
      11: SportType.TRACK,
      12: SportType.CROSS_COUNTRY,
      13: SportType.WRESTLING,
      14: SportType.GYMNASTICS
    };
    
    return sportMap[sportId] || 'Unknown Sport';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Schedules
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/schedules/new')}
          sx={{ bgcolor: '#AB0520' }} // Big 12 cardinal red
        >
          Create New Schedule
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <TextField
              variant="outlined"
              size="small"
              placeholder="Search schedules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mr: 2, width: 300 }}
            />
            <Tooltip title="Filter">
              <IconButton>
                <FilterIcon />
              </IconButton>
            </Tooltip>
          </Box>
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={fetchSchedules}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : filteredSchedules.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No schedules found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {searchTerm ? 'Try a different search term' : 'Create your first schedule to get started'}
            </Typography>
            {!searchTerm && (
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => navigate('/schedules/new')}
              >
                Create Schedule
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Sport</TableCell>
                    <TableCell>Season</TableCell>
                    <TableCell>Date Range</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchedules
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((schedule) => (
                      <TableRow key={schedule.schedule_id}>
                        <TableCell>{schedule.name}</TableCell>
                        <TableCell>{getSportName(schedule.sport_id)}</TableCell>
                        <TableCell>{schedule.season}</TableCell>
                        <TableCell>
                          {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)} 
                            size="small"
                            sx={{ 
                              bgcolor: getStatusColor(schedule.status),
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/schedules/${schedule.schedule_id}`)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/schedules/${schedule.schedule_id}/edit`)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Optimize">
                            <IconButton 
                              size="small"
                              onClick={() => navigate(`/schedules/${schedule.schedule_id}/optimize`)}
                            >
                              <OptimizeIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDeleteClick(schedule.schedule_id!)}
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
              count={filteredSchedules.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Schedule</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this schedule? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Schedules;
