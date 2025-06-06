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
      base: "ft-btn-primary shadow-lg hover:shadow-accent/25 dark:hover:shadow-[color:var(--ft-neon)]/25",
      shine: "hsl(var(--accent))" 
    },
    secondary: {
      base: "ft-btn-secondary",
      shine: "hsl(var(--accent))" 
    },
    neon: {
      base: "bg-transparent border border-accent/30 dark:border-[color:var(--ft-neon)] text-accent dark:text-[color:var(--ft-neon)] hover:bg-accent/10 dark:hover:bg-[color:var(--ft-neon)]/10 shadow-[0_0_20px_hsla(var(--accent),0.2)] dark:shadow-[0_0_20px_rgba(0,191,255,0.2)] hover:shadow-[0_0_25px_hsla(var(--accent),0.4)] dark:hover:shadow-[0_0_25px_rgba(0,191,255,0.4)] backdrop-blur-sm rounded-lg transition-all duration-200",
      shine: "hsl(var(--accent))" 
    },
    glass: {
      base: "bg-white/10 text-foreground border border-white/20 dark:border-[color:var(--ft-glass-border)] hover:border-accent/30 dark:hover:border-[color:var(--ft-neon)]/50 backdrop-blur-xl shadow-sm hover:shadow-lg hover:bg-white/20 transition-all duration-300 rounded-lg",
      shine: "hsl(var(--accent))" 
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <motion.button
      // Cast animationProps to any to avoid type conflicts with framer-motion
      {...(animationProps as any)}
      {...props}
      className={cn(
        "relative font-medium transition-all duration-300 ease-in-out uppercase tracking-wide",
        currentVariant.base,
        className
      )}
      style={{
        fontFamily: 'var(--ft-font-secondary)',
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