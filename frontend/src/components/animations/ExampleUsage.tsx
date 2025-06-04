/**
 * Example usage of the FlexTime Animation System
 * This file demonstrates how to integrate and use the animation components
 */

import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  AnimationProvider,
  // RouteTransitionWrapper, // Disabled for Next.js
  PageTransition,
  StaggerContainer,
  CardTransition,
  ModalTransition,
  LoadingTransition,
  useAnimation,
  useScrollAnimation,
  SLIDE_UP_VARIANTS,
  ANIMATION_DURATION,
} from './index';
import { motion } from 'framer-motion';
import './animations.css';

// Example App component with full animation integration
export const AnimatedApp: React.FC = () => {
  return (
    <AnimationProvider>
      <div className="animated-app">
        <Navigation />
        {/* <RouteTransitionWrapper> Disabled for Next.js */}
          <Routes>
            <Route path="/dashboard" element={<AnimatedDashboard />} />
            <Route path="/sports" element={<AnimatedSportsGrid />} />
            <Route path="/schedule" element={<AnimatedSchedule />} />
            <Route path="/modal-demo" element={<ModalDemo />} />
          </Routes>
        {/* </RouteTransitionWrapper> */}
      </div>
    </AnimationProvider>
  );
};

// Navigation with route-based styling
const Navigation: React.FC = () => {
  const location = useLocation();
  const { shouldAnimate } = useAnimation();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/sports', label: 'Sports' },
    { path: '/schedule', label: 'Schedule' },
    { path: '/modal-demo', label: 'Modal Demo' },
  ];

  return (
    <nav className="ft-navigation">
      <StaggerContainer staggerDelay={0.05} direction="right">
        {navItems.map((item) => (
          <motion.div
            key={item.path}
            whileHover={shouldAnimate ? { scale: 1.05 } : {}}
            whileTap={shouldAnimate ? { scale: 0.95 } : {}}
          >
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
      </StaggerContainer>
    </nav>
  );
};

// Dashboard with scroll-triggered animations
const AnimatedDashboard: React.FC = () => {
  const { ref, isVisible } = useScrollAnimation(0.2);
  const { getOptimizedConfig } = useAnimation();

  const cards = [
    { title: 'Teams', count: 16, color: 'blue' },
    { title: 'Sports', count: 23, color: 'green' },
    { title: 'Venues', count: 45, color: 'purple' },
    { title: 'Games', count: 234, color: 'orange' },
  ];

  return (
    <PageTransition key="dashboard" transition="fade" duration={0.4}>
      <div className="dashboard-page">
        <motion.h1
          variants={SLIDE_UP_VARIANTS}
          initial="initial"
          animate="animate"
          transition={getOptimizedConfig({ duration: 0.6 })}
        >
          FlexTime Dashboard
        </motion.h1>

        <div ref={ref} className="dashboard-grid">
          <StaggerContainer staggerDelay={0.1}>
            {cards.map((card, index) => (
              <CardTransition key={card.title} delay={index * 0.1}>
                <div className={`dashboard-card ${card.color}`}>
                  <h3>{card.title}</h3>
                  <motion.div
                    className="count"
                    initial={{ scale: 0 }}
                    animate={isVisible ? { scale: 1 } : {}}
                    transition={{ delay: 0.3 + index * 0.1, type: 'spring' }}
                  >
                    {card.count}
                  </motion.div>
                </div>
              </CardTransition>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

// Sports grid with sport-specific theming
const AnimatedSportsGrid: React.FC = () => {
  const sports = [
    { name: 'Football', teams: 16, slug: 'football' },
    { name: 'Basketball', teams: 16, slug: 'basketball' },
    { name: 'Baseball', teams: 14, slug: 'baseball' },
    { name: 'Softball', teams: 11, slug: 'softball' },
  ];

  return (
    <PageTransition key="sports" transition="scale" duration={0.5}>
      <div className="sports-page">
        <h1>Big 12 Sports</h1>
        
        <div className="sports-grid">
          <StaggerContainer staggerDelay={0.15}>
            {sports.map((sport, index) => (
              <div key={sport.slug} className={`ft-sport-${sport.slug}`}>
                <CardTransition delay={index * 0.1}>
                  <motion.div
                    className="sport-card"
                    whileHover={{ 
                      y: -10,
                      transition: { duration: 0.2 } 
                    }}
                  >
                    <h3>{sport.name}</h3>
                    <p>{sport.teams} teams</p>
                    <div className="sport-icon">{sport.name[0]}</div>
                  </motion.div>
                </CardTransition>
              </div>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  );
};

// Schedule page with loading states
const AnimatedSchedule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [scheduleData, setScheduleData] = useState<any[]>([]);

  React.useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setScheduleData([
        { id: 1, team1: 'Kansas', team2: 'Oklahoma', date: '2025-01-15' },
        { id: 2, team1: 'Texas', team2: 'Baylor', date: '2025-01-16' },
        { id: 3, team1: 'TCU', team2: 'West Virginia', date: '2025-01-17' },
      ]);
      setLoading(false);
    }, 2000);
  }, []);

  return (
    <PageTransition key="schedule" transition="slide" direction="left">
      <div className="schedule-page">
        <h1>Game Schedule</h1>
        
        <LoadingTransition 
          isLoading={loading}
          loadingComponent={
            <div className="loading-spinner">
              <motion.div
                className="spinner"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              <p>Loading schedule data...</p>
            </div>
          }
        >
          <div className="schedule-list">
            <StaggerContainer staggerDelay={0.1}>
              {scheduleData.map((game, index) => (
                <motion.div
                  key={game.id}
                  className="schedule-item"
                  layoutId={`game-${game.id}`}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="teams">
                    {game.team1} vs {game.team2}
                  </div>
                  <div className="date">{game.date}</div>
                </motion.div>
              ))}
            </StaggerContainer>
          </div>
        </LoadingTransition>
      </div>
    </PageTransition>
  );
};

// Modal demonstration
const ModalDemo: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <PageTransition key="modal-demo" transition="blur" duration={0.3}>
      <div className="modal-demo-page">
        <h1>Modal Animation Demo</h1>
        
        <motion.button
          className="open-modal-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsModalOpen(true)}
        >
          Open Modal
        </motion.button>

        <ModalTransition 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
        >
          <div className="modal-content">
            <h2>Animated Modal</h2>
            <p>This modal uses smooth entrance and exit animations.</p>
            <motion.button
              className="close-btn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </motion.button>
          </div>
        </ModalTransition>
      </div>
    </PageTransition>
  );
};

// Performance-aware component
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PerformanceAwareComponent: React.FC = () => {
  const { shouldAnimate, getOptimizedConfig, animationQuality } = useAnimation();

  if (!shouldAnimate) {
    return (
      <div className="static-component">
        <h3>Static Content (Animations Disabled)</h3>
        <p>This content is displayed without animations for better performance or accessibility.</p>
      </div>
    );
  }

  const animationConfig = getOptimizedConfig({
    duration: ANIMATION_DURATION.NORMAL,
    ease: 'easeOut',
    scale: [1, 1.1, 1],
  });

  return (
    <motion.div
      className="performance-aware"
      {...animationConfig}
      whileHover={animationQuality === 'high' ? { y: -5 } : {}}
    >
      <h3>Performance Optimized Animation</h3>
      <p>Quality: {animationQuality}</p>
      <p>This component adapts its animations based on device performance.</p>
    </motion.div>
  );
};

// Example with accessibility considerations
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AccessibleAnimatedList: React.FC<{ items: string[] }> = ({ items }) => {
  const { shouldAnimate } = useAnimation();

  return (
    <motion.ul
      className="accessible-list"
      initial={false}
      animate={shouldAnimate ? "visible" : "static"}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
          },
        },
        static: {},
      }}
    >
      {items.map((item, index) => (
        <motion.li
          key={item}
          variants={{
            visible: {
              opacity: 1,
              x: 0,
              transition: { duration: 0.3 },
            },
            static: {
              opacity: 1,
              x: 0,
            },
          }}
          tabIndex={0}
          role="listitem"
          aria-label={`List item ${index + 1}: ${item}`}
        >
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
};

export default AnimatedApp;