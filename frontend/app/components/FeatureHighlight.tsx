'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import GlassCard from './GlassCard';

interface FeatureProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  index?: number;
  href?: string;
  accentColor?: string;
  features?: string[];
}

const FeatureHighlight: React.FC<FeatureProps> = ({
  title,
  description,
  icon,
  index = 0,
  href,
  accentColor = 'var(--ft-neon)',
  features = [],
}) => {
  const featureContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 * index }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <GlassCard 
        variant="default" 
        hoverable 
        className="p-6 h-full flex flex-col"
      >
        {/* Animated indicator dot */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div 
              className="w-2 h-2 rounded-full mr-2 animate-pulse" 
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0 0 8px ${accentColor}` 
              }}
            />
            {icon && <div className="mr-2">{icon}</div>}
            <h3 
              className="text-lg font-medium"
              style={{ fontFamily: 'var(--ft-font-secondary)' }}
            >
              {title}
            </h3>
          </div>
          
          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 + 0.1 * index }}
            className="h-px w-10"
            style={{ 
              backgroundColor: accentColor,
              opacity: 0.4,
              transformOrigin: 'right'
            }}
          />
        </div>
        
        <p className="text-sm text-gray-400 mb-4 flex-grow">
          {description}
        </p>
        
        {features.length > 0 && (
          <div className="border-t border-white/5 pt-4 mt-auto">
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <li key={i} className="flex items-center text-xs text-gray-300">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      duration: 0.4, 
                      delay: 0.6 + 0.1 * index + 0.1 * i,
                      type: 'spring'
                    }}
                    className="w-1 h-1 rounded-full mr-2"
                    style={{ backgroundColor: accentColor }}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );

  // If we have an href, wrap in Link, otherwise render directly
  if (href) {
    return (
      <Link href={href} className="h-full block">
        {featureContent}
      </Link>
    );
  }
  
  return featureContent;
};

export default FeatureHighlight;
