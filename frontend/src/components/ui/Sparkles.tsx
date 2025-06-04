import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SparkleProps {
  id: string;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface SparklesProps {
  children: React.ReactNode;
  density?: number;
  color?: string;
  className?: string;
}

const Sparkle: React.FC<SparkleProps> = ({ id, x, y, size, delay }) => {
  return (
    <motion.div
      key={id}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        pointerEvents: 'none',
        zIndex: 1,
      }}
      initial={{ opacity: 0, scale: 0, rotate: 0 }}
      animate={{
        opacity: [0, 1, 0],
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
      }}
      transition={{
        duration: 1.5,
        delay,
        ease: 'easeInOut',
        repeat: Infinity,
        repeatDelay: Math.random() * 3 + 2,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 0L13.8 8.2L22 10L13.8 11.8L12 20L10.2 11.8L2 10L10.2 8.2L12 0Z"
          fill="currentColor"
          fillOpacity="0.8"
        />
      </svg>
    </motion.div>
  );
};

export const Sparkles: React.FC<SparklesProps> = ({ 
  children, 
  density = 3, 
  color = '#00bfff',
  className = '' 
}) => {
  const [sparkles, setSparkles] = useState<SparkleProps[]>([]);

  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles: SparkleProps[] = [];
      for (let i = 0; i < density; i++) {
        newSparkles.push({
          id: `sparkle-${i}-${Date.now()}`,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 8 + 4,
          delay: Math.random() * 2,
        });
      }
      setSparkles(newSparkles);
    };

    generateSparkles();
    const interval = setInterval(generateSparkles, 3000);

    return () => clearInterval(interval);
  }, [density]);

  return (
    <div className={`relative ${className}`} style={{ color }}>
      <AnimatePresence>
        {sparkles.map((sparkle) => (
          <Sparkle key={sparkle.id} {...sparkle} />
        ))}
      </AnimatePresence>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Sparkles;