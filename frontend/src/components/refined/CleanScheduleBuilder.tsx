import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, Chip, Divider } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface ScheduleItem {
  id: string;
  sport: string;
  team1: string;
  team2: string;
  date: string;
  time: string;
  venue: string;
  status: 'scheduled' | 'confirmed' | 'pending';
}

/**
 * CLEAN SCHEDULE BUILDER
 * 
 * Modern, functional schedule builder with:
 * - Clean monochrome design with neon blue accents
 * - Orbitron titles in ALL CAPS
 * - Performance-focused interactions
 * - Minimal but beautiful aesthetics
 */
export const CleanScheduleBuilder: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [schedules] = useState<ScheduleItem[]>([
    {
      id: '1',
      sport: 'Football',
      team1: 'Kansas',
      team2: 'Oklahoma State',
      date: '2024-11-15',
      time: '7:00 PM',
      venue: 'Memorial Stadium',
      status: 'confirmed',
    },
    {
      id: '2',
      sport: 'Basketball',
      team1: 'Baylor',
      team2: 'Texas Tech',
      date: '2024-11-18',
      time: '8:00 PM',
      venue: 'Ferrell Center',
      status: 'scheduled',
    },
    {
      id: '3',
      sport: 'Baseball',
      team1: 'TCU',
      team2: 'West Virginia',
      date: '2025-03-22',
      time: '2:00 PM',
      venue: 'Lupton Stadium',
      status: 'pending',
    },
    {
      id: '4',
      sport: 'Soccer',
      team1: 'Iowa State',
      team2: 'Cincinnati',
      date: '2024-10-28',
      time: '6:00 PM',
      venue: 'Cyclone Sports Complex',
      status: 'confirmed',
    },
  ]);

  const sports = ['all', 'Football', 'Basketball', 'Baseball', 'Soccer', 'Volleyball', 'Tennis'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#00bfff';
      case 'scheduled': return '#ffaa00';
      case 'pending': return '#888888';
      default: return '#888888';
    }
  };

  const filteredSchedules = selectedSport === 'all' 
    ? schedules 
    : schedules.filter(s => s.sport === selectedSport);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'var(--ft-font-body)',
      padding: 3,
    }}>
      <Box sx={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h1"
            className="ft-font-brand"
            sx={{
              fontSize: '3rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1,
            }}
          >
            SCHEDULE BUILDER
          </Typography>
          <Typography 
            variant="subtitle1"
            className="ft-font-ui"
            sx={{
              color: '#888888',
              fontSize: '1rem',
              fontWeight: 400,
              letterSpacing: '0.05em',
            }}
          >
            Create and manage Big 12 Conference schedules
          </Typography>
        </Box>

        {/* Sports Filter */}
        <Card sx={{
          background: '#111111',
          border: '1px solid #222222',
          borderRadius: 2,
          mb: 4,
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 3,
              }}
            >
              FILTER BY SPORT
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {sports.map((sport) => (
                <Chip
                  key={sport}
                  label={sport.toUpperCase()}
                  onClick={() => setSelectedSport(sport)}
                  sx={{
                    backgroundColor: selectedSport === sport ? '#00bfff' : '#333333',
                    color: selectedSport === sport ? '#000000' : '#ffffff',
                    fontFamily: 'var(--ft-font-ui)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    border: '1px solid',
                    borderColor: selectedSport === sport ? '#00bfff' : '#444444',
                    '&:hover': {
                      backgroundColor: selectedSport === sport ? '#0099cc' : '#444444',
                    },
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Action Bar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 4,
        }}>
          <Typography 
            className="ft-font-brand"
            sx={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            SCHEDULES ({filteredSchedules.length})
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              sx={{
                borderColor: '#333333',
                color: '#ffffff',
                fontFamily: 'var(--ft-font-ui)',
                fontWeight: 500,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                '&:hover': {
                  borderColor: '#00bfff',
                  backgroundColor: 'rgba(0,191,255,0.1)',
                },
              }}
            >
              EXPORT
            </Button>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#00bfff',
                color: '#000000',
                fontFamily: 'var(--ft-font-ui)',
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                '&:hover': {
                  backgroundColor: '#0099cc',
                },
              }}
            >
              CREATE NEW
            </Button>
          </Box>
        </Box>

        {/* Schedule Grid */}
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredSchedules.map((schedule, index) => (
              <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card sx={{
                    background: '#111111',
                    border: '1px solid #222222',
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: '#333333',
                      background: '#151515',
                    },
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    height: '100%',
                  }}>
                    <CardContent sx={{ p: 3 }}>
                      {/* Header */}
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        mb: 2,
                      }}>
                        <Typography 
                          className="ft-font-ui"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#888888',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontWeight: 500,
                          }}
                        >
                          {schedule.sport}
                        </Typography>
                        <Box sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: getStatusColor(schedule.status),
                        }} />
                      </Box>

                      {/* Teams */}
                      <Typography 
                        className="ft-font-brand"
                        sx={{
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          mb: 2,
                          lineHeight: 1.2,
                        }}
                      >
                        {schedule.team1}
                        <span style={{ color: '#888888', margin: '0 0.5rem' }}>VS</span>
                        {schedule.team2}
                      </Typography>

                      <Divider sx={{ borderColor: '#222222', mb: 2 }} />

                      {/* Details */}
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.9rem' }}>📅</Typography>
                          <Typography 
                            className="ft-font-mono"
                            sx={{ fontSize: '0.8rem', color: '#888888' }}
                          >
                            {new Date(schedule.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.9rem' }}>⏰</Typography>
                          <Typography 
                            className="ft-font-mono"
                            sx={{ fontSize: '0.8rem', color: '#888888' }}
                          >
                            {schedule.time}
                          </Typography>
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontSize: '0.9rem' }}>📍</Typography>
                          <Typography 
                            className="ft-font-body"
                            sx={{ fontSize: '0.8rem', color: '#888888' }}
                          >
                            {schedule.venue}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status */}
                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label={schedule.status.toUpperCase()}
                          size="small"
                          sx={{
                            backgroundColor: 'transparent',
                            color: getStatusColor(schedule.status),
                            border: '1px solid',
                            borderColor: getStatusColor(schedule.status),
                            fontFamily: 'var(--ft-font-ui)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            letterSpacing: '0.05em',
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      </Box>
    </Box>
  );
};

export default CleanScheduleBuilder;