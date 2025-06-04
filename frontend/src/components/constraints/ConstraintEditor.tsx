import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Stack,
  Slider,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  Grid,
  IconButton,
  Autocomplete,
  FormHelperText,
  Divider
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Constraint, ConstraintType, ConstraintCategory, Team } from '../../types';
import { TeamService } from '../../services/api';

interface ConstraintEditorProps {
  constraint: Constraint | null;
  scheduleId: number;
  onSave: (constraint: Constraint) => void;
  onCancel: () => void;
}

interface ParameterConfig {
  type: 'number' | 'string' | 'boolean' | 'date' | 'array' | 'team' | 'teams';
  label: string;
  description?: string;
  required?: boolean;
  min?: number;
  max?: number;
  default?: any;
}

const constraintParameterConfigs: Record<ConstraintType, Record<string, ParameterConfig>> = {
  [ConstraintType.REST_DAYS]: {
    minDays: {
      type: 'number',
      label: 'Minimum Rest Days',
      description: 'Minimum number of days between games',
      required: true,
      min: 1,
      max: 14,
      default: 2
    },
    maxDays: {
      type: 'number',
      label: 'Maximum Rest Days',
      description: 'Maximum number of days between games',
      required: false,
      min: 1,
      max: 30,
      default: 7
    }
  },
  [ConstraintType.MAX_CONSECUTIVE_AWAY]: {
    maxGames: {
      type: 'number',
      label: 'Maximum Consecutive Away Games',
      description: 'Maximum number of consecutive away games allowed',
      required: true,
      min: 1,
      max: 10,
      default: 3
    }
  },
  [ConstraintType.MAX_CONSECUTIVE_HOME]: {
    maxGames: {
      type: 'number',
      label: 'Maximum Consecutive Home Games',
      description: 'Maximum number of consecutive home games allowed',
      required: true,
      min: 1,
      max: 10,
      default: 3
    }
  },
  [ConstraintType.VENUE_UNAVAILABILITY]: {
    venueId: {
      type: 'number',
      label: 'Venue',
      description: 'Select the venue that is unavailable',
      required: true
    },
    dates: {
      type: 'array',
      label: 'Unavailable Dates',
      description: 'Dates when the venue is not available',
      required: true
    }
  },
  [ConstraintType.TEAM_UNAVAILABILITY]: {
    dates: {
      type: 'array',
      label: 'Unavailable Dates',
      description: 'Dates when the team cannot play',
      required: true
    }
  },
  [ConstraintType.REQUIRED_MATCHUP]: {
    team1Id: {
      type: 'team',
      label: 'Team 1',
      description: 'First team in the required matchup',
      required: true
    },
    team2Id: {
      type: 'team',
      label: 'Team 2',
      description: 'Second team in the required matchup',
      required: true
    },
    dates: {
      type: 'array',
      label: 'Preferred Dates',
      description: 'Preferred dates for this matchup',
      required: false
    }
  },
  [ConstraintType.AVOID_BACK_TO_BACK]: {
    enabled: {
      type: 'boolean',
      label: 'Avoid Back-to-Back Games',
      description: 'Prevent scheduling games on consecutive days',
      required: true,
      default: true
    }
  }
};

