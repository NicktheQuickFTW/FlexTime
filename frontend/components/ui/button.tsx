import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

interface FTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'glass' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  glowEffect?: boolean;
}

const getButtonStyles = (
  variant: string, 
  size: string, 
  fullWidth: boolean, 
  glowEffect: boolean,
  loading: boolean
) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm font-medium rounded-md',
    md: 'px-4 py-2.5 text-sm font-semibold rounded-lg',
    lg: 'px-6 py-3 text-base font-semibold rounded-lg',
    xl: 'px-8 py-4 text-lg font-bold rounded-xl'
  };

  const variantStyles = {
    primary: `
      bg-gradient-to-r from-blue-600 to-blue-700 text-white
      hover:from-blue-700 hover:to-blue-800
      focus:ring-4 focus:ring-blue-500/25
      shadow-lg hover:shadow-xl
      border border-blue-600 hover:border-blue-700
    `,
    secondary: `
      bg-gradient-to-r from-gray-100 to-gray-200 text-gray-900
      hover:from-gray-200 hover:to-gray-300
      focus:ring-4 focus:ring-gray-500/25
      shadow-md hover:shadow-lg
      border border-gray-300 hover:border-gray-400
    `,
    ghost: `
      bg-transparent text-gray-700 hover:bg-gray-100
      focus:ring-4 focus:ring-gray-500/25
      border border-transparent
    `,
    glass: `
      bg-white/10 backdrop-blur-md text-white
      hover:bg-white/20 border border-white/20
      focus:ring-4 focus:ring-white/25
      shadow-lg hover:shadow-xl
    `,
    outline: `
      bg-transparent text-blue-600 border-2 border-blue-600
      hover:bg-blue-600 hover:text-white
      focus:ring-4 focus:ring-blue-500/25
    `,
    danger: `
      bg-gradient-to-r from-red-600 to-red-700 text-white
      hover:from-red-700 hover:to-red-800
      focus:ring-4 focus:ring-red-500/25
      shadow-lg hover:shadow-xl
      border border-red-600 hover:border-red-700
    `
  };

  const glowStyles = glowEffect ? {
    primary: 'hover:shadow-blue-500/50',
    secondary: 'hover:shadow-gray-400/30',
    ghost: 'hover:shadow-gray-400/20',
    glass: 'hover:shadow-white/30',
    outline: 'hover:shadow-blue-500/30',
    danger: 'hover:shadow-red-500/50'
  } : {};

  return `
    ${sizeStyles[size as keyof typeof sizeStyles]}
    ${variantStyles[variant as keyof typeof variantStyles]}
    ${glowEffect ? glowStyles[variant as keyof typeof glowStyles] || '' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${loading ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}
    inline-flex items-center justify-center gap-2
    transition-all duration-300 ease-in-out
    transform hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    font-sans tracking-wide
    focus:outline-none focus:ring-offset-2 focus:ring-offset-transparent
  `;
};

export const FTButton = forwardRef<HTMLButtonElement, FTButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  glowEffect = false,
  className = '',
  disabled,
  ...props
}, ref) => {
  const isDisabled = disabled || loading;

  return (
    <button
      ref={ref}
      className={`
        ${getButtonStyles(variant, size, fullWidth, glowEffect, loading)}
        ${className}
      `}
      disabled={isDisabled}
      {...props}
    >
      {loading && (
        <Loader2 
          size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 18 : 16} 
          className="animate-spin"
        />
      )}
      
      {!loading && leftIcon && (
        <span className="flex-shrink-0">
          {leftIcon}
        </span>
      )}
      
      <span className="flex-1 text-center">
        {loading && loadingText ? loadingText : children}
      </span>
      
      {!loading && rightIcon && (
        <span className="flex-shrink-0">
          {rightIcon}
        </span>
      )}
    </button>
  );
});

FTButton.displayName = 'FTButton';

export default FTButton;