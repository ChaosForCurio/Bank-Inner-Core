'use client';

import React, { useState, useCallback } from 'react';
import { motion, HTMLMotionProps, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  hoverEffect?: boolean;
  glow?: boolean;
  spotlight?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, hoverEffect = true, glow = false, spotlight = true, ...props }, ref) => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = useCallback(
      ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
        const { left, top } = currentTarget.getBoundingClientRect();
        mouseX.set(clientX - left);
        mouseY.set(clientY - top);
      },
      [mouseX, mouseY]
    );

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={hoverEffect ? { y: -4, borderColor: 'rgba(255,255,255,0.2)' } : {}}
        onMouseMove={handleMouseMove}
        className={cn(
          'relative p-6 bg-[#161616]/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-colors duration-300 group',
          glow && 'shadow-[0_0_40px_rgba(255,255,255,0.02)]',
          className
        )}
        {...props}
      >
        {/* Spotlight Effect */}
        {spotlight && (
          <motion.div
            className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300 group-hover:opacity-100"
            style={{
              background: useTransform(
                [mouseX, mouseY],
                ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.06), transparent 40%)`
              ),
            }}
          />
        )}

        {/* Subtle interior glow */}
        {glow && (
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        )}
        
        <div className="relative z-10">
          {children as any}
        </div>
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
