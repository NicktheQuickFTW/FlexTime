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
  Skeleton,
  Badge
} from '@mui/material';
import {
  School as SchoolIcon,
  SportsSoccer as SportsIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  Group as TeamIcon,
  LocationOn as LocationIcon,
  EmojiEvents as TrophyIcon,
  Assessment as AnalyticsIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useThemeContext } from '../../contexts/ThemeContext';
import { useAnimation } from '../../contexts/AnimationContext';

// School data mapping with correct school_ids from HELiiX Neon database
// Based on official Big 12 School Branding 2025.csv
export const SCHOOL_DATA = {
  1: { // University of Arizona
    officialName: 'The University of Arizona',
    displayName: 'University of Arizona',
    shortName: 'Arizona',
    abbreviation: 'U of A',
    mascot: 'Wildcats',
    mascotNames: 'Wilbur & Wilma',
    colors: {
      primary: '#AB0520',
      secondary: '#0C234B',
      tertiary: '#FFFFFF'
    },
    hashtags: ['#beardown'],
    location: 'Tucson, Arizona',
    conference: 'Big 12',
    founded: '1885',
    enrollment: '47,000+',
    icon: '🐾',
    totalSports: 18
  },
  2: { // Arizona State University
    officialName: 'Arizona State University',
    displayName: 'Arizona State University',
    shortName: 'Arizona State',
    abbreviation: 'ASU',
    mascot: 'Sun Devils',
    mascotNames: 'Sparky',
    colors: {
      primary: '#8C1D40',
      secondary: '#FFC627',
      tertiary: '#000000'
    },
    hashtags: ['#ForksUp', '#O2V', '#FeartheFork', '#ActivatetheValley'],
    location: 'Tempe, Arizona',
    conference: 'Big 12',
    founded: '1885',
    enrollment: '80,000+',
    icon: '😈',
    totalSports: 19
  },
  3: { // Baylor University
    officialName: 'Baylor University',
    displayName: 'Baylor University',
    shortName: 'Baylor Bears',
    abbreviation: 'BU',
    mascot: 'Bears',
    mascotNames: 'Bruiser & Marigold',
    colors: {
      primary: '#154734',
      secondary: '#FFB81C',
      tertiary: '#FFFFFF'
    },
    hashtags: ['#SICEM'],
    location: 'Waco, Texas',
    conference: 'Big 12',
    founded: '1845',
    enrollment: '20,000+',
    icon: '🐻',
    totalSports: 19
  },
  4: { // Brigham Young University
    officialName: 'Brigham Young University',
    displayName: 'Brigham Young University',
    shortName: 'BYU Cougars',
    abbreviation: 'BYU',
    mascot: 'Cougars',
    mascotNames: 'Cosmo',
    colors: {
      primary: '#002654',
      secondary: '#FFFFFF',
      tertiary: '#000000'
    },
    hashtags: ['#GoCougs'],
    location: 'Provo, Utah',
    conference: 'Big 12',
    founded: '1875',
    enrollment: '33,000+',
    icon: '🦁',
    totalSports: 17
  },
  5: { // University of Central Florida
    officialName: 'University of Central Florida',
    displayName: 'University of Central Florida',
    shortName: 'UCF',
    abbreviation: 'UCF',
    mascot: 'Knights',
    mascotNames: 'Knightro',
    colors: {
      primary: '#BA9B37',
      secondary: '#000000',
      tertiary: '#FFFFFF'
    },
    hashtags: ['#ChargeOn'],
    location: 'Orlando, Florida',
    conference: 'Big 12',
    founded: '1963',
    enrollment: '68,000+',
    icon: '⚔️',
    totalSports: 16
  },
  6: { // University of Cincinnati
    officialName: 'University of Cincinnati',
    displayName: 'University of Cincinnati',
    shortName: 'Cincinnati',
    abbreviation: 'UC',
    mascot: 'Bearcats',
    mascotNames: 'Bearcat',
    colors: {
      primary: '#E00122',
      secondary: '#000000',
      tertiary: '#FFFFFF'
    },
    hashtags: ['#GoBearcats'],
    location: 'Cincinnati, Ohio',
    conference: 'Big 12',
    founded: '1819',
    enrollment: '46,000+',
    icon: '🐱',
    totalSports: 18
  },
  7: { // University of Colorado
    officialName: 'University of Colorado',
    displayName: 'University of Colorado',
    shortName: 'Colorado',
    abbreviation: 'CU',
    mascot: 'Buffaloes',
    mascotNames: 'Ralphie',
    colors: {
      primary: '#CFB87C',
      secondary: '#000000',
      tertiary: '#A2A4A3'
    },
    hashtags: ['#GoBuffs'],
    location: 'Boulder, Colorado',
    conference: 'Big 12',
    founded: '1876',
    enrollment: '37,000+',
    icon: '🦬',
    totalSports: 17
  },
  8: { // University of Houston
    officialName: 'University of Houston',
    displayName: 'University of Houston',
    shortName: 'Houston Cougars',
    abbreviation: 'UH',
    mascot: 'Cougars',
    mascotNames: 'Shasta & Sasha',
    colors: {
      primary: '#C8102E',
      secondary: '#FFFFFF',
      tertiary: '#000000'
    },
    hashtags: ['#GoCoogs', '#ForTheCity'],
    location: 'Houston, Texas',
    conference: 'Big 12',
    founded: '1927',
    enrollment: '47,000+',
    icon: '🐅',
    totalSports: 16
  },
  9: { // Iowa State University
    officialName: 'Iowa State University',
    displayName: 'Iowa State University',
    shortName: 'Iowa State',
    abbreviation: 'ISU',
    mascot: 'Cyclones',
    mascotNames: 'Cy',
    colors: {
      primary: '#A72433',
      secondary: '#FDC847',
      tertiary: '#FADB63'
    },
    hashtags: ['#cyclONEnation'],
    location: 'Ames, Iowa',
    conference: 'Big 12',
    founded: '1858',
    enrollment: '34,000+',
    icon: '🌪️',
    totalSports: 16
  },
  10: { // University of Kansas
    officialName: 'University of Kansas',
    displayName: 'University of Kansas',
    shortName: 'Kansas',
    abbreviation: 'KU',
    mascot: 'Jayhawks',
    mascotNames: 'Jay & Baby Jay',
    colors: {
      primary: '#0051BA',
      secondary: '#E8000D',
      tertiary: '#FFC82D'
    },
    hashtags: ['#RockChalk', '#PayHeed'],
    location: 'Lawrence, Kansas',
    conference: 'Big 12',
    founded: '1865',
    enrollment: '28,000+',
    icon: '🦅',
    totalSports: 18
  },
  11: { // Kansas State University
    officialName: 'Kansas State University',
    displayName: 'Kansas State University',
    shortName: 'K-State',
    abbreviation: 'K-State',
    mascot: 'Wildcats',
    mascotNames: 'Willie the Wildcat',
    colors: {
      primary: '#330A57',
      secondary: '#A7A9AC',
      tertiary: '#E2E3E4'
    },
    hashtags: ['#KState', '#EMAW'],
    location: 'Manhattan, Kansas',
    conference: 'Big 12',
    founded: '1863',
    enrollment: '21,000+',
    icon: '🐾',
    totalSports: 16
  },
  12: { // Oklahoma State University
    officialName: 'Oklahoma State University',
    displayName: 'Oklahoma State University',
    shortName: 'Oklahoma State',
    abbreviation: 'OSU',
    mascot: 'Cowboys/Cowgirls',
    mascotNames: 'Pistol Pete',
    colors: {
      primary: '#FA6400',
      secondary: '#000000',
      tertiary: '#FFFFFF'
    },
    hashtags: ['#GoPokes'],
    location: 'Stillwater, Oklahoma',
    conference: 'Big 12',
    founded: '1890',
    enrollment: '25,000+',
    icon: '🤠',
    totalSports: 18
  },
  13: { // Texas Christian University
    officialName: 'Texas Christian University',
    displayName: 'Texas Christian University',
    shortName: 'TCU',
    abbreviation: 'TCU',
    mascot: 'Horned Frogs',
    mascotNames: 'Super Frog',
    colors: {
      primary: '#4D1979',
      secondary: '#FFFFFF',
      tertiary: '#000000'
    },
    hashtags: ['#GoFrogs'],
    location: 'Fort Worth, Texas',
    conference: 'Big 12',
    founded: '1873',
    enrollment: '11,000+',
    icon: '🐸',
    totalSports: 18
  },
  14: { // Texas Tech University
    officialName: 'Texas Tech University',
    displayName: 'Texas Tech University',
    shortName: 'Texas Tech',
    abbreviation: 'TTU',
    mascot: 'Red Raiders',
    mascotNames: 'Raider Red & The Masked Rider',
    colors: {
      primary: '#CC0000',
      secondary: '#000000',
      tertiary: '#FFFFFF'
    },
    hashtags: ['#WreckEm'],
    location: 'Lubbock, Texas',
    conference: 'Big 12',
    founded: '1923',
    enrollment: '40,000+',
    icon: '⚔️',
    totalSports: 17
  },
  15: { // University of Utah
    officialName: 'University of Utah',
    displayName: 'University of Utah',
    shortName: 'Utah',
    abbreviation: 'UU',
    mascot: 'Utes',
    mascotNames: 'Swoop',
    colors: {
      primary: '#BE0000',
      secondary: '#FFFFFF',
      tertiary: '#000000'
    },
    hashtags: ['#GoUtes'],
    location: 'Salt Lake City, Utah',
    conference: 'Big 12',
    founded: '1850',
    enrollment: '33,000+',
    icon: '🦅',
    totalSports: 17
  },
  16: { // West Virginia University
    officialName: 'West Virginia University',
    displayName: 'West Virginia University',
    shortName: 'West Virginia',
    abbreviation: 'WVU',
    mascot: 'Mountaineers',
    mascotNames: 'The Mountaineer',
    colors: {
      primary: '#EAAA00',
      secondary: '#002855',
      tertiary: '#707372'
    },
    hashtags: ['#HailWV'],
    location: 'Morgantown, West Virginia',
    conference: 'Big 12',
    founded: '1867',
    enrollment: '29,000+',
    icon: '⛰️',
    totalSports: 16
  }
};

