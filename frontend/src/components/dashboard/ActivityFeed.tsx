'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/context/socket-context';
import { GlassCard } from '../ui/glass-card';
import { ArrowUpRight, ArrowDownLeft, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Transaction {
  id: string;
  amount?: number;
  type: 'credit' | 'debit' | 'transfer' | 'exchange' | 'notification';
  description: string;
  category: string;
  created_at: string;
  metadata?: any;
}

export const ActivityFeed: React.FC = () => {
  const { socket } = useSocket();
  const [activities, setActivities] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for new transactions
    socket.on('new_transaction', (tx: Transaction) => {
      setActivities((prev) => [tx, ...prev].slice(0, 10)); // Increased limit
    });

    // NEW: Listen for unified notifications
    socket.on('notification', (notif: any) => {
      const activity: Transaction = {
        id: notif.id || Math.random().toString(),
        type: 'notification',
        description: notif.title,
        category: notif.message,
        created_at: new Date().toISOString(),
        metadata: notif.metadata
      };
      setActivities((prev) => [activity, ...prev].slice(0, 10));
    });

    return () => {
      socket.off('new_transaction');
      socket.off('notification');
    };
  }, [socket]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest flex items-center gap-2">
          <Bell size={14} className="text-[#10b981]" />
          Live Command Center
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
          activities.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative"
            >
              <GlassCard className={cn(
                "p-4 flex items-center gap-4 transition-colors",
                item.type === 'notification' ? "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10" : "hover:bg-white/10"
              )}>
                <div className={cn(
                  "p-2 rounded-lg",
                  item.type === 'credit' ? "bg-green-500/10 text-green-500" : 
                  item.type === 'notification' ? "bg-amber-500/10 text-amber-500" :
                  "bg-red-500/10 text-red-500"
                )}>
                  {item.type === 'credit' ? <ArrowDownLeft size={18} /> : 
                   item.type === 'notification' ? <Bell size={18} /> :
                   <ArrowUpRight size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {item.description}
                  </p>
                  <p className="text-xs text-white/40 truncate">{item.category}</p>
                  
                  {/* Inline Actions for Notifications */}
                  {item.type === 'notification' && item.metadata?.actions && (
                    <div className="flex gap-2 mt-2">
                      {item.metadata.actions.map((btn: any) => (
                        <button 
                          key={btn.action}
                          className="text-[10px] px-2 py-1 rounded bg-amber-500/20 text-amber-500 hover:bg-amber-500/40 transition-colors uppercase font-bold"
                          onClick={() => console.log(`Triggering action: ${btn.action}`)}
                        >
                          {btn.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-right whitespace-nowrap">
                  {item.amount !== undefined && (
                    <p className={cn(
                      "text-sm font-bold",
                      item.type === 'credit' ? "text-green-500" : "text-white"
                    )}>
                      {item.type === 'credit' ? '+' : '-'} ₹{parseFloat(item.amount.toString()).toLocaleString('en-IN')}
                    </p>
                  )}
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

