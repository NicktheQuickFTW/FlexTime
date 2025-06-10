'use client';

import React, { useState, useEffect } from 'react';

interface FlexTimeAnimatedBackgroundProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
  showGrid?: boolean;
  showFloatingElements?: boolean;
}

export function FlexTimeAnimatedBackground({ 
  className = '', 
  intensity = 'medium',
  showGrid = true,
  showFloatingElements = true 
}: FlexTimeAnimatedBackgroundProps) {
  const [mounted, setMounted] = useState(false);
  const [mouseGradientStyle, setMouseGradientStyle] = useState({
    left: '0px',
    top: '0px',
    opacity: 0,
  });
  const [ripples, setRipples] = useState<Array<{id: number, x: number, y: number}>>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMouseGradientStyle({
        left: `${e.clientX}px`,
        top: `${e.clientY}px`,
        opacity: intensity === 'high' ? 0.8 : intensity === 'medium' ? 0.5 : 0.3,
      });
    };
    
    const handleMouseLeave = () => {
      setMouseGradientStyle(prev => ({ ...prev, opacity: 0 }));
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const newRipple = { id: Date.now(), x: e.clientX, y: e.clientY };
      setRipples(prev => [...prev, newRipple]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== newRipple.id)), 1000);
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const backgroundStyles = `
    .ft-mouse-gradient {
      position: fixed;
      pointer-events: none;
      border-radius: 9999px;
      background-image: radial-gradient(circle, rgba(0, 191, 255, 0.03), rgba(30, 64, 175, 0.02), transparent 70%);
      transform: translate(-50%, -50%);
      will-change: left, top, opacity;
      transition: left 70ms linear, top 70ms linear, opacity 300ms ease-out;
      z-index: 1;
    }
    
    .dark .ft-mouse-gradient {
      background-image: radial-gradient(circle, rgba(0, 191, 255, 0.03), rgba(30, 64, 175, 0.02), transparent 70%);
    }
    
    .light .ft-mouse-gradient, html:not(.dark) .ft-mouse-gradient {
      background-image: radial-gradient(circle, rgba(0, 191, 255, 0.05), rgba(30, 64, 175, 0.03), transparent 70%);
    }
    
    @keyframes ft-grid-draw { 
      0% { stroke-dashoffset: 1000; opacity: 0; } 
      50% { opacity: 0.4; } 
      100% { stroke-dashoffset: 0; opacity: 0.2; } 
    }
    
    @keyframes ft-pulse-glow { 
      0%, 100% { opacity: 0.05; transform: scale(1); } 
      50% { opacity: 0.15; transform: scale(1.05); } 
    }
    
    @keyframes ft-float { 
      0%, 100% { transform: translateY(0) translateX(0); opacity: 0.1; } 
      25% { transform: translateY(-8px) translateX(3px); opacity: 0.3; } 
      50% { transform: translateY(-4px) translateX(-2px); opacity: 0.2; } 
      75% { transform: translateY(-12px) translateX(5px); opacity: 0.4; } 
    }
    
    .ft-grid-line { 
      stroke: rgba(0, 191, 255, 0.15); 
      stroke-width: 0.8; 
      opacity: 0; 
      stroke-dasharray: 5 5; 
      stroke-dashoffset: 1000; 
      animation: ft-grid-draw 3s ease-out forwards; 
    }
    
    .dark .ft-grid-line {
      stroke: rgba(0, 191, 255, 0.15);
    }
    
    .light .ft-grid-line, html:not(.dark) .ft-grid-line {
      stroke: rgba(0, 191, 255, 0.25);
    }
    
    .ft-grid-pattern {
      stroke: rgba(0, 191, 255, 0.08);
    }
    
    .dark .ft-grid-pattern {
      stroke: rgba(0, 191, 255, 0.08);
    }
    
    .light .ft-grid-pattern, html:not(.dark) .ft-grid-pattern {
      stroke: rgba(0, 191, 255, 0.15);
    }
    
    .ft-detail-dot { 
      fill: rgba(0, 191, 255, 0.1); 
      opacity: 0; 
      animation: ft-pulse-glow 4s ease-in-out infinite; 
    }
    
    .ft-floating-element { 
      position: absolute; 
      width: 1px; 
      height: 1px; 
      background: rgba(0, 191, 255, 0.2); 
      border-radius: 50%; 
      opacity: 0; 
      animation: ft-float 6s ease-in-out infinite; 
    }
    
    .ft-ripple-effect { 
      position: fixed; 
      width: 3px; 
      height: 3px; 
      background: rgba(0, 191, 255, 0.3); 
      border-radius: 50%; 
      transform: translate(-50%, -50%); 
      pointer-events: none; 
      animation: ft-pulse-glow 1s ease-out forwards; 
      z-index: 9999; 
    }
    
    .ft-corner-element { 
      position: absolute; 
      width: 32px; 
      height: 32px; 
      border: 1px solid rgba(0, 191, 255, 0.1); 
      opacity: 0; 
      animation: ft-pulse-glow 1s ease-out forwards; 
    }
  `;

  // Prevent hydration mismatch by rendering the same structure
  if (!mounted) {
    return (
      <>
        <style>{backgroundStyles}</style>
        <div className={`absolute inset-0 overflow-hidden ${className}`}></div>
      </>
    );
  }

  return (
    <>
      <style>{backgroundStyles}</style>
      <div className={`absolute inset-0 overflow-hidden ${className}`}>
        
        {/* Animated Grid Background */}
        {mounted && showGrid && (
          <svg 
            className="absolute inset-0 w-full h-full pointer-events-none" 
            xmlns="http://www.w3.org/2000/svg" 
            aria-hidden="true"
          >
            <defs>
              <pattern id="ftGridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
                <path 
                  d="M 60 0 L 0 0 0 60" 
                  fill="none" 
                  stroke="rgba(0, 191, 255, 0.08)" 
                  strokeWidth="0.8"
                  className="ft-grid-pattern"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ftGridPattern)" />
            
            {/* Main grid lines */}
            <line x1="0" y1="25%" x2="100%" y2="25%" className="ft-grid-line" style={{ animationDelay: '0.5s' }} />
            <line x1="0" y1="75%" x2="100%" y2="75%" className="ft-grid-line" style={{ animationDelay: '1s' }} />
            <line x1="25%" y1="0" x2="25%" y2="100%" className="ft-grid-line" style={{ animationDelay: '1.5s' }} />
            <line x1="75%" y1="0" x2="75%" y2="100%" className="ft-grid-line" style={{ animationDelay: '2s' }} />
            
            {/* Center lines */}
            <line x1="50%" y1="0" x2="50%" y2="100%" className="ft-grid-line" style={{ animationDelay: '2.5s', opacity: '0.03' }} />
            <line x1="0" y1="50%" x2="100%" y2="50%" className="ft-grid-line" style={{ animationDelay: '3s', opacity: '0.03' }} />
            
            {/* Corner dots */}
            <circle cx="25%" cy="25%" r="1.5" className="ft-detail-dot" style={{ animationDelay: '3s' }} />
            <circle cx="75%" cy="25%" r="1.5" className="ft-detail-dot" style={{ animationDelay: '3.2s' }} />
            <circle cx="25%" cy="75%" r="1.5" className="ft-detail-dot" style={{ animationDelay: '3.4s' }} />
            <circle cx="75%" cy="75%" r="1.5" className="ft-detail-dot" style={{ animationDelay: '3.6s' }} />
            <circle cx="50%" cy="50%" r="1" className="ft-detail-dot" style={{ animationDelay: '4s' }} />
          </svg>
        )}

        {/* Corner Elements */}
        {mounted && (
          <>
            <div className="ft-corner-element top-4 left-4" style={{ animationDelay: '4s' }}>
              <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"></div>
            </div>
            <div className="ft-corner-element top-4 right-4" style={{ animationDelay: '4.2s' }}>
              <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"></div>
            </div>
            <div className="ft-corner-element bottom-4 left-4" style={{ animationDelay: '4.4s' }}>
              <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"></div>
            </div>
            <div className="ft-corner-element bottom-4 right-4" style={{ animationDelay: '4.6s' }}>
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-[color:var(--ft-neon)] opacity-20 rounded-full"></div>
            </div>
          </>
        )}

        {/* Floating Elements */}
        {mounted && showFloatingElements && (
          <>
            <div className="ft-floating-element" style={{ top: '20%', left: '10%', animationDelay: '0.5s' }}></div>
            <div className="ft-floating-element" style={{ top: '60%', left: '85%', animationDelay: '1s' }}></div>
            <div className="ft-floating-element" style={{ top: '35%', left: '8%', animationDelay: '1.5s' }}></div>
            <div className="ft-floating-element" style={{ top: '80%', left: '90%', animationDelay: '2s' }}></div>
            <div className="ft-floating-element" style={{ top: '15%', left: '70%', animationDelay: '2.5s' }}></div>
            <div className="ft-floating-element" style={{ top: '45%', left: '15%', animationDelay: '3s' }}></div>
            <div className="ft-floating-element" style={{ top: '70%', left: '60%', animationDelay: '3.5s' }}></div>
            <div className="ft-floating-element" style={{ top: '25%', left: '40%', animationDelay: '4s' }}></div>
          </>
        )}

        {/* Mouse Gradient */}
        {mounted && (
          <div 
            className="ft-mouse-gradient w-96 h-96 blur-3xl"
            style={{
              left: mouseGradientStyle.left,
              top: mouseGradientStyle.top,
              opacity: mouseGradientStyle.opacity,
            }}
          ></div>
        )}

        {/* Click Ripples */}
        {mounted && ripples.map(ripple => (
          <div
            key={ripple.id}
            className="ft-ripple-effect"
            style={{ left: `${ripple.x}px`, top: `${ripple.y}px` }}
          ></div>
        ))}
      </div>
    </>
  );
}