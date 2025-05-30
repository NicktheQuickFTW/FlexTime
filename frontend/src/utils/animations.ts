import { useEffect, useRef, useState } from 'react';

// Animation timing functions
export const easings = {
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeBack: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'cubic-bezier(0.68, -0.6, 0.32, 1.6)'
} as const;

// Animation durations from design system
export const durations = {
  fastest: 75,
  fast: 150,
  normal: 300,
  slow: 500,
  slowest: 750
} as const;

// Keyframe definitions
export const keyframes = {
  fadeIn: `
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  `,
  slideIn: `
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  `,
  slideUp: `
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  `,
  slideDown: `
    from { transform: translateY(-100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  `,
  scaleIn: `
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  `,
  scaleOut: `
    from { transform: scale(1); opacity: 1; }
    to { transform: scale(0.8); opacity: 0; }
  `,
  pulse: `
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  `,
  glow: `
    0%, 100% { box-shadow: 0 0 5px var(--ft-cyber-cyan); }
    50% { box-shadow: 0 0 20px var(--ft-cyber-cyan); }
  `,
  spin: `
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  `,
  bounce: `
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0, -30px, 0); }
    70% { transform: translate3d(0, -15px, 0); }
    90% { transform: translate3d(0, -4px, 0); }
  `,
  shake: `
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
    20%, 40%, 60%, 80% { transform: translateX(10px); }
  `,
  float: `
    0% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
    100% { transform: translateY(0px); }
  `,
  slideInLeft: `
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  `,
  slideInRight: `
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  `,
  zoomIn: `
    from { transform: scale(0); }
    to { transform: scale(1); }
  `,
  flipIn: `
    from { transform: perspective(400px) rotateY(90deg); }
    to { transform: perspective(400px) rotateY(0deg); }
  `
};

// Animation configuration type
export interface AnimationConfig {
  duration?: keyof typeof durations | number;
  easing?: keyof typeof easings | string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
  iterationCount?: number | 'infinite';
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
}

// Default animation configuration
export const defaultAnimationConfig: AnimationConfig = {
  duration: 'normal',
  easing: 'ease',
  delay: 0,
  fillMode: 'forwards',
  iterationCount: 1,
  direction: 'normal'
};

// Create CSS animation string
export const createAnimation = (
  keyframeName: keyof typeof keyframes,
  config: AnimationConfig = {}
): string => {
  const finalConfig = { ...defaultAnimationConfig, ...config };
  
  const duration = typeof finalConfig.duration === 'number' 
    ? `${finalConfig.duration}ms` 
    : `${durations[finalConfig.duration!]}ms`;
    
  const easing = finalConfig.easing in easings 
    ? easings[finalConfig.easing as keyof typeof easings]
    : finalConfig.easing;

  return [
    keyframeName,
    duration,
    easing,
    `${finalConfig.delay}ms`,
    finalConfig.iterationCount,
    finalConfig.direction,
    finalConfig.fillMode
  ].join(' ');
};

// React hooks for animations

// Hook for element intersection animations
export const useIntersectionAnimation = (
  animationConfig: AnimationConfig = {},
  threshold: number = 0.1
) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { elementRef, isVisible };
};

// Hook for managing animation state
export const useAnimation = (
  animationName: keyof typeof keyframes,
  config: AnimationConfig = {},
  trigger: boolean = true
) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!trigger || !elementRef.current) return;

    const element = elementRef.current;
    const animationString = createAnimation(animationName, config);
    
    setIsAnimating(true);
    element.style.animation = animationString;

    const handleAnimationEnd = () => {
      setIsAnimating(false);
      element.style.animation = '';
    };

    element.addEventListener('animationend', handleAnimationEnd);
    
    return () => {
      element.removeEventListener('animationend', handleAnimationEnd);
    };
  }, [animationName, config, trigger]);

  return { elementRef, isAnimating };
};

