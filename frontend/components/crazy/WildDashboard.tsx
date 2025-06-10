import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, CardContent, Grid, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FTLogo } from '../ui/FTLogo';

/**
 * ABSOLUTELY WILD FlexTime Dashboard
 * 
 * Features:
 * - 3D floating geometric shapes
 * - Particle systems
 * - Holographic UI elements
 * - Neural network animations
 * - Dynamic lighting effects
 * - Crazy smooth animations
 */
export const WildDashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    alpha: number;
  }>>([]);

  // Initialize particle system
  useEffect(() => {
    const initParticles = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      alpha: Math.random() * 0.5 + 0.1,
    }));
    setParticles(initParticles);
  }, []);

  // Animated particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw neural network connections
      ctx.strokeStyle = 'rgba(0, 191, 255, 0.1)';
      ctx.lineWidth = 1;
      
      particles.forEach((particle, i) => {
        particles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.globalAlpha = (150 - distance) / 150 * 0.2;
              ctx.stroke();
            }
          }
        });
      });

      // Draw particles with glow effect
      particles.forEach(particle => {
        // Glow effect
        ctx.shadowColor = '#00bfff';
        ctx.shadowBlur = 20;
        ctx.globalAlpha = particle.alpha;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = '#00bfff';
        ctx.fill();
        
        // Update particle position
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    };

    animate();
  }, [particles]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh', 
      overflow: 'hidden',
      background: 'radial-gradient(ellipse at center, #0a0e17 0%, #000000 100%)',
    }}>
      {/* Animated Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Floating 3D Shapes */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: 200,
          height: 200,
          background: 'linear-gradient(45deg, rgba(0,191,255,0.1), rgba(0,191,255,0.3))',
          borderRadius: '50%',
          border: '2px solid rgba(0,191,255,0.3)',
          backdropFilter: 'blur(20px)',
          zIndex: 1,
        }}
        animate={{
          rotateY: [0, 360],
          rotateX: [0, 180, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      <motion.div
        style={{
          position: 'absolute',
          top: '60%',
          left: '5%',
          width: 150,
          height: 150,
          background: 'linear-gradient(45deg, rgba(255,165,0,0.1), rgba(255,165,0,0.3))',
          clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
          border: '2px solid rgba(255,165,0,0.3)',
          backdropFilter: 'blur(20px)',
          zIndex: 1,
        }}
        animate={{
          rotateZ: [0, 360],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Main Content */}
      <Box sx={{ position: 'relative', zIndex: 2, p: 4 }}>
        {/* Holographic Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <Box sx={{ 
            textAlign: 'center', 
            mb: 6,
            background: 'linear-gradient(135deg, rgba(0,191,255,0.1), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(0,191,255,0.2)',
            borderRadius: 4,
            p: 4,
            position: 'relative',
          }}>
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0,191,255,0.3)',
                  '0 0 40px rgba(0,191,255,0.6)',
                  '0 0 20px rgba(0,191,255,0.3)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 16,
                pointerEvents: 'none',
              }}
            />
            
            <FTLogo size="xl" />
            <Typography 
              variant="h1" 
              className="ft-font-brand"
              sx={{ 
                fontSize: '4rem',
                background: 'linear-gradient(45deg, #00bfff, #ffffff, #ffa500)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                mt: 2,
                textShadow: '0 0 30px rgba(0,191,255,0.5)',
              }}
            >
              FLEXTIME
            </Typography>
            <Typography 
              variant="h3" 
              className="ft-font-ui"
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
              }}
            >
              Neural Scheduling Matrix
            </Typography>
          </Box>
        </motion.div>

        {/* Crazy 3D Stats Cards */}
        <Grid container spacing={4}>
          {[
            { title: 'ACTIVE SCHEDULES', value: '2,847', icon: '⚡', color: '#00bfff' },
            { title: 'AI OPTIMIZATIONS', value: '15.2K', icon: '🧠', color: '#ffa500' },
            { title: 'NEURAL NETWORKS', value: '847', icon: '🔮', color: '#ff6b6b' },
            { title: 'QUANTUM PROCESSES', value: '1,234', icon: '⚛️', color: '#4ecdc4' },
          ].map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
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
                  rotateY: 10,
                  rotateX: 5,
                }}
                style={{
                  perspective: '1000px',
                }}
              >
                <Card sx={{
                  background: `linear-gradient(135deg, ${stat.color}20, rgba(255,255,255,0.05))`,
                  backdropFilter: 'blur(30px)',
                  border: `2px solid ${stat.color}40`,
                  borderRadius: 4,
                  overflow: 'visible',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(45deg, transparent, ${stat.color}20, transparent)`,
                    borderRadius: 4,
                    opacity: 0.5,
                  }
                }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <motion.div
                      animate={{ 
                        rotateZ: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      style={{ fontSize: '3rem', marginBottom: 16 }}
                    >
                      {stat.icon}
                    </motion.div>
                    
                    <Typography 
                      variant="h2" 
                      className="ft-font-brand"
                      sx={{ 
                        fontSize: '2.5rem',
                        color: stat.color,
                        textShadow: `0 0 20px ${stat.color}60`,
                        mb: 1,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    
                    <Typography 
                      variant="subtitle1" 
                      className="ft-font-ui"
                      sx={{ 
                        color: 'rgba(255,255,255,0.7)',
                        letterSpacing: '0.1em',
                        fontSize: '0.8rem',
                      }}
                    >
                      {stat.title}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>

        {/* Holographic Schedule Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
          style={{ marginTop: 48 }}
        >
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(0,191,255,0.05), rgba(255,255,255,0.02))',
            backdropFilter: 'blur(40px)',
            border: '1px solid rgba(0,191,255,0.2)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <motion.div
              animate={{
                background: [
                  'linear-gradient(90deg, transparent, rgba(0,191,255,0.1), transparent)',
                  'linear-gradient(90deg, transparent, rgba(255,165,0,0.1), transparent)',
                  'linear-gradient(90deg, transparent, rgba(0,191,255,0.1), transparent)',
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '200%',
                height: '100%',
                pointerEvents: 'none',
              }}
            />
            
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h3" 
                className="ft-font-brand"
                sx={{ 
                  mb: 3,
                  textAlign: 'center',
                  color: '#00bfff',
                  textShadow: '0 0 20px rgba(0,191,255,0.5)',
                }}
              >
                QUANTUM SCHEDULE MATRIX
              </Typography>
              
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 2,
                mt: 4,
              }}>
                {Array.from({ length: 21 }, (_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ 
                      scale: 1.1,
                      boxShadow: '0 0 30px rgba(0,191,255,0.6)',
                    }}
                    style={{
                      height: 80,
                      background: `linear-gradient(45deg, 
                        rgba(0,191,255,${Math.random() * 0.3 + 0.1}), 
                        rgba(255,165,0,${Math.random() * 0.2 + 0.05})
                      )`,
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(0,191,255,0.3)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Typography 
                      className="ft-font-mono"
                      sx={{ 
                        color: '#00bfff',
                        fontSize: '0.8rem',
                        textShadow: '0 0 10px rgba(0,191,255,0.8)',
                      }}
                    >
                      {Math.floor(Math.random() * 9) + 1}
                    </Typography>
                  </motion.div>
                ))}
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Box>

      {/* Floating Action Orb */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          width: 80,
          height: 80,
          background: 'radial-gradient(circle, rgba(0,191,255,0.8), rgba(0,191,255,0.2))',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '2px solid rgba(0,191,255,0.6)',
          backdropFilter: 'blur(20px)',
          zIndex: 1000,
        }}
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            '0 0 20px rgba(0,191,255,0.4)',
            '0 0 40px rgba(0,191,255,0.8)',
            '0 0 20px rgba(0,191,255,0.4)',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Typography sx={{ fontSize: '2rem' }}>⚡</Typography>
      </motion.div>
    </Box>
  );
};

export default WildDashboard;