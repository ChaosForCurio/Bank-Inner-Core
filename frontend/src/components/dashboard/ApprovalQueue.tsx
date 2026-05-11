'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../ui/glass-card';
import { ShieldCheck, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PrivacyText } from '@/components/ui/privacy-text';
import { api } from '@/lib/api';

interface PendingApproval {
  id: number;
  transaction_id: number;
  amount: string;
  type: string;
  from_account: number;
  to_account: number;
  required_count: number;
  current_approvals: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export const ApprovalQueue: React.FC = () => {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const response = await api.get('transaction/pending-approvals');
      setApprovals(response.data);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Refresh every 30 seconds
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (transactionId: number, action: 'approve' | 'reject') => {
    try {
      await api.post(`transaction/${action}`, { transactionId });
      setApprovals((prev) => prev.filter((a) => a.transaction_id !== transactionId));
    } catch (error) {
      console.error(`Failed to ${action} transaction:`, error);
    }
  };

  if (loading) return <div className="text-white/30 text-xs text-center py-10 italic">Secure authorization handshake in progress...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={14} className="text-[#3b82f6]" />
          Executive Approval Queue
        </h3>
        {approvals.length > 0 && (
          <span className="text-[10px] bg-[#3b82f6]/20 text-[#3b82f6] px-2 py-0.5 rounded-full font-bold animate-pulse">
            {approvals.length} ACTION REQUIRED
          </span>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {approvals.length === 0 ? (
          <GlassCard className="py-12 text-center border-dashed border-white/5 bg-white/[0.02]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-2 text-white/20"
            >
              <div className="p-3 bg-white/5 rounded-full mb-2">
                <ShieldCheck size={32} strokeWidth={1} className="text-white/10" />
              </div>
              <p className="text-sm font-medium">All accounts secure.</p>
              <p className="text-[10px] uppercase tracking-tighter">No pending authorizations</p>
            </motion.div>
          </GlassCard>
        ) : (
          approvals.map((approval) => (
            <motion.div
              key={approval.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              layout
            >
              <GlassCard className="p-5 border-l-2 border-l-[#3b82f6] hover:bg-white/[0.05] transition-colors relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 bg-[#3b82f6]/5 rounded-full -mr-4 -mt-4 blur-3xl group-hover:bg-[#3b82f6]/10 transition-colors" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[9px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                        SECURE-TX-{approval.transaction_id}
                      </span>
                      {parseFloat(approval.amount) >= 5000 && (
                        <span className="flex items-center gap-1 text-[9px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-widest">
                          <AlertTriangle size={10} /> High Risk
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-white tracking-tighter">
                        <PrivacyText>₹{parseFloat(approval.amount).toLocaleString('en-IN')}</PrivacyText>
                      </span>
                      <span className="text-xs text-white/30 font-medium">INR</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-white/40 mt-3 uppercase tracking-tighter">
                      <div className="flex items-center gap-1">
                        <Clock size={12} className="text-white/20" />
                        <span>{new Date(approval.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      <div className="flex items-center gap-1">
                        <ShieldCheck size={12} className="text-[#3b82f6]" />
                        <span className="text-white/60">{approval.required_count} Multi-Sig Signature{approval.required_count > 1 ? 's' : ''} Needed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(approval.transaction_id, 'reject')}
                      className="px-4 py-2.5 bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-500 text-[10px] font-black rounded-xl transition-all border border-white/5 hover:border-red-500/20 uppercase tracking-widest"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAction(approval.transaction_id, 'approve')}
                      className="px-6 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white text-[10px] font-black rounded-xl transition-all transform active:scale-95 shadow-xl shadow-[#3b82f6]/20 uppercase tracking-widest flex items-center gap-2"
                    >
                      <ShieldCheck size={14} strokeWidth={3} />
                      Authorize
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
};
