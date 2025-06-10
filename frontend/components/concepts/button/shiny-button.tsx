"use client";

import React from "react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

// Define custom type for animation props to avoid TypeScript errors
type CustomAnimationProps = {
  initial: { [key: string]: string | number };
  animate: { [key: string]: string | number };
  whileTap: { scale: number };
  transition: {
    repeat: number;
    repeatType: "loop";
    repeatDelay: number;
    type: string;
    stiffness: number;
    damping: number;
    mass: number;
    scale: {
      type: string;
      stiffness: number;
      damping: number;
      mass: number;
    };
  };
};

const animationProps: CustomAnimationProps = {
  initial: { "--x": "100%", scale: 0.8 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
};

interface ShinyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'neon' | 'glass';
}

export const ShinyButton = ({
  children,
  className,
  variant = 'primary',
  ...props
}: ShinyButtonProps) => {
  const variantStyles = {
    primary: {
      base: "bg-[color:var(--ft-neon)] text-black border border-[color:var(--ft-neon)] hover:bg-[color:var(--ft-neon)]/80 shadow-lg hover:shadow-[color:var(--ft-neon-glow)]",
      shine: "var(--ft-neon)" 
    },
    secondary: {
      base: "bg-transparent border border-gray-600 text-white hover:border-[color:var(--ft-neon)] hover:bg-[color:var(--ft-neon)]/10",
      shine: "var(--ft-neon)" 
    },
    neon: {
      base: "bg-black border-2 border-[color:var(--ft-neon)] text-white hover:bg-[color:var(--ft-neon)]/10 shadow-xl shadow-[color:var(--ft-neon-glow)]",
      shine: "var(--ft-neon)" 
    },
    glass: {
      base: "ft-glass-card text-white border border-[color:var(--ft-glass-border)] hover:border-[color:var(--ft-neon)]/50 backdrop-blur-xl",
      shine: "var(--ft-neon)" 
    }
  };

  const currentVariant = variantStyles[variant];
  
  return (
    <motion.button
      // Cast animationProps to any to avoid type conflicts with framer-motion
      {...(animationProps as any)}
      {...props}
      className={cn(
        "relative rounded-lg px-6 py-3 font-medium transition-all duration-300 ease-in-out ft-font-ui uppercase tracking-wide",
        currentVariant.base,
        className
      )}
      style={{
        '--primary': 'var(--ft-neon)' 
      } as React.CSSProperties}
    >
      <span
        className="relative block size-full text-sm font-semibold"
        style={{
          maskImage: `linear-gradient(-75deg, ${currentVariant.shine} calc(var(--x) + 20%), transparent calc(var(--x) + 30%), ${currentVariant.shine} calc(var(--x) + 100%))`,
        }}
      >
        {children}
      </span>
      <span
        style={{
          mask: "linear-gradient(rgb(0,0,0), rgb(0,0,0)) content-box,linear-gradient(rgb(0,0,0), rgb(0,0,0))",
          maskComposite: "exclude",
          background: `linear-gradient(-75deg, var(--ft-neon-glow) calc(var(--x) + 20%), var(--ft-neon) calc(var(--x) + 25%), var(--ft-neon-glow) calc(var(--x) + 100%))`
        } as React.CSSProperties}
        className="absolute inset-0 z-10 block rounded-[inherit] p-px"
      ></span>
    </motion.button>
  );
};

// No need for additional export as the component is already exported above
