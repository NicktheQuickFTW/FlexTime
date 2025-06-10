import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import useReducedMotion from '../../hooks/useReducedMotion';

interface AnimationContextValue {
  isReducedMotion: boolean;
  isLowPerformance: boolean;
  animationQuality: 'high' | 'medium' | 'low' | 'off';
  setAnimationQuality: (quality: 'high' | 'medium' | 'low' | 'off') => void;
  shouldAnimate: boolean;
  getOptimizedDuration: (baseDuration: number) => number;
  getOptimizedConfig: (baseConfig: any) => any;
}

const AnimationContext = createContext<AnimationContextValue | undefined>(undefined);

interface AnimationProviderProps {
  children: ReactNode;
}

/**
 * Global animation provider that manages animation settings and performance optimization
 */
export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const isReducedMotion = useReducedMotion();
  const [isLowPerformance, setIsLowPerformance] = useState(false);
  const [animationQuality, setAnimationQuality] = useState<'high' | 'medium' | 'low' | 'off'>('high');

  // Detect performance capabilities
  useEffect(() => {
    const detectPerformance = () => {
      const connection = (navigator as any).connection;
      const memory = (performance as any).memory;
      const hardwareConcurrency = navigator.hardwareConcurrency || 4;

      // Check connection speed
      const isSlowConnection = connection && 
        (connection.effectiveType === '2g' || 
         connection.effectiveType === 'slow-2g' ||
         connection.downlink < 1.5);

      // Check memory usage
      const isLowMemory = memory && 
        memory.usedJSHeapSize > memory.totalJSHeapSize * 0.7;

      // Check CPU cores
      const isLowCPU = hardwareConcurrency < 4;

      // Check if device is mobile
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );

      const shouldReducePerformance = isSlowConnection || isLowMemory || isLowCPU || isMobile;
      setIsLowPerformance(shouldReducePerformance);

      // Auto-adjust animation quality based on performance
      if (isReducedMotion) {
        setAnimationQuality('off');
      } else if (shouldReducePerformance) {
        setAnimationQuality('low');
      } else {
        setAnimationQuality('high');
      }
    };

    detectPerformance();

    // Re-check performance periodically
    const interval = setInterval(detectPerformance, 30000);
    return () => clearInterval(interval);
  }, [isReducedMotion]);

  // Check if animations should be enabled
  const shouldAnimate = !isReducedMotion && animationQuality !== 'off';

  // Get optimized duration based on performance settings
  const getOptimizedDuration = (baseDuration: number): number => {
    if (!shouldAnimate) return 0;
    
    switch (animationQuality as 'high' | 'medium' | 'low' | 'off') {
      case 'high':
        return baseDuration;
      case 'medium':
        return baseDuration * 0.7;
      case 'low':
        return baseDuration * 0.3;
      case 'off':
        return 0;
      default:
        return baseDuration;
    }
  };

  // Get optimized animation configuration
  const getOptimizedConfig = (baseConfig: any) => {
    if (!shouldAnimate) {
      return {
        ...baseConfig,
        duration: 0,
        transition: { duration: 0 },
      };
    }

    switch (animationQuality as 'high' | 'medium' | 'low' | 'off') {
      case 'high':
        return baseConfig;
      
      case 'medium':
        return {
          ...baseConfig,
          duration: baseConfig.duration ? baseConfig.duration * 0.7 : undefined,
          transition: baseConfig.transition ? {
            ...baseConfig.transition,
            duration: baseConfig.transition.duration ? baseConfig.transition.duration * 0.7 : undefined,
          } : undefined,
        };
      
      case 'low':
        return {
          ...baseConfig,
          duration: baseConfig.duration ? baseConfig.duration * 0.3 : undefined,
          ease: 'linear',
          type: 'tween',
          transition: {
            duration: baseConfig.transition?.duration ? baseConfig.transition.duration * 0.3 : 0.1,
            ease: 'linear',
            type: 'tween',
          },
        };
      
      case 'off':
        return {
          ...baseConfig,
          duration: 0,
          transition: { duration: 0 },
        };
      
      default:
        return baseConfig;
    }
  };

  const value: AnimationContextValue = {
    isReducedMotion,
    isLowPerformance,
    animationQuality,
    setAnimationQuality,
    shouldAnimate,
    getOptimizedDuration,
    getOptimizedConfig,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

/**
 * Hook to access animation context
 */
export const useAnimation = (): AnimationContextValue => {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

/**
 * HOC for components that need animation optimization
 */
export const withAnimationOptimization = <P extends object>(
  Component: React.ComponentType<P>
) => {
  const OptimizedComponent = (props: P) => {
    const { getOptimizedConfig } = useAnimation();
    
    return (
      <Component 
        {...props} 
        getOptimizedConfig={getOptimizedConfig}
      />
    );
  };
  
  OptimizedComponent.displayName = `withAnimationOptimization(${Component.displayName || Component.name})`;
  return OptimizedComponent;
};

export default AnimationProvider;