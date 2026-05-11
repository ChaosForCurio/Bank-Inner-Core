'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Unlock } from 'lucide-react';
import { deriveKey, decryptNote, getEncryptionSecret } from '@/lib/crypto';

interface DecryptedNoteProps {
  encryptedNote: string;
  iv: string;
}

export const DecryptedNote: React.FC<DecryptedNoteProps> = ({ encryptedNote, iv }) => {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decrypt = async () => {
      try {
        const secret = getEncryptionSecret();
        const key = await deriveKey(secret);
        const result = await decryptNote(encryptedNote, iv, key);
        setDecrypted(result);
      } catch (error) {
        setDecrypted('[Encryption Key Mismatch]');
      } finally {
        setLoading(false);
      }
    };

    if (encryptedNote && iv) {
      decrypt();
    }
  }, [encryptedNote, iv]);

  if (loading) return (
    <div className="flex items-center gap-2 text-[10px] text-white/20 uppercase tracking-widest animate-pulse">
      <Lock size={10} />
      Decrypting Secure Note...
    </div>
  );

  return (
    <div className="mt-2 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-emerald-500/60">
        <Unlock size={8} />
        Sovereign E2EE Decrypted
      </div>
      <p className="text-xs text-white/70 italic leading-relaxed">
        "{decrypted}"
      </p>
    </div>
  );
};
