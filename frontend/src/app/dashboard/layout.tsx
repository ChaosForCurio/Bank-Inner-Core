"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutDashboard,
    ArrowUpRight,
    History as HistoryIcon,
    Settings,
    LogOut,
    User,
    Bell,
    Search,
    Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { deleteCookie } from "cookies-next"
import { api, endpoints } from "@/lib/api"
import toast from "react-hot-toast"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: ArrowUpRight, label: "Send Money", href: "/dashboard/transfer" },
    { icon: HistoryIcon, label: "History", href: "/dashboard/history" },
    { icon: User, label: "Profile", href: "/dashboard/profile" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await api.get(endpoints.auth.me)
                setUser(response.data)
            } catch (error) {
                console.error("Auth error:", error)
                router.push("/login")
            } finally {
                setLoading(false)
            }
        }
        fetchUserData()
    }, [router])

    const handleLogout = () => {
        deleteCookie("token")
        router.push("/")
    }

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-[#0a0f18]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center animate-bounce shadow-2xl shadow-primary/40">
                        <span className="text-primary-foreground font-black text-xl">X</span>
                    </div>
                    <Loader2 className="animate-spin text-primary/40" size={24} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden font-outfit">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-[#0a0f18] flex flex-col z-20">
                <div className="p-8">
                    <Link href="/dashboard" className="text-xl font-black flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
                            <span className="text-primary-foreground font-black text-sm">X</span>
                        </div>
                        <span className="tracking-tight">Xieriee bank</span>
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative",
                                pathname === item.href
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-colors",
                                pathname === item.href ? "text-primary-foreground" : "group-hover:text-white"
                            )} />
                            <span className="font-bold text-sm tracking-wide">{item.label}</span>
                            {pathname === item.href && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute inset-0 bg-primary rounded-2xl -z-10"
                                />
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 px-5 py-4 rounded-2xl w-full text-red-400 bg-red-500/5 hover:bg-red-500/10 transition-all font-bold text-sm"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-24 px-10 flex items-center justify-between glass z-10 border-b border-white/5">
                    <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5 min-w-[350px] group focus-within:border-primary/50 transition-colors">
                        <Search size={18} className="text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search transactions, accounts..."
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                        />
                    </div>

                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4">
                            <button className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all hover:scale-105 border border-white/5">
                                <Bell size={20} />
                                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0a0f18]" />
                            </button>
                        </div>

                        <div className="flex items-center gap-4 pl-8 border-l border-white/5">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-black">{user?.name}</p>
                                <p className="text-[10px] uppercase font-black tracking-widest text-primary">
                                    {user?.is_system ? "System Admin" : "Premium Member"}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-tr from-primary to-emerald-400 p-0.5 shadow-xl shadow-primary/10">
                                <div className="w-full h-full rounded-[16px] bg-[#0a0f18] flex items-center justify-center text-lg font-black text-white">
                                    {user?.name?.[0]}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-10 bg-[#0a0f18] relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2" />
                    <div className="relative z-0">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
