"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Wallet,
    TrendingUp,
    MoreVertical,
    Plus,
    Loader2
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function Dashboard({ user: initialUser }: { user?: any }) {
    const [user, setUser] = useState<any>(initialUser)
    const [accounts, setAccounts] = useState<any[]>([])
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [accountsRes, historyRes] = await Promise.all([
                    api.get(endpoints.accounts.list),
                    api.get(endpoints.transactions.history)
                ])
                setAccounts(accountsRes.data.accounts || [])
                setTransactions((historyRes.data.transactions || []).slice(0, 5)) // Get recent 5
            } catch (error) {
                console.error("Dashboard data fetch error:", error)
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
            <div className="h-[60vh] w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="space-y-6 md:space-y-10 max-w-6xl mx-auto pb-20 md:pb-0">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black font-outfit">Welcome back, {user?.name}!</h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your finance today.</p>
                </div>
                <Link href="/dashboard/transfer" className="w-full md:w-auto px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                    <Plus size={20} />
                    New Transaction
                </Link>
            </header>

            {/* Cards Section */}
            <div className="grid grid-cols-1 gap-8">
                {/* Main Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative h-auto min-h-[16rem] md:h-64 rounded-[32px] overflow-hidden group border border-white/10 shadow-2xl shadow-primary/10"
                >
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-900 group-hover:scale-110 transition-transform duration-700"
                        animate={{ backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        style={{ backgroundSize: "200% 200%" }}
                    />
                    <div className="absolute top-0 right-0 p-10 opacity-20 transform translate-x-4 -translate-y-4">
                        <CreditCard size={200} />
                    </div>

                    <div className="relative h-full p-10 flex flex-col justify-between text-primary-foreground">
                        <div className="flex justify-between items-start mb-8 md:mb-0">
                            <div>
                                <p className="text-sm font-medium opacity-80 mb-1">Total Balance</p>
                                <h2 className="text-4xl md:text-5xl font-black font-outfit break-all">{formatCurrency(balance)}</h2>
                            </div>
                            <div className="hidden sm:flex w-14 h-10 bg-white/20 backdrop-blur-md rounded-xl items-center justify-center border border-white/30">
                                <span className="font-black text-xs">XIERIEE</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <ArrowUpRight size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider opacity-70">Primary Account</p>
                                    <p className="font-bold">{primaryAccount?.id || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Wallet size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider opacity-70">Type</p>
                                    <p className="font-bold capitalize">{primaryAccount?.account_type || "Savings"}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-outfit">Recent Transactions</h2>
                    <Link href="/dashboard/history" className="text-primary text-sm font-bold hover:underline">See All</Link>
                </div>

                <div className="space-y-3">
                    {transactions.length > 0 ? (
                        transactions.map((tx, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] border border-transparent hover:border-white/5 transition-all cursor-pointer"
                            >
                                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                                    <div className={cn(
                                        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 flex items-center justify-center",
                                        tx.type === "credit" ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"
                                    )}>
                                        {tx.type === "credit" ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div className="min-w-0 pr-4">
                                        <p className="font-bold group-hover:text-primary transition-colors truncate text-sm sm:text-base">{tx.description}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider truncate">{tx.type} • {formatDate(tx.created_at)}</p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className={cn(
                                        "font-bold text-base sm:text-lg",
                                        tx.type === "credit" ? "text-primary" : "text-white"
                                    )}>
                                        {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                    </p>
                                    <MoreVertical size={16} className="ml-auto mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="p-10 text-center border-2 border-dashed border-white/5 rounded-[32px]">
                            <p className="text-muted-foreground">No recent transactions found.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
