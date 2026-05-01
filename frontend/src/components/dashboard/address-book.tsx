"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookUser, Plus, Trash2, ArrowRightLeft } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

const CATEGORIES = ["General", "Family", "Business", "Rent", "Utilities", "Savings"]

const CATEGORY_COLORS: Record<string, string> = {
    General: "text-white/60 bg-white/5",
    Family: "text-pink-400 bg-pink-500/10",
    Business: "text-blue-400 bg-blue-500/10",
    Rent: "text-amber-400 bg-amber-500/10",
    Utilities: "text-emerald-400 bg-emerald-500/10",
    Savings: "text-purple-400 bg-purple-500/10",
}

function getInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function AddressBook() {
    const [beneficiaries, setBeneficiaries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [form, setForm] = useState({ name: "", accountNumber: "", bankName: "", category: "General" })

    useEffect(() => { fetchBeneficiaries() }, [])

    const fetchBeneficiaries = async () => {
        try {
            const res = await api.get('beneficiaries')
            setBeneficiaries(res.data.beneficiaries || [])
        } catch (err: any) {
            console.error("Fetch beneficiaries error:", err)
            toast.error(err.message || "Failed to load address book")
        } finally {
            setLoading(false)
        }
    }

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await api.post('beneficiaries', form)
            toast.success(`${form.name} added to your address book`)
            setShowAdd(false)
            setForm({ name: "", accountNumber: "", bankName: "", category: "General" })
            fetchBeneficiaries()
        } catch (err: any) {
            toast.error(err.message || "Failed to add beneficiary")
        }
    }

    const handleDelete = async (id: number, name: string) => {
        try {
            await api.delete(`beneficiaries/${id}`)
            toast.success(`${name} removed`)
            fetchBeneficiaries()
        } catch (err: any) {
            toast.error(err.message || "Failed to remove beneficiary")
        }
    }

    if (loading) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <BookUser className="w-5 h-5 text-blue-400" />
                    <h2 className="text-2xl font-black font-outfit tracking-tight">Address Book</h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdd(!showAdd)}
                    className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white"
                >
                    {showAdd ? "Cancel" : "Add Contact"}
                </Button>
            </div>

            <AnimatePresence>
                {showAdd && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <GlassCard className="p-6 border-blue-500/20 bg-blue-500/5 mb-6">
                            <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Account Number / UUID"
                                    value={form.accountNumber}
                                    onChange={e => setForm({ ...form, accountNumber: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Bank Name (optional)"
                                    value={form.bankName}
                                    onChange={e => setForm({ ...form, bankName: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                />
                                <select
                                    value={form.category}
                                    onChange={e => setForm({ ...form, category: e.target.value })}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                                <div className="md:col-span-2">
                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold">
                                        Save Contact
                                    </Button>
                                </div>
                            </form>
                        </GlassCard>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beneficiaries.map((b, i) => (
                    <motion.div
                        key={b.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                    >
                        <GlassCard className="p-5 flex items-center gap-4 group hover:bg-white/5 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-black text-white">{getInitials(b.name)}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-white truncate">{b.name}</p>
                                <p className="text-[10px] font-mono text-white/30 truncate">{b.account_number}</p>
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${CATEGORY_COLORS[b.category] || CATEGORY_COLORS.General}`}>
                                    {b.category}
                                </span>
                            </div>
                            <div className="flex flex-col items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href={`/dashboard/transfer?to=${b.account_number}`}>
                                    <button className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-colors">
                                        <ArrowRightLeft size={14} />
                                    </button>
                                </Link>
                                <button
                                    onClick={() => handleDelete(b.id, b.name)}
                                    className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}

                {beneficiaries.length === 0 && !showAdd && (
                    <GlassCard
                        className="p-10 border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all text-center"
                        onClick={() => setShowAdd(true)}
                    >
                        <BookUser className="w-8 h-8 text-white/10 mb-3" />
                        <p className="text-white/30 font-medium text-sm">No saved contacts.<br/>Add frequent recipients for faster transfers.</p>
                    </GlassCard>
                )}
            </div>
        </div>
    )
}
