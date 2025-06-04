import React from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Paper
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Group as TeamIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimation } from '../../contexts/AnimationContext';
import { SPORT_DATA, SPORT_ROUTES } from '../../pages/sports';

interface SportsNavigationProps {
  onSportSelect?: (sportId: number) => void;
  currentSportId?: number;
}

const SportsNavigation: React.FC<SportsNavigationProps> = ({
  onSportSelect,
  currentSportId
}) => {
  const { theme } = useTheme();
  const { reducedMotion } = useAnimation();

  // Group sports by season for better organization
  const sportsBySeason = {
    Fall: [8, 14, 24], // FB, SOC, VB
    Winter: [2, 3, 11, 25], // MBB, WBB, GYM, WRES
    Spring: [1, 12, 15, 18, 19] // BSB, LAX, SB, MTN, WTN
  };

  const handleSportClick = (sportId: number) => {
    if (onSportSelect) {
      onSportSelect(sportId);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: reducedMotion ? 0.1 : 0.4,
        staggerChildren: reducedMotion ? 0 : 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0.1 : 0.3 }
    }
  };

  const sportCardVariants = {
    idle: { scale: 1, y: 0 },
    hover: {
      scale: 1.02,
      y: -4,
      transition: { duration: 0.2 }
    },
    tap: { scale: 0.98 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Box sx={{ p: 3 }}>
        <motion.div variants={itemVariants}>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
            Big 12 Sports
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Select a sport to view schedules, standings, and analytics
          </Typography>
        </motion.div>

        {Object.entries(sportsBySeason).map(([season, sportIds]) => (
          <motion.div key={season} variants={itemVariants}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                mb: 4,
                background: theme.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.02)' 
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(10px)',
                borderRadius: 3
              }}
            >
              <Typography
                variant="h5"
                fontWeight="bold"
                sx={{
                  mb: 3,
                  display: 'flex',
                  alignItems: 'center',
                  color: 'primary.main'
                }}
              >
                {season} Sports
                <Chip
                  label={`${sportIds.length} sports`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>

              <Grid container spacing={3}>
                {sportIds.map((sportId) => {
                  const sport = SPORT_DATA[sportId];
                  if (!sport) return null;

                  const isActive = currentSportId === sportId;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={sportId}>
                      <motion.div
                        variants={sportCardVariants}
                        initial="idle"
                        whileHover={!reducedMotion ? "hover" : undefined}
                        whileTap={!reducedMotion ? "tap" : undefined}
                      >
                        <Card
                          onClick={() => handleSportClick(sportId)}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: isActive
                              ? `linear-gradient(135deg, ${sport.colors.primary}20 0%, ${sport.colors.secondary}20 100%)`
                              : 'transparent',
                            border: isActive
                              ? `2px solid ${sport.colors.primary}`
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 2,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${sport.colors.primary}15 0%, ${sport.colors.secondary}15 100%)`,
                              borderColor: sport.colors.primary,
                              boxShadow: `0 8px 32px ${sport.colors.primary}30`
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                              <Avatar
                                sx={{
                                  width: 48,
                                  height: 48,
                                  mr: 2,
                                  background: `linear-gradient(135deg, ${sport.colors.primary} 0%, ${sport.colors.secondary} 100%)`,
                                  fontSize: '1.5rem'
                                }}
                              >
                                {sport.icon}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color="text.primary"
                                  sx={{ lineHeight: 1.2 }}
                                >
                                  {sport.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                                >
                                  {sport.code}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              <Chip
                                icon={<TeamIcon />}
                                label={`${sport.teamCount} teams`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Chip
                                label={sport.gender}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                {sport.championshipLocation}
                              </Typography>
                              {sport.scheduledByFlextime && (
                                <TrophyIcon
                                  sx={{
                                    fontSize: 16,
                                    color: sport.colors.primary,
                                    opacity: 0.7
                                  }}
                                />
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </Paper>
          </motion.div>
        ))}

        {/* Quick Stats */}
        <motion.div variants={itemVariants}>
          <Paper
            elevation={1}
            sx={{
              p: 3,
              background: theme.mode === 'dark'
                ? 'rgba(255, 255, 255, 0.02)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(10px)',
              borderRadius: 3
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Conference Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    12
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Sports
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    16
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conference Schools
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    150+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Teams
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    100%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    FlexTime Scheduled
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default SportsNavigation;