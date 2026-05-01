"use client"
import { motion } from "framer-motion"
import { VirtualCards } from "@/components/dashboard/virtual-cards"
import { AddressBook } from "@/components/dashboard/address-book"

export default function CardsPage() {
    return (
        <div className="space-y-12 max-w-6xl mx-auto pb-20 md:pb-10">
            <motion.header
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <h1 className="text-4xl font-black font-outfit tracking-tight">Cards & Contacts</h1>
                <p className="text-white/50 mt-2 font-medium">Manage your virtual cards and saved beneficiaries.</p>
            </motion.header>

            <VirtualCards />
            <AddressBook />
        </div>
    )
}
