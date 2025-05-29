/**
 * Big 12 Conference Branding System for FlexTime
 * 
 * Features:
 * - Dynamic team logo integration
 * - Conference-specific color schemes
 * - Customizable dashboard layouts
 * - Sport-specific interface adaptations
 * - Responsive branding elements
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Stack,
  Divider,
  LinearProgress,
  Badge,
  alpha,
  styled
} from '@mui/material';
import {
  Home as HomeIcon,
  Flight as AwayIcon,
  EmojiEvents as TrophyIcon,
  Star as StarIcon,
  TrendingUp as TrendingIcon,
  Sports as SportsIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

// Big 12 Team Definitions with comprehensive branding data
export interface Big12Team {
  id: string;
  name: string;
  shortName: string;
  abbreviation: string;
  nickname: string;
  location: string;
  state: string;
  founded: number;
  conference: 'Big 12';
  division?: 'North' | 'South';
  colors: {
    primary: string;
    secondary: string;
    accent?: string;
    text: string;
  };
  logos: {
    primary: string;
    secondary?: string;
    wordmark?: string;
    helmet?: string; // For football
    darkMode?: string;
    lightMode?: string;
  };
  branding: {
    fonts: string[];
    patterns?: string[];
    hexPattern?: string;
  };
  venue: {
    name: string;
    capacity: number;
    surface?: string;
  };
  socialMedia: {
    twitter?: string;
    instagram?: string;
    facebook?: string;
  };
  rivalries: string[]; // Team IDs of primary rivals
  championships: {
    national: number;
    conference: number;
    recent: string[];
  };
}

// Big 12 Teams Data
export const BIG12_TEAMS: Record<string, Big12Team> = {
  arizona: {
    id: 'arizona',
    name: 'University of Arizona',
    shortName: 'Arizona',
    abbreviation: 'ARIZ',
    nickname: 'Wildcats',
    location: 'Tucson',
    state: 'Arizona',
    founded: 1885,
    conference: 'Big 12',
    colors: {
      primary: '#003366',
      secondary: '#CC0033',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/arizona.svg',
      darkMode: '/assets/logos/teams/dark/arizona-dark.svg',
      lightMode: '/assets/logos/teams/light/arizona-light.svg'
    },
    branding: {
      fonts: ['Arial', 'Helvetica', 'sans-serif']
    },
    venue: {
      name: 'Arizona Stadium',
      capacity: 50782
    },
    socialMedia: {
      twitter: '@ArizonaFBall',
      instagram: '@arizonafootball'
    },
    rivalries: ['arizona_state'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  arizona_state: {
    id: 'arizona_state',
    name: 'Arizona State University',
    shortName: 'Arizona State',
    abbreviation: 'ASU',
    nickname: 'Sun Devils',
    location: 'Tempe',
    state: 'Arizona',
    founded: 1885,
    conference: 'Big 12',
    colors: {
      primary: '#8C1D40',
      secondary: '#FFC627',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/arizona_state.svg',
      darkMode: '/assets/logos/teams/dark/arizona_state-dark.svg',
      lightMode: '/assets/logos/teams/light/arizona_state-light.svg'
    },
    branding: {
      fonts: ['Futura', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Sun Devil Stadium',
      capacity: 53599
    },
    socialMedia: {
      twitter: '@ASUFootball',
      instagram: '@asufootball'
    },
    rivalries: ['arizona'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  baylor: {
    id: 'baylor',
    name: 'Baylor University',
    shortName: 'Baylor',
    abbreviation: 'BAY',
    nickname: 'Bears',
    location: 'Waco',
    state: 'Texas',
    founded: 1845,
    conference: 'Big 12',
    colors: {
      primary: '#003015',
      secondary: '#FFB81C',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/baylor.svg',
      secondary: '/assets/logos/teams/baylor-gold.svg',
      darkMode: '/assets/logos/teams/dark/baylor-dark.svg',
      lightMode: '/assets/logos/teams/light/baylor-light.svg'
    },
    branding: {
      fonts: ['Times New Roman', 'serif']
    },
    venue: {
      name: 'McLane Stadium',
      capacity: 45140
    },
    socialMedia: {
      twitter: '@BUFootball',
      instagram: '@bufootball'
    },
    rivalries: ['tcu', 'texas_tech'],
    championships: {
      national: 0,
      conference: 1,
      recent: ['2021 Big 12']
    }
  },
  byu: {
    id: 'byu',
    name: 'Brigham Young University',
    shortName: 'BYU',
    abbreviation: 'BYU',
    nickname: 'Cougars',
    location: 'Provo',
    state: 'Utah',
    founded: 1875,
    conference: 'Big 12',
    colors: {
      primary: '#002E5D',
      secondary: '#FFFFFF',
      accent: '#0062B8',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/byu.svg',
      darkMode: '/assets/logos/teams/dark/byu-dark.svg',
      lightMode: '/assets/logos/teams/light/byu-light.svg'
    },
    branding: {
      fonts: ['Gotham', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'LaVell Edwards Stadium',
      capacity: 63470
    },
    socialMedia: {
      twitter: '@BYUfootball',
      instagram: '@byufootball'
    },
    rivalries: ['utah', 'utah_state'],
    championships: {
      national: 1,
      conference: 0,
      recent: ['1984 National Championship']
    }
  },
  cincinnati: {
    id: 'cincinnati',
    name: 'University of Cincinnati',
    shortName: 'Cincinnati',
    abbreviation: 'CIN',
    nickname: 'Bearcats',
    location: 'Cincinnati',
    state: 'Ohio',
    founded: 1819,
    conference: 'Big 12',
    colors: {
      primary: '#E00122',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/cincinnati.svg',
      darkMode: '/assets/logos/teams/dark/cincinnati-dark.svg',
      lightMode: '/assets/logos/teams/light/cincinnati-light.svg'
    },
    branding: {
      fonts: ['Helvetica Neue', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Nippert Stadium',
      capacity: 40000
    },
    socialMedia: {
      twitter: '@GoBearcatsFB',
      instagram: '@uofcfootball'
    },
    rivalries: ['houston', 'ucf'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  colorado: {
    id: 'colorado',
    name: 'University of Colorado',
    shortName: 'Colorado',
    abbreviation: 'COL',
    nickname: 'Buffaloes',
    location: 'Boulder',
    state: 'Colorado',
    founded: 1876,
    conference: 'Big 12',
    colors: {
      primary: '#000000',
      secondary: '#CFB87C',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/colorado.svg',
      darkMode: '/assets/logos/teams/dark/colorado-dark.svg',
      lightMode: '/assets/logos/teams/light/colorado-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Folsom Field',
      capacity: 50183
    },
    socialMedia: {
      twitter: '@CUBuffsFootball',
      instagram: '@cubuffsfootball'
    },
    rivalries: ['colorado_state', 'nebraska'],
    championships: {
      national: 1,
      conference: 0,
      recent: ['1990 National Championship']
    }
  },
  houston: {
    id: 'houston',
    name: 'University of Houston',
    shortName: 'Houston',
    abbreviation: 'HOU',
    nickname: 'Cougars',
    location: 'Houston',
    state: 'Texas',
    founded: 1927,
    conference: 'Big 12',
    colors: {
      primary: '#C8102E',
      secondary: '#FFFFFF',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/houston.svg',
      darkMode: '/assets/logos/teams/dark/houston-dark.svg',
      lightMode: '/assets/logos/teams/light/houston-light.svg'
    },
    branding: {
      fonts: ['Univers', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'TDECU Stadium',
      capacity: 40000
    },
    socialMedia: {
      twitter: '@UHCougarFB',
      instagram: '@uhcougarfb'
    },
    rivalries: ['cincinnati', 'ucf'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  iowa_state: {
    id: 'iowa_state',
    name: 'Iowa State University',
    shortName: 'Iowa State',
    abbreviation: 'ISU',
    nickname: 'Cyclones',
    location: 'Ames',
    state: 'Iowa',
    founded: 1858,
    conference: 'Big 12',
    colors: {
      primary: '#C8102E',
      secondary: '#F1BE48',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/iowa_state.svg',
      darkMode: '/assets/logos/teams/dark/iowa_state-dark.svg',
      lightMode: '/assets/logos/teams/light/iowa_state-light.svg'
    },
    branding: {
      fonts: ['Interstate', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Jack Trice Stadium',
      capacity: 61500
    },
    socialMedia: {
      twitter: '@CycloneFB',
      instagram: '@cyclonefb'
    },
    rivalries: ['iowa', 'kansas_state'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  kansas: {
    id: 'kansas',
    name: 'University of Kansas',
    shortName: 'Kansas',
    abbreviation: 'KU',
    nickname: 'Jayhawks',
    location: 'Lawrence',
    state: 'Kansas',
    founded: 1865,
    conference: 'Big 12',
    colors: {
      primary: '#0051BA',
      secondary: '#E8000D',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/kansas.svg',
      darkMode: '/assets/logos/teams/dark/kansas-dark.svg',
      lightMode: '/assets/logos/teams/light/kansas-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'David Booth Kansas Memorial Stadium',
      capacity: 47233
    },
    socialMedia: {
      twitter: '@KUFootball',
      instagram: '@kufootball'
    },
    rivalries: ['kansas_state', 'missouri'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  kansas_state: {
    id: 'kansas_state',
    name: 'Kansas State University',
    shortName: 'Kansas State',
    abbreviation: 'KSU',
    nickname: 'Wildcats',
    location: 'Manhattan',
    state: 'Kansas',
    founded: 1863,
    conference: 'Big 12',
    colors: {
      primary: '#512888',
      secondary: '#FFFFFF',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/kansas_state.svg',
      darkMode: '/assets/logos/teams/dark/kansas_state-dark.svg',
      lightMode: '/assets/logos/teams/light/kansas_state-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Bill Snyder Family Stadium',
      capacity: 50000
    },
    socialMedia: {
      twitter: '@KStateFB',
      instagram: '@kstatefb'
    },
    rivalries: ['kansas', 'iowa_state'],
    championships: {
      national: 0,
      conference: 1,
      recent: ['2012 Big 12']
    }
  },
  oklahoma_state: {
    id: 'oklahoma_state',
    name: 'Oklahoma State University',
    shortName: 'Oklahoma State',
    abbreviation: 'OSU',
    nickname: 'Cowboys',
    location: 'Stillwater',
    state: 'Oklahoma',
    founded: 1890,
    conference: 'Big 12',
    colors: {
      primary: '#FF7300',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/oklahoma_state.svg',
      darkMode: '/assets/logos/teams/dark/oklahoma_state-dark.svg',
      lightMode: '/assets/logos/teams/light/oklahoma_state-light.svg'
    },
    branding: {
      fonts: ['Akzidenz-Grotesk', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Boone Pickens Stadium',
      capacity: 60218
    },
    socialMedia: {
      twitter: '@CowboyFB',
      instagram: '@okstatesports'
    },
    rivalries: ['oklahoma', 'texas'],
    championships: {
      national: 0,
      conference: 1,
      recent: ['2011 Big 12']
    }
  },
  tcu: {
    id: 'tcu',
    name: 'Texas Christian University',
    shortName: 'TCU',
    abbreviation: 'TCU',
    nickname: 'Horned Frogs',
    location: 'Fort Worth',
    state: 'Texas',
    founded: 1873,
    conference: 'Big 12',
    colors: {
      primary: '#4D1979',
      secondary: '#A3A3A3',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/tcu.svg',
      darkMode: '/assets/logos/teams/dark/tcu-dark.svg',
      lightMode: '/assets/logos/teams/light/tcu-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Amon G. Carter Stadium',
      capacity: 50000
    },
    socialMedia: {
      twitter: '@TCUFootball',
      instagram: '@tcufootball'
    },
    rivalries: ['baylor', 'smu'],
    championships: {
      national: 2,
      conference: 1,
      recent: ['2022 Big 12', '2010 Rose Bowl']
    }
  },
  texas_tech: {
    id: 'texas_tech',
    name: 'Texas Tech University',
    shortName: 'Texas Tech',
    abbreviation: 'TTU',
    nickname: 'Red Raiders',
    location: 'Lubbock',
    state: 'Texas',
    founded: 1923,
    conference: 'Big 12',
    colors: {
      primary: '#CC0000',
      secondary: '#000000',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/texas_tech.svg',
      darkMode: '/assets/logos/teams/dark/texas_tech-dark.svg',
      lightMode: '/assets/logos/teams/light/texas_tech-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Jones AT&T Stadium',
      capacity: 60454
    },
    socialMedia: {
      twitter: '@TexasTechFB',
      instagram: '@texastechfb'
    },
    rivalries: ['texas', 'baylor'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  },
  ucf: {
    id: 'ucf',
    name: 'University of Central Florida',
    shortName: 'UCF',
    abbreviation: 'UCF',
    nickname: 'Knights',
    location: 'Orlando',
    state: 'Florida',
    founded: 1963,
    conference: 'Big 12',
    colors: {
      primary: '#000000',
      secondary: '#FFD700',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/ucf.svg',
      darkMode: '/assets/logos/teams/dark/ucf-dark.svg',
      lightMode: '/assets/logos/teams/light/ucf-light.svg'
    },
    branding: {
      fonts: ['Gotham', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'FBC Mortgage Stadium',
      capacity: 44206
    },
    socialMedia: {
      twitter: '@UCF_Football',
      instagram: '@ucf_football'
    },
    rivalries: ['cincinnati', 'houston'],
    championships: {
      national: 1,
      conference: 0,
      recent: ['2017 Peach Bowl']
    }
  },
  utah: {
    id: 'utah',
    name: 'University of Utah',
    shortName: 'Utah',
    abbreviation: 'UTAH',
    nickname: 'Utes',
    location: 'Salt Lake City',
    state: 'Utah',
    founded: 1850,
    conference: 'Big 12',
    colors: {
      primary: '#CC0000',
      secondary: '#FFFFFF',
      accent: '#000000',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/utah.svg',
      darkMode: '/assets/logos/teams/dark/utah-dark.svg',
      lightMode: '/assets/logos/teams/light/utah-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Rice-Eccles Stadium',
      capacity: 51444
    },
    socialMedia: {
      twitter: '@Utah_Football',
      instagram: '@utah_football'
    },
    rivalries: ['byu', 'colorado'],
    championships: {
      national: 0,
      conference: 2,
      recent: ['2021 Pac-12', '2022 Pac-12']
    }
  },
  west_virginia: {
    id: 'west_virginia',
    name: 'West Virginia University',
    shortName: 'West Virginia',
    abbreviation: 'WVU',
    nickname: 'Mountaineers',
    location: 'Morgantown',
    state: 'West Virginia',
    founded: 1867,
    conference: 'Big 12',
    colors: {
      primary: '#002855',
      secondary: '#EAAA00',
      accent: '#FFFFFF',
      text: '#FFFFFF'
    },
    logos: {
      primary: '/assets/logos/teams/west_virginia.svg',
      darkMode: '/assets/logos/teams/dark/west_virginia-dark.svg',
      lightMode: '/assets/logos/teams/light/west_virginia-light.svg'
    },
    branding: {
      fonts: ['Trajan Pro', 'Arial', 'sans-serif']
    },
    venue: {
      name: 'Milan Puskar Stadium',
      capacity: 60000
    },
    socialMedia: {
      twitter: '@WVUfootball',
      instagram: '@wvufootball'
    },
    rivalries: ['pitt', 'virginia_tech'],
    championships: {
      national: 0,
      conference: 0,
      recent: []
    }
  }
};

// Styled Components for Big 12 Branding
const Big12Card = styled(Card)(({ theme, teamcolor }) => ({
  background: `linear-gradient(135deg, ${alpha(teamcolor || theme.palette.primary.main, 0.1)}, ${alpha(teamcolor || theme.palette.primary.main, 0.05)})`,
  border: `2px solid ${alpha(teamcolor || theme.palette.primary.main, 0.3)}`,
  borderRadius: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${teamcolor || theme.palette.primary.main}, ${alpha(teamcolor || theme.palette.primary.main, 0.7)})`,
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: `0 12px 40px ${alpha(teamcolor || theme.palette.primary.main, 0.3)}`,
  }
}));

const TeamLogo = styled(Avatar)(({ theme, teamcolor }) => ({
  width: 60,
  height: 60,
  border: `3px solid ${teamcolor || theme.palette.primary.main}`,
  boxShadow: `0 4px 20px ${alpha(teamcolor || theme.palette.primary.main, 0.3)}`,
  backgroundColor: theme.palette.background.paper,
  '&:hover': {
    transform: 'scale(1.1)',
    transition: 'transform 0.2s ease'
  }
}));

// Team Card Component
interface TeamCardProps {
  team: Big12Team;
  variant?: 'compact' | 'full' | 'stats';
  showStats?: boolean;
  onClick?: (team: Big12Team) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  variant = 'compact',
  showStats = false,
  onClick
}) => {
  const theme = useTheme();

  const handleClick = () => {
    if (onClick) onClick(team);
  };

  if (variant === 'compact') {
    return (
      <Box
        onClick={handleClick}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          p: 1,
          borderRadius: 2,
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? {
            backgroundColor: alpha(team.colors.primary, 0.1)
          } : {}
        }}
      >
        <TeamLogo
          src={team.logos.primary}
          teamcolor={team.colors.primary}
          sx={{ width: 32, height: 32 }}
        >
          {team.abbreviation}
        </TeamLogo>
        <Typography variant="body2" fontWeight={600}>
          {team.shortName}
        </Typography>
      </Box>
    );
  }

  return (
    <Big12Card teamcolor={team.colors.primary} onClick={handleClick}>
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <TeamLogo
            src={team.logos.primary}
            teamcolor={team.colors.primary}
          >
            {team.abbreviation}
          </TeamLogo>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {team.shortName}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {team.nickname} • {team.location}, {team.state}
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                label={team.conference}
                size="small"
                sx={{
                  backgroundColor: '#003366',
                  color: '#FFB81C',
                  fontWeight: 600
                }}
              />
              {team.division && (
                <Chip
                  label={team.division}
                  size="small"
                  variant="outlined"
                />
              )}
            </Stack>
          </Box>
        </Box>

        {variant === 'full' && (
          <>
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Home Venue
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {team.venue.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Capacity: {team.venue.capacity.toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">
                  Founded
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {team.founded}
                </Typography>
              </Grid>
            </Grid>

            {showStats && team.championships.recent.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" color="text.secondary">
                  Recent Championships
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                  {team.championships.recent.map((championship, index) => (
                    <Chip
                      key={index}
                      label={championship}
                      size="small"
                      icon={<TrophyIcon sx={{ fontSize: 14 }} />}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Stack>
              </>
            )}
          </>
        )}
      </CardContent>
    </Big12Card>
  );
};

// Big 12 Conference Header Component
export const Big12Header: React.FC = () => {
  const theme = useTheme();
  
  return (
    <Paper
      sx={{
        background: 'linear-gradient(135deg, #003366 0%, #001A33 100%)',
        color: '#FFFFFF',
        p: 3,
        borderRadius: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: `radial-gradient(circle, ${alpha('#FFB81C', 0.2)} 0%, transparent 70%)`,
          transform: 'translate(50%, -50%)'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
        <Avatar
          src="/assets/logos/conferences/big_12_primary.svg"
          sx={{ 
            width: 80, 
            height: 80,
            backgroundColor: '#FFB81C',
            border: '3px solid #FFB81C'
          }}
        >
          B12
        </Avatar>
        
        <Box>
          <Typography variant="h3" fontWeight={800} gutterBottom>
            Big 12 Conference
          </Typography>
          <Typography variant="h6" color="#FFB81C" gutterBottom>
            FlexTime Scheduling System
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Intelligent scheduling for 16 member institutions across multiple sports
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

// Team Selector Component
interface TeamSelectorProps {
  selectedTeams: string[];
  onTeamSelect: (teamIds: string[]) => void;
  multiSelect?: boolean;
  sport?: string;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeams,
  onTeamSelect,
  multiSelect = true,
  sport
}) => {
  const availableTeams = useMemo(() => {
    // Filter teams based on sport participation if needed
    return Object.values(BIG12_TEAMS);
  }, [sport]);

  const handleTeamClick = (teamId: string) => {
    if (multiSelect) {
      const newSelection = selectedTeams.includes(teamId)
        ? selectedTeams.filter(id => id !== teamId)
        : [...selectedTeams, teamId];
      onTeamSelect(newSelection);
    } else {
      onTeamSelect([teamId]);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Select Teams {sport && `(${sport})`}
      </Typography>
      
      <Grid container spacing={2}>
        {availableTeams.map(team => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={team.id}>
            <TeamCard
              team={team}
              variant="compact"
              onClick={() => handleTeamClick(team.id)}
            />
            {selectedTeams.includes(team.id) && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                <Chip
                  label="Selected"
                  size="small"
                  color="primary"
                  icon={<StarIcon sx={{ fontSize: 14 }} />}
                />
              </Box>
            )}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

// Conference Standings Component
interface ConferenceStandingsProps {
  sport: string;
  standings: Array<{
    teamId: string;
    wins: number;
    losses: number;
    conferenceWins: number;
    conferenceLosses: number;
    streak?: string;
  }>;
}

export const ConferenceStandings: React.FC<ConferenceStandingsProps> = ({
  sport,
  standings
}) => {
  const theme = useTheme();
  
  const sortedStandings = useMemo(() => {
    return standings.sort((a, b) => {
      const aWinPct = a.conferenceWins / (a.conferenceWins + a.conferenceLosses);
      const bWinPct = b.conferenceWins / (b.conferenceWins + b.conferenceLosses);
      return bWinPct - aWinPct;
    });
  }, [standings]);

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Big 12 {sport} Standings
      </Typography>
      
      <Grid container spacing={1} sx={{ mb: 2 }}>
        <Grid item xs={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            #
          </Typography>
        </Grid>
        <Grid item xs={5}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Team
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Conf
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Overall
          </Typography>
        </Grid>
        <Grid item xs={2}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Streak
          </Typography>
        </Grid>
      </Grid>
      
      {sortedStandings.map((standing, index) => {
        const team = BIG12_TEAMS[standing.teamId];
        if (!team) return null;
        
        return (
          <Grid container spacing={1} key={team.id} sx={{ 
            py: 1,
            backgroundColor: index % 2 === 0 ? alpha(theme.palette.primary.main, 0.02) : 'transparent',
            borderRadius: 1
          }}>
            <Grid item xs={1}>
              <Typography variant="body2" fontWeight={600}>
                {index + 1}
              </Typography>
            </Grid>
            <Grid item xs={5}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  src={team.logos.primary}
                  sx={{ width: 24, height: 24 }}
                >
                  {team.abbreviation}
                </Avatar>
                <Typography variant="body2" fontWeight={600}>
                  {team.shortName}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">
                {standing.conferenceWins}-{standing.conferenceLosses}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2">
                {standing.wins}-{standing.losses}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <Typography variant="body2" color="text.secondary">
                {standing.streak || '-'}
              </Typography>
            </Grid>
          </Grid>
        );
      })}
    </Paper>
  );
};

// Export all components and data
export {
  BIG12_TEAMS,
  Big12Card,
  TeamLogo
};

export default {
  TeamCard,
  Big12Header,
  TeamSelector,
  ConferenceStandings,
  BIG12_TEAMS
};