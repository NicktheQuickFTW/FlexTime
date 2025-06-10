import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Chip, 
  Button, 
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AutoFixHigh as AutoFixHighIcon,
  Check as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import GlassmorphicCard from '../common/GlassmorphicCard';
import GradientText from '../common/GradientText';
import AIService, { ScheduleConflict, ResolutionOption } from '../../services/aiService';
import useReducedMotion from '../../hooks/useReducedMotion';

interface AIScheduleOptimizerProps {
  scheduleId: number;
  onApplyResolution?: (scheduleId: number, conflictId: string, resolutionId: string) => void;
}

// Individual conflict card component
const ConflictCard: React.FC<{
  conflict: ScheduleConflict;
  suggestions: ResolutionOption[];
  onApplySuggestion: (conflictId: string, suggestion: ResolutionOption) => void;
  onDismiss: (conflictId: string) => void;
}> = ({ 
  conflict, 
  suggestions, 
  onApplySuggestion,
  onDismiss
}) => {
  const theme = useTheme();
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'venue':
        return <InfoIcon fontSize="small" />;
      case 'team':
        return <WarningIcon fontSize="small" />;
      case 'official':
        return <InfoIcon fontSize="small" />;
      case 'time':
        return <WarningIcon fontSize="small" />;
      case 'resource':
        return <InfoIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };
  
  return (
    <GlassmorphicCard sx={{ mb: 2, position: 'relative' }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Chip
              icon={getTypeIcon(conflict.type)}
              label={conflict.type}
              size="small"
              sx={{
                backgroundColor: getSeverityColor(conflict.severity),
                color: theme.palette.getContrastText(getSeverityColor(conflict.severity)),
              }}
            />
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              Severity: {conflict.severity}
            </Typography>
          </Box>
          
          <IconButton 
            size="small" 
            onClick={() => onDismiss(conflict.id)}
            sx={{ 
              color: theme.palette.text.secondary,
              '&:hover': { color: theme.palette.text.primary }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          {conflict.description}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
            Affected Items:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {conflict.affectedItems.map((item, index) => (
              <Chip
                key={index}
                label={item}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        </Box>
        
        <Box>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
            AI Recommendations:
          </Typography>
          {suggestions.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {suggestions.map((suggestion) => (
                <Box 
                  key={suggestion.id}
                  sx={{ 
                    p: 1.5, 
                    borderRadius: 1, 
                    border: `1px solid ${theme.palette.divider}`,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.03)' 
                      : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Confidence: {suggestion.confidence}%
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckIcon />}
                      onClick={() => onApplySuggestion(conflict.id, suggestion)}
                      sx={{ 
                        borderRadius: '20px',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
                        px: 2,
                        '&:hover': {
                          background: 'linear-gradient(135deg, #005bb7, #00b3eb)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
                        }
                      }}
                    >
                      Apply
                    </Button>
                  </Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {suggestion.description}
                  </Typography>
                  
                  {suggestion.changes.length > 0 && (
                    <Box sx={{ 
                      mt: 1, 
                      p: 1, 
                      borderRadius: 1, 
                      background: theme.palette.mode === 'dark' 
                        ? 'rgba(0, 0, 0, 0.2)' 
                        : 'rgba(0, 0, 0, 0.05)',
                      fontSize: '0.75rem'
                    }}>
                      {suggestion.changes.map((change, index) => (
                        <Box key={index} sx={{ mb: index < suggestion.changes.length - 1 ? 0.5 : 0 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500 }}>
                            {change.field}:
                          </Typography>{' '}
                          <Typography 
                            component="span" 
                            variant="caption" 
                            sx={{ 
                              textDecoration: 'line-through', 
                              color: theme.palette.error.main,
                              mr: 0.5
                            }}
                          >
                            {change.oldValue}
                          </Typography>
                          <Typography 
                            component="span" 
                            variant="caption" 
                            sx={{ color: theme.palette.success.main }}
                          >
                            {change.newValue}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
              Generating suggestions...
            </Typography>
          )}
        </Box>
      </Box>
    </GlassmorphicCard>
  );
};

// Main AI Schedule Optimizer component
const AIScheduleOptimizer: React.FC<AIScheduleOptimizerProps> = ({ 
  scheduleId,
  onApplyResolution 
}) => {
  const [conflicts, setConflicts] = useState<ScheduleConflict[]>([]);
  const [suggestions, setSuggestions] = useState<Record<string, ResolutionOption[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  
  const fetchConflicts = useCallback(async () => {
    if (!scheduleId) return;
    
    setLoading(true);
    try {
      // Call the intelligence engine API through our service
      const conflictsData = await AIService.detectConflicts(scheduleId);
      setConflicts(conflictsData);
      
      // Fetch resolution options for each conflict
      const suggestionsData: Record<string, ResolutionOption[]> = {};
      
      await Promise.all(
        conflictsData.map(async (conflict) => {
          try {
            const resolutions = await AIService.getResolutionOptions(scheduleId, conflict.id);
            suggestionsData[conflict.id] = resolutions;
          } catch (error) {
            console.error(`Error fetching resolutions for conflict ${conflict.id}:`, error);
            suggestionsData[conflict.id] = [];
          }
        })
      );
      
      setSuggestions(suggestionsData);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);
  
  // Fetch conflicts when the component mounts or scheduleId changes
  useEffect(() => {
    fetchConflicts();
  }, [fetchConflicts]);
  
  const handleApplySuggestion = async (conflictId: string, suggestion: ResolutionOption) => {
    if (!scheduleId) return;
    
    try {
      // Apply the resolution through the intelligence engine
      await AIService.applyResolution(scheduleId, conflictId, suggestion.id);
      
      // Call the callback if provided
      if (onApplyResolution) {
        onApplyResolution(scheduleId, conflictId, suggestion.id);
      }
      
      // Remove the resolved conflict from the list
      setConflicts(conflicts.filter(c => c.id !== conflictId));
    } catch (error) {
      console.error('Error applying resolution:', error);
    }
  };
  
  const handleDismissConflict = (conflictId: string) => {
    setConflicts(conflicts.filter(c => c.id !== conflictId));
  };
  
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  const handleRefresh = () => {
    fetchConflicts();
  };
  
  // If there are no conflicts and we're not loading, don't render anything
  if (conflicts.length === 0 && !loading) {
    return null;
  }
  
  return (
    <Box sx={{
      position: 'fixed',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      width: expanded ? 400 : 60,
      maxHeight: '80vh',
      background: theme.palette.mode === 'dark' 
        ? 'rgba(17, 25, 40, 0.95)'
        : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(30px)',
      borderRadius: '24px 0 0 24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
      transition: prefersReducedMotion 
        ? 'none' 
        : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <Box 
        sx={{ 
          p: expanded ? 3 : 2, 
          display: 'flex', 
          alignItems: 'center',
          cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${theme.palette.divider}` : 'none',
        }}
        onClick={toggleExpanded}
      >
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          width: expanded ? 'auto' : 40,
          justifyContent: expanded ? 'flex-start' : 'center',
        }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
            boxShadow: '0 4px 12px rgba(0, 102, 204, 0.3)',
          }}>
            <AutoFixHighIcon sx={{ color: 'white' }} />
          </Box>
          
          {expanded && (
            <GradientText variant="h6" sx={{ fontWeight: 600 }}>
              AI Schedule Optimizer
            </GradientText>
          )}
        </Box>
        
        {expanded && (
          <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleRefresh();
                }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Chip 
              label={`${conflicts.length} Issues`} 
              size="small"
              color="error"
              sx={{ fontWeight: 500 }}
            />
          </Box>
        )}
      </Box>
      
      {expanded && (
        <Box sx={{ p: 2, overflowY: 'auto', flexGrow: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress size={40} />
            </Box>
          ) : (
            conflicts.map((conflict) => (
              <ConflictCard
                key={conflict.id}
                conflict={conflict}
                suggestions={suggestions[conflict.id] || []}
                onApplySuggestion={handleApplySuggestion}
                onDismiss={handleDismissConflict}
              />
            ))
          )}
        </Box>
      )}
    </Box>
  );
};

export default AIScheduleOptimizer;
