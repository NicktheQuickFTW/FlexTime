/**
 * Navigation Components
 * 
 * This module exports all navigation-related components for the FlexTime application.
 * These components follow the design principles outlined in the FlexTime Playbook
 * and provide consistent navigation experience across desktop and mobile devices.
 */

export { default as TopAppBar } from './TopAppBar';
export { default as NavigationRail } from './NavigationRail';
export { default as NavigationLayout } from './NavigationLayout';

// Mobile Navigation Components
export { 
  BottomNavigation,
  FloatingActionButton,
  SwipeNavigation,
  MobileDrawer,
  PullToRefresh,
  useTouchGestures
} from './MobileNavigation';

// Re-export component types for convenience
// Note: TypeScript interfaces are exported by the components themselves

/**
 * Navigation Usage Guidelines:
 * 
 * 1. TopAppBar: 
 *    - Use for all main application pages
 *    - Provides branding, page title, breadcrumbs, and actions
 *    - Responsive design with mobile-specific behaviors
 * 
 * 2. NavigationRail:
 *    - Desktop-only side navigation
 *    - Role-based navigation items
 *    - Persistent navigation for main application sections
 * 
 * 3. BottomNavigation:
 *    - Mobile-only bottom navigation
 *    - Quick access to primary sections
 *    - Automatically hidden on desktop
 * 
 * 4. MobileDrawer:
 *    - Mobile slide-out navigation menu
 *    - Full navigation hierarchy
 *    - User profile and settings access
 * 
 * 5. NavigationLayout:
 *    - Complete navigation wrapper component
 *    - Handles responsive behavior automatically
 *    - Combines all navigation components
 * 
 * Example usage:
 * 
 * ```tsx
 * import { NavigationLayout } from '../components/navigation';
 * 
 * // Simple usage with NavigationLayout (recommended)
 * const App = () => {
 *   return (
 *     <NavigationLayout
 *       title="Dashboard"
 *       subtitle="Welcome back!"
 *       role="admin"
 *     >
 *       <YourPageContent />
 *     </NavigationLayout>
 *   );
 * };
 * 
 * // Advanced usage with individual components
 * const CustomLayout = () => {
 *   const [drawerOpen, setDrawerOpen] = useState(false);
 *   
 *   return (
 *     <>
 *       <TopAppBar
 *         title="Dashboard"
 *         subtitle="Welcome back!"
 *         showMenuButton
 *         onMenuClick={() => setDrawerOpen(true)}
 *       />
 *       
 *       <NavigationRail role="admin" />
 *       
 *       <MobileDrawer
 *         open={drawerOpen}
 *         onClose={() => setDrawerOpen(false)}
 *         role="admin"
 *       />
 *       
 *       <BottomNavigation />
 *     </>
 *   );
 * };
 * ```
 */