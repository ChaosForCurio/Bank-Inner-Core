"use client"
import { motion } from "framer-motion"
import {
    ArrowUpRight,
    ArrowDownLeft,
    CreditCard,
    Wallet,
    TrendingUp,
    MoreVertical,
    Plus
} from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export default function Dashboard() {
    const balance = 3000.45 // Hardcoded for demo, will fetch later

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black font-outfit">Welcome back, Test User!</h1>
                    <p className="text-muted-foreground mt-1">Here's what's happening with your finance today.</p>
                </div>
                <button className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg shadow-primary/20">
                    <Plus size={20} />
                    New Transaction
                </button>
            </header>

            {/* Cards Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Balance Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 relative h-64 rounded-[32px] overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-emerald-600 to-emerald-900 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-0 right-0 p-10 opacity-20 transform translate-x-4 -translate-y-4">
                        <CreditCard size={200} />
                    </div>

                    <div className="relative h-full p-10 flex flex-col justify-between text-primary-foreground">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium opacity-80 mb-1">Total Balance</p>
                                <h2 className="text-5xl font-black font-outfit">{formatCurrency(balance)}</h2>
                            </div>
                            <div className="w-14 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                                <span className="font-black text-xs">NOVA</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <ArrowUpRight size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider opacity-70">Income</p>
                                    <p className="font-bold">+ {formatCurrency(5000)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <ArrowDownLeft size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider opacity-70">Expenses</p>
                                    <p className="font-bold">- {formatCurrency(1999.55)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Contacts / Savings */}
                <div className="glass-card rounded-[32px] p-8 flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold">Saving Goals</h3>
                        <TrendingUp size={18} className="text-primary" />
                    </div>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">New Car</span>
                                <span className="font-bold">75%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-3/4" />
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Dream House</span>
                                <span className="font-bold">12%</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[12%]" />
                            </div>
                        </div>
                    </div>
                    <button className="mt-8 py-3 w-full bg-white/5 rounded-xl text-sm font-bold hover:bg-white/10 transition-colors">
                        View All Goals
                    </button>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold font-outfit">Recent Transactions</h2>
                    <button className="text-primary text-sm font-bold hover:underline">See All</button>
                </div>

                <div className="space-y-3">
                    {[
                        { name: "User ID 3", date: "Today, 11:15 AM", amount: -2000, type: "transfer", category: "Finance" },
                        { name: "Initial Funding", date: "Feb 20, 2026", amount: 5000, type: "deposit", category: "Income" },
                        { name: "Netflix Subscription", date: "Feb 19, 2026", amount: -499, type: "payment", category: "Entertainment" },
                        { name: "Salary Credit", date: "Feb 15, 2026", amount: 25000, type: "deposit", category: "Work" },
                    ].map((tx, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/[0.08] border border-transparent hover:border-white/5 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center",
                                    tx.amount > 0 ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"
                                )}>
                                    {tx.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                </div>
                                <div>
                                    <p className="font-bold group-hover:text-primary transition-colors">{tx.name}</p>
                                    <p className="text-xs text-muted-foreground">{tx.category} • {tx.date}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "font-bold text-lg",
                                    tx.amount > 0 ? "text-primary" : "text-white"
                                )}>
                                    {tx.amount > 0 ? "+" : ""}{formatCurrency(tx.amount)}
                                </p>
                                <MoreVertical size={16} className="ml-auto mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function cn(...classes: string[]) {
    return classes.filter(Boolean).join(" ");
}
