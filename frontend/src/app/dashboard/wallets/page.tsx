"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Globe, 
    RefreshCcw, 
    ArrowRight, 
    TrendingUp, 
    Wallet, 
    Loader2, 
    CheckCircle2,
    Info,
    ArrowUpDown
} from "lucide-react"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { cn, formatCurrency } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"

export default function WalletsPage({ user }: { user?: any }) {
    const [loading, setLoading] = useState(true)
    const [converting, setConverting] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [rates, setRates] = useState<any>({})
    const [lastUpdated, setLastUpdated] = useState<string>("")
    
    const [step, setStep] = useState(1) // 1: Select, 2: Preview, 3: Success
    const [fromAccount, setFromAccount] = useState<any>(null)
    const [toAccount, setToAccount] = useState<any>(null)
    const [amount, setAmount] = useState("")
    const [preview, setPreview] = useState<any>(null)

    useEffect(() => {
        fetchData()
        const interval = setInterval(fetchRates, 30000) // Refresh rates every 30s
        return () => clearInterval(interval)
    }, [])

    const fetchData = async () => {
        try {
            const [accsRes, ratesRes] = await Promise.all([
                api.get(endpoints.accounts.list),
                api.get(endpoints.exchange.rates("INR"))
            ])
            setAccounts(accsRes.data.accounts || [])
            setRates(ratesRes.data.rates || {})
            setLastUpdated(new Date().toLocaleTimeString())
        } catch (error) {
            toast.error("Failed to load wallet data")
        } finally {
            setLoading(false)
        }
    }

    const fetchRates = async () => {
        try {
            const res = await api.get(endpoints.exchange.rates("INR"))
            setRates(res.data.rates)
            setLastUpdated(new Date().toLocaleTimeString())
        } catch (r) {
            console.warn("Could not refresh rates")
        }
    }

    const handlePreview = async () => {
        if (!fromAccount || !toAccount || !amount) {
            toast.error("Please select wallets and amount")
            return
        }

        if (fromAccount.id === toAccount.id) {
            toast.error("Source and destination wallets must be different")
            return
        }

        if (parseFloat(amount) > fromAccount.balance) {
            toast.error("Insufficient balance")
            return
        }

        setConverting(true)
        try {
            const res = await api.post(endpoints.exchange.preview, {
                from: fromAccount.currency,
                to: toAccount.currency,
                amount: parseFloat(amount)
            })
            setPreview(res.data)
            setStep(2)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setConverting(false)
        }
    }

    const handleExecute = async () => {
        setConverting(true)
        try {
            await api.post(endpoints.exchange.execute, {
                fromAccountId: fromAccount.id,
                toAccountId: toAccount.id,
                amount: parseFloat(amount)
            })
            toast.success("Conversion successful!")
            setStep(3)
            await fetchData()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setConverting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-primary" />
                        <span className="text-[10px] uppercase font-black tracking-[0.3em] text-primary">Global Infrastructure</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Multi-Currency Wallets</h1>
                    <p className="text-muted-foreground font-medium">Hold and convert assets across the global network.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <TrendingUp className="text-emerald-500 w-4 h-4" />
                    <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground leading-none">Market Open</p>
                        <p className="text-xs font-bold font-mono">Rates updated {lastUpdated}</p>
                    </div>
                    <RefreshCcw 
                        className={cn("w-4 h-4 text-white/40 cursor-pointer hover:text-white transition-colors", converting && "animate-spin")} 
                        onClick={fetchRates}
                    />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Active Wallets Grid */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {accounts.map((acc, index) => (
                        <motion.div
                            key={acc.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-[#0d111a] border border-white/10 rounded-[32px] p-8 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/10 transition-colors" />
                            
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black text-sm border border-white/10 group-hover:border-primary/30 transition-colors">
                                    {acc.currency}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{acc.account_type}</p>
                            </div>

                            <div className="space-y-1 relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Available Balance</p>
                                <p className="text-3xl font-black tracking-tighter font-mono">
                                    {parseFloat(acc.balance).toLocaleString('en-US', { style: 'currency', currency: acc.currency })}
                                </p>
                            </div>

                            <div className="mt-8 flex items-center gap-2 relative z-10">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Live Asset</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Exchange Interface */}
                <div className="lg:col-span-8">
                    <GlassCard className="p-8 md:p-12 border-white/5">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-10"
                                >
                                    <div className="flex items-center gap-4 border-b border-white/5 pb-8 mb-8">
                                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                            <RefreshCcw className="text-primary w-6 h-6" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black tracking-tight">Instant Conversion</h2>
                                            <p className="text-sm text-muted-foreground font-medium">Atomic swap across global fiat rails.</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-[1fr,60px,1fr] items-center gap-6">
                                        {/* From Wallet */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Source Wallet</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                                onChange={(e) => setFromAccount(accounts.find(a => a.id.toString() === e.target.value))}
                                                value={fromAccount?.id || ""}
                                            >
                                                <option value="" className="bg-[#121212]">Select Source...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id} className="bg-[#121212]">
                                                        {acc.currency} Wallet ({parseFloat(acc.balance).toLocaleString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="flex justify-center md:pt-6">
                                            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center rotate-90 md:rotate-0">
                                                <ArrowRight size={20} className="text-muted-foreground" />
                                            </div>
                                        </div>

                                        {/* To Wallet */}
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Target Wallet</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 font-bold outline-none focus:border-primary/50 appearance-none cursor-pointer"
                                                onChange={(e) => setToAccount(accounts.find(a => a.id.toString() === e.target.value))}
                                                value={toAccount?.id || ""}
                                            >
                                                <option value="" className="bg-[#121212]">Select Target...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id} className="bg-[#121212]">
                                                        {acc.currency} Wallet ({parseFloat(acc.balance).toLocaleString()})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-muted-foreground px-1">Amount to Convert</label>
                                        <div className="relative group">
                                            <input 
                                                type="number"
                                                placeholder="0.00"
                                                className="w-full h-24 bg-white/5 border border-white/10 rounded-[28px] px-10 text-5xl font-black outline-none focus:border-primary/50 transition-all tracking-tighter"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                            />
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                                                {fromAccount?.currency}
                                            </div>
                                        </div>
                                    </div>

                                    <Button 
                                        size="lg" 
                                        className="w-full py-10 rounded-[32px] text-2xl font-black shadow-xl shadow-primary/20"
                                        onClick={handlePreview}
                                        isLoading={converting}
                                    >
                                        Review Conversion
                                    </Button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="space-y-10"
                                >
                                    <div className="text-center space-y-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Conversion Quote</p>
                                        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 py-8 bg-white/5 rounded-[40px] border border-white/5 relative">
                                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                                            
                                            <div className="text-center md:text-right">
                                                <p className="text-sm font-bold text-muted-foreground mb-1">{fromAccount.currency}</p>
                                                <p className="text-4xl font-black tracking-tighter">{parseFloat(amount).toLocaleString()}</p>
                                            </div>

                                            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center border border-primary/20">
                                                <ArrowRight className="text-primary" />
                                            </div>

                                            <div className="text-center md:text-left">
                                                <p className="text-sm font-bold text-emerald-400 mb-1">{toAccount.currency}</p>
                                                <p className="text-4xl font-black tracking-tighter text-emerald-400">{parseFloat(preview?.targetAmount).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Exchange Rate</p>
                                            <p className="font-bold">1 {fromAccount.currency} = {preview?.rate} {toAccount.currency}</p>
                                        </div>
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Network Fee</p>
                                            <p className="font-bold text-emerald-500">₹ 0.00 (Zero-Fee Core)</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                        <Button variant="outline" size="lg" className="flex-1 h-16 rounded-2xl font-bold" onClick={() => setStep(1)}>
                                            Cancel
                                        </Button>
                                        <Button size="lg" className="flex-[2] h-16 rounded-2xl font-black text-lg" onClick={handleExecute} isLoading={converting}>
                                            Confirm Conversion
                                        </Button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center space-y-8 py-10"
                                >
                                    <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-xl shadow-emerald-500/10">
                                        <CheckCircle2 size={48} className="text-emerald-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-4xl font-black tracking-tight">Swap Complete</h2>
                                        <p className="text-muted-foreground max-w-sm mx-auto font-medium">Assets have been rerouted through our global liquidity pools.</p>
                                    </div>
                                    <div className="max-w-md mx-auto p-6 bg-white/5 rounded-3xl border border-white/10 grid grid-cols-2 gap-4">
                                        <div className="text-left space-y-1">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Settled</p>
                                            <p className="font-bold">{toAccount.currency} {parseFloat(preview?.targetAmount).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right space-y-1">
                                            <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Deducted</p>
                                            <p className="font-bold">{fromAccount.currency} {parseFloat(amount).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <Button size="lg" variant="outline" className="h-16 px-10 rounded-2xl" onClick={() => {
                                        setStep(1)
                                        setAmount("")
                                        setFromAccount(null)
                                        setToAccount(null)
                                    }}>
                                        New Operation
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </GlassCard>
                </div>

                {/* Right Side Info */}
                <div className="lg:col-span-4 space-y-6">
                    <GlassCard className="p-8 border-emerald-500/10 h-full">
                        <h3 className="text-xl font-black tracking-tight mb-6">Market Watch</h3>
                        <div className="space-y-6">
                            {Object.entries(rates).map(([curr, rate]: any) => (
                                <div key={curr} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-[10px] font-black group-hover:bg-primary transition-colors group-hover:text-primary-foreground">
                                            {curr}
                                        </div>
                                        <span className="font-bold text-sm">INR / {curr}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono text-sm font-bold">{rate.toFixed(4)}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold justify-end">
                                            <TrendingUp size={10} />
                                            +0.{Math.floor(Math.random() * 9)}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 border-t border-white/5 space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <Info className="text-primary w-5 h-5 flex-shrink-0 mt-0.5" />
                                <p className="text-[10px] leading-relaxed text-muted-foreground font-medium uppercase tracking-wide">
                                    Conversions are atomic and settled in real-time. Minimum amount is 1.00 unit of source currency.
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
