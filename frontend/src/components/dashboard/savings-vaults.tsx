"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, PiggyBank, Target, ArrowRight, Trash2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import toast from "react-hot-toast"

export function SavingsVaults() {
    const [vaults, setVaults] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [newName, setNewName] = useState("")
    const [newTarget, setNewTarget] = useState("")

    useEffect(() => {
        fetchVaults()
    }, [])

    const fetchVaults = async () => {
        try {
            const res = await api.get('vaults')
            setVaults(res.data.vaults || [])
        } catch (error: any) {
            console.error("Fetch vaults error:", error)
            toast.error(error.message || "Failed to load savings vaults")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('vaults', {
                name: newName,
                targetAmount: parseFloat(newTarget),
                emoji: "🎯"
            })
            toast.success("Vault created successfully!")
            setShowCreate(false)
            setNewName("")
            setNewTarget("")
            fetchVaults()
        } catch (error: any) {
            toast.error(error.message || "Failed to create vault")
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure? Funds will be returned to your account.")) return
        try {
            await api.delete(`vaults/${id}`)
            toast.success("Vault deleted")
            fetchVaults()
        } catch (error) {
            toast.error("Failed to delete vault")
        }
    }

    if (loading) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <PiggyBank className="w-5 h-5 text-pink-400" />
                    <h2 className="text-2xl font-black font-outfit tracking-tight">Savings Vaults</h2>
                </div>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowCreate(!showCreate)}
                    className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white"
                >
                    {showCreate ? "Cancel" : "New Vault"}
                </Button>
            </div>

            <AnimatePresence>
                {showCreate && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-6 border-pink-500/20 bg-pink-500/5 mb-6">
                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input 
                                    type="text" 
                                    placeholder="Vault Name (e.g. MacBook Pro)"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                    required
                                />
                                <input 
                                    type="number" 
                                    placeholder="Target Amount"
                                    value={newTarget}
                                    onChange={(e) => setNewTarget(e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                    required
                                />
                                <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white font-bold">
                                    Initialize Vault
                                </Button>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vaults.map((vault) => {
                    const progress = Math.min((parseFloat(vault.current_amount) / parseFloat(vault.target_amount)) * 100, 100) || 0
                    return (
                        <motion.div key={vault.id} layout>
                            <GlassCard className="p-6 hover:bg-white/5 transition-all group flex flex-col justify-between min-h-[180px]">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-xl">
                                            {vault.emoji}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white group-hover:text-pink-400 transition-colors">{vault.name}</h3>
                                            <p className="text-[10px] uppercase font-black tracking-widest text-white/30">Savings Goal</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleDelete(vault.id)}
                                        className="text-white/10 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="space-y-3 mt-6">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-white/60">{formatCurrency(vault.current_amount)}</span>
                                        <span className="text-white/30">{formatCurrency(vault.target_amount)}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            className="h-full bg-gradient-to-r from-pink-500 to-rose-500"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tighter">
                                        <span className="text-pink-400">{progress.toFixed(0)}% Complete</span>
                                        <span className="text-white/20">{formatCurrency(parseFloat(vault.target_amount) - parseFloat(vault.current_amount))} left</span>
                                    </div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    )
                })}

                {vaults.length === 0 && !showCreate && (
                    <GlassCard 
                        className="p-8 border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-center"
                        onClick={() => setShowCreate(true)}
                    >
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Plus className="w-6 h-6 text-white/20" />
                        </div>
                        <p className="text-white/40 font-medium text-sm">No savings vaults active.<br/>Start rounding up your changes today.</p>
                    </GlassCard>
                )}
            </div>
        </div>
    )
}
