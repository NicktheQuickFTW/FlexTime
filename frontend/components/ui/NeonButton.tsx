import React from 'react'
import { cn } from '@/lib/utils'
import { VariantProps, cva } from "class-variance-authority";

const buttonVariants = cva(
    "relative group border text-foreground mx-auto text-center rounded-full transition-all duration-200 cursor-pointer font-medium",
    {
        variants: {
            variant: {
                default: "bg-blue-500/5 hover:bg-blue-500/0 border-blue-500/20 text-white",
                solid: "bg-blue-500 hover:bg-blue-600 text-white border-transparent hover:border-white/50",
                ghost: "border-transparent bg-transparent hover:border-zinc-600 hover:bg-white/10 text-white",
                neon: "bg-black/50 hover:bg-black/30 border-cyan-500/30 hover:border-cyan-500/60 text-white backdrop-blur-md",
                metallic: "bg-zinc-800/50 hover:bg-zinc-700/50 border-zinc-600/30 hover:border-zinc-400/50 text-white backdrop-blur-md",
                flextime: "bg-black/60 hover:bg-black/40 border-cyan-400/40 hover:border-cyan-400/70 text-white backdrop-blur-lg",
            },
            size: {
                default: "px-7 py-1.5 text-sm",
                sm: "px-4 py-0.5 text-xs",
                lg: "px-10 py-2.5 text-base",
                xl: "px-12 py-3 text-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface NeonButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { 
    neon?: boolean;
    glowColor?: 'blue' | 'cyan' | 'white' | 'green' | 'red' | 'yellow' | 'purple';
    intensity?: 'low' | 'medium' | 'high';
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ 
        className, 
        neon = true, 
        glowColor = 'cyan', 
        intensity = 'medium',
        size, 
        variant, 
        children, 
        ...props 
    }, ref) => {
        
        const getGlowClasses = (color: string) => {
            switch (color) {
                case 'cyan':
                    return {
                        top: 'from-transparent via-cyan-400 to-transparent dark:via-cyan-500',
                        bottom: 'from-transparent via-cyan-400 to-transparent dark:via-cyan-500',
                        glow: 'shadow-cyan-500/50'
                    };
                case 'white':
                    return {
                        top: 'from-transparent via-white to-transparent',
                        bottom: 'from-transparent via-white to-transparent',
                        glow: 'shadow-white/50'
                    };
                case 'green':
                    return {
                        top: 'from-transparent via-green-400 to-transparent dark:via-green-500',
                        bottom: 'from-transparent via-green-400 to-transparent dark:via-green-500',
                        glow: 'shadow-green-500/50'
                    };
                case 'red':
                    return {
                        top: 'from-transparent via-red-400 to-transparent dark:via-red-500',
                        bottom: 'from-transparent via-red-400 to-transparent dark:via-red-500',
                        glow: 'shadow-red-500/50'
                    };
                case 'yellow':
                    return {
                        top: 'from-transparent via-yellow-400 to-transparent dark:via-yellow-500',
                        bottom: 'from-transparent via-yellow-400 to-transparent dark:via-yellow-500',
                        glow: 'shadow-yellow-500/50'
                    };
                case 'purple':
                    return {
                        top: 'from-transparent via-purple-400 to-transparent dark:via-purple-500',
                        bottom: 'from-transparent via-purple-400 to-transparent dark:via-purple-500',
                        glow: 'shadow-purple-500/50'
                    };
                default: // blue
                    return {
                        top: 'from-transparent via-blue-600 to-transparent dark:via-blue-500',
                        bottom: 'from-transparent via-blue-600 to-transparent dark:via-blue-500',
                        glow: 'shadow-blue-500/50'
                    };
            }
        };

        const getIntensityClasses = (level: string) => {
            switch (level) {
                case 'low':
                    return {
                        topOpacity: 'group-hover:opacity-50',
                        bottomOpacity: 'group-hover:opacity-20',
                        glowOpacity: 'group-hover:opacity-10'
                    };
                case 'high':
                    return {
                        topOpacity: 'group-hover:opacity-100',
                        bottomOpacity: 'group-hover:opacity-60',
                        glowOpacity: 'group-hover:opacity-40'
                    };
                default: // medium
                    return {
                        topOpacity: 'group-hover:opacity-80',
                        bottomOpacity: 'group-hover:opacity-30',
                        glowOpacity: 'group-hover:opacity-20'
                    };
            }
        };

        const glowClasses = getGlowClasses(glowColor);
        const intensityClasses = getIntensityClasses(intensity);

        return (
            <button
                className={cn(buttonVariants({ variant, size }), className)}
                ref={ref}
                {...props}
            >
                {/* Top Glow Line */}
                <span 
                    className={cn(
                        "absolute h-px opacity-0 transition-all duration-500 ease-in-out inset-x-0 inset-y-0 bg-gradient-to-r w-3/4 mx-auto",
                        glowClasses.top,
                        intensityClasses.topOpacity,
                        "hidden",
                        neon && "block"
                    )} 
                />
                
                {/* Button Content */}
                <span className="relative z-10 font-medium tracking-wide">
                    {children}
                </span>
                
                {/* Bottom Glow Line */}
                <span 
                    className={cn(
                        "absolute transition-all duration-500 ease-in-out inset-x-0 h-px -bottom-px bg-gradient-to-r w-3/4 mx-auto opacity-0",
                        glowClasses.bottom,
                        intensityClasses.bottomOpacity,
                        "hidden",
                        neon && "block"
                    )} 
                />
                
                {/* Outer Glow Effect */}
                <span 
                    className={cn(
                        "absolute inset-0 rounded-full opacity-0 transition-all duration-300 blur-sm -z-10",
                        glowClasses.glow,
                        intensityClasses.glowOpacity,
                        "hidden",
                        neon && variant !== 'ghost' && "block"
                    )}
                />

                {/* Additional FlexTime Style Glow */}
                {variant === 'flextime' && neon && (
                    <span 
                        className={cn(
                            "absolute inset-0 rounded-full opacity-0 group-hover:opacity-30 transition-all duration-500 blur-md -z-20",
                            "bg-gradient-to-r from-cyan-500/20 via-cyan-400/30 to-cyan-500/20"
                        )}
                    />
                )}
            </button>
        );
    }
)

NeonButton.displayName = 'NeonButton';

export { NeonButton, buttonVariants };