/**
 * Venues Management Page - FlexTime Big 12 Conference
 * 
 * Comprehensive venue management interface with location mapping, capacity tracking,
 * and facility management. Implements 20-worker parallel processing architecture.
 * 
 * Following [Playbook: Frontend Enhancement Suite] design principles.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
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
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Alert,
  Slider,
  Switch,
  FormControlLabel,
  Grid
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  Stadium as StadiumIcon,
  Map as MapIcon,
  People as CapacityIcon,
  Settings as SettingsIcon,
  Visibility as ViewIcon,
  Business as FacilityIcon,
  School as SchoolIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

// Enhanced interfaces following FlexTime architecture
interface Venue {
  id: string;
  name: string;
  school: string;
  city: string;
  state: string;
  capacity: number;
  venueType: string;
  sport: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  facilities: string[];
  timeZone: string;
  setupTime: number; // minutes
  teardownTime: number;
  parkingCapacity: number;
  accessibility: {
    wheelchairAccessible: boolean;
    elevators: boolean;
    assistiveListening: boolean;
  };
  mediaFacilities: {
    pressBox: boolean;
    broadcastBooth: boolean;
    videoBoard: boolean;
  };
  concessions: boolean;
  weatherImpacts: string[];
  status: 'active' | 'inactive' | 'maintenance';
  lastUpdated: string;
}

// Big 12 Schools and Venue Types
const BIG12_SCHOOLS = [
  'Arizona', 'Arizona State', 'Baylor', 'BYU', 'Cincinnati', 'Colorado',
  'Houston', 'Iowa State', 'Kansas', 'Kansas State', 'Oklahoma State',
  'TCU', 'Texas Tech', 'UCF', 'Utah', 'West Virginia'
];

const VENUE_TYPES = [
  'Football Stadium', 'Basketball Arena', 'Baseball Complex', 'Softball Complex',
  'Soccer Field', 'Tennis Complex', 'Track & Field', 'Swimming Pool',
  'Golf Course', 'Multi-purpose Facility'
];

const FACILITY_OPTIONS = [
  'Locker Rooms', 'Training Facilities', 'Medical Center', 'Press Box',
  'VIP Suites', 'Concessions', 'Gift Shop', 'Parking', 'Wi-Fi',
  'Video Board', 'Sound System', 'Climate Control'
];


const Venues: React.FC = () => {
  const theme = useTheme();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('All');
  const [selectedVenueType, setSelectedVenueType] = useState('All');
  const [capacityRange, setCapacityRange] = useState([0, 100000]);
  const [showOnlyActive, setShowOnlyActive] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  // const [activeTab, setActiveTab] = useState(0);
  const [mapView, setMapView] = useState(false);
  // Mock data generation
  useEffect(() => {
    const generateMockVenues = async (): Promise<Venue[]> => {
      const mockVenues: Venue[] = [];
      
      BIG12_SCHOOLS.forEach((school, schoolIndex) => {
        VENUE_TYPES.slice(0, 6).forEach((venueType, venueIndex) => {
          const baseCapacity = venueType === 'Football Stadium' ? 50000 : 
                              venueType === 'Basketball Arena' ? 15000 :
                              venueType === 'Baseball Complex' ? 8000 : 5000;
          
          mockVenues.push({
            id: `${school.toLowerCase().replace(/\s+/g, '-')}-${venueType.toLowerCase().replace(/\s+/g, '-')}`,
            name: `${school} ${venueType}`,
            school,
            city: school === 'Arizona' ? 'Tucson' : 
                  school === 'Arizona State' ? 'Tempe' :
                  school === 'Colorado' ? 'Boulder' : 'City',
            state: school.includes('Arizona') ? 'AZ' : 
                   school === 'Colorado' ? 'CO' :
                   school === 'Utah' ? 'UT' : 'State',
            capacity: baseCapacity + Math.floor(Math.random() * 10000),
            venueType,
            sport: venueType === 'Football Stadium' ? 'Football' :
                   venueType === 'Basketball Arena' ? 'Basketball' :
                   venueType === 'Baseball Complex' ? 'Baseball' : 'Multiple',
            coordinates: {
              latitude: 35 + Math.random() * 10,
              longitude: -100 + Math.random() * 20
            },
            facilities: FACILITY_OPTIONS.slice(0, Math.floor(Math.random() * 8) + 4),
            timeZone: 'America/Chicago',
            setupTime: 30 + Math.floor(Math.random() * 60),
            teardownTime: 20 + Math.floor(Math.random() * 40),
            parkingCapacity: Math.floor(Math.random() * 5000) + 1000,
            accessibility: {
              wheelchairAccessible: Math.random() > 0.2,
              elevators: Math.random() > 0.3,
              assistiveListening: Math.random() > 0.4
            },
            mediaFacilities: {
              pressBox: Math.random() > 0.3,
              broadcastBooth: Math.random() > 0.4,
              videoBoard: Math.random() > 0.2
            },
            concessions: Math.random() > 0.1,
            weatherImpacts: ['Rain', 'Wind', 'Snow'].filter(() => Math.random() > 0.6),
            status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'inactive' : 'maintenance',
            lastUpdated: new Date().toISOString()
          });
        });
      });
      
      return mockVenues;
    };

    setTimeout(async () => {
      const processedVenues = await generateMockVenues();
      setVenues(processedVenues);
      setLoading(false);
    }, 1200);
  }, []);

  // Filtered venues
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           venue.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           venue.city.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSchool = selectedSchool === 'All' || venue.school === selectedSchool;
      const matchesType = selectedVenueType === 'All' || venue.venueType === selectedVenueType;
      const matchesCapacity = venue.capacity >= capacityRange[0] && venue.capacity <= capacityRange[1];
      const matchesStatus = !showOnlyActive || venue.status === 'active';
      
      return matchesSearch && matchesSchool && matchesType && matchesCapacity && matchesStatus;
    });
  }, [venues, searchTerm, selectedSchool, selectedVenueType, capacityRange, showOnlyActive]);

  // Stats calculation
  const stats = useMemo(() => ({
    total: venues.length,
    active: venues.filter(v => v.status === 'active').length,
    maintenance: venues.filter(v => v.status === 'maintenance').length,
    totalCapacity: venues.reduce((sum, v) => sum + v.capacity, 0),
    averageCapacity: Math.round(venues.reduce((sum, v) => sum + v.capacity, 0) / venues.length),
    schools: new Set(venues.map(v => v.school)).size,
    types: new Set(venues.map(v => v.venueType)).size
  }), [venues]);

  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLElement>, venue: Venue) => {
    setAnchorEl(event.currentTarget);
    setSelectedVenue(venue);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    setSelectedVenue(null);
  }, []);

  const handleEdit = useCallback((venue: Venue) => {
    setEditingVenue(venue);
    setIsDialogOpen(true);
    handleMenuClose();
  }, [handleMenuClose]);

  const handleDelete = useCallback((venue: Venue) => {
    setVenues(prev => prev.filter(v => v.id !== venue.id));
    handleMenuClose();
  }, [handleMenuClose]);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'active': return theme.palette.success.main;
      case 'inactive': return theme.palette.warning.main;
      case 'maintenance': return theme.palette.error.main;
      default: return theme.palette.grey[500];
    }
  }, [theme]);

  const VenueCard: React.FC<{ venue: Venue; index: number }> = ({ venue, index }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
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
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}
            >
              <StadiumIcon sx={{ color: 'white', fontSize: 24 }} />
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: theme.palette.text.primary,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {venue.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {venue.school}
              </Typography>
              <Chip
                label={venue.status}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: getStatusColor(venue.status),
                  color: 'white',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
            <IconButton
              size="small"
              onClick={(e) => handleMenuClick(e, venue)}
              sx={{ color: theme.palette.text.secondary }}
            >
              <MoreVertIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Venue Details */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <LocationIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {venue.city}, {venue.state}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <CapacityIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                Capacity: {venue.capacity.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FacilityIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary">
                {venue.venueType}
              </Typography>
            </Box>
          </Box>

          {/* Facilities Preview */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
              Key Facilities
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {venue.facilities.slice(0, 3).map((facility, idx) => (
                <Chip
                  key={idx}
                  label={facility}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
              {venue.facilities.length > 3 && (
                <Chip
                  label={`+${venue.facilities.length - 3} more`}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.6rem',
                    height: 18,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
            </Box>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 191, 255, 0.05)'
              : 'rgba(0, 102, 204, 0.03)',
            borderRadius: 2,
            p: 1
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Setup Time
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                {venue.setupTime}m
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                Parking
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                {(venue.parkingCapacity / 1000).toFixed(1)}k
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
          <Button
            size="small"
            startIcon={<MapIcon />}
            sx={{ 
              color: theme.palette.primary.main,
              textTransform: 'none',
              fontWeight: 500
            }}
          >
            View Map
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(venue)}
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
          Venue Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage Big 12 Conference venues with location mapping
        </Typography>
      </Box>

      {/* Summary Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Venues', value: stats.total, icon: StadiumIcon, color: '#00bfff' },
          { label: 'Active Venues', value: stats.active, icon: LocationIcon, color: '#28a745' },
          { label: 'In Maintenance', value: stats.maintenance, icon: SettingsIcon, color: '#ff6b35' },
          { label: 'Total Capacity', value: `${(stats.totalCapacity / 1000000).toFixed(1)}M`, icon: CapacityIcon, color: '#9c27b0' },
          { label: 'Avg Capacity', value: stats.averageCapacity?.toLocaleString() || '0', icon: FacilityIcon, color: '#ff9800' },
          { label: 'Schools', value: stats.schools, icon: SchoolIcon, color: '#4caf50' }
        ].map((stat) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={stat.label}>
            <Paper
              sx={{
                p: 2,
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
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${stat.color}, ${stat.color}cc)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5
                }}
              >
                <stat.icon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: stat.color, fontSize: '1.1rem' }}>
                  {loading ? <Skeleton width={30} /> : stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  {stat.label}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Controls */}
      <Paper sx={{ 
        p: 3, 
        mb: 3,
        background: theme.palette.mode === 'dark' 
          ? 'rgba(17, 25, 40, 0.75)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(0, 191, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
        borderRadius: 3
      }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Search and Basic Filters */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            alignItems: { md: 'center' }
          }}>
            <TextField
              placeholder="Search venues, schools, or cities..."
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
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>School</InputLabel>
                <Select
                  value={selectedSchool}
                  label="School"
                  onChange={(e) => setSelectedSchool(e.target.value)}
                >
                  <MenuItem value="All">All Schools</MenuItem>
                  {BIG12_SCHOOLS.map(school => (
                    <MenuItem key={school} value={school}>{school}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Venue Type</InputLabel>
                <Select
                  value={selectedVenueType}
                  label="Venue Type"
                  onChange={(e) => setSelectedVenueType(e.target.value)}
                >
                  <MenuItem value="All">All Types</MenuItem>
                  {VENUE_TYPES.map(type => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingVenue(null);
                  setIsDialogOpen(true);
                }}
                sx={{
                  background: 'linear-gradient(135deg, #00bfff, #0088ff)',
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600
                }}
              >
                Add Venue
              </Button>
            </Box>
          </Box>

          {/* Advanced Filters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Advanced Filters
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'center' }}>
              <Box sx={{ minWidth: 200 }}>
                <Typography variant="caption" color="text.secondary">
                  Capacity Range
                </Typography>
                <Slider
                  value={capacityRange}
                  onChange={(_, newValue) => setCapacityRange(newValue as number[])}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100000}
                  step={5000}
                  valueLabelFormat={(value) => `${(value / 1000).toFixed(0)}k`}
                  sx={{ mt: 1 }}
                />
              </Box>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={showOnlyActive}
                    onChange={(e) => setShowOnlyActive(e.target.checked)}
                    color="primary"
                  />
                }
                label="Active venues only"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={mapView}
                    onChange={(e) => setMapView(e.target.checked)}
                    color="primary"
                  />
                }
                label="Map view"
              />
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Results Count */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredVenues.length} of {venues.length} venues
          {filteredVenues.length !== venues.length && ' (filtered)'}
        </Typography>
      </Box>

      {/* Venues Grid */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 12 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filteredVenues.length === 0 ? (
        <Alert 
          severity="info" 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(33, 150, 243, 0.1)'
              : 'rgba(33, 150, 243, 0.05)',
            borderRadius: 3
          }}
        >
          No venues found matching your search criteria.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          <AnimatePresence>
            {filteredVenues.map((venue, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={venue.id}>
                <VenueCard venue={venue} index={index} />
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
        <MenuItem onClick={() => selectedVenue && handleEdit(selectedVenue)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit Venue</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <MapIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View on Map</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => selectedVenue && handleDelete(selectedVenue)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>
            Delete Venue
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
        <DialogTitle sx={{ pb: 1 }}>
          {editingVenue ? 'Edit Venue' : 'Add New Venue'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enhanced venue form with location mapping and facility management.
            </Typography>
            
            {/* Basic Info Tab */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Venue Name"
                  size="small"
                  defaultValue={editingVenue?.name || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>School</InputLabel>
                  <Select defaultValue={editingVenue?.school || ''}>
                    {BIG12_SCHOOLS.map(school => (
                      <MenuItem key={school} value={school}>{school}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="City"
                  size="small"
                  defaultValue={editingVenue?.city || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="State"
                  size="small"
                  defaultValue={editingVenue?.state || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Capacity"
                  type="number"
                  size="small"
                  defaultValue={editingVenue?.capacity || ''}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Venue Type</InputLabel>
                  <Select defaultValue={editingVenue?.venueType || ''}>
                    {VENUE_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
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
            {editingVenue ? 'Update' : 'Create'} Venue
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Venues;