"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Copy, Check, CreditCard, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import toast from "react-hot-toast"

interface VirtualCardProps {
    card: {
        id: number
        card_number: string
        cvv: string
        expiry_date: string
        name_on_card: string
        type: string
        status: string
    }
    className?: string
}

export default function VirtualCard({ card, className }: VirtualCardProps) {
    const [showDetails, setShowDetails] = useState(false)
    const [copied, setCopied] = useState<string | null>(null)

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text)
        setCopied(label)
        toast.success(`${label} copied`)
        setTimeout(() => setCopied(null), 2000)
    }

    const formatCardNumber = (num: string) => {
        return num.replace(/(.{4})/g, "$1 ").trim()
    }

    const maskCardNumber = (num: string) => {
        return `•••• •••• •••• ${num.slice(-4)}`
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "relative w-full aspect-[1.586/1] rounded-[24px] overflow-hidden p-8 flex flex-col justify-between text-white shadow-2xl group",
                card.status === 'active' 
                    ? "bg-gradient-to-br from-[#1a1c2e] via-[#0d0f1a] to-[#0a0f18] border border-white/10" 
                    : "bg-gray-900/50 grayscale border border-white/5",
                className
            )}
        >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-colors" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/2 group-hover:bg-emerald-500/10 transition-colors" />

            {/* Header */}
            <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                        <span className="text-[10px] uppercase font-black tracking-[0.2em] text-primary">
                            {card.type} Virtual Card
                        </span>
                    </div>
                </div>
                <div className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                    <span className="text-xl font-black italic">X</span>
                </div>
            </div>

            {/* Card Number */}
            <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between">
                    <p className="text-2xl md:text-3xl font-mono tracking-[0.2em] font-medium">
                        {showDetails ? formatCardNumber(card.card_number) : maskCardNumber(card.card_number)}
                    </p>
                    <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        {showDetails ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {/* Bottom Info */}
            <div className="flex justify-between items-end relative z-10">
                <div className="space-y-4">
                    <div className="flex gap-8">
                        <div>
                            <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1">Expiry</p>
                            <p className="text-sm font-bold font-mono tracking-wider">{card.expiry_date}</p>
                        </div>
                        <div>
                            <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1">CVV</p>
                            <p className="text-sm font-bold font-mono tracking-wider">
                                {showDetails ? card.cvv : "•••"}
                            </p>
                        </div>
                    </div>
                    <div>
                        <p className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-1">Card Holder</p>
                        <p className="text-sm font-black uppercase tracking-wide">{card.name_on_card}</p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                    <button
                        onClick={() => copyToClipboard(card.card_number, "Card Number")}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-[10px] font-bold uppercase tracking-wider"
                    >
                        {copied === "Card Number" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                        {copied === "Card Number" ? "Copied" : "Copy"}
                    </button>
                    <div className="flex items-center gap-1.5 opacity-50">
                        <div className="w-6 h-4 bg-orange-500 rounded-sm" />
                        <div className="w-6 h-4 bg-yellow-500 rounded-sm" />
                    </div>
                </div>
            </div>

            {/* Status Overlay if canceled */}
            {card.status === 'canceled' && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <div className="px-6 py-2 border-2 border-red-500 text-red-500 rounded-full font-black uppercase tracking-[0.5em] rotate-[-15deg]">
                        TERMED
                    </div>
                </div>
            )}
        </motion.div>
    )
}