interface SchoolPageProps {
  schoolId: number;
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
    id={`university-tabpanel-${index}`}
    aria-labelledby={`university-tab-${index}`}
    {...other}
  >
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const SchoolPage: React.FC<SchoolPageProps> = ({ schoolId }) => {
  const { theme } = useThemeContext();
  const { reducedMotion } = useAnimation();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [sports, setSports] = useState([]);
  const [facilities, setFacilities] = useState([]);

  const school = SCHOOL_DATA[schoolId];

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      setLoading(true);
      // Here you would fetch actual data from the API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLoading(false);
    };
    loadData();
  }, [schoolId]);

  if (!school) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" color="error">
          School not found
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
              background: `linear-gradient(135deg, ${school.colors.primary}15 0%, ${school.colors.secondary}15 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${school.colors.primary}30`,
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
                      width: 100,
                      height: 100,
                      mr: 4,
                      background: `linear-gradient(135deg, ${school.colors.primary} 0%, ${school.colors.secondary} 100%)`,
                      fontSize: '3rem',
                      border: `3px solid ${school.colors.secondary}`
                    }}
                  >
                    {school.icon}
                  </Avatar>
                  <Box>
                    <Typography variant="h3" fontWeight="bold" color="text.primary">
                      {school.displayName}
                    </Typography>
                    <Typography variant="h5" color="text.secondary" sx={{ mb: 1 }}>
                      {school.mascot} • {school.location}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip
                        icon={<SchoolIcon />}
                        label={`Founded ${school.founded}`}
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<TeamIcon />}
                        label={`${school.enrollment} Students`}
                        color="secondary"
                        variant="outlined"
                      />
                      <Chip
                        icon={<SportsIcon />}
                        label={`${school.totalSports} Sports`}
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {school.hashtags.map((hashtag, index) => (
                        <Chip
                          key={index}
                          label={hashtag}
                          size="small"
                          sx={{
                            backgroundColor: `${school.colors.primary}20`,
                            color: school.colors.primary,
                            fontWeight: 'bold'
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<ScheduleIcon />}
                    sx={{
                      background: `linear-gradient(135deg, ${school.colors.primary} 0%, ${school.colors.secondary} 100%)`,
                      color: 'white'
                    }}
                  >
                    View Schedules
                  </Button>
                  <IconButton>
                    <EditIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Quick Stats Row */}
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color={university.colors.primary}>
                      {university.totalSports}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Sports
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color={university.colors.primary}>
                      12
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Conference Rank
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color={university.colors.primary}>
                      85%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Schedule Complete
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" fontWeight="bold" color={university.colors.primary}>
                      3
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Conflicts
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
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
              <Tab icon={<SportsIcon />} label="Sports & Teams" />
              <Tab icon={<ScheduleIcon />} label="Schedules" />
              <Tab icon={<LocationIcon />} label="Facilities" />
              <Tab icon={<AnalyticsIcon />} label="Analytics" />
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
                {/* Sports Grid */}
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight="bold">
                          Sports Programs
                        </Typography>
                        <Button startIcon={<AddIcon />} variant="outlined">
                          Add Sport
                        </Button>
                      </Box>
                      
                      {loading ? (
                        <Box>
                          {[...Array(6)].map((_, i) => (
                            <Skeleton key={i} height={80} sx={{ mb: 2 }} />
                          ))}
                        </Box>
                      ) : (
                        <Grid container spacing={2}>
                          {/* Sample sports data - replace with actual API data */}
                          {[
                            { name: 'Football', season: 'Fall', teams: 1, record: '8-4' },
                            { name: 'Men\'s Basketball', season: 'Winter', teams: 1, record: '22-10' },
                            { name: 'Women\'s Basketball', season: 'Winter', teams: 1, record: '18-12' },
                            { name: 'Baseball', season: 'Spring', teams: 1, record: '35-20' },
                            { name: 'Softball', season: 'Spring', teams: 1, record: '40-15' },
                            { name: 'Volleyball', season: 'Fall', teams: 1, record: '25-8' }
                          ].map((sport, index) => (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                              <Card
                                sx={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                  }
                                }}
                              >
                                <CardContent sx={{ p: 2 }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Avatar
                                      sx={{
                                        mr: 2,
                                        width: 32,
                                        height: 32,
                                        backgroundColor: university.colors.primary
                                      }}
                                    >
                                      <SportsIcon fontSize="small" />
                                    </Avatar>
                                    <Box>
                                      <Typography variant="body1" fontWeight="bold">
                                        {sport.name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {sport.season} • {sport.record}
                                      </Typography>
                                    </Box>
                                  </Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Chip
                                      label={`${sport.teams} Team${sport.teams > 1 ? 's' : ''}`}
                                      size="small"
                                      color="primary"
                                    />
                                    <IconButton size="small">
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* University Info */}
                <Grid item xs={12} lg={4}>
                  <Card sx={{ mb: 3 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        University Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Official Name</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {university.officialName}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Mascot</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {university.mascot}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Founded</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {university.founded}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Enrollment</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {university.enrollment}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Conference</Typography>
                          <Chip
                            label={university.conference}
                            size="small"
                            color="primary"
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                        School Colors
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: university.colors.primary,
                            border: '2px solid rgba(255, 255, 255, 0.2)'
                          }}
                        />
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            backgroundColor: university.colors.secondary,
                            border: '2px solid rgba(255, 255, 255, 0.2)'
                          }}
                        />
                        {university.colors.tertiary && (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 2,
                              backgroundColor: university.colors.tertiary,
                              border: '2px solid rgba(255, 255, 255, 0.2)'
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Primary: {university.colors.primary}<br />
                        Secondary: {university.colors.secondary}
                        {university.colors.tertiary && (
                          <>
                            <br />
                            Tertiary: {university.colors.tertiary}
                          </>
                        )}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {university.shortName} Schedules
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Schedule content for {university.shortName} will be implemented here.
                    This will include all sports schedules and FT Builder integration.
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {university.shortName} Facilities
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Facilities and venues information for {university.shortName} will be displayed here.
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <Card>
                <CardContent>
                  <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
                    {university.shortName} Analytics
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    COMPASS analytics and performance metrics for {university.shortName} will be displayed here.
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

export default SchoolPage;