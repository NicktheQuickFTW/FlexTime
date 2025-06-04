'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowTextProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  variant?: 'primary' | 'secondary' | 'subtle';
  animate?: boolean;
}

const GlowText: React.FC<GlowTextProps> = ({
  children,
  className = '',
  as = 'span',
  variant = 'primary',
  animate = false,
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-white to-[color:var(--ft-neon)] bg-clip-text text-transparent',
    secondary: 'bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent',
    subtle: 'bg-gradient-to-r from-gray-100 to-gray-400 bg-clip-text text-transparent',
  };

  const Component = as;
  
  // Basic component without animation
  if (!animate) {
    return (
      <Component className={`${variants[variant]} ${className}`}>
        {children}
      </Component>
    );
  }
  
  // Animated version
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="inline-block"
    >
      <Component className={`${variants[variant]} ${className}`}>
        {children}
      </Component>
    </motion.div>
  );
};

export default GlowText;
