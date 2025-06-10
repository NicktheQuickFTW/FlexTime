import useReducedMotion from '../../hooks/useReducedMotion';
import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * Hook for managing page transition states
 */
export const usePageTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const startTransition = () => setIsTransitioning(true);
  const endTransition = () => setIsTransitioning(false);

  return {
    isTransitioning,
    startTransition,
    endTransition,
    shouldAnimate: !prefersReducedMotion,
  };
};

/**
 * Hook for scroll-triggered animations
 */
export const useScrollAnimation = (threshold = 0.1) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: `-${threshold * 100}%` as any
  });
  const prefersReducedMotion = useReducedMotion();

  return {
    ref,
    isVisible: isInView,
    shouldAnimate: !prefersReducedMotion && isInView,
  };
};

/**
 * Hook for staggered list animations
 */
export const useStaggeredAnimation = (itemCount: number, delay = 0.1) => {
  const [visibleItems, setVisibleItems] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setVisibleItems(itemCount);
      return;
    }

    const timer = setTimeout(() => {
      if (visibleItems < itemCount) {
        setVisibleItems(prev => prev + 1);
      }
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [visibleItems, itemCount, delay, prefersReducedMotion]);

  const resetAnimation = () => setVisibleItems(0);

  return {
    visibleItems,
    resetAnimation,
    shouldAnimate: !prefersReducedMotion,
  };
};

/**
 * Hook for managing route-based animations
 */
export const useRouteAnimation = (pathname: string) => {
  const [previousPath, setPreviousPath] = useState<string>('');
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  useEffect(() => {
    if (previousPath) {
      // Determine direction based on route hierarchy
      const routeHierarchy = [
        '/dashboard',
        '/schedules',
        '/constraints',
        '/admin',
      ];

      const currentIndex = routeHierarchy.findIndex(route => 
        pathname.startsWith(route)
      );
      const previousIndex = routeHierarchy.findIndex(route => 
        previousPath.startsWith(route)
      );

      setDirection(currentIndex > previousIndex ? 'forward' : 'backward');
    }
    
    setPreviousPath(pathname);
  }, [pathname, previousPath]);

  return {
    direction,
    previousPath,
    isInitialLoad: !previousPath,
  };
};

/**
 * Hook for managing modal animations
 */
export const useModalAnimation = (isOpen: boolean) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  const handleAnimationComplete = () => {
    if (!isOpen) {
      setShouldRender(false);
    }
  };

  return {
    shouldRender,
    handleAnimationComplete,
  };
};

/**
 * Hook for performance-optimized animations
 */
export const useOptimizedAnimation = () => {
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Check for low-performance indicators
    const checkPerformance = () => {
      const connection = (navigator as any).connection;
      const memory = (performance as any).memory;

      const isSlowConnection = connection && 
        (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
      const isLowMemory = memory && memory.usedJSHeapSize > memory.totalJSHeapSize * 0.8;

      setIsLowPerformance(isSlowConnection || isLowMemory);
    };

    checkPerformance();
    
    // Check periodically
    const interval = setInterval(checkPerformance, 30000);
    return () => clearInterval(interval);
  }, []);

  const getOptimizedConfig = (baseConfig: any) => {
    if (prefersReducedMotion || isLowPerformance) {
      return {
        ...baseConfig,
        duration: 0.1,
        ease: 'linear',
        type: 'tween',
      };
    }
    return baseConfig;
  };

  return {
    isLowPerformance,
    shouldAnimate: !prefersReducedMotion && !isLowPerformance,
    getOptimizedConfig,
  };
};

const animationHooks = {
  usePageTransition,
  useScrollAnimation,
  useStaggeredAnimation,
  useRouteAnimation,
  useModalAnimation,
  useOptimizedAnimation,
};

export default animationHooks;