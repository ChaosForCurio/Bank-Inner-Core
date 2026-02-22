"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { User, Mail, Shield, Smartphone, MapPin, Edit3, Loader2 } from "lucide-react"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"

export default function ProfilePage({ user: initialUser }: { user?: any }) {
    const [user, setUser] = useState<any>(initialUser)
    const [loading, setLoading] = useState(!initialUser)

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser)
            setLoading(false)
        } else {
            const fetchUser = async () => {
                try {
                    const response = await api.get(endpoints.auth.me)
                    setUser(response.data)
                } catch (error) {
                    toast.error("Failed to load profile")
                } finally {
                    setLoading(false)
                }
            }
            fetchUser()
        }
    }, [initialUser])

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 size={40} className="text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-10">
            <header className="flex items-end justify-between">
                <div className="flex items-center gap-8">
                    <div className="w-32 h-32 rounded-[40px] bg-gradient-to-tr from-primary to-emerald-400 shadow-2xl shadow-primary/20 flex items-center justify-center text-5xl font-black text-white">
                        {user?.name?.[0]}
                    </div>
                    <div>
                        <h1 className="text-5xl font-black font-outfit">{user?.name}</h1>
                        <p className="text-muted-foreground text-lg flex items-center gap-2 mt-2">
                            <Mail size={18} />
                            {user?.email}
                        </p>
                    </div>
                </div>
                <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center gap-2 font-bold transition-all border border-white/5">
                    <Edit3 size={18} />
                    Edit Profile
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-[40px] p-10 border border-white/10 space-y-8"
                >
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <Shield size={24} className="text-primary" />
                        Account Security
                    </h3>
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl">
                            <div>
                                <p className="font-bold">2-Factor Authentication</p>
                                <p className="text-xs text-muted-foreground mt-1">Status: Enabled</p>
                            </div>
                            <div className="w-12 h-6 bg-primary/20 rounded-full relative">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-primary rounded-full shadow-lg" />
                            </div>
                        </div>
                        <div className="flex justify-between items-center bg-white/5 p-5 rounded-2xl">
                            <div>
                                <p className="font-bold">Last Password Change</p>
                                <p className="text-xs text-muted-foreground mt-1">February 15, 2026</p>
                            </div>
                            <button className="text-xs font-bold text-primary hover:underline">Change</button>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-[40px] p-10 border border-white/10 space-y-8"
                >
                    <h3 className="text-xl font-black flex items-center gap-3">
                        <User size={24} className="text-primary" />
                        Personal Details
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                            <Smartphone size={20} className="text-muted-foreground" />
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground">Mobile Number</p>
                                <p className="font-bold">+91 98765 43210</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                            <Shield size={20} className="text-primary" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] uppercase font-black text-muted-foreground">User ID (UUID)</p>
                                <p className="font-mono text-sm font-bold truncate">{user?.uuid || "Generating..."}</p>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(user?.uuid)
                                    toast.success("UUID Copied!")
                                }}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Copy
                            </button>
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
                            <MapPin size={20} className="text-muted-foreground" />
                            <div>
                                <p className="text-[10px] uppercase font-black text-muted-foreground">Address</p>
                                <p className="font-bold">Financial District, Mumbai, India</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
