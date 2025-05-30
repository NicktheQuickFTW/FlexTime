import React, { forwardRef, useState } from 'react';
import {
  Eye,
  EyeOff,
  Search,
  User,
  Mail,
  Lock,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Check,
  ChevronDown
} from 'lucide-react';

// Base input interface
interface BaseInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'glass' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  success?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

// Input component props
interface FTInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, BaseInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local';
}

// Select component props
interface FTSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>, BaseInputProps {
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

// Textarea component props
interface FTTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>, BaseInputProps {
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
}

// Icon mapping for common input types
const getDefaultIcon = (type?: string) => {
  switch (type) {
    case 'email':
      return <Mail size={16} />;
    case 'password':
      return <Lock size={16} />;
    case 'search':
      return <Search size={16} />;
    case 'date':
    case 'datetime-local':
      return <Calendar size={16} />;
    case 'time':
      return <Clock size={16} />;
    case 'tel':
      return <User size={16} />;
    case 'url':
      return <MapPin size={16} />;
    default:
      return null;
  }
};

// Base styles for all input components
const getBaseStyles = (variant: string, size: string, hasError: boolean, hasSuccess: boolean, fullWidth: boolean) => {
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  };

  const variantStyles = {
    default: `
      bg-white border border-gray-200 
      focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
      hover:border-gray-300
    `,
    glass: `
      bg-white/10 backdrop-blur-md border border-white/20
      focus:border-blue-400/50 focus:ring-2 focus:ring-blue-400/30
      hover:border-white/30 hover:bg-white/15
      placeholder:text-white/60 text-white
    `,
    minimal: `
      bg-transparent border-0 border-b-2 border-gray-200 rounded-none
      focus:border-blue-500 focus:ring-0
      hover:border-gray-300
    `
  };

  return `
    ${sizeStyles[size as keyof typeof sizeStyles]}
    ${variantStyles[variant as keyof typeof variantStyles]}
    ${fullWidth ? 'w-full' : ''}
    ${hasError ? '!border-red-500 focus:!border-red-500 focus:!ring-red-500/20' : ''}
    ${hasSuccess ? '!border-green-500 focus:!border-green-500 focus:!ring-green-500/20' : ''}
    rounded-lg font-medium transition-all duration-300 ease-in-out
    disabled:opacity-50 disabled:cursor-not-allowed
    outline-none focus:outline-none
  `;
};

// Loading spinner component
const LoadingSpinner = ({ size = 16 }: { size?: number }) => (
  <div 
    className="animate-spin border-2 border-current border-t-transparent rounded-full"
    style={{ width: size, height: size }}
  />
);

// Input wrapper component
const InputWrapper = ({ 
  children, 
  label, 
  error, 
  helperText, 
  success,
  fullWidth,
  required 
}: {
  children: React.ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
  success?: boolean;
  fullWidth?: boolean;
  required?: boolean;
}) => (
  <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : ''}`}>
    {label && (
      <label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
    )}
    {children}
    {(error || helperText) && (
      <div className="flex items-center gap-1.5 text-xs">
        {error ? (
          <>
            <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
            <span className="text-red-500">{error}</span>
          </>
        ) : helperText ? (
          <span className="text-gray-500">{helperText}</span>
        ) : null}
      </div>
    )}
    {success && !error && (
      <div className="flex items-center gap-1.5 text-xs text-green-600">
        <Check size={12} className="flex-shrink-0" />
        <span>Looks good!</span>
      </div>
    )}
  </div>
);

// Main Input Component
export const FTInput = forwardRef<HTMLInputElement, FTInputProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'glass',
  size = 'md',
  success,
  loading,
  fullWidth = true,
  type = 'text',
  className = '',
  required,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const displayIcon = icon || getDefaultIcon(type);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <InputWrapper 
      label={label} 
      error={error} 
      helperText={helperText} 
      success={success}
      fullWidth={fullWidth}
      required={required}
    >
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        {displayIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <div className={`transition-colors duration-200 ${
              isFocused 
                ? variant === 'glass' ? 'text-blue-300' : 'text-blue-500'
                : variant === 'glass' ? 'text-white/60' : 'text-gray-400'
            }`}>
              {displayIcon}
            </div>
          </div>
        )}
        
        <input
          ref={ref}
          type={inputType}
          className={`
            ${getBaseStyles(variant, size, !!error, !!success, fullWidth)}
            ${displayIcon ? 'pl-10' : ''}
            ${(isPassword || loading) ? 'pr-10' : ''}
            ${className}
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          required={required}
          {...props}
        />

        {(isPassword || loading) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
            {loading ? (
              <LoadingSpinner size={16} />
            ) : isPassword ? (
              <button
                type="button"
                onClick={handleTogglePassword}
                className={`transition-colors duration-200 hover:opacity-80 ${
                  variant === 'glass' ? 'text-white/60 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'
                }`}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </InputWrapper>
  );
});

