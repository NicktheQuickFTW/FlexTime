import React from 'react';
import { Box, Typography, Chip, Paper, CircularProgress, Icon } from '@mui/material';
import { Schedule } from '../../types';
import useSportConfig from '../../hooks/useSportConfig';

interface SportSpecificScheduleProps {
  schedule: Schedule;
}

/**
 * A component that adapts its display and behavior based on the sport type
 * of the provided schedule.
 */
const SportSpecificSchedule: React.FC<SportSpecificScheduleProps> = ({ schedule }) => {
  // Use the custom hook to get sport-specific configuration
  const { sportConfig, loading, error } = useSportConfig(schedule.sport_id);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !sportConfig) {
    return (
      <Box p={2}>
        <Typography color="error">
          Error loading sport configuration: {error || 'Configuration not found'}
        </Typography>
      </Box>
    );
  }

  // Now we can use the sport-specific configuration to customize the UI
  return (
    <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
      <Box display="flex" alignItems="center" mb={2}>
        <Icon sx={{ mr: 1 }}>{sportConfig.icon}</Icon>
        <Typography variant="h5" component="h2" sx={{ color: sportConfig.color }}>
          {sportConfig.name} Schedule: {schedule.name}
        </Typography>
      </Box>

      <Box mb={2}>
        <Typography variant="subtitle1">Season: {schedule.season}</Typography>
        <Typography variant="body2">
          {new Date(schedule.start_date).toLocaleDateString()} - {new Date(schedule.end_date).toLocaleDateString()}
        </Typography>
      </Box>

      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        <Chip 
          label={`${sportConfig.defaultGamesPerTeam} Games`} 
          size="small" 
          color="primary" 
        />
        <Chip 
          label={`${sportConfig.typicalSeasonLength} Weeks`} 
          size="small" 
          color="primary" 
        />
        <Chip 
          label={`${sportConfig.minRestDays}+ Rest Days`} 
          size="small" 
          color="primary" 
        />
        {sportConfig.allowDoubleHeaders && (
          <Chip 
            label="Double Headers Allowed" 
            size="small" 
            color="secondary" 
          />
        )}
      </Box>

      <Typography variant="h6">Venue Requirements</Typography>
      <Box display="flex" flexWrap="wrap" gap={1} mb={3}>
        {sportConfig.venueTypes.map((venueType) => (
          <Chip 
            key={venueType}
            label={venueType} 
            size="small" 
            variant="outlined"
          />
        ))}
      </Box>

      <Typography variant="h6">Default Constraints</Typography>
      <Box>
        {sportConfig.defaultConstraints.map((constraint, index) => (
          <Box key={index} mb={1}>
            <Typography variant="subtitle2">{constraint.name}</Typography>
            <Typography variant="body2">{constraint.description}</Typography>
          </Box>
        ))}
      </Box>

      {/* Render different views based on sport configuration */}
      <Box mt={3}>
        {sportConfig.calendarViewEnabled && (
          <Chip 
            label="Calendar View Available" 
            size="small" 
            color="success" 
            sx={{ mr: 1 }}
          />
        )}
        {sportConfig.matrixViewEnabled && (
          <Chip 
            label="Matrix View Available" 
            size="small" 
            color="success" 
            sx={{ mr: 1 }}
          />
        )}
        {sportConfig.bracketViewEnabled && (
          <Chip 
            label="Bracket View Available" 
            size="small" 
            color="success" 
          />
        )}
      </Box>

      {/* If there's a custom component specified for this sport, we would dynamically load it here */}
      {sportConfig.customScheduleComponent && (
        <Box mt={3} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
          <Typography variant="body2">
            This sport uses a custom schedule component: {sportConfig.customScheduleComponent}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default SportSpecificSchedule;
