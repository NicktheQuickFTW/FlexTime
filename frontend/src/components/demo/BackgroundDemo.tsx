'use client';

import React, { useState } from 'react';
import { FlexTimeAnimatedBackground } from '../ui/FlexTimeAnimatedBackground';
import { FlexTimeCard } from '../ui/FlexTimeCard';

export function BackgroundDemo() {
  const [intensity, setIntensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [showGrid, setShowGrid] = useState(true);
  const [showFloating, setShowFloating] = useState(true);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Demo Background */}
      <FlexTimeAnimatedBackground 
        intensity={intensity}
        showGrid={showGrid}
        showFloatingElements={showFloating}
        className="absolute inset-0"
      />
      
      {/* Demo Controls */}
      <div className="relative z-10 p-8">
        <FlexTimeCard variant="glass" className="max-w-md mx-auto mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Background Demo Controls</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Intensity</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setIntensity(level)}
                    className={`px-3 py-1 rounded text-sm ${
                      intensity === level 
                        ? 'bg-[color:var(--ft-neon)] text-black' 
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Show Grid</span>
              </label>
            </div>
            
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showFloating}
                  onChange={(e) => setShowFloating(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-300">Show Floating Elements</span>
              </label>
            </div>
          </div>
        </FlexTimeCard>
        
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">FlexTime Animated Background</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Interactive grid-based background with mouse tracking, click ripples, 
            and floating elements. Perfect for creating immersive UI experiences.
          </p>
        </div>
      </div>
    </div>
  );
}