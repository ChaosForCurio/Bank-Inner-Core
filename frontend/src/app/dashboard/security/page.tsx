"use client"
import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Smartphone, Fingerprint, Key, ChevronRight, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"

export default function SecurityPage() {
    const [loading, setLoading] = useState(false)
    const [mfaData, setMfaData] = useState({
        enabled: false,
        phoneNumber: ""
    })
    const [showPhoneInput, setShowPhoneInput] = useState(false)
    const [phone, setPhone] = useState("")

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data } = await api.get(endpoints.auth.me)
                setMfaData({
                    enabled: data.mfa_enabled,
                    phoneNumber: data.phone_number || ""
                })
                setPhone(data.phone_number || "")
            } catch (error) {
                console.error("Failed to fetch user data")
            }
        }
        fetchUserData()
    }, [])

    const handleToggleMfa = async () => {
        if (!mfaData.phoneNumber && !showPhoneInput) {
            setShowPhoneInput(true)
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post(endpoints.auth.enableMfa, {
                phoneNumber: phone,
                enabled: !mfaData.enabled
            })
            setMfaData({
                enabled: !mfaData.enabled,
                phoneNumber: phone
            })
            toast.success(mfaData.enabled ? "MFA Disabled" : "MFA Enabled successfully!")
            setShowPhoneInput(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Operation failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <header>
                <h1 className="text-4xl font-black font-outfit tracking-tight">Security Fortress</h1>
                <p className="text-white/50 mt-2 font-medium">Manage your account security and multi-factor authentication.</p>
            </header>

            <div className="grid grid-cols-1 gap-6">
                {/* SMS MFA Card */}
                <GlassCard className="p-8 border-white/5 bg-white/[0.03]">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Smartphone className="text-primary" size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">SMS Multi-Factor Authentication</h3>
                                <p className="text-sm text-white/50 mt-1 max-w-md">
                                    Protect your account by requiring a 6-digit code sent to your phone whenever you log in.
                                </p>
                                {mfaData.enabled ? (
                                    <div className="flex items-center gap-2 mt-4 text-emerald-400 text-sm font-bold">
                                        <CheckCircle2 size={16} />
                                        Active on {mfaData.phoneNumber}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-4 text-orange-400 text-sm font-bold">
                                        <AlertTriangle size={16} />
                                        Not enabled
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            {showPhoneInput ? (
                                <div className="space-y-3">
                                    <input 
                                        type="tel"
                                        placeholder="+91 XXXXX XXXXX"
                                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none focus:border-primary transition-all w-full md:w-48"
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                    />
                                    <div className="flex gap-2">
                                        <Button onClick={handleToggleMfa} disabled={loading} size="sm" className="flex-1">
                                            {loading ? <Loader2 className="animate-spin" size={16} /> : "Save & Enable"}
                                        </Button>
                                        <Button onClick={() => setShowPhoneInput(false)} variant="ghost" size="sm">Cancel</Button>
                                    </div>
                                </div>
                            ) : (
                                <Button 
                                    variant={mfaData.enabled ? "outline" : "primary"}
                                    onClick={handleToggleMfa}
                                    disabled={loading}
                                >
                                    {mfaData.enabled ? "Disable MFA" : "Enable MFA"}
                                </Button>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Biometric Passkeys (Placeholder/Existing feature) */}
                <GlassCard className="p-8 border-white/5 bg-white/[0.03] opacity-60">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                <Fingerprint className="text-blue-400" size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Biometric Passkeys</h3>
                                <p className="text-sm text-white/50 mt-1 max-w-md">
                                    Log in securely using FaceID, TouchID, or Windows Hello.
                                </p>
                            </div>
                        </div>
                        <Button variant="outline" disabled>Configure Passkeys</Button>
                    </div>
                </GlassCard>

                {/* Login Activity (Placeholder) */}
                <GlassCard className="p-8 border-white/5 bg-white/[0.03]">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                <Shield className="text-purple-400" size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white">Recent Security Activity</h3>
                                <p className="text-sm text-white/50 mt-1 max-w-md">
                                    Monitor your account for unrecognized logins and security changes.
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost">View All Logs <ChevronRight size={16} /></Button>
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}
