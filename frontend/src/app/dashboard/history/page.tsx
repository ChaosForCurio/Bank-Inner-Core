"use client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
    History as HistoryIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Download,
    Loader2
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"

export default function HistoryPage({ user }: { user?: any }) {
    const [transactions, setTransactions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await api.get(endpoints.transactions.history)
                setTransactions(response.data.transactions || [])
            } catch (error: any) {
                toast.error("Failed to load history")
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    const filteredTransactions = transactions.filter(tx =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm)
    )

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black font-outfit">Transaction History</h1>
                    <p className="text-muted-foreground mt-1">Review all your past activities and transfers.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center gap-2 transition-colors border border-white/5">
                        <Download size={18} />
                        Export
                    </button>
                    <button className="px-4 py-2 bg-primary text-primary-foreground rounded-xl flex items-center gap-2 font-bold hover:scale-105 transition-transform">
                        <Filter size={18} />
                        Filter
                    </button>
                </div>
            </header>

            {/* Search Bar */}
            <div className="bg-white/5 p-2 rounded-2xl border border-white/5 flex items-center gap-3">
                <div className="flex-1 flex items-center gap-3 px-4 py-2 bg-black/20 rounded-xl">
                    <Search size={20} className="text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by description, amount, or type..."
                        className="bg-transparent border-none outline-none w-full text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Transactions Table/List */}
            <div className="glass-card rounded-[32px] overflow-hidden border border-white/5">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center gap-4">
                        <Loader2 size={40} className="text-primary animate-spin" />
                        <p className="text-muted-foreground animate-pulse">Fetching your records...</p>
                    </div>
                ) : filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 uppercase text-[10px] font-black tracking-widest text-muted-foreground w-full">
                                    <th className="px-4 py-4 md:px-8 md:py-6">Transaction</th>
                                    <th className="hidden sm:table-cell px-4 py-4 md:px-8 md:py-6">Category</th>
                                    <th className="hidden md:table-cell px-4 py-4 md:px-8 md:py-6">Date & Time</th>
                                    <th className="px-4 py-4 md:px-8 md:py-6 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredTransactions.map((tx: any, i) => (
                                    <motion.tr
                                        key={tx.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                    >
                                        <td className="px-4 py-4 md:px-8 md:py-5 max-w-[150px] sm:max-w-[200px] md:max-w-none">
                                            <div className="flex items-center gap-3 md:gap-4">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center",
                                                    tx.type === "credit" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-400"
                                                )}>
                                                    {tx.type === "credit" ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                                </div>
                                                <div className="min-w-0 pr-2">
                                                    <p className="font-bold group-hover:text-primary transition-colors truncate text-sm md:text-base">
                                                        {tx.description || "General Transfer"}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider md:hidden mt-0.5 truncate">
                                                        {formatDate(tx.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="hidden sm:table-cell px-4 py-4 md:px-8 md:py-5">
                                            <span className="text-[10px] md:text-xs px-2 md:px-3 py-1 bg-white/5 rounded-full border border-white/5 capitalize whitespace-nowrap">
                                                {tx.transaction_type || "Transfer"}
                                            </span>
                                        </td>
                                        <td className="hidden md:table-cell px-4 py-4 md:px-8 md:py-5 text-sm text-muted-foreground font-medium whitespace-nowrap">
                                            {formatDate(tx.created_at)}
                                        </td>
                                        <td className={cn(
                                            "px-4 py-4 md:px-8 md:py-5 text-right font-black text-base md:text-lg font-outfit whitespace-nowrap",
                                            tx.type === "credit" ? "text-emerald-500" : "text-white"
                                        )}>
                                            {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-20 text-center space-y-4">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto text-muted-foreground">
                            <HistoryIcon size={32} />
                        </div>
                        <h3 className="text-xl font-bold">No transactions found</h3>
                        <p className="text-muted-foreground max-w-xs mx-auto">
                            We couldn't find any records matching your search or your history is empty.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
