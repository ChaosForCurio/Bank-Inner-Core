"use client"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Shield, Mail, Lock, Loader2, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { setCookie } from "cookies-next"
import toast from "react-hot-toast"
import { api, endpoints } from "@/lib/api"

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({ email: "", password: "" })
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { data } = await api.post(endpoints.auth.login, formData)
            setCookie("token", data.token, { maxAge: 60 * 60 * 24 * 7 }) // 1 week
            toast.success("Welcome back!")
            router.push("/dashboard")
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />

            <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-muted-foreground hover:text-white transition-colors group">
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                Back to Home
            </Link>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative"
            >
                <div className="glass-card rounded-[40px] p-10 border border-white/10">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                            <Shield className="text-primary-foreground" size={32} />
                        </div>
                        <h1 className="text-3xl font-black font-outfit text-white">Nova Bank</h1>
                        <p className="text-muted-foreground mt-2">Sign in to manage your digital assets</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-muted-foreground ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    required
                                    type="email"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-bold text-muted-foreground">Password</label>
                                <Link href="#" className="text-xs text-primary hover:underline">Forgot Password?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                                <input
                                    required
                                    type="password"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="animate-spin" size={24} /> : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-muted-foreground">
                        Don&apos;t have an account?{" "}
                        <Link href="/register" className="text-primary font-bold hover:underline">Create Account</Link>
                    </p>
                </div>
            </motion.div>
        </div>
    )
}
