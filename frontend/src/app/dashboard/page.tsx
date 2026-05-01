"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Wallet,
    TrendingUp,
    MoreVertical,
    Plus,
    History,
    Settings,
    ShieldCheck,
    ArrowRightLeft,
    TrendingDown as TrendingUpIcon
} from "lucide-react"
import { usePrivacy } from "@/context/privacy-context"
import { PrivacyToggle } from "@/components/dashboard/privacy-toggle"
import { WealthOverview } from "@/components/dashboard/wealth-overview"
import { SavingsVaults } from "@/components/dashboard/savings-vaults"
import { formatCurrency, formatDate } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"

export default function Dashboard({ user: initialUser }: { user?: any }) {
    const [user, setUser] = useState<any>(initialUser)
    const [accounts, setAccounts] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const { isPrivate } = usePrivacy()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountsRes, historyRes] = await Promise.all([
                    api.get(endpoints.accounts.list),
                    api.get(endpoints.transactions.history)
                ])
                setAccounts(accountsRes.data.accounts || [])
                setTransactions((historyRes.data.transactions || []).slice(0, 5))
            } catch (error: any) {
                console.warn("Dashboard data fetch error:", error?.message || "Unknown error")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    useEffect(() => {
        if (initialUser) setUser(initialUser)
    }, [initialUser])

    const primaryAccount = accounts[0]
    const balance = primaryAccount?.balance || 0

    if (loading) {
        return (
            <div className="space-y-10 max-w-6xl mx-auto">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
                <Skeleton className="h-64 w-full rounded-[32px]" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-2xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                </div>
            </div>
        )
    }

    const quickActions = [
        { icon: <ArrowRightLeft className="w-5 h-5" />, label: "Transfer", href: "/dashboard/transfer", color: "text-blue-400" },
        { icon: <History className="w-5 h-5" />, label: "History", href: "/dashboard/history", color: "text-purple-400" },
        { icon: <CreditCard className="w-5 h-5" />, label: "Cards", href: "/dashboard/cards", color: "text-pink-400" },
        { icon: <ShieldCheck className="w-5 h-5" />, label: "Security", href: "/dashboard/security", color: "text-emerald-400" },
        { icon: <Settings className="w-5 h-5" />, label: "Settings", href: "/dashboard/settings", color: "text-orange-400" },
    ]

    return (
        <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto pb-20 md:pb-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-black font-outfit tracking-tight">Bonjour, {user?.name}!</h1>
                    <p className="text-white/50 mt-2 font-medium">Your financial ecosystem is performing optimally.</p>
                </motion.div>
                
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <PrivacyToggle />
                    <Link href="/dashboard/transfer" className="w-full md:w-auto">
                        <Button 
                            size="lg" 
                            leftIcon={<Plus className="w-5 h-5" />}
                            className="w-full px-8"
                        >
                            New Transaction
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Main Balance Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20 }}
            >
                <GlassCard 
                    glow 
                    className="min-h-[220px] md:h-64 rounded-[32px] p-0 border-white/5 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent pointer-events-none" />
                    <div className="absolute top-0 right-0 p-12 opacity-10 transform translate-x-6 -translate-y-6 pointer-events-none">
                        <CreditCard size={240} strokeWidth={1} />
                    </div>

                    <div className="relative h-full p-8 md:p-10 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1">
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Total Liquidity</span>
                                <h2 className={cn(
                                    "text-4xl md:text-6xl font-black font-outfit tracking-tighter bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent transition-all duration-500",
                                    isPrivate && "blur-xl select-none"
                                )}>
                                    {formatCurrency(balance)}
                                </h2>
                            </div>
                            <div className="flex px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-lg items-center justify-center border border-white/20 shadow-xl">
                                <span className="font-black text-[10px] tracking-widest text-white/80">XIERIEE CORE</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6 mt-8">
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 ring-1 ring-white/5">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Account ID</p>
                                    <p className="font-mono font-medium text-sm text-white/90">{primaryAccount?.id || "----"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 ring-1 ring-white/5">
                                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-wider text-white/40">Tier</p>
                                    <p className="font-medium text-sm text-white/90 capitalize">{primaryAccount?.account_type || "Standard"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Wealth Overlay (Charts) */}
            <WealthOverview />

            {/* Savings Vaults */}
            <SavingsVaults />

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                {quickActions.map((action, i) => (
                    <Link key={i} href={action.href}>
                        <GlassCard 
                            hoverEffect
                            className="p-4 flex flex-col items-center justify-center gap-3 border-white/5 hover:bg-white/10 transition-all group"
                        >
                            <div className={cn("p-3 rounded-xl bg-white/5 group-hover:scale-110 transition-transform", action.color)}>
                                {action.icon}
                            </div>
                            <span className="text-sm font-bold tracking-tight text-white/70 group-hover:text-white transition-colors">{action.label}</span>
                        </GlassCard>
                    </Link>
                ))}
            </div>

            {/* Recent Transactions */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <TrendingUpIcon className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-2xl font-black font-outfit tracking-tight">Recent Activity</h2>
                    </div>
                    <Link href="/dashboard/history">
                        <Button variant="ghost" size="sm" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white">
                            View Ledger
                        </Button>
                    </Link>
                </div>

                <div className="space-y-3">
                    {transactions.length > 0 ? (
                        transactions.map((tx, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <GlassCard
                                    hoverEffect
                                    className="p-4 flex items-center justify-between border-white/5 bg-white/[0.03] group"
                                >
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={cn(
                                            "w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ring-1 ring-inset",
                                            tx.type === "credit" ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-red-500/10 text-red-400 ring-red-500/20"
                                        )}>
                                            {tx.type === "credit" ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-white group-hover:text-primary transition-colors truncate">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">{tx.type}</span>
                                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                                <span className="text-[10px] font-medium text-white/30">{formatDate(tx.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-1">
                                        <p className={cn(
                                            "font-black font-outfit text-lg transition-all duration-500",
                                            tx.type === "credit" ? "text-emerald-400" : "text-white",
                                            isPrivate && "blur-md select-none"
                                        )}>
                                            {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                        </p>
                                        <MoreVertical size={14} className="text-white/20 group-hover:text-white/60 transition-colors cursor-pointer" />
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ))
                    ) : (
                        <GlassCard className="p-16 flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent">
                            <div className="p-4 rounded-full bg-white/5 mb-4">
                                <History className="w-8 h-8 text-white/20" />
                            </div>
                            <p className="text-white/40 font-medium italic text-center max-w-[200px]">No historical data found for this identifier.</p>
                        </GlassCard>
                    )}
                </div>
            </div>
        </div>
    )
}
