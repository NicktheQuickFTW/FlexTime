import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Backdrop,
  Snackbar,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Grid,
  Card,
  CardContent
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Edit as EditIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Schedule, Constraint } from '../../types';
import { ScheduleService } from '../../services/api';
import ConstraintList from './ConstraintList';
import ConstraintEditor from './ConstraintEditor';
import ConflictResolver from './ConflictResolver';
import ConstraintMonitor from './ConstraintMonitor';

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
      id={`constraint-tabpanel-${index}`}
      aria-labelledby={`constraint-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ConstraintManager: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [constraints, setConstraints] = useState<Constraint[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<Constraint | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const fetchScheduleData = useCallback(async () => {
    if (!scheduleId) return;

    try {
      setLoading(true);
      const response = await ScheduleService.getScheduleById(parseInt(scheduleId));
      
      if (response.success && response.data) {
        setSchedule(response.data);
        setConstraints(response.data.constraints || []);
      } else {
        setError(response.error || 'Failed to load schedule data');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddConstraint = () => {
    setEditingConstraint(null);
    setShowEditor(true);
    setActiveTab(1); // Switch to editor tab
  };

  const handleEditConstraint = (constraint: Constraint) => {
    setEditingConstraint(constraint);
    setShowEditor(true);
    setActiveTab(1); // Switch to editor tab
  };

  const handleDeleteConstraint = async (constraintId: number) => {
    if (!scheduleId) return;

    try {
      const response = await ScheduleService.deleteConstraint(
        parseInt(scheduleId),
        constraintId
      );
      
      if (response.success) {
        setSuccess('Constraint deleted successfully');
        await fetchScheduleData();
      } else {
        setError(response.error || 'Failed to delete constraint');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  const handleSaveConstraint = async (constraint: Constraint) => {
    if (!scheduleId) return;

    try {
      const response = await ScheduleService.addConstraint(
        parseInt(scheduleId),
        constraint
      );
      
      if (response.success) {
        setSuccess('Constraint saved successfully');
        setShowEditor(false);
        setEditingConstraint(null);
        await fetchScheduleData();
        setActiveTab(0); // Switch back to list
      } else {
        setError(response.error || 'Failed to save constraint');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  const handleResolveConflict = async (resolution: any) => {
    // Implement conflict resolution logic
    setSuccess('Conflict resolved successfully');
  };

  const speedDialActions = [
    { 
      icon: <AddIcon />, 
      name: 'Add Constraint',
      onClick: handleAddConstraint
    },
    { 
      icon: <BuildIcon />, 
      name: 'Constraint Wizard',
      onClick: () => navigate(`/schedules/${scheduleId}/constraints/wizard`)
    },
    { 
      icon: <DashboardIcon />, 
      name: 'View Dashboard',
      onClick: () => setActiveTab(3)
    },
  ];

  if (loading) {
    return (
      <Backdrop open={loading} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  if (!schedule) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Schedule not found</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Constraint Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {schedule.name} - {schedule.season}
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="center">
                      {constraints.length}
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Total Constraints
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="center" color="warning.main">
                      {constraints.filter(c => c.priority >= 8).length}
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      High Priority
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="constraint management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Constraints List" 
            icon={<ListIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Add/Edit Constraint" 
            icon={<EditIcon />} 
            iconPosition="start"
            disabled={!showEditor}
          />
          <Tab 
            label="Conflict Resolution" 
            icon={<WarningIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Monitor Dashboard" 
            icon={<DashboardIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <ConstraintList
          constraints={constraints}
          onEdit={handleEditConstraint}
          onDelete={handleDeleteConstraint}
          scheduleId={parseInt(scheduleId!)}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {showEditor && (
          <ConstraintEditor
            constraint={editingConstraint}
            scheduleId={parseInt(scheduleId!)}
            onSave={handleSaveConstraint}
            onCancel={() => {
              setShowEditor(false);
              setEditingConstraint(null);
              setActiveTab(0);
            }}
          />
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ConflictResolver
          scheduleId={parseInt(scheduleId!)}
          constraints={constraints}
          onResolve={handleResolveConflict}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ConstraintMonitor
          scheduleId={parseInt(scheduleId!)}
          constraints={constraints}
        />
      </TabPanel>

      <SpeedDial
        ariaLabel="Constraint actions"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        icon={<SpeedDialIcon />}
        onClose={() => setSpeedDialOpen(false)}
        onOpen={() => setSpeedDialOpen(true)}
        open={speedDialOpen}
      >
        {speedDialActions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            onClick={() => {
              setSpeedDialOpen(false);
              action.onClick();
            }}
          />
        ))}
      </SpeedDial>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ConstraintManager;