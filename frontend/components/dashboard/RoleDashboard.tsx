import React from 'react';
import { Box, useTheme } from '@mui/material';
import { SportType } from '../../types';
import TeamScheduleView from './views/TeamScheduleView';
import OfficialAssignmentsView from './views/OfficialAssignmentsView';
import ChampionshipControlCenter from './views/ChampionshipControlCenter';
import MediaAccessScheduler from './views/MediaAccessScheduler';
import NavigationRail from '../navigation/NavigationRail';
import QuickAccessPanel from '../panels/QuickAccessPanel';
import CredentialStatus from '../status/CredentialStatus';
import UpcomingEvents from '../status/UpcomingEvents';
import NotificationStream from '../notifications/NotificationStream';
import GlassmorphicCard from '../common/GlassmorphicCard';

export type UserRole = 'team' | 'official' | 'admin' | 'media';

interface DashboardViewProps {
  role: UserRole;
  institution?: string;
  sport?: SportType;
}

const RoleDashboard: React.FC<DashboardViewProps> = ({ role, institution, sport }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ 
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '250px 1fr 300px' },
      gap: 3,
      height: '100vh',
      background: theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)' 
        : 'linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%)',
    }}>
      <NavigationRail role={role} />
      
      <Box sx={{ 
        p: 3, 
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 3
      }}>
        <GlassmorphicCard sx={{ p: 0, overflow: 'hidden' }}>
          {role === 'team' && <TeamScheduleView institution={institution} />}
          {role === 'official' && <OfficialAssignmentsView />}
          {role === 'admin' && <ChampionshipControlCenter />}
          {role === 'media' && <MediaAccessScheduler />}
        </GlassmorphicCard>
      </Box>
      
      <QuickAccessPanel>
        <CredentialStatus />
        <UpcomingEvents />
        <NotificationStream />
      </QuickAccessPanel>
    </Box>
  );
};

export default RoleDashboard;
