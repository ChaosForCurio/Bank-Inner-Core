"use client"
import { useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, Mail, ArrowLeft, Fingerprint, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"
import { startAuthentication } from "@simplewebauthn/browser"
import { api, endpoints } from "@/lib/api"

type Step = "email" | "passkey" | "success"

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>("email")
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [authOptions, setAuthOptions] = useState<any>(null)
    const router = useRouter()

    // Step 1: Submit email → fetch passkey authentication challenge
    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await api.post(endpoints.auth.forgotPassword.options, { email })
            setAuthOptions(res.data)
            setStep("passkey")
        } catch (error: any) {
            const msg = error?.message || error?.response?.data?.message || "No account with registered passkeys found."
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }

    // Step 2: Trigger Windows Hello authentication
    const handlePasskeyAuth = async () => {
        setLoading(true)
        try {
            // Launch the browser's native Windows Hello prompt
            const authResponse = await startAuthentication({ optionsJSON: authOptions })

            // Send auth response + email to backend for verification
            const verifyRes = await api.post(endpoints.auth.forgotPassword.verify, {
                ...authResponse,
                email,
            })

            const { resetToken } = verifyRes.data

            toast.success("Identity verified! Set your new password.")

            // Pass the reset token via sessionStorage (avoids URL exposure)
            sessionStorage.setItem("reset_token", resetToken)
            router.push("/reset-password")
        } catch (error: any) {
            if (error?.name === "NotAllowedError") {
                toast.error("Passkey authentication was cancelled.")
            } else {
                const msg = error?.message || "Passkey verification failed. Please try again."
                toast.error(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative Orbs */}
            <div className="absolute top-[15%] left-[-15%] w-[60%] h-[60%] bg-primary/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute bottom-[10%] right-[-15%] w-[60%] h-[60%] bg-blue-500/8 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[30%] h-[30%] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

            <Link
                href="/login"
                className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group"
            >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md relative"
            >
                <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[40px] p-10 shadow-2xl shadow-black/40">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-10">
                        <motion.div
                            key={step}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${
                                step === "email"
                                    ? "bg-primary shadow-primary/20"
                                    : step === "passkey"
                                    ? "bg-indigo-500 shadow-indigo-500/20"
                                    : "bg-emerald-500 shadow-emerald-500/20"
                            }`}
                        >
                            {step === "email" && <Shield className="text-black" size={30} />}
                            {step === "passkey" && <Fingerprint className="text-white" size={30} />}
                            {step === "success" && <CheckCircle2 className="text-white" size={30} />}
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                className="text-center"
                            >
                                {step === "email" && (
                                    <>
                                        <h1 className="text-3xl font-black font-outfit text-white">Forgot Password?</h1>
                                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                            Enter your email and verify your identity<br />using your registered passkey.
                                        </p>
                                    </>
                                )}
                                {step === "passkey" && (
                                    <>
                                        <h1 className="text-3xl font-black font-outfit text-white">Verify Identity</h1>
                                        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                                            Use Windows Hello to confirm it&apos;s you.<br />
                                            <span className="text-primary font-bold">{email}</span>
                                        </p>
                                    </>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Steps progress pill */}
                    <div className="flex gap-2 mb-8">
                        {(["email", "passkey"] as Step[]).map((s, i) => (
                            <div
                                key={s}
                                className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                                    step === s || (step === "success")
                                        ? "bg-primary"
                                        : step === "passkey" && s === "email"
                                        ? "bg-primary"
                                        : "bg-white/10"
                                }`}
                            />
                        ))}
                    </div>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        {step === "email" && (
                            <motion.form
                                key="email-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleEmailSubmit}
                                className="space-y-6"
                            >
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-muted-foreground ml-1">
                                        Account Email
                                    </label>
                                    <div className="relative group">
                                        <Mail
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                                            size={20}
                                        />
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-white placeholder:text-muted-foreground"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3">
                                    <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-200/80 leading-relaxed">
                                        This recovery method requires a <strong>registered passkey</strong> on your account. 
                                        If you haven&apos;t registered one, please contact support.
                                    </p>
                                </div>

                                <button
                                    disabled={loading || !email}
                                    type="submit"
                                    className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={22} /> : "Continue"}
                                </button>
                            </motion.form>
                        )}

                        {step === "passkey" && (
                            <motion.div
                                key="passkey-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                {/* Windows Hello animation */}
                                <div className="flex flex-col items-center py-6">
                                    <motion.div
                                        animate={loading ? { scale: [1, 1.08, 1] } : {}}
                                        transition={{ repeat: Infinity, duration: 1.4 }}
                                        className="relative"
                                    >
                                        <div className="w-28 h-28 rounded-full bg-indigo-500/10 border-2 border-indigo-500/30 flex items-center justify-center">
                                            <div className="w-20 h-20 rounded-full bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                                                <Fingerprint size={44} className={`${loading ? "text-indigo-400 animate-pulse" : "text-indigo-400"}`} />
                                            </div>
                                        </div>
                                        {/* Ripple rings */}
                                        {loading && (
                                            <>
                                                <motion.div
                                                    animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}
                                                    className="absolute inset-0 rounded-full border border-indigo-500/40"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
                                                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.5 }}
                                                    className="absolute inset-0 rounded-full border border-indigo-500/40"
                                                />
                                            </>
                                        )}
                                    </motion.div>
                                    <p className="text-sm text-muted-foreground mt-5 text-center leading-relaxed">
                                        {loading
                                            ? "Waiting for Windows Hello confirmation..."
                                            : "Tap the button below to launch Windows Hello."}
                                    </p>
                                </div>

                                <button
                                    onClick={handlePasskeyAuth}
                                    disabled={loading}
                                    className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin" size={22} />
                                    ) : (
                                        <>
                                            <Fingerprint size={22} />
                                            Authenticate with Windows Hello
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => setStep("email")}
                                    disabled={loading}
                                    className="w-full py-3 text-sm text-muted-foreground hover:text-white transition-colors font-bold"
                                >
                                    ← Use a different email
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
