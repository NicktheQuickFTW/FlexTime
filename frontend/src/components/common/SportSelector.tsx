import React from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Box,
  Typography,
  Chip,
  Icon
} from '@mui/material';
import { useSportConfigContext } from '../../contexts/SportConfigContext';

// List of sports with regular season scheduling (IDs)
const regularSeasonSportIds = [
  1,  // Football
  2,  // Men's Basketball
  3,  // Women's Basketball
  4,  // Baseball
  5,  // Softball
  6,  // Volleyball
  7,  // Soccer
  8,  // Men's Tennis
  9,  // Women's Tennis
  10, // Gymnastics
  11, // Wrestling
  23  // Lacrosse
];

interface SportSelectorProps {
  label?: string;
  variant?: 'standard' | 'outlined' | 'filled';
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  showIcon?: boolean;
}

const SportSelector: React.FC<SportSelectorProps> = ({
  label = 'Sport',
  variant = 'outlined',
  size = 'small',
  fullWidth = false,
  showIcon = true
}) => {
  const {
    currentSportId,
    setSportById,
    sportConfig,
    loading
  } = useSportConfigContext();
  
  const handleChange = (event: SelectChangeEvent<number>) => {
    const sportId = Number(event.target.value);
    setSportById(sportId);
  };

  return (
    <FormControl variant={variant} size={size} fullWidth={fullWidth}>
      <InputLabel id="sport-selector-label">{label}</InputLabel>
      <Select
        labelId="sport-selector-label"
        id="sport-selector"
        value={currentSportId || ''}
        onChange={handleChange}
        label={label}
        disabled={loading}
      >
        {regularSeasonSportIds.map((sportId) => {
          // Get the sport name based on ID
          let sportName = '';
          switch(sportId) {
            case 1: sportName = 'Football'; break;
            case 2: sportName = 'Men\'s Basketball'; break;
            case 3: sportName = 'Women\'s Basketball'; break;
            case 4: sportName = 'Baseball'; break;
            case 5: sportName = 'Softball'; break;
            case 6: sportName = 'Volleyball'; break;
            case 7: sportName = 'Soccer'; break;
            case 8: sportName = 'Men\'s Tennis'; break;
            case 9: sportName = 'Women\'s Tennis'; break;
            case 10: sportName = 'Gymnastics'; break;
            case 11: sportName = 'Wrestling'; break;
            case 23: sportName = 'Lacrosse'; break;
          }
          
          return (
            <MenuItem key={sportId} value={sportId}>
              <Box display="flex" alignItems="center" width="100%">
                {showIcon && sportConfig && currentSportId === sportId && sportConfig.icon && (
                  <Icon sx={{ mr: 1, color: sportConfig.color }}>{sportConfig.icon}</Icon>
                )}
                <Typography>{sportName}</Typography>
                
                {sportConfig && currentSportId === sportId && sportConfig.customScheduleComponent && (
                  <Chip 
                    label="Custom" 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 'auto', height: 20 }}
                  />
                )}
              </Box>
            </MenuItem>
          );
        })}
      </Select>
      
      {sportConfig && (
        <Box mt={1} display="flex" flexWrap="wrap" gap={0.5}>
          <Chip 
            size="small" 
            label={`${sportConfig.defaultGamesPerTeam} Games`} 
            variant="outlined"
          />
          <Chip 
            size="small" 
            label={`${sportConfig.typicalSeasonLength} Weeks`} 
            variant="outlined"
          />
        </Box>
      )}
    </FormControl>
  );
};

export default SportSelector;
