'use client';

import React, { useState } from 'react';
import { Settings, ToggleLeft, Sliders } from 'lucide-react';

export interface Constraint {
  id: string;
  type: string;
  description: string;
  weight: number;
  active: boolean;
}

interface SimpleConstraintManagerProps {
  constraints?: Constraint[];
  onConstraintChange?: (constraints: Constraint[]) => void;
}

export default function SimpleConstraintManager({ 
  constraints = [], 
  onConstraintChange 
}: SimpleConstraintManagerProps) {
  const [localConstraints, setLocalConstraints] = useState<Constraint[]>(constraints);

  const toggleConstraint = (id: string) => {
    const updated = localConstraints.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    );
    setLocalConstraints(updated);
    onConstraintChange?.(updated);
  };

  const updateWeight = (id: string, weight: number) => {
    const updated = localConstraints.map(c => 
      c.id === id ? { ...c, weight } : c
    );
    setLocalConstraints(updated);
    onConstraintChange?.(updated);
  };

  return (
    <div className="ft-card-unified p-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-accent dark:text-[color:var(--ft-neon)]" />
        <h3 className="text-lg font-semibold text-foreground">Constraints</h3>
      </div>
      
      <div className="space-y-4">
        {localConstraints.map((constraint) => (
          <div key={constraint.id} className="border border-border/20 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleConstraint(constraint.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    constraint.active 
                      ? 'bg-accent dark:bg-[color:var(--ft-neon)] border-accent dark:border-[color:var(--ft-neon)]' 
                      : 'border-border'
                  }`}
                >
                  {constraint.active && <ToggleLeft className="w-3 h-3 text-white" />}
                </button>
                <span className={`font-medium ${constraint.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {constraint.type}
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Weight: {constraint.weight.toFixed(1)}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground mb-3">
              {constraint.description}
            </p>
            
            {constraint.active && (
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={constraint.weight}
                  onChange={(e) => updateWeight(constraint.id, parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>
        ))}
        
        {localConstraints.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No constraints configured</p>
          </div>
        )}
      </div>
    </div>
  );
}