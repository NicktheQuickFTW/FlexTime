import React, { useEffect, useRef, useState } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  CircularProgress,
  useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import '../../assets/css/interactive-matrix.css';

// Import the original JS implementation
// We'll wrap it in a React component
export interface Team {
  id: string;
  name: string;
  abbreviation?: string;
  primaryColor?: string;
  nickname?: string;
}

export interface Game {
  id: string;
  date: string;
  homeTeam: string;
  awayTeam: string;
  location?: string;
  time?: string;
  status?: string;
}

export interface ScheduleData {
  teams: Team[];
  games: Game[];
  season?: string;
  sport?: string;
}

interface InteractiveMatrixProps {
  scheduleData: ScheduleData;
  onSave?: (data: ScheduleData) => void;
  onDataChange?: (data: ScheduleData) => void;
  loading?: boolean;
}

const InteractiveMatrix: React.FC<InteractiveMatrixProps> = ({ 
  scheduleData, 
  onSave, 
  onDataChange,
  loading = false
}) => {
  const theme = useTheme();
  const matrixRef = useRef<HTMLDivElement>(null);
  const plannerRef = useRef<HTMLDivElement>(null);
  const [localData, setLocalData] = useState<ScheduleData>(scheduleData);
  
  // Initialize the matrix when component mounts or data changes
  useEffect(() => {
    if (!matrixRef.current || !plannerRef.current || loading) return;
    
    // We need to dynamically import the InteractiveMatrix module
    // since it's a vanilla JS module
    const initMatrix = async () => {
      try {
        // In a real implementation, we'd import the module properly
        // For now, we'll assume it's available on the window object
        const InteractiveMatrixJS = (window as any).InteractiveMatrix;
        
        if (!InteractiveMatrixJS) {
          console.error('InteractiveMatrix JS module not found');
          return;
        }
        
        // Initialize the matrix with our data
        InteractiveMatrixJS.init(
          matrixRef.current,
          plannerRef.current,
          localData,
          {
            colors: {
              homeGame: theme.palette.success.light,
              awayGame: theme.palette.info.light,
              dragOver: theme.palette.primary.light,
              selected: theme.palette.warning.light,
              plannerBg: theme.palette.background.default,
              plannerItem: theme.palette.background.paper,
              plannerDragOver: theme.palette.primary.light
            }
          }
        );
        
        // Set up change handler
        InteractiveMatrixJS.onChange((updatedData: ScheduleData) => {
          setLocalData(updatedData);
          if (onDataChange) {
            onDataChange(updatedData);
          }
        });
      } catch (error) {
        console.error('Error initializing interactive matrix:', error);
      }
    };
    
    initMatrix();
    
    // Cleanup function
    return () => {
      // Any cleanup needed for the matrix
    };
  }, [scheduleData, loading, theme, localData, onDataChange]);
  
  // Handle save button click
  const handleSave = () => {
    if (onSave) {
      onSave(localData);
    }
  };
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2 
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Interactive Schedule Matrix
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: '30px',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              color: 'text.primary',
              fontWeight: 500,
              textTransform: 'none',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: 'rgba(0, 102, 204, 0.08)'
              }
            }}
          >
            Add Date
          </Button>
          <Button 
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            sx={{
              background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
              borderRadius: '30px',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 8px 25px rgba(0, 102, 204, 0.4), 0 0 15px rgba(0, 198, 255, 0.5)',
              }
            }}
          >
            Save Schedule
          </Button>
        </Box>
      </Box>
      
      {loading ? (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' 
        }}>
          <CircularProgress sx={{ color: theme.palette.primary.main }} />
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexGrow: 1,
          gap: 2,
          height: 'calc(100vh - 200px)',
          overflow: 'hidden'
        }}>
          <Paper 
            sx={{ 
              flexGrow: 1,
              p: 2,
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
              overflow: 'auto'
            }}
          >
            <div ref={matrixRef} className="ft-matrix-container" />
          </Paper>
          
          <Paper 
            sx={{ 
              width: '300px',
              p: 2,
              borderRadius: 3,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
              overflow: 'auto'
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Available Matchups
            </Typography>
            <div ref={plannerRef} className="ft-planner-container" />
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default InteractiveMatrix;
