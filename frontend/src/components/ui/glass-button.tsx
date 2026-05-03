'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = true, children, ...props }, ref) => {
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-8 py-4 text-base font-semibold',
    };

    const variantClasses = {
      primary: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
      secondary: 'bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] border-[#10b981]/20',
      outline: 'bg-transparent border-white/10 hover:border-white/30 text-white',
      ghost: 'bg-transparent border-transparent hover:bg-white/5 text-white',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ y: -2, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'relative backdrop-blur-lg border rounded-xl transition-all duration-200 overflow-hidden group',
          sizeClasses[size],
          variantClasses[variant],
          glow && 'hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
          className
        )}
        {...props}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer" />
        
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children as React.ReactNode}
        </span>
      </motion.button>
    );
  }
);

GlassButton.displayName = 'GlassButton';
