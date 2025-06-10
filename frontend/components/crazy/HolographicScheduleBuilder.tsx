import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, Button, Card } from '@mui/material';
import { motion, useMotionValue, useTransform } from 'framer-motion';

/**
 * ABSOLUTELY INSANE Holographic Schedule Builder
 * 
 * Features:
 * - 3D floating geometric shapes
 * - Real-time holographic projections
 * - Interactive neural network nodes
 * - Particle field interactions
 * - Crazy visual effects
 */
export const HolographicScheduleBuilder: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<Array<{
    id: string;
    x: number;
    y: number;
    z: number;
    type: 'team' | 'venue' | 'constraint' | 'game';
    connections: string[];
    energy: number;
  }>>([]);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [15, -15]);
  const rotateY = useTransform(mouseX, [-300, 300], [-15, 15]);

  // Initialize 3D node network
  useEffect(() => {
    const initNodes = Array.from({ length: 20 }, (_, i) => ({
      id: `node-${i}`,
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      z: (Math.random() - 0.5) * 400,
      type: ['team', 'venue', 'constraint', 'game'][Math.floor(Math.random() * 4)] as any,
      connections: [],
      energy: Math.random() * 100,
    }));

    // Create random connections
    initNodes.forEach(node => {
      const connectionCount = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < connectionCount; i++) {
        const randomNode = initNodes[Math.floor(Math.random() * initNodes.length)];
        if (randomNode.id !== node.id && !node.connections.includes(randomNode.id)) {
          node.connections.push(randomNode.id);
        }
      }
    });

    setNodes(initNodes);
  }, []);

  const handleMouseMove = (event: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      mouseX.set(event.clientX - rect.left - rect.width / 2);
      mouseY.set(event.clientY - rect.top - rect.height / 2);
    }
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'team': return '#00bfff';
      case 'venue': return '#ffa500';
      case 'constraint': return '#ff6b6b';
      case 'game': return '#4ecdc4';
      default: return '#ffffff';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'team': return '🏆';
      case 'venue': return '🏟️';
      case 'constraint': return '⚖️';
      case 'game': return '⚽';
      default: return '●';
    }
  };

  return (
    <Box 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      sx={{ 
        position: 'relative',
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at center, #0a0e17 0%, #000000 100%)',
        overflow: 'hidden',
        perspective: '1000px',
      }}
    >
      {/* Holographic Grid Background */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            linear-gradient(rgba(0,191,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,191,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          rotateX,
          rotateY,
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      {/* Floating 3D Header */}
      <motion.div
        style={{
          position: 'absolute',
          top: 50,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
        }}
        animate={{
          y: [0, -10, 0],
          rotateX: [0, 5, 0],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Typography 
          variant="h1" 
          className="ft-font-brand"
          sx={{
            fontSize: '4rem',
            background: 'linear-gradient(45deg, #00bfff, #ffa500, #00bfff)',
            backgroundSize: '200% 200%',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 50px rgba(0,191,255,0.8)',
            textAlign: 'center',
            animation: 'gradient 3s ease infinite',
            '@keyframes gradient': {
              '0%': { backgroundPosition: '0% 50%' },
              '50%': { backgroundPosition: '100% 50%' },
              '100%': { backgroundPosition: '0% 50%' },
            },
          }}
        >
          HOLOGRAPHIC MATRIX
        </Typography>
      </motion.div>

      {/* 3D Neural Network Visualization */}
      <motion.div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '600px',
          transformStyle: 'preserve-3d',
          rotateX,
          rotateY,
        }}
      >
        {/* Connection Lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
          }}
        >
          {nodes.map(node => 
            node.connections.map(connectionId => {
              const connectedNode = nodes.find(n => n.id === connectionId);
              if (!connectedNode) return null;
              
              return (
                <motion.line
                  key={`${node.id}-${connectionId}`}
                  x1={node.x + 400}
                  y1={node.y + 300}
                  x2={connectedNode.x + 400}
                  y2={connectedNode.y + 300}
                  stroke={getNodeColor(node.type)}
                  strokeWidth="2"
                  opacity="0.4"
                  animate={{
                    opacity: [0.2, 0.8, 0.2],
                    strokeWidth: [1, 3, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              );
            })
          )}
        </svg>

        {/* 3D Nodes */}
        {nodes.map((node, index) => (
          <motion.div
            key={node.id}
            style={{
              position: 'absolute',
              left: node.x + 400,
              top: node.y + 300,
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${getNodeColor(node.type)}80, ${getNodeColor(node.type)}20)`,
              border: `2px solid ${getNodeColor(node.type)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transformStyle: 'preserve-3d',
              zIndex: 2,
            }}
            initial={{ scale: 0, rotateY: 0 }}
            animate={{ 
              scale: 1,
              rotateY: [0, 360],
              z: [node.z, node.z + 50, node.z],
              boxShadow: [
                `0 0 20px ${getNodeColor(node.type)}40`,
                `0 0 40px ${getNodeColor(node.type)}80`,
                `0 0 20px ${getNodeColor(node.type)}40`,
              ],
            }}
            transition={{
              scale: { delay: index * 0.1, duration: 0.5 },
              rotateY: { duration: 10, repeat: Infinity, ease: "linear" },
              z: { duration: 3, repeat: Infinity, ease: "easeInOut" },
              boxShadow: { duration: 2, repeat: Infinity },
            }}
            whileHover={{ 
              scale: 1.3,
              z: node.z + 100,
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Typography sx={{ fontSize: '1.5rem' }}>
              {getNodeIcon(node.type)}
            </Typography>
            
            {/* Energy Ring */}
            <motion.div
              style={{
                position: 'absolute',
                width: 80,
                height: 80,
                border: `1px solid ${getNodeColor(node.type)}`,
                borderRadius: '50%',
                top: -10,
                left: -10,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3],
                rotate: [0, 360],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Floating Geometric Shapes */}
      {Array.from({ length: 8 }, (_, i) => (
        <motion.div
          key={`shape-${i}`}
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
            border: '1px solid rgba(0,191,255,0.3)',
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
            duration: 15 + Math.random() * 10,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Control Panel */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 50,
          right: 50,
          zIndex: 10,
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
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: 3,
            flexWrap: 'wrap',
          }}>
            {[
              { label: 'QUANTUM SYNC', icon: '⚡', color: '#00bfff' },
              { label: 'NEURAL OPTIMIZE', icon: '🧠', color: '#ffa500' },
              { label: 'MATRIX RENDER', icon: '🔮', color: '#ff6b6b' },
              { label: 'HOLOGRAM MODE', icon: '✨', color: '#4ecdc4' },
            ].map((action, index) => (
              <motion.div key={action.label}>
                <Button
                  variant="contained"
                  sx={{
                    background: `linear-gradient(45deg, ${action.color}40, ${action.color}80)`,
                    border: `1px solid ${action.color}`,
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    color: '#ffffff',
                    fontFamily: 'var(--ft-font-ui)',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(20px)',
                    '&:hover': {
                      background: `linear-gradient(45deg, ${action.color}60, ${action.color})`,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 10px 30px ${action.color}40`,
                    },
                  }}
                  startIcon={<span style={{ fontSize: '1.2rem' }}>{action.icon}</span>}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </Box>
        </Card>
      </motion.div>
    </Box>
  );
};

export default HolographicScheduleBuilder;