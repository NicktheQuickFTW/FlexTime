import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Button, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { FTLogo } from '../ui/FTLogo';

/**
 * CLEAN FLEXTIME DASHBOARD
 * 
 * Clean, modern, sharp, and edgy design focused on:
 * - Performance and functionality
 * - Monochrome with neon blue accents
 * - Orbitron ALL CAPS for titles
 * - Minimal but beautiful aesthetics
 */
export const CleanDashboard: React.FC = () => {
  const stats = [
    { label: 'ACTIVE SCHEDULES', value: '2,847', icon: '📊' },
    { label: 'TEAMS MANAGED', value: '16', icon: '🏆' },
    { label: 'SPORTS COVERED', value: '23', icon: '⚡' },
    { label: 'OPTIMIZATION RATE', value: '98.4%', icon: '🎯' },
  ];

  const recentSchedules = [
    { sport: 'Football', team1: 'Kansas', team2: 'Oklahoma State', date: 'Nov 15', venue: 'Memorial Stadium' },
    { sport: 'Basketball', team1: 'Baylor', team2: 'Texas Tech', date: 'Nov 18', venue: 'Ferrell Center' },
    { sport: 'Baseball', team1: 'TCU', team2: 'West Virginia', date: 'Mar 22', venue: 'Lupton Stadium' },
    { sport: 'Soccer', team1: 'Iowa State', team2: 'Cincinnati', date: 'Oct 28', venue: 'Cyclone Sports Complex' },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'var(--ft-font-body)',
    }}>
      {/* Header */}
      <Box sx={{
        borderBottom: '1px solid #1a1a1a',
        background: 'rgba(0,0,0,0.9)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        <Box sx={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FTLogo size="sm" variant="white" />
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#00bfff',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              FLEXTIME
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
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
              Settings
            </Button>
            <Box sx={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00bfff, #0088cc)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}>
              NK
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: '2rem' }}>
        {/* Page Title */}
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
            DASHBOARD
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
            Big 12 Conference Scheduling Overview
          </Typography>
        </Box>

        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card sx={{
                  background: '#111111',
                  border: '1px solid #222222',
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: '#00bfff',
                    background: '#151515',
                  },
                  transition: 'all 0.2s ease',
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography sx={{ fontSize: '1.5rem', mr: 1 }}>
                        {stat.icon}
                      </Typography>
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
                        {stat.label}
                      </Typography>
                    </Box>
                    <Typography 
                      className="ft-font-brand"
                      sx={{
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: '#00bfff',
                        lineHeight: 1,
                      }}
                    >
                      {stat.value}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Content Grid */}
        <Grid container spacing={4}>
          {/* Recent Schedules */}
          <Grid item xs={12} lg={8}>
            <Card sx={{
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: 2,
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
                  RECENT SCHEDULES
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentSchedules.map((schedule, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        background: '#0a0a0a',
                        border: '1px solid #1a1a1a',
                        borderRadius: 1,
                        '&:hover': {
                          borderColor: '#333333',
                          background: '#0f0f0f',
                        },
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Box sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#00bfff',
                          }} />
                          <Box>
                            <Typography 
                              className="ft-font-ui"
                              sx={{ 
                                fontWeight: 600, 
                                color: '#ffffff',
                                fontSize: '0.9rem',
                              }}
                            >
                              {schedule.team1} vs {schedule.team2}
                            </Typography>
                            <Typography 
                              sx={{ 
                                fontSize: '0.75rem', 
                                color: '#888888',
                                fontFamily: 'var(--ft-font-body)',
                              }}
                            >
                              {schedule.sport} • {schedule.venue}
                            </Typography>
                          </Box>
                        </Box>
                        <Typography 
                          className="ft-font-mono"
                          sx={{ 
                            fontSize: '0.8rem', 
                            color: '#00bfff',
                            fontWeight: 500,
                          }}
                        >
                          {schedule.date}
                        </Typography>
                      </Box>
                    </motion.div>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} lg={4}>
            <Card sx={{
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: 2,
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
                  QUICK ACTIONS
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { label: 'CREATE SCHEDULE', icon: '➕' },
                    { label: 'VIEW ANALYTICS', icon: '📊' },
                    { label: 'MANAGE TEAMS', icon: '👥' },
                    { label: 'EXPORT DATA', icon: '📤' },
                  ].map((action, index) => (
                    <Button
                      key={index}
                      fullWidth
                      variant="outlined"
                      sx={{
                        borderColor: '#333333',
                        color: '#ffffff',
                        fontFamily: 'var(--ft-font-ui)',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        letterSpacing: '0.1em',
                        py: 1.5,
                        justifyContent: 'flex-start',
                        '&:hover': {
                          borderColor: '#00bfff',
                          backgroundColor: 'rgba(0,191,255,0.1)',
                        },
                      }}
                      startIcon={<span>{action.icon}</span>}
                    >
                      {action.label}
                    </Button>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default CleanDashboard;