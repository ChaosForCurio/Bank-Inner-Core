"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { 
    PieChart, Pie, Cell, 
    ResponsiveContainer, Tooltip as RechartsTooltip,
    LineChart, Line, XAxis, YAxis, CartesianGrid
} from "recharts"
import { GlassCard } from "@/components/ui/glass-card"
import { api, endpoints } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { TrendingUp, PieChart as PieChartIcon, Activity } from "lucide-react"

const COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f87171', '#818cf8', '#fbbf24'];

export function WealthOverview() {
    const [spendingData, setSpendingData] = useState<any[]>([])
    const [historyData, setHistoryData] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const [spendingRes, historyRes] = await Promise.all([
                    api.get("analytics/spending"),
                    api.get("analytics/history")
                ])
                setSpendingData(spendingRes.data.data || [])
                setHistoryData(historyRes.data.data.map((item: any) => ({
                    ...item,
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                })))
            } catch (error) {
                console.error("Failed to fetch analytics:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAnalytics()
    }, [])

    if (loading) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Spending by Category */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <GlassCard className="p-6 h-[400px] border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                            <PieChartIcon className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-bold font-outfit">Spending Insights</h3>
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={spendingData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="total_amount"
                                    nameKey="category"
                                >
                                    {spendingData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        background: 'rgba(0,0,0,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-4 mt-2">
                        {spendingData.slice(0, 4).map((item, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{item.category}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </motion.div>

            {/* Balance History */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <GlassCard className="p-6 h-[400px] border-white/5 bg-white/[0.02]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                <Activity className="w-5 h-5" />
                            </div>
                            <h3 className="text-xl font-bold font-outfit">Liquidity Trend</h3>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                            <TrendingUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] font-black text-emerald-400">OPTIMAL</span>
                        </div>
                    </div>

                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={historyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                                    dy={10}
                                />
                                <YAxis hide />
                                <RechartsTooltip 
                                    contentStyle={{ 
                                        background: 'rgba(0,0,0,0.8)', 
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)'
                                    }}
                                    formatter={(value: any) => formatCurrency(value)}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey="total_balance" 
                                    stroke="#34d399" 
                                    strokeWidth={4}
                                    dot={false}
                                    activeDot={{ r: 6, fill: '#34d399', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    )
}
