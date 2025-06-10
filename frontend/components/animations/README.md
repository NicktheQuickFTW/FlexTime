# FlexTime Animation System

A comprehensive animation system built for FlexTime that provides smooth page transitions, route animations, and interactive components with performance optimization and accessibility support.

## Features

- ✨ **Smooth Page Transitions**: Multiple transition types (fade, slide, scale, blur)
- 🎯 **Route-Based Animations**: Automatic transitions based on route changes
- 🎪 **Staggered Animations**: Beautiful staggered animations for lists and grids
- 🎭 **Modal & Drawer Transitions**: Smooth overlay animations
- ⚡ **Performance Optimized**: Automatic performance detection and optimization
- ♿ **Accessibility**: Respects `prefers-reduced-motion` and provides fallbacks
- 🎨 **Sport-Themed**: Custom animations for different sports
- 📱 **Responsive**: Adapts to different screen sizes and devices

## Quick Start

### 1. Install Dependencies

```bash
npm install framer-motion
```

### 2. Set up the Animation Provider

Wrap your app with the `AnimationProvider`:

```tsx
import { AnimationProvider } from './components/animations';
import './components/animations/animations.css';

function App() {
  return (
    <AnimationProvider>
      <YourAppContent />
    </AnimationProvider>
  );
}
```

### 3. Add Route Transitions

Wrap your routing content with `RouteTransitionWrapper`:

```tsx
import { RouteTransitionWrapper } from './components/animations';
import { Routes, Route } from 'react-router-dom';

function AppRoutes() {
  return (
    <RouteTransitionWrapper>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/constraints" element={<Constraints />} />
      </Routes>
    </RouteTransitionWrapper>
  );
}
```

## Components

### PageTransition

Basic page transition component with multiple animation types:

```tsx
import { PageTransition } from './components/animations';

function MyPage() {
  return (
    <PageTransition
      key="my-page"
      transition="fade" // 'slide', 'fade', 'scale', 'blur'
      direction="up"    // 'up', 'down', 'left', 'right'
      duration={0.3}
    >
      <div>Your page content</div>
    </PageTransition>
  );
}
```

### StaggerContainer

Animate lists with staggered timing:

```tsx
import { StaggerContainer } from './components/animations';

function TeamList({ teams }) {
  return (
    <StaggerContainer staggerDelay={0.1} direction="up">
      {teams.map(team => (
        <div key={team.id} className="team-card">
          {team.name}
        </div>
      ))}
    </StaggerContainer>
  );
}
```

### CardTransition

Animate individual cards with hover effects:

```tsx
import { CardTransition } from './components/animations';

function SportCard({ sport, delay }) {
  return (
    <CardTransition delay={delay}>
      <div className="sport-card">
        <h3>{sport.name}</h3>
        <p>{sport.description}</p>
      </div>
    </CardTransition>
  );
}
```

### ModalTransition

Animated modals with backdrop:

```tsx
import { ModalTransition } from './components/animations';

function MyModal({ isOpen, onClose }) {
  return (
    <ModalTransition isOpen={isOpen} onClose={onClose}>
      <div className="modal-content">
        <h2>Modal Title</h2>
        <p>Modal content goes here</p>
      </div>
    </ModalTransition>
  );
}
```

### LoadingTransition

Smooth loading states:

```tsx
import { LoadingTransition } from './components/animations';

function DataComponent({ data, loading }) {
  return (
    <LoadingTransition 
      isLoading={loading}
      loadingComponent={<div>Loading...</div>}
    >
      <div>{data}</div>
    </LoadingTransition>
  );
}
```

## Hooks

### useAnimation

Access global animation settings:

```tsx
import { useAnimation } from './components/animations';

function MyComponent() {
  const { shouldAnimate, getOptimizedConfig } = useAnimation();
  
  if (!shouldAnimate) {
    return <div>Static content</div>;
  }
  
  const config = getOptimizedConfig({
    duration: 0.3,
    ease: 'easeOut'
  });
  
  return <motion.div {...config}>Animated content</motion.div>;
}
```

### useScrollAnimation

Trigger animations on scroll:

```tsx
import { useScrollAnimation } from './components/animations';

function ScrollTriggeredComponent() {
  const { ref, isVisible, shouldAnimate } = useScrollAnimation(0.2);
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
    >
      Content that animates when scrolled into view
    </motion.div>
  );
}
```

### useStaggeredAnimation

Control staggered list animations:

