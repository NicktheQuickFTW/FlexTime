import { useEffect } from 'react';

// Helper function to convert hex to RGB
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

// WCAG 2.1 AA compliance utilities
export const a11yUtils = {
  // Contrast ratio calculation
  calculateContrastRatio: (foreground: string, background: string): number => {
    const getLuminance = (color: string): number => {
      const rgb = hexToRgb(color);
      if (!rgb) return 0;
      
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(val => {
        val = val / 255;
        return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
      });
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },

  // Check if contrast meets WCAG standards
  meetsContrastRequirement: (foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = a11yUtils.calculateContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  },

  // Focus management
  trapFocus: (element: HTMLElement): (() => void) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable?.focus();
            e.preventDefault();
          }
        }
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    firstFocusable?.focus();

    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  },

  // Screen reader announcements
  announce: (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;
    
    document.body.appendChild(announcer);
    
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  },

  // Enhanced focus management for complex components
  manageFocus: {
    // Set focus to first focusable element in container
    setInitialFocus: (container: HTMLElement) => {
      const focusable = container.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      focusable?.focus();
    },

    // Get all focusable elements in order
    getFocusableElements: (container: HTMLElement): HTMLElement[] => {
      return Array.from(container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )) as HTMLElement[];
    },

    // Create roving tabindex for widget patterns
    createRovingTabindex: (elements: HTMLElement[], initialIndex = 0) => {
      elements.forEach((el, index) => {
        el.setAttribute('tabindex', index === initialIndex ? '0' : '-1');
      });

      return {
        moveFocus: (newIndex: number) => {
          elements.forEach((el, index) => {
            el.setAttribute('tabindex', index === newIndex ? '0' : '-1');
          });
          elements[newIndex]?.focus();
        },
        getCurrentIndex: () => {
          return elements.findIndex(el => el.getAttribute('tabindex') === '0');
        }
      };
    }
  },

  // ARIA utilities
  aria: {
    // Update aria-expanded state
    setExpanded: (element: HTMLElement, expanded: boolean) => {
      element.setAttribute('aria-expanded', expanded.toString());
    },

    // Update aria-selected state
    setSelected: (element: HTMLElement, selected: boolean) => {
      element.setAttribute('aria-selected', selected.toString());
    },

    // Update aria-checked state
    setChecked: (element: HTMLElement, checked: boolean | 'mixed') => {
      element.setAttribute('aria-checked', checked.toString());
    },

    // Update aria-disabled state
    setDisabled: (element: HTMLElement, disabled: boolean) => {
      element.setAttribute('aria-disabled', disabled.toString());
      if (disabled) {
        element.setAttribute('tabindex', '-1');
      } else {
        element.removeAttribute('tabindex');
      }
    },

    // Live region announcements with debouncing
    announceWithDebounce: (() => {
      let timeoutId: NodeJS.Timeout;
      let lastMessage = '';
      
      return (message: string, priority: 'polite' | 'assertive' = 'polite', delay = 100) => {
        if (message === lastMessage) return; // Prevent duplicate announcements
        
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          a11yUtils.announce(message, priority);
          lastMessage = message;
        }, delay);
      };
    })()
  },

  // Keyboard shortcuts manager
  shortcuts: {
    register: (shortcut: string, callback: () => void, element: HTMLElement = document.body) => {
      const handleKeyDown = (e: KeyboardEvent) => {
        const keys = shortcut.toLowerCase().split('+');
        const pressedKeys = [];
        
        if (e.ctrlKey) pressedKeys.push('ctrl');
        if (e.altKey) pressedKeys.push('alt');
        if (e.shiftKey) pressedKeys.push('shift');
        if (e.metaKey) pressedKeys.push('meta');
        
        pressedKeys.push(e.key.toLowerCase());
        
        if (keys.every(key => pressedKeys.includes(key)) && keys.length === pressedKeys.length) {
          e.preventDefault();
          callback();
        }
      };

      element.addEventListener('keydown', handleKeyDown);
      return () => element.removeEventListener('keydown', handleKeyDown);
    }
  },

  // Color accessibility utilities
  color: {
    // Get accessible color variants
    getAccessibleVariant: (color: string, background: string): string => {
      let testColor = color;
      let luminanceAdjustment = 0.1;
      
      while (!a11yUtils.meetsContrastRequirement(testColor, background) && luminanceAdjustment < 1) {
        const rgb = hexToRgb(testColor);
        if (!rgb) break;
        
        // Darken or lighten based on background
        const bgLuminance = a11yUtils.calculateContrastRatio('#ffffff', background);
        const factor = bgLuminance > 10 ? 1 - luminanceAdjustment : 1 + luminanceAdjustment;
        
        const newRgb = {
          r: Math.max(0, Math.min(255, Math.round(rgb.r * factor))),
          g: Math.max(0, Math.min(255, Math.round(rgb.g * factor))),
          b: Math.max(0, Math.min(255, Math.round(rgb.b * factor)))
        };
        
        testColor = `#${newRgb.r.toString(16).padStart(2, '0')}${newRgb.g.toString(16).padStart(2, '0')}${newRgb.b.toString(16).padStart(2, '0')}`;
        luminanceAdjustment += 0.1;
      }
      
      return testColor;
    }
  }
};

