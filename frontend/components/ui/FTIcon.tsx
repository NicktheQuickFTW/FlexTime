import React from 'react';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { CSSProperties } from 'react';

// FlexTime Logo Icons (using actual logo files)
export const FLEXTIME_LOGOS = {
  'flextime-light': '/logos/flextime/flextime-light.svg',
  'flextime-dark': '/logos/flextime/flextime-dark.svg',
  'flextime-white': '/logos/flextime/flextime-white240x240.svg',
  'flextime-black': '/logos/flextime/flextime-black240x240.svg',
  'flextime-white-large': '/logos/flextime/flextime-white1028x1028.svg',
  'flextime-black-large': '/logos/flextime/flextime-black1028x1028.svg',
} as const;

// Big 12 Sports Icon Mapping
export const SPORT_ICONS = {
  // Major Sports
  football: 'mdi:football',
  basketball: 'mdi:basketball',
  baseball: 'mdi:baseball',
  softball: 'mdi:softball',
  soccer: 'mdi:soccer',
  volleyball: 'mdi:volleyball',
  tennis: 'mdi:tennis',
  golf: 'mdi:golf',
  swimming: 'mdi:pool',
  wrestling: 'mdi:wrestling',
  
  // Track & Field
  track: 'mdi:track-light',
  'cross-country': 'mdi:run',
  'track-field': 'material-symbols:track-changes',
  
  // Olympic Sports
  gymnastics: 'mdi:gymnastics',
  lacrosse: 'mdi:lacrosse',
  rowing: 'mdi:rowing',
  
  // Specialty Sports
  'beach-volleyball': 'mdi:volleyball',
  equestrian: 'mdi:horse',
  'diving': 'mdi:diving-scuba',
  
  // UI Icons
  schedule: 'lucide:calendar',
  analytics: 'lucide:bar-chart-3',
  teams: 'lucide:users',
  constraints: 'lucide:settings',
  dashboard: 'lucide:layout-dashboard',
  compass: 'lucide:compass',
  ai: 'ph:robot',
  optimization: 'lucide:zap',
  collaboration: 'lucide:users-2',
  export: 'lucide:download',
  settings: 'lucide:settings',
  home: 'lucide:home',
  search: 'lucide:search',
  filter: 'lucide:filter',
  sort: 'lucide:arrow-up-down',
  edit: 'lucide:edit-3',
  save: 'lucide:save',
  cancel: 'lucide:x',
  delete: 'lucide:trash-2',
  add: 'lucide:plus',
  remove: 'lucide:minus',
  expand: 'lucide:expand',
  collapse: 'lucide:minimize',
  refresh: 'lucide:refresh-cw',
  play: 'lucide:play',
  pause: 'lucide:pause',
  stop: 'lucide:stop',
  check: 'lucide:check',
  
  // Theme & UI
  theme: 'lucide:palette',
  'theme-dark': 'lucide:moon',
  'theme-light': 'lucide:sun',
  
  // Big 12 Conference
  conference: 'mdi:trophy',
  championship: 'mdi:trophy-award',
  
  // Venues & Travel
  venue: 'lucide:map-pin',
  travel: 'lucide:plane',
  distance: 'lucide:route',
  
  // Status
  success: 'lucide:check-circle',
  warning: 'lucide:alert-triangle',
  error: 'lucide:x-circle',
  info: 'lucide:info',
  loading: 'lucide:loader',
  
  // Navigation
  menu: 'lucide:menu',
  close: 'lucide:x',
  back: 'lucide:arrow-left',
  forward: 'lucide:arrow-right',
  up: 'lucide:arrow-up',
  down: 'lucide:arrow-down',
} as const;

export type SportIconName = keyof typeof SPORT_ICONS;
export type FlexTimeLogoName = keyof typeof FLEXTIME_LOGOS;

interface FTIconProps {
  name: SportIconName | FlexTimeLogoName | string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  variant?: 'default' | 'glow' | 'accent' | 'muted';
  alt?: string; // For FlexTime logos
}

const FTIcon: React.FC<FTIconProps> = ({
  name,
  size = 24,
  color,
  className = '',
  style = {},
  onClick,
  variant = 'default',
  alt = 'Icon'
}) => {
  // Check if this is a FlexTime logo
  const isFlexTimeLogo = name in FLEXTIME_LOGOS;
  
  if (isFlexTimeLogo) {
    // Handle FlexTime logos with Next.js Image
    const logoPath = FLEXTIME_LOGOS[name as FlexTimeLogoName];
    const logoSize = typeof size === 'number' ? size : parseInt(String(size)) || 24;
    
    // Apply glow effect for glow variant
    const glowStyle = variant === 'glow' ? {
      filter: 'drop-shadow(0 0 8px rgba(0, 191, 255, 0.5))',
      ...style
    } : style;
    
    return (
      <div 
        className={`ft-icon ft-logo ${variant} ${className} ${onClick ? 'cursor-pointer' : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: logoSize,
          height: logoSize,
          ...glowStyle
        }}
        onClick={onClick}
      >
        <Image
          src={logoPath}
          alt={alt}
          width={logoSize}
          height={logoSize}
          className="object-contain"
          style={{ 
            width: logoSize, 
            height: logoSize,
            maxWidth: 'none'
          }}
        />
      </div>
    );
  }
  
  // Handle regular iconify icons
  const iconName = SPORT_ICONS[name as SportIconName] || name;
  
  // Variant-based color mapping
  const getVariantColor = () => {
    if (color) return color;
    
    switch (variant) {
      case 'glow':
        return 'var(--ft-cyber-cyan)';
      case 'accent':
        return 'var(--ft-golden-hour)';
      case 'muted':
        return 'var(--ft-silver-mist)';
      default:
        return 'var(--ft-crystal-white)';
    }
  };
  
  // Apply glow effect for glow variant
  const glowStyle = variant === 'glow' ? {
    filter: 'drop-shadow(0 0 8px rgba(0, 191, 255, 0.5))',
    ...style
  } : style;
  
  const iconProps = {
    icon: iconName,
    width: size,
    height: size,
    color: getVariantColor(),
    className: `ft-icon ${variant} ${className}`,
    style: glowStyle,
    onClick,
  };
  
  return <Icon {...iconProps} />;
};

// Preset Sport Icons for convenience
export const SportIcon: React.FC<Omit<FTIconProps, 'name'> & { sport: SportIconName }> = ({
  sport,
  ...props
}) => <FTIcon name={sport} {...props} />;

// Preset UI Icons for convenience
export const UIIcon: React.FC<Omit<FTIconProps, 'name'> & { type: SportIconName }> = ({
  type,
  ...props
}) => <FTIcon name={type} {...props} />;

// Preset FlexTime Logo Icons for convenience
export const FlexTimeLogo: React.FC<Omit<FTIconProps, 'name'> & { variant: FlexTimeLogoName }> = ({
  variant,
  ...props
}) => <FTIcon name={variant} {...props} />;

export default FTIcon;