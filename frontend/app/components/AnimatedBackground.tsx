'use client';

import React, { useEffect, useRef } from 'react';

interface AnimatedBackgroundProps {
  className?: string;
  accentColor?: string;
  density?: number;
  speed?: number;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  className = '',
  accentColor = 'var(--ft-neon-blue)',
  density = 20,
  speed = 30
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrameId: number;
    
    // Particles array
    const particles: Particle[] = [];
    
    // Set canvas dimensions
    const setDimensions = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    setDimensions();
    
    // Particle class
    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      opacity: number;
      
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        
        // 95% of particles are white/gray, 5% are accent color
        this.color = Math.random() > 0.95 ? accentColor : '#ffffff';
        this.opacity = Math.random() * 0.5 + 0.1;
      }
      
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        
        // Wrap around edges
        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
      }
      
      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // Initialize particles
    const init = () => {
      for (let i = 0; i < density; i++) {
        particles.push(new Particle());
      }
    };
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, width, height);
      
      // Update and draw particles
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      
      // Connect particles with lines if they're close enough
      connectParticles();
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    // Connect nearby particles with lines
    const connectParticles = () => {
      const maxDistance = 100;
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxDistance) {
            const opacity = 1 - distance / maxDistance;
            ctx.globalAlpha = opacity * 0.2;
            ctx.strokeStyle = particles[i].color === accentColor || particles[j].color === accentColor 
              ? accentColor 
              : '#ffffff';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };
    
    // Handle window resize
    const handleResize = () => {
      setDimensions();
      particles.length = 0;
      init();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initialize and start animation
    init();
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [accentColor, density]);
  
  return (
    <div className={`absolute inset-0 overflow-hidden -z-10 ${className}`}>
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 bg-black"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/40 to-black/90" />
    </div>
  );
};

export default AnimatedBackground;
