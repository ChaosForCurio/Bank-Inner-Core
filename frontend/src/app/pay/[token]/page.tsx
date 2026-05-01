"use client"
import { useState, useEffect, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, ShieldCheck, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { getCookie } from "cookies-next"
import { useRouter } from "next/navigation"

export default function PaymentPortalPage({ params }: { params: Promise<{ token: string }> }) {
    const resolvedParams = use(params);
    const token = resolvedParams.token;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [requestData, setRequestData] = useState<any>(null);
    const [error, setError] = useState("");
    const [paying, setPaying] = useState(false);
    const [paid, setPaid] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    
    // Check if user is theoretically logged in via cookie existence
    useEffect(() => {
        setIsAuthenticated(!!getCookie("token"));
    }, []);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await api.get(endpoints.paymentRequests.publicDetails(token));
                if (res.data.success) {
                    setRequestData(res.data.paymentRequest);
                } else {
                    setError(res.data.message || "Failed to load payment request");
                }
            } catch (err: any) {
                setError(err.response?.data?.message || "Invalid or expired payment link");
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchRequest();
        }
    }, [token]);

    const handlePay = async () => {
        if (!isAuthenticated) {
            toast.error("Please login or create an account to fulfill this request.");
            router.push(`/login?redirect=/pay/${token}`);
            return;
        }

        setPaying(true);
        try {
            const res = await api.post(endpoints.paymentRequests.fulfill(token));
            if (res.data.success) {
                setPaid(true);
                toast.success("Payment completed successfully!");
            } else {
                toast.error(res.data.message || "Payment failed");
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || "An error occurred while processing your payment");
        } finally {
            setPaying(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <GlassCard className="p-8 flex flex-col items-center justify-center h-64 w-full max-w-md">
                    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mb-4" />
                    <p className="text-white/50 font-medium">Securing payment channel...</p>
                </GlassCard>
            </div>
        );
    }

    if (error || !requestData) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background glow for errors */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-[100px] pointer-events-none" />
                
                <GlassCard className="p-8 w-full max-w-md text-center border-red-500/20">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-black font-outfit mb-2">Request Unavailable</h1>
                    <p className="text-white/60 text-sm mb-8">{error || "This link may have expired or is invalid."}</p>
                    <Link href="/">
                        <Button className="w-full">Return Home</Button>
                    </Link>
                </GlassCard>
            </div>
        );
    }

    // Success State
    if (paid) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
                
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                >
                    <GlassCard glow className="p-10 w-full max-w-md text-center border-emerald-500/20">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 15, delay: 0.2 }}
                            className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10"
                        >
                            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                        </motion.div>
                        <h1 className="text-3xl font-black font-outfit mb-2 text-white">Payment Sent</h1>
                        <p className="text-white/60 mb-8">
                            You've successfully sent <span className="font-bold text-white">{formatCurrency(requestData.amount)}</span> to {requestData.requestorName}.
                        </p>
                        <Link href={isAuthenticated ? "/dashboard" : "/"}>
                            <Button className="w-full h-12 text-base font-bold" variant="outline">
                                {isAuthenticated ? "Return to Dashboard" : "Go to Home"}
                            </Button>
                        </Link>
                    </GlassCard>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex flex-col p-4 md:p-8 relative selection:bg-white/20">
            {/* Nav placeholder */}
            <div className="absolute top-8 left-8">
                <span className="font-black text-xs tracking-[0.3em] uppercase text-white/50">Xieriee / Portal</span>
            </div>

            <div className="flex-1 flex items-center justify-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[480px]"
                >
                    <GlassCard glow className="p-8 md:p-12 overflow-hidden relative border-white/10 group">
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />

                        <div className="flex justify-between items-start mb-12">
                            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center ring-1 ring-white/10 shadow-xl">
                                <Lock className="w-5 h-5 text-white/70" />
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Secure</span>
                            </div>
                        </div>

                        <div className="space-y-2 mb-10">
                            <p className="text-sm font-bold uppercase tracking-widest text-white/40">
                                Request from {requestData.requestorName}
                            </p>
                            <h2 className="text-6xl font-black font-outfit tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                                {formatCurrency(requestData.amount)}
                            </h2>
                            {requestData.note && (
                                <p className="text-white/60 mt-4 leading-relaxed border-l-2 border-white/20 pl-4 py-1 italic">
                                    "{requestData.note}"
                                </p>
                            )}
                        </div>

                        {!isAuthenticated ? (
                            <div className="space-y-4">
                                <Link href={`/login?redirect=/pay/${token}`}>
                                    <Button className="w-full h-14 text-base font-bold shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                                        Login to Pay with Xieriee
                                    </Button>
                                </Link>
                                <p className="text-xs text-center text-white/30 font-medium px-4">
                                    You need a Xieriee Core account to complete this transaction via internal secure rails.
                                </p>
                            </div>
                        ) : (
                            <Button 
                                className="w-full h-14 text-lg font-bold shadow-[0_0_40px_rgba(255,255,255,0.1)] relative overflow-hidden group/btn" 
                                isLoading={paying}
                                onClick={handlePay}
                                rightIcon={<ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />}
                            >
                                Send {formatCurrency(requestData.amount)}
                            </Button>
                        )}
                    </GlassCard>
                </motion.div>
            </div>
            
            <div className="absolute bottom-8 left-0 right-0 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20">
                    Encrypted via Core Financial Rails
                </p>
            </div>
        </div>
    )
}
