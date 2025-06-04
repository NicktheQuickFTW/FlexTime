"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Custom animation props type that includes framer-motion properties
type CustomAnimationProps = {
  initial: { [key: string]: string | number };
  animate: { [key: string]: string | number };
  whileTap: { [key: string]: number };
  transition: any;
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

interface FlexTimeShinyButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'neon' | 'glass';
}

export const FlexTimeShinyButton: React.FC<FlexTimeShinyButtonProps> = ({
  children,
  className,
  variant = 'primary',
  ...props
}) => {
  const variantStyles = {
    primary: {
      base: "bg-black dark:bg-[color:var(--ft-neon)] text-white dark:text-black border border-black dark:border-[color:var(--ft-neon)] hover:bg-gray-800 dark:hover:bg-[color:var(--ft-neon)]/80 shadow-lg hover:shadow-[color:var(--ft-neon-glow)]",
      shine: "var(--ft-neon)" 
    },
    secondary: {
      base: "bg-white/80 dark:bg-transparent border border-white/60 dark:border-gray-600 text-black dark:text-white hover:bg-white/90 hover:border-white/80 dark:hover:border-[color:var(--ft-neon)] dark:hover:bg-[color:var(--ft-neon)]/10 backdrop-blur-sm",
      shine: "var(--ft-neon)" 
    },
    neon: {
      base: "bg-black dark:bg-black border-2 border-black dark:border-[color:var(--ft-neon)] text-white dark:text-white hover:bg-gray-800 dark:hover:bg-[color:var(--ft-neon)]/10 shadow-[0_0_20px_rgba(0,191,255,0.4)] hover:shadow-[0_0_25px_rgba(0,191,255,0.6)]",
      shine: "var(--ft-neon)" 
    },
    glass: {
      base: "ft-glass-card text-black dark:text-white border border-gray-200 dark:border-[color:var(--ft-glass-border)] hover:border-black dark:hover:border-[color:var(--ft-neon)]/50 backdrop-blur-xl",
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
          // Move sx properties into the style object
          background: `linear-gradient(-75deg, var(--ft-neon-glow) calc(var(--x) + 20%), var(--ft-neon) calc(var(--x) + 25%), var(--ft-neon-glow) calc(var(--x) + 100%))`
        } as React.CSSProperties}
        className="absolute inset-0 z-10 block rounded-[inherit] p-px"
      ></span>
    </motion.button>
  );
};

// Preset FlexTime button variants
export const FlexTimePrimaryButton: React.FC<Omit<FlexTimeShinyButtonProps, 'variant'>> = (props) => (
  <FlexTimeShinyButton variant="primary" {...props} />
);

export const FlexTimeSecondaryButton: React.FC<Omit<FlexTimeShinyButtonProps, 'variant'>> = (props) => (
  <FlexTimeShinyButton variant="secondary" {...props} />
);

export const FlexTimeNeonButton: React.FC<Omit<FlexTimeShinyButtonProps, 'variant'>> = (props) => (
  <FlexTimeShinyButton variant="neon" {...props} />
);

export const FlexTimeGlassButton: React.FC<Omit<FlexTimeShinyButtonProps, 'variant'>> = (props) => (
  <FlexTimeShinyButton variant="glass" {...props} />
);

export default FlexTimeShinyButton;