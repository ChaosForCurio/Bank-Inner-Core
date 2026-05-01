"use client"
import { Shield, ShieldOff } from "lucide-react"
import { usePrivacy } from "@/context/privacy-context"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function PrivacyToggle() {
    const { isPrivate, togglePrivacy } = usePrivacy()

    return (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={togglePrivacy}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300",
                isPrivate 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
            )}
        >
            {isPrivate ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            <span className="text-[10px] font-black uppercase tracking-widest">
                {isPrivate ? "Privacy Active" : "Privacy Off"}
            </span>
        </motion.button>
    )
}
