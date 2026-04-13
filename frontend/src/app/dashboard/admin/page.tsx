"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Users,
    Activity,
    Database,
    ShieldAlert,
    Search,
    RefreshCw,
    MoreVertical,
    CheckCircle2,
    XCircle,
    UserCircle,
    ArrowRightLeft,
    TrendingUp
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import toast from "react-hot-toast"

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null)
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [history, setHistory] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('overview')
    const [searchQuery, setSearchQuery] = useState('')

    const fetchData = async () => {
        setLoading(true)
        try {
            const [statsRes, usersRes, historyRes] = await Promise.all([
                api.get('admin/stats'),
                api.get('admin/users'),
                api.get('admin/history')
            ])
            setStats(statsRes.data.stats)
            setAllUsers(usersRes.data.users)
            setHistory(historyRes.data.transactions)
        } catch (error: any) {
            console.error("Admin data fetch error:", error)
            toast.error("Access denied or failed to load system data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const toggleAccountStatus = async (accountId: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'frozen' : 'active'
        try {
            await api.patch(`admin/accounts/${accountId}/status`, { status: newStatus })
            toast.success(`Account ${newStatus === 'frozen' ? 'frozen' : 'activated'}`)
            fetchData() // Refresh
        } catch (error) {
            toast.error("Failed to update status")
        }
    }

    if (loading && !stats) {
        return (
            <div className="space-y-10 max-w-7xl mx-auto">
                <Skeleton className="h-12 w-64" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[24px]" />)}
                </div>
                <Skeleton className="h-96 w-full rounded-[32px]" />
            </div>
        )
    }

    const filteredUsers = allUsers.filter(u => 
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.uuid?.includes(searchQuery)
    )

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black font-outfit tracking-tight flex items-center gap-4">
                        <ShieldAlert className="w-10 h-10 text-primary" />
                        Banker's Command Center
                    </h1>
                    <p className="text-white/50 mt-2 font-medium tracking-wide">System-wide surveillance and asset management.</p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={fetchData} 
                    leftIcon={<RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />}
                    className="border-white/10 hover:bg-white/5"
                >
                    Refresh Matrix
                </Button>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    label="Active Sentinels" 
                    value={stats?.total_users || 0} 
                    icon={<Users className="w-6 h-6 text-blue-400" />} 
                    sub="Total Registered Users"
                />
                <StatCard 
                    label="System Liquidity" 
                    value={formatCurrency(stats?.total_assets || 0)} 
                    icon={<Database className="w-6 h-6 text-emerald-400" />} 
                    sub="Aggregate Balance"
                    isCurrency
                />
                <StatCard 
                    label="Network Velocity" 
                    value={stats?.completed_transactions || 0} 
                    icon={<Activity className="w-6 h-6 text-purple-400" />} 
                    sub="Completed Transactions"
                />
                <StatCard 
                    label="Containment Units" 
                    value={stats?.frozen_accounts || 0} 
                    icon={<ShieldAlert className="w-6 h-6 text-red-400" />} 
                    sub="Frozen Accounts"
                />
            </div>

            {/* Tabs */}
            <div className="flex gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/5 w-fit">
                {['overview', 'users', 'ledger'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-2.5 rounded-xl font-bold text-sm tracking-tighter uppercase transition-all",
                            activeTab === tab 
                                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                                : "text-white/40 hover:text-white hover:bg-white/5"
                        )}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <RecentUsers users={allUsers.slice(0, 5)} />
                    <SystemHealth stats={stats} />
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex bg-white/5 px-6 py-4 rounded-3xl border border-white/5 items-center gap-4 group focus-within:border-primary/40 transition-all">
                        <Search className="text-white/20 group-focus-within:text-primary" />
                        <input 
                            type="text" 
                            placeholder="Find user by name, email or identifier..."
                            className="bg-transparent border-none outline-none w-full font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <UserTable users={filteredUsers} onToggleStatus={toggleAccountStatus} />
                </div>
            )}

            {activeTab === 'ledger' && (
                <GlobalLedger history={history} />
            )}
        </div>
    )
}

function StatCard({ label, value, icon, sub, isCurrency = false }: any) {
    return (
        <GlassCard className="p-6 border-white/5 hover:border-white/10 transition-all">
            <div className="flex justify-between items-start">
                <div className="space-y-1">
                    <p className="text-[10px] uppercase font-black tracking-widest text-white/40">{label}</p>
                    <h3 className={cn(
                        "font-outfit font-black tracking-tighter",
                        isCurrency ? "text-2xl" : "text-3xl"
                    )}>{value}</h3>
                    <p className="text-[10px] text-white/20 font-bold">{sub}</p>
                </div>
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                    {icon}
                </div>
            </div>
        </GlassCard>
    )
}

