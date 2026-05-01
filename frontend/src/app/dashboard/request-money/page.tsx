"use client"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { QrCode, Link as LinkIcon, Check, Copy, ArrowRight, Wallet, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

export default function RequestMoneyPage() {
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [loading, setLoading] = useState(false)
    const [generatedLink, setGeneratedLink] = useState("")
    const [copied, setCopied] = useState(false)

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(endpoints.paymentRequests.create, {
                amount: numAmount,
                note: note || undefined
            });

            if (res.data.success) {
                const token = res.data.paymentRequest.token;
                const link = `${window.location.origin}/pay/${token}`;
                setGeneratedLink(link);
                toast.success("Magic Link Generated", {
                    icon: '✨',
                });
            } else {
                toast.error(res.data.message || "Failed to generate link");
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to generate magic link");
        } finally {
            setLoading(false);
        }
    }

    const copyToClipboard = () => {
        if (!generatedLink) return;
        navigator.clipboard.writeText(generatedLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied to clipboard");
    }

    return (
        <div className="space-y-6 md:space-y-10 max-w-4xl mx-auto pb-20 md:pb-10">
            <header>
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h1 className="text-4xl font-black font-outfit tracking-tight">Request Money</h1>
                    <p className="text-white/50 mt-2 font-medium">Generate a secure Magic Link to get paid instantly.</p>
                </motion.div>
            </header>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Generation Form */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <GlassCard className="p-8">
                        <form onSubmit={handleGenerate} className="space-y-6">
                            
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50">Amount to Request</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <span className="text-xl font-medium text-white/50">$</span>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-10 pr-4 text-3xl font-outfit font-black tracking-tighter text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        step="0.01"
                                        min="0.01"
                                        required
                                        disabled={!!generatedLink}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-widest text-white/50">Note (Optional)</label>
                                <textarea
                                    placeholder="What is this for? e.g. Dinner, Freelance work..."
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all resize-none h-24"
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    disabled={!!generatedLink}
                                />
                            </div>

                            {!generatedLink ? (
                                <Button 
                                    type="submit" 
                                    className="w-full py-6 text-base font-bold tracking-wide"
                                    isLoading={loading}
                                >
                                    Generate Magic Link
                                </Button>
                            ) : (
                                <Button 
                                    variant="outline"
                                    type="button" 
                                    className="w-full py-6 text-base"
                                    onClick={() => {
                                        setGeneratedLink("");
                                        setAmount("");
                                        setNote("");
                                    }}
                                >
                                    Create Another Request
                                </Button>
                            )}
                        </form>
                    </GlassCard>
                </motion.div>

                {/* Status / Link Display */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <AnimatePresence mode="popLayout">
                        {!generatedLink ? (
                            <motion.div 
                                key="info"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="h-full"
                            >
                                <GlassCard className="h-full flex flex-col items-center justify-center p-10 text-center border-dashed border-white/10 bg-white/[0.02]">
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 ring-1 ring-white/10">
                                        <Wallet className="w-8 h-8 text-white/30" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">How it works</h3>
                                    <p className="text-white/50 text-sm leading-relaxed mb-8">
                                        Generate a unique, secure link for a specific amount. Share it with anyone, and they can pay you instantly.
                                    </p>
                                    <div className="space-y-4 w-full">
                                        <div className="flex items-center gap-3 text-sm text-white/70">
                                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</div>
                                            <span>Set amount and note</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/70">
                                            <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-bold">2</div>
                                            <span>Share the secure link</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-white/70">
                                            <div className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">3</div>
                                            <span>Get paid directly to your Core</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-full"
                            >
                                <GlassCard glow className="h-full p-8 flex flex-col border-emerald-500/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent" />
                                    
                                    <div className="relative flex-1 flex flex-col">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                                <Check className="w-5 h-5" />
                                            </div>
                                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">
                                                Link Ready to Share
                                            </h3>
                                        </div>

                                        <p className="text-sm tracking-wide text-white/60 mb-4">
                                            Anyone with this link can fulfill your request for <span className="font-bold text-white">${amount}</span>.
                                        </p>

                                        <div className="mt-auto space-y-4">
                                            <div 
                                                onClick={copyToClipboard}
                                                className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all group active:scale-[0.98]"
                                            >
                                                <div className="truncate pr-4 font-mono text-sm text-white/70 group-hover:text-white transition-colors">
                                                    {generatedLink.replace('https://', '')}
                                                </div>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0",
                                                    copied ? "bg-emerald-500 text-white" : "bg-white/10 text-white group-hover:bg-white/20"
                                                )}>
                                                    {copied ? <Check size={14} /> : <Copy size={14} />}
                                                </div>
                                            </div>

                                            <Button 
                                                variant="outline" 
                                                className="w-full"
                                                leftIcon={<QrCode size={16} />}
                                                onClick={() => toast.success("QR Code generation coming soon!")}
                                            >
                                                Show QR Code
                                            </Button>
                                        </div>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    )
}
