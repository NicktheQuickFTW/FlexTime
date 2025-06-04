import React from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';

// Interface definitions
interface PageTransitionProps {
  children: React.ReactNode;
  key: string;
  transition?: 'slide' | 'fade' | 'scale' | 'blur';
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
}

interface StaggerContainerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
  className?: string;
  initial?: boolean;
}

interface RouteTransitionProps {
  children: React.ReactNode;
  pathname: string;
}

// Animation variants for different transition types
const pageVariants: Record<string, Variants> = {
  slide: {
    initial: (direction: string) => ({
      opacity: 0,
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? -50 : direction === 'down' ? 50 : 0,
    }),
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
    },
    exit: (direction: string) => ({
      opacity: 0,
      x: direction === 'left' ? 100 : direction === 'right' ? -100 : 0,
      y: direction === 'up' ? 50 : direction === 'down' ? -50 : 0,
    }),
  },
  fade: {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  },
  scale: {
    initial: {
      opacity: 0,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
    },
  },
  blur: {
    initial: {
      opacity: 0,
      filter: 'blur(10px)',
    },
    animate: {
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: {
      opacity: 0,
      filter: 'blur(10px)',
    },
  },
};

// Stagger animation variants
const staggerContainerVariants: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {},
};

const staggerItemVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -20,
  },
};

/**
 * Main page transition component with multiple animation types
 */
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  key,
  transition = 'fade',
  duration = 0.3,
  direction = 'up',
  className = '',
}) => {
  const variants = pageVariants[transition];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        custom={direction}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{
          duration,
          ease: 'easeInOut',
          type: 'tween',
        }}
        className={`ft-page-transition ${className}`}
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/**
 * Container for staggered animations of child elements
 */
export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  staggerDelay = 0.1,
  direction = 'up',
  className = '',
  initial = true,
}) => {
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial={initial ? 'initial' : false}
      animate="animate"
      exit="exit"
      className={`ft-stagger-container ${className}`}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          custom={direction}
          variants={staggerItemVariants}
          transition={{
            duration: 0.4,
            ease: 'easeOut',
          }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

/**
 * Enhanced route transition wrapper with automatic pathname detection
 */
export const RouteTransition: React.FC<RouteTransitionProps> = ({
  children,
  pathname,
}) => {
  // Determine transition type based on route
  const getTransitionConfig = (path: string) => {
    if (path.includes('/admin')) {
      return { transition: 'slide' as const, direction: 'right' as const };
    }
    if (path.includes('/dashboard')) {
      return { transition: 'fade' as const, direction: 'up' as const };
    }
    if (path.includes('/schedule')) {
      return { transition: 'scale' as const, direction: 'up' as const };
    }
    if (path.includes('/constraints')) {
      return { transition: 'blur' as const, direction: 'up' as const };
    }
    return { transition: 'fade' as const, direction: 'up' as const };
  };

  const config = getTransitionConfig(pathname);

  return (
    <PageTransition
      key={pathname}
      transition={config.transition}
      direction={config.direction}
      duration={0.4}
      className="ft-route-transition"
    >
      {children}
    </PageTransition>
  );
};

/**
 * Card animation for sport profile cards and similar components
 */
export const CardTransition: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay,
        ease: 'easeOut',
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      whileTap={{
        scale: 0.98,
      }}
      className={`ft-card-transition ${className}`}
    >
      {children}
    </motion.div>
  );
};

/**
 * Modal animation with backdrop
 */
export const ModalTransition: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}> = ({ children, isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{
              duration: 0.3,
              ease: 'easeOut',
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

/**
 * Navigation transition for mobile drawer
 */
export const DrawerTransition: React.FC<{
  children: React.ReactNode;
  isOpen: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}> = ({ children, isOpen, direction = 'left' }) => {
  const getInitialPosition = () => {
    switch (direction) {
      case 'left':
        return { x: '-100%' };
      case 'right':
        return { x: '100%' };
      case 'top':
        return { y: '-100%' };
      case 'bottom':
        return { y: '100%' };
      default:
        return { x: '-100%' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={getInitialPosition()}
          animate={{ x: 0, y: 0 }}
          exit={getInitialPosition()}
          transition={{
            duration: 0.3,
            ease: 'easeInOut',
          }}
          className="ft-drawer-transition"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Loading transition for async content
 */
export const LoadingTransition: React.FC<{
  children: React.ReactNode;
  isLoading: boolean;
  loadingComponent?: React.ReactNode;
}> = ({ children, isLoading, loadingComponent }) => {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="ft-loading-transition"
        >
          {loadingComponent || (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="ft-content-transition"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * List item transition for dynamic lists
 */
export const ListItemTransition: React.FC<{
  children: React.ReactNode;
  index: number;
  layout?: boolean;
}> = ({ children, index, layout = true }) => {
  return (
    <motion.div
      layout={layout}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        layout: { duration: 0.3 },
      }}
      whileHover={{
        x: 4,
        transition: { duration: 0.2 },
      }}
      className="ft-list-item-transition"
    >
      {children}
    </motion.div>
  );
};

// Export all components and types
export type {
  PageTransitionProps,
  StaggerContainerProps,
  RouteTransitionProps,
};

// Default export for easy importing
const pageTransitions = {
  PageTransition,
  StaggerContainer,
  RouteTransition,
  CardTransition,
  ModalTransition,
  DrawerTransition,
  LoadingTransition,
  ListItemTransition,
};

export default pageTransitions;