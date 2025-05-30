import React, { forwardRef } from 'react';

interface FTCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'flat' | 'outlined';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glow?: boolean;
  blurStrength?: number;
  opacity?: number;
}

interface FTCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

interface FTCardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

interface FTCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const getCardStyles = (
  variant: string,
  size: string,
  hover: boolean,
  glow: boolean,
  blurStrength: number,
  opacity: number
) => {
  const sizeStyles = {
    sm: 'p-4 rounded-lg',
    md: 'p-6 rounded-xl',
    lg: 'p-8 rounded-2xl',
    xl: 'p-10 rounded-3xl'
  };

  const variantStyles = {
    default: `
      bg-white shadow-lg border border-gray-200
      ${hover ? 'hover:shadow-xl hover:-translate-y-1' : ''}
    `,
    glass: `
      bg-white/10 backdrop-blur-[${blurStrength}px] border border-white/20
      shadow-lg shadow-black/10
      ${hover ? 'hover:bg-white/15 hover:shadow-xl hover:-translate-y-1' : ''}
    `,
    elevated: `
      bg-white shadow-2xl border-0
      ${hover ? 'hover:shadow-3xl hover:-translate-y-2' : ''}
    `,
    flat: `
      bg-gray-50 shadow-none border border-gray-200
      ${hover ? 'hover:bg-gray-100 hover:shadow-sm' : ''}
    `,
    outlined: `
      bg-transparent border-2 border-gray-300 shadow-none
      ${hover ? 'hover:border-gray-400 hover:shadow-md' : ''}
    `
  };

  const glowStyles = glow ? {
    default: 'hover:shadow-blue-500/25',
    glass: 'hover:shadow-blue-400/30',
    elevated: 'hover:shadow-blue-500/20',
    flat: 'hover:shadow-blue-500/10',
    outlined: 'hover:shadow-blue-500/15'
  } : {};

  return `
    ${sizeStyles[size as keyof typeof sizeStyles]}
    ${variantStyles[variant as keyof typeof variantStyles]}
    ${glow ? glowStyles[variant as keyof typeof glowStyles] || '' : ''}
    transition-all duration-300 ease-in-out
    relative overflow-hidden
  `;
};

// Main Card Component
export const FTCard = forwardRef<HTMLDivElement, FTCardProps>(({
  children,
  variant = 'glass',
  size = 'md',
  hover = true,
  glow = false,
  blurStrength = 10,
  opacity = 0.1,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        ${getCardStyles(variant, size, hover, glow, blurStrength, opacity)}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

FTCard.displayName = 'FTCard';

// Card Header Component
export const FTCardHeader = forwardRef<HTMLDivElement, FTCardHeaderProps>(({
  children,
  title,
  subtitle,
  action,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        flex items-start justify-between mb-4
        ${className}
      `}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {subtitle}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );
});

FTCardHeader.displayName = 'FTCardHeader';

// Card Content Component
export const FTCardContent = forwardRef<HTMLDivElement, FTCardContentProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        text-gray-700 dark:text-gray-200
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

FTCardContent.displayName = 'FTCardContent';

// Card Footer Component
export const FTCardFooter = forwardRef<HTMLDivElement, FTCardFooterProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        mt-6 pt-4 border-t border-gray-200 dark:border-gray-700
        flex items-center justify-between
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

FTCardFooter.displayName = 'FTCardFooter';

// Composite Card with all parts
interface FTCardCompositeProps extends FTCardProps {
  header?: {
    title?: string;
    subtitle?: string;
    action?: React.ReactNode;
  };
  content?: React.ReactNode;
  footer?: React.ReactNode;
}

export const FTCardComposite = forwardRef<HTMLDivElement, FTCardCompositeProps>(({
  header,
  content,
  footer,
  children,
  ...cardProps
}, ref) => {
  return (
    <FTCard ref={ref} {...cardProps}>
      {header && (
        <FTCardHeader
          title={header.title}
          subtitle={header.subtitle}
          action={header.action}
        />
      )}
      
      {content && (
        <FTCardContent>
          {content}
        </FTCardContent>
      )}
      
      {children}
      
      {footer && (
        <FTCardFooter>
          {footer}
        </FTCardFooter>
      )}
    </FTCard>
  );
});

FTCardComposite.displayName = 'FTCardComposite';

export default FTCard;