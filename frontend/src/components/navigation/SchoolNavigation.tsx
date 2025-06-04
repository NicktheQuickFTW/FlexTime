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
  School as SchoolIcon,
  LocationOn as LocationIcon,
  Group as PeopleIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimation } from '../../contexts/AnimationContext';
import { SCHOOL_DATA, SCHOOL_REGIONS, SCHOOL_ROUTES } from '../../pages/universities';

interface SchoolNavigationProps {
  onSchoolSelect?: (schoolId: number) => void;
  currentSchoolId?: number;
}

const SchoolNavigation: React.FC<SchoolNavigationProps> = ({
  onSchoolSelect,
  currentSchoolId
}) => {
  const { theme } = useTheme();
  const { reducedMotion } = useAnimation();

  const handleSchoolClick = (schoolId: number) => {
    if (onSchoolSelect) {
      onSchoolSelect(schoolId);
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

  const schoolCardVariants = {
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
            Big 12 Universities
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Select a university to view athletics programs, facilities, and administration
          </Typography>
        </motion.div>

        {Object.entries(SCHOOL_REGIONS).map(([region, schoolIds]) => (
          <motion.div key={region} variants={itemVariants}>
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
                <LocationIcon sx={{ mr: 1 }} />
                {region} Region
                <Chip
                  label={`${schoolIds.length} schools`}
                  size="small"
                  sx={{ ml: 2 }}
                />
              </Typography>

              <Grid container spacing={3}>
                {schoolIds.map((schoolId) => {
                  const school = SCHOOL_DATA[schoolId];
                  if (!school) return null;

                  const isActive = currentSchoolId === schoolId;

                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={schoolId}>
                      <motion.div
                        variants={schoolCardVariants}
                        initial="idle"
                        whileHover={!reducedMotion ? "hover" : undefined}
                        whileTap={!reducedMotion ? "tap" : undefined}
                      >
                        <Card
                          onClick={() => handleSchoolClick(schoolId)}
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: isActive
                              ? `linear-gradient(135deg, ${school.colors.primary}20 0%, ${school.colors.secondary}20 100%)`
                              : 'transparent',
                            border: isActive
                              ? `2px solid ${school.colors.primary}`
                              : '1px solid rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: 2,
                            '&:hover': {
                              background: `linear-gradient(135deg, ${school.colors.primary}15 0%, ${school.colors.secondary}15 100%)`,
                              borderColor: school.colors.primary,
                              boxShadow: `0 8px 32px ${school.colors.primary}30`
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
                                  background: `linear-gradient(135deg, ${school.colors.primary} 0%, ${school.colors.secondary} 100%)`,
                                  fontSize: '1.5rem'
                                }}
                              >
                                {school.icon}
                              </Avatar>
                              <Box>
                                <Typography
                                  variant="h6"
                                  fontWeight="bold"
                                  color="text.primary"
                                  sx={{ lineHeight: 1.2 }}
                                >
                                  {school.shortName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                                >
                                  {school.abbreviation}
                                </Typography>
                              </Box>
                            </Box>

                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.primary" fontWeight="600">
                                {school.mascot}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {school.location}
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                              <Chip
                                icon={<SchoolIcon />}
                                label={`Est. ${school.founded}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Chip
                                icon={<PeopleIcon />}
                                label={school.enrollment}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Typography variant="body2" color="text.secondary">
                                {school.totalSports} sports
                              </Typography>
                              <TrophyIcon
                                sx={{
                                  fontSize: 16,
                                  color: school.colors.primary,
                                  opacity: 0.7
                                }}
                              />
                            </Box>

                            {/* School Colors Display */}
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 1,
                                  backgroundColor: school.colors.primary,
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                              />
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: 1,
                                  backgroundColor: school.colors.secondary,
                                  border: '1px solid rgba(255, 255, 255, 0.2)'
                                }}
                              />
                              {school.colors.tertiary && (
                                <Box
                                  sx={{
                                    width: 12,
                                    height: 12,
                                    borderRadius: 1,
                                    backgroundColor: school.colors.tertiary,
                                    border: '1px solid rgba(255, 255, 255, 0.2)'
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

        {/* Conference Overview Stats */}
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
              Big 12 Conference Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    16
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member Universities
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    23
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different Sports
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    650K+
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Students
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    1996
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conference Founded
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

export default SchoolNavigation;