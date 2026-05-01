"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Check, Clock, Info, AlertTriangle, DollarSign, ShieldAlert, CheckCircle2, BellRing } from "lucide-react"
import { api, endpoints } from "@/lib/api"
import { cn, formatDate } from "@/lib/utils"
import { GlassCard } from "./ui/glass-card"

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
        case 'transaction': return <DollarSign size={16} className="text-green-400" />;
        case 'warning':
        case 'alert': return <AlertTriangle size={16} className="text-yellow-400" />;
        case 'security': return <ShieldAlert size={16} className="text-red-400" />;
        default: return <Info size={16} className="text-blue-400" />;
    }
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const [isPushEnabled, setIsPushEnabled] = useState(false)

    const fetchNotifications = async () => {
        try {
            const response = await api.get(endpoints.notifications.list)
            const data = response.data.notifications || []
            setNotifications(data)
            setUnreadCount(data.filter((n: any) => n.read_status === 'unread').length)
        } catch (error: any) {
            console.error("Failed to fetch notifications:", error?.message || error)
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
        
        // Check if push notifications are enabled
        if ("Notification" in window && navigator.serviceWorker) {
            navigator.serviceWorker.getRegistration().then(reg => {
                if (reg) {
                    reg.pushManager.getSubscription().then(sub => {
                        setIsPushEnabled(!!sub);
                    });
                }
            });
        }
        
        return () => clearInterval(interval)
    }, [])

    const enablePushNotifications = async () => {
        if (!("Notification" in window) || !("serviceWorker" in navigator)) {
            alert("Push notifications are not supported in this browser.");
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission !== "granted") {
                alert("Permission for notifications was denied.");
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js");
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                const vapidResponse = await api.get(endpoints.notifications.vapidKey);
                const vapidPublicKey = vapidResponse.data.publicKey;
                
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                });

                await api.post(endpoints.notifications.subscribe, {
                    subscription: subscription,
                    deviceType: 'web'
                });
            }
            setIsPushEnabled(true);
        } catch (error) {
            console.error("Error subscribing to push notifications:", error);
        }
    };

    const markAsRead = async (id: number | 'all') => {
        try {
            await api.patch(endpoints.notifications.markRead(id))
            fetchNotifications()
        } catch (error) {
            console.error("Failed to mark as read:", error)
        }
    }

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 border border-white/5"
            >
                <Bell size={20} className={cn(unreadCount > 0 && "text-primary")} />
                {unreadCount > 0 && (
                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0a0f18] animate-pulse" />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setIsOpen(false)} 
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-4 w-[380px] z-50 origin-top-right"
                        >
                            <GlassCard className="p-0 border-white/10 shadow-2xl overflow-hidden max-h-[600px] flex flex-col">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black text-xs uppercase tracking-widest">Alerts</h3>
                                        {unreadCount > 0 && (
                                            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                                {unreadCount} UNREAD
                                            </span>
                                        )}
                                    </div>
                                    {unreadCount > 0 && (
                                        <button 
                                            onClick={() => markAsRead('all')}
                                            className="text-[10px] flex items-center gap-1 font-bold text-white/40 hover:text-white transition"
                                        >
                                            <CheckCircle2 size={12} /> Mark All Read
                                        </button>
                                    )}
                                </div>

                                {!isPushEnabled && (
                                    <div className="px-4 py-3 bg-primary/10 flex items-center justify-between border-b border-primary/20">
                                        <div className="flex items-center gap-2">
                                            <BellRing size={14} className="text-primary" />
                                            <span className="text-xs text-primary font-medium">Turn on desktop notifications</span>
                                        </div>
                                        <button 
                                            onClick={enablePushNotifications}
                                            className="text-[10px] font-bold bg-primary text-black px-2 py-1 rounded hover:bg-primary/90 transition"
                                        >
                                            ENABLE
                                        </button>
                                    </div>
                                )}

                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.id}
                                                className={cn(
                                                    "p-4 border-b border-white/5 transition-colors relative group",
                                                    n.read_status === 'unread' ? "bg-primary/5" : "hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5 flex-shrink-0">
                                                        {getTypeIcon(n.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className={cn(
                                                                "text-sm font-bold tracking-tight mb-0.5",
                                                                n.read_status === 'unread' ? "text-white" : "text-white/70"
                                                            )}>
                                                                {n.title || "Notification"}
                                                            </p>
                                                            {n.read_status === 'unread' && (
                                                                <button 
                                                                    onClick={() => markAsRead(n.id)}
                                                                    className="p-1 rounded bg-white/5 border border-white/10 text-white/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                                >
                                                                    <Check size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <p className={cn(
                                                            "text-xs leading-relaxed",
                                                            n.read_status === 'unread' ? "text-white/80" : "text-white/50"
                                                        )}>
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Clock size={10} className="text-white/20" />
                                                            <span className="text-[10px] font-bold text-white/30 uppercase">
                                                                {formatDate(n.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {n.read_status === 'unread' && (
                                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-12 text-center space-y-4">
                                            <div className="p-4 rounded-full bg-white/5 w-fit mx-auto">
                                                <Bell size={24} className="text-white/10" />
                                            </div>
                                            <p className="text-xs text-white/20 font-bold uppercase tracking-widest">No Alerts Detected</p>
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
