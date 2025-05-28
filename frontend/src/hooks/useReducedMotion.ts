import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * This is an accessibility feature that should be respected when implementing animations
 * 
 * @returns boolean indicating if reduced motion is preferred
 */
const useReducedMotion = (): boolean => {
  // Media query to detect prefers-reduced-motion
  const QUERY = '(prefers-reduced-motion: reduce)';
  
  // Function to get the initial state, safely handling SSR
  const getInitialState = (): boolean => {
    // Check if window is defined (to avoid SSR issues)
    if (typeof window !== 'undefined') {
      return window.matchMedia(QUERY).matches;
    }
    // Default to false if window is not available (SSR)
    return false;
  };

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(getInitialState);

  useEffect(() => {
    // Skip if we're in a server environment
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(QUERY);
    
    // Handler for when the preference changes
    const listener = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };

    // Add event listener, with fallback for older browsers
    try {
      // Modern API (standard)
      mediaQueryList.addEventListener('change', listener);
    } catch (e) {
      // Fallback for older browsers
      // @ts-ignore - TypeScript doesn't know about this deprecated API
      mediaQueryList.addListener(listener);
    }

    // Cleanup function to remove the listener
    return () => {
      try {
        mediaQueryList.removeEventListener('change', listener);
      } catch (e) {
        // Fallback for older browsers
        // @ts-ignore - TypeScript doesn't know about this deprecated API
        mediaQueryList.removeListener(listener);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return prefersReducedMotion;
};

export default useReducedMotion;
