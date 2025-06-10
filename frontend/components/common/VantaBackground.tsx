import React, { useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import useReducedMotion from '../../hooks/useReducedMotion';

// We'll dynamically import Vanta to avoid SSR issues
let VANTA: any = null;

interface VantaBackgroundProps {
  effect: 'waves' | 'clouds' | 'birds' | 'net' | 'globe' | 'rings' | 'halo';
  children?: React.ReactNode;
  options?: Record<string, any>;
  sx?: any;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ 
  effect, 
  children, 
  options = {}, 
  sx = {} 
}) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);
  const theme = useTheme();
  const prefersReducedMotion = useReducedMotion();
  
  useEffect(() => {
    // Don't load or initialize Vanta if user prefers reduced motion
    if (prefersReducedMotion) {
      return;
    }
    
    // Dynamically import Vanta and the requested effect
    const loadVanta = async () => {
      try {
        // Import the core Vanta library
        VANTA = await import('vanta/dist/vanta.js');
        
        // Import the specific effect (loaded for side effects)
        switch (effect) {
          case 'waves':
            await import('vanta/dist/vanta.waves.min.js');
            break;
          case 'clouds':
            await import('vanta/dist/vanta.clouds.min.js');
            break;
          case 'birds':
            await import('vanta/dist/vanta.birds.min.js');
            break;
          case 'net':
            await import('vanta/dist/vanta.net.min.js');
            break;
          case 'globe':
            await import('vanta/dist/vanta.globe.min.js');
            break;
          case 'rings':
            await import('vanta/dist/vanta.rings.min.js');
            break;
          case 'halo':
            await import('vanta/dist/vanta.halo.min.js');
            break;
          default:
            console.error(`Unsupported Vanta effect: ${effect}`);
            return;
        }
        
        // Initialize the effect with default and custom options
        if (vantaRef.current && !vantaEffect) {
          const isDarkMode = theme.palette.mode === 'dark';
          
          // Default options based on theme
          const defaultOptions = {
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: isDarkMode ? 0x0066cc : 0x3399ff,
            backgroundColor: isDarkMode ? 0x111111 : 0xffffff,
            speed: 1.5,
          };
          
          // Create the effect with merged options
          const newEffect = VANTA[effect.toUpperCase()]({
            ...defaultOptions,
            ...options
          });
          
          setVantaEffect(newEffect);
        }
      } catch (error) {
        console.error('Failed to load Vanta.js:', error);
      }
    };
    
    loadVanta();
    
    // Cleanup function
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [effect, options, theme.palette.mode, prefersReducedMotion, vantaEffect]);
  
  // If user prefers reduced motion, render a simple gradient background instead
  if (prefersReducedMotion) {
    const isDarkMode = theme.palette.mode === 'dark';
    return (
      <Box
        sx={{
          position: 'relative',
          background: isDarkMode 
            ? 'linear-gradient(135deg, #0d1117 0%, #161b22 100%)' 
            : 'linear-gradient(135deg, #f0f5ff 0%, #e6f0ff 100%)',
          ...sx
        }}
      >
        {children}
      </Box>
    );
  }
  
  return (
    <Box
      ref={vantaRef}
      sx={{
        position: 'relative',
        ...sx
      }}
    >
      {children}
    </Box>
  );
};

export default VantaBackground;
