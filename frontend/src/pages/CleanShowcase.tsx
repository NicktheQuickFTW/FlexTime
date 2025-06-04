import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { CleanDashboard } from '../components/refined/CleanDashboard';
import { CleanScheduleBuilder } from '../components/refined/CleanScheduleBuilder';
import { FlexTimeScheduleBuilder } from '../components/refined/FlexTimeScheduleBuilder';
import { BentoScheduleBuilder } from '../components/refined/BentoScheduleBuilder';
import { LegacyDarkBuilder } from '../components/refined/LegacyDarkBuilder';
import { FTLogo } from '../components/ui/FTLogo';

type DemoMode = 'menu' | 'dashboard' | 'builder' | 'flextime-builder' | 'bento-builder' | 'legacy-builder';

/**
 * CLEAN SHOWCASE PAGE
 * 
 * Demonstrates clean, modern, functional FlexTime designs:
 * - Clean monochrome with neon blue accents
 * - Orbitron ALL CAPS for titles
 * - Performance-focused and functional
 * - Jawdroppingly beautiful but clean
 */
export const CleanShowcase: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<DemoMode>('menu');

  const demos = [
    {
      id: 'dashboard' as DemoMode,
      title: 'CLEAN DASHBOARD',
      description: 'Modern, functional dashboard with monochrome design and neon blue accents',
      icon: '📊',
      component: CleanDashboard,
    },
    {
      id: 'legacy-builder' as DemoMode,
      title: 'LEGACY BUILDER',
      description: 'Original FT Builder layout with dark theme and metal shader-inspired effects',
      icon: '🏗️',
      component: LegacyDarkBuilder,
    },
    {
      id: 'bento-builder' as DemoMode,
      title: 'BENTO BUILDER',
      description: 'Modular bento grid layout with legacy FT Builder functionality and dark theme',
      icon: '⬜',
      component: BentoScheduleBuilder,
    },
    {
      id: 'flextime-builder' as DemoMode,
      title: 'LIGHT BUILDER',
      description: 'Light theme with progressive blur effects and professional matrix interface',
      icon: '⚡',
      component: FlexTimeScheduleBuilder,
    },
    {
      id: 'builder' as DemoMode,
      title: 'DARK BUILDER',
      description: 'Performance-focused schedule builder with clean, sharp aesthetics',
      icon: '📅',
      component: CleanScheduleBuilder,
    },
  ];

  if (currentDemo !== 'menu') {
    const selectedDemo = demos.find(demo => demo.id === currentDemo);
    if (selectedDemo) {
      const DemoComponent = selectedDemo.component;
      return (
        <Box sx={{ position: 'relative', minHeight: '100vh' }}>
          {/* Back Button */}
          <motion.div
            style={{
              position: 'fixed',
              top: 30,
              left: 30,
              zIndex: 1000,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={() => setCurrentDemo('menu')}
              sx={{
                background: '#111111',
                border: '1px solid #333333',
                borderRadius: 2,
                color: '#ffffff',
                fontFamily: 'var(--ft-font-ui)',
                fontWeight: 500,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.1em',
                px: 3,
                py: 1,
                '&:hover': {
                  background: '#1a1a1a',
                  borderColor: '#00bfff',
                },
              }}
            >
              ← BACK TO MENU
            </Button>
          </motion.div>
          
          <DemoComponent />
        </Box>
      );
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#000000',
      color: '#ffffff',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Subtle Grid Pattern */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0,191,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,191,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '100px 100px',
        opacity: 0.5,
      }} />

      <Box sx={{ 
        position: 'relative', 
        zIndex: 2, 
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <FTLogo size="lg" variant="white" />
          <Typography 
            variant="h1" 
            className="ft-font-brand"
            sx={{
              fontSize: '4rem',
              fontWeight: 800,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mt: 3,
              mb: 2,
            }}
          >
            CLEAN DESIGNS
          </Typography>
          <Typography 
            variant="h3" 
            className="ft-font-ui"
            sx={{ 
              color: '#888888',
              fontSize: '1.2rem',
              fontWeight: 400,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Modern • Functional • Beautiful
          </Typography>
        </motion.div>

        {/* Demo Grid */}
        <Grid container spacing={4} sx={{ maxWidth: 1000 }}>
          {demos.map((demo, index) => (
            <Grid item xs={12} md={4} key={demo.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.6,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  onClick={() => setCurrentDemo(demo.id)}
                  sx={{
                    background: '#111111',
                    border: '1px solid #222222',
                    borderRadius: 3,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    height: 280,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: '#00bfff',
                      background: '#151515',
                    },
                  }}
                >
                  {/* Subtle Accent Line */}
                  <Box sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: 'linear-gradient(90deg, transparent, #00bfff, transparent)',
                    opacity: 0.6,
                  }} />
                  
                  <CardContent sx={{ 
                    p: 4, 
                    textAlign: 'center',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    position: 'relative',
                    zIndex: 2,
                  }}>
                    <Typography 
                      sx={{ 
                        fontSize: '3rem', 
                        mb: 3,
                        filter: 'grayscale(1)',
                      }}
                    >
                      {demo.icon}
                    </Typography>
                    
                    <Typography 
                      variant="h4" 
                      className="ft-font-brand"
                      sx={{ 
                        color: '#ffffff',
                        mb: 2,
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {demo.title}
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      className="ft-font-body"
                      sx={{ 
                        color: '#888888',
                        lineHeight: 1.6,
                        fontSize: '0.9rem',
                      }}
                    >
                      {demo.description}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          style={{ marginTop: 60, textAlign: 'center' }}
        >
          <Typography 
            variant="body2" 
            className="ft-font-ui"
            sx={{ 
              color: '#444444',
              fontSize: '0.8rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            Performance • Functionality • Aesthetics
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
};

export default CleanShowcase;