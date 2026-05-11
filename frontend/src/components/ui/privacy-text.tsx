"use client"
import React from 'react'
import { usePrivacy } from '@/context/privacy-context'
import { cn } from '@/lib/utils'

interface PrivacyTextProps {
    children: React.ReactNode
    className?: string
    mask?: string
}

export function PrivacyText({ children, className, mask = "••••" }: PrivacyTextProps) {
    const { isPrivate } = usePrivacy()

    return (
        <span className={cn("relative inline transition-all duration-300", className)}>
            <span 
                className={cn(
                    "transition-all duration-300",
                    isPrivate ? "opacity-0 blur-sm select-none absolute pointer-events-none" : "opacity-100 blur-0"
                )}
                aria-hidden={isPrivate}
            >
                {children}
            </span>
            <span 
                className={cn(
                    "font-mono tracking-widest opacity-60 transition-all duration-300",
                    isPrivate ? "opacity-60 blur-0" : "opacity-0 blur-sm select-none absolute pointer-events-none"
                )}
                aria-hidden={!isPrivate}
            >
                {mask}
            </span>
        </span>
    )
}