FTInput.displayName = 'FTInput';

// Select Component
export const FTSelect = forwardRef<HTMLSelectElement, FTSelectProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'glass',
  size = 'md',
  success,
  loading,
  fullWidth = true,
  options,
  placeholder,
  className = '',
  required,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <InputWrapper 
      label={label} 
      error={error} 
      helperText={helperText} 
      success={success}
      fullWidth={fullWidth}
      required={required}
    >
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
            <div className={`transition-colors duration-200 ${
              isFocused 
                ? variant === 'glass' ? 'text-blue-300' : 'text-blue-500'
                : variant === 'glass' ? 'text-white/60' : 'text-gray-400'
            }`}>
              {icon}
            </div>
          </div>
        )}
        
        <select
          ref={ref}
          className={`
            ${getBaseStyles(variant, size, !!error, !!success, fullWidth)}
            ${icon ? 'pl-10' : ''}
            pr-10 appearance-none cursor-pointer
            ${className}
          `}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          required={required}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
          {loading ? (
            <LoadingSpinner size={16} />
          ) : (
            <ChevronDown 
              size={16} 
              className={`transition-colors duration-200 ${
                variant === 'glass' ? 'text-white/60' : 'text-gray-400'
              }`}
            />
          )}
        </div>
      </div>
    </InputWrapper>
  );
});

FTSelect.displayName = 'FTSelect';

// Textarea Component
export const FTTextarea = forwardRef<HTMLTextAreaElement, FTTextareaProps>(({
  label,
  error,
  helperText,
  icon,
  variant = 'glass',
  size = 'md',
  success,
  loading,
  fullWidth = true,
  resize = 'vertical',
  autoResize = false,
  minRows = 3,
  maxRows,
  className = '',
  required,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  const resizeStyles = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize'
  };

  return (
    <InputWrapper 
      label={label} 
      error={error} 
      helperText={helperText} 
      success={success}
      fullWidth={fullWidth}
      required={required}
    >
      <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
        {icon && (
          <div className="absolute left-3 top-3 z-10">
            <div className={`transition-colors duration-200 ${
              isFocused 
                ? variant === 'glass' ? 'text-blue-300' : 'text-blue-500'
                : variant === 'glass' ? 'text-white/60' : 'text-gray-400'
            }`}>
              {icon}
            </div>
          </div>
        )}
        
        <textarea
          ref={ref}
          className={`
            ${getBaseStyles(variant, size, !!error, !!success, fullWidth)}
            ${icon ? 'pl-10' : ''}
            ${loading ? 'pr-10' : ''}
            ${resizeStyles[resize]}
            ${autoResize ? 'overflow-hidden' : ''}
            ${className}
          `}
          rows={minRows}
          style={{
            minHeight: autoResize ? `${minRows * 1.5}em` : undefined,
            maxHeight: maxRows ? `${maxRows * 1.5}em` : undefined,
          }}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          required={required}
          {...props}
        />

        {loading && (
          <div className="absolute right-3 top-3">
            <LoadingSpinner size={16} />
          </div>
        )}
      </div>
    </InputWrapper>
  );
});

FTTextarea.displayName = 'FTTextarea';

// Export all components
export { FTInput as default };