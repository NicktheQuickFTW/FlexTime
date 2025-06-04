import React, { useState } from 'react';
import { Box, Typography, Card, Button, Select, MenuItem, FormControl } from '@mui/material';
import { motion } from 'framer-motion';
import { FTLogo } from '../ui/FTLogo';
import { SportsDataPanel } from '../sports/SportsDataPanel';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NeonButton } from '../ui/NeonButton';
import { WeatherWidget, WeatherData } from '../ui/weather-widget';

interface Team {
  id: string;
  name: string;
  code: string;
  color: string;
  abbreviation: string;
  logoFile: string; // Added for team logos
}

interface AgentStatus {
  scheduler: 'idle' | 'running' | 'ready';
  optimizer: 'idle' | 'running' | 'ready';
  analyzer: 'idle' | 'running' | 'ready';
  ml_predictor: 'idle' | 'running' | 'ready';
}

/**
 * LEGACY DARK BUILDER
 * 
 * Inspired by the original FT Builder with modern refinements:
 * - Legacy layout structure and functionality
 * - Dark theme with metal shader-inspired effects
 * - Highly detailed illustrations and visual storytelling
 * - Performance-optimized GPU-accelerated effects
 * - Clean, sophisticated aesthetic
 */
export const LegacyDarkBuilder: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState('football');
  const [currentView, setCurrentView] = useState('matrix');
  const [activeUsers] = useState(0);
  const [agentStatus] = useState<AgentStatus>({
    scheduler: 'ready',
    optimizer: 'ready',
    analyzer: 'ready',
    ml_predictor: 'ready',
  });

  // Big 12 Teams with monochrome colors (metallic grays)
  const big12Teams: Team[] = [
    { id: 'ariz', name: 'Arizona', code: 'ARIZ', color: '#666666', abbreviation: 'ARIZ', logoFile: 'arizona-dark.svg' },
    { id: 'asu', name: 'Arizona State', code: 'ASU', color: '#777777', abbreviation: 'ASU', logoFile: 'arizona_state-dark.svg' },
    { id: 'bay', name: 'Baylor', code: 'BAY', color: '#555555', abbreviation: 'BAY', logoFile: 'baylor-dark.svg' },
    { id: 'byu', name: 'BYU', code: 'BYU', color: '#888888', abbreviation: 'BYU', logoFile: 'byu-dark.svg' },
    { id: 'cin', name: 'Cincinnati', code: 'CIN', color: '#999999', abbreviation: 'CIN', logoFile: 'cincinnati-dark.svg' },
    { id: 'col', name: 'Colorado', code: 'COL', color: '#aaaaaa', abbreviation: 'COL', logoFile: 'colorado-dark.svg' },
    { id: 'hou', name: 'Houston', code: 'HOU', color: '#666666', abbreviation: 'HOU', logoFile: 'houston-dark.svg' },
    { id: 'isu', name: 'Iowa State', code: 'ISU', color: '#777777', abbreviation: 'ISU', logoFile: 'iowa_state-dark.svg' },
    { id: 'ku', name: 'Kansas', code: 'KU', color: '#555555', abbreviation: 'KU', logoFile: 'kansas-dark.svg' },
    { id: 'ksu', name: 'Kansas State', code: 'KSU', color: '#888888', abbreviation: 'KSU', logoFile: 'kansas_state-dark.svg' },
    { id: 'okst', name: 'Oklahoma State', code: 'OKST', color: '#999999', abbreviation: 'OKST', logoFile: 'oklahoma_state-dark.svg' },
    { id: 'tcu', name: 'TCU', code: 'TCU', color: '#aaaaaa', abbreviation: 'TCU', logoFile: 'tcu-dark.svg' },
    { id: 'ttu', name: 'Texas Tech', code: 'TTU', color: '#666666', abbreviation: 'TTU', logoFile: 'texas_tech-dark.svg' },
    { id: 'ucf', name: 'UCF', code: 'UCF', color: '#777777', abbreviation: 'UCF', logoFile: 'ucf-dark.svg' },
    { id: 'utah', name: 'Utah', code: 'UTAH', color: '#555555', abbreviation: 'UTAH', logoFile: 'utah-dark.svg' },
    { id: 'wvu', name: 'West Virginia', code: 'WVU', color: '#888888', abbreviation: 'WVU', logoFile: 'west_virginia-dark.svg' },
  ];

  const getStatusProperties = (status: string) => {
    switch (status) {
      case 'ready': return { primary: '#00bfff', glow: 'rgba(0, 191, 255, 0.7)', accent: '#A0E7FF' };
      case 'running': return { primary: '#ffaa00', glow: 'rgba(255, 170, 0, 0.7)', accent: '#FFD680' };
      case 'idle': return { primary: '#666666', glow: 'rgba(102, 102, 102, 0.5)', accent: '#888888' };
      default: return { primary: '#666666', glow: 'rgba(102, 102, 102, 0.5)', accent: '#888888' };
    }
  };

  const getSportIcon = (sport: string) => {
    switch (sport.toLowerCase()) {
      case 'football': return '🏈';
      case 'basketball': return '🏀';
      case 'baseball': return '⚾';
      case 'soccer': return '⚽';
      default: return '🏈';
    }
  };

  // Metal shader-inspired animation variants
  const metalSheen = {
    initial: { x: '-100%' },
    animate: { x: '100%' },
    transition: { duration: 2, repeat: Infinity, repeatDelay: 3 }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
      color: '#ffffff',
      fontFamily: 'var(--ft-font-body)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle metallic background pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.02) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.01) 0%, transparent 50%)
        `,
        zIndex: 0,
      }} />

      {/* Header - Glassmorphic with Monochrome Colors */}
      <Box sx={{
        position: 'relative',
        zIndex: 2,
        background: 'rgba(0, 0, 0, 0.9)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 191, 255, 0.2)',
        p: 2,
      }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          {/* Left - Brand Section */}
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
                  textShadow: '0 0 10px rgba(0, 191, 255, 0.3)',
                }}
              >
                FLEXTIME
              </Typography>
              <Typography 
                className="ft-font-ui"
                sx={{
                  fontSize: '0.8rem',
                  color: '#00bfff',
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  fontWeight: 600,
                }}
              >
                FT BUILDER
              </Typography>
            </Box>
            <Box sx={{
              background: '#00bfff',
              color: '#000000',
              px: 2,
              py: 0.5,
              borderRadius: 1,
              fontFamily: 'var(--ft-font-ui)',
              fontSize: '0.7rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              BIG 12 CONFERENCE
            </Box>
          </Box>

          {/* Center - AI Status Grid (Legacy Layout) */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: 2,
          }}>
            {[
              { name: 'AI Scheduler', key: 'scheduler', icon: '⚙️' },
              { name: 'Optimizer', key: 'optimizer', icon: '📐' },
              { name: 'COMPASS Analyzer', key: 'analyzer', icon: '🧭' },
              { name: 'ML Predictor', key: 'ml_predictor', icon: '🤖' },
            ].map((agent) => {
              const statusKey = agent.key as keyof AgentStatus;
              const currentStatus = agentStatus[statusKey];
              const { primary, glow, accent } = getStatusProperties(currentStatus);

              return (
                <motion.div
                  key={agent.key}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                >
                  <Card sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${primary}`,
                    borderRadius: 2,
                    p: 1.5,
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    minWidth: 120,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.08)',
                      transform: 'translateY(-2px)',
                      borderColor: glow,
                      boxShadow: `0 0 20px ${glow}`,
                    },
                    transition: 'all 0.3s ease',
                  }}>
                    {/* Metal sheen effect - monochrome */}
                    <motion.div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
                        pointerEvents: 'none',
                      }}
                      variants={metalSheen}
                      initial="initial"
                      animate="animate"
                    />
                    
                    <Typography sx={{ fontSize: '1.2rem', mb: 0.5, zIndex: 1 }}>{agent.icon}</Typography>
                    <Typography 
                      className="ft-font-ui"
                      sx={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 600,
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        mb: 0.5, // Adjusted margin
                        zIndex: 1,
                      }}
                    >
                      {agent.name}
                    </Typography>
                    {/* New Visual Status Indicator */}
                    <motion.div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        position: 'relative',
                        background: `radial-gradient(circle, ${accent} 0%, ${primary} 70%)`,
                        zIndex: 1,
                      }}
                      animate={{
                        boxShadow: currentStatus !== 'idle' ? [
                          `0 0 4px ${primary}`,
                          `0 0 12px ${glow}`,
                          `0 0 4px ${primary}`
                        ] : `0 0 4px ${primary}`,
                      }}
                      transition={currentStatus !== 'idle' ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                    >
                      {currentStatus === 'running' && (
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: 8,
                            height: 8,
                            border: `2px solid ${accent}`,
                            borderRadius: '50%',
                            borderTopColor: 'transparent',
                            borderLeftColor: 'transparent',
                            transform: 'translate(-50%, -50%)',
                          }}
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                    </motion.div>
                    <Typography 
                      sx={{ 
                        fontSize: '0.6rem', 
                        color: primary, 
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        mt: 0.5, // Added margin top for spacing
                        zIndex: 1,
                      }}
                    >
                      {currentStatus}
                    </Typography>
                  </Card>
                </motion.div>
              );
            })}
          </Box>

          {/* Right - Theme Toggle & Sport Selector */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <ThemeToggle 
              onToggle={(isDark) => {
                console.log('Theme toggled:', isDark ? 'dark' : 'light');
                // You can implement actual theme switching here
              }}
            />
            
            <Box>
              <Typography 
                className="ft-font-ui"
                sx={{
                  fontSize: '0.7rem',
                  color: '#888888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  mb: 1,
                }}
              >
                SPORT
              </Typography>
              <FormControl>
                <Select
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0, 191, 255, 0.3)',
                    borderRadius: 2,
                    color: '#ffffff',
                    minWidth: 150,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none',
                    },
                    '&:hover': {
                      background: 'rgba(255, 255, 255, 0.08)',
                      borderColor: 'rgba(0, 191, 255, 0.5)',
                    },
                  }}
                >
                  <MenuItem value="football">Football</MenuItem>
                  <MenuItem value="basketball">Basketball</MenuItem>
                  <MenuItem value="baseball">Baseball</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Interface - Legacy 3-Column Layout */}
      <Box sx={{ display: 'flex', height: 'calc(100vh - 120px)', position: 'relative', zIndex: 2 }}>
        
        {/* Left Column - Sidebar */}
        <Box sx={{
          width: 380,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(0, 191, 255, 0.2)',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Sub-header with collaboration */}
          <Box sx={{
            p: 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography 
                sx={{ 
                  fontSize: '0.7rem', 
                  color: '#888888',
                  textTransform: 'uppercase',
                }}
              >
                {activeUsers} Online
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <NeonButton
                  variant="flextime"
                  size="sm"
                  glowColor="cyan"
                  intensity="high"
                  style={{ 
                    fontFamily: 'var(--ft-font-ui)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  ⚡ AI Generate
                </NeonButton>
                <NeonButton
                  variant="ghost"
                  size="sm"
                  glowColor="white"
                  intensity="medium"
                  style={{ 
                    fontFamily: 'var(--ft-font-ui)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Optimize
                </NeonButton>
              </Box>
            </Box>
          </Box>

          {/* Schedule Tools Section */}
          <Box sx={{ p: 3, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Typography 
              className="ft-font-brand"
              sx={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              ⚙️ SCHEDULE TOOLS
            </Typography>
          </Box>

          {/* Teams Section */}
          <Box sx={{ flex: 1, p: 3, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Teams */}
            <Box>
              <Typography 
                sx={{
                  fontSize: '0.75rem',
                  color: '#888888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {getSportIcon(selectedSport)} {selectedSport.toUpperCase()} TEAMS
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {big12Teams.slice(0, 4).map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'center', 
                      alignItems: 'center',
                      p: 1, 
                      height: '50px', 
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease-in-out',
                      backdropFilter: 'blur(5px)',
                      '&:hover': { 
                        background: 'rgba(255, 255, 255, 0.06)',
                        borderColor: 'rgba(255, 255, 255, 0.2)', 
                        transform: 'scale(1.03)',
                        boxShadow: '0 0 15px rgba(255, 255, 255, 0.1)',
                      }
                    }}>
                      <img
                        src={`/logos/teams/dark/${team.logoFile}`}
                        alt={`${team.name} logo`}
                        style={{
                          height: '32px', 
                          width: 'auto',
                          objectFit: 'contain',
                          filter: 'grayscale(100%) brightness(2.1) contrast(1)', 
                          opacity: 0.85, 
                        }}
                      />
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </Box>

            {/* Weather Widget */}
            <Box>
              <Typography 
                sx={{
                  fontSize: '0.75rem',
                  color: '#888888',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                🌤️ VENUE WEATHER
              </Typography>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <WeatherWidget
                  width="100%"
                  className="border border-cyan-500/20 shadow-lg"
                  onFetchWeather={async (): Promise<WeatherData> => ({
                    city: "Lawrence, KS",
                    temperature: 22,
                    weatherType: "clear",
                    dateTime: new Date().toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    }),
                    isDay: new Date().getHours() >= 6 && new Date().getHours() < 18
                  })}
                  fallbackLocation={{
                    latitude: 38.9543,
                    longitude: -95.2558
                  }}
                />
              </motion.div>
            </Box>
          </Box>
        </Box>

        {/* Center Column - Schedule Interface */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* View Toggle Bar */}
          <Box sx={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {['TIMELINE', 'CALENDAR', 'GANTT', 'MATRIX'].map((view) => (
                <NeonButton
                  key={view}
                  variant={view.toLowerCase() === currentView ? "solid" : "ghost"}
                  size="sm"
                  glowColor={view.toLowerCase() === currentView ? "cyan" : "white"}
                  intensity={view.toLowerCase() === currentView ? "high" : "low"}
                  onClick={() => setCurrentView(view.toLowerCase())}
                  style={{ 
                    fontFamily: 'var(--ft-font-ui)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {view}
                </NeonButton>
              ))}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              {[
                { label: 'TRAVEL', value: '∅%' },
                { label: 'BALANCE', value: '∅%' },
                { label: 'CONFLICTS', value: '🔻' },
              ].map((metric) => (
                <Box key={metric.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    sx={{ 
                      fontSize: '0.7rem', 
                      color: '#888888',
                      textTransform: 'uppercase',
                    }}
                  >
                    {metric.label}
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      color: metric.label === 'CONFLICTS' ? '#ff6b6b' : '#ffffff',
                    }}
                  >
                    {metric.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Schedule Content Area */}
          <Box sx={{ 
            flex: 1, 
            p: 3,
            background: 'rgba(0, 0, 0, 0.3)',
            position: 'relative',
          }}>
            {/* Team header row */}
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: `150px repeat(${Math.min(big12Teams.length, 12)}, 60px)`,
              gap: 1,
              mb: 2,
            }}>
              <Box></Box>
              {big12Teams.slice(0, 12).map((team) => (
                <Box key={team.id} sx={{
                  background: team.color,
                  color: '#ffffff',
                  textAlign: 'center',
                  py: 1,
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}>
                  {team.abbreviation}
                </Box>
              ))}
            </Box>

            {/* Matrix rows */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {big12Teams.slice(0, 6).map((team) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Box sx={{
                    display: 'grid',
                    gridTemplateColumns: `150px repeat(${Math.min(big12Teams.length, 12)}, 60px)`,
                    gap: 1,
                    alignItems: 'center',
                  }}>
                    <Box sx={{
                      background: team.color,
                      color: '#ffffff',
                      px: 2,
                      py: 1,
                      borderRadius: 1,
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    }}>
                      {team.abbreviation}
                    </Box>
                    {big12Teams.slice(0, 12).map((opponent) => (
                      <Box key={opponent.id} sx={{
                        height: 40,
                        background: team.id === opponent.id 
                          ? 'rgba(100, 100, 100, 0.3)' 
                          : 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: team.id !== opponent.id ? 'pointer' : 'default',
                        backdropFilter: 'blur(5px)',
                        '&:hover': team.id !== opponent.id ? {
                          background: 'rgba(0, 191, 255, 0.1)',
                          borderColor: 'rgba(0, 191, 255, 0.3)',
                          boxShadow: '0 0 10px rgba(0, 191, 255, 0.2)',
                        } : {},
                        transition: 'all 0.3s ease',
                      }}>
                        {team.id !== opponent.id && (
                          <Typography sx={{ fontSize: '1rem', color: '#666666' }}>—</Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Box>
        </Box>

        {/* Right Column - Sports Data Panel with Sparkles */}
        <Box sx={{
          width: 320,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <SportsDataPanel />
        </Box>
      </Box>
    </Box>
  );
};

export default LegacyDarkBuilder;