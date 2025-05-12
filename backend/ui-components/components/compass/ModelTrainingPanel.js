/**
 * ModelTrainingPanel Component
 * 
 * A React component for managing COMPASS model training
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Alert,
  AlertTitle,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  PlayArrow as StartIcon,
  Stop as StopIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon
} from '@mui/icons-material';

// API endpoint for training routes
const API_URL = '/api/compass/training';

// Helper to format date
const formatDate = (date) => {
  if (!date) return 'Not scheduled';
  return new Date(date).toLocaleString();
};

/**
 * Model Training Panel Component
 */
export default function ModelTrainingPanel() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState({});
  const [models, setModels] = useState({});
  const [modelHistory, setModelHistory] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  
  // Training settings
  const [settings, setSettings] = useState({
    scheduledTime: '02:00',
    models: ['game', 'team', 'player', 'sos'],
    epochs: 100,
    batchSize: 64
  });
  
  // Training a specific model
  const [trainingModel, setTrainingModel] = useState(null);
  
  // Load status on mount
  useEffect(() => {
    loadStatus();
    loadModels();
  }, []);
  
  // Load job status
  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/status`);
      
      if (response.data.registered) {
        setStatus(response.data.status);
        
        // Update settings
        setSettings({
          scheduledTime: response.data.status.scheduledTime || '02:00',
          models: response.data.status.models || ['game', 'team', 'player', 'sos'],
          epochs: response.data.status.epochs || 100,
          batchSize: response.data.status.batchSize || 64
        });
      } else {
        setStatus({
          isRunning: false,
          lastRunTime: null,
          nextRunTime: null
        });
      }
    } catch (err) {
      setError('Failed to load training status');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Load available models
  const loadModels = async () => {
    try {
      const response = await axios.get(`${API_URL}/models`);
      setModels(response.data.models);
    } catch (err) {
      console.error('Failed to load models', err);
    }
  };
  
  // Load model history
  const loadModelHistory = async (modelId) => {
    try {
      setSelectedModel(modelId);
      
      const response = await axios.get(`${API_URL}/history/${modelId}`);
      setModelHistory(response.data.history);
    } catch (err) {
      console.error('Failed to load model history', err);
      setModelHistory(null);
    }
  };
  
  // Register training job
  const registerJob = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/register`, settings);
      
      // Reload status
      await loadStatus();
    } catch (err) {
      setError('Failed to register training job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Start training job
  const startJob = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/start`);
      
      // Reload status
      await loadStatus();
    } catch (err) {
      setError('Failed to start training job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Stop training job
  const stopJob = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.post(`${API_URL}/stop`);
      
      // Reload status
      await loadStatus();
    } catch (err) {
      setError('Failed to stop training job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Train specific model
  const trainModel = async (modelType) => {
    try {
      setTrainingModel(modelType);
      
      await axios.post(`${API_URL}/train/${modelType}`, {
        epochs: settings.epochs,
        batchSize: settings.batchSize
      });
      
      // Wait a bit before checking for new models
      setTimeout(() => {
        loadModels();
        setTrainingModel(null);
      }, 5000);
    } catch (err) {
      console.error(`Failed to train ${modelType} model`, err);
      setTrainingModel(null);
    }
  };
  
  // Handle setting changes
  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle model selection changes
  const handleModelChange = (event) => {
    const modelType = event.target.value;
    
    // If no model is selected, clear history
    if (!modelType) {
      setSelectedModel('');
      setModelHistory(null);
      return;
    }
    
    // Get latest model of the selected type
    const modelList = models[modelType] || [];
    
    if (modelList.length > 0) {
      loadModelHistory(modelList[0].id);
    } else {
      setSelectedModel(modelType);
      setModelHistory(null);
    }
  };
  
  // Render model history
  const renderModelHistory = () => {
    if (!modelHistory) return null;
    
    // Extract history metrics
    const epochs = modelHistory.loss.length;
    const losses = modelHistory.loss;
    const validationLosses = modelHistory.val_loss || [];
    const accuracies = modelHistory.acc || [];
    const validationAccuracies = modelHistory.val_acc || [];
    
    return (
      <Card sx={{ mt: 2 }}>
        <CardHeader
          title="Training History"
          avatar={<TimelineIcon />}
        />
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Training Metrics</Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Epoch</TableCell>
                      <TableCell>Loss</TableCell>
                      {validationLosses.length > 0 && <TableCell>Val Loss</TableCell>}
                      {accuracies.length > 0 && <TableCell>Accuracy</TableCell>}
                      {validationAccuracies.length > 0 && <TableCell>Val Accuracy</TableCell>}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {losses.map((loss, index) => (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>{loss.toFixed(4)}</TableCell>
                        {validationLosses.length > 0 && <TableCell>{validationLosses[index]?.toFixed(4) || 'N/A'}</TableCell>}
                        {accuracies.length > 0 && <TableCell>{(accuracies[index] * 100).toFixed(2)}%</TableCell>}
                        {validationAccuracies.length > 0 && <TableCell>{(validationAccuracies[index] * 100).toFixed(2)}%</TableCell>}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Performance Summary</Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1"><strong>Total Epochs:</strong> {epochs}</Typography>
                <Typography variant="body1"><strong>Starting Loss:</strong> {losses[0]?.toFixed(4) || 'N/A'}</Typography>
                <Typography variant="body1"><strong>Final Loss:</strong> {losses[epochs - 1]?.toFixed(4) || 'N/A'}</Typography>
                
                {accuracies.length > 0 && (
                  <>
                    <Typography variant="body1"><strong>Starting Accuracy:</strong> {(accuracies[0] * 100).toFixed(2)}%</Typography>
                    <Typography variant="body1"><strong>Final Accuracy:</strong> {(accuracies[epochs - 1] * 100).toFixed(2)}%</Typography>
                  </>
                )}
                
                {validationLosses.length > 0 && (
                  <Typography variant="body1">
                    <strong>Improvement:</strong> {((1 - (validationLosses[epochs - 1] / validationLosses[0])) * 100).toFixed(2)}% reduction in validation loss
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        COMPASS Model Training
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Training Job Status" 
              avatar={<ScheduleIcon />}
              action={
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={loadStatus}
                  disabled={loading}
                >
                  Refresh
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Typography variant="h6">
                      {status.isRunning ? (
                        <Chip label="Running" color="success" icon={<PlayArrow />} />
                      ) : (
                        <Chip label="Idle" color="default" />
                      )}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Scheduled Time</Typography>
                    <Typography variant="h6">{status.scheduledTime || 'Not scheduled'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Last Run</Typography>
                    <Typography variant="body1">{formatDate(status.lastRunTime)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Next Run</Typography>
                    <Typography variant="body1">{formatDate(status.nextRunTime)}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">Models</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {(status.models || []).map(model => (
                        <Chip key={model} label={model} size="small" />
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<StartIcon />} 
                        onClick={startJob}
                        disabled={loading || status.isRunning}
                      >
                        Start Now
                      </Button>
                      <Button 
                        variant="outlined" 
                        color="error" 
                        startIcon={<StopIcon />} 
                        onClick={stopJob}
                        disabled={loading || !status.isRunning}
                      >
                        Stop
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mt: 3 }}>
            <CardHeader 
              title="Training Settings" 
              avatar={<SettingsIcon />}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    label="Scheduled Time"
                    type="time"
                    value={settings.scheduledTime}
                    onChange={(e) => handleSettingChange('scheduledTime', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Epochs"
                    type="number"
                    value={settings.epochs}
                    onChange={(e) => handleSettingChange('epochs', parseInt(e.target.value, 10))}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 1, max: 1000 }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Batch Size"
                    type="number"
                    value={settings.batchSize}
                    onChange={(e) => handleSettingChange('batchSize', parseInt(e.target.value, 10))}
                    fullWidth
                    margin="normal"
                    inputProps={{ min: 8, max: 256, step: 8 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Models to Train</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.models.includes('game')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSettingChange('models', [...settings.models, 'game']);
                          } else {
                            handleSettingChange('models', settings.models.filter(m => m !== 'game'));
                          }
                        }}
                      />
                    }
                    label="Game Prediction"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.models.includes('team')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSettingChange('models', [...settings.models, 'team']);
                          } else {
                            handleSettingChange('models', settings.models.filter(m => m !== 'team'));
                          }
                        }}
                      />
                    }
                    label="Team Rating"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.models.includes('player')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSettingChange('models', [...settings.models, 'player']);
                          } else {
                            handleSettingChange('models', settings.models.filter(m => m !== 'player'));
                          }
                        }}
                      />
                    }
                    label="Player Impact"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.models.includes('sos')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            handleSettingChange('models', [...settings.models, 'sos']);
                          } else {
                            handleSettingChange('models', settings.models.filter(m => m !== 'sos'));
                          }
                        }}
                      />
                    }
                    label="Strength of Schedule"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={registerJob}
                    disabled={loading}
                    fullWidth
                    sx={{ mt: 2 }}
                  >
                    Update Job Settings
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Available Models" 
              avatar={<MemoryIcon />}
              action={
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={loadModels}
                >
                  Refresh
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Model Type</InputLabel>
                <Select
                  value={selectedModel.split('_')[0] || ''}
                  onChange={handleModelChange}
                  label="Select Model Type"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="game_prediction">Game Prediction</MenuItem>
                  <MenuItem value="team_rating">Team Rating</MenuItem>
                  <MenuItem value="player_impact">Player Impact</MenuItem>
                  <MenuItem value="strength_of_schedule">Strength of Schedule</MenuItem>
                </Select>
              </FormControl>
              
              {selectedModel && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    {selectedModel.split('_')[0].replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} Models
                  </Typography>
                  
                  {Object.keys(models).length === 0 ? (
                    <Alert severity="info">No models available</Alert>
                  ) : (
                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Model ID</TableCell>
                            <TableCell>Created</TableCell>
                            <TableCell>History</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(models[selectedModel.split('_')[0] + '_prediction'] || 
                             models[selectedModel.split('_')[0] + '_rating'] || 
                             models[selectedModel.split('_')[0] + '_impact'] || 
                             models[selectedModel.split('_')[0]] || []
                           ).map((model) => (
                            <TableRow key={model.id}>
                              <TableCell>{model.id}</TableCell>
                              <TableCell>{new Date(model.created).toLocaleString()}</TableCell>
                              <TableCell>
                                {model.hasHistory ? (
                                  <Button 
                                    size="small" 
                                    onClick={() => loadModelHistory(model.id)}
                                  >
                                    View
                                  </Button>
                                ) : 'None'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                  
                  <Box sx={{ mt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => trainModel(selectedModel.split('_')[0])}
                      disabled={trainingModel !== null}
                      startIcon={trainingModel === selectedModel.split('_')[0] ? <CircularProgress size={20} /> : <PlayArrow />}
                    >
                      {trainingModel === selectedModel.split('_')[0] ? 'Training...' : 'Train New Model'}
                    </Button>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
          
          {renderModelHistory()}
        </Grid>
      </Grid>
    </Box>
  );
}