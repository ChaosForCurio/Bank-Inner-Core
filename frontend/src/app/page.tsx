"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Shield, Zap, Globe, Github } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]" />

      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="text-2xl font-bold flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Shield className="text-primary-foreground" size={24} />
          </div>
          <span className="font-outfit text-white">Nova Bank</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
            <Link href="#security" className="hover:text-primary transition-colors">Security</Link>
          </div>
          <Link
            href="/login"
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-sm font-semibold transition-all border border-white/10"
          >
            Sign In
          </Link>
        </div>
      </nav>

      <main className="relative z-10 pt-20 pb-32 px-6 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-semibold text-primary">Now available in India</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black font-outfit mb-8 tracking-tight">
            The Future of <br />
            <span className="text-gradient">Digital Banking</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12">
            Experience the next generation of financial freedom. Fast, secure, and beautiful banking designed for everyone.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              Get Started for Free
              <ArrowRight size={20} />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <section className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8 text-left" id="features">
          {[
            {
              icon: <Zap className="text-yellow-400" />,
              title: "Instant Transfers",
              desc: "Send money globally in seconds with zero fees between accounts."
            },
            {
              icon: <Shield className="text-primary" />,
              title: "Military-Grade Security",
              desc: "Multi-layered encryption and audit logs to keep your assets safe."
            },
            {
              icon: <Globe className="text-blue-400" />,
              title: "Global Reach",
              desc: "Manage multiple currencies and accounts from a single dashboard."
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-3xl"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </section>

        <footer className="mt-40 pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-muted-foreground text-sm">
          <p>© 2026 Nova Bank Ltd. Powered by Antigravity.</p>
          <div className="flex gap-8">
            <a href="https://github.com/ChaosForCurio" target="_blank" className="hover:text-white transition-colors flex items-center gap-2">
              <Github size={16} /> GitHub
            </a>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