```tsx
import { useStaggeredAnimation } from './components/animations';

function StaggeredList({ items }) {
  const { visibleItems, shouldAnimate } = useStaggeredAnimation(items.length, 0.1);
  
  return (
    <div>
      {items.slice(0, visibleItems).map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          {item.content}
        </motion.div>
      ))}
    </div>
  );
}
```

## Animation Constants

Use predefined constants for consistency:

```tsx
import { 
  ANIMATION_DURATION, 
  SLIDE_UP_VARIANTS, 
  SPRING_CONFIG 
} from './components/animations';

function MyComponent() {
  return (
    <motion.div
      variants={SLIDE_UP_VARIANTS}
      transition={{
        duration: ANIMATION_DURATION.NORMAL,
        ...SPRING_CONFIG.GENTLE
      }}
    >
      Content
    </motion.div>
  );
}
```

## Sport-Specific Themes

Enable sport-specific animations:

```tsx
// Add sport class to your container
<div className="ft-sport-football">
  <PageTransition key="football-page">
    <FootballSchedule />
  </PageTransition>
</div>

// Available sport classes:
// - ft-sport-football
// - ft-sport-basketball  
// - ft-sport-baseball
// - ft-sport-softball
```

## Performance Optimization

The system automatically optimizes animations based on:

- **Device Performance**: Reduces animation complexity on low-end devices
- **Network Speed**: Simplifies animations on slow connections
- **User Preferences**: Respects `prefers-reduced-motion`
- **Battery Level**: Reduces animations on low battery (where supported)

### Manual Performance Control

```tsx
import { useOptimizedAnimation } from './components/animations';

function PerformanceAwareComponent() {
  const { shouldAnimate, getOptimizedConfig } = useOptimizedAnimation();
  
  const animationConfig = getOptimizedConfig({
    duration: 0.5,
    ease: 'easeInOut',
    scale: [1, 1.1, 1]
  });
  
  return (
    <motion.div animate={shouldAnimate ? animationConfig : {}}>
      Content
    </motion.div>
  );
}
```

## Accessibility

The animation system is built with accessibility in mind:

- **Reduced Motion**: Automatically respects `prefers-reduced-motion`
- **Focus Management**: Maintains focus states during transitions
- **Screen Readers**: Provides appropriate ARIA labels
- **High Contrast**: Adapts to high contrast mode
- **Keyboard Navigation**: All interactive elements remain keyboard accessible

## CSS Classes

The system provides utility classes for common animations:

```css
/* Loading animations */
.ft-animate-pulse
.ft-animate-spin
.ft-animate-bounce

/* Slide animations */
.ft-animate-slide-in-up
.ft-animate-slide-in-down
.ft-animate-slide-in-left
.ft-animate-slide-in-right

/* Scale and fade */
.ft-animate-scale-in
.ft-animate-fade-in

/* Interactive states */
.ft-interactive
```

## Examples

### Complete Route Setup

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { 
  AnimationProvider, 
  RouteTransitionWrapper 
} from './components/animations';
import './components/animations/animations.css';

function App() {
  return (
    <BrowserRouter>
      <AnimationProvider>
        <div className="app">
          <RouteTransitionWrapper>
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/schedule" element={<Schedule />} />
              <Route path="/constraints" element={<Constraints />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </RouteTransitionWrapper>
        </div>
      </AnimationProvider>
    </BrowserRouter>
  );
}

export default App;
```

### Sport Profile Cards

```tsx
import { StaggerContainer, CardTransition } from './components/animations';

function SportProfiles({ sports }) {
  return (
    <div className="ft-sport-grid">
      <StaggerContainer staggerDelay={0.1}>
        {sports.map((sport, index) => (
          <CardTransition key={sport.id} delay={index * 0.05}>
            <div className={`sport-card ft-sport-${sport.slug}`}>
              <img src={sport.logo} alt={sport.name} />
              <h3>{sport.name}</h3>
              <p>{sport.teamCount} teams</p>
            </div>
          </CardTransition>
        ))}
      </StaggerContainer>
    </div>
  );
}
```

## Browser Support

The animation system supports:

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

For older browsers, animations gracefully degrade to simple CSS transitions.

## Contributing

When adding new animations:

1. Add constants to `AnimationConstants.ts`
2. Create reusable variants
3. Consider performance implications
4. Test with reduced motion preferences
5. Add appropriate TypeScript types
6. Update documentation