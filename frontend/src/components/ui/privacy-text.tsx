"use client"
import React from 'react'
import { usePrivacy } from '@/context/privacy-context'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PrivacyTextProps {
    children: React.ReactNode
    className?: string
    mask?: string
}

export function PrivacyText({ children, className, mask = "••••" }: PrivacyTextProps) {
    const { isPrivate } = usePrivacy()

    return (
        <span className={cn("relative inline-block", className)}>
            <AnimatePresence mode="wait">
                {isPrivate ? (
                    <motion.span
                        key="masked"
                        initial={{ opacity: 0, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, filter: 'blur(4px)' }}
                        className="font-mono tracking-widest opacity-60"
                    >
                        {mask}
                    </motion.span>
                ) : (
                    <motion.span
                        key="visible"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {children}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    )
}
