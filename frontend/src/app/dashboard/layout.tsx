"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    ArrowUpRight,
    History,
    Settings,
    LogOut,
    User,
    Bell,
    Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { deleteCookie } from "cookies-next"

const sidebarItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
    { icon: ArrowUpRight, label: "Send Money", href: "/dashboard/transfer" },
    { icon: History, label: "History", href: "/dashboard/history" },
    { icon: User, label: "Profile", href: "/dashboard/profile" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    const handleLogout = () => {
        deleteCookie("token")
        window.location.href = "/"
    }

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 border-r border-white/5 bg-[#0a0f18] flex flex-col">
                <div className="p-8">
                    <Link href="/dashboard" className="text-xl font-bold flex items-center gap-2 font-outfit">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-black text-xs">N</span>
                        </div>
                        Nova Bank
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group",
                                pathname === item.href
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon size={20} className={cn(
                                "transition-colors",
                                pathname === item.href ? "text-primary" : "group-hover:text-white"
                            )} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between glass z-10">
                    <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5 min-w-[300px]">
                        <Search size={18} className="text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search transactions, accounts..."
                            className="bg-transparent border-none outline-none text-sm w-full"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#0a0f18]" />
                        </button>
                        <div className="flex items-center gap-3 pl-6 border-l border-white/5">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold">Test User</p>
                                <p className="text-xs text-muted-foreground">Premium Account</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400" />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 bg-background relative">
                    {/* Subtle Background Elements */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                    <div className="relative z-0">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