const ConstraintEditor: React.FC<ConstraintEditorProps> = ({
  constraint,
  scheduleId,
  onSave,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [type, setType] = useState<ConstraintType>(
    constraint?.type || ConstraintType.REST_DAYS
  );
  const [category, setCategory] = useState<ConstraintCategory>(
    constraint?.category || ConstraintCategory.SCHEDULE
  );
  const [priority, setPriority] = useState<number>(constraint?.priority || 5);
  const [parameters, setParameters] = useState<Record<string, any>>(
    constraint?.parameters || {}
  );
  const [selectedTeams, setSelectedTeams] = useState<Team[]>(constraint?.teams || []);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    // Auto-set category based on constraint type
    if (type === ConstraintType.VENUE_UNAVAILABILITY) {
      setCategory(ConstraintCategory.VENUE);
    } else if (
      type === ConstraintType.TEAM_UNAVAILABILITY ||
      type === ConstraintType.MAX_CONSECUTIVE_AWAY ||
      type === ConstraintType.MAX_CONSECUTIVE_HOME
    ) {
      setCategory(ConstraintCategory.TEAM);
    } else {
      setCategory(ConstraintCategory.SCHEDULE);
    }

    // Initialize default parameters
    const config = constraintParameterConfigs[type];
    const newParams: Record<string, any> = {};
    Object.entries(config).forEach(([key, paramConfig]) => {
      if (paramConfig.default !== undefined && !parameters[key]) {
        newParams[key] = paramConfig.default;
      }
    });
    if (Object.keys(newParams).length > 0) {
      setParameters(prev => ({ ...prev, ...newParams }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const fetchTeams = async () => {
    try {
      const response = await TeamService.getTeams();
      if (response.success && response.data) {
        setAvailableTeams(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const handleParameterChange = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const config = constraintParameterConfigs[type];

    Object.entries(config).forEach(([key, paramConfig]) => {
      if (paramConfig.required && !parameters[key]) {
        newErrors[key] = `${paramConfig.label} is required`;
      }
      if (paramConfig.type === 'number' && parameters[key]) {
        const value = parameters[key];
        if (paramConfig.min !== undefined && value < paramConfig.min) {
          newErrors[key] = `Minimum value is ${paramConfig.min}`;
        }
        if (paramConfig.max !== undefined && value > paramConfig.max) {
          newErrors[key] = `Maximum value is ${paramConfig.max}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const newConstraint: Constraint = {
      ...(constraint?.constraint_id && { constraint_id: constraint.constraint_id }),
      schedule_id: scheduleId,
      type,
      category,
      priority,
      parameters,
      teams: selectedTeams
    };

    onSave(newConstraint);
  };

  const renderParameterInput = (key: string, config: ParameterConfig) => {
    const value = parameters[key];
    const error = errors[key];

    switch (config.type) {
      case 'number':
        return (
          <TextField
            fullWidth
            type="number"
            label={config.label}
            value={value || ''}
            onChange={(e) => handleParameterChange(key, parseInt(e.target.value))}
            error={!!error}
            helperText={error || config.description}
            InputProps={{
              inputProps: {
                min: config.min,
                max: config.max
              }
            }}
          />
        );

      case 'string':
        return (
          <TextField
            fullWidth
            label={config.label}
            value={value || ''}
            onChange={(e) => handleParameterChange(key, e.target.value)}
            error={!!error}
            helperText={error || config.description}
          />
        );

      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value || false}
                onChange={(e) => handleParameterChange(key, e.target.checked)}
              />
            }
            label={config.label}
          />
        );

      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label={config.label}
              value={value ? new Date(value) : null}
              onChange={(newValue) => handleParameterChange(key, newValue?.toISOString())}
              slots={{
                textField: TextField
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!error,
                  helperText: error || config.description
                }
              }}
            />
          </LocalizationProvider>
        );

      case 'array':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {config.label}
            </Typography>
            <Stack spacing={1}>
              {(value || []).map((item: any, index: number) => (
                <Stack key={index} direction="row" spacing={1} alignItems="center">
                  <TextField
                    fullWidth
                    value={item}
                    onChange={(e) => {
                      const newArray = [...(value || [])];
                      newArray[index] = e.target.value;
                      handleParameterChange(key, newArray);
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => {
                      const newArray = (value || []).filter((_: any, i: number) => i !== index);
                      handleParameterChange(key, newArray);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => handleParameterChange(key, [...(value || []), ''])}
                size="small"
              >
                Add Item
              </Button>
            </Stack>
            {config.description && (
              <FormHelperText error={!!error}>
                {error || config.description}
              </FormHelperText>
            )}
          </Box>
        );

      case 'team':
      case 'teams':
        return (
          <Autocomplete
            multiple={config.type === 'teams'}
            options={availableTeams}
            getOptionLabel={(option) => option.name}
            value={config.type === 'teams' ? (value || []) : value}
            onChange={(_, newValue) => handleParameterChange(key, newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label={config.label}
                error={!!error}
                helperText={error || config.description}
              />
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        {constraint ? 'Edit Constraint' : 'Create New Constraint'}
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical" sx={{ mt: 3 }}>
        <Step>
          <StepLabel>Select Constraint Type</StepLabel>
          <StepContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Constraint Type</InputLabel>
                  <Select
                    value={type}
                    onChange={(e) => setType(e.target.value as ConstraintType)}
                    label="Constraint Type"
                  >
                    {Object.values(ConstraintType).map((constraintType) => (
                      <MenuItem key={constraintType} value={constraintType}>
                        {constraintType.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info" icon={<InfoIcon />}>
                  {type === ConstraintType.REST_DAYS && 'Ensures teams have adequate rest between games'}
                  {type === ConstraintType.MAX_CONSECUTIVE_AWAY && 'Limits the number of consecutive away games'}
                  {type === ConstraintType.MAX_CONSECUTIVE_HOME && 'Limits the number of consecutive home games'}
                  {type === ConstraintType.VENUE_UNAVAILABILITY && 'Marks specific dates when a venue is not available'}
                  {type === ConstraintType.TEAM_UNAVAILABILITY && 'Marks specific dates when a team cannot play'}
                  {type === ConstraintType.REQUIRED_MATCHUP && 'Ensures specific teams play against each other'}
                  {type === ConstraintType.AVOID_BACK_TO_BACK && 'Prevents scheduling games on consecutive days'}
                </Alert>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={onCancel}>Cancel</Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Configure Parameters</StepLabel>
          <StepContent>
            <Stack spacing={2}>
              {Object.entries(constraintParameterConfigs[type]).map(([key, config]) => (
                <Box key={key}>
                  {renderParameterInput(key, config)}
                </Box>
              ))}
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={() => setActiveStep(0)}>Back</Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Set Priority & Teams</StepLabel>
          <StepContent>
            <Stack spacing={3}>
              <Box>
                <Typography gutterBottom>
                  Priority: {priority}
                </Typography>
                <Slider
                  value={priority}
                  onChange={(_, value) => setPriority(value as number)}
                  min={1}
                  max={10}
                  marks={[
                    { value: 1, label: '1 (Low)' },
                    { value: 5, label: '5 (Medium)' },
                    { value: 10, label: '10 (High)' }
                  ]}
                  valueLabelDisplay="auto"
                />
                <FormHelperText>
                  Higher priority constraints are given more importance during scheduling
                </FormHelperText>
              </Box>

              <Box>
                <Autocomplete
                  multiple
                  options={availableTeams}
                  getOptionLabel={(option) => option.name}
                  value={selectedTeams}
                  onChange={(_, newValue) => setSelectedTeams(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Apply to Teams"
                      helperText="Leave empty to apply to all teams"
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.name}
                        {...getTagProps({ index })}
                        key={option.team_id}
                      />
                    ))
                  }
                />
              </Box>
            </Stack>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                onClick={() => setActiveStep(3)}
                sx={{ mr: 1 }}
              >
                Continue
              </Button>
              <Button onClick={() => setActiveStep(1)}>Back</Button>
            </Box>
          </StepContent>
        </Step>

        <Step>
          <StepLabel>Review & Save</StepLabel>
          <StepContent>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Constraint Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Type
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {type.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Category
                    </Typography>
                    <Chip
                      label={category}
                      size="small"
                      color="primary"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Priority
                    </Typography>
                    <Typography variant="body1">
                      {priority} / 10
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Applied to
                    </Typography>
                    <Typography variant="body1">
                      {selectedTeams.length > 0 
                        ? `${selectedTeams.length} team(s)`
                        : 'All teams'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Parameters
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {Object.entries(parameters).map(([key, value]) => (
                        <Typography key={key} variant="body2">
                          {key}: {JSON.stringify(value)}
                        </Typography>
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<SaveIcon />}
                sx={{ mr: 1 }}
              >
                Save Constraint
              </Button>
              <Button onClick={() => setActiveStep(2)}>Back</Button>
            </Box>
          </StepContent>
        </Step>
      </Stepper>
    </Paper>
  );
};

export default ConstraintEditor;