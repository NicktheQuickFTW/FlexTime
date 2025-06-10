import React from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Divider, 
  Grid,
  useTheme 
} from '@mui/material';
import { 
  LocationOn as LocationOnIcon,
  People as PeopleIcon,
  Timer as TimerIcon,
  SportsTennis as SportsIcon
} from '@mui/icons-material';
import GlassmorphicCard from '../common/GlassmorphicCard';
import GradientText from '../common/GradientText';
import { SportType } from '../../types';

interface ChampionshipStatusProps {
  sport: {
    name: string;
    type: SportType;
    primarySchool?: string;
  };
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED';
  venue: string;
  attendance: {
    current: number;
    capacity: number;
  };
  startTime?: string;
  endTime?: string;
}

interface MetricDisplayProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  progress?: number;
}

// Component for displaying a metric with an icon
const MetricDisplay: React.FC<MetricDisplayProps> = ({ 
  label, 
  value, 
  icon,
  progress 
}) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{ 
        width: 40, 
        height: 40, 
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.05)',
        color: theme.palette.primary.main
      }}>
        {icon}
      </Box>
      
      <Box>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {value}
        </Typography>
        
        {progress !== undefined && (
          <Box sx={{ 
            mt: 0.5,
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.1)' 
              : 'rgba(0, 0, 0, 0.05)',
            overflow: 'hidden'
          }}>
            <Box sx={{ 
              height: '100%',
              width: `${progress * 100}%`,
              background: 'linear-gradient(90deg, #0066cc, #00c2ff)',
              borderRadius: 2
            }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

// Team avatar component
const TeamAvatar: React.FC<{ school?: string; size: 'small' | 'medium' | 'large' }> = ({ 
  school, 
  size 
}) => {
  const theme = useTheme();
  const sizeMap = {
    small: 32,
    medium: 48,
    large: 64
  };
  
  const avatarSize = sizeMap[size];
  
  return (
    <Box sx={{ 
      width: avatarSize, 
      height: avatarSize, 
      borderRadius: '50%',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0066cc, #00c2ff)' 
        : 'linear-gradient(135deg, #0066cc, #00c2ff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontWeight: 'bold',
      fontSize: size === 'large' ? '1.5rem' : size === 'medium' ? '1.2rem' : '0.9rem',
      boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)'
    }}>
      {school ? school.charAt(0) : <SportsIcon />}
    </Box>
  );
};

// Main championship status card component
const ChampionshipStatusCard: React.FC<ChampionshipStatusProps> = ({ 
  sport, 
  status, 
  venue, 
  attendance,
  startTime,
  endTime
}) => {
  const theme = useTheme();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return theme.palette.success.main;
      case 'UPCOMING':
        return theme.palette.info.main;
      case 'COMPLETED':
        return theme.palette.grey[500];
      case 'CANCELLED':
        return theme.palette.error.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  return (
    <GlassmorphicCard sx={{
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px -8px rgba(0, 102, 204, 0.2), 0 0 15px rgba(0, 198, 255, 0.5)',
      }
    }}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TeamAvatar school={sport.primarySchool} size="large" />
          <Box>
            <GradientText variant="h6" sx={{ fontWeight: 600 }}>
              {sport.name} Championship
            </GradientText>
            <Chip 
              label={status} 
              size="small"
              sx={{ 
                background: getStatusColor(status),
                color: theme.palette.getContrastText(getStatusColor(status)),
                fontWeight: 500,
                mt: 0.5
              }}
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 2, borderColor: theme.palette.divider }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MetricDisplay 
              label="Venue" 
              value={venue} 
              icon={<LocationOnIcon />} 
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <MetricDisplay 
              label="Attendance" 
              value={`${attendance.current.toLocaleString()}/${attendance.capacity.toLocaleString()}`}
              icon={<PeopleIcon />}
              progress={attendance.current / attendance.capacity}
            />
          </Grid>
          
          {(startTime || endTime) && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              <MetricDisplay 
                label="Time" 
                value={startTime && endTime ? `${startTime} - ${endTime}` : startTime || endTime || ''}
                icon={<TimerIcon />}
              />
            </Grid>
          )}
        </Grid>
      </Box>
    </GlassmorphicCard>
  );
};

export default ChampionshipStatusCard;
