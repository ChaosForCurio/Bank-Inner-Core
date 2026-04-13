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
            const attestationResponse = await startRegistration({ optionsJSON: options })

            // 3. Verify with backend
            const nickname = prompt("Give this passkey a name (e.g. MacBook Pro, iPhone):") || "Default Device"
            await api.post("/auth/passkeys/register/verify", {
                ...attestationResponse,
                name: nickname
            })

            toast.success("Passkey registered successfully!")
            fetchPasskeys()
        } catch (error: any) {
            const errLog = error.response?.data || error.message || error;
            console.error("Passkey registration failed:", errLog)
            toast.error(error.response?.data?.message || error.message || "Passkey registration failed")
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
                    label: "Windows Hello Passkeys", 
                    description: "Use Windows Hello for maximum security", 
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
            <header className="relative">
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
                <h1 className="text-5xl font-black font-outfit tracking-tighter">Settings</h1>
                <p className="text-white/40 mt-2 font-medium">Customize your core banking parameters and identity credentials.</p>
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
                                            onClick={() => (item as any).onClick?.()}
                                            className="p-5 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:bg-white/[0.03] transition-all cursor-pointer group relative"
                                        >
                                            <div className="flex items-start sm:items-center gap-5 sm:gap-6">
                                                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                    <item.icon size={24} className="w-6 h-6 sm:w-7 sm:h-7" />
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
                        />                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-lg bg-[#0A0A0A]/90 backdrop-blur-2xl border border-white/10 rounded-[48px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                            
                            <div className="p-10 space-y-10">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-3xl font-black font-outfit italic tracking-tighter text-white">Windows Hello</h3>
                                        <p className="text-sm text-white/40 font-medium">Biometric Access Management</p>
                                    </div>
                                    <button 
                                        onClick={handleRegisterPasskey}
                                        disabled={registering}
                                        className="w-14 h-14 bg-white text-black hover:bg-primary hover:text-white rounded-[24px] flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
                                    >
                                        {registering ? <Loader2 className="animate-spin" size={24} /> : <Plus size={28} />}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {loadingPasskeys ? (
                                        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                                    ) : passkeys.length > 0 ? (
                                        passkeys.map((pk) => (
                                            <motion.div 
                                                layout
                                                key={pk.id} 
                                                className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl flex items-center justify-between group/item hover:bg-white/[0.06] hover:border-white/10 transition-all"
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                                        <Fingerprint size={24} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-lg">{pk.name}</p>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mt-1">
                                                            Registered {new Date(pk.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeletePasskey(pk.id)}
                                                    className="p-3 text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[40px] bg-white/[0.01]">
                                            <div className="w-20 h-20 bg-white/5 rounded-[32px] flex items-center justify-center mx-auto mb-6 opacity-20">
                                                <Fingerprint size={40} />
                                            </div>
                                            <p className="text-white/40 font-medium px-10">No Windows Hello credentials registered with this account.</p>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={() => setIsPasskeyModalOpen(false)}
                                    className="w-full py-5 text-xs font-black uppercase tracking-[0.3em] bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-[24px] transition-all border border-white/5"
                                >
                                    Dismiss
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

