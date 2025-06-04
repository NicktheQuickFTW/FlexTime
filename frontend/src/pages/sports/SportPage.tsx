'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  IconButton,
  Divider,
  Skeleton
} from '@mui/material';
import {
  EmojiEvents as TrophyIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Group as TeamIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Assessment as AnalyticsIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAnimation } from '../../contexts/AnimationContext';

// Sport data mapping with correct sport_ids from HELiiX Neon database
export const SPORT_DATA = {
  1: { // Baseball
    code: 'BSB',
    name: 'Baseball',
    fullName: 'Baseball',
    gender: 'Men\'s',
    season: 'Spring',
    teamCount: 14,
    championship: 'Tournament',
    championshipLocation: 'Arlington, TX',
    colors: { primary: '#2E7D32', secondary: '#81C784' },
    icon: '⚾',
    scheduledByFlextime: true
  },
  2: { // Men's Basketball
    code: 'MBB',
    name: 'Men\'s Basketball',
    fullName: 'Men\'s Basketball',
    gender: 'Men\'s',
    season: 'Winter',
    teamCount: 14,
    championship: 'Tournament',
    championshipLocation: 'Kansas City, MO',
    colors: { primary: '#FF6F00', secondary: '#FFB74D' },
    icon: '🏀',
    scheduledByFlextime: true
  },
  3: { // Women's Basketball
    code: 'WBB',
    name: 'Women\'s Basketball',
    fullName: 'Women\'s Basketball',
    gender: 'Women\'s',
    season: 'Winter',
    teamCount: 14,
    championship: 'Tournament',
    championshipLocation: 'Kansas City, MO',
    colors: { primary: '#E91E63', secondary: '#F8BBD9' },
    icon: '🏀',
    scheduledByFlextime: true
  },
  8: { // Football
    code: 'FB',
    name: 'Football',
    fullName: 'Football',
    gender: 'Men\'s',
    season: 'Fall',
    teamCount: 16,
    championship: 'Playoff',
    championshipLocation: 'Dallas, TX',
    colors: { primary: '#1565C0', secondary: '#90CAF9' },
    icon: '🏈',
    scheduledByFlextime: true
  },
  11: { // Gymnastics
    code: 'GYM',
    name: 'Gymnastics',
    fullName: 'Gymnastics',
    gender: 'Women\'s',
    season: 'Winter',
    teamCount: 7,
    championship: 'Championship',
    championshipLocation: 'Norman, OK',
    colors: { primary: '#7B1FA2', secondary: '#CE93D8' },
    icon: '🤸‍♀️',
    scheduledByFlextime: true
  },
  12: { // Lacrosse
    code: 'LAX',
    name: 'Lacrosse',
    fullName: 'Lacrosse',
    gender: 'Women\'s',
    season: 'Spring',
    teamCount: 5,
    championship: 'Tournament',
    championshipLocation: 'Dallas, TX',
    colors: { primary: '#388E3C', secondary: '#A5D6A7' },
    icon: '🥍',
    scheduledByFlextime: true
  },
  14: { // Soccer
    code: 'SOC',
    name: 'Soccer',
    fullName: 'Soccer',
    gender: 'Women\'s',
    season: 'Fall',
    teamCount: 14,
    championship: 'Tournament',
    championshipLocation: 'Round Rock, TX',
    colors: { primary: '#2E7D32', secondary: '#81C784' },
    icon: '⚽',
    scheduledByFlextime: true
  },
  15: { // Softball
    code: 'SB',
    name: 'Softball',
    fullName: 'Softball',
    gender: 'Women\'s',
    season: 'Spring',
    teamCount: 11,
    championship: 'Tournament',
    championshipLocation: 'Oklahoma City, OK',
    colors: { primary: '#F57C00', secondary: '#FFB74D' },
    icon: '🥎',
    scheduledByFlextime: true
  },
  18: { // Men's Tennis
    code: 'MTN',
    name: 'Men\'s Tennis',
    fullName: 'Men\'s Tennis',
    gender: 'Men\'s',
    season: 'Spring',
    teamCount: 9,
    championship: 'Tournament',
    championshipLocation: 'Stillwater, OK',
    colors: { primary: '#558B2F', secondary: '#AED581' },
    icon: '🎾',
    scheduledByFlextime: true
  },
  19: { // Women's Tennis
    code: 'WTN',
    name: 'Women\'s Tennis',
    fullName: 'Women\'s Tennis',
    gender: 'Women\'s',
    season: 'Spring',
    teamCount: 11,
    championship: 'Tournament',
    championshipLocation: 'Lawrence, KS',
    colors: { primary: '#7B1FA2', secondary: '#CE93D8' },
    icon: '🎾',
    scheduledByFlextime: true
  },
  24: { // Volleyball
    code: 'VB',
    name: 'Volleyball',
    fullName: 'Volleyball',
    gender: 'Women\'s',
    season: 'Fall',
    teamCount: 15,
    championship: 'Tournament',
    championshipLocation: 'Ames, IA',
    colors: { primary: '#D32F2F', secondary: '#FFCDD2' },
    icon: '🏐',
    scheduledByFlextime: true
  },
  25: { // Wrestling
    code: 'WRES',
    name: 'Wrestling',
    fullName: 'Wrestling',
    gender: 'Men\'s',
    season: 'Winter',
    teamCount: 6,
    championship: 'Championship',
    championshipLocation: 'Tulsa, OK',
    colors: { primary: '#5D4037', secondary: '#BCAAA4' },
    icon: '🤼‍♂️',
    scheduledByFlextime: true
  }
};

