import React, { useState } from 'react';
import { Box, Typography, Button, Card, CardContent, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { WildDashboard } from '../components/crazy/WildDashboard';
import { HolographicScheduleBuilder } from '../components/crazy/HolographicScheduleBuilder';
import { QuantumSportsViz } from '../components/crazy/QuantumSportsViz';
import { UltimateFlexTimeDashboard } from '../components/crazy/UltimateFlexTimeDashboard';
import { FTLogo } from '../components/ui/FTLogo';

type DemoMode = 'menu' | 'wild' | 'holographic' | 'quantum' | 'ultimate';

/**
 * CRAZY SHOWCASE PAGE
 * 
 * Demonstrates the most INSANE FlexTime designs ever created:
 * - Wild Dashboard with 3D floating shapes
 * - Holographic Schedule Builder with neural networks
 * - Quantum Sports Visualization with particle physics
 * - Ultimate Dashboard with Magic UI inspired effects
 */
export const CrazyShowcase: React.FC = () => {
  const [currentDemo, setCurrentDemo] = useState<DemoMode>('menu');

  const demos = [
    {
      id: 'wild' as DemoMode,
      title: 'WILD DASHBOARD',
      description: '3D floating geometric shapes, particle neural networks, holographic glassmorphic cards',
      icon: '🌪️',
      color: '#00bfff',
      component: WildDashboard,
    },
    {
      id: 'holographic' as DemoMode,
      title: 'HOLOGRAPHIC BUILDER',
      description: '3D neural network nodes, quantum field interactions, floating geometric shapes',
      icon: '🔮',
      color: '#ffa500',
      component: HolographicScheduleBuilder,
    },
    {
      id: 'quantum' as DemoMode,
      title: 'QUANTUM SPORTS VIZ',
      description: 'Real-time particle physics, quantum field interactions, 3D perspective rendering',
      icon: '⚛️',
      color: '#ff6b6b',
      component: QuantumSportsViz,
    },
    {
      id: 'ultimate' as DemoMode,
      title: 'ULTIMATE DASHBOARD',
      description: 'Magic UI particles, border beams, ripple effects, 3D floating cards, custom cursor',
      icon: '✨',
      color: '#4ecdc4',
      component: UltimateFlexTimeDashboard,
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
            transition={{ delay: 1 }}
          >
            <Button
              onClick={() => setCurrentDemo('menu')}
              sx={{
                background: 'linear-gradient(45deg, rgba(0,191,255,0.8), rgba(0,191,255,0.4))',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(0,191,255,0.6)',
                borderRadius: 3,
                color: '#ffffff',
                fontFamily: 'var(--ft-font-ui)',
                fontWeight: 600,
                px: 3,
                py: 1,
                '&:hover': {
                  background: 'linear-gradient(45deg, rgba(0,191,255,1), rgba(0,191,255,0.6))',
                  transform: 'scale(1.05)',
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
      background: 'radial-gradient(ellipse at center, #0a0e17 0%, #000000 100%)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Animated Background Grid */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0,191,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,191,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '100px 100px'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating Geometric Shapes */}
      {Array.from({ length: 6 }, (_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 100 + Math.random() * 100,
            height: 100 + Math.random() * 100,
            left: Math.random() * window.innerWidth,
            top: Math.random() * window.innerHeight,
            background: `linear-gradient(45deg, 
              rgba(0,191,255,0.1), 
              rgba(255,165,0,0.1)
            )`,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0,191,255,0.2)',
            borderRadius: i % 2 === 0 ? '50%' : '0',
            clipPath: i % 3 === 0 ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
          }}
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 360],
            rotateZ: [0, 360],
            x: [0, Math.random() * 200 - 100, 0],
            y: [0, Math.random() * 200 - 100, 0],
          }}
          transition={{
            duration: 20 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

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
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          style={{ textAlign: 'center', marginBottom: 60 }}
        >
          <FTLogo size="xl" />
          <Typography 
            variant="h1" 
            className="ft-font-brand"
            sx={{
              fontSize: '4rem',
              background: 'linear-gradient(45deg, #00bfff, #ffa500, #ff6b6b, #4ecdc4)',
              backgroundSize: '400% 400%',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 50px rgba(0,191,255,0.8)',
              mt: 3,
              mb: 2,
              animation: 'gradient 4s ease infinite',
              '@keyframes gradient': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
            }}
          >
            CRAZY DESIGNS
          </Typography>
          <Typography 
            variant="h3" 
            className="ft-font-ui"
            sx={{ 
              color: 'rgba(255,255,255,0.8)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              textShadow: '0 0 20px rgba(0,191,255,0.5)',
            }}
          >
            Absolutely Insane FlexTime Interfaces
          </Typography>
        </motion.div>

        {/* Demo Grid */}
        <Grid container spacing={4} sx={{ maxWidth: 1200 }}>
          {demos.map((demo, index) => (
            <Grid item xs={12} md={6} key={demo.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.5, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ 
                  delay: index * 0.2,
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100,
                }}
                whileHover={{ 
                  scale: 1.05,
                  rotateY: 5,
                  rotateX: 5,
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Card
                  onClick={() => setCurrentDemo(demo.id)}
                  sx={{
                    background: `linear-gradient(135deg, ${demo.color}20, rgba(255,255,255,0.05))`,
                    backdropFilter: 'blur(30px)',
                    border: `2px solid ${demo.color}40`,
                    borderRadius: 4,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    position: 'relative',
                    height: 300,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 20px 40px ${demo.color}40`,
                      border: `2px solid ${demo.color}80`,
                    },
                  }}
                >
                  {/* Animated Border Beam */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '4px',
                      background: `linear-gradient(90deg, transparent, ${demo.color}, transparent)`,
                    }}
                    animate={{
                      left: ['100%', '-100%'],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.5,
                      ease: "linear",
                    }}
                  />
                  
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
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ fontSize: '4rem', marginBottom: 20 }}
                    >
                      {demo.icon}
                    </motion.div>
                    
                    <Typography 
                      variant="h4" 
                      className="ft-font-brand"
                      sx={{ 
                        color: demo.color,
                        textShadow: `0 0 20px ${demo.color}60`,
                        mb: 2,
                        fontSize: '1.8rem',
                      }}
                    >
                      {demo.title}
                    </Typography>
                    
                    <Typography 
                      variant="body1" 
                      className="ft-font-body"
                      sx={{ 
                        color: 'rgba(255,255,255,0.8)',
                        lineHeight: 1.6,
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
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1 }}
          style={{ marginTop: 60, textAlign: 'center' }}
        >
          <Typography 
            variant="h6" 
            className="ft-font-ui"
            sx={{ 
              color: 'rgba(255,255,255,0.6)',
              letterSpacing: '0.1em',
            }}
          >
            Built with React, Framer Motion, Magic UI inspiration & Pure Insanity
          </Typography>
        </motion.div>
      </Box>
    </Box>
  );
};

export default CrazyShowcase;