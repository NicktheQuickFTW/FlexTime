import React, { useState, useEffect, useRef } from 'react';

// Accessibility utilities
export const a11yUtils = {
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

  trapFocus: (element: HTMLElement) => {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  },

  getContrastRatio: (color1: string, color2: string): number => {
    // Simplified contrast ratio calculation
    // In production, use a proper color library
    console.log('Calculating contrast ratio for:', color1, color2);
    return 4.5; // Placeholder
  }
};

// Base Button Component (referenced in other components)
interface FTButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  'aria-label'?: string;
  className?: string;
  children: React.ReactNode;
}

const FTButton: React.FC<FTButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  className = '',
  children 
}) => {
  const baseClasses = 'ft-button focus:ft-focus-ring transition-all duration-200';
  const variantClasses = {
    primary: 'bg-flextime-primary text-white hover:bg-flextime-primary-dark',
    secondary: 'bg-flextime-secondary text-flextime-text hover:bg-flextime-secondary-dark',
    ghost: 'bg-transparent text-flextime-text hover:bg-flextime-surface-hover'
  };
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
};

// Icons (placeholder components)
const ContrastIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

// Skip Navigation Component
export const SkipNavigation: React.FC = () => {
  return (
    <div className="ft-skip-nav">
      <a href="#main-content" className="ft-skip-link">
        Skip to main content
      </a>
      <a href="#sidebar" className="ft-skip-link">
        Skip to navigation
      </a>
      <a href="#analytics" className="ft-skip-link">
        Skip to analytics
      </a>
    </div>
  );
};

// Screen Reader Announcements
interface AnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  children?: React.ReactNode;
}

export const Announcement: React.FC<AnnouncementProps> = ({ 
  message, 
  priority = 'polite', 
  children 
}) => {
  return (
    <>
      <div
        aria-live={priority}
        aria-atomic="true"
        className="sr-only"
      >
        {message}
      </div>
      {children}
    </>
  );
};

// High Contrast Mode Toggle
export const HighContrastToggle: React.FC = () => {
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('ft-high-contrast');
    const enabled = saved === 'true';
    setHighContrast(enabled);
    document.documentElement.setAttribute('data-high-contrast', enabled.toString());
  }, []);

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    setHighContrast(newValue);
    localStorage.setItem('ft-high-contrast', newValue.toString());
    document.documentElement.setAttribute('data-high-contrast', newValue.toString());
    
    a11yUtils.announce(
      `High contrast mode ${newValue ? 'enabled' : 'disabled'}`,
      'assertive'
    );
  };

  return (
    <FTButton
      variant="ghost"
      onClick={toggleHighContrast}
      aria-label={`${highContrast ? 'Disable' : 'Enable'} high contrast mode`}
      className="ft-high-contrast-toggle"
    >
      <ContrastIcon />
      {highContrast ? 'Disable' : 'Enable'} High Contrast
    </FTButton>
  );
};

// Accessible Modal
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children 
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      previousFocus.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();
      
      const cleanup = a11yUtils.trapFocus(modalRef.current!);
      return cleanup;
    } else if (previousFocus.current) {
      previousFocus.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="ft-modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        className="ft-modal bg-flextime-surface border border-flextime-border rounded-lg shadow-xl max-w-lg w-full mx-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <header className="ft-modal-header flex items-center justify-between p-6 border-b border-flextime-border">
          <h2 id="modal-title" className="text-xl font-semibold text-flextime-text">
            {title}
          </h2>
          <FTButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="ft-modal-close"
          >
            <CloseIcon />
          </FTButton>
        </header>
        <div className="ft-modal-content p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Keyboard Navigation Indicator
export const KeyboardNavigationIndicator: React.FC = () => {
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setShowIndicator(true);
      }
    };

    const handleMouseDown = () => {
      setShowIndicator(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('ft-keyboard-navigation', showIndicator);
  }, [showIndicator]);

  return null;
};

// Accessible Table Component
interface AccessibleTableProps {
  caption: string;
  headers: string[];
  rows: (string | React.ReactNode)[][];
  sortable?: boolean;
  onSort?: (columnIndex: number, direction: 'asc' | 'desc') => void;
}

