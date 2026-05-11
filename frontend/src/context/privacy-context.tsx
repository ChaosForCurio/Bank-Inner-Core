"use client"
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface PrivacyContextType {
    isPrivate: boolean
    togglePrivacy: () => void
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined)

export function PrivacyProvider({ children }: { children: React.ReactNode }) {
    const [isPrivate, setIsPrivate] = useState(false)

    useEffect(() => {
        const stored = localStorage.getItem('xieriee_privacy_mode')
        if (stored === 'true') setIsPrivate(true)
    }, [])

    const togglePrivacy = useCallback(() => {
        const newValue = !isPrivate
        setIsPrivate(newValue)
        localStorage.setItem('xieriee_privacy_mode', String(newValue))

        // Show a browser-level notification if permission was granted.
        // This is purely client-side — no API call needed since privacy mode
        // is local state and the backend has no POST /notifications endpoint.
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            try {
                new Notification(
                    newValue ? '🔒 Privacy Shield Active' : '🔓 Privacy Shield Deactivated',
                    {
                        body: newValue
                            ? 'Sensitive information is now hidden from the dashboard.'
                            : 'Information visibility has been restored.',
                        icon: '/favicon.ico',
                        tag: 'privacy-toggle', // Replaces any previous notification with the same tag
                    }
                )
            } catch {
                // Notification API not supported or blocked — silently ignore
            }
        }
    }, [isPrivate])

    return (
        <PrivacyContext.Provider value={{ isPrivate, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    )
}

export function usePrivacy() {
    const context = useContext(PrivacyContext)
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider')
    }
    return context
}
