"use client"
import { motion } from "framer-motion"
import {
    Settings as SettingsIcon,
    Bell,
    Lock,
    Eye,
    Globe,
    CreditCard,
    ChevronRight,
    Moon
} from "lucide-react"

export default function SettingsPage() {
    const sections = [
        {
            title: "Security & Privacy",
            icon: Lock,
            items: [
                { label: "Change Password", description: "Use at least 12 characters and special symbols", icon: Lock },
                { label: "Biometric Login", description: "Use FaceID or Fingerprint for quick access", icon: Eye, toggle: true },
                { label: "Data Sharing", description: "Control how your data is used for personalization", icon: Globe }
            ]
        },
        {
            title: "Notifications",
            icon: Bell,
            items: [
                { label: "Push Notifications", description: "Alerts for transactions and account updates", icon: Bell, toggle: true },
                { label: "Email Alerts", description: "Weekly summaries and security notices", icon: Globe, toggle: true }
            ]
        },
        {
            title: "Display & Preferences",
            icon: SettingsIcon,
            items: [
                { label: "Dark Mode", description: "System default is dark for premium experience", icon: Moon, toggle: true },
                { label: "Default Currency", description: "Select your primary currency", icon: CreditCard, value: "INR (₹)" }
            ]
        }
    ]

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <header>
                <h1 className="text-4xl font-black font-outfit">Settings</h1>
                <p className="text-muted-foreground mt-1">Customize your banking experience and manage security.</p>
            </header>

            <div className="space-y-10">
                {sections.map((section, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="space-y-6"
                    >
                        <h2 className="text-lg font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            {section.title}
                        </h2>

                        <div className="glass-card rounded-[32px] overflow-hidden border border-white/5 divide-y divide-white/5">
                            {section.items.map((item, i) => (
                                <div
                                    key={i}
                                    className="p-4 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-2xl flex-shrink-0 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors mt-1 sm:mt-0">
                                            <item.icon size={22} className="w-5 h-5 sm:w-[22px] sm:h-[22px]" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-base sm:text-lg">{item.label}</p>
                                            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 max-w-[200px] sm:max-w-none">{item.description}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 self-end sm:self-auto px-14 sm:px-0 mt-2 sm:mt-0">
                                        {"toggle" in item && (
                                            <div className="w-12 h-6 bg-primary rounded-full relative shadow-inner">
                                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                                            </div>
                                        )}
                                        {"value" in item && (
                                            <span className="text-sm font-bold text-primary px-3 py-1 bg-primary/10 rounded-lg border border-primary/20">
                                                {(item as any).value}
                                            </span>
                                        )}
                                        {!item.toggle && <ChevronRight size={20} className="text-muted-foreground" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="pt-10 flex flex-col items-center gap-4">
                <p className="text-xs text-muted-foreground">App Version 2.0.4 (Staging)</p>
                <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span className="hover:text-primary cursor-pointer transition-colors">Terms of Service</span>
                    <span className="hover:text-primary cursor-pointer transition-colors">Privacy Policy</span>
                </div>
            </div>
        </div>
    )
}
