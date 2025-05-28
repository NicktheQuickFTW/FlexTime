import React, { ReactNode } from 'react';
import { 
  Box, 
  Typography, 
  useTheme 
} from '@mui/material';
import GradientText from '../common/GradientText';

interface QuickAccessPanelProps {
  children: ReactNode;
}

const QuickAccessPanel: React.FC<QuickAccessPanelProps> = ({ children }) => {
  const theme = useTheme();
  
  return (
    <Box
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark' 
          ? 'rgba(17, 25, 40, 0.75)' 
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderLeft: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 3,
      }}
    >
      <GradientText variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
        Quick Access
      </GradientText>
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 3,
        flexGrow: 1,
        overflowY: 'auto'
      }}>
        {children}
      </Box>
    </Box>
  );
};

export default QuickAccessPanel;
