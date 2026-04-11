"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Settings as SettingsIcon,
    Bell,
    Lock,
    Eye,
    Globe,
    CreditCard,
    ChevronRight,
    Moon,
    Fingerprint,
    Plus,
    Trash2,
    Loader2
} from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { api } from "@/lib/api"
import { toast } from "react-hot-toast"
import { startRegistration } from "@simplewebauthn/browser"

export default function SettingsPage() {
    const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false)
    const [passkeys, setPasskeys] = useState<any[]>([])
    const [loadingPasskeys, setLoadingPasskeys] = useState(false)
    const [registering, setRegistering] = useState(false)

    useEffect(() => {
        fetchPasskeys()
    }, [])

    const fetchPasskeys = async () => {
        setLoadingPasskeys(true)
        try {
            const res = await api.get("/auth/passkeys")
            setPasskeys(res.data)
        } catch (error) {
            console.error("Failed to fetch passkeys:", error)
        } finally {
            setLoadingPasskeys(false)
        }
    }

    const handleRegisterPasskey = async () => {
        setRegistering(true)
        try {
            // 1. Get registration options from backend
            const optionsRes = await api.get("/auth/passkeys/register/options")
            const options = optionsRes.data

            // 2. Trigger browser registration
            const attestationResponse = await startRegistration(options)

            // 3. Verify with backend
            const nickname = prompt("Give this passkey a name (e.g. MacBook Pro, iPhone):") || "Default Device"
            await api.post("/auth/passkeys/register/verify", {
                ...attestationResponse,
                name: nickname
            })

            toast.success("Passkey registered successfully!")
            fetchPasskeys()
        } catch (error: any) {
            console.error("Passkey registration failed:", error)
            toast.error(error.message || "Passkey registration failed")
        } finally {
            setRegistering(false)
        }
    }

    const handleDeletePasskey = async (id: number) => {
        if (!confirm("Are you sure you want to remove this passkey?")) return
        try {
            await api.delete(`/auth/passkeys/${id}`)
            toast.success("Passkey removed")
            fetchPasskeys()
        } catch (error) {
            toast.error("Failed to remove passkey")
        }
    }

    const sections = [
        {
            title: "Security & Privacy",
            icon: Lock,
            items: [
                { label: "Change Password", description: "Use at least 12 characters and special symbols", icon: Lock },
                { 
                    label: "Passkeys", 
                    description: "Use biometric login for maximum security", 
                    icon: Fingerprint,
                    onClick: () => setIsPasskeyModalOpen(true)
                },
                { label: "Data Sharing", description: "Control how your data is used for personalization", icon: Globe }
            ]
        },
        {
            title: "Notifications",
            icon: Bell,
            items: [
                { label: "Push Notifications", description: "Alerts for transactions and account updates", icon: Bell, toggle: true },
                { label: "Email Alerts", description: "Weekly summaries and security notices", icon: Globe, toggle: true }
            ]
        },
        {
            title: "Display & Preferences",
            icon: SettingsIcon,
            items: [
                { label: "Dark Mode", description: "System default is dark for premium experience", icon: Moon, toggle: true },
                { label: "Default Currency", description: "Select your primary currency", icon: CreditCard, value: "INR (₹)" }
            ]
        }
    ]

    return (
        <div className="max-w-3xl mx-auto space-y-8 relative">
            <header>
                <h1 className="text-4xl font-black font-outfit">Settings</h1>
                <p className="text-muted-foreground mt-1">Customize your banking experience and manage security.</p>
            </header>

            <div className="space-y-10">
                {sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-6"
                    >
                        <h2 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            {section.title}
                        </h2>

                        <GlassCard className="rounded-[32px] overflow-hidden">
                            <div className="divide-y divide-white/5">
                                {section.items.map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={item.onClick}
                                        className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mt-1 sm:mt-0">
                                                <item.icon size={22} className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-base sm:text-lg">{item.label}</p>
                                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 max-w-[200px] sm:max-w-none">{item.description}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 self-end sm:self-auto px-14 sm:px-0 mt-2 sm:mt-0">
                                            {"toggle" in item && (
                                                <div className="w-12 h-6 bg-primary rounded-full relative shadow-inner">
                                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                                                </div>
                                            )}
                                            {"value" in item && (
                                                <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                                                    {(item as any).value}
                                                </span>
                                            )}
                                            {(!("toggle" in item) && !("value" in item)) && <ChevronRight size={20} className="text-muted-foreground" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isPasskeyModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsPasskeyModalOpen(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/5 rounded-[40px] shadow-2xl overflow-hidden"
                        >
                            <div className="p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black font-outfit italic tracking-tight">Passkeys</h3>
                                        <p className="text-sm text-muted-foreground mt-1">Manage your biometric credentials.</p>
                                    </div>
                                    <button 
                                        onClick={handleRegisterPasskey}
                                        disabled={registering}
                                        className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-black disabled:opacity-50"
                                    >
                                        {registering ? <Loader2 className="animate-spin" size={20} /> : <Plus size={24} />}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {loadingPasskeys ? (
                                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>
                                    ) : passkeys.length > 0 ? (
                                        passkeys.map((pk) => (
                                            <div key={pk.id} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                                                        <Fingerprint size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{pk.name}</p>
                                                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                                                            {new Date(pk.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeletePasskey(pk.id)}
                                                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center border border-dashed border-white/10 rounded-3xl">
                                            <Fingerprint className="mx-auto text-muted-foreground mb-3 opacity-20" size={48} />
                                            <p className="text-sm text-muted-foreground">No passkeys registered yet.</p>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => setIsPasskeyModalOpen(false)}
                                    className="w-full py-4 text-sm font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-2xl transition-all"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="pt-10 flex flex-col items-center gap-4">
                <p className="text-xs text-muted-foreground">App Version 2.0.4 (Staging)</p>
                <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                </div>
            </div>
        </div>
    )
}

