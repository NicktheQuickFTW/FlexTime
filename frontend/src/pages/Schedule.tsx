import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  Tabs,
  Tab,
  Alert,
  Snackbar
} from '@mui/material';
import InteractiveMatrix from '../components/schedule/InteractiveMatrix';
import { initializeInteractiveMatrix } from '../utils/matrixLoader';

// Import only the type we need
import type { ScheduleData } from '../components/schedule/InteractiveMatrix';

// Sample data for demonstration
const sampleScheduleData: ScheduleData = {
  teams: [
    { id: 'team1', name: 'University of Texas', abbreviation: 'TEX', primaryColor: '#BF5700' },
    { id: 'team2', name: 'Texas Christian University', abbreviation: 'TCU', primaryColor: '#4D1979' },
    { id: 'team3', name: 'University of Oklahoma', abbreviation: 'OU', primaryColor: '#841617' },
    { id: 'team4', name: 'Kansas State University', abbreviation: 'KSU', primaryColor: '#512888' },
    { id: 'team5', name: 'Baylor University', abbreviation: 'BU', primaryColor: '#003015' },
    { id: 'team6', name: 'Iowa State University', abbreviation: 'ISU', primaryColor: '#C8102E' },
    { id: 'team7', name: 'University of Kansas', abbreviation: 'KU', primaryColor: '#0051BA' },
    { id: 'team8', name: 'Oklahoma State University', abbreviation: 'OSU', primaryColor: '#FFC107' },
    { id: 'team9', name: 'Texas Tech University', abbreviation: 'TTU', primaryColor: '#E60000' },
    { id: 'team10', name: 'University of West Virginia', abbreviation: 'WVU', primaryColor: '#1F4E79' },
    { id: 'team11', name: 'University of Texas at Austin', abbreviation: 'UTA', primaryColor: '#BF5700' },
    { id: 'team12', name: 'University of Colorado Boulder', abbreviation: 'CU', primaryColor: '#97233F' },
    { id: 'team13', name: 'University of Missouri', abbreviation: 'MIZ', primaryColor: '#E8000D' },
    { id: 'team14', name: 'University of Nebraska', abbreviation: 'NEB', primaryColor: '#E4002B' },
    { id: 'team15', name: 'University of Cincinnati', abbreviation: 'CIN', primaryColor: '#C6011F' },
    { id: 'team16', name: 'University of Central Florida', abbreviation: 'UCF', primaryColor: '#0B2540' },
  ],
  games: [
    { id: 'game1', date: '2025-09-05', homeTeam: 'team1', awayTeam: 'team2' },
    { id: 'game2', date: '2025-09-12', homeTeam: 'team3', awayTeam: 'team4' },
    { id: 'game3', date: '2025-09-19', homeTeam: 'team5', awayTeam: 'team6' },
    { id: 'game4', date: '2025-09-26', homeTeam: 'team7', awayTeam: 'team8' },
    { id: 'game5', date: '2025-10-03', homeTeam: 'team9', awayTeam: 'team10' },
    { id: 'game6', date: '2025-10-10', homeTeam: 'team11', awayTeam: 'team12' },
    { id: 'game7', date: '2025-10-17', homeTeam: 'team13', awayTeam: 'team14' },
    { id: 'game8', date: '2025-10-24', homeTeam: 'team15', awayTeam: 'team16' },
  ],
  season: '2025',
  sport: 'Football'
};

const Schedule: React.FC = () => {
  const [value, setValue] = useState(0);
  const [scheduleData, setScheduleData] = useState<ScheduleData>(sampleScheduleData);
  const [loading, setLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Load the interactive matrix script
  useEffect(() => {
    const loadScript = async () => {
      try {
        await initializeInteractiveMatrix();
        setScriptLoaded(true);
      } catch (error) {
        console.error('Failed to load interactive matrix script:', error);
        setNotification({
          open: true,
          message: 'Failed to load interactive schedule component',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    loadScript();
  }, []);

  // Handle tab change
  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Handle save
  const handleSave = (data: ScheduleData) => {
    // In a real app, this would send the data to the backend
    console.log('Saving schedule data:', data);
    setScheduleData(data);
    setNotification({
      open: true,
      message: 'Schedule saved successfully',
      severity: 'success'
    });
  };

  // Handle data change
  const handleDataChange = (data: ScheduleData) => {
    setScheduleData(data);
  };

  // Handle notification close
  const handleNotificationClose = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #0066cc, #00c2ff)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          display: 'inline-block'
        }}
      >
        Schedule Management
      </Typography>

      <Card 
        sx={{ 
          borderRadius: 3, 
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={value} 
            onChange={handleChange}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: '#00c2ff',
                height: 3
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                color: 'text.secondary',
                '&.Mui-selected': {
                  color: '#0066cc'
                }
              }
            }}
          >
            <Tab label="Matrix View" />
            <Tab label="Calendar View" />
            <Tab label="List View" />
          </Tabs>
        </Box>
        <CardContent sx={{ p: 3, minHeight: 'calc(100vh - 250px)' }}>
          {value === 0 && (
            <InteractiveMatrix 
              scheduleData={scheduleData}
              onSave={handleSave}
              onDataChange={handleDataChange}
              loading={loading || !scriptLoaded}
            />
          )}
          {value === 1 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                Calendar View Coming Soon
              </Typography>
            </Box>
          )}
          {value === 2 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                List View Coming Soon
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity}
          sx={{ 
            borderRadius: 2,
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            fontWeight: 500
          }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Schedule;
