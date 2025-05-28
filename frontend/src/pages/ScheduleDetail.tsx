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
  Paper,
  Tab,
  Tabs,
  Typography
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as OptimizeIcon,
  CalendarMonth as CalendarIcon,
  Groups as TeamsIcon,
  LocationOn as VenueIcon,
  ArrowBack as BackIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { ScheduleService } from '../services/api';
import { Schedule, SportType } from '../types';
import GamesTable from '../components/games/GamesTable';
import ConstraintsTable from '../components/constraints/ConstraintsTable';
import ScheduleCalendar from '../components/schedules/ScheduleCalendar';
import ScheduleMetrics from '../components/schedules/ScheduleMetrics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`schedule-tabpanel-${index}`}
      aria-labelledby={`schedule-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ScheduleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchSchedule(parseInt(id));
    }
  }, [id]);

  const fetchSchedule = async (scheduleId: number) => {
    setLoading(true);
    try {
      const response = await ScheduleService.getScheduleById(scheduleId);
      if (response.success && response.data) {
        setSchedule(response.data);
      } else {
        setError(response.error || 'Failed to fetch schedule');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (id) {
      try {
        const response = await ScheduleService.deleteSchedule(parseInt(id));
        if (response.success) {
          navigate('/schedules');
        } else {
          setError(response.error || 'Failed to delete schedule');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    }
    setDeleteDialogOpen(false);
  };

  const handlePublishClick = () => {
    setPublishDialogOpen(true);
  };

  const handlePublishConfirm = async () => {
    if (id && schedule) {
      try {
        const updatedSchedule = { 
          ...schedule, 
          status: 'published' as 'published' | 'draft' | 'archived' 
        };
        const response = await ScheduleService.updateSchedule(parseInt(id), updatedSchedule);
        if (response.success && response.data) {
          setSchedule(response.data);
        } else {
          setError(response.error || 'Failed to publish schedule');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    }
    setPublishDialogOpen(false);
  };

  const handleArchiveClick = () => {
    setArchiveDialogOpen(true);
  };

  const handleArchiveConfirm = async () => {
    if (id && schedule) {
      try {
        const updatedSchedule = { 
          ...schedule, 
          status: 'archived' as 'published' | 'draft' | 'archived' 
        };
        const response = await ScheduleService.updateSchedule(parseInt(id), updatedSchedule);
        if (response.success && response.data) {
          setSchedule(response.data);
        } else {
          setError(response.error || 'Failed to archive schedule');
        }
      } catch (err) {
        setError('An unexpected error occurred');
        console.error(err);
      }
    }
    setArchiveDialogOpen(false);
  };

  const getStatusColor = (status: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'info';
      default:
        return 'default';
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/schedules')}
          sx={{ mb: 2 }}
        >
          Back to Schedules
        </Button>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="error" variant="h6">{error}</Typography>
          <Typography>Unable to load schedule details</Typography>
        </Paper>
      </Box>
    );
  }

  if (!schedule) {
    return (
      <Box>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/schedules')}
          sx={{ mb: 2 }}
        >
          Back to Schedules
        </Button>
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6">Schedule not found</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ flexBasis: '300px', flexGrow: 0, flexShrink: 0 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={() => navigate('/schedules')}
                  fullWidth
                >
                  Back to Schedules
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/schedules/${id}/edit`)}
                  fullWidth
                >
                  Edit Schedule
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<OptimizeIcon />}
                  onClick={() => navigate(`/schedules/${id}/optimize`)}
                  fullWidth
                >
                  Optimize Schedule
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<PublishIcon />}
                  onClick={handlePublishClick}
                  disabled={schedule?.status === 'published'}
                  fullWidth
                >
                  Publish Schedule
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ArchiveIcon />}
                  onClick={handleArchiveClick}
                  disabled={schedule?.status === 'archived'}
                  fullWidth
                >
                  Archive Schedule
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteClick}
                  fullWidth
                >
                  Delete Schedule
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        <Box sx={{ flexGrow: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" component="h1">
                  {schedule.name}
                </Typography>
                <Chip 
                  label={schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)} 
                  color={getStatusColor(schedule.status)}
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              
              <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                {getSportName(schedule.sport_id)}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon sx={{ color: '#0066cc', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Season</Typography>
                      <Typography variant="body1" fontWeight={500}>{schedule.season}</Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <TeamsIcon sx={{ color: '#0C234B', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Teams</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {schedule.teams ? schedule.teams.length : 0} Teams
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                
                <Box sx={{ flex: '1 1 30%', minWidth: '200px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <VenueIcon sx={{ color: '#FFC627', mr: 1 }} />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Venues</Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {new Set(schedule.games?.map(g => g.venue_id)).size || 0} Venues
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="schedule tabs">
                <Tab label="Games" id="schedule-tab-0" aria-controls="schedule-tabpanel-0" />
                <Tab label="Calendar" id="schedule-tab-1" aria-controls="schedule-tabpanel-1" />
                <Tab label="Teams" id="schedule-tab-2" aria-controls="schedule-tabpanel-2" />
                <Tab label="Constraints" id="schedule-tab-3" aria-controls="schedule-tabpanel-3" />
                <Tab label="Metrics" id="schedule-tab-4" aria-controls="schedule-tabpanel-4" />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/schedules/${id}/games/new`)}
                >
                  Add Game
                </Button>
              </Box>
              <GamesTable 
                games={schedule.games || []} 
                scheduleId={parseInt(id!)} 
                onGameUpdated={() => fetchSchedule(parseInt(id!))}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <ScheduleCalendar 
                schedule={schedule} 
                onGameUpdated={() => fetchSchedule(parseInt(id!))}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/schedules/${id}/teams/add`)}
                >
                  Add Teams
                </Button>
              </Box>
              {/* Teams table would go here */}
              <Typography variant="body1">
                {schedule.teams && schedule.teams.length > 0 ? 
                  `${schedule.teams.length} teams in this schedule` : 
                  'No teams added to this schedule yet'}
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => navigate(`/schedules/${id}/constraints/new`)}
                >
                  Add Constraint
                </Button>
              </Box>
              <ConstraintsTable 
                constraints={schedule.constraints || []} 
                scheduleId={parseInt(id!)} 
                onConstraintUpdated={() => fetchSchedule(parseInt(id!))}
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={4}>
              <ScheduleMetrics scheduleId={parseInt(id!)} />
            </TabPanel>
          </Box>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={deleteDialogOpen}
            onClose={() => setDeleteDialogOpen(false)}
          >
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to delete this schedule? This action cannot be undone.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Publish Confirmation Dialog */}
          <Dialog
            open={publishDialogOpen}
            onClose={() => setPublishDialogOpen(false)}
          >
            <DialogTitle>Publish Schedule</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to publish this schedule? Once published, it will be visible to all users.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPublishDialogOpen(false)}>Cancel</Button>
              <Button onClick={handlePublishConfirm} color="primary" autoFocus>
                Publish
              </Button>
            </DialogActions>
          </Dialog>

          {/* Archive Confirmation Dialog */}
          <Dialog
            open={archiveDialogOpen}
            onClose={() => setArchiveDialogOpen(false)}
          >
            <DialogTitle>Archive Schedule</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to archive this schedule? Archived schedules are read-only and cannot be modified.
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setArchiveDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleArchiveConfirm} color="primary" autoFocus>
                Archive
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default ScheduleDetail;
