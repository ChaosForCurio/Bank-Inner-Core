"use client"
import React, { createContext, useContext, useState, useEffect } from 'react'

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

    const togglePrivacy = () => {
        const newValue = !isPrivate
        setIsPrivate(newValue)
        localStorage.setItem('xieriee_privacy_mode', String(newValue))
    }

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
