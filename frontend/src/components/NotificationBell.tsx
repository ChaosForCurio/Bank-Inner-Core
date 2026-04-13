"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, Check, Trash2, Clock } from "lucide-react"
import { api } from "@/lib/api"
import { cn, formatDate } from "@/lib/utils"
import { GlassCard } from "./ui/glass-card"

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<any[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const fetchNotifications = async () => {
        try {
            const response = await api.get('notifications')
            const data = response.data.notifications || []
            setNotifications(data)
            setUnreadCount(data.filter((n: any) => !n.is_read).length)
        } catch (error) {
            console.error("Failed to fetch notifications")
        }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
        return () => clearInterval(interval)
    }, [])

    const markAsRead = async (id: number) => {
        try {
            await api.patch(`notifications/${id}/read`)
            fetchNotifications()
        } catch (error) {
            console.error("Failed to mark as read")
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
                            className="absolute right-0 mt-4 w-[350px] z-50 origin-top-right"
                        >
                            <GlassCard className="p-0 border-white/10 shadow-2xl overflow-hidden max-h-[500px] flex flex-col">
                                <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                    <h3 className="font-black text-xs uppercase tracking-widest">Protocol Alerts</h3>
                                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        {unreadCount} UNREAD
                                    </span>
                                </div>

                                <div className="overflow-y-auto flex-1 custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        notifications.map((n) => (
                                            <div 
                                                key={n.id}
                                                className={cn(
                                                    "p-4 border-b border-white/5 transition-colors relative group",
                                                    !n.is_read ? "bg-primary/5" : "hover:bg-white/5"
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                                                        !n.is_read ? "bg-primary" : "bg-white/10"
                                                    )} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            "text-sm tracking-tight",
                                                            !n.is_read ? "font-bold text-white" : "text-white/60 font-medium"
                                                        )}>
                                                            {n.message}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <Clock size={10} className="text-white/20" />
                                                            <span className="text-[10px] font-bold text-white/20 uppercase">
                                                                {formatDate(n.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {!n.is_read && (
                                                        <button 
                                                            onClick={() => markAsRead(n.id)}
                                                            className="p-2 rounded-lg bg-white/5 text-white/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Check size={14} />
                                                        </button>
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

                                {notifications.length > 0 && (
                                   <div className="p-3 bg-white/5 text-center">
                                        <button className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors">
                                            Purge Archive
                                        </button>
                                   </div>
                                )}
                            </GlassCard>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
