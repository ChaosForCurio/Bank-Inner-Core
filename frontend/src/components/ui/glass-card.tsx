'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hoverEffect?: boolean;
  glow?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, hoverEffect = true, glow = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hoverEffect ? { y: -4, borderColor: 'rgba(255,255,255,0.2)' } : {}}
        className={cn(
          'relative p-6 bg-[#161616]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-colors duration-300',
          glow && 'shadow-[0_0_40px_rgba(255,255,255,0.02)]',
          className
        )}
        {...props}
      >
        {/* Subtle interior glow */}
        {glow && (
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        )}
        
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
