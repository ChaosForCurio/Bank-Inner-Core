"use client"
import React, { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { Shield, KeyRound, Loader2, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { setCookie } from "cookies-next"
import toast from "react-hot-toast"
import { api, endpoints } from "@/lib/api"
import Link from "next/link"

export default function VerifyOTPPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
            <VerifyOTPForm />
        </Suspense>
    )
}

function VerifyOTPForm() {
    const [loading, setLoading] = useState(false)
    const [otp, setOtp] = useState("")
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get("email")

    useEffect(() => {
        if (!email) {
            router.push("/login")
        }
    }, [email, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }

        setLoading(true)
        try {
            const { data } = await api.post(endpoints.auth.verifyOtp, { email, otp })
            
            // Persist token for 7 days
            setCookie("token", data.accessToken, { maxAge: 60 * 60 * 24 * 7 })
            toast.success("Identity verified! Welcome back.")
            router.push("/dashboard")
        } catch (error: any) {
            const message = error.response?.data?.message || "Verification failed"
            toast.error(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px]" />

            <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative"
            >
                <div className="glass-card rounded-[40px] p-10 border border-white/10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/20">
                            <KeyRound className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black font-outfit text-white text-center">Verify Identity</h1>
                        <p className="text-muted-foreground mt-2 text-center">We've sent a 6-digit code to your registered mobile number.</p>
                        <p className="text-xs text-primary/60 mt-2 font-mono">{email}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <input
                                    required
                                    type="text"
                                    maxLength={6}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-outfit"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                    autoFocus
                                />
                            </div>
                            <p className="text-center text-xs text-muted-foreground">
                                Entering the code verifies your session and protects your account.
                            </p>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : "Verify & Continue"}
                        </button>

                        <div className="text-center">
                            <button 
                                type="button"
                                className="text-sm font-bold text-muted-foreground hover:text-white transition-colors"
                                onClick={() => toast.success("Code resent!")}
                            >
                                Didn't receive a code? Resend
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    )
}
