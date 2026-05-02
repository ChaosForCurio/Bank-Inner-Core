'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/socket-context';
import { GlassCard } from '../ui/glass-card';
import { ArrowUpRight, ArrowDownLeft, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount: number;
  type: 'credit' | 'debit' | 'transfer' | 'exchange';
  description: string;
  category: string;
  created_at: string;
}

export const ActivityFeed: React.FC = () => {
  const { socket } = useSocket();
  const [activities, setActivities] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_transaction', (tx: Transaction) => {
      setActivities((prev) => [tx, ...prev].slice(0, 5)); // Keep last 5
    });

    return () => {
      socket.off('new_transaction');
    };
  }, [socket]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest flex items-center gap-2">
          <Bell size={14} className="text-[#10b981]" />
          Live Activity
        </h3>
        {activities.length > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-[#10b981] animate-pulse" />
        )}
      </div>

      <AnimatePresence initial={false}>
        {activities.length === 0 ? (
          <GlassCard className="py-8 text-center text-white/30 text-sm">
            Waiting for activity...
          </GlassCard>
        ) : (
          activities.map((tx) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <GlassCard className="p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                <div className={cn(
                  "p-2 rounded-lg",
                  tx.type === 'credit' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}>
                  {tx.type === 'credit' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {tx.description || 'Transaction'}
                  </p>
                  <p className="text-xs text-white/40">{tx.category}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-bold",
                    tx.type === 'credit' ? "text-green-500" : "text-white"
                  )}>
                    {tx.type === 'credit' ? '+' : '-'} ₹{parseFloat(tx.amount.toString()).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[10px] text-white/20">Just now</p>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};
