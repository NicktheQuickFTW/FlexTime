# Animation System Setup - Framer Motion Integration

## Overview

The FlexTime animation system has been enhanced with micro-interaction components that require **framer-motion** for optimal performance and smooth animations.

## Required Dependencies

To use the new micro-interaction components, you need to install framer-motion:

```bash
cd frontend
npm install framer-motion@^10.16.4
```

## Component Dependencies

The following components require framer-motion:

### MicroInteractions.tsx
- `HoverCard` - Enhanced hover effects with physics-based animations
- `RippleButton` - Material Design ripple effects
- `LoadingSpinner` - Smooth entrance/exit animations
- `PulseIndicator` - Continuous pulse animations
- `FloatingAction` - Spring-based entrance animations
- `StaggerContainer` & `StaggerItem` - Coordinated list animations

### Existing Components (already implemented)
- `PageTransitions.tsx` - Page transition animations
- `AnimationProvider.tsx` - Animation context and optimization
- `AnimationHooks.tsx` - Custom animation hooks
- `RouteTransitionWrapper.tsx` - Route-based transitions

## Design System Integration

The new micro-interaction components integrate seamlessly with the existing FlexTime design system:

### Theme Integration
- Automatic sport-specific color theming
- CSS variable support for dynamic theming
- Material UI component compatibility

### Glassmorphic Effects
- Backdrop filter support for modern browsers
- Fallback styles for older browsers
- Performance-optimized rendering

### Accessibility Features
- `prefers-reduced-motion` support
- High contrast mode compatibility
- Keyboard focus indicators
- Screen reader friendly

## Usage Examples

### Basic Button with Ripple Effect
```tsx
import { RippleButton } from '@/components/animations';

<RippleButton 
  variant="contained" 
  color="sportAccent" 
  onClick={handleAction}
>
  Generate Schedule
</RippleButton>
```

### Glassmorphic Card with Hover Effects
```tsx
import { HoverCard } from '@/components/animations';

<HoverCard elevation="medium" glassEffect={true}>
  <CardContent>
    Your schedule content here
  </CardContent>
</HoverCard>
```

### Staggered List Animations
```tsx
import { StaggerContainer, StaggerItem } from '@/components/animations';

<StaggerContainer delay={0.1}>
  {schedules.map(schedule => (
    <StaggerItem key={schedule.id}>
      <ScheduleCard data={schedule} />
    </StaggerItem>
  ))}
</StaggerContainer>
```

## Performance Considerations

### GPU Acceleration
All animations use `transform` and `opacity` properties for optimal performance:
- Hardware acceleration enabled with `transform: translateZ(0)`
- Efficient `will-change` properties
- Optimized backdrop filters

### Memory Management
- Automatic animation cleanup on unmount
- Reduced motion detection and optimization
- Conditional rendering for performance-critical sections

### Browser Compatibility
- Chrome/Edge: Full feature support including backdrop filters
- Firefox: Full support with vendor prefixes
- Safari: Full support with `-webkit-backdrop-filter`
- IE11: Graceful degradation without backdrop filters

## Implementation Status

✅ **Completed Components:**
- MicroInteractions.tsx with 6 core components
- animations.css with comprehensive styling
- README.md with usage documentation
- MicroInteractionsExample.tsx for testing

⏳ **Pending:**
- framer-motion dependency installation
- Integration testing with existing components
- Performance optimization based on usage patterns

## Next Steps

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install framer-motion@^10.16.4
   ```

2. **Import CSS Styles:**
   Add to your main CSS file or import in components:
   ```css
   @import '@/components/animations/animations.css';
   ```

3. **Test Components:**
   Use the `MicroInteractionsExample.tsx` component to verify all animations work correctly.

4. **Integrate with Existing Components:**
   Replace existing cards, buttons, and loading indicators with the new micro-interaction components for enhanced user experience.

## Support

For questions about the animation system:
- Check the component README.md files
- Reference the FlexTime Playbook for design principles
- Review the AnimationConstants.ts for configuration options