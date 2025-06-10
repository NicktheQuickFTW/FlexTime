import React from 'react';
import { Typography, TypographyProps, useTheme } from '@mui/material';

interface GradientTextProps extends Omit<TypographyProps, 'color'> {
  gradient?: string;
  direction?: string;
  children: React.ReactNode;
}

/**
 * A component that renders text with a gradient fill
 * 
 * @param gradient - Custom gradient string (e.g., '#FE6B8B, #FF8E53')
 * @param direction - Direction of the gradient (e.g., '45deg', 'to right')
 * @param children - The text content
 * @param props - Additional Typography props
 */
const GradientText: React.FC<GradientTextProps> = ({
  gradient,
  direction = '45deg',
  children,
  ...props
}) => {
  const theme = useTheme();
  
  // Default gradient uses primary and secondary colors from theme
  const defaultGradient = `${theme.palette.primary.main}, ${theme.palette.secondary.main}`;
  const gradientColors = gradient || defaultGradient;
  
  return (
    <Typography
      {...props}
      sx={{
        backgroundImage: `linear-gradient(${direction}, ${gradientColors})`,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block', // Ensures background applies correctly
        ...props.sx // Allow overriding or extending styles
      }}
    >
      {children}
    </Typography>
  );
};

export default GradientText;
