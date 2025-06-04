import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileNavigation.css';

// Navigation Item Interface
interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: number;
}

interface MobileNavigationProps {
  items?: NavItem[];
  onNavigate?: (path: string) => void;
}

// Default navigation items
const defaultNavItems: NavItem[] = [
  { id: 'schedule', label: 'Schedule', icon: '📅', path: '/' },
  { id: 'teams', label: 'Teams', icon: '🏆', path: '/teams' },
  { id: 'analytics', label: 'Analytics', icon: '📊', path: '/analytics' },
  { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
];

// Bottom Navigation Bar Component
export const BottomNavigation: React.FC<MobileNavigationProps> = ({
  items = defaultNavItems,
  onNavigate
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(
    items.find(item => item.path === location.pathname)?.id || items[0].id
  );
  
  const handleItemClick = (item: NavItem) => {
    setActiveItem(item.id);
    if (onNavigate) {
      onNavigate(item.path);
    } else {
      navigate(item.path);
    }
  };
  
  return (
    <motion.nav 
      className="ft-bottom-navigation"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="ft-nav-items">
        {items.map((item) => (
          <motion.button
            key={item.id}
            className={`ft-nav-item ${activeItem === item.id ? 'ft-nav-item-active' : ''}`}
            onClick={() => handleItemClick(item)}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div 
              className="ft-nav-icon"
              animate={activeItem === item.id ? { scale: 1.2 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 500 }}
            >
              {item.icon}
              {item.badge && item.badge > 0 && (
                <span className="ft-nav-badge">{item.badge}</span>
              )}
            </motion.div>
            <span className="ft-nav-label">{item.label}</span>
            {activeItem === item.id && (
              <motion.div 
                className="ft-nav-indicator"
                layoutId="nav-indicator"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.nav>
  );
};

// Floating Action Button Component
interface FABProps {
  icon: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  mini?: boolean;
  label?: string;
}

export const FloatingActionButton: React.FC<FABProps> = ({
  icon,
  onClick,
  position = 'bottom-right',
  mini = false,
  label
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <motion.button
      className={`ft-fab ft-fab-${position} ${mini ? 'ft-fab-mini' : ''}`}
      onClick={onClick}
      onHoverStart={() => label && setIsExpanded(true)}
      onHoverEnd={() => label && setIsExpanded(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      <span className="ft-fab-icon">{icon}</span>
      <AnimatePresence>
        {label && isExpanded && (
          <motion.span
            className="ft-fab-label"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Swipe Navigation Component
interface SwipeNavigationProps {
  children: React.ReactNode[];
  onSwipe?: (direction: 'left' | 'right', index: number) => void;
}

export const SwipeNavigation: React.FC<SwipeNavigationProps> = ({
  children,
  onSwipe
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  
  const handleDragEnd = (event: any, info: any) => {
    const threshold = 100;
    
    if (info.offset.x > threshold && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      onSwipe?.('right', currentIndex - 1);
    } else if (info.offset.x < -threshold && currentIndex < children.length - 1) {
      setCurrentIndex(currentIndex + 1);
      onSwipe?.('left', currentIndex + 1);
    }
    
    setDragOffset(0);
  };
  
  return (
    <div className="ft-swipe-navigation">
      <div className="ft-swipe-container">
        <motion.div
          className="ft-swipe-content"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDrag={(event, info) => setDragOffset(info.offset.x)}
          onDragEnd={handleDragEnd}
          animate={{ x: -currentIndex * 100 + '%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ x: dragOffset }}
        >
          {React.Children.map(children, (child, index) => (
            <div 
              key={index} 
              className="ft-swipe-page"
              style={{ width: '100%' }}
            >
              {child}
            </div>
          ))}
        </motion.div>
      </div>
      
      {/* Page Indicators */}
      <div className="ft-swipe-indicators">
        {React.Children.map(children, (_, index) => (
          <button
            key={index}
            className={`ft-indicator ${index === currentIndex ? 'ft-indicator-active' : ''}`}
            onClick={() => {
              setCurrentIndex(index);
              onSwipe?.('left', index);
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Mobile Drawer Component
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  children: React.ReactNode;
}

export const MobileDrawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  position = 'left',
  children
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="ft-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Drawer */}
          <motion.div
            className={`ft-drawer ft-drawer-${position}`}
            initial={{ x: position === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: position === 'left' ? '-100%' : '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(event, info) => {
              const threshold = 100;
              if (
                (position === 'left' && info.offset.x < -threshold) ||
                (position === 'right' && info.offset.x > threshold)
              ) {
                onClose();
              }
            }}
          >
            <div className="ft-drawer-handle" />
            <div className="ft-drawer-content">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Touch Gesture Handler Hook
export const useTouchGestures = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = {
      x: touchStart.x - touchEnd.x,
      y: touchStart.y - touchEnd.y
    };
    
    const isHorizontalSwipe = Math.abs(distance.x) > Math.abs(distance.y);
    const minSwipeDistance = 50;
    
    if (isHorizontalSwipe && Math.abs(distance.x) > minSwipeDistance) {
      if (distance.x > 0) {
        return 'left';
      } else {
        return 'right';
      }
    }
    
    if (!isHorizontalSwipe && Math.abs(distance.y) > minSwipeDistance) {
      if (distance.y > 0) {
        return 'up';
      } else {
        return 'down';
      }
    }
    
    return null;
  };
  
  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
};

// Pull to Refresh Component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setIsPulling(true);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPulling) return;
    
    const touch = e.touches[0];
    const distance = touch.clientY;
    setPullDistance(Math.min(distance, 150));
  };
  
  const handleTouchEnd = async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance > 100) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
  };
  
  return (
    <div 
      className="ft-pull-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div 
        className="ft-pull-indicator"
        animate={{ 
          y: isPulling ? pullDistance : isRefreshing ? 60 : 0,
          opacity: isPulling || isRefreshing ? 1 : 0
        }}
      >
        <div className={`ft-refresh-spinner ${isRefreshing ? 'ft-spinning' : ''}`}>
          ↻
        </div>
      </motion.div>
      <div className="ft-pull-content">
        {children}
      </div>
    </div>
  );
};

export default BottomNavigation;