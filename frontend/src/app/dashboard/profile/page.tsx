"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { 
    User, 
    Mail, 
    Shield, 
    Edit3, 
    Loader2, 
    CheckCircle2, 
    Calendar,
    ArrowUpRight,
    Star,
    Bell
} from "lucide-react"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { Copy, Check, LockIcon as LockIconLucide } from "lucide-react"

export default function ProfilePage({ user: initialUser }: { user?: any }) {
    const [user, setUser] = useState<any>(initialUser)
    const [loading, setLoading] = useState(!initialUser)
    const [copied, setCopied] = useState(false)
    const [pushEnabled, setPushEnabled] = useState(false)
    const [isPushSupported, setIsPushSupported] = useState(false)

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("UID copied to clipboard")
        setTimeout(() => setCopied(false), 2000)
    }

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
        
        // Initialize Push API
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsPushSupported(true);
            navigator.serviceWorker.register('/sw.js').then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setPushEnabled(true);
                });
            }).catch(err => console.error("Service worker registration failed", err));
        }
    }, [initialUser])

    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');
        
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    const togglePushNotifications = async () => {
        if (!isPushSupported) {
            toast.error("Push notifications are not supported by this browser.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                toast.error("Permission denied for notifications");
                return;
            }

            const reg = await navigator.serviceWorker.ready;
            
            if (pushEnabled) {
                toast.error("You can disable notifications from your browser site settings.");
                return;
            }

            const res = await api.get(endpoints.notifications.vapidKey);
            const publicVapidKey = res.data.publicKey;
            const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

            const subscription = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidKey
            });

            await api.post(endpoints.notifications.subscribe, {
                subscription,
                deviceType: navigator.platform || 'web'
            });

            setPushEnabled(true);
            toast.success("Desktop alerts enabled!");
        } catch (error) {
            console.error("Error setting up push:", error);
            toast.error("Failed to enable push notifications");
        }
    }

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 size={40} className="text-primary animate-spin" />
            </div>
        )
    }

    const memberSince = user?.created_at 
        ? new Date(user.created_at).toLocaleDateString("en-US", { month: 'long', year: 'numeric' })
        : "January 2026"

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-20 relative">
            {/* dynamic background effect */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-400/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
            
            <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        className="relative group"
                    >
                        <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-emerald-400 rounded-[42px] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative w-40 h-40 rounded-[40px] bg-[#0a0f18] border border-white/10 flex items-center justify-center text-6xl font-black text-white shadow-2xl overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-emerald-400/20 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            {user?.name?.[0]}
                            <div className="absolute bottom-2 right-2 w-8 h-8 bg-primary rounded-full border-4 border-[#0a0f18] flex items-center justify-center">
                                <CheckCircle2 size={14} className="text-black" />
                            </div>
                        </div>
                    </motion.div>

                    <div className="text-center md:text-left space-y-2">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            className="flex items-center justify-center md:justify-start gap-3"
                        >
                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full border border-primary/20">
                                {user?.role === 'admin' ? "System Administrator" : "Premium Member"}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                Elite Tier
                            </span>
                        </motion.div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-5xl md:text-6xl font-black font-outfit tracking-tighter"
                        >
                            {user?.name || "User Account"}
                        </motion.h1>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col md:flex-row items-center md:items-start gap-4"
                        >
                            <p className="text-muted-foreground text-lg flex items-center gap-2 group cursor-pointer hover:text-white transition-colors">
                                <Mail size={18} className="text-primary/70 group-hover:text-primary transition-colors" />
                                {user?.email}
                            </p>
                            <div className="hidden md:block w-px h-6 bg-white/10" />
                            <div 
                                onClick={() => copyToClipboard(user?.uuid)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all group"
                            >
                                <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white/60 transition-colors uppercase tracking-tighter">
                                    UID: {user?.uuid?.split('-')[0]}...
                                </span>
                                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-white/20 group-hover:text-white/60" />}
                            </div>
                        </motion.div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <button 
                        onClick={() => toast.success("Edit profile coming soon!")}
                        className="group px-8 py-4 bg-white text-black hover:bg-primary hover:text-white rounded-2xl flex items-center gap-3 font-black transition-all shadow-xl shadow-white/5 hover:shadow-primary/20 active:scale-95"
                    >
                        <Edit3 size={18} />
                        Edit Profile
                        <ArrowUpRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </motion.div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 space-y-8"
                >
                    <div className="glass-card rounded-[48px] p-10 border border-white/5 relative overflow-hidden group hover:border-white/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                            <Shield size={120} />
                        </div>
                        
                        <div className="relative space-y-10">
                            <div className="flex items-center justify-between">
                                <h3 className="text-2xl font-black flex items-center gap-4">
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                        <LockIcon size={24} />
                                    </div>
                                    Account Security
                                </h3>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Score</p>
                                    <p className="text-xl font-black text-emerald-400">92%</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className={cn(
                                    "p-6 rounded-[32px] border transition-all",
                                    user?.mfa_enabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5"
                                )}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            user?.mfa_enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                                        )}>
                                            <Shield size={20} />
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                            user?.mfa_enabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                                        )}>
                                            {user?.mfa_enabled ? "Active" : "Inactive"}
                                        </span>
                                    </div>
                                    <p className="font-bold text-lg">Two-Factor Auth</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {user?.mfa_enabled 
                                            ? "Your account is protected by an additional security layer." 
                                            : "Add an extra layer of security to your account."}
                                    </p>
                                </div>

                                <div className="p-6 rounded-[32px] bg-white/5 border border-white/5 hover:bg-white/[0.08] transition-all cursor-pointer group/item">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-muted-foreground group-hover/item:text-primary transition-colors">
                                            <LockIcon size={20} />
                                        </div>
                                        <ArrowUpRight size={16} className="text-muted-foreground group-hover/item:text-white" />
                                    </div>
                                    <p className="font-bold text-lg">Password Policy</p>
                                    <p className="text-xs text-muted-foreground mt-1">Last changed 2 months ago. Excellent strength.</p>
                                </div>
                                
                                <div 
                                    onClick={togglePushNotifications}
                                    className={cn(
                                        "p-6 rounded-[32px] border transition-all cursor-pointer group/item",
                                        pushEnabled ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                            pushEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground group-hover/item:text-primary"
                                        )}>
                                            <Bell size={20} />
                                        </div>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider",
                                            pushEnabled ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                                        )}>
                                            {pushEnabled ? "Enabled" : "Off"}
                                        </span>
                                    </div>
                                    <p className="font-bold text-lg">Push Alerts</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {pushEnabled 
                                            ? "You will receive desktop alerts for incoming transfers." 
                                            : "Get safe, instant native notifications for money limits and transfers."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="glass-card rounded-[40px] p-8 border border-white/5 flex items-center gap-6 group hover:bg-white/[0.02] transition-all">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                <Calendar size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member Since</p>
                                <p className="text-xl font-black">{memberSince}</p>
                            </div>
                        </div>
                        <div className="glass-card rounded-[40px] p-8 border border-white/5 flex items-center gap-6 group hover:bg-white/[0.02] transition-all">
                            <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                                <CheckCircle2 size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Account Status</p>
                                <p className="text-xl font-black">Verified Account</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-8"
                >
                    <div className="glass-card rounded-[48px] p-10 border border-white/5 space-y-10 h-full flex flex-col">
                        <h3 className="text-2xl font-black flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <User size={24} />
                            </div>
                            Personal Info
                        </h3>
                        
                        <div className="space-y-4 flex-1">
                            <div className="group/field p-4 rounded-[24px] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover/field:text-primary transition-colors">Full Name</p>
                                <p className="text-xl font-black mt-1">{user?.name}</p>
                            </div>
                            
                            <div className="group/field p-4 rounded-[24px] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover/field:text-primary transition-colors">Email Address</p>
                                <p className="text-xl font-black mt-1 break-all">{user?.email}</p>
                            </div>

                            <div className="group/field p-4 rounded-[24px] hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover/field:text-primary transition-colors">Identity Role</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                                    <p className="text-xl font-black uppercase italic tracking-tighter">{user?.role || 'User'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-10 border-t border-white/5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Linked Accounts</p>
                            <div className="flex gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
                                    <span className="font-black text-xs">G</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center grayscale hover:grayscale-0 transition-all cursor-pointer">
                                    <span className="font-black text-xs">A</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center border-dashed opacity-30 hover:opacity-100 transition-all cursor-pointer group">
                                    <PlusIcon size={16} className="group-hover:text-primary transition-colors" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}

function LockIcon({ size, className }: { size?: number, className?: string }) {
    return <Shield size={size} className={className} />
}

function PlusIcon({ size, className }: { size?: number, className?: string }) {
    return (
        <svg 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className={className}
        >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
    )
}
