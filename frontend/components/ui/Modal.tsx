import React, { forwardRef, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { FTButton } from './Button';

interface FTModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  variant?: 'default' | 'glass' | 'blur';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

interface FTModalHeaderProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
  className?: string;
}

interface FTModalContentProps extends React.HTMLAttributes<HTMLDivElement> {}

interface FTModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const getModalSizes = (size: string) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-none w-full h-full m-0'
  };
  return sizes[size as keyof typeof sizes];
};

const getModalStyles = (variant: string) => {
  const variants = {
    default: `
      bg-white border border-gray-200 shadow-2xl
    `,
    glass: `
      bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl
    `,
    blur: `
      bg-white/80 backdrop-blur-lg border border-white/30 shadow-2xl
    `
  };
  return variants[variant as keyof typeof variants];
};

// Modal Overlay Component
const ModalOverlay = ({ 
  isOpen, 
  onClick, 
  variant 
}: { 
  isOpen: boolean; 
  onClick?: () => void; 
  variant: string;
}) => {
  if (!isOpen) return null;

  const overlayStyles = {
    default: 'bg-black/50',
    glass: 'bg-black/20 backdrop-blur-sm',
    blur: 'bg-black/30 backdrop-blur-md'
  };

  return (
    <div
      className={`
        fixed inset-0 z-40 transition-opacity duration-300
        ${overlayStyles[variant as keyof typeof overlayStyles]}
      `}
      onClick={onClick}
    />
  );
};

// Modal Header Component
export const FTModalHeader = forwardRef<HTMLDivElement, FTModalHeaderProps>(({
  title,
  subtitle,
  onClose,
  showCloseButton = true,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        flex items-start justify-between p-6 pb-4
        ${className}
      `}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="
            ml-4 p-1 rounded-full text-gray-400 hover:text-gray-600 
            dark:text-gray-500 dark:hover:text-gray-300
            hover:bg-gray-100 dark:hover:bg-gray-800
            transition-colors duration-200
          "
          aria-label="Close modal"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
});

FTModalHeader.displayName = 'FTModalHeader';

// Modal Content Component
export const FTModalContent = forwardRef<HTMLDivElement, FTModalContentProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        px-6 py-4 flex-1 overflow-y-auto
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

FTModalContent.displayName = 'FTModalContent';

// Modal Footer Component
export const FTModalFooter = forwardRef<HTMLDivElement, FTModalFooterProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <div
      ref={ref}
      className={`
        p-6 pt-4 border-t border-gray-200 dark:border-gray-700
        flex items-center justify-end gap-3
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

FTModalFooter.displayName = 'FTModalFooter';

// Main Modal Component
export const FTModal = forwardRef<HTMLDivElement, FTModalProps>(({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  variant = 'glass',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  footer,
  className = '',
}, ref) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isOpen, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <>
      <ModalOverlay 
        isOpen={isOpen} 
        onClick={handleOverlayClick} 
        variant={variant}
      />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          ref={modalRef}
          className={`
            ${getModalSizes(size)}
            ${getModalStyles(variant)}
            ${size === 'full' ? '' : 'rounded-2xl'}
            ${className}
            w-full max-h-full flex flex-col
            transform transition-all duration-300 ease-out
            animate-in fade-in-0 zoom-in-95
            focus:outline-none
          `}
          onClick={handleModalClick}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {(title || subtitle || showCloseButton) && (
            <FTModalHeader
              title={title}
              subtitle={subtitle}
              onClose={onClose}
              showCloseButton={showCloseButton}
            />
          )}
          
          <FTModalContent className="flex-1">
            {children}
          </FTModalContent>
          
          {footer && (
            <FTModalFooter>
              {footer}
            </FTModalFooter>
          )}
        </div>
      </div>
    </>
  );
});

FTModal.displayName = 'FTModal';

// Confirmation Modal Preset
interface FTConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  loading?: boolean;
}

export const FTConfirmModal: React.FC<FTConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false
}) => {
  return (
    <FTModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
      footer={
        <>
          <FTButton
            variant="ghost"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </FTButton>
          <FTButton
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
            loadingText="Processing..."
          >
            {confirmText}
          </FTButton>
        </>
      }
    >
      <p className="text-gray-700 dark:text-gray-300">
        {message}
      </p>
    </FTModal>
  );
};

export default FTModal;