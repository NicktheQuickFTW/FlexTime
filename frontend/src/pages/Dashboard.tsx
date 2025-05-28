import React, { useEffect, useState } from 'react';
import { 
  Box, 
  CardContent, 
  Typography, 
  Button, 
  Divider,
  List,
  ListItem,
  CircularProgress,
  IconButton,
  Chip
} from '@mui/material';
import { 
  CalendarMonth as CalendarIcon, 
  Groups as TeamsIcon, 
  LocationOn as VenueIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ScheduleService } from '../services/api';
import { Schedule } from '../types';
import SportSpecificSchedule from '../components/schedules/SportSpecificSchedule';
import GlassmorphicCard from '../components/common/GlassmorphicCard';
import GradientText from '../components/common/GradientText';
import DashboardGrid, { DashboardGridItem } from '../components/common/DashboardGrid';

const Dashboard: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchedules = async () => {
      setLoading(true);
      try {
        const response = await ScheduleService.getSchedules();
        if (response.success && response.data) {
          setSchedules(response.data);
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

    fetchSchedules();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return '#FF9800'; // Orange
      case 'published':
        return '#28A745'; // Green
      case 'archived':
        return '#9E9E9E'; // Grey
      default:
        return '#0066cc'; // FlexTime Blue
    }
  };

  return (
    <Box>
      {/* Dashboard header is now in the AppBar */}

      {/* Sport-specific section with glassmorphic effect */}
      <Box mb={4}>
        {!loading && schedules.length > 0 && (
          <SportSpecificSchedule schedule={schedules[0]} />
        )}
      </Box>

      {/* Welcome section with gradient text */}
      <Box mb={4}>
        <GlassmorphicCard sx={{ p: 3 }}>
          <GradientText variant="h4" sx={{ mb: 2 }}>
            Welcome to FlexTime Dashboard
          </GradientText>
          <Typography variant="body1">
            Your centralized hub for managing sports schedules across multiple sports.
            Use the sport selector in the top navigation to switch between different sports.
          </Typography>
        </GlassmorphicCard>
      </Box>

      {/* Dashboard grid layout */}
      <DashboardGrid minItemWidth={280} gap={24}>
        {/* Summary Cards */}
        <DashboardGridItem>
          <GlassmorphicCard sx={{ height: '100%' }}>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: 3
            }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0066cc, #3399ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 8px 16px rgba(0, 102, 204, 0.2)'
              }}>
                <CalendarIcon sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                  {loading ? <CircularProgress size={24} /> : schedules.length}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  Active Schedules
                </Typography>
              </Box>
            </CardContent>
          </GlassmorphicCard>
        </DashboardGridItem>
        
        <DashboardGridItem>
          <GlassmorphicCard sx={{ height: '100%' }}>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: 3
            }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #3399ff, #00c2ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 8px 16px rgba(0, 194, 255, 0.2)'
              }}>
                <TeamsIcon sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                  {loading ? <CircularProgress size={24} /> : 24}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  Teams
                </Typography>
              </Box>
            </CardContent>
          </GlassmorphicCard>
        </DashboardGridItem>
        
        <DashboardGridItem>
          <GlassmorphicCard sx={{ height: '100%' }}>
            <CardContent sx={{ 
              display: 'flex', 
              alignItems: 'center',
              padding: 3
            }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #00c2ff, #00f2ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2,
                boxShadow: '0 8px 16px rgba(0, 242, 255, 0.2)'
              }}>
                <VenueIcon sx={{ fontSize: 30, color: 'white' }} />
              </Box>
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 700 }}>
                  {loading ? <CircularProgress size={24} /> : 12}
                </Typography>
                <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                  Venues
                </Typography>
              </Box>
            </CardContent>
          </GlassmorphicCard>
        </DashboardGridItem>

        {/* Recent Schedules - Spans 2 columns */}
        <DashboardGridItem colSpan={2}>
          <GlassmorphicCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ p: 3, pb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Recent Schedules
                </Typography>
              </Box>
              <Divider />
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : schedules.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    No schedules found. Create your first schedule to get started.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/schedules/new')}
                    sx={{ mt: 2 }}
                  >
                    Create Schedule
                  </Button>
                </Box>
              ) : (
                <List sx={{ p: 0 }}>
                  {schedules.slice(0, 5).map((schedule) => (
                    <ListItem 
                      key={schedule.schedule_id}
                      divider
                      sx={{ px: 3, py: 2 }}
                    >
                      <Box sx={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {schedule.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {schedule.season} • {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Chip 
                            label={schedule.status} 
                            size="small"
                            sx={{ 
                              mr: 2, 
                              bgcolor: getStatusColor(schedule.status),
                              color: 'white'
                            }}
                          />
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => navigate(`/schedules/${schedule.schedule_id}`)}
                            sx={{
                              mr: 1,
                              borderRadius: '20px',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 102, 204, 0.08)'
                              }
                            }}
                          >
                            View
                          </Button>
                          <IconButton size="small">
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </GlassmorphicCard>
        </DashboardGridItem>

        {/* Quick Actions */}
        <DashboardGridItem>
          <GlassmorphicCard sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Quick Actions
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  fullWidth 
                  onClick={() => navigate('/schedules/new')}
                  startIcon={<CalendarIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
                    borderRadius: '30px',
                    py: 1.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 25px rgba(0, 102, 204, 0.4), 0 0 15px rgba(0, 198, 255, 0.5)',
                    }
                  }}
                >
                  Create New Schedule
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => navigate('/teams')}
                  startIcon={<TeamsIcon />}
                  sx={{
                    borderRadius: '30px',
                    py: 1.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    color: 'text.primary',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0066cc',
                      backgroundColor: 'rgba(0, 102, 204, 0.08)'
                    }
                  }}
                >
                  Manage Teams
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => navigate('/venues')}
                  startIcon={<VenueIcon />}
                  sx={{
                    borderRadius: '30px',
                    py: 1.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    color: 'text.primary',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0066cc',
                      backgroundColor: 'rgba(0, 102, 204, 0.08)'
                    }
                  }}
                >
                  Manage Venues
                </Button>
                
                <Button 
                  variant="outlined" 
                  fullWidth
                  onClick={() => navigate('/analytics')}
                  startIcon={<TrendingIcon />}
                  sx={{
                    borderRadius: '30px',
                    py: 1.5,
                    borderColor: 'rgba(0, 0, 0, 0.1)',
                    color: 'text.primary',
                    fontWeight: 500,
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#0066cc',
                      backgroundColor: 'rgba(0, 102, 204, 0.08)'
                    }
                  }}
                >
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </GlassmorphicCard>
        </DashboardGridItem>
      </DashboardGrid>
    </Box>
  );
};

export default Dashboard;
