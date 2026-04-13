"use client"
import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Send, 
    Search, 
    ArrowRight, 
    Wallet, 
    CheckCircle2, 
    Loader2, 
    ChevronDown, 
    ArrowLeft, 
    Fingerprint,
    Info,
    Receipt,
    Download,
    Calendar,
    UserPlus,
    Clock
} from "lucide-react"
import { formatCurrency, formatDate, debounce } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

export default function TransferPage({ user }: { user?: any }) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [accounts, setAccounts] = useState<any[]>([])
    const [selectedAccount, setSelectedAccount] = useState<any>(null)
    const [accountsLoading, setAccountsLoading] = useState(true)
    const [formData, setFormData] = useState({
        toAccount: "",
        toUserUuid: "",
        amount: "",
        idempotencyKey: `tx_${Date.now()}`
    })
    const [transferType, setTransferType] = useState<"account" | "uuid">("account")
    const [recipientName, setRecipientName] = useState<string | null>(null)
    const [resolvingUuid, setResolvingUuid] = useState(false)
    const [beneficiaries, setBeneficiaries] = useState<any[]>([])
    const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>("")
    const [isScheduled, setIsScheduled] = useState(false)
    const [scheduleDate, setScheduleDate] = useState("")
    const [scheduleFrequency, setScheduleFrequency] = useState("once")
    const [recentResult, setRecentResult] = useState<any>(null)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [accountsRes, beneficiariesRes] = await Promise.all([
                    api.get(endpoints.accounts.list),
                    api.get('beneficiaries')
                ])
                const accountsData = accountsRes.data.accounts || []
                setAccounts(accountsData)
                setBeneficiaries(beneficiariesRes.data.beneficiaries || [])
                if (accountsData.length > 0) {
                    setSelectedAccount(accountsData[0])
                }
            } catch (error: any) {
                console.warn("Failed to fetch data:", error?.message || "Unknown error")
                toast.error("Could not load accounts or beneficiaries")
            } finally {
                setAccountsLoading(false)
            }
        }
        fetchInitialData()
    }, [])

    // Debounced lookup function
    const debouncedLookup = useCallback(
        debounce(async (uuid: string) => {
            if (uuid.length < 8) {
                setRecipientName(null)
                return
            }
            setResolvingUuid(true)
            try {
                const response = await api.get(endpoints.users!.lookup(uuid))
                if (response.data.status === "success") {
                    setRecipientName(response.data.user.name)
                } else {
                    setRecipientName(null)
                }
            } catch (error) {
                setRecipientName(null)
            } finally {
                setResolvingUuid(false)
            }
        }, 500),
        []
    )

    useEffect(() => {
        if (transferType === "uuid" && formData.toUserUuid) {
            debouncedLookup(formData.toUserUuid)
        }
    }, [formData.toUserUuid, transferType, debouncedLookup])

    const handleNext = () => {
        if (!selectedAccount) {
            toast.error("Please select a source account")
            return
        }

        if (transferType === "account" && !formData.toAccount) {
            toast.error("Please enter a destination account ID")
            return
        }

        if (transferType === "uuid" && !formData.toUserUuid) {
            toast.error("Please enter a User UUID")
            return
        }

        if (transferType === "uuid" && !recipientName && !resolvingUuid) {
            toast.error("Recipient not found")
            return
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            toast.error("Please enter a valid amount")
            return
        }

        if (parseFloat(formData.amount) > selectedAccount.balance) {
            toast.error("Insufficient balance")
            return
        }
        if (isScheduled && !scheduleDate) {
            toast.error("Please select a date for the scheduled transfer")
            return
        }

        setStep(2)
    }

    const handleTransfer = async () => {
        setLoading(true)
        try {
            if (isScheduled) {
                const payload = {
                    fromAccount: selectedAccount.id,
                    toAccount: transferType === "account" ? formData.toAccount : undefined,
                    toUserUuid: transferType === "uuid" ? formData.toUserUuid : undefined,
                    amount: parseFloat(formData.amount),
                    scheduledFor: scheduleDate,
                    frequency: scheduleFrequency
                }
                await api.post('scheduled-transfers', payload)
                toast.success("Transfer scheduled successfully")
                setStep(3)
                setRecentResult({ status: 'scheduled' })
                return
            }

            const payload: any = {
                fromAccount: selectedAccount.id,
                amount: parseFloat(formData.amount),
                type: "transfer",
                idempotencyKey: formData.idempotencyKey
            }

            if (transferType === "account") {
                payload.toAccount = formData.toAccount
            } else {
                payload.toUserUuid = formData.toUserUuid
            }

            const response = await api.post(endpoints.transactions.create, payload)
            setRecentResult(response.data.data)
            toast.success("Funds transferred successfully")
            setStep(3)
        } catch (error: any) {
            toast.error(error.message || "Transfer failed")
        } finally {
            setLoading(false)
        }
    }

    const handleDownloadReceipt = async () => {
        if (!recentResult?.id) {
            toast.error("No transaction found")
            return
        }

        try {
            const response = await api.get(endpoints.transactions.details(recentResult.id))
            const { transaction } = response.data

            const receiptContent = `
=========================================
          XIERIEE BANK RECEIPT
=========================================
Transaction ID: ${transaction.id}
Date: ${formatDate(transaction.created_at)}
Status: ${transaction.status.toUpperCase()}
Type: ${transaction.type.toUpperCase()}
-----------------------------------------
FROM ACCOUNT: ${transaction.from_account}
TO ACCOUNT:   ${transaction.to_account}
-----------------------------------------
AMOUNT:       ${formatCurrency(transaction.amount)}
-----------------------------------------
Reference Key: ${transaction.idempotency_key}

Thank you for choosing Xieriee Secure Core.
=========================================
`.trim()

            const blob = new Blob([receiptContent], { type: "text/plain" })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `Xieriee_Receipt_${transaction.id}.txt`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)

            toast.success("Receipt saved")
        } catch (error: any) {
            toast.error("Could not generate receipt")
        }
    }

    if (accountsLoading) {
        return (
            <div className="max-w-xl mx-auto space-y-8">
                <Skeleton className="h-10 w-48 mx-auto" />
                <Skeleton className="h-4 w-64 mx-auto" />
                <div className="space-y-4 pt-10">
                    <Skeleton className="h-20 w-full rounded-3xl" />
                    <Skeleton className="h-48 w-full rounded-3xl" />
                    <Skeleton className="h-16 w-full rounded-3xl" />
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-10">
            <header className="text-center space-y-3">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10"
                >
                    <Send className="w-8 h-8 text-primary" />
                </motion.div>
                <h1 className="text-4xl font-black font-outfit tracking-tight text-white">Fiat Transfer</h1>
                <p className="text-white/40 font-medium">Global infrastructure for instant liquidity movements.</p>
            </header>

            {/* Progress indicator */}
            <div className="flex items-center justify-center gap-3">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={cn(
                            "h-1 rounded-full transition-all duration-500",
                            step === s ? "w-12 bg-white" : step > s ? "w-4 bg-emerald-500" : "w-4 bg-white/10"
                        )}
                    />
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, ease: "circOut" }}
                >
                    <GlassCard className="p-8 md:p-10 border-white/5 relative overflow-hidden">
                        {step === 1 && (
                            <div className="space-y-8">
                                {/* From selection */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 px-1">
                                        <Wallet className="w-4 h-4 text-white/40" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Source Asset</span>
                                    </div>
                                    <div className="relative group">
                                        <select
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-lg font-bold outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                                            value={selectedAccount?.id}
                                            onChange={(e) => {
                                                const acc = accounts.find(a => a.id.toString() === e.target.value)
                                                setSelectedAccount(acc)
                                            }}
                                        >
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id} className="bg-[#121212] text-white">
                                                    {acc.account_type} Account • Bal: {formatCurrency(acc.balance)}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-white transition-colors pointer-events-none" size={20} />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                        <button
                                            onClick={() => setTransferType("account")}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                                                transferType === "account" ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            Internal ID
                                        </button>
                                        <button
                                            onClick={() => setTransferType("uuid")}
                                            className={cn(
                                                "flex-1 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all",
                                                transferType === "uuid" ? "bg-white text-black shadow-xl" : "text-white/40 hover:text-white"
                                            )}
                                        >
                                            Network UUID
                                        </button>
                                    </div>

                                    {/* Beneficiary Dropdown */}
                                    {beneficiaries.length > 0 && transferType === "account" && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 px-1">
                                                <UserPlus className="w-4 h-4 text-white/40" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-white/40">Saved Beneficiaries</span>
                                            </div>
                                            <div className="relative group">
                                                <select
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm font-bold outline-none focus:border-white/20 transition-all appearance-none cursor-pointer"
                                                    value={selectedBeneficiaryId}
                                                    onChange={(e) => {
                                                        const b = beneficiaries.find(ben => ben.id.toString() === e.target.value)
                                                        if (b) {
                                                            setFormData({ ...formData, toAccount: b.beneficiary_account_id, toUserUuid: "" })
                                                            setSelectedBeneficiaryId(e.target.value)
                                                        } else {
                                                            setSelectedBeneficiaryId("")
                                                        }
                                                    }}
                                                >
                                                    <option value="" className="bg-[#121212]">Select a beneficiary...</option>
                                                    {beneficiaries.map(b => (
                                                        <option key={b.id} value={b.id} className="bg-[#121212]">
                                                            {b.name} ({b.beneficiary_account_id})
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" size={16} />
                                            </div>
                                        </div>
                                    )}

                                    {transferType === "account" ? (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Fingerprint className="w-4 h-4 text-white/40" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Recipient Identifier</span>
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="Enter Account Number..."
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-xl font-bold outline-none focus:border-white/20 transition-all pl-14"
                                                    value={formData.toAccount}
                                                    onChange={e => setFormData({ ...formData, toAccount: e.target.value })}
                                                />
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between px-1">
                                                <div className="flex items-center gap-2">
                                                    <Fingerprint className="w-4 h-4 text-white/40" />
                                                    <span className="text-xs font-bold uppercase tracking-widest text-white/40">Secure UUID</span>
                                                </div>
                                                <AnimatePresence>
                                                    {recipientName && (
                                                        <motion.span 
                                                            initial={{ opacity: 0, x: 5 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            className="text-[10px] bg-emerald-500/10 text-emerald-400 font-black px-2 py-0.5 rounded-full border border-emerald-500/20"
                                                        >
                                                            {recipientName}
                                                        </motion.span>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <div className="relative group">
                                                <input
                                                    type="text"
                                                    placeholder="Enter 8+ chars..."
                                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-lg font-bold outline-none focus:border-white/20 transition-all pr-14 pl-14"
                                                    value={formData.toUserUuid}
                                                    onChange={e => setFormData({ ...formData, toUserUuid: e.target.value })}
                                                />
                                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white/60 transition-colors" size={20} />
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                                    {resolvingUuid && <Loader2 className="animate-spin text-white/40" size={20} />}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-1">
                                        <span className="text-xs font-bold uppercase tracking-widest text-white/40">Amount</span>
                                        <span className="text-[10px] font-medium text-white/20">Available: {formatCurrency(selectedAccount?.balance || 0)}</span>
                                    </div>
                                    <div className="relative group">
                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-4xl font-black text-white/20 group-focus-within:text-white transition-colors">₹</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] p-8 pl-18 text-5xl font-black outline-none focus:border-white/20 transition-all tracking-tighter"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Scheduling Section */}
                                <div className="space-y-4 pt-4">
                                    <div 
                                        className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                                        onClick={() => setIsScheduled(!isScheduled)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Calendar className={cn("w-5 h-5 transition-colors", isScheduled ? "text-primary" : "text-white/20")} />
                                            <div>
                                                <p className="text-sm font-bold">Schedule for later</p>
                                                <p className="text-[10px] text-white/30 uppercase font-black tracking-widest">Post-dated or recurring</p>
                                            </div>
                                        </div>
                                        <div className={cn(
                                            "w-10 h-5 rounded-full relative transition-colors",
                                            isScheduled ? "bg-primary" : "bg-white/10"
                                        )}>
                                            <motion.div 
                                                animate={{ x: isScheduled ? 20 : 2 }}
                                                className="absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    <AnimatePresence>
                                        {isScheduled && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="space-y-4 overflow-hidden"
                                            >
                                                <div className="grid grid-cols-2 gap-4">
                                                   <div className="space-y-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Execute On</p>
                                                        <input 
                                                            type="datetime-local" 
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none text-white custom-datetime-input"
                                                            value={scheduleDate}
                                                            onChange={(e) => setScheduleDate(e.target.value)}
                                                        />
                                                   </div>
                                                   <div className="space-y-2">
                                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">Frequency</p>
                                                        <select 
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs font-bold outline-none appearance-none cursor-pointer"
                                                            value={scheduleFrequency}
                                                            onChange={(e) => setScheduleFrequency(e.target.value)}
                                                        >
                                                            <option value="once" className="bg-[#121212]">Once only</option>
                                                            <option value="daily" className="bg-[#121212]">Daily</option>
                                                            <option value="weekly" className="bg-[#121212]">Weekly</option>
                                                            <option value="monthly" className="bg-[#121212]">Monthly</option>
                                                        </select>
                                                   </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <Button size="lg" className="w-full py-8 text-xl" onClick={handleNext} rightIcon={<ArrowRight />}>
                                    Initialize Transfer
                                </Button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-10">
                                <div className="bg-white/[0.02] rounded-[32px] p-8 border border-white/5 relative overflow-hidden text-center">
                                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4">Verification Check</p>
                                    <h2 className="text-5xl md:text-6xl font-black font-outfit tracking-tighter text-white mb-2">
                                        {formatCurrency(formData.amount)}
                                    </h2>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Network Verified</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Debit Source</p>
                                        <p className="font-bold text-sm">{selectedAccount?.account_type} • {selectedAccount?.id}</p>
                                    </div>
                                    <div className="p-5 rounded-2xl bg-white/5 border border-white/5">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Credit Destination</p>
                                        <p className="font-bold text-sm">
                                            {transferType === "account" 
                                                ? `Account ${formData.toAccount}` 
                                                : `${recipientName || "Network User"} (${formData.toUserUuid.slice(0, 8)}...)`}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)} leftIcon={<ArrowLeft size={18} />}>
                                        Revise
                                    </Button>
                                    <Button size="lg" className="flex-[2]" onClick={handleTransfer} isLoading={loading} leftIcon={<ShieldCheck size={20} />}>
                                        Confirm & Sign
                                    </Button>
                                </div>

                                <p className="text-center text-[10px] text-white/20 flex items-center justify-center gap-1.5">
                                    <Info size={12} /> Encrypted end-to-hand transaction protocol.
                                </p>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center space-y-8 py-4 relative">
                                {/* Success Burst Effect */}
                                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                    {[...Array(12)].map((_, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                                            animate={{ 
                                                opacity: [0, 1, 0], 
                                                scale: [0, 1, 0.5],
                                                x: (Math.random() - 0.5) * 400,
                                                y: (Math.random() - 0.5) * 400,
                                            }}
                                            transition={{ 
                                                duration: 1.5, 
                                                delay: 0.1,
                                                ease: "easeOut" 
                                            }}
                                            className="absolute left-1/2 top-1/3 w-2 h-2 rounded-full bg-emerald-500/40"
                                        />
                                    ))}
                                </div>

                                <motion.div
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ 
                                        scale: [0.5, 1.2, 1],
                                        opacity: 1,
                                        rotate: [0, 10, 0]
                                    }}
                                    transition={{ 
                                        type: "spring", 
                                        damping: 12,
                                        stiffness: 100,
                                        duration: 0.6
                                    }}
                                    className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.3)]"
                                >
                                    <CheckCircle2 size={48} className="text-emerald-500" />
                                </motion.div>
                                
                                <div className="space-y-2">
                                    <h2 className="text-4xl font-black font-outfit tracking-tight">Movement Success</h2>
                                    <p className="text-white/40 max-w-xs mx-auto text-sm">
                                        Infrastructure verified. Your funds have been successfully rerouted.
                                    </p>
                                </div>

                                <div className="bg-white/5 rounded-3xl p-6 border border-white/5 divide-y divide-white/5">
                                    <div className="flex justify-between pb-3">
                                        <span className="text-white/40 text-xs">Operation Status</span>
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-widest",
                                            recentResult?.status === 'scheduled' ? "text-primary" : "text-emerald-500"
                                        )}>
                                            {recentResult?.status === 'scheduled' ? "Transmission Queued" : "Ledger Entry Success"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between pt-3">
                                        <span className="text-white/40 text-xs">Mode</span>
                                        <span className="text-xs text-white uppercase font-black tracking-widest">
                                            {isScheduled ? `Scheduled (${scheduleFrequency})` : "Instant Settlement"}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <Button size="lg" className="w-full" onClick={() => {
                                        setStep(1);
                                        setFormData({ toAccount: "", toUserUuid: "", amount: "", idempotencyKey: `tx_${Date.now()}` });
                                        setRecipientName(null);
                                    }}>
                                        New Operation
                                    </Button>
                                    
                                    <div className="flex items-center justify-center gap-6 pt-4">
                                        <button 
                                            onClick={handleDownloadReceipt}
                                            className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2"
                                        >
                                            <Receipt size={14} /> Receipt
                                        </button>
                                        <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2">
                                            <ArrowLeft size={14} /> Dashboard
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </AnimatePresence>
            
            {step === 1 && (
                <p className="text-center text-[10px] text-white/10 uppercase tracking-[0.4em] pt-4">
                    Protected by Xieriee Quantum-Resistant Encryption
                </p>
            )}
        </div>
    )
}

function ShieldCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
