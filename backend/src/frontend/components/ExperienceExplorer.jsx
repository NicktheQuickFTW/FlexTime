import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  CircularProgress, 
  Alert, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  InputLabel, 
  FormControl,
  Chip,
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Search, 
  ExpandMore, 
  Memory, 
  FilterList, 
  SportsSoccer, 
  SportsFootball, 
  SportsTennis,
  Info
} from '@mui/icons-material';

/**
 * Component to explore experiences stored in the Intelligence Engine
 */
const ExperienceExplorer = () => {
  const [experiences, setExperiences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: '',
    agentId: '',
    tags: '',
    limit: 10
  });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const fetchExperiences = async () => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams();
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.agentId) queryParams.append('agentId', filters.agentId);
      if (filters.tags) queryParams.append('tags', filters.tags);
      queryParams.append('limit', filters.limit);
      
      const response = await fetch(`/api/intelligence-engine/experiences?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch experiences: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setExperiences(data.experiences || []);
        setTotalCount(data.count || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch experiences');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiences();
  }, [page]); // Re-fetch when page changes

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset to first page
    fetchExperiences();
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const getSportIcon = (sportType) => {
    if (!sportType) return null;
    
    switch (sportType.toLowerCase()) {
      case 'basketball':
        return <SportsSoccer />;
      case 'football':
        return <SportsFootball />;
      case 'tennis':
        return <SportsTennis />;
      default:
        return <SportsSoccer />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderExperienceContent = (experience) => {
    if (!experience || !experience.content) return 'No content available';
    
    const content = experience.content;
    
    // Different rendering based on experience type
    switch (experience.type) {
      case 'schedule_generation':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Schedule Generation</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">Sport: {content.sportType || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Conference: {content.conferenceId || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Teams: {content.teamCount || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Constraints: {content.constraintCount || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Outcome: {content.outcome || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Algorithm: {content.algorithm || 'N/A'}</Typography>
              </Grid>
              {content.metrics && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Metrics:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(content.metrics).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell component="th" scope="row">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </TableCell>
                            <TableCell align="right">{typeof value === 'number' ? value.toFixed(2) : value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 'schedule_optimization':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Schedule Optimization</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">Sport: {content.sportType || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Conference: {content.conferenceId || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Algorithm: {content.algorithm || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Outcome: {content.outcome || 'N/A'}</Typography>
              </Grid>
              {content.improvements && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Improvements:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Original</TableCell>
                          <TableCell align="right">Optimized</TableCell>
                          <TableCell align="right">Improvement (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(content.improvements).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell component="th" scope="row">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </TableCell>
                            <TableCell align="right">{value.original?.toFixed(2) || 'N/A'}</TableCell>
                            <TableCell align="right">{value.optimized?.toFixed(2) || 'N/A'}</TableCell>
                            <TableCell align="right">{value.percentImprovement?.toFixed(2) || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      case 'schedule_feedback':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Schedule Feedback</Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="body2">Schedule ID: {content.scheduleId || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Sport: {content.sportType || 'N/A'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Rating: {content.rating || 'N/A'}/5</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2">Source: {content.source || 'N/A'}</Typography>
              </Grid>
              {content.comment && (
                <Grid item xs={12}>
                  <Typography variant="body2">Comment: {content.comment}</Typography>
                </Grid>
              )}
              {content.metrics && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Metrics:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric</TableCell>
                          <TableCell align="right">Rating</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(content.metrics).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell component="th" scope="row">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </TableCell>
                            <TableCell align="right">{typeof value === 'number' ? value.toFixed(2) : value}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          </Box>
        );
        
      default:
        return (
          <Box>
            <Typography variant="body2">
              {JSON.stringify(content, null, 2)}
            </Typography>
          </Box>
        );
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box display="flex" alignItems="center">
            <Memory color="primary" />
            <Typography variant="h5" component="h2" ml={1}>
              Intelligence Engine Experiences
            </Typography>
          </Box>
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterList color={showFilters ? "primary" : "action"} />
          </IconButton>
        </Box>
        
        <Accordion expanded={showFilters} onChange={() => setShowFilters(!showFilters)}>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls="filter-content"
            id="filter-header"
          >
            <Typography>Search & Filter</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <form onSubmit={handleSearch}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="type-select-label">Experience Type</InputLabel>
                    <Select
                      labelId="type-select-label"
                      id="type-select"
                      name="type"
                      value={filters.type}
                      onChange={handleFilterChange}
                      label="Experience Type"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="schedule_generation">Schedule Generation</MenuItem>
                      <MenuItem value="schedule_optimization">Schedule Optimization</MenuItem>
                      <MenuItem value="schedule_feedback">Schedule Feedback</MenuItem>
                      <MenuItem value="feedback_insights">Feedback Insights</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="agent-select-label">Agent</InputLabel>
                    <Select
                      labelId="agent-select-label"
                      id="agent-select"
                      name="agentId"
                      value={filters.agentId}
                      onChange={handleFilterChange}
                      label="Agent"
                    >
                      <MenuItem value="">All Agents</MenuItem>
                      <MenuItem value="scheduling_director">Scheduling Director</MenuItem>
                      <MenuItem value="operations_director">Operations Director</MenuItem>
                      <MenuItem value="analysis_director">Analysis Director</MenuItem>
                      <MenuItem value="feedback_system">Feedback System</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Tags (comma separated)"
                    name="tags"
                    value={filters.tags}
                    onChange={handleFilterChange}
                    variant="outlined"
                    size="small"
                    placeholder="basketball,big12,feedback"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth variant="outlined" size="small">
                    <InputLabel id="limit-select-label">Limit</InputLabel>
                    <Select
                      labelId="limit-select-label"
                      id="limit-select"
                      name="limit"
                      value={filters.limit}
                      onChange={handleFilterChange}
                      label="Limit"
                    >
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={25}>25</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<Search />}
                  >
                    Search
                  </Button>
                </Grid>
              </Grid>
            </form>
          </AccordionDetails>
        </Accordion>
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>
        ) : experiences.length === 0 ? (
          <Alert severity="info" sx={{ my: 2 }}>No experiences found. Try adjusting your filters.</Alert>
        ) : (
          <Box mt={3}>
            <Typography variant="body2" color="textSecondary" mb={1}>
              Showing {experiences.length} of {totalCount} experiences
            </Typography>
            
            {experiences.map((experience) => (
              <Accordion key={experience.id} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Grid container alignItems="center" spacing={1}>
                    <Grid item>
                      {experience.content?.sportType && getSportIcon(experience.content.sportType)}
                    </Grid>
                    <Grid item xs>
                      <Typography variant="subtitle1">
                        {experience.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" color="textSecondary">
                        {formatDate(experience.timestamp)}
                      </Typography>
                    </Grid>
                    <Grid item>
                      <Typography variant="body2" color="primary">
                        {experience.agentId}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      {renderExperienceContent(experience)}
                    </Grid>
                    
                    {experience.tags && experience.tags.length > 0 && (
                      <Grid item xs={12}>
                        <Box mt={1}>
                          {experience.tags.map((tag) => (
                            <Chip 
                              key={tag} 
                              label={tag} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 0.5, mb: 0.5 }} 
                            />
                          ))}
                        </Box>
                      </Grid>
                    )}
                    
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="flex-end">
                        <Tooltip title="Experience ID">
                          <Typography variant="caption" color="textSecondary">
                            ID: {experience.id}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            ))}
            
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination 
                count={Math.ceil(totalCount / filters.limit)} 
                page={page} 
                onChange={handlePageChange} 
                color="primary" 
              />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ExperienceExplorer;
