import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import { motion } from 'framer-motion';
import { FTLogo } from '../ui/FTLogo';

interface Team {
  id: string;
  name: string;
  code: string;
  color: string;
}

interface AgentStatus {
  scheduler: 'idle' | 'running' | 'ready';
  optimizer: 'idle' | 'running' | 'ready';
  analyzer: 'idle' | 'running' | 'ready';
  predictor: 'idle' | 'running' | 'ready';
}

/**
 * BENTO SCHEDULE BUILDER
 * 
 * Dark theme bento grid layout inspired by Wiza's design:
 * - Modular card-based layout with varying sizes
 * - Legacy FT Builder functionality
 * - Clean, professional aesthetic
 * - Orbitron ALL CAPS typography
 */
export const BentoScheduleBuilder: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState('football');
  const [viewMode, setViewMode] = useState('MATRIX');
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    scheduler: 'ready',
    optimizer: 'ready',
    analyzer: 'ready',
    predictor: 'ready',
  });

  const teams: Team[] = [
    { id: 'ariz', name: 'Arizona', code: 'ARIZ', color: '#CC0033' },
    { id: 'asu', name: 'Arizona State', code: 'ASU', color: '#8C1D40' },
    { id: 'bay', name: 'Baylor', code: 'BAY', color: '#003015' },
    { id: 'byu', name: 'BYU', code: 'BYU', color: '#002E5D' },
    { id: 'cin', name: 'Cincinnati', code: 'CIN', color: '#E00122' },
    { id: 'col', name: 'Colorado', code: 'COL', color: '#CFB87C' },
    { id: 'hou', name: 'Houston', code: 'HOU', color: '#C8102E' },
    { id: 'isu', name: 'Iowa State', code: 'ISU', color: '#C8102E' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return '#00bfff';
      case 'running': return '#ffaa00';
      case 'idle': return '#666666';
      default: return '#666666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return '✓';
      case 'running': return '⟳';
      case 'idle': return '○';
      default: return '○';
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      fontFamily: 'var(--ft-font-body)',
      p: 3,
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 4,
        pb: 3,
        borderBottom: '1px solid #222222',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <FTLogo size="md" variant="white" />
          <Box>
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                lineHeight: 1,
              }}
            >
              FLEXTIME
            </Typography>
            <Typography 
              className="ft-font-ui"
              sx={{
                fontSize: '0.9rem',
                color: '#00bfff',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 600,
              }}
            >
              FT BUILDER
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            BIG 12 CONFERENCE
          </Typography>
        </Box>
      </Box>

      {/* Bento Grid Layout */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'repeat(8, 120px)',
        gap: 3,
        height: 'calc(100vh - 200px)',
      }}>
        
        {/* Sport Selector - Small card */}
        <motion.div
          style={{ gridColumn: 'span 3', gridRow: 'span 1' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                className="ft-font-brand"
                sx={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
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
                    background: '#222222',
                    color: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#333333',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00bfff',
                    },
                  }}
                >
                  <MenuItem value="football">Football</MenuItem>
                  <MenuItem value="basketball">Basketball</MenuItem>
                  <MenuItem value="baseball">Baseball</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Agents Status - Large card */}
        <motion.div
          style={{ gridColumn: 'span 6', gridRow: 'span 2' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
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
                AI AGENTS STATUS
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: 2,
              }}>
                {[
                  { name: 'AI Scheduler', key: 'scheduler', icon: '⚙️' },
                  { name: 'Optimizer', key: 'optimizer', icon: '📐' },
                  { name: 'COMPASS Analyzer', key: 'analyzer', icon: '🧭' },
                  { name: 'ML Predictor', key: 'predictor', icon: '🤖' },
                ].map((agent) => (
                  <Box key={agent.key} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    background: '#0a0a0a',
                    borderRadius: 1,
                    border: '1px solid #1a1a1a',
                  }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>{agent.icon}</Typography>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        className="ft-font-ui"
                        sx={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      >
                        {agent.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <Box sx={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: getStatusColor(agentStatus[agent.key as keyof AgentStatus]),
                        }} />
                        <Typography 
                          sx={{ 
                            fontSize: '0.7rem', 
                            color: getStatusColor(agentStatus[agent.key as keyof AgentStatus]),
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {agentStatus[agent.key as keyof AgentStatus]}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions - Tall card */}
        <motion.div
          style={{ gridColumn: 'span 3', gridRow: 'span 3' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                className="ft-font-brand"
                sx={{
                  fontSize: '1rem',
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
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: '#00bfff',
                    color: '#000000',
                    fontFamily: 'var(--ft-font-ui)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    '&:hover': {
                      backgroundColor: '#0099cc',
                    },
                  }}
                  startIcon={<span>⚡</span>}
                >
                  AI Generate
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: '#333333',
                    color: '#ffffff',
                    fontFamily: 'var(--ft-font-ui)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    '&:hover': {
                      borderColor: '#00bfff',
                      backgroundColor: 'rgba(0,191,255,0.1)',
                    },
                  }}
                  startIcon={<span>📐</span>}
                >
                  Optimize
                </Button>
                
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: '#333333',
                    color: '#ffffff',
                    fontFamily: 'var(--ft-font-ui)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    py: 1.5,
                    '&:hover': {
                      borderColor: '#00bfff',
                      backgroundColor: 'rgba(0,191,255,0.1)',
                    },
                  }}
                  startIcon={<span>📊</span>}
                >
                  Analyze
                </Button>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Teams Grid - Large horizontal card */}
        <motion.div
          style={{ gridColumn: 'span 9', gridRow: 'span 2' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
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
                🏈 FOOTBALL TEAMS
              </Typography>
              
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: 2,
              }}>
                {teams.map((team) => (
                  <Box key={team.id} sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      background: '#151515',
                      borderColor: '#333333',
                    },
                    transition: 'all 0.2s ease',
                  }}>
                    <Box sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: team.color,
                    }} />
                    <Box>
                      <Typography 
                        className="ft-font-ui"
                        sx={{ 
                          fontSize: '0.8rem', 
                          fontWeight: 600,
                          color: '#ffffff',
                        }}
                      >
                        {team.code}
                      </Typography>
                      <Typography 
                        sx={{ 
                          fontSize: '0.7rem', 
                          color: '#888888',
                        }}
                      >
                        {team.name}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Quality Metrics - Medium card */}
        <motion.div
          style={{ gridColumn: 'span 3', gridRow: 'span 3' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                className="ft-font-brand"
                sx={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 3,
                }}
              >
                SCHEDULE QUALITY
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { label: 'TRAVEL EFFICIENCY', value: '92%', color: '#00bfff' },
                  { label: 'BALANCE', value: '87%', color: '#00ff88' },
                  { label: 'CONFLICTS', value: '0', color: '#ff6b6b' },
                ].map((metric) => (
                  <Box key={metric.label}>
                    <Typography 
                      sx={{
                        fontSize: '0.7rem',
                        color: '#888888',
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
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: metric.color,
                      }}
                    >
                      {metric.value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* View Toggle - Small wide card */}
        <motion.div
          style={{ gridColumn: 'span 6', gridRow: 'span 1' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
          }}>
            <CardContent sx={{ p: 3, width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                {['TIMELINE', 'CALENDAR', 'GANTT', 'MATRIX'].map((view) => (
                  <Button
                    key={view}
                    variant={view === viewMode ? "contained" : "outlined"}
                    onClick={() => setViewMode(view)}
                    sx={{
                      backgroundColor: view === viewMode ? '#00bfff' : 'transparent',
                      borderColor: view === viewMode ? '#00bfff' : '#333333',
                      color: view === viewMode ? '#000000' : '#ffffff',
                      fontFamily: 'var(--ft-font-ui)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      fontSize: '0.7rem',
                      letterSpacing: '0.05em',
                      px: 2,
                      py: 1,
                      minWidth: 'auto',
                    }}
                  >
                    {view}
                  </Button>
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Schedule Matrix - Large card */}
        <motion.div
          style={{ gridColumn: 'span 9', gridRow: 'span 3' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Card sx={{
            background: '#111111',
            border: '1px solid #222222',
            borderRadius: 2,
            height: '100%',
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
                SCHEDULE MATRIX
              </Typography>
              
              {/* Matrix Placeholder */}
              <Box sx={{
                height: 'calc(100% - 60px)',
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Typography sx={{ color: '#666666', fontSize: '0.9rem' }}>
                  Matrix visualization will render here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

      </Box>
    </Box>
  );
};

export default BentoScheduleBuilder;