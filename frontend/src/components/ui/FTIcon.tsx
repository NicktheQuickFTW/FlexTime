import React from 'react';
import { Icon, IconifyIcon } from '@iconify/react';
import { CSSProperties } from 'react';

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

interface FTIconProps {
  name: SportIconName | string;
  size?: number | string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  variant?: 'default' | 'glow' | 'accent' | 'muted';
}

const FTIcon: React.FC<FTIconProps> = ({
  name,
  size = 24,
  color,
  className = '',
  style = {},
  onClick,
  variant = 'default'
}) => {
  // Get icon from mapping or use name directly if not found
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

export default FTIcon;