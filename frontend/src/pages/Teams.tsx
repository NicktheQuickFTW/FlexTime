/**
 * Teams Management Page - FlexTime Big 12 Conference
 * 
 * Comprehensive team management interface with Big 12 Conference branding,
 * CRUD operations, sport filtering, and conference affiliation tracking.
 * 
 * Following [Playbook: Frontend Enhancement Suite] design principles.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Alert,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Sports as SportsIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  Group as GroupIcon,
  School as SchoolIcon,
  Assessment as StatsIcon,
  Verified as VerifiedIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

// Enhanced interfaces following FlexTime architecture
interface Team {
  id: string;
  name: string;
  school: string;
  sport: string;
  conference: string;
  division?: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  location: {
    city: string;
    state: string;
  };
  venue: string;
  coach: string;
  founded: number;
  championships: number;
  currentRanking?: number;
  status: 'active' | 'inactive' | 'suspended';
  stats: {
    wins: number;
    losses: number;
    ties?: number;
  };
}

// Big 12 Conference Schools Data
const BIG12_SCHOOLS = [
  'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
  'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

const SPORTS_LIST = [
  'Football', 'Men\'s Basketball', 'Women\'s Basketball', 'Baseball', 'Softball',
  'Soccer', 'Volleyball', 'Tennis', 'Golf', 'Track & Field', 'Swimming', 
  'Wrestling', 'Gymnastics', 'Lacrosse'
];

const Teams: React.FC = () => {
  const theme = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState('All');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  // Mock data generation
  useEffect(() => {
    const generateMockTeams = (): Team[] => {
      const mockTeams: Team[] = [];
      
      BIG12_SCHOOLS.forEach((school) => {
        SPORTS_LIST.slice(0, 8).forEach((sport, index) => {
          mockTeams.push({
            id: `${school.toLowerCase().replace(/\s+/g, '-')}-${sport.toLowerCase().replace(/\s+/g, '-')}`,
            name: `${school} ${sport === 'Men\'s Basketball' ? 'Wildcats' : sport === 'Women\'s Basketball' ? 'Lady Wildcats' : 'Team'}`,
            school,
            sport,
            conference: 'Big 12',
            division: index % 2 === 0 ? 'Division I' : 'Division II',
            logo: `https://via.placeholder.com/60x60/0066cc/ffffff?text=${school.charAt(0)}`,
            primaryColor: '#0066cc',
            secondaryColor: '#ffffff',
            location: {
              city: school === 'Arizona' ? 'Tucson' : school === 'Arizona State' ? 'Tempe' : 'City',
              state: school.includes('Arizona') ? 'AZ' : school === 'Colorado' ? 'CO' : 'State'
            },
            venue: `${school} Arena`,
            coach: `Coach ${school.split(' ')[0]}`,
            founded: 1950 + Math.floor(Math.random() * 50),
            championships: Math.floor(Math.random() * 5),
            currentRanking: Math.random() > 0.7 ? Math.floor(Math.random() * 25) + 1 : undefined,
            status: Math.random() > 0.1 ? 'active' : 'inactive',
            stats: {
              wins: Math.floor(Math.random() * 30),
              losses: Math.floor(Math.random() * 10),
              ties: Math.random() > 0.8 ? Math.floor(Math.random() * 3) : undefined
            }
          });
        });
      });
      
      return mockTeams;
    };

    setTimeout(() => {
      setTeams(generateMockTeams());
      setLoading(false);
    }, 1000);
  }, []);

  // Filtered teams based on search and filters
  const filteredTeams = useMemo(() => {
    return teams.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           team.sport.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = selectedSport === 'All' || team.sport === selectedSport;
      const matchesSchool = selectedSchool === 'All' || team.school === selectedSchool;
      
      return matchesSearch && matchesSport && matchesSchool;
    });
  }, [teams, searchTerm, selectedSport, selectedSchool]);

  // Stats for summary cards
  const stats = useMemo(() => ({
    total: teams.length,
    active: teams.filter(t => t.status === 'active').length,
    sports: new Set(teams.map(t => t.sport)).size,
    schools: new Set(teams.map(t => t.school)).size
  }), [teams]);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, team: Team) => {
    setAnchorEl(event.currentTarget);
    setSelectedTeam(team);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTeam(null);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = (team: Team) => {
    setTeams(teams.filter(t => t.id !== team.id));
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'inactive': return theme.palette.warning.main;
      case 'suspended': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  };

  const TeamCard: React.FC<{ team: Team; index: number }> = ({ team, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        sx={{
          height: '100%',
          background: theme.palette.mode === 'dark' 
            ? 'rgba(17, 25, 40, 0.75)'
            : 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
          borderRadius: 3,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 16px 48px rgba(0, 191, 255, 0.15)'
              : '0 16px 48px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${theme.palette.primary.main}30`
          }
        }}
      >
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Avatar
              src={team.logo}
              sx={{
                width: 48,
                height: 48,
                mr: 2,
                bgcolor: team.primaryColor,
                border: `2px solid ${theme.palette.primary.main}20`
              }}
            >
              <SchoolIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: theme.palette.text.primary,
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {team.school}
                </Typography>
                {team.currentRanking && (
                  <Tooltip title={`Ranked #${team.currentRanking}`}>
                    <Badge 
                      badgeContent={team.currentRanking} 
                      color="primary"
                      sx={{ ml: 1 }}
                    >
                      <StarIcon fontSize="small" color="primary" />
                    </Badge>
                  </Tooltip>
                )}
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: '0.85rem' }}
              >
                {team.sport}
              </Typography>
              <Chip
                label={team.status}
                size="small"
                sx={{
                  mt: 1,
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: getStatusColor(team.status),
                  color: 'white',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, team)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Team Stats */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 191, 255, 0.05)'
              : 'rgba(0, 102, 204, 0.03)',
            borderRadius: 2,
            p: 1.5,
            mb: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                W-L
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {team.stats.wins}-{team.stats.losses}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Coach
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {team.coach.split(' ')[1]}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Titles
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {team.championships}
              </Typography>
            </Box>
          </Box>

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography variant="caption">
              {team.location.city}, {team.location.state}
            </Typography>
          </Box>
        </CardContent>

        <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<StatsIcon />}
            sx={{ 
              color: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            View Stats
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(team)}
            sx={{ 
              color: theme.palette.text.secondary,
              textTransform: 'none'
            }}
          >
            Edit
          </Button>
        </CardActions>
      </Card>
    </motion.div>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(90deg, #00bfff 0%, #0088ff 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1
          }}
        >
          Team Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage all Big 12 Conference teams across multiple sports
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Teams', value: stats.total, icon: GroupIcon, color: '#00bfff' },
          { label: 'Active Teams', value: stats.active, icon: VerifiedIcon, color: '#28a745' },
          { label: 'Sports', value: stats.sports, icon: SportsIcon, color: '#ff6b35' },
          { label: 'Schools', value: stats.schools, icon: SchoolIcon, color: '#9c27b0' }
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Paper
              sx={{
                p: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(17, 25, 40, 0.75)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${stat.color}, ${stat.color}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <stat.icon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                  {loading ? <Skeleton width={40} /> : stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        gap: 2,
        mb: 3,
        alignItems: { md: 'center' }
      }}>
        <TextField
          placeholder="Search teams, schools, or sports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: { md: 400 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(255, 255, 255, 0.8)',
              borderRadius: 2
            }
          }}
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Sport</InputLabel>
            <Select
              value={selectedSport}
              label="Sport"
              onChange={(e) => setSelectedSport(e.target.value)}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <MenuItem value="All">All Sports</MenuItem>
              {SPORTS_LIST.map(sport => (
                <MenuItem key={sport} value={sport}>{sport}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>School</InputLabel>
            <Select
              value={selectedSchool}
              label="School"
              onChange={(e) => setSelectedSchool(e.target.value)}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(255, 255, 255, 0.8)',
              }}
            >
              <MenuItem value="All">All Schools</MenuItem>
              {BIG12_SCHOOLS.map(school => (
                <MenuItem key={school} value={school}>{school}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingTeam(null);
              setIsDialogOpen(true);
            }}
            sx={{
              background: 'linear-gradient(135deg, #00bfff, #0088ff)',
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Add Team
          </Button>
        </Box>
      </Box>

      {/* Teams Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredTeams.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(33, 150, 243, 0.1)'
              : 'rgba(33, 150, 243, 0.05)',
            borderRadius: 3
          }}
        >
          No teams found matching your search criteria.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredTeams.map((team, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={team.id}>
                <TeamCard team={team} index={index} />
              </Grid>
            ))}
          </AnimatePresence>
        </Grid>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(17, 25, 40, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderRadius: 2
          }
        }}
      >
        <MenuItem onClick={() => selectedTeam && handleEdit(selectedTeam)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Team</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedTeam && handleDelete(selectedTeam)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>
            Delete Team
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: theme.palette.mode === 'dark' 
              ? 'rgba(17, 25, 40, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
            borderRadius: 3
          }
        }}
      >
        <DialogTitle>
          {editingTeam ? 'Edit Team' : 'Add New Team'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Team form would go here with all necessary fields for creating/editing teams.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00bfff, #0088ff)',
              textTransform: 'none'
            }}
          >
            {editingTeam ? 'Update' : 'Create'} Team
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Teams;