import React, { createContext, useContext } from 'react';

interface AnimationContextProps {
  reducedMotion: boolean;
  toggleReducedMotion: () => void;
}

const AnimationContext = createContext<AnimationContextProps>({
  reducedMotion: false,
  toggleReducedMotion: () => {},
});

export const useAnimation = () => useContext(AnimationContext);

export const AnimationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AnimationContext.Provider value={{ reducedMotion: false, toggleReducedMotion: () => {} }}>
      {children}
    </AnimationContext.Provider>
  );
};