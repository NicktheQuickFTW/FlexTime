'use client';

import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'neon';
  hoverable?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  variant = 'default',
  hoverable = false,
}) => {
  const baseClasses = 'backdrop-blur-md rounded-xl transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-white/5 border border-white/10',
    dark: 'bg-black/40 border border-white/5',
    neon: 'bg-black/30 border border-[color:var(--ft-neon)]/30 shadow-sm shadow-[color:var(--ft-neon-glow)]/20'
  };
  
  const hoverClasses = hoverable 
    ? variant === 'neon' 
      ? 'hover:bg-black/50 hover:border-[color:var(--ft-neon)]/50 hover:shadow-md hover:shadow-[color:var(--ft-neon-glow)]/30' 
      : 'hover:bg-white/10 hover:border-white/20'
    : '';
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;
