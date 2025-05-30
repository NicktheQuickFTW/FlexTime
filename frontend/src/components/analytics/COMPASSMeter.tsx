import React, { useState, useEffect } from 'react';
import './COMPASSMeter.css';

interface COMPASSMeterProps {
  score: number; // 0-100
  breakdown?: {
    constraints: number;
    optimization: number;
    metrics: number;
    performance: number;
    analytics: number;
    schedule: number;
  };
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
  className?: string;
}

export const COMPASSMeter: React.FC<COMPASSMeterProps> = ({ 
  score, 
  breakdown, 
  size = 'md', 
  animated = true,
  showLabel = true,
  className = ''
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  
  const meterSizes = {
    sm: { diameter: 120, strokeWidth: 6, fontSize: '1.5rem' },
    md: { diameter: 200, strokeWidth: 8, fontSize: '2rem' },
    lg: { diameter: 280, strokeWidth: 10, fontSize: '2.5rem' }
  };
  
  const { diameter, strokeWidth, fontSize } = meterSizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Animate score on mount and changes
  useEffect(() => {
    setIsVisible(true);
    if (animated) {
      let startTime: number;
      const duration = 1500; // 1.5 seconds
      
      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const currentScore = score * easeOutCubic;
        
        setAnimatedScore(currentScore);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    } else {
      setAnimatedScore(score);
    }
  }, [score, animated]);

  const getScoreColor = (score: number): string => {
    if (score >= 95) return 'var(--ft-golden-hour)';
    if (score >= 85) return 'var(--ft-cyber-cyan)';
    if (score >= 75) return 'var(--ft-electric-blue)';
    if (score >= 65) return 'var(--ft-neon-purple)';
    if (score >= 50) return 'var(--ft-warning-orange)';
    return 'var(--ft-error-red)';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 95) return 'Exceptional';
    if (score >= 85) return 'Excellent';
    if (score >= 75) return 'Good';
    if (score >= 65) return 'Fair';
    if (score >= 50) return 'Needs Work';
    return 'Critical';
  };

  const scoreColor = getScoreColor(animatedScore);
  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className={`ft-compass-meter ft-compass-meter--${size} ${className} ${isVisible ? 'ft-compass-meter--visible' : ''}`}>
      <div className="ft-compass-container">
        <svg 
          className="ft-compass-svg"
          width={diameter} 
          height={diameter}
          viewBox={`0 0 ${diameter} ${diameter}`}
        >
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke="var(--ft-glass-primary)"
            strokeWidth={strokeWidth}
            className="ft-compass-bg-circle"
          />
          
          {/* Progress circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="ft-compass-progress-circle"
            transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
          />
          
          {/* Glow effect */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="none"
            stroke={scoreColor}
            strokeWidth={strokeWidth + 2}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="ft-compass-glow-circle"
            transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
            opacity="0.3"
          />
        </svg>
        
        <div className="ft-compass-content">
          <div className="ft-compass-score" style={{ fontSize }}>
            {Math.round(animatedScore)}
          </div>
          {showLabel && (
            <div className="ft-compass-labels">
              <div className="ft-compass-label">COMPASS</div>
              <div className="ft-compass-grade">{getScoreGrade(animatedScore)}</div>
            </div>
          )}
        </div>
      </div>
      
      {breakdown && (
        <div className="ft-compass-breakdown">
          <div className="ft-breakdown-header">
            <span className="ft-breakdown-title">Score Breakdown</span>
            <span className="ft-breakdown-total">{Math.round(animatedScore)}/100</span>
          </div>
          <div className="ft-breakdown-grid">
            {Object.entries(breakdown).map(([key, value]) => {
              const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
              const percentage = (value / 100) * 100;
              
              return (
                <div key={key} className="ft-breakdown-item">
                  <div className="ft-breakdown-item-header">
                    <span className="ft-breakdown-label">{displayKey}</span>
                    <span className="ft-breakdown-value">{Math.round(value)}</span>
                  </div>
                  <div className="ft-breakdown-bar">
                    <div 
                      className="ft-breakdown-bar-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getScoreColor(value),
                        transition: animated ? 'width 1.5s ease-out' : 'none'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default COMPASSMeter;