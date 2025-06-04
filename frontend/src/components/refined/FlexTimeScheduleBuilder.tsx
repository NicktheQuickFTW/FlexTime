import React, { useState } from 'react';
import { Box, Typography, Button, Card, Select, MenuItem, FormControl, Chip, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { FTLogo } from '../ui/FTLogo';

interface Team {
  id: string;
  name: string;
  code: string;
  color: string;
}

/**
 * FLEXTIME SCHEDULE BUILDER
 * 
 * Inspired by the original FlexTime builder but refined:
 * - Light theme with progressive blur effects
 * - Clean sidebar with team management
 * - Matrix view for schedule visualization
 * - Professional sports scheduling interface
 */
export const FlexTimeScheduleBuilder: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState('Football');
  const [viewMode, setViewMode] = useState('MATRIX');

  const teams: Team[] = [
    { id: 'ariz', name: 'Arizona', code: 'ARIZ', color: '#CC0033' },
    { id: 'asu', name: 'Arizona State', code: 'ASU', color: '#8C1D40' },
    { id: 'bay', name: 'Baylor', code: 'BAY', color: '#003015' },
    { id: 'byu', name: 'BYU', code: 'BYU', color: '#002E5D' },
    { id: 'cin', name: 'Cincinnati', code: 'CIN', color: '#E00122' },
    { id: 'col', name: 'Colorado', code: 'COL', color: '#CFB87C' },
    { id: 'hou', name: 'Houston', code: 'HOU', color: '#C8102E' },
    { id: 'isu', name: 'Iowa State', code: 'ISU', color: '#C8102E' },
    { id: 'ku', name: 'Kansas', code: 'KU', color: '#0051BA' },
    { id: 'ksu', name: 'Kansas State', code: 'KSU', color: '#512888' },
    { id: 'okst', name: 'Oklahoma State', code: 'OKST', color: '#FF7300' },
    { id: 'tcu', name: 'TCU', code: 'TCU', color: '#4D1979' },
    { id: 'ttu', name: 'Texas Tech', code: 'TTU', color: '#CC0000' },
    { id: 'ucf', name: 'UCF', code: 'UCF', color: '#000000' },
    { id: 'utah', name: 'Utah', code: 'UTAH', color: '#CC0000' },
    { id: 'wvu', name: 'West Virginia', code: 'WVU', color: '#002855' },
  ];

  const statusModules = [
    { name: 'AI Scheduler', status: 'READY', icon: '⚙️' },
    { name: 'Optimizer', status: 'READY', icon: '📐' },
    { name: 'COMPASS Analyzer', status: 'READY', icon: '🧭' },
    { name: 'ML Predictor', status: 'READY', icon: '⚙️' },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      fontFamily: 'var(--ft-font-body)',
    }}>
      {/* Header */}
      <Box sx={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}>
        <Box sx={{
          maxWidth: '100%',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo & Brand */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FTLogo size="sm" variant="dark" />
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#1e293b',
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              FLEXTIME
            </Typography>
          </Box>

          {/* Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {['FT BUILDER', 'AI/ML AGENTS', 'ANALYTICS', 'TEAMS', 'SETTINGS'].map((item, index) => (
              <Button
                key={item}
                variant={index === 0 ? "contained" : "text"}
                sx={{
                  backgroundColor: index === 0 ? '#0ea5e9' : 'transparent',
                  color: index === 0 ? '#ffffff' : '#64748b',
                  fontFamily: 'var(--ft-font-ui)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  '&:hover': {
                    backgroundColor: index === 0 ? '#0284c7' : 'rgba(0,0,0,0.05)',
                  },
                }}
              >
                {item}
              </Button>
            ))}
            
            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
              <Button variant="outlined" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Sign In
              </Button>
              <Button variant="contained" sx={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
                Sign Up
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <Box sx={{
          width: 380,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0,0,0,0.08)',
          padding: 3,
          overflowY: 'auto',
        }}>
          {/* Brand Section */}
          <Box sx={{ mb: 4 }}>
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1,
              }}
            >
              FLEXTIME
            </Typography>
            <Typography 
              className="ft-font-ui"
              sx={{
                fontSize: '1rem',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              SCHEDULE BUILDER
            </Typography>
            <Box sx={{
              background: '#0ea5e9',
              color: '#ffffff',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              display: 'inline-block',
              mt: 1,
            }}>
              <Typography 
                className="ft-font-ui"
                sx={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}
              >
                BIG 12 CONFERENCE
              </Typography>
            </Box>
          </Box>

          {/* Sport Selection */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              className="ft-font-ui"
              sx={{
                fontSize: '0.75rem',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                mb: 1,
              }}
            >
              SPORT
            </Typography>
            <FormControl fullWidth>
              <Select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                sx={{
                  background: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0,0,0,0.1)',
                  },
                }}
              >
                <MenuItem value="Football">Football</MenuItem>
                <MenuItem value="Basketball">Basketball</MenuItem>
                <MenuItem value="Baseball">Baseball</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Status Modules */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {statusModules.map((module, index) => (
                <Card key={index} sx={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: 2,
                  p: 2,
                  textAlign: 'center',
                }}>
                  <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>{module.icon}</Typography>
                  <Typography 
                    className="ft-font-ui"
                    sx={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      color: '#1e293b',
                      mb: 0.5,
                    }}
                  >
                    {module.name}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '0.7rem', 
                      color: '#16a34a',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                    }}
                  >
                    {module.status}
                  </Typography>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Generate Controls */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              sx={{ 
                fontSize: '0.7rem', 
                color: '#64748b',
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              0 Online
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: '#1e293b',
                  color: '#ffffff',
                  fontFamily: 'var(--ft-font-ui)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  borderRadius: 2,
                }}
                startIcon={<span>⚡</span>}
              >
                AI Generate
              </Button>
              <Button
                variant="outlined"
                sx={{
                  borderColor: '#1e293b',
                  color: '#1e293b',
                  fontFamily: 'var(--ft-font-ui)',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  borderRadius: 2,
                }}
              >
                Optimize
              </Button>
            </Box>
          </Box>

          {/* Schedule Tools */}
          <Box sx={{ mb: 3 }}>
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#1e293b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 2,
              }}
            >
              ⚙️ SCHEDULE TOOLS
            </Typography>
          </Box>

          {/* Football Teams */}
          <Box>
            <Typography 
              sx={{
                fontSize: '0.75rem',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              🏈 FOOTBALL TEAMS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {teams.slice(0, 6).map((team) => (
                <Box key={team.id} sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.5,
                  background: 'rgba(255, 255, 255, 0.6)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: 1,
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.8)',
                  },
                }}>
                  <Box sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: team.color,
                  }} />
                  <Typography 
                    className="ft-font-ui"
                    sx={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      color: '#1e293b',
                    }}
                  >
                    {team.code}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '0.8rem', 
                      color: '#64748b',
                      flex: 1,
                    }}
                  >
                    {team.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Main Content */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Controls */}
          <Box sx={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(0,0,0,0.08)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['TIMELINE', 'CALENDAR', 'GANTT', 'MATRIX'].map((view) => (
                <Button
                  key={view}
                  variant={view === viewMode ? "contained" : "outlined"}
                  onClick={() => setViewMode(view)}
                  sx={{
                    backgroundColor: view === viewMode ? '#0ea5e9' : 'transparent',
                    borderColor: view === viewMode ? '#0ea5e9' : 'rgba(0,0,0,0.2)',
                    color: view === viewMode ? '#ffffff' : '#64748b',
                    fontFamily: 'var(--ft-font-ui)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem',
                    letterSpacing: '0.05em',
                    px: 2,
                    py: 1,
                  }}
                >
                  {view}
                </Button>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>TRAVEL</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>∅%</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>BALANCE</Typography>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600 }}>∅%</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#64748b' }}>CONFLICTS</Typography>
                <Box sx={{ color: '#ef4444', fontSize: '0.9rem' }}>🔻</Box>
              </Box>
            </Box>
          </Box>

          {/* Matrix Content */}
          <Box sx={{ flex: 1, p: 3, background: 'rgba(248, 250, 252, 0.7)' }}>
            {/* Team Header */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: `150px repeat(${teams.length}, 60px)`,
              gap: 1,
              mb: 2,
            }}>
              <Box></Box>
              {teams.map((team) => (
                <Box key={team.id} sx={{
                  background: team.color,
                  color: '#ffffff',
                  textAlign: 'center',
                  py: 1,
                  borderRadius: 1,
                }}>
                  <Typography 
                    className="ft-font-ui"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                  >
                    {team.code}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Matrix Grid */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {teams.slice(0, 4).map((team) => (
                <Box key={team.id} sx={{
                  display: 'grid',
                  gridTemplateColumns: `150px repeat(${teams.length}, 60px)`,
                  gap: 1,
                  alignItems: 'center',
                }}>
                  <Box sx={{
                    background: team.color,
                    color: '#ffffff',
                    px: 2,
                    py: 1,
                    borderRadius: 1,
                  }}>
                    <Typography 
                      className="ft-font-ui"
                      sx={{ fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      {team.code}
                    </Typography>
                  </Box>
                  {teams.map((opponent) => (
                    <Box key={opponent.id} sx={{
                      height: 40,
                      background: team.id === opponent.id ? '#f1f5f9' : 'rgba(255, 255, 255, 0.8)',
                      border: '1px solid rgba(0,0,0,0.1)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      {team.id !== opponent.id && (
                        <Typography sx={{ fontSize: '1rem' }}>—</Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right Panel */}
        <Box sx={{
          width: 320,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(0,0,0,0.08)',
          p: 3,
        }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#0ea5e9',
                flex: 1,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              OVERVIEW
            </Button>
            <Button
              variant="outlined"
              sx={{
                flex: 1,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
              }}
            >
              COMPASS
            </Button>
          </Box>

          <Typography 
            className="ft-font-brand"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#1e293b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 3,
            }}
          >
            SCHEDULE QUALITY
          </Typography>

          {/* Quality Metrics */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { label: 'TRAVEL EFFICIENCY', value: '∅%' },
              { label: 'HOME/AWAY BALANCE', value: '100%' },
              { label: 'CONFLICT RESOLUTION', value: '100%' },
            ].map((metric) => (
              <Box key={metric.label}>
                <Typography 
                  sx={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {metric.label}
                </Typography>
                <Typography 
                  className="ft-font-brand"
                  sx={{
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: '#1e293b',
                  }}
                >
                  {metric.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default FlexTimeScheduleBuilder;