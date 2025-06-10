import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Box, Typography, Card, CardContent, Button } from '@mui/material';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { FTLogo } from '../ui/FTLogo';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  magnetism: number;
}

interface Schedule {
  id: string;
  team1: string;
  team2: string;
  sport: string;
  venue: string;
  time: string;
  x: number;
  y: number;
  color: string;
}

/**
 * ULTIMATE FLEXTIME DASHBOARD
 * 
 * The most INSANE sports scheduling interface ever created:
 * - Magic UI inspired particle systems
 * - Animated border beams on all elements
 * - Interactive ripple effects
 * - 3D floating schedule cards
 * - Neural network beam connections
 * - Quantum sport field visualizations
 * - Real-time particle magnetism
 * - Holographic UI with crazy animations
 */
export const UltimateFlexTimeDashboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number; timestamp: number }>>([]);
  
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 300 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  const sports = [
    { name: 'Football', color: '#ff4444', teams: ['Cowboys', 'Eagles', 'Giants', 'Chiefs'] },
    { name: 'Basketball', color: '#44ff44', teams: ['Lakers', 'Warriors', 'Celtics', 'Heat'] },
    { name: 'Baseball', color: '#4444ff', teams: ['Yankees', 'Dodgers', 'Red Sox', 'Astros'] },
    { name: 'Soccer', color: '#ffff44', teams: ['FC Dallas', 'Austin FC', 'Houston Dynamo', 'Sporting KC'] },
  ];

  // Initialize particles with Magic UI inspired effects
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create Magic UI style particles
    const newParticles: Particle[] = Array.from({ length: 150 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
      color: sports[Math.floor(Math.random() * sports.length)].color,
      alpha: Math.random() * 0.8 + 0.2,
      magnetism: Math.random() * 50 + 20,
    }));

    setParticles(newParticles);

    // Create sample schedules
    const sampleSchedules: Schedule[] = Array.from({ length: 12 }, (_, i) => {
      const sport = sports[Math.floor(Math.random() * sports.length)];
      const team1 = sport.teams[Math.floor(Math.random() * sport.teams.length)];
      let team2 = sport.teams[Math.floor(Math.random() * sport.teams.length)];
      while (team2 === team1) {
        team2 = sport.teams[Math.floor(Math.random() * sport.teams.length)];
      }

      return {
        id: `schedule-${i}`,
        team1,
        team2,
        sport: sport.name,
        venue: `Stadium ${i + 1}`,
        time: `${Math.floor(Math.random() * 12) + 1}:00 PM`,
        x: (i % 4) * 300 + 150,
        y: Math.floor(i / 4) * 200 + 200,
        color: sport.color,
      };
    });

    setSchedules(sampleSchedules);
  }, []);

  // Magic UI inspired particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles with magnetism effect
      particles.forEach((particle, index) => {
        // Mouse magnetism (Magic UI style)
        const dx = mousePos.x - particle.x;
        const dy = mousePos.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < particle.magnetism) {
          const force = (particle.magnetism - distance) / particle.magnetism;
          particle.vx += dx * force * 0.01;
          particle.vy += dy * force * 0.01;
        }

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Boundary bouncing
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;

        // Apply damping
        particle.vx *= 0.995;
        particle.vy *= 0.995;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = particle.size * 3;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Draw connections to nearby particles
        particles.forEach((otherParticle, otherIndex) => {
          if (index < otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              ctx.save();
              ctx.globalAlpha = (120 - distance) / 120 * 0.3;
              ctx.strokeStyle = particle.color;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.stroke();
              ctx.restore();
            }
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [particles, mousePos]);

  // Mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
      mouseX.set(x);
      mouseY.set(y);
    }
  }, [mouseX, mouseY]);

  // Create ripple effect
  const createRipple = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { x, y, id, timestamp: Date.now() }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id));
    }, 1000);
  }, []);

  return (
    <Box
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={createRipple}
      sx={{
        position: 'relative',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0e17 0%, #000000 100%)',
        overflow: 'hidden',
        cursor: 'none',
      }}
    >
      {/* Magic UI Particle Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Ripple Effects */}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.div
            key={ripple.id}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: 'absolute',
              left: ripple.x - 25,
              top: ripple.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              border: '2px solid #00bfff',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Custom Cursor */}
      <motion.div
        style={{
          position: 'absolute',
          left: springX,
          top: springY,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #00bfff, transparent)',
          border: '2px solid #00bfff',
          pointerEvents: 'none',
          zIndex: 10,
          transform: 'translate(-50%, -50%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          boxShadow: [
            '0 0 20px #00bfff',
            '0 0 40px #00bfff',
            '0 0 20px #00bfff',
          ],
        }}
        transition={{ duration: 2, repeat: Infinity }}
      />

      {/* Holographic Header with Border Beam */}
      <motion.div
        style={{
          position: 'relative',
          zIndex: 3,
          padding: 40,
          textAlign: 'center',
        }}
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <Box sx={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(0,191,255,0.1), rgba(255,255,255,0.05))',
          backdropFilter: 'blur(30px)',
          border: '2px solid transparent',
          borderRadius: 4,
          padding: 4,
          overflow: 'hidden',
        }}>
          {/* Magic UI Border Beam Effect */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              background: 'linear-gradient(90deg, transparent, #00bfff, transparent)',
              opacity: 0.6,
            }}
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          <Box sx={{ position: 'relative', zIndex: 2 }}>
            <FTLogo size="xl" />
            <Typography 
              variant="h1" 
              className="ft-font-brand"
              sx={{ 
                fontSize: '5rem',
                background: 'linear-gradient(45deg, #00bfff, #ffa500, #ff6b6b, #4ecdc4)',
                backgroundSize: '400% 400%',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                textShadow: '0 0 50px rgba(0,191,255,0.8)',
                mt: 2,
                animation: 'gradient 4s ease infinite',
                '@keyframes gradient': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' },
                },
              }}
            >
              ULTIMATE FLEXTIME
            </Typography>
            <Typography 
              variant="h3" 
              className="ft-font-ui"
              sx={{ 
                color: 'rgba(255,255,255,0.8)',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                textShadow: '0 0 20px rgba(0,191,255,0.5)',
              }}
            >
              Quantum Sports Matrix
            </Typography>
          </Box>
        </Box>
      </motion.div>

      {/* 3D Floating Schedule Cards with Animated Beams */}
      <Box sx={{ position: 'relative', zIndex: 3, padding: 4 }}>
        {schedules.map((schedule, index) => (
          <motion.div
            key={schedule.id}
            style={{
              position: 'absolute',
              left: schedule.x,
              top: schedule.y,
            }}
            initial={{ opacity: 0, scale: 0, rotateY: 180 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ 
              delay: index * 0.1,
              duration: 0.8,
              type: "spring",
              stiffness: 100,
            }}
            whileHover={{ 
              scale: 1.1,
              rotateY: 10,
              rotateX: 5,
              z: 50,
            }}
          >
            <Card sx={{
              width: 280,
              background: `linear-gradient(135deg, ${schedule.color}20, rgba(255,255,255,0.05))`,
              backdropFilter: 'blur(30px)',
              border: `2px solid ${schedule.color}60`,
              borderRadius: 4,
              overflow: 'hidden',
              position: 'relative',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
            }}>
              {/* Magic UI Shine Border Effect */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: `linear-gradient(90deg, transparent, ${schedule.color}60, transparent)`,
                  borderRadius: 16,
                }}
                animate={{
                  left: ['100%', '-100%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.2,
                  ease: "linear",
                }}
              />
              
              <CardContent sx={{ p: 3, position: 'relative', zIndex: 2 }}>
                <Typography 
                  variant="h6" 
                  className="ft-font-brand"
                  sx={{ 
                    color: schedule.color, 
                    textShadow: `0 0 10px ${schedule.color}80`,
                    mb: 1,
                  }}
                >
                  {schedule.sport}
                </Typography>
                
                <Typography 
                  variant="h5" 
                  className="ft-font-ui"
                  sx={{ 
                    color: '#ffffff',
                    mb: 2,
                    fontWeight: 600,
                  }}
                >
                  {schedule.team1} vs {schedule.team2}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    mb: 1,
                  }}
                >
                  📍 {schedule.venue}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  ⏰ {schedule.time}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* Floating Action Controls */}
      <motion.div
        style={{
          position: 'fixed',
          bottom: 30,
          right: 30,
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
      >
        {[
          { icon: '⚡', label: 'Quantum Sync', color: '#00bfff' },
          { icon: '🧠', label: 'Neural AI', color: '#ffa500' },
          { icon: '🔮', label: 'Matrix Mode', color: '#ff6b6b' },
          { icon: '✨', label: 'Hologram', color: '#4ecdc4' },
        ].map((action, index) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.2, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${action.color}80, ${action.color}20)`,
                border: `2px solid ${action.color}`,
                backdropFilter: 'blur(20px)',
                fontSize: '1.5rem',
                color: '#ffffff',
                '&:hover': {
                  background: `radial-gradient(circle, ${action.color}, ${action.color}60)`,
                  boxShadow: `0 0 30px ${action.color}60`,
                },
              }}
            >
              {action.icon}
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </Box>
  );
};

export default UltimateFlexTimeDashboard;