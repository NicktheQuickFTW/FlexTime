import React, { ReactNode } from 'react';
import { Card, CardProps, styled } from '@mui/material';

interface GlassmorphicCardProps extends CardProps {
  blurStrength?: number;
  opacity?: number;
  children: ReactNode;
}

// Base styled component using the styled() utility for reusability
const StyledGlassCard = styled(Card, {
  shouldForwardProp: (prop) => 
    prop !== 'blurStrength' && prop !== 'opacity',
})<{ blurStrength?: number; opacity?: number }>(
  ({ theme, blurStrength = 10, opacity = 0.15 }) => ({
    backgroundColor: `rgba(255, 255, 255, ${opacity})`,
    backdropFilter: `blur(${blurStrength}px)`,
    WebkitBackdropFilter: `blur(${blurStrength}px)`, // Safari support
    borderRadius: '16px',
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: theme.shadows[2],
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: theme.shadows[8],
      transform: 'translateY(-5px)',
    },
    // Ensure proper stacking context for backdrop-filter
    position: 'relative',
    zIndex: 1,
  })
);

/**
 * A glassmorphic card component that applies a frosted glass effect.
 * 
 * @param blurStrength - The strength of the blur effect (default: 10)
 * @param opacity - The opacity of the background (default: 0.15)
 * @param children - The content of the card
 * @param props - Additional MUI Card props
 */
const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  blurStrength,
  opacity,
  children,
  ...props
}) => {
  return (
    <StyledGlassCard 
      blurStrength={blurStrength} 
      opacity={opacity}
      {...props}
    >
      {children}
    </StyledGlassCard>
  );
};

export default GlassmorphicCard;
