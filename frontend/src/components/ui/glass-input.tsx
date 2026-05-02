'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-xs font-medium text-white/50 uppercase tracking-wider ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-[#10b981] transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#10b981]/50 focus:bg-white/10 transition-all',
              icon && 'pl-11',
              error && 'border-red-500/50 focus:border-red-500',
              className
            )}
            {...props}
          />
          <div className="absolute inset-x-4 bottom-0 h-px bg-gradient-to-r from-transparent via-[#10b981]/0 to-transparent group-focus-within:via-[#10b981]/50 transition-all duration-500" />
        </div>
        {error && <p className="text-[10px] text-red-500 ml-1">{error}</p>}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
