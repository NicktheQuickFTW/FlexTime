import React from 'react';
import { useLocation } from 'react-router-dom';
import { RouteTransition } from './PageTransitions';
import { useAnimation } from './AnimationProvider';
import { useRouteAnimation } from './AnimationHooks';

interface RouteTransitionWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that automatically handles route transitions
 * Should be placed around the main routing content in App.tsx
 */
export const RouteTransitionWrapper: React.FC<RouteTransitionWrapperProps> = ({ 
  children 
}) => {
  const location = useLocation();
  const { shouldAnimate } = useAnimation();
  const { direction } = useRouteAnimation(location.pathname);

  // If animations are disabled, render children directly
  if (!shouldAnimate) {
    return <>{children}</>;
  }

  return (
    <RouteTransition pathname={location.pathname}>
      <div 
        className="route-content"
        data-direction={direction}
        data-pathname={location.pathname}
      >
        {children}
      </div>
    </RouteTransition>
  );
};

export default RouteTransitionWrapper;