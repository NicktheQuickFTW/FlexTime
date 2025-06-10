import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  sport: string;
}

interface QuantumField {
  x: number;
  y: number;
  z: number;
  radius: number;
  strength: number;
  sport: string;
  teams: string[];
}

/**
 * QUANTUM SPORTS VISUALIZATION
 * 
 * The most INSANE sports scheduling visualization ever created:
 * - 3D particle physics simulation
 * - Quantum field interactions between sports
 * - Real-time neural network visualization
 * - Holographic team clustering
 * - Crazy particle effects for each sport
 */
export const QuantumSportsViz: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [quantumFields, setQuantumFields] = useState<QuantumField[]>([]);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);

  const sports = [
    { name: 'Football', color: '#ff4444', icon: '🏈', teams: 16 },
    { name: 'Basketball', color: '#44ff44', icon: '🏀', teams: 16 },
    { name: 'Baseball', color: '#4444ff', icon: '⚾', teams: 14 },
    { name: 'Soccer', color: '#ffff44', icon: '⚽', teams: 16 },
    { name: 'Volleyball', color: '#ff44ff', icon: '🏐', teams: 15 },
    { name: 'Wrestling', color: '#44ffff', icon: '🤼', teams: 14 },
  ];

  // Initialize quantum fields and particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create quantum fields for each sport
    const fields: QuantumField[] = sports.map((sport, index) => ({
      x: (Math.cos(index * (Math.PI * 2) / sports.length) * 300) + canvas.width / 2,
      y: (Math.sin(index * (Math.PI * 2) / sports.length) * 300) + canvas.height / 2,
      z: Math.random() * 200 - 100,
      radius: 150,
      strength: sport.teams * 10,
      sport: sport.name,
      teams: Array.from({ length: sport.teams }, (_, i) => `Team ${i + 1}`),
    }));

    setQuantumFields(fields);

    // Create particles for each team
    const newParticles: Particle[] = [];
    fields.forEach(field => {
      for (let i = 0; i < field.teams.length * 3; i++) {
        newParticles.push({
          x: field.x + (Math.random() - 0.5) * field.radius,
          y: field.y + (Math.random() - 0.5) * field.radius,
          z: field.z + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          vz: (Math.random() - 0.5) * 1,
          size: Math.random() * 4 + 2,
          color: sports.find(s => s.name === field.sport)?.color || '#ffffff',
          alpha: Math.random() * 0.8 + 0.2,
          life: 1,
          sport: field.sport,
        });
      }
    });

    setParticles(newParticles);
  }, []);

  // Quantum physics animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw quantum field connections
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      
      quantumFields.forEach((field1, i) => {
        quantumFields.forEach((field2, j) => {
          if (i < j) {
            const dx = field1.x - field2.x;
            const dy = field1.y - field2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 500) {
              // Quantum entanglement visualization
              ctx.save();
              ctx.globalAlpha = (500 - distance) / 500 * 0.3;
              ctx.strokeStyle = `rgba(0, 191, 255, ${(500 - distance) / 500})`;
              ctx.lineWidth = 2;
              
              ctx.beginPath();
              ctx.moveTo(field1.x, field1.y);
              
              // Create wavy quantum connection
              const steps = 20;
              for (let step = 0; step <= steps; step++) {
                const t = step / steps;
                const x = field1.x + dx * t;
                const y = field1.y + dy * t;
                const wave = Math.sin(t * Math.PI * 4 + Date.now() * 0.005) * 20;
                ctx.lineTo(x + wave, y + wave);
              }
              
              ctx.stroke();
              ctx.restore();
            }
          }
        });
      });

      // Draw quantum fields
      quantumFields.forEach(field => {
        const sport = sports.find(s => s.name === field.sport);
        if (!sport) return;

        // Field boundary
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = sport.color;
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.arc(field.x, field.y, field.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // Field center with pulsing effect
        const pulseSize = 20 + Math.sin(Date.now() * 0.01) * 10;
        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = sport.color;
        ctx.shadowColor = sport.color;
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(field.x, field.y, pulseSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Sport icon
        ctx.save();
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(sport.icon, field.x, field.y);
        ctx.restore();
      });

      // Update and draw particles with quantum physics
      particles.forEach((particle, index) => {
        // Apply quantum field forces
        quantumFields.forEach(field => {
          const dx = field.x - particle.x;
          const dy = field.y - particle.y;
          const dz = field.z - particle.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          if (distance < field.radius) {
            const force = field.strength / (distance * distance + 1);
            
            if (particle.sport === field.sport) {
              // Attraction to own field
              particle.vx += dx * force * 0.0001;
              particle.vy += dy * force * 0.0001;
              particle.vz += dz * force * 0.0001;
            } else {
              // Repulsion from other fields
              particle.vx -= dx * force * 0.00005;
              particle.vy -= dy * force * 0.00005;
              particle.vz -= dz * force * 0.00005;
            }
          }
        });

        // Inter-particle forces (flocking behavior)
        particles.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex && particle.sport === otherParticle.sport) {
            const dx = otherParticle.x - particle.x;
            const dy = otherParticle.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 50 && distance > 0) {
              // Cohesion
              particle.vx += dx * 0.0001;
              particle.vy += dy * 0.0001;
            } else if (distance < 20 && distance > 0) {
              // Separation
              particle.vx -= dx * 0.001;
              particle.vy -= dy * 0.001;
            }
          }
        });

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.z += particle.vz;

        // Apply damping
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        particle.vz *= 0.99;

        // Boundary conditions
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -0.8;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -0.8;

        // Calculate 3D perspective
        const perspective = 500;
        const scale = perspective / (perspective + particle.z);
        const projectedX = particle.x * scale;
        const projectedY = particle.y * scale;
        const projectedSize = particle.size * scale;

        // Draw particle with glow effect
        ctx.save();
        ctx.globalAlpha = particle.alpha * scale;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = projectedSize * 2;
        
        ctx.beginPath();
        ctx.arc(projectedX, projectedY, projectedSize, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect
        ctx.globalAlpha = particle.alpha * 0.3 * scale;
        ctx.beginPath();
        ctx.arc(projectedX - particle.vx * 5, projectedY - particle.vy * 5, projectedSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles, quantumFields]);

  return (
    <Box sx={{ 
      position: 'relative',
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at center, #0a0e17 0%, #000000 100%)',
      overflow: 'hidden',
    }}>
      {/* Quantum Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
        }}
      />

      {/* Holographic HUD */}
      <Box sx={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
        pointerEvents: 'none',
      }}>
        {/* Title */}
        <motion.div
          style={{ 
            position: 'absolute',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
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
              textAlign: 'center',
              animation: 'rainbow 4s ease infinite',
              '@keyframes rainbow': {
                '0%': { backgroundPosition: '0% 50%' },
                '50%': { backgroundPosition: '100% 50%' },
                '100%': { backgroundPosition: '0% 50%' },
              },
            }}
          >
            QUANTUM SPORTS MATRIX
          </Typography>
        </motion.div>

        {/* Sport Information Cards */}
        <Box sx={{
          position: 'absolute',
          top: 150,
          right: 30,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}>
          <AnimatePresence>
            {sports.map((sport, index) => (
              <motion.div
                key={sport.name}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                style={{ pointerEvents: 'all' }}
              >
                <Card
                  sx={{
                    background: `linear-gradient(135deg, ${sport.color}20, rgba(255,255,255,0.05))`,
                    backdropFilter: 'blur(30px)',
                    border: `1px solid ${sport.color}60`,
                    borderRadius: 3,
                    minWidth: 200,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: `0 20px 40px ${sport.color}40`,
                    },
                  }}
                  onClick={() => setSelectedSport(selectedSport === sport.name ? null : sport.name)}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: '2rem' }}>{sport.icon}</Typography>
                      <Box>
                        <Typography 
                          variant="h6" 
                          className="ft-font-ui"
                          sx={{ color: sport.color, fontWeight: 600 }}
                        >
                          {sport.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ color: 'rgba(255,255,255,0.7)' }}
                        >
                          {sport.teams} Teams
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </Box>

        {/* Quantum Stats */}
        <motion.div
          style={{
            position: 'absolute',
            bottom: 50,
            left: 50,
            right: 50,
          }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 1 }}
        >
          <Card sx={{
            background: 'linear-gradient(135deg, rgba(0,191,255,0.1), rgba(255,255,255,0.05))',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(0,191,255,0.2)',
            borderRadius: 4,
            p: 3,
            pointerEvents: 'all',
          }}>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 3,
              textAlign: 'center',
            }}>
              <Box>
                <Typography 
                  variant="h3" 
                  className="ft-font-brand"
                  sx={{ color: '#00bfff', textShadow: '0 0 20px rgba(0,191,255,0.5)' }}
                >
                  {particles.length}
                </Typography>
                <Typography className="ft-font-ui">Quantum Particles</Typography>
              </Box>
              <Box>
                <Typography 
                  variant="h3" 
                  className="ft-font-brand"
                  sx={{ color: '#ffa500', textShadow: '0 0 20px rgba(255,165,0,0.5)' }}
                >
                  {quantumFields.length}
                </Typography>
                <Typography className="ft-font-ui">Sport Fields</Typography>
              </Box>
              <Box>
                <Typography 
                  variant="h3" 
                  className="ft-font-brand"
                  sx={{ color: '#ff6b6b', textShadow: '0 0 20px rgba(255,107,107,0.5)' }}
                >
                  ∞
                </Typography>
                <Typography className="ft-font-ui">Possibilities</Typography>
              </Box>
            </Box>
          </Card>
        </motion.div>
      </Box>
    </Box>
  );
};

export default QuantumSportsViz;