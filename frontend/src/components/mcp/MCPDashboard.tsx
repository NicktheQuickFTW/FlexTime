import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface MCPServerStatus {
  server: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  requestsPerHour: number;
  successRate: number;
  models: string[];
}

interface ModelUsage {
  model: string;
  server: string;
  requests: number;
  tokensUsed: number;
  avgResponseTime: number;
}

interface LearningMetrics {
  feedbackCount: number;
  improvementRate: number;
  lastCycleDate: string;
  topConstraint: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MCPDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [serverStatus, setServerStatus] = useState<MCPServerStatus[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsage[]>([]);
  const [learningMetrics, setLearningMetrics] = useState<LearningMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, these would be API calls
        // For now, we'll use mock data
        
        // Mock server status data
        const mockServerStatus: MCPServerStatus[] = [
          {
            server: 'anthropic',
            status: 'online',
            latency: 245,
            requestsPerHour: 120,
            successRate: 99.8,
            models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku']
          },
          {
            server: 'openai',
            status: 'online',
            latency: 180,
            requestsPerHour: 85,
            successRate: 99.5,
            models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo']
          },
          {
            server: 'vertex',
            status: 'online',
            latency: 210,
            requestsPerHour: 45,
            successRate: 99.2,
            models: ['gemini-pro', 'gemini-ultra']
          },
          {
            server: 'huggingface',
            status: 'degraded',
            latency: 350,
            requestsPerHour: 25,
            successRate: 97.5,
            models: ['llama-3-70b', 'mistral-7b']
          }
        ];
        
        // Mock model usage data
        const mockModelUsage: ModelUsage[] = [
          {
            model: 'claude-3-opus',
            server: 'anthropic',
            requests: 85,
            tokensUsed: 1250000,
            avgResponseTime: 2.8
          },
          {
            model: 'gpt-4',
            server: 'openai',
            requests: 65,
            tokensUsed: 980000,
            avgResponseTime: 2.2
          },
          {
            model: 'claude-3-sonnet',
            server: 'anthropic',
            requests: 35,
            tokensUsed: 520000,
            avgResponseTime: 1.5
          },
          {
            model: 'gemini-pro',
            server: 'vertex',
            requests: 45,
            tokensUsed: 680000,
            avgResponseTime: 1.8
          },
          {
            model: 'gpt-3.5-turbo',
            server: 'openai',
            requests: 20,
            tokensUsed: 300000,
            avgResponseTime: 0.9
          }
        ];
        
        // Mock learning metrics
        const mockLearningMetrics: LearningMetrics = {
          feedbackCount: 128,
          improvementRate: 12.5,
          lastCycleDate: '2025-04-24T15:30:00Z',
          topConstraint: 'travel_distance'
        };
        
        setServerStatus(mockServerStatus);
        setModelUsage(mockModelUsage);
        setLearningMetrics(mockLearningMetrics);
        setLoading(false);
      } catch (err) {
        setError('Failed to load MCP dashboard data');
        setLoading(false);
        console.error('Error loading MCP dashboard:', err);
      }
    };
    
    fetchData();
    
    // Refresh data every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Prepare data for charts
  const serverRequestData = serverStatus.map(server => ({
    name: server.server,
    requests: server.requestsPerHour
  }));
  
  const pieData = modelUsage.map(usage => ({
    name: usage.model,
    value: usage.requests
  }));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        MCP Integration Dashboard
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Server Status */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 100%' }}>
            <Card>
              <CardHeader title="MCP Server Status" />
              <Divider />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Server</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Latency (ms)</TableCell>
                        <TableCell>Requests/Hour</TableCell>
                        <TableCell>Success Rate</TableCell>
                        <TableCell>Available Models</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {serverStatus.map((server) => (
                        <TableRow key={server.server}>
                          <TableCell>{server.server}</TableCell>
                          <TableCell>
                            <Chip 
                              label={server.status} 
                              color={
                                server.status === 'online' ? 'success' : 
                                server.status === 'degraded' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{server.latency} ms</TableCell>
                          <TableCell>{server.requestsPerHour}</TableCell>
                          <TableCell>{server.successRate}%</TableCell>
                          <TableCell>
                            {server.models.map(model => (
                              <Chip key={model} label={model} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* Charts */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 50%' }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Requests by Server" />
              <Divider />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={serverRequestData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="requests" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
          
          <Box sx={{ flex: '1 1 50%' }}>
            <Card sx={{ height: '100%' }}>
              <CardHeader title="Model Usage Distribution" />
              <Divider />
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }: { name: string, percent: number }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* Model Usage */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 100%' }}>
            <Card>
              <CardHeader title="Model Usage Details" />
              <Divider />
              <CardContent>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Model</TableCell>
                        <TableCell>Server</TableCell>
                        <TableCell>Requests</TableCell>
                        <TableCell>Tokens Used</TableCell>
                        <TableCell>Avg Response Time (s)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {modelUsage.map((usage) => (
                        <TableRow key={`${usage.server}-${usage.model}`}>
                          <TableCell>{usage.model}</TableCell>
                          <TableCell>{usage.server}</TableCell>
                          <TableCell>{usage.requests}</TableCell>
                          <TableCell>{usage.tokensUsed.toLocaleString()}</TableCell>
                          <TableCell>{usage.avgResponseTime.toFixed(2)}s</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* Learning System Metrics */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flex: '1 1 100%' }}>
            <Card>
              <CardHeader title="Learning System Metrics" />
              <Divider />
              <CardContent>
                {learningMetrics && (
                  <Box>
                    <Typography variant="body1" gutterBottom>
                      <strong>Total Feedback:</strong> {learningMetrics.feedbackCount}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Improvement Rate:</strong> {learningMetrics.improvementRate}%
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Last Learning Cycle:</strong> {new Date(learningMetrics.lastCycleDate).toLocaleString()}
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      <strong>Top Focus Constraint:</strong> {learningMetrics.topConstraint}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MCPDashboard;