interface SportPageProps {
  sportId: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`sport-tabpanel-${index}`}
    aria-labelledby={`sport-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const SportPage: React.FC<SportPageProps> = ({ sportId }) => {
  const { theme } = useTheme();
  const { reducedMotion } = useAnimation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [standings, setStandings] = useState([]);

  const sport = SPORT_DATA[sportId];

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setLoading(true);
      // Here you would fetch actual data from the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };
    loadData();
  }, [sportId]);

  if (!sport) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="error">
          Sport not found
        </Typography>
      </Container>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: reducedMotion ? 0.1 : 0.6,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header Section */}
        <motion.div variants={itemVariants}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${sport.colors.primary}15 0%, ${sport.colors.secondary}15 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${sport.colors.primary}30`,
              borderRadius: 4,
              mb: 4,
              overflow: 'visible'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      width: 80,
                      height: 80,
                      mr: 3,
                      background: `linear-gradient(135deg, ${sport.colors.primary} 0%, ${sport.colors.secondary} 100%)`,
                      fontSize: '2.5rem'
                    }}
                  >
                    {sport.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color="text.primary">
                      {sport.name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                      Big 12 Conference • {sport.season} • {sport.gender}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<TeamIcon />}
                        label={`${sport.teamCount} Teams`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<TrophyIcon />}
                        label={sport.championship}
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<LocationIcon />}
                        label={sport.championshipLocation}
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<ScheduleIcon />}
                    sx={{
                      background: `linear-gradient(135deg, ${sport.colors.primary} 0%, ${sport.colors.secondary} 100%)`,
                      color: 'white'
                    }}
                  >
                    Open FT Builder
                  </Button>
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div variants={itemVariants}>
          <Card sx={{ mb: 3, overflow: 'visible' }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem'
                }
              }}
            >
              <Tab icon={<TeamIcon />} label="Teams & Standings" />
              <Tab icon={<ScheduleIcon />} label="Schedule" />
              <Tab icon={<AnalyticsIcon />} label="Analytics" />
              <Tab icon={<TrophyIcon />} label="Championships" />
            </Tabs>
          </Card>
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: reducedMotion ? 0.1 : 0.3 }}
          >
            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                {/* Teams Grid */}
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold">
                          Team Standings
                        </Typography>
                        <Button startIcon={<AddIcon />} variant="outlined">
                          Add Team
                        </Button>
                      </Box>
                      
                      {loading ? (
                        <Box>
                          {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                          ))}
                        </Box>
                      ) : (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Rank</TableCell>
                                <TableCell>Team</TableCell>
                                <TableCell align="center">Conf</TableCell>
                                <TableCell align="center">Overall</TableCell>
                                <TableCell align="center">COMPASS</TableCell>
                                <TableCell align="center">Actions</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {/* Sample data - replace with actual API data */}
                              {[1, 2, 3, 4, 5].map((rank) => (
                                <TableRow key={rank} hover>
                                  <TableCell>
                                    <Chip
                                      label={rank}
                                      size="small"
                                      color={rank <= 3 ? 'primary' : 'default'}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <Avatar sx={{ mr: 2, width: 32, height: 32 }}>
                                        T
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" fontWeight="bold">
                                          Team {rank}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                          School {rank}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </TableCell>
                                  <TableCell align="center">10-{rank}</TableCell>
                                  <TableCell align="center">25-{rank + 5}</TableCell>
                                  <TableCell align="center">
                                    <LinearProgress
                                      variant="determinate"
                                      value={85 - rank * 5}
                                      sx={{ width: 60, mx: 'auto' }}
                                    />
                                  </TableCell>
                                  <TableCell align="center">
                                    <IconButton size="small">
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12} lg={4}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Season Overview
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Total Games</Typography>
                          <Typography variant="body2" fontWeight="bold">156</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Games Scheduled</Typography>
                          <Typography variant="body2" fontWeight="bold">142</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Conflicts</Typography>
                          <Chip label="3" color="warning" size="small" />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Completion</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={91}
                            sx={{ width: 80, mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        Quick Actions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button variant="outlined" fullWidth startIcon={<ScheduleIcon />}>
                          Generate Schedule
                        </Button>
                        <Button variant="outlined" fullWidth startIcon={<TrendingIcon />}>
                          Run Optimization
                        </Button>
                        <Button variant="outlined" fullWidth startIcon={<AnalyticsIcon />}>
                          View Analytics
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {sport.name} Schedule
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Schedule content for {sport.name} will be implemented here.
                    This will include the FT Builder integration and schedule matrix.
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {sport.name} Analytics
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    COMPASS analytics and performance metrics for {sport.name} will be displayed here.
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {sport.name} Championships
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Championship information, bracket, and tournament details for {sport.name}.
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>
          </motion.div>
        </AnimatePresence>
      </Container>
    </motion.div>
  );
};

export default SportPage;