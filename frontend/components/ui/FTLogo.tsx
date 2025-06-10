import React from 'react';
import Image from 'next/image';

interface FTLogoProps {
  /** Logo variant */
  variant?: 'light' | 'dark' | 'white' | 'black';
  /** Size of the logo */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  /** Additional CSS classes */
  className?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Optional click handler */
  onClick?: () => void;
  /** Whether to show text alongside logo */
  showText?: boolean;
  /** Custom text to display instead of FLEXTIME */
  customText?: string;
}

/**
 * FlexTime Logo Component
 * 
 * Displays the official FlexTime logo with multiple size and color variants.
 * Uses the actual FT brand assets from /public/logos/flextime/.
 * 
 * @example
 * ```tsx
 * // Light variant for dark backgrounds
 * <FTLogo variant="light" size="md" />
 * 
 * // With text
 * <FTLogo variant="white" size="lg" showText />
 * 
 * // Custom size
 * <FTLogo size={64} />
 * ```
 */
export const FTLogo: React.FC<FTLogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
  alt = 'FlexTime',
  onClick,
  showText = false,
  customText,
}) => {
  // Size mapping
  const sizeMap = {
    xs: 20,
    sm: 28,
    md: 40,
    lg: 56,
    xl: 80,
  };
  
  const logoSize = typeof size === 'number' ? size : sizeMap[size];
  
  // Logo path mapping to actual files
  const logoPath = {
    light: '/logos/flextime/flextime-light.svg',
    dark: '/logos/flextime/flextime-dark.svg', 
    white: '/logos/flextime/flextime-white240x240.svg',
    black: '/logos/flextime/flextime-black240x240.svg',
  }[variant];
  
  const containerClasses = `ft-logo-container ${className} ${onClick ? 'cursor-pointer' : ''}`;
  
  return (
    <div 
      className={`${containerClasses} flex items-center gap-2`}
      onClick={onClick}
      style={{
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'scale(1)';
        }
      }}
    >
      <Image
        src={logoPath}
        alt={alt}
        width={logoSize}
        height={logoSize}
        className={`ft-logo ft-logo-${variant} object-contain`}
        priority
      />
      {showText && (
        <span 
          className="ft-logo-text font-ft-brand font-bold uppercase bg-gradient-to-r from-black to-[color:var(--ft-neon)] dark:from-white dark:to-[color:var(--ft-neon)] bg-clip-text text-transparent" 
          style={{ fontSize: logoSize * 0.6 }}
        >
          {customText || 'FLEXTIME'}
        </span>
      )}
    </div>
  );
};

export default FTLogo;