/**
 * Utility to load the Interactive Matrix JavaScript from the assets folder
 */

export const loadInteractiveMatrixScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if ((window as any).InteractiveMatrix) {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = '/assets/js/interactive-matrix.js';
    script.async = true;
    
    // Handle load events
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Interactive Matrix script'));
    
    // Add to document
    document.head.appendChild(script);
  });
};

// Load CSS
export const loadInteractiveMatrixStyles = (): void => {
  // Check if already loaded
  const existingLink = document.querySelector('link[href="/assets/css/interactive-matrix.css"]');
  if (existingLink) return;
  
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/assets/css/interactive-matrix.css';
  document.head.appendChild(link);
};

// Initialize both script and styles
export const initializeInteractiveMatrix = async (): Promise<void> => {
  loadInteractiveMatrixStyles();
  await loadInteractiveMatrixScript();
};