// Hook for stagger animations
export const useStaggerAnimation = (
  items: any[],
  animationName: keyof typeof keyframes,
  config: AnimationConfig = {},
  staggerDelay: number = 100
) => {
  const [animatingItems, setAnimatingItems] = useState<Set<number>>(new Set());
  const elementRefs = useRef<(HTMLElement | null)[]>([]);

  const startAnimation = () => {
    items.forEach((_, index) => {
      setTimeout(() => {
        const element = elementRefs.current[index];
        if (!element) return;

        const animationConfig = {
          ...config,
          delay: (config.delay || 0) + (index * staggerDelay)
        };

        const animationString = createAnimation(animationName, animationConfig);
        
        setAnimatingItems(prev => new Set(prev).add(index));
        element.style.animation = animationString;

        const handleAnimationEnd = () => {
          setAnimatingItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(index);
            return newSet;
          });
          element.style.animation = '';
        };

        element.addEventListener('animationend', handleAnimationEnd, { once: true });
      }, index * staggerDelay);
    });
  };

  const setRef = (index: number) => (ref: HTMLElement | null) => {
    elementRefs.current[index] = ref;
  };

  return {
    startAnimation,
    setRef,
    isAnimating: animatingItems.size > 0,
    animatingItems
  };
};

// Hook for hover animations
export const useHoverAnimation = (
  enterAnimation: keyof typeof keyframes,
  leaveAnimation: keyof typeof keyframes,
  config: AnimationConfig = {}
) => {
  const [isHovered, setIsHovered] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleMouseEnter = () => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    const animationString = createAnimation(enterAnimation, config);
    
    setIsHovered(true);
    element.style.animation = animationString;
  };

  const handleMouseLeave = () => {
    if (!elementRef.current) return;
    
    const element = elementRef.current;
    const animationString = createAnimation(leaveAnimation, config);
    
    setIsHovered(false);
    element.style.animation = animationString;
  };

  return {
    elementRef,
    isHovered,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  };
};

// Hook for reduced motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
};

// Animation utility functions
export const animationUtils = {
  // Create keyframe styles for CSS-in-JS
  createKeyframes: (name: keyof typeof keyframes) => `
    @keyframes ${name} {
      ${keyframes[name]}
    }
  `,

  // Generate all keyframes
  generateAllKeyframes: () => {
    return Object.entries(keyframes)
      .map(([name, frames]) => `
        @keyframes ${name} {
          ${frames}
        }
      `)
      .join('\n');
  },

  // Create animation class
  createAnimationClass: (
    className: string,
    animationName: keyof typeof keyframes,
    config: AnimationConfig = {}
  ) => `
    .${className} {
      animation: ${createAnimation(animationName, config)};
    }
  `,

  // Performance optimized animation
  performanceOptimized: (element: HTMLElement) => {
    element.style.willChange = 'transform, opacity';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
  },

  // Clean up performance optimizations
  cleanupPerformance: (element: HTMLElement) => {
    element.style.willChange = 'auto';
    element.style.backfaceVisibility = '';
    element.style.perspective = '';
  }
};

// Export commonly used animation combinations
export const commonAnimations = {
  fadeInUp: (config?: AnimationConfig) => createAnimation('fadeIn', config),
  slideInFromLeft: (config?: AnimationConfig) => createAnimation('slideInLeft', config),
  slideInFromRight: (config?: AnimationConfig) => createAnimation('slideInRight', config),
  scaleInBounce: (config?: AnimationConfig) => createAnimation('scaleIn', { ...config, easing: 'bounce' }),
  pulseGlow: (config?: AnimationConfig) => createAnimation('glow', { ...config, iterationCount: 'infinite' }),
  floatSlow: (config?: AnimationConfig) => createAnimation('float', { ...config, duration: 'slowest', iterationCount: 'infinite' })
};

export default {
  easings,
  durations,
  keyframes,
  createAnimation,
  useIntersectionAnimation,
  useAnimation,
  useStaggerAnimation,
  useHoverAnimation,
  useReducedMotion,
  animationUtils,
  commonAnimations
};