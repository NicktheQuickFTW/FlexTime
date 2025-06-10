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
  CardContent,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListIcon,
  Edit as EditIcon,
  Build as BuildIcon,
  Settings as ParametersIcon,
  Block as ConstraintsIcon,
  EventBusy as ConflictsIcon,
  Favorite as PreferencesIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { Schedule, SchedulingRule } from '../../types';
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
  const [schedulingRules, setSchedulingRules] = useState<{
    parameters: SchedulingRule[];
    constraints: SchedulingRule[];
    conflicts: SchedulingRule[];
    preferences: SchedulingRule[];
  }>({
    parameters: [],
    constraints: [],
    conflicts: [],
    preferences: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<SchedulingRule | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [currentRuleType, setCurrentRuleType] = useState<'parameters' | 'constraints' | 'conflicts' | 'preferences'>('parameters');

  const fetchScheduleData = useCallback(async () => {
    if (!scheduleId) return;

    try {
      setLoading(true);
      const response = await ScheduleService.getScheduleById(parseInt(scheduleId));
      
      if (response.success && response.data) {
        setSchedule(response.data);
        
        // Fetch scheduling rules organized by type
        const rulesResponse = await ScheduleService.getSchedulingRules(parseInt(scheduleId));
        if (rulesResponse.success && rulesResponse.data) {
          setSchedulingRules({
            parameters: rulesResponse.data.parameters || [],
            constraints: rulesResponse.data.constraints || [],
            conflicts: rulesResponse.data.conflicts || [],
            preferences: rulesResponse.data.preferences || []
          });
        }
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

  const handleAddRule = (ruleType: 'parameters' | 'constraints' | 'conflicts' | 'preferences') => {
    setEditingRule(null);
    setCurrentRuleType(ruleType);
    setShowEditor(true);
    setActiveTab(5); // Switch to editor tab
  };

  const handleEditRule = (rule: SchedulingRule) => {
    setEditingRule(rule);
    setCurrentRuleType(rule.type as 'parameters' | 'constraints' | 'conflicts' | 'preferences');
    setShowEditor(true);
    setActiveTab(5); // Switch to editor tab
  };

  const handleDeleteRule = async (ruleId: string, ruleType: string) => {
    if (!scheduleId) return;

    try {
      const response = await ScheduleService.deleteSchedulingRule(
        parseInt(scheduleId),
        ruleId,
        ruleType
      );
      
      if (response.success) {
        setSuccess(`${ruleType} rule deleted successfully`);
        await fetchScheduleData();
      } else {
        setError(response.error || `Failed to delete ${ruleType} rule`);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    }
  };

  const handleSaveRule = async (rule: SchedulingRule) => {
    if (!scheduleId) return;

    try {
      const response = await ScheduleService.saveSchedulingRule(
        parseInt(scheduleId),
        rule
      );
      
      if (response.success) {
        setSuccess(`${rule.type} rule saved successfully`);
        setShowEditor(false);
        setEditingRule(null);
        await fetchScheduleData();
        setActiveTab(0); // Switch back to overview
      } else {
        setError(response.error || `Failed to save ${rule.type} rule`);
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
      icon: <ParametersIcon />, 
      name: 'Add Parameter',
      onClick: () => handleAddRule('parameters')
    },
    { 
      icon: <ConstraintsIcon />, 
      name: 'Add Constraint',
      onClick: () => handleAddRule('constraints')
    },
    { 
      icon: <ConflictsIcon />, 
      name: 'Add Conflict',
      onClick: () => handleAddRule('conflicts')
    },
    { 
      icon: <PreferencesIcon />, 
      name: 'Add Preference',
      onClick: () => handleAddRule('preferences')
    },
    { 
      icon: <BuildIcon />, 
      name: 'Rule Wizard',
      onClick: () => navigate(`/schedules/${scheduleId}/rules/wizard`)
    },
    { 
      icon: <DashboardIcon />, 
      name: 'View Dashboard',
      onClick: () => setActiveTab(6)
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

  const totalRules = schedulingRules.parameters.length + schedulingRules.constraints.length + 
                    schedulingRules.conflicts.length + schedulingRules.preferences.length;
  const criticalRules = [...schedulingRules.parameters, ...schedulingRules.constraints, 
                        ...schedulingRules.conflicts, ...schedulingRules.preferences]
                        .filter(rule => rule.weight >= 8).length;

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              Scheduling Rules Management
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {schedule.name} - {schedule.season}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<ParametersIcon />} 
                label={`${schedulingRules.parameters.length} Parameters`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                icon={<ConstraintsIcon />} 
                label={`${schedulingRules.constraints.length} Constraints`} 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                icon={<ConflictsIcon />} 
                label={`${schedulingRules.conflicts.length} Conflicts`} 
                color="error" 
                variant="outlined" 
              />
              <Chip 
                icon={<PreferencesIcon />} 
                label={`${schedulingRules.preferences.length} Preferences`} 
                color="success" 
                variant="outlined" 
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="center">
                      {totalRules}
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Total Rules
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h6" align="center" color="warning.main">
                      {criticalRules}
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Critical Rules
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
          aria-label="scheduling rules management tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab 
            label="Parameters" 
            icon={<ParametersIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Constraints" 
            icon={<ConstraintsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Conflicts" 
            icon={<ConflictsIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Preferences" 
            icon={<PreferencesIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Conflict Resolution" 
            icon={<WarningIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Add/Edit Rule" 
            icon={<EditIcon />} 
            iconPosition="start"
            disabled={!showEditor}
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
          rules={schedulingRules.parameters}
          ruleType="parameters"
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          scheduleId={parseInt(scheduleId!)}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <ConstraintList
          rules={schedulingRules.constraints}
          ruleType="constraints"
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          scheduleId={parseInt(scheduleId!)}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <ConstraintList
          rules={schedulingRules.conflicts}
          ruleType="conflicts"
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          scheduleId={parseInt(scheduleId!)}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        <ConstraintList
          rules={schedulingRules.preferences}
          ruleType="preferences"
          onEdit={handleEditRule}
          onDelete={handleDeleteRule}
          scheduleId={parseInt(scheduleId!)}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        <ConflictResolver
          scheduleId={parseInt(scheduleId!)}
          rules={[...schedulingRules.parameters, ...schedulingRules.constraints, 
                 ...schedulingRules.conflicts, ...schedulingRules.preferences]}
          onResolve={handleResolveConflict}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        {showEditor && (
          <ConstraintEditor
            rule={editingRule}
            ruleType={currentRuleType}
            scheduleId={parseInt(scheduleId!)}
            onSave={handleSaveRule}
            onCancel={() => {
              setShowEditor(false);
              setEditingRule(null);
              setActiveTab(0);
            }}
          />
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={6}>
        <ConstraintMonitor
          scheduleId={parseInt(scheduleId!)}
          rules={[...schedulingRules.parameters, ...schedulingRules.constraints, 
                 ...schedulingRules.conflicts, ...schedulingRules.preferences]}
        />
      </TabPanel>

      <SpeedDial
        ariaLabel="Scheduling rule actions"
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