"use client"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Send, Search, ArrowRight, Wallet, CheckCircle2, Loader2, ChevronDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { cn } from "@/lib/utils"

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
    const [recentResult, setRecentResult] = useState<any>(null)

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const response = await api.get(endpoints.accounts.list)
                const accountsData = response.data.accounts || []
                setAccounts(accountsData)
                if (accountsData.length > 0) {
                    setSelectedAccount(accountsData[0])
                }
            } catch (error) {
                console.error("Failed to fetch accounts:", error)
                toast.error("Could not load accounts")
            } finally {
                setAccountsLoading(false)
            }
        }
        fetchAccounts()
    }, [])

    const handleLookupUuid = async () => {
        if (formData.toUserUuid.length < 8) return

        setResolvingUuid(true)
        setRecipientName(null)
        try {
            const response = await api.get(endpoints.users!.lookup(formData.toUserUuid))
            if (response.data.status === "success") {
                setRecipientName(response.data.user.name)
                toast.success(`Found User: ${response.data.user.name}`)
            }
        } catch (error) {
            setRecipientName(null)
        } finally {
            setResolvingUuid(false)
        }
    }

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

        if (!formData.amount) {
            toast.error("Please enter an amount")
            return
        }

        if (parseFloat(formData.amount) > selectedAccount.balance) {
            toast.error("Insufficient balance")
            return
        }
        setStep(2)
    }

    const handleTransfer = async () => {
        setLoading(true)
        try {
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
            toast.success("Transaction Complete")
            setStep(3)
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transfer failed")
        } finally {
            setLoading(false)
        }
    }

    if (accountsLoading) {
        return (
            <div className="h-[60vh] w-full flex items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        )
    }

    return (
        <div className="max-w-xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-4xl font-black font-outfit">Send Money</h1>
                <p className="text-muted-foreground">Transfer funds instantly to any Xieriee bank account.</p>
            </div>

            <div className="flex items-center justify-center gap-4 mb-4">
                {[1, 2, 3].map((s) => (
                    <div
                        key={s}
                        className={cn(
                            "w-10 h-2 rounded-full transition-all duration-300",
                            step >= s ? "bg-primary" : "bg-white/10"
                        )}
                    />
                ))}
            </div>

            <div className="glass-card rounded-[40px] p-10 border border-white/10 relative overflow-hidden">
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-8"
                    >
                        {/* Account Selection */}
                        <div className="space-y-4">
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-2">From Account</span>
                            <div className="relative group">
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-bold outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                                    value={selectedAccount?.id}
                                    onChange={(e) => {
                                        const acc = accounts.find(a => a.id.toString() === e.target.value)
                                        setSelectedAccount(acc)
                                    }}
                                >
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id} className="bg-[#0a0f18] text-white">
                                            {acc.account_type} (Balance: {formatCurrency(acc.balance)})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" size={20} />
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                                <button
                                    onClick={() => setTransferType("account")}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                                        transferType === "account" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    Account ID
                                </button>
                                <button
                                    onClick={() => setTransferType("uuid")}
                                    className={cn(
                                        "flex-1 py-3 rounded-xl font-bold text-sm transition-all",
                                        transferType === "uuid" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-white"
                                    )}
                                >
                                    User UUID
                                </button>
                            </div>

                            {transferType === "account" ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Receiver Account ID</span>
                                        <span className="text-xs text-primary flex items-center gap-1 cursor-pointer hover:underline"><Search size={12} /> Find Contact</span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Ex. 4"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-xl font-bold outline-none focus:border-primary transition-all"
                                        value={formData.toAccount}
                                        onChange={e => setFormData({ ...formData, toAccount: e.target.value })}
                                    />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Receiver User UUID</span>
                                        {recipientName && <span className="text-xs text-green-400 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> {recipientName}</span>}
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Enter 8+ digits of UUID..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-lg font-bold outline-none focus:border-primary transition-all pr-14"
                                            value={formData.toUserUuid}
                                            onChange={e => setFormData({ ...formData, toUserUuid: e.target.value })}
                                            onBlur={handleLookupUuid}
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            {resolvingUuid ? <Loader2 className="animate-spin text-primary" size={20} /> : <Search size={20} className="text-muted-foreground" />}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Amount to Send</span>
                                <span className="text-xs text-muted-foreground">Available: {formatCurrency(selectedAccount?.balance || 0)}</span>
                            </div>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-primary">₹</span>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-12 text-3xl font-black outline-none focus:border-primary transition-all"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleNext}
                            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20"
                        >
                            Next Step
                            <ArrowRight size={24} />
                        </button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-10"
                    >
                        <div className="bg-primary/5 rounded-[32px] p-8 border border-primary/10 space-y-6">
                            <div className="text-center">
                                <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2">You are sending</p>
                                <h2 className="text-5xl font-black font-outfit text-primary">{formatCurrency(formData.amount)}</h2>
                            </div>
                            <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Wallet size={20} /></div>
                                    <div className="text-left">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">From</p>
                                        <p className="font-bold">{selectedAccount?.account_type} ({selectedAccount?.id})</p>
                                    </div>
                                </div>
                                <ArrowRight size={20} className="text-muted-foreground" />
                                <div className="flex items-center gap-3 text-right">
                                    <div className="text-right">
                                        <p className="text-[10px] text-muted-foreground uppercase font-black">To</p>
                                        <p className="font-bold">
                                            {transferType === "account"
                                                ? `Account (${formData.toAccount})`
                                                : `${recipientName || "User"} (${formData.toUserUuid.slice(0, 8)}...)`}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary"><Send size={20} /></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep(1)}
                                className="flex-1 py-5 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                disabled={loading}
                                onClick={handleTransfer}
                                className="flex-[2] py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform shadow-xl shadow-primary/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin" /> : "Confirm & Send"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 3 && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-8"
                    >
                        <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-primary/40">
                            <CheckCircle2 size={48} className="text-primary-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black font-outfit">Transfer Success!</h2>
                            <p className="text-muted-foreground">
                                The funds have been sent to {transferType === "account" ? `account ${formData.toAccount}` : (recipientName || "the specified user")}.
                            </p>
                        </div>
                        <div className="bg-white/5 rounded-3xl p-6 text-sm">
                            <div className="flex justify-between mb-2">
                                <span className="text-muted-foreground">Reference ID</span>
                                <span className="font-mono text-white tracking-wider">#{recentResult?.id || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="text-primary font-bold uppercase">{recentResult?.status || "COMPLETED"}</span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setStep(1);
                                setFormData({ toAccount: "", toUserUuid: "", amount: "", idempotencyKey: `tx_${Date.now()}` });
                                setRecipientName(null);
                            }}
                            className="w-full py-5 bg-primary text-primary-foreground rounded-2xl font-black text-xl hover:scale-105 transition-transform"
                        >
                            Make Another Transfer
                        </button>
                        <p className="text-muted-foreground text-sm cursor-pointer hover:text-white transition-colors">Download Receipt</p>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
