import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Rating,
  Divider
} from '@mui/material';
import {
  Sports,
  EmojiEvents,
  School,
  Person,
  LocationOn,
  TrendingUp,
  Assessment
} from '@mui/icons-material';

interface TeamProfile {
  id: number;
  school_name: string;
  team_name: string;
  compass_overall_score: number;
  compass_competitive_performance: number;
  compass_recruiting_success: number;
  compass_coaching_stability: number;
  compass_resource_investment: number;
  season_record: string;
  conference_record: string;
  ncaa_tournament_result: string;
  national_ranking: number;
  head_coach: string;
  coach_tenure: number;
  facility_name: string;
  facility_capacity: number;
  scheduling_tier: string;
  scheduling_considerations: string;
  competitive_analysis: string;
  recruiting_notes: string;
  profile_last_updated: string;
}

interface SportProfilePageProps {
  sport: string;
  sportId: number;
}

const SportProfilePage: React.FC<SportProfilePageProps> = ({ sport, sportId }) => {
  const [teams, setTeams] = useState<TeamProfile[]>([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamProfiles();
  }, [sportId]);

  const fetchTeamProfiles = async () => {
    try {
      const response = await fetch(`/api/sports/${sportId}/profiles`);
      const data = await response.json();
      setTeams(data.sort((a, b) => b.compass_overall_score - a.compass_overall_score));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team profiles:', error);
      setLoading(false);
    }
  };

  const getCompassColor = (score: number) => {
    if (score >= 85) return '#4caf50'; // Green - Championship Contender
    if (score >= 70) return '#ff9800'; // Orange - Competitive Challenger  
    if (score >= 50) return '#2196f3'; // Blue - Emerging Program
    return '#f44336'; // Red - Rebuilding
  };

  const getTierLabel = (score: number) => {
    if (score >= 85) return 'Championship Contender';
    if (score >= 70) return 'Competitive Challenger';
    if (score >= 50) return 'Emerging Program';
    return 'Rebuilding Program';
  };

  const CompassChart = ({ team }: { team: TeamProfile }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar sx={{ bgcolor: getCompassColor(team.compass_overall_score), mr: 2 }}>
            {team.compass_overall_score}
          </Avatar>
          <Box>
            <Typography variant="h6">{team.school_name}</Typography>
            <Chip 
              label={getTierLabel(team.compass_overall_score)}
              sx={{ backgroundColor: getCompassColor(team.compass_overall_score), color: 'white' }}
              size="small"
            />
          </Box>
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box mb={1}>
              <Typography variant="body2" color="textSecondary">
                Competitive Performance (40%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(team.compass_competitive_performance / 40) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption">{team.compass_competitive_performance}/40</Typography>
            </Box>
            
            <Box mb={1}>
              <Typography variant="body2" color="textSecondary">
                Recruiting Success (25%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(team.compass_recruiting_success / 25) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption">{team.compass_recruiting_success}/25</Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box mb={1}>
              <Typography variant="body2" color="textSecondary">
                Coaching Stability (20%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(team.compass_coaching_stability / 20) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption">{team.compass_coaching_stability}/20</Typography>
            </Box>
            
            <Box mb={1}>
              <Typography variant="body2" color="textSecondary">
                Resource Investment (15%)
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={(team.compass_resource_investment / 15) * 100}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption">{team.compass_resource_investment}/15</Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const TeamDetailCard = ({ team }: { team: TeamProfile }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={1}>
              <EmojiEvents sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2">Performance</Typography>
            </Box>
            <Typography variant="body2">Season: {team.season_record}</Typography>
            <Typography variant="body2">Conference: {team.conference_record}</Typography>
            <Typography variant="body2">NCAA Result: {team.ncaa_tournament_result}</Typography>
            {team.national_ranking && (
              <Typography variant="body2">Ranking: #{team.national_ranking}</Typography>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={1}>
              <Person sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2">Coaching</Typography>
            </Box>
            <Typography variant="body2">Head Coach: {team.head_coach}</Typography>
            <Typography variant="body2">Tenure: {team.coach_tenure} years</Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={1}>
              <LocationOn sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="subtitle2">Facility</Typography>
            </Box>
            <Typography variant="body2">{team.facility_name}</Typography>
            {team.facility_capacity && (
              <Typography variant="body2">Capacity: {team.facility_capacity?.toLocaleString()}</Typography>
            )}
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 2 }} />
        
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>Scheduling Considerations</Typography>
          <Typography variant="body2">{team.scheduling_considerations}</Typography>
        </Box>
        
        {team.competitive_analysis && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom>Competitive Analysis</Typography>
            <Typography variant="body2">{team.competitive_analysis}</Typography>
          </Box>
        )}
        
        {team.recruiting_notes && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>Recruiting Notes</Typography>
            <Typography variant="body2">{team.recruiting_notes}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const RankingsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Rank</TableCell>
            <TableCell>School</TableCell>
            <TableCell align="center">COMPASS Score</TableCell>
            <TableCell align="center">Tier</TableCell>
            <TableCell>Head Coach</TableCell>
            <TableCell>Season Record</TableCell>
            <TableCell>NCAA Result</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {teams.map((team, index) => (
            <TableRow key={team.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <Box display="flex" alignItems="center">
                  <Avatar 
                    sx={{ 
                      bgcolor: getCompassColor(team.compass_overall_score), 
                      width: 32, 
                      height: 32, 
                      mr: 2,
                      fontSize: '0.8rem'
                    }}
                  >
                    {team.compass_overall_score}
                  </Avatar>
                  {team.school_name}
                </Box>
              </TableCell>
              <TableCell align="center">
                <Typography variant="h6" color={getCompassColor(team.compass_overall_score)}>
                  {team.compass_overall_score}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Chip 
                  label={getTierLabel(team.compass_overall_score)}
                  sx={{ backgroundColor: getCompassColor(team.compass_overall_score), color: 'white' }}
                  size="small"
                />
              </TableCell>
              <TableCell>{team.head_coach}</TableCell>
              <TableCell>{team.season_record}</TableCell>
              <TableCell>{team.ncaa_tournament_result}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" mt={4}>
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Sports sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Box>
          <Typography variant="h3" component="h1" gutterBottom>
            Big 12 {sport} Profiles
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Comprehensive COMPASS analysis for all conference teams
          </Typography>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Team Rankings" />
          <Tab label="COMPASS Analysis" />
          <Tab label="Detailed Profiles" />
        </Tabs>
      </Box>

      {selectedTab === 0 && <RankingsTable />}
      
      {selectedTab === 1 && (
        <Grid container spacing={2}>
          {teams.map(team => (
            <Grid item xs={12} md={6} key={team.id}>
              <CompassChart team={team} />
            </Grid>
          ))}
        </Grid>
      )}
      
      {selectedTab === 2 && (
        <Box>
          {teams.map(team => (
            <TeamDetailCard key={team.id} team={team} />
          ))}
        </Box>
      )}

      <Box mt={4} p={2} bgcolor="grey.100" borderRadius={2}>
        <Typography variant="caption" color="textSecondary">
          Last updated: {teams[0]?.profile_last_updated} | 
          COMPASS Rating: Competitive Performance (40%) + Recruiting Success (25%) + Coaching Stability (20%) + Resource Investment (15%)
        </Typography>
      </Box>
    </Container>
  );
};

export default SportProfilePage;