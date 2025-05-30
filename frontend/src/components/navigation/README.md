# Navigation Components

This directory contains all navigation-related components for the FlexTime application. These components follow the design principles outlined in the FlexTime Playbook and provide a consistent navigation experience across desktop and mobile devices.

## Components Overview

### 🎯 TopAppBar
The main application header that provides:
- FlexTime branding and logo
- Page titles and subtitles
- Breadcrumb navigation
- Theme toggle
- Action buttons (search, notifications, profile, settings)
- Responsive mobile menu button

**Key Features:**
- Glassmorphic design with backdrop blur effects
- Automatic theme-based logo switching
- Responsive breadcrumbs (hidden on mobile)
- Smooth transitions and hover effects
- Accessibility-focused design

### 🧭 NavigationRail
Desktop-only side navigation providing:
- Role-based navigation items
- Sports section navigation
- User profile display
- Persistent navigation state

**Key Features:**
- 280px width with glassmorphic background
- Active state indication with color and weight changes
- Smooth hover animations
- User role customization
- Sport-specific icons and navigation

### 📱 BottomNavigation
Mobile-only bottom navigation featuring:
- Quick access to primary sections
- Material Design 3 styling
- Active state indicators
- Touch-optimized sizing

**Key Features:**
- Fixed bottom positioning
- Glassmorphic background with blur
- Auto-hiding on desktop
- Primary color accent line for active items
- Touch-friendly 64px height

### 📋 MobileDrawer
Slide-out navigation menu for mobile:
- Complete navigation hierarchy
- User profile and role display
- Theme toggle integration
- Settings and profile access

**Key Features:**
- 320px width with smooth slide animation
- Complete navigation structure
- User avatar with role-based styling
- Backdrop blur overlay
- Auto-close on desktop resize

### 🏗️ NavigationLayout
Complete navigation wrapper that:
- Combines all navigation components
- Handles responsive behavior automatically
- Provides consistent layout structure
- Manages mobile drawer state

**Key Features:**
- Automatic desktop/mobile detection
- Integrated state management
- Consistent padding and spacing
- Background gradient effects
- Bottom navigation padding for mobile

## Usage Examples

### Basic Layout (Recommended)
```tsx
import { NavigationLayout } from '../components/navigation';

const App = () => (
  <NavigationLayout
    title="Dashboard"
    subtitle="Welcome back!"
    role="admin"
  >
    <YourPageContent />
  </NavigationLayout>
);
```

### Advanced Custom Layout
```tsx
import { 
  TopAppBar, 
  NavigationRail, 
  BottomNavigation, 
  MobileDrawer 
} from '../components/navigation';

const CustomLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopAppBar
        title="Custom Dashboard"
        showMenuButton={isMobile}
        onMenuClick={() => setDrawerOpen(true)}
        actions={
          <IconButton>
            <CustomIcon />
          </IconButton>
        }
      />
      
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {!isMobile && <NavigationRail role="admin" />}
        
        <main>
          <YourContent />
        </main>
      </Box>
      
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        role="admin"
      />
      
      <BottomNavigation show={isMobile} />
    </Box>
  );
};
```

## Props Reference

### TopAppBar Props
```typescript
interface TopAppBarProps {
  title?: string;              // Page title
  subtitle?: string;           // Page subtitle
  actions?: React.ReactNode;   // Custom action buttons
  showBreadcrumbs?: boolean;   // Show breadcrumb navigation
  onMenuClick?: () => void;    // Mobile menu toggle handler
  showMenuButton?: boolean;    // Show mobile menu button
}
```

### NavigationLayout Props
```typescript
interface NavigationLayoutProps {
  children: React.ReactNode;   // Page content
  title?: string;              // Page title
  subtitle?: string;           // Page subtitle
  actions?: React.ReactNode;   // Custom action buttons
  showBreadcrumbs?: boolean;   // Show breadcrumb navigation
  role?: UserRole;             // User role for navigation
  showBottomNav?: boolean;     // Show mobile bottom navigation
}
```

### MobileDrawer Props
```typescript
interface MobileDrawerProps {
  open: boolean;               // Drawer open state
  onClose: () => void;         // Close handler
  role?: UserRole;             // User role for navigation items
}
```

## Design System Integration

### Theme Integration
- Uses `useThemeContext()` for theme mode detection
- Automatic logo switching based on theme
- Glassmorphic effects with theme-appropriate colors
- Material-UI theme integration

### Responsive Design
- Mobile-first approach with progressive enhancement
- Breakpoint-based component switching
- Touch-optimized sizing for mobile components
- Automatic layout adjustments

### Accessibility
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader compatibility

## Styling

### CSS Classes
The navigation components use both Material-UI's `sx` prop and custom CSS classes:

- `.ft-top-app-bar` - Top app bar styling
- `.ft-navigation-rail` - Desktop navigation rail
- `.ft-mobile-drawer` - Mobile drawer styling
- `.ft-bottom-navigation` - Mobile bottom navigation
- `.ft-nav-item` - Individual navigation items

### Theme Variables
Components use CSS custom properties for consistent theming:
- `--flextime-primary` - Primary brand color
- `--flextime-secondary` - Secondary accent color
- `--flextime-background` - Background colors
- `--flextime-surface` - Surface colors

## Performance Considerations

### Optimization Features
- Conditional rendering for mobile/desktop components
- Lazy loading of navigation items
- Efficient state management
- Minimal re-renders with React.memo where appropriate

### Bundle Size
- Tree-shakable exports
- Shared dependencies
- Optimized Material-UI imports
- CSS-in-JS optimization

## Testing

### Component Testing
```bash
# Run navigation component tests
npm test -- --testPathPattern=navigation

# Run specific component tests
npm test TopAppBar.test.tsx
npm test NavigationRail.test.tsx
```

### E2E Testing
Navigation components are tested for:
- Responsive behavior
- Theme switching
- Route navigation
- Mobile drawer functionality
- Accessibility compliance

## Contributing

When contributing to navigation components:

1. Follow the existing component structure
2. Maintain consistency with the design system
3. Ensure responsive behavior
4. Add appropriate TypeScript types
5. Include accessibility features
6. Write comprehensive tests
7. Update documentation

## Migration Guide

### From Legacy Navigation
If migrating from legacy navigation components:

1. Replace custom navigation with `NavigationLayout`
2. Update route definitions for new navigation structure
3. Migrate custom styling to theme variables
4. Test responsive behavior thoroughly
5. Update any hardcoded navigation logic

### Breaking Changes
- Navigation state is now managed internally
- Custom navigation items require role-based configuration
- Mobile-specific styling is handled automatically
- Breadcrumb generation is now automatic based on routes