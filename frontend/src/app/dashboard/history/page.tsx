"use client"
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    History as HistoryIcon,
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Download,
    Loader2,
    Calendar,
    ChevronRight,
    FileText
} from "lucide-react"
import { formatCurrency, formatDate, cn } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

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
                toast.error("Failed to load historical data")
            } finally {
                setLoading(false)
            }
        }
        fetchHistory()
    }, [])

    const filteredTransactions = transactions.filter(tx =>
        tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.transaction_uuid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.amount.toString().includes(searchTerm)
    )

    if (loading) {
        return (
            <div className="space-y-10 max-w-6xl mx-auto">
                <div className="flex justify-between items-end">
                    <div className="space-y-3">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="h-10 w-24 rounded-xl" />
                        <Skeleton className="h-10 w-24 rounded-xl" />
                    </div>
                </div>
                <Skeleton className="h-14 w-full rounded-2xl" />
                <GlassCard className="p-0 border-white/5 overflow-hidden">
                    <div className="p-8 space-y-6">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between gap-6">
                                <div className="flex items-center gap-4 flex-1">
                                    <Skeleton className="w-12 h-12 rounded-2xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-4 w-24 hidden sm:block" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                            <HistoryIcon className="w-5 h-5 text-white/60" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Financial Records</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black font-outfit tracking-tight text-white">Transaction Ledger</h1>
                    <p className="text-white/40 mt-3 font-medium max-w-lg leading-relaxed">
                        Complete traceability of internal and external liquidity movements across the Xieriee core network.
                    </p>
                </motion.div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none" leftIcon={<Download size={18} />}>
                        Export
                    </Button>
                    <Button className="flex-1 md:flex-none" leftIcon={<Filter size={18} />}>
                        Filter
                    </Button>
                </div>
            </header>

            {/* Search Bar - Refined Glass Look */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search size={20} className="text-white/20 group-focus-within:text-white/60 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by description, amount, or transaction type..."
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 pl-16 text-sm font-medium outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all placeholder:text-white/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </motion.div>

            {/* Transactions List */}
            <GlassCard className="p-0 border-white/5 overflow-hidden shadow-2xl">
                {filteredTransactions.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.01]">
                                    <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Transaction Entity</th>
                                    <th className="hidden sm:table-cell px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Classification</th>
                                    <th className="hidden lg:table-cell px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Ref ID</th>
                                    <th className="hidden md:table-cell px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">Timestamp</th>
                                    <th className="px-8 py-6 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase text-right">Magnitude</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                <AnimatePresence mode="popLayout">
                                    {filteredTransactions.map((tx: any, i) => (
                                        <motion.tr
                                            key={tx.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2, delay: i * 0.02 }}
                                            className="hover:bg-white/[0.03] transition-all cursor-pointer group relative"
                                        >
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-5">
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ring-1 ring-inset transition-all group-hover:scale-110",
                                                        tx.type === "credit" 
                                                            ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" 
                                                            : "bg-red-500/10 text-red-400 ring-red-500/20"
                                                    )}>
                                                        {tx.type === "credit" ? <ArrowDownLeft size={22} /> : <ArrowUpRight size={22} />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white group-hover:text-primary transition-colors truncate text-base">
                                                            {tx.description || "Core System Transfer"}
                                                        </p>
                                                        <div className="flex items-center gap-2 mt-1 md:hidden">
                                                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">{tx.type}</span>
                                                            <span className="w-1 h-1 rounded-full bg-white/10" />
                                                            <span className="text-[10px] font-medium text-white/30">{formatDate(tx.created_at)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hidden sm:table-cell px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                                    <span className="text-xs font-bold text-white/60 capitalize">
                                                        {tx.transaction_type || "Transfer"}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="hidden lg:table-cell px-8 py-5">
                                                <span className="text-[10px] font-mono font-bold text-white/30 bg-white/[0.03] px-2.5 py-1.5 rounded-lg border border-white/5 group-hover:border-white/20 opacity-60 group-hover:opacity-100 transition-all">
                                                    TX-{tx.transaction_uuid?.split('-')[0].toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="hidden md:table-cell px-8 py-5">
                                                <div className="flex items-center gap-3 text-sm text-white/40 font-medium">
                                                    <Calendar size={14} className="opacity-50" />
                                                    {formatDate(tx.created_at)}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={cn(
                                                        "font-black text-xl font-outfit tracking-tight",
                                                        tx.type === "credit" ? "text-emerald-400" : "text-white"
                                                    )}>
                                                        {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                                                    </span>
                                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest underline decoration-white/10">Details</span>
                                                        <ChevronRight size={12} className="text-white/20" />
                                                    </div>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-24 text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-white/10 rotate-12 border border-white/5">
                            <FileText size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black font-outfit tracking-tight text-white/80">Zero Records Found</h3>
                            <p className="text-white/30 max-w-xs mx-auto text-sm font-medium">
                                No historical data corresponds to the current filtering parameters.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setSearchTerm("")}>
                            Reset Filters
                        </Button>
                    </div>
                )}
            </GlassCard>
        </div>
    )
}