// Keyboard navigation hook
export const useKeyboardNavigation = (
  gridRef: React.RefObject<HTMLElement>,
  onActivate?: (element: HTMLElement) => void
) => {
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusedElement = document.activeElement as HTMLElement;
      const cells = Array.from(grid.querySelectorAll('[role="gridcell"]')) as HTMLElement[];
      const currentIndex = cells.indexOf(focusedElement);

      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
          nextIndex = Math.min(currentIndex + 1, cells.length - 1);
          break;
        case 'ArrowLeft':
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        case 'ArrowDown':
          // Calculate based on grid columns
          const columns = parseInt(grid.getAttribute('aria-colcount') || '1');
          nextIndex = Math.min(currentIndex + columns, cells.length - 1);
          break;
        case 'ArrowUp':
          const cols = parseInt(grid.getAttribute('aria-colcount') || '1');
          nextIndex = Math.max(currentIndex - cols, 0);
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = cells.length - 1;
          break;
        case 'PageDown':
          const pageSize = parseInt(grid.getAttribute('aria-rowcount') || '10');
          nextIndex = Math.min(currentIndex + pageSize, cells.length - 1);
          break;
        case 'PageUp':
          const pageSizeUp = parseInt(grid.getAttribute('aria-rowcount') || '10');
          nextIndex = Math.max(currentIndex - pageSizeUp, 0);
          break;
        case 'Enter':
        case ' ':
          if (onActivate) {
            onActivate(focusedElement);
            e.preventDefault();
          }
          return;
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        cells[nextIndex]?.focus();
        e.preventDefault();
        
        // Announce position change for screen readers
        const row = Math.floor(nextIndex / parseInt(grid.getAttribute('aria-colcount') || '1')) + 1;
        const col = (nextIndex % parseInt(grid.getAttribute('aria-colcount') || '1')) + 1;
        a11yUtils.aria.announceWithDebounce(`Row ${row}, Column ${col}`);
      }
    };

    grid.addEventListener('keydown', handleKeyDown);
    return () => grid.removeEventListener('keydown', handleKeyDown);
  }, [gridRef, onActivate]);
};

// Hook for managing focus within modals/dialogs
export const useModalFocus = (isOpen: boolean, modalRef: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    const modal = modalRef.current;
    const previouslyFocused = document.activeElement as HTMLElement;

    // Trap focus within modal
    const cleanup = a11yUtils.trapFocus(modal);

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        previouslyFocused?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      cleanup();
      document.removeEventListener('keydown', handleEscape);
      previouslyFocused?.focus();
    };
  }, [isOpen, modalRef]);
};

// Hook for roving tabindex pattern (for toolbars, menus, etc.)
export const useRovingTabindex = (
  containerRef: React.RefObject<HTMLElement>,
  selector: string = 'button, [role="menuitem"], [role="tab"]'
) => {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];
    if (elements.length === 0) return;

    const rovingTabindex = a11yUtils.manageFocus.createRovingTabindex(elements);

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = rovingTabindex.getCurrentIndex();
      let nextIndex = currentIndex;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (currentIndex + 1) % elements.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = currentIndex === 0 ? elements.length - 1 : currentIndex - 1;
          break;
        case 'Home':
          nextIndex = 0;
          break;
        case 'End':
          nextIndex = elements.length - 1;
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        rovingTabindex.moveFocus(nextIndex);
        e.preventDefault();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selector]);
};

// Hook for skip links
export const useSkipLinks = () => {
  useEffect(() => {
    const skipLinks = document.querySelectorAll('.skip-link');
    
    skipLinks.forEach(link => {
      const handleClick = (e: Event) => {
        e.preventDefault();
        const target = link.getAttribute('href');
        if (target) {
          const targetElement = document.querySelector(target) as HTMLElement;
          if (targetElement) {
            targetElement.focus();
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
      };
      
      link.addEventListener('click', handleClick);
    });

    return () => {
      skipLinks.forEach(link => {
        link.removeEventListener('click', () => {});
      });
    };
  }, []);
};

// Accessibility testing utilities
export const a11yTesting = {
  // Check for common accessibility issues
  audit: (element: HTMLElement = document.body) => {
    const issues: string[] = [];
    
    // Check for images without alt text
    const images = element.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push(`${images.length} images found without alt text`);
    }
    
    // Check for form inputs without labels
    const inputs = element.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    inputs.forEach(input => {
      const id = input.getAttribute('id');
      if (!id || !element.querySelector(`label[for="${id}"]`)) {
        issues.push(`Form input without proper label: ${input.outerHTML.substring(0, 50)}...`);
      }
    });
    
    // Check for heading hierarchy
    const headings = Array.from(element.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    let lastLevel = 0;
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      if (level - lastLevel > 1) {
        issues.push(`Heading hierarchy skip detected: ${heading.outerHTML.substring(0, 50)}...`);
      }
      lastLevel = level;
    });
    
    // Check for interactive elements without accessible names
    const interactive = element.querySelectorAll('button, a, [role="button"], [role="link"]');
    interactive.forEach(el => {
      const hasName = el.getAttribute('aria-label') || 
                     el.getAttribute('aria-labelledby') || 
                     el.textContent?.trim();
      if (!hasName) {
        issues.push(`Interactive element without accessible name: ${el.outerHTML.substring(0, 50)}...`);
      }
    });
    
    return issues;
  },
  
  // Log accessibility issues to console
  logIssues: (element?: HTMLElement) => {
    const issues = a11yTesting.audit(element);
    if (issues.length > 0) {
      console.group('🚨 Accessibility Issues Found');
      issues.forEach(issue => console.warn(issue));
      console.groupEnd();
    } else {
      console.log('✅ No accessibility issues found');
    }
  }
};

export default a11yUtils;