import React, { useState } from 'react';
import { Box, Button, Select, Text, Stack, Alert, AlertIcon, VStack, Heading, Divider, useToast } from '@mui/material';
import { Sync as SyncIcon, Link as LinkIcon, SportsBasketball, Schedule, ContactMail } from '@mui/icons-material';
import api from '../../services/api';
import { SportSelector } from '../common/SportSelector';

/**
 * NotionSyncPanel Component
 * 
 * This component provides a UI for syncing data between Notion and the FlexTime Neon database
 */
const NotionSyncPanel: React.FC = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncType, setSyncType] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const toast = useToast();

  const handleSync = async (endpoint: string, params = {}) => {
    setIsSyncing(true);
    setSyncType(endpoint);
    setResult(null);
    setError(null);
    
    try {
      const response = await api.post(`/api/notion-sync/${endpoint}`, params);
      setResult(response.data.result);
      
      toast({
        title: 'Synchronization Successful',
        description: `Completed ${endpoint} operation`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message;
      setError(errorMessage);
      
      toast({
        title: 'Synchronization Failed',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getSyncButtonColor = (endpoint: string) => {
    switch (endpoint) {
      case 'test-connections':
        return 'secondary';
      case 'contacts-to-neon':
        return 'info';
      case 'schedules-to-notion':
        return 'success';
      case 'schedule-updates-from-notion':
        return 'warning';
      case 'full-sync':
        return 'primary';
      default:
        return 'primary';
    }
  };

  const formatResult = (result: any) => {
    if (!result) return null;
    
    if (typeof result === 'object') {
      return (
        <VStack align="start" spacing={1} mt={2}>
          {Object.entries(result).map(([key, value]) => (
            <Text key={key}>
              <strong>{key}:</strong> {JSON.stringify(value)}
            </Text>
          ))}
        </VStack>
      );
    }
    
    return <Text>{JSON.stringify(result)}</Text>;
  };

  return (
    <Box sx={{ 
      p: 4, 
      borderRadius: 2, 
      boxShadow: 2,
      bgcolor: 'background.paper' 
    }}>
      <Heading variant="h5" mb={3} display="flex" alignItems="center">
        <LinkIcon sx={{ mr: 1 }} />
        Notion Integration
      </Heading>
      
      <Text mb={2}>
        Synchronize data between Notion and FlexTime's Neon database
      </Text>
      
      <Divider sx={{ my: 3 }} />
      
      <Stack spacing={3}>
        <Button
          variant="contained"
          color={getSyncButtonColor('test-connections')}
          startIcon={<SyncIcon />}
          onClick={() => handleSync('test-connections')}
          disabled={isSyncing}
          fullWidth
        >
          {isSyncing && syncType === 'test-connections' ? 'Testing Connections...' : 'Test Connections'}
        </Button>
        
        <Box>
          <Heading variant="h6" mb={2} display="flex" alignItems="center">
            <ContactMail sx={{ mr: 1 }} />
            Contacts
          </Heading>
          
          <Button
            variant="contained"
            color={getSyncButtonColor('contacts-to-neon')}
            startIcon={<SyncIcon />}
            onClick={() => handleSync('contacts-to-neon')}
            disabled={isSyncing}
            fullWidth
          >
            {isSyncing && syncType === 'contacts-to-neon' ? 'Syncing Contacts...' : 'Sync Conference Contacts to FlexTime'}
          </Button>
        </Box>
        
        <Box>
          <Heading variant="h6" mb={2} display="flex" alignItems="center">
            <Schedule sx={{ mr: 1 }} />
            Schedules
          </Heading>
          
          <SportSelector
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value as string)}
            label="Select Sport (Optional)"
            sx={{ mb: 2 }}
            fullWidth
          />
          
          <Stack spacing={2}>
            <Button
              variant="contained"
              color={getSyncButtonColor('schedules-to-notion')}
              startIcon={<SyncIcon />}
              onClick={() => handleSync('schedules-to-notion', selectedSport ? { sportType: selectedSport } : {})}
              disabled={isSyncing}
              fullWidth
            >
              {isSyncing && syncType === 'schedules-to-notion' ? 'Syncing Schedules...' : 'Sync Schedules to Notion'}
            </Button>
            
            <Button
              variant="contained"
              color={getSyncButtonColor('schedule-updates-from-notion')}
              startIcon={<SyncIcon />}
              onClick={() => handleSync('schedule-updates-from-notion')}
              disabled={isSyncing}
              fullWidth
            >
              {isSyncing && syncType === 'schedule-updates-from-notion' ? 'Syncing Updates...' : 'Sync Schedule Updates from Notion'}
            </Button>
          </Stack>
        </Box>
        
        <Divider sx={{ my: 1 }} />
        
        <Button
          variant="contained"
          color={getSyncButtonColor('full-sync')}
          startIcon={<SyncIcon />}
          onClick={() => handleSync('full-sync', selectedSport ? { sportType: selectedSport } : {})}
          disabled={isSyncing}
          fullWidth
          size="large"
        >
          {isSyncing && syncType === 'full-sync' ? 'Performing Full Sync...' : 'Perform Full Sync'}
        </Button>
      </Stack>
      
      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          <AlertIcon />
          {error}
        </Alert>
      )}
      
      {result && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
          <Heading variant="h6" mb={1}>Sync Results</Heading>
          {formatResult(result)}
        </Box>
      )}
    </Box>
  );
};

export default NotionSyncPanel;