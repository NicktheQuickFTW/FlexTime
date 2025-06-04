import React, { useState } from 'react';
import { Box, Typography, IconButton, Grid } from '@mui/material';
import { Add as AddIcon, Schedule as ScheduleIcon } from '@mui/icons-material';
import {
  HoverCard,
  RippleButton,
  LoadingSpinner,
  PulseIndicator,
  FloatingAction,
  StaggerContainer,
  StaggerItem,
} from './MicroInteractions';

/**
 * Example component demonstrating micro-interactions
 * Following [Playbook: Frontend Enhancement Suite] design principles
 */
const MicroInteractionsExample: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasNotification, setHasNotification] = useState(true);

  const handleGenerateSchedule = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setHasNotification(false);
    }, 3000);
  };

  const handleQuickAction = () => {
    console.log('Quick action triggered');
  };

  const scheduleCards = [
    { id: 1, title: 'Football Schedule', sport: 'football', conflicts: 2 },
    { id: 2, title: 'Basketball Schedule', sport: 'basketball', conflicts: 0 },
    { id: 3, title: 'Baseball Schedule', sport: 'baseball', conflicts: 1 },
    { id: 4, title: 'Softball Schedule', sport: 'softball', conflicts: 0 },
  ];

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        FlexTime Micro-Interactions Demo
      </Typography>
      
      {/* Hover Cards with Stagger Animation */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Schedule Cards with Hover Effects
        </Typography>
        <StaggerContainer delay={0.1}>
          <Grid container spacing={3}>
            {scheduleCards.map((schedule) => (
              <Grid item xs={12} sm={6} md={3} key={schedule.id}>
                <StaggerItem>
                  <HoverCard 
                    elevation="medium" 
                    glassEffect={true}
                    onClick={() => console.log(`Clicked ${schedule.title}`)}
                  >
                    <Box sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <ScheduleIcon sx={{ mr: 1 }} />
                        <Typography variant="h6" className={`ft-animation--${schedule.sport}`}>
                          {schedule.title}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Conflicts: {schedule.conflicts}
                        </Typography>
                        <PulseIndicator 
                          active={schedule.conflicts > 0}
                          color={schedule.conflicts > 0 ? '#ff4444' : '#00c2ff'}
                          size={8}
                          intensity="medium"
                        />
                      </Box>
                    </Box>
                  </HoverCard>
                </StaggerItem>
              </Grid>
            ))}
          </Grid>
        </StaggerContainer>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Interactive Buttons
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <RippleButton
            variant="contained"
            color="primary"
            size="medium"
            onClick={() => console.log('Primary action')}
          >
            Primary Action
          </RippleButton>
          
          <RippleButton
            variant="contained"
            color="sportAccent"
            size="medium"
            loading={isLoading}
            onClick={handleGenerateSchedule}
          >
            Generate Schedule
          </RippleButton>
          
          <RippleButton
            variant="outlined"
            color="secondary"
            size="medium"
            onClick={() => console.log('Secondary action')}
          >
            Secondary Action
          </RippleButton>
          
          <RippleButton
            variant="text"
            color="primary"
            size="small"
            onClick={() => console.log('Text action')}
          >
            Text Action
          </RippleButton>
        </Box>
      </Box>

      {/* Loading States */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Loading Indicators
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <LoadingSpinner size="small" color="primary" glassmorphic={false} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Small
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <LoadingSpinner size="medium" color="sportAccent" glassmorphic={true} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Medium (Glassmorphic)
            </Typography>
          </Box>
          
          <Box sx={{ textAlign: 'center' }}>
            <LoadingSpinner size="large" color="secondary" glassmorphic={false} />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Large
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Status Indicators */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Status Indicators
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PulseIndicator 
              active={true} 
              color="#00c2ff" 
              size={12} 
              intensity="high" 
            />
            <Typography variant="body2">System Online</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PulseIndicator 
              active={hasNotification} 
              color="#ff4444" 
              size={10} 
              intensity="medium" 
            />
            <Typography variant="body2">Conflicts Detected</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PulseIndicator 
              active={false} 
              color="#22c55e" 
              size={8} 
              intensity="low" 
            />
            <Typography variant="body2">Processing Complete</Typography>
          </Box>
        </Box>
      </Box>

      {/* Floating Action Example */}
      <FloatingAction
        position="bottom-right"
        offset={24}
        onClick={handleQuickAction}
        delay={0.5}
      >
        <IconButton 
          sx={{ 
            width: 56, 
            height: 56, 
            backgroundColor: 'primary.main', 
            color: 'white',
            '&:hover': { backgroundColor: 'primary.dark' }
          }}
        >
          <AddIcon />
        </IconButton>
      </FloatingAction>

      {/* Usage Instructions */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: 'background.paper', borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Usage Instructions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This demo showcases the micro-interaction components available in the FlexTime animation system:
        </Typography>
        <Box component="ul" sx={{ pl: 2 }}>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>HoverCard:</strong> Cards with glassmorphic effects and smooth hover animations
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>RippleButton:</strong> Material Design-inspired buttons with ripple effects
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>LoadingSpinner:</strong> Glassmorphic loading indicators with theme integration
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>PulseIndicator:</strong> Animated status indicators for real-time updates
          </Typography>
          <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
            <strong>FloatingAction:</strong> Floating action button with entrance animations
          </Typography>
          <Typography component="li" variant="body2">
            <strong>StaggerContainer/StaggerItem:</strong> Coordinated animations for lists and grids
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default MicroInteractionsExample;