export const AccessibleTable: React.FC<AccessibleTableProps> = ({
  caption,
  headers,
  rows,
  sortable = false,
  onSort
}) => {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (columnIndex: number) => {
    if (!sortable || !onSort) return;

    const newDirection = 
      sortColumn === columnIndex && sortDirection === 'asc' ? 'desc' : 'asc';
    
    setSortColumn(columnIndex);
    setSortDirection(newDirection);
    onSort(columnIndex, newDirection);

    a11yUtils.announce(
      `Table sorted by ${headers[columnIndex]} in ${newDirection}ending order`,
      'polite'
    );
  };

  return (
    <div className="ft-table-container overflow-x-auto">
      <table className="ft-table w-full border-collapse" role="table">
        <caption className="ft-table-caption sr-only">
          {caption}
        </caption>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                scope="col"
                className={`ft-table-header p-3 text-left border-b border-flextime-border ${
                  sortable ? 'cursor-pointer hover:bg-flextime-surface-hover' : ''
                }`}
                onClick={() => handleSort(index)}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && sortable) {
                    e.preventDefault();
                    handleSort(index);
                  }
                }}
                tabIndex={sortable ? 0 : undefined}
                aria-sort={
                  sortColumn === index 
                    ? sortDirection === 'asc' ? 'ascending' : 'descending'
                    : sortable ? 'none' : undefined
                }
              >
                <div className="flex items-center justify-between">
                  {header}
                  {sortable && (
                    <span className="ml-2" aria-hidden="true">
                      {sortColumn === index ? (
                        sortDirection === 'asc' ? '↑' : '↓'
                      ) : '↕'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-flextime-surface-hover">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="ft-table-cell p-3 border-b border-flextime-border"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Accessible Form Components
interface AccessibleFormGroupProps {
  label: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  children: React.ReactNode;
}

export const AccessibleFormGroup: React.FC<AccessibleFormGroupProps> = ({
  label,
  required = false,
  error,
  helpText,
  children
}) => {
  const id = React.useId();
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="ft-form-group space-y-2">
      <label 
        htmlFor={id}
        className="ft-form-label block text-sm font-medium text-flextime-text"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>
      
      {React.cloneElement(children as React.ReactElement, {
        id,
        'aria-describedby': [
          error ? errorId : null,
          helpText ? helpId : null
        ].filter(Boolean).join(' ') || undefined,
        'aria-invalid': error ? 'true' : undefined,
        required
      } as any)}
      
      {helpText && (
        <div id={helpId} className="ft-form-help text-sm text-flextime-text-secondary">
          {helpText}
        </div>
      )}
      
      {error && (
        <div 
          id={errorId} 
          className="ft-form-error text-sm text-red-500"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
};

// Accessible Progress Bar
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label: string;
  showPercentage?: boolean;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true
}) => {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="ft-progress-container">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-flextime-text">
          {label}
        </span>
        {showPercentage && (
          <span className="text-sm text-flextime-text-secondary">
            {percentage}%
          </span>
        )}
      </div>
      <div 
        className="ft-progress-track w-full bg-flextime-surface-hover rounded-full h-2"
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={`${label}: ${percentage}% complete`}
      >
        <div 
          className="ft-progress-bar bg-flextime-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Accessible Tooltip
interface AccessibleTooltipProps {
  content: string;
  children: React.ReactElement;
}

export const AccessibleTooltip: React.FC<AccessibleTooltipProps> = ({
  content,
  children
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipId = React.useId();

  return (
    <div className="ft-tooltip-container relative inline-block">
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? tooltipId : undefined,
        onMouseEnter: () => setIsVisible(true),
        onMouseLeave: () => setIsVisible(false),
        onFocus: () => setIsVisible(true),
        onBlur: () => setIsVisible(false)
      } as any)}
      
      {isVisible && (
        <div
          id={tooltipId}
          role="tooltip"
          className="ft-tooltip absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-sm bg-flextime-surface border border-flextime-border rounded-lg shadow-lg z-50"
        >
          {content}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-flextime-surface"></div>
        </div>
      )}
    </div>
  );
};

// Focus Management Hook
export const useFocusManagement = () => {
  const focusElement = (selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const focusFirstError = () => {
    const firstError = document.querySelector('[aria-invalid="true"]') as HTMLElement;
    if (firstError) {
      firstError.focus();
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const saveFocus = (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  };

  const restoreFocus = (element: HTMLElement | null) => {
    if (element && element.focus) {
      element.focus();
    }
  };

  return {
    focusElement,
    focusFirstError,
    saveFocus,
    restoreFocus
  };
};