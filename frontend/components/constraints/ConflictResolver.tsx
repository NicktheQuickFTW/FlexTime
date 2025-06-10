import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  Alert,
  AlertTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  LinearProgress,
  Badge,
  Collapse
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoFixHigh as AutoFixIcon,
  Lightbulb as LightbulbIcon,
  Timeline as TimelineIcon,
  TipsAndUpdates as TipsIcon
} from '@mui/icons-material';
import { Constraint, ConstraintType } from '../../types';

interface ConflictResolverProps {
  scheduleId: number;
  constraints: Constraint[];
  onResolve: (resolution: any) => void;
}

interface Conflict {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'direct' | 'indirect' | 'resource' | 'temporal';
  constraints: Constraint[];
  description: string;
  impact: string;
  resolutions: Resolution[];
  autoResolvable: boolean;
}

interface Resolution {
  id: string;
  type: 'modify' | 'remove' | 'priority' | 'schedule' | 'alternative';
  description: string;
  confidence: number;
  impact: string;
  actions: ResolutionAction[];
}

interface ResolutionAction {
  type: string;
  target: string;
  value: any;
  description: string;
}

const ConflictResolver: React.FC<ConflictResolverProps> = ({
  scheduleId,
  constraints,
  onResolve
}) => {
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConflict, setSelectedConflict] = useState<Conflict | null>(null);
  const [selectedResolution, setSelectedResolution] = useState<Resolution | null>(null);
  const [resolutionDialog, setResolutionDialog] = useState(false);
  const [expandedConflicts, setExpandedConflicts] = useState<Set<string>>(new Set());
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [autoResolveMode, setAutoResolveMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  const analyzeConflicts = useCallback(async () => {
    // Simulate conflict analysis
    setTimeout(() => {
      const detectedConflicts = detectConflicts(constraints);
      setConflicts(detectedConflicts);
      setLoading(false);
    }, 1500);
  }, [constraints]);

  useEffect(() => {
    analyzeConflicts();
  }, [analyzeConflicts]);

  const detectConflicts = (constraintList: Constraint[]): Conflict[] => {
    const conflicts: Conflict[] = [];

    // Example conflict detection logic
    constraintList.forEach((constraint1, index1) => {
      constraintList.slice(index1 + 1).forEach((constraint2) => {
        // Check for rest days vs consecutive games conflict
        if (
          constraint1.type === ConstraintType.REST_DAYS &&
          (constraint2.type === ConstraintType.MAX_CONSECUTIVE_AWAY ||
           constraint2.type === ConstraintType.MAX_CONSECUTIVE_HOME)
        ) {
          conflicts.push({
            id: `conflict-${conflicts.length + 1}`,
            severity: 'medium',
            type: 'temporal',
            constraints: [constraint1, constraint2],
            description: 'Rest day requirements conflict with consecutive game limits',
            impact: 'May result in suboptimal scheduling or constraint violations',
            autoResolvable: true,
            resolutions: [
              {
                id: 'res-1',
                type: 'modify',
                description: 'Adjust rest day requirements to be more flexible',
                confidence: 0.85,
                impact: 'Slightly reduced rest between some games',
                actions: [
                  {
                    type: 'modify_parameter',
                    target: constraint1.constraint_id?.toString() || '',
                    value: { minDays: 1 },
                    description: 'Reduce minimum rest days from 2 to 1'
                  }
                ]
              },
              {
                id: 'res-2',
                type: 'priority',
                description: 'Prioritize rest days over consecutive game limits',
                confidence: 0.75,
                impact: 'May increase travel burden for some teams',
                actions: [
                  {
                    type: 'change_priority',
                    target: constraint1.constraint_id?.toString() || '',
                    value: 9,
                    description: 'Increase rest days priority to 9'
                  },
                  {
                    type: 'change_priority',
                    target: constraint2.constraint_id?.toString() || '',
                    value: 5,
                    description: 'Reduce consecutive games priority to 5'
                  }
                ]
              }
            ]
          });
        }

        // Check for venue unavailability conflicts
        if (
          constraint1.type === ConstraintType.VENUE_UNAVAILABILITY &&
          constraint2.type === ConstraintType.REQUIRED_MATCHUP
        ) {
          const dates1 = constraint1.parameters.dates || [];
          const dates2 = constraint2.parameters.dates || [];
          const conflictingDates = dates1.filter((date: string) => dates2.includes(date));
          
          if (conflictingDates.length > 0) {
            conflicts.push({
              id: `conflict-${conflicts.length + 1}`,
              severity: 'high',
              type: 'resource',
              constraints: [constraint1, constraint2],
              description: 'Required matchup scheduled on venue unavailable date',
              impact: 'Cannot schedule required game on preferred date',
              autoResolvable: false,
              resolutions: [
                {
                  id: 'res-1',
                  type: 'schedule',
                  description: 'Move required matchup to alternative date',
                  confidence: 0.9,
                  impact: 'Game will be played on a different date',
                  actions: [
                    {
                      type: 'modify_dates',
                      target: constraint2.constraint_id?.toString() || '',
                      value: ['2024-03-15', '2024-03-22'], // Example alternative dates
                      description: 'Schedule game on alternative available dates'
                    }
                  ]
                },
                {
                  id: 'res-2',
                  type: 'alternative',
                  description: 'Use alternative venue for the matchup',
                  confidence: 0.7,
                  impact: 'Game will be played at a different venue',
                  actions: [
                    {
                      type: 'change_venue',
                      target: 'game',
                      value: 'alternative_venue_id',
                      description: 'Move game to alternative venue'
                    }
                  ]
                }
              ]
            });
          }
        }
      });
    });

    return conflicts;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <InfoIcon />;
      case 'medium': return <WarningIcon />;
      case 'high': return <ErrorIcon />;
      case 'critical': return <ErrorIcon />;
      default: return <InfoIcon />;
    }
  };

  const toggleConflictExpansion = (conflictId: string) => {
    const newExpanded = new Set(expandedConflicts);
    if (newExpanded.has(conflictId)) {
      newExpanded.delete(conflictId);
    } else {
      newExpanded.add(conflictId);
    }
    setExpandedConflicts(newExpanded);
  };

  const handleAutoResolve = async () => {
    const resolvableConflicts = conflicts.filter(c => c.autoResolvable);
    
    for (const conflict of resolvableConflicts) {
      const bestResolution = conflict.resolutions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );
      
      if (bestResolution.confidence >= getConfidenceThreshold()) {
        await applyResolution(conflict, bestResolution);
      }
    }
  };

  const getConfidenceThreshold = () => {
    switch (autoResolveMode) {
      case 'conservative': return 0.9;
      case 'balanced': return 0.75;
      case 'aggressive': return 0.6;
      default: return 0.75;
    }
  };

  const applyResolution = async (conflict: Conflict, resolution: Resolution) => {
    onResolve({
      conflictId: conflict.id,
      resolution: resolution,
      notes: resolutionNotes,
      timestamp: new Date().toISOString()
    });
    
    // Remove resolved conflict
    setConflicts(prev => prev.filter(c => c.id !== conflict.id));
  };

  const handleManualResolve = () => {
    if (selectedConflict && selectedResolution) {
      applyResolution(selectedConflict, selectedResolution);
      setResolutionDialog(false);
      setSelectedConflict(null);
      setSelectedResolution(null);
      setResolutionNotes('');
    }
  };

  const conflictStats = {
    total: conflicts.length,
    critical: conflicts.filter(c => c.severity === 'critical').length,
    high: conflicts.filter(c => c.severity === 'high').length,
    medium: conflicts.filter(c => c.severity === 'medium').length,
    low: conflicts.filter(c => c.severity === 'low').length,
    autoResolvable: conflicts.filter(c => c.autoResolvable).length
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }} align="center">
          Analyzing constraints for conflicts...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" align="center">
                {conflictStats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Total Conflicts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderColor: 'error.main', borderWidth: 2, borderStyle: 'solid' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="error">
                {conflictStats.critical + conflictStats.high}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Critical/High Severity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderColor: 'warning.main', borderWidth: 2, borderStyle: 'solid' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="warning.main">
                {conflictStats.medium}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Medium Severity
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderColor: 'success.main', borderWidth: 2, borderStyle: 'solid' }}>
            <CardContent>
              <Typography variant="h4" align="center" color="success.main">
                {conflictStats.autoResolvable}
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Auto-Resolvable
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Auto-Resolution Controls */}
      {conflictStats.autoResolvable > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <AutoFixIcon color="primary" />
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1">
                Automatic Conflict Resolution
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {conflictStats.autoResolvable} conflicts can be resolved automatically
              </Typography>
            </Box>
            <FormControl sx={{ minWidth: 150 }}>
              <InputLabel>Mode</InputLabel>
              <Select
                value={autoResolveMode}
                onChange={(e) => setAutoResolveMode(e.target.value as any)}
                label="Mode"
                size="small"
              >
                <MenuItem value="conservative">Conservative</MenuItem>
                <MenuItem value="balanced">Balanced</MenuItem>
                <MenuItem value="aggressive">Aggressive</MenuItem>
              </Select>
            </FormControl>
            <Button
              variant="contained"
              startIcon={<AutoFixIcon />}
              onClick={handleAutoResolve}
            >
              Auto-Resolve
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Conflicts List */}
      {conflicts.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />}>
          <AlertTitle>No Conflicts Detected</AlertTitle>
          All constraints are compatible with each other. The schedule can be generated without conflicts.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {conflicts.map((conflict) => (
            <Paper key={conflict.id} elevation={2}>
              <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Badge
                    badgeContent={conflict.severity}
                    color={getSeverityColor(conflict.severity)}
                  >
                    {getSeverityIcon(conflict.severity)}
                  </Badge>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1">
                      {conflict.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {conflict.impact}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Chip 
                        label={conflict.type} 
                        size="small" 
                        variant="outlined"
                      />
                      {conflict.autoResolvable && (
                        <Chip 
                          label="Auto-resolvable" 
                          size="small" 
                          color="success"
                          variant="outlined"
                        />
                      )}
                      <Chip
                        label={`${conflict.constraints.length} constraints involved`}
                        size="small"
                      />
                    </Stack>
                  </Box>
                  <IconButton
                    onClick={() => toggleConflictExpansion(conflict.id)}
                  >
                    {expandedConflicts.has(conflict.id) ? 
                      <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Stack>

                <Collapse in={expandedConflicts.has(conflict.id)}>
                  <Divider sx={{ my: 2 }} />
                  
                  {/* Involved Constraints */}
                  <Typography variant="subtitle2" gutterBottom>
                    Involved Constraints:
                  </Typography>
                  <List dense>
                    {conflict.constraints.map((constraint) => (
                      <ListItem key={constraint.constraint_id}>
                        <ListItemIcon>
                          <Chip
                            label={constraint.priority}
                            size="small"
                            color={constraint.priority >= 8 ? 'error' : 'default'}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={constraint.type.replace(/([A-Z])/g, ' $1').trim()}
                          secondary={`Category: ${constraint.category}`}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {/* Resolution Options */}
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Resolution Options:
                  </Typography>
                  <Grid container spacing={2}>
                    {conflict.resolutions.map((resolution) => (
                      <Grid item xs={12} md={6} key={resolution.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" spacing={1} alignItems="center">
                              {resolution.type === 'modify' && <TipsIcon />}
                              {resolution.type === 'priority' && <TimelineIcon />}
                              {resolution.type === 'schedule' && <LightbulbIcon />}
                              <Typography variant="subtitle2">
                                {resolution.description}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              Impact: {resolution.impact}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={resolution.confidence * 100}
                                sx={{ height: 8, borderRadius: 4 }}
                              />
                              <Typography variant="caption">
                                Confidence: {(resolution.confidence * 100).toFixed(0)}%
                              </Typography>
                            </Box>
                          </CardContent>
                          <CardActions>
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedConflict(conflict);
                                setSelectedResolution(resolution);
                                setResolutionDialog(true);
                              }}
                            >
                              Apply Resolution
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Collapse>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Resolution Dialog */}
      <Dialog
        open={resolutionDialog}
        onClose={() => setResolutionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Apply Resolution</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              <AlertTitle>Resolution Details</AlertTitle>
              {selectedResolution?.description}
            </Alert>
            
            <Typography variant="subtitle2">Actions to be taken:</Typography>
            <List dense>
              {selectedResolution?.actions.map((action, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={action.description}
                    secondary={`Type: ${action.type} | Target: ${action.target}`}
                  />
                </ListItem>
              ))}
            </List>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Resolution Notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              helperText="Add any notes about this resolution for future reference"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResolutionDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleManualResolve}
            startIcon={<CheckCircleIcon />}
          >
            Apply Resolution
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConflictResolver;