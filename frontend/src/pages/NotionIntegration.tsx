import React from 'react';
import { Container, Typography, Box, Paper, Grid } from '@mui/material';
import NotionSyncPanel from '../components/integrations/NotionSyncPanel';
import MainLayout from '../layouts/MainLayout';

/**
 * NotionIntegration Page Component
 * 
 * This page provides the Notion integration interface
 */
const NotionIntegration: React.FC = () => {
  return (
    <MainLayout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Notion Integration
        </Typography>
        
        <Typography variant="body1" paragraph>
          Synchronize data between FlexTime and Notion databases to enhance collaboration and streamline workflows.
        </Typography>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Paper elevation={0} sx={{ p: 0, height: '100%' }}>
              <NotionSyncPanel />
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 3, 
                height: '100%',
                bgcolor: 'background.default' 
              }}
            >
              <Typography variant="h5" gutterBottom>
                About Notion Integration
              </Typography>
              
              <Typography variant="body2" paragraph>
                This integration allows you to sync data bidirectionally between FlexTime and Notion:
              </Typography>
              
              <Box component="ul" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Contacts Sync:</strong> Pulls conference contacts from Notion into FlexTime
                  </Typography>
                </Box>
                
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Schedule Sync:</strong> Pushes FlexTime schedules to Notion for collaborative review
                  </Typography>
                </Box>
                
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Updates Sync:</strong> Pulls schedule updates (notes, TV networks) from Notion back to FlexTime
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" paragraph sx={{ mt: 2 }}>
                <strong>Getting Started:</strong>
              </Typography>
              
              <Box component="ol" sx={{ pl: 2 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Ensure your Notion API key is configured in <code>~/.env/notion.env</code>
                  </Typography>
                </Box>
                
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Share your Notion databases with your integration
                  </Typography>
                </Box>
                
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Add database IDs to your environment configuration
                  </Typography>
                </Box>
                
                <Box component="li" sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    Use the sync panel to manage data synchronization
                  </Typography>
                </Box>
              </Box>
              
              <Typography variant="body2" sx={{ mt: 3 }}>
                For detailed instructions, see <code>/docs/notion-neon-integration.md</code>
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  );
};

export default NotionIntegration;