'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming cn exists or I'll use a simple one

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const variants = {
      primary: 'bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]',
      secondary: 'bg-[#1a1a1a] text-white border border-white/10 hover:bg-[#222] hover:border-white/20',
      outline: 'bg-transparent text-white border border-white/20 hover:bg-white/5 hover:border-white/40',
      ghost: 'bg-transparent text-white/70 hover:text-white hover:bg-white/5',
      danger: 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20'
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm',
      md: 'h-11 px-6 text-base',
      lg: 'h-14 px-8 text-lg font-semibold'
    };

    return (
      <motion.button
        ref={ref}
        whileHover={!disabled && !isLoading ? { scale: 1.01 } : {}}
        whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
        disabled={disabled || isLoading}
        className={cn(
          'relative inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden',
          variants[variant],
          sizes[size],
          className
        )}
        {...(props as any)}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}
        
        <div className={cn('flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon}
          {children}
          {rightIcon}
        </div>
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
