import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, Chip, Divider } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from '../ui/Sparkles';
import { NeonButton } from '../ui/NeonButton';

interface GameScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'final' | 'upcoming';
  time?: string;
  quarter?: string;
}

interface UpcomingGame {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  time: string;
  venue: string;
  tv?: string;
}

interface StandingTeam {
  rank: number;
  team: string;
  wins: number;
  losses: number;
  conferenceRecord: string;
  streak: string;
}

interface NewsItem {
  id: string;
  headline: string;
  timestamp: string;
  team?: string;
  priority: 'breaking' | 'high' | 'normal';
}

export const SportsDataPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'scores' | 'upcoming' | 'standings' | 'news'>('scores');

  // Mock data - in real app this would come from API
  const liveScores: GameScore[] = [
    { id: '1', homeTeam: 'Kansas', awayTeam: 'Oklahoma State', homeScore: 24, awayScore: 17, status: 'live', time: '8:42', quarter: '3rd' },
    { id: '2', homeTeam: 'Texas Tech', awayTeam: 'Baylor', homeScore: 31, awayScore: 28, status: 'final' },
    { id: '3', homeTeam: 'Utah', awayTeam: 'Colorado', homeScore: 0, awayScore: 0, status: 'upcoming', time: '7:00 PM' },
  ];

  const upcomingGames: UpcomingGame[] = [
    { id: '1', homeTeam: 'Arizona', awayTeam: 'ASU', date: 'Nov 30', time: '8:00 PM', venue: 'Sun Devil Stadium', tv: 'ESPN' },
    { id: '2', homeTeam: 'Iowa State', awayTeam: 'K-State', date: 'Dec 2', time: '3:30 PM', venue: 'Jack Trice Stadium', tv: 'FOX' },
    { id: '3', homeTeam: 'TCU', awayTeam: 'Houston', date: 'Dec 3', time: '12:00 PM', venue: 'Amon G. Carter Stadium' },
  ];

  const standings: StandingTeam[] = [
    { rank: 1, team: 'Arizona State', wins: 10, losses: 2, conferenceRecord: '7-2', streak: 'W3' },
    { rank: 2, team: 'Iowa State', wins: 10, losses: 3, conferenceRecord: '7-2', streak: 'W1' },
    { rank: 3, team: 'Colorado', wins: 9, losses: 3, conferenceRecord: '7-2', streak: 'L1' },
    { rank: 4, team: 'BYU', wins: 10, losses: 2, conferenceRecord: '7-2', streak: 'W2' },
  ];

  const news: NewsItem[] = [
    { id: '1', headline: 'Big 12 Championship Game Set for December 7th', timestamp: '2 hours ago', priority: 'breaking' },
    { id: '2', headline: 'Kansas QB announces transfer portal entry', timestamp: '4 hours ago', team: 'Kansas', priority: 'high' },
    { id: '3', headline: 'Big 12 receives 6 bowl game bids', timestamp: '1 day ago', priority: 'normal' },
  ];

  const tabs = [
    { id: 'scores', label: 'LIVE SCORES', icon: '🏈' },
    { id: 'upcoming', label: 'UPCOMING', icon: '📅' },
    { id: 'standings', label: 'STANDINGS', icon: '🏆' },
    { id: 'news', label: 'NEWS', icon: '📰' },
  ];

  const getScoreCardVariant = (status: string) => {
    switch (status) {
      case 'live': return { bg: 'rgba(0, 255, 0, 0.1)', border: 'rgba(0, 255, 0, 0.3)', glow: true };
      case 'final': return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.2)', glow: false };
      case 'upcoming': return { bg: 'rgba(0, 191, 255, 0.1)', border: 'rgba(0, 191, 255, 0.3)', glow: false };
      default: return { bg: 'rgba(255, 255, 255, 0.05)', border: 'rgba(255, 255, 255, 0.2)', glow: false };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'breaking': return '#ff4444';
      case 'high': return '#ff8800';
      default: return '#888888';
    }
  };

  return (
    <Box sx={{
      background: 'rgba(0, 0, 0, 0.9)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(0, 191, 255, 0.2)',
      borderRadius: 2,
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header with Tabs */}
      <Box sx={{ mb: 3 }}>
        <Sparkles density={2} color="#00bfff">
          <Typography 
            className="ft-font-brand"
            sx={{
              fontSize: '1.25rem',
              fontWeight: 700,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 2,
              textAlign: 'center',
            }}
          >
            BIG 12 LIVE
          </Typography>
        </Sparkles>
        
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'space-between' }}>
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ flex: 1 }}
            >
              <NeonButton
                variant={activeTab === tab.id ? "neon" : "ghost"}
                size="sm"
                glowColor="cyan"
                intensity={activeTab === tab.id ? "high" : "low"}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '8px 4px',
                  fontSize: '0.6rem',
                  fontFamily: 'var(--ft-font-ui)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                <span style={{ fontSize: '0.8rem' }}>{tab.icon}</span>
                <span>{tab.label}</span>
              </NeonButton>
            </motion.div>
          ))}
        </Box>
      </Box>

      {/* Content Area */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'scores' && (
            <motion.div
              key="scores"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {liveScores.map((game) => {
                  const variant = getScoreCardVariant(game.status);
                  return (
                    <motion.div
                      key={game.id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {variant.glow ? (
                        <Sparkles density={1} color="#00ff00">
                          <Card sx={{
                            background: variant.bg,
                            border: `1px solid ${variant.border}`,
                            borderRadius: 1,
                            p: 2,
                            backdropFilter: 'blur(10px)',
                          }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                                {game.awayTeam} @ {game.homeTeam}
                              </Typography>
                              {game.status === 'live' && (
                                <Chip 
                                  label="LIVE" 
                                  size="small" 
                                  sx={{ 
                                    bgcolor: '#00ff00', 
                                    color: '#000000', 
                                    fontSize: '0.6rem',
                                    fontWeight: 700,
                                  }} 
                                />
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '1.5rem', color: '#00bfff', fontWeight: 700 }}>
                                {game.awayScore} - {game.homeScore}
                              </Typography>
                              {game.time && (
                                <Typography sx={{ fontSize: '0.7rem', color: '#888888' }}>
                                  {game.quarter} {game.time}
                                </Typography>
                              )}
                            </Box>
                          </Card>
                        </Sparkles>
                      ) : (
                        <Card sx={{
                          background: variant.bg,
                          border: `1px solid ${variant.border}`,
                          borderRadius: 1,
                          p: 2,
                          backdropFilter: 'blur(10px)',
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                              {game.awayTeam} @ {game.homeTeam}
                            </Typography>
                            <Chip 
                              label={game.status.toUpperCase()} 
                              size="small" 
                              sx={{ 
                                bgcolor: game.status === 'final' ? '#666666' : '#00bfff', 
                                color: '#ffffff', 
                                fontSize: '0.6rem',
                                fontWeight: 700,
                              }} 
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '1.5rem', color: '#00bfff', fontWeight: 700 }}>
                              {game.status === 'upcoming' ? game.time : `${game.awayScore} - ${game.homeScore}`}
                            </Typography>
                          </Box>
                        </Card>
                      )}
                    </motion.div>
                  );
                })}
              </Box>
            </motion.div>
          )}

          {activeTab === 'upcoming' && (
            <motion.div
              key="upcoming"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {upcomingGames.map((game, index) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card sx={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 1,
                      p: 2,
                      backdropFilter: 'blur(10px)',
                      '&:hover': {
                        borderColor: 'rgba(0, 191, 255, 0.3)',
                        boxShadow: '0 0 10px rgba(0, 191, 255, 0.2)',
                      },
                      transition: 'all 0.3s ease',
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                          {game.awayTeam} @ {game.homeTeam}
                        </Typography>
                        {game.tv && (
                          <Chip 
                            label={game.tv} 
                            size="small" 
                            sx={{ 
                              bgcolor: 'rgba(0, 191, 255, 0.2)', 
                              color: '#00bfff', 
                              fontSize: '0.6rem',
                              fontWeight: 700,
                              border: '1px solid rgba(0, 191, 255, 0.3)',
                            }} 
                          />
                        )}
                      </Box>
                      <Typography sx={{ fontSize: '0.75rem', color: '#00bfff', fontWeight: 600, mb: 0.5 }}>
                        {game.date} • {game.time}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#888888' }}>
                        {game.venue}
                      </Typography>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}

          {activeTab === 'standings' && (
            <motion.div
              key="standings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {standings.map((team, index) => (
                  <motion.div
                    key={team.team}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {index === 0 ? (
                      <Sparkles density={1} color="#FFD700">
                        <Card sx={{
                          background: 'rgba(255, 215, 0, 0.1)',
                          border: '1px solid rgba(255, 215, 0, 0.3)',
                          borderRadius: 1,
                          p: 1.5,
                          backdropFilter: 'blur(10px)',
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography sx={{ fontSize: '0.8rem', color: '#FFD700', fontWeight: 700, minWidth: 20 }}>
                                #{team.rank}
                              </Typography>
                              <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                                {team.team}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                              <Typography sx={{ fontSize: '0.7rem', color: '#ffffff' }}>
                                {team.wins}-{team.losses}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#888888' }}>
                                {team.conferenceRecord}
                              </Typography>
                              <Chip 
                                label={team.streak} 
                                size="small" 
                                sx={{ 
                                  bgcolor: team.streak.startsWith('W') ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)', 
                                  color: team.streak.startsWith('W') ? '#00ff00' : '#ff4444', 
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                }} 
                              />
                            </Box>
                          </Box>
                        </Card>
                      </Sparkles>
                    ) : (
                      <Card sx={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 1,
                        p: 1.5,
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        transition: 'all 0.3s ease',
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#888888', fontWeight: 700, minWidth: 20 }}>
                              #{team.rank}
                            </Typography>
                            <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
                              {team.team}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '0.7rem', color: '#ffffff' }}>
                              {team.wins}-{team.losses}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#888888' }}>
                              {team.conferenceRecord}
                            </Typography>
                            <Chip 
                              label={team.streak} 
                              size="small" 
                              sx={{ 
                                bgcolor: team.streak.startsWith('W') ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)', 
                                color: team.streak.startsWith('W') ? '#00ff00' : '#ff4444', 
                                fontSize: '0.6rem',
                                fontWeight: 700,
                              }} 
                            />
                          </Box>
                        </Box>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}

          {activeTab === 'news' && (
            <motion.div
              key="news"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {news.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    {item.priority === 'breaking' ? (
                      <Sparkles density={2} color="#ff4444">
                        <Card sx={{
                          background: 'rgba(255, 68, 68, 0.1)',
                          border: '1px solid rgba(255, 68, 68, 0.3)',
                          borderRadius: 1,
                          p: 2,
                          backdropFilter: 'blur(10px)',
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Chip 
                              label="BREAKING" 
                              size="small" 
                              sx={{ 
                                bgcolor: '#ff4444', 
                                color: '#ffffff', 
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                mb: 1,
                              }} 
                            />
                            <Typography sx={{ fontSize: '0.7rem', color: '#888888' }}>
                              {item.timestamp}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.4 }}>
                            {item.headline}
                          </Typography>
                        </Card>
                      </Sparkles>
                    ) : (
                      <Card sx={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 1,
                        p: 2,
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          borderColor: 'rgba(0, 191, 255, 0.3)',
                          boxShadow: '0 0 10px rgba(0, 191, 255, 0.1)',
                        },
                        transition: 'all 0.3s ease',
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          {item.team && (
                            <Chip 
                              label={item.team} 
                              size="small" 
                              sx={{ 
                                bgcolor: 'rgba(0, 191, 255, 0.2)', 
                                color: '#00bfff', 
                                fontSize: '0.6rem',
                                fontWeight: 700,
                                border: '1px solid rgba(0, 191, 255, 0.3)',
                              }} 
                            />
                          )}
                          <Typography sx={{ fontSize: '0.7rem', color: '#888888' }}>
                            {item.timestamp}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.8rem', color: '#ffffff', fontWeight: 600, lineHeight: 1.4 }}>
                          {item.headline}
                        </Typography>
                      </Card>
                    )}
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default SportsDataPanel;