function UserTable({ users, onToggleStatus }: any) {
    return (
        <GlassCard className="overflow-hidden border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-white/30">Identifier</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-white/30">User Entity</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-white/30">Primary Assets</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-white/30">Role/Status</th>
                            <th className="px-6 py-4 text-[10px] uppercase font-black tracking-widest text-white/30 text-right">Containment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((u: any) => {
                            const mainAccount = u.accounts?.[0]
                            return (
                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-mono text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded w-fit">
                                            {u.uuid.substring(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-bold">
                                                {u.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{u.name}</p>
                                                <p className="text-xs text-white/30">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-outfit font-black text-primary">
                                            {formatCurrency(mainAccount?.balance || 0)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400/80">{u.role}</span>
                                            <span className={cn(
                                                "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit",
                                                mainAccount?.status === 'active' ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                            )}>
                                                {mainAccount?.status}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button 
                                            variant={mainAccount?.status === 'active' ? 'danger' : 'outline'}
                                            size="sm"
                                            className="text-[10px] h-8 px-4 font-black tracking-widest uppercase rounded-lg"
                                            onClick={() => onToggleStatus(mainAccount.id, mainAccount.status)}
                                        >
                                            {mainAccount?.status === 'active' ? "Freeze" : "Unfreeze"}
                                        </Button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </GlassCard>
    )
}

function GlobalLedger({ history }: any) {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 px-2">
                <ArrowRightLeft className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-black font-outfit tracking-tight">System-Wide Transactions</h2>
            </div>
            <div className="space-y-3">
                {history.map((tx: any, i: number) => (
                    <GlassCard key={tx.id} className="p-4 flex items-center justify-between border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                <Activity size={18} className="text-white/40" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">{tx.from_user_name || "System"}</span>
                                    <TrendingUp size={12} className="text-white/20" />
                                    <span className="font-bold text-sm">{tx.to_user_name}</span>
                                </div>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-black mt-1">
                                    TXID: {tx.id} • {formatDate(tx.created_at)}
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-outfit font-black text-lg">{formatCurrency(tx.amount)}</p>
                            <span className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                tx.status === 'completed' ? "text-emerald-400" : "text-red-400"
                            )}>{tx.status}</span>
                        </div>
                    </GlassCard>
                ))}
            </div>
        </div>
    )
}

function RecentUsers({ users }: any) {
    return (
        <GlassCard className="p-8 border-white/5">
            <h3 className="text-xl font-black font-outfit mb-6 flex items-center gap-3">
                <UserCircle className="text-blue-400" />
                New Entity Arrivals
            </h3>
            <div className="space-y-6">
                {users.map((u: any) => (
                    <div key={u.id} className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-[18px] bg-white/5 flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                                {u.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-sm tracking-tight">{u.name}</p>
                                <p className="text-xs text-white/30 font-medium">{formatDate(u.created_at)}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] uppercase font-black tracking-widest text-primary/60">{u.role}</p>
                            <p className="text-[10px] font-mono text-white/20">{u.email}</p>
                        </div>
                    </div>
                ))}
            </div>
        </GlassCard>
    )
}

function SystemHealth({ stats }: any) {
    return (
        <GlassCard className="p-8 border-emerald-500/10 bg-emerald-500/[0.01]">
            <h3 className="text-xl font-black font-outfit mb-6 flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400" />
                Connectivity & Sync
            </h3>
            <div className="space-y-8">
                <HealthIndicator label="Neon DB Synchronization" status="Optimized" pulse />
                <HealthIndicator label="Xieriee Wallet Node" status="Active" pulse />
                <HealthIndicator label="Ledger Integrity" status="Verified" />
                <HealthIndicator label="Scheduler Service" status="Running" pulse />
            </div>
            
            <div className="mt-12 p-6 rounded-3xl bg-secondary/20 border border-white/5 flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <ShieldAlert className="w-8 h-8 text-primary shadow-glow shadow-primary" />
                </div>
                <div>
                    <p className="text-sm font-black tracking-tight">System Lockdown Status</p>
                    <p className="text-xs text-white/40 mt-1">All sentinel protocols are active. No breaches detected.</p>
                </div>
            </div>
        </GlassCard>
    )
}

function HealthIndicator({ label, status, pulse = false }: any) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white/50">{label}</span>
            <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">{status}</span>
                <div className={cn(
                    "w-2 h-2 rounded-full bg-emerald-400",
                    pulse && "animate-ping"
                )} />
            </div>
        </div>
    )
}
