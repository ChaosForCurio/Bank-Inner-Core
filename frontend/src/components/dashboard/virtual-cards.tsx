"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CreditCard, Flame, Copy, Check, EyeOff, Eye, PlusCircle } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

function maskCardNumber(num: string, reveal: boolean) {
    if (!num) return "•••• •••• •••• ••••"
    const chunks = num.match(/.{1,4}/g) || []
    if (reveal) return chunks.join(' ')
    return `${chunks[0]} •••• •••• ${chunks[3]}`
}

export function VirtualCards() {
    const [cards, setCards] = useState<any[]>([])
    const [accounts, setAccounts] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreate, setShowCreate] = useState(false)
    const [revealedCards, setRevealedCards] = useState<Set<number>>(new Set())
    const [copiedId, setCopiedId] = useState<number | null>(null)
    const [form, setForm] = useState({ accountId: "", nameOnCard: "", type: "disposable" })

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        try {
            const [cardsRes, accRes] = await Promise.all([
                api.get('virtual-cards'),
                api.get('account')
            ])
            setCards(cardsRes.data.cards || [])
            setAccounts(accRes.data.accounts || [])
        } catch (err: any) {
            console.error("Fetch cards error:", err)
            toast.error(err.message || "Failed to load virtual cards")
        } finally {
            setLoading(false)
        }
    }

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const endpoint = form.type === 'burner' ? 'virtual-cards/burner' : 'virtual-cards'
            await api.post(endpoint, form)
            toast.success(form.type === 'burner' ? "🔥 Burner card created! Use it once." : "Card generated!")
            setShowCreate(false)
            setForm({ accountId: "", nameOnCard: "", type: "disposable" })
            fetchData()
        } catch (err: any) {
            toast.error(err.message || "Failed to create card")
        }
    }

    const toggleReveal = (id: number) => {
        setRevealedCards(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const copyCard = (num: string, id: number) => {
        navigator.clipboard.writeText(num)
        setCopiedId(id)
        toast.success("Card number copied")
        setTimeout(() => setCopiedId(null), 2000)
    }

    const handleCancel = async (id: number) => {
        try {
            await api.patch(`/api/virtual-cards/${id}/status`, { status: 'canceled' })
            toast.success("Card cancelled")
            fetchData()
        } catch {
            toast.error("Failed to cancel card")
        }
    }

    if (loading) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                    <h2 className="text-2xl font-black font-outfit tracking-tight">Virtual Cards</h2>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full">Premium</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCreate(!showCreate)}
                    className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white"
                >
                    {showCreate ? "Cancel" : "New Card"}
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
                        <GlassCard className="p-6 border-purple-500/20 bg-purple-500/5 mb-4">
                            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Name on Card"
                                    value={form.nameOnCard}
                                    onChange={e => setForm({ ...form, nameOnCard: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                    required
                                />
                                <select
                                    value={form.accountId}
                                    onChange={e => setForm({ ...form, accountId: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                    required
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.account_type} — {acc.account_number}</option>
                                    ))}
                                </select>
                                <select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                >
                                    <option value="disposable">Standard Disposable</option>
                                    <option value="burner">🔥 Single-Use Burner</option>
                                </select>
                                <div className="md:col-span-3">
                                    <Button type="submit" className={cn("w-full font-bold", form.type === 'burner' ? "bg-orange-500 hover:bg-orange-600" : "bg-purple-600 hover:bg-purple-700")}>
                                        {form.type === 'burner' ? "🔥 Generate Burner Card" : "Generate Card"}
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card, i) => {
                    const isBurner = card.type === 'burner'
                    const isRevealed = revealedCards.has(card.id)
                    const isCopied = copiedId === card.id

                    return (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className={cn(
                                "relative rounded-[24px] p-6 overflow-hidden border",
                                isBurner
                                    ? "bg-gradient-to-br from-orange-900/40 via-red-900/30 to-rose-900/40 border-orange-500/20"
                                    : "bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-blue-900/40 border-purple-500/20"
                            )}>
                                {/* Background decoration */}
                                <div className="absolute top-0 right-0 opacity-5 transform translate-x-4 -translate-y-4 pointer-events-none">
                                    <CreditCard size={160} strokeWidth={0.5} />
                                </div>

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30">
                                            {isBurner ? "🔥 Single-Use Burner" : "Virtual Card"}
                                        </p>
                                        <p className="text-xs font-bold text-white/60 mt-0.5">{card.name_on_card}</p>
                                    </div>
                                    <span className={cn(
                                        "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border",
                                        card.status === 'active'
                                            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                            : "text-red-400 bg-red-500/10 border-red-500/20"
                                    )}>
                                        {card.status}
                                    </span>
                                </div>

                                {/* Card Number */}
                                <div className="font-mono text-xl font-bold text-white tracking-widest mb-6">
                                    {maskCardNumber(card.card_number, isRevealed)}
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[9px] text-white/30 uppercase tracking-widest">Expires</p>
                                        <p className="text-sm font-bold text-white/70">{card.expiry_date}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => toggleReveal(card.id)}
                                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                        >
                                            {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        <button
                                            onClick={() => copyCard(card.card_number, card.id)}
                                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                        >
                                            {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        </button>
                                        {card.status === 'active' && (
                                            <button
                                                onClick={() => handleCancel(card.id)}
                                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center text-white/20 hover:text-red-400 transition-all"
                                                title="Cancel Card"
                                            >
                                                <span className="text-xs font-black">✕</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )
                })}

                {cards.length === 0 && !showCreate && (
                    <GlassCard
                        className="p-10 border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-center md:col-span-2"
                        onClick={() => setShowCreate(true)}
                    >
                        <PlusCircle className="w-8 h-8 text-white/10 mb-3" />
                        <p className="text-white/30 font-medium text-sm">No virtual cards issued.<br/>Generate a disposable or single-use burner card.</p>
                    </GlassCard>
                )}
            </div>
        </div>
    )
}
