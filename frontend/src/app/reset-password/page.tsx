"use client"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, Check, X } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { api, endpoints } from "@/lib/api"

// Simple password strength rules
const RULES = [
    { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
    { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
    { label: "One number", test: (p: string) => /[0-9]/.test(p) },
    { label: "One special character", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

const getStrengthLevel = (password: string) => {
    const passed = RULES.filter(r => r.test(password)).length
    if (passed <= 1) return { level: 0, label: "Too Weak", color: "#ef4444" }
    if (passed === 2) return { level: 1, label: "Weak", color: "#f97316" }
    if (passed === 3) return { level: 2, label: "Good", color: "#eab308" }
    return { level: 3, label: "Strong", color: "#22c55e" }
}

export default function ResetPasswordPage() {
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)
    const [done, setDone] = useState(false)
    const [resetToken, setResetToken] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const token = sessionStorage.getItem("reset_token")
        if (!token) {
            toast.error("Invalid or missing reset session. Please start again.")
            router.replace("/forgot-password")
        } else {
            setResetToken(token)
        }
    }, [router])

    const strength = getStrengthLevel(newPassword)
    const allRulesPassed = RULES.every(r => r.test(newPassword))
    const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!allRulesPassed) {
            toast.error("Please meet all password requirements.")
            return
        }
        if (!passwordsMatch) {
            toast.error("Passwords do not match.")
            return
        }
        if (!resetToken) {
            toast.error("Reset session expired. Please start again.")
            router.replace("/forgot-password")
            return
        }

        setLoading(true)
        try {
            await api.post(endpoints.auth.resetPassword, { resetToken, newPassword })
            sessionStorage.removeItem("reset_token")
            setDone(true)
            toast.success("Password reset successfully!")
            setTimeout(() => router.push("/login"), 2500)
        } catch (error: any) {
            const msg = error?.message || "Failed to reset password. Please try again."
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    if (done) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-[15%] left-[-15%] w-[60%] h-[60%] bg-emerald-500/8 rounded-full blur-[140px] pointer-events-none" />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                        className="w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30"
                    >
                        <CheckCircle2 size={52} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-black font-outfit text-white">All Done!</h1>
                    <p className="text-muted-foreground mt-2">Your password has been reset successfully.</p>
                    <p className="text-muted-foreground text-sm mt-1">Redirecting you to login…</p>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute top-[15%] left-[-15%] w-[60%] h-[60%] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-15%] w-[60%] h-[60%] bg-blue-500/8 rounded-full blur-[140px] pointer-events-none" />

            <Link
                href="/forgot-password"
                className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md"
            >
                <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[40px] p-10 shadow-2xl shadow-black/40">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                            <Lock className="text-black" size={30} />
                        </div>
                        <h1 className="text-3xl font-black font-outfit text-white">Set New Password</h1>
                        <p className="text-muted-foreground mt-2 text-sm text-center leading-relaxed">
                            Choose a strong, unique password for your account.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground ml-1">New Password</label>
                            <div className="relative group">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                                    size={20}
                                />
                                <input
                                    required
                                    type={showPassword ? "text" : "password"}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-white placeholder:text-muted-foreground"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {/* Strength meter */}
                            {newPassword.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-3 mt-3"
                                >
                                    <div className="flex gap-1.5">
                                        {[0, 1, 2, 3].map(i => (
                                            <div
                                                key={i}
                                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                                style={{
                                                    backgroundColor: i <= strength.level ? strength.color : "rgba(255,255,255,0.08)"
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-xs font-bold" style={{ color: strength.color }}>
                                        {strength.label}
                                    </p>
                                    <ul className="space-y-1.5">
                                        {RULES.map(rule => {
                                            const passed = rule.test(newPassword)
                                            return (
                                                <li key={rule.label} className="flex items-center gap-2">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${passed ? "bg-emerald-500" : "bg-white/10"}`}>
                                                        {passed ? <Check size={10} className="text-white" /> : <X size={10} className="text-muted-foreground" />}
                                                    </div>
                                                    <span className={`text-xs transition-colors ${passed ? "text-emerald-400" : "text-muted-foreground"}`}>
                                                        {rule.label}
                                                    </span>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                </motion.div>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground ml-1">Confirm Password</label>
                            <div className="relative group">
                                <Shield
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                                    size={20}
                                />
                                <input
                                    required
                                    type={showConfirm ? "text" : "password"}
                                    className={`w-full bg-white/5 border rounded-2xl py-4 pl-12 pr-12 outline-none transition-all text-white placeholder:text-muted-foreground ${
                                        confirmPassword.length > 0
                                            ? passwordsMatch
                                                ? "border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
                                                : "border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                                            : "border-white/10 focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    }`}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {confirmPassword.length > 0 && !passwordsMatch && (
                                <p className="text-xs text-red-400 ml-1">Passwords do not match</p>
                            )}
                            {confirmPassword.length > 0 && passwordsMatch && (
                                <p className="text-xs text-emerald-400 ml-1 flex items-center gap-1">
                                    <Check size={12} /> Passwords match
                                </p>
                            )}
                        </div>

                        <button
                            disabled={loading || !allRulesPassed || !passwordsMatch || !resetToken}
                            type="submit"
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={22} /> : "Reset Password"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
