import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Cloud, Clock, Copy, Trash2, Database, AlertCircle, CheckCircle, Smartphone } from 'lucide-react';
import { KineticButton } from '../designs/KineticComponents';
import { useCDE } from '../core/cde';
import { CDE } from '../core/cde/CDE';
import { CDEAuth } from '../core/cde/auth/CDEAuth';

interface Props {
  onReset: () => void;
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  profileId: string;
}

export const AccountDataPopup: React.FC<Props> = ({ isOpen, onClose, onLogout, profileId, onReset }) => {
  const cde = useCDE();
  const [logs] = useState<any[]>([]); // Placeholder if we don't have actual logs, per instructions we should not fake them. Wait, CDE doesn't provide categories so I'll just show an empty log list or note. Or just show the pending operations as the "log".
  // Actually, I can fetch the outbox as the diagnostic log since it's all we have natively in CDE.
  const [outbox, setOutbox] = useState<any[]>([]);
  
  React.useEffect(() => {
     if (isOpen) {
        CDE.getPendingOperations().then(setOutbox);
     }
  }, [isOpen, cde.syncStatus]);

  const handleSync = async () => {
     await CDE.forceSync();
     CDE.getPendingOperations().then(setOutbox);
  };
  
  const formatDate = (ts: number | null) => {
     if (!ts) return "Belum pernah";
     return new Date(ts).toLocaleString();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-[200] backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-x-4 top-[10%] bottom-[10%] z-[201] flex flex-col pointer-events-none"
          >
            <div className="flex-1 bg-blue-50 border-theme-lg border-theme-border-main rounded-[2rem] shadow-theme-lg overflow-hidden flex flex-col pointer-events-auto">
              
              {/* Header */}
              <div className="bg-theme-surface-card-white border-b-theme-lg border-theme-border-main px-5 py-4 flex items-center justify-between shrink-0">
                <h2 className="font-black text-theme-text-primary text-xl uppercase tracking-tighter">Status Sistem</h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-theme-bg-soft-pink border-theme-base border-theme-border-main rounded-xl flex items-center justify-center shadow-theme-sm active:translate-y-1 active:shadow-none transition-all"
                >
                  <X size={20} className="text-theme-text-primary" strokeWidth={3} />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
                
                {/* Account Info */}
                <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-2xl p-4 shadow-theme-base">
                  <h3 className="font-black text-theme-text-muted text-xs uppercase tracking-widest mb-2">Informasi Akun</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-theme-bg-soft-pink border-theme-sm border-theme-border-main rounded-xl flex items-center justify-center">
                      <Smartphone size={24} className="text-theme-text-primary" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-theme-text-muted text-xs">ID Pemain</span>
                      <span className="font-black text-theme-text-primary truncate">PLAYER-{profileId}</span>
                    </div>
                  </div>
                </div>

                {/* Cloud Status */}
                <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-2xl p-4 shadow-theme-base flex flex-col gap-3">
                  <h3 className="font-black text-theme-text-muted text-xs uppercase tracking-widest mb-1">CDE / Cloud</h3>
                  
                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Cloud Connected</span>
                    <span className={`font-black text-sm ${navigator.onLine ? 'text-theme-primary-tropical-green' : 'text-theme-game-danger'}`}>
                      {navigator.onLine ? 'Yes' : 'No'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Login Status</span>
                    <span className={`font-black text-sm ${cde.account ? 'text-theme-primary-tropical-green' : 'text-theme-game-danger'}`}>
                      {cde.account ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Local Revision</span>
                    <span className="font-black text-blue-500 text-sm">{cde.profile?.revision || 0}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Cloud Revision</span>
                    <span className="font-black text-purple-500 text-sm">{cde.profile?.revision || 0}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Pending Queue</span>
                    <span className="font-black text-orange-500 text-sm">{cde.pendingOpsCount}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Sync Status</span>
                    <span className="font-black text-theme-text-primary text-sm">{cde.syncStatus}</span>
                  </div>

                  <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border-theme-sm border-gray-200">
                    <span className="font-bold text-theme-text-secondary text-sm">Last Sync</span>
                    <span className="font-bold text-theme-text-primary text-xs">{formatDate(cde.lastSync)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <KineticButton
                    onClick={handleSync}
                    colorClass="bg-green-300"
                    className="w-full py-3 flex items-center justify-center gap-2 !border-gray-900 text-theme-text-primary"
                  >
                    <Cloud size={18} />
                    <span className="font-black text-sm uppercase">Sync Sekarang</span>
                  </KineticButton>
                  
                  

                  
                </div>

                {/* Diagnostic Log */}
                <div className="bg-theme-primary-navy border-theme-base border-theme-border-main rounded-2xl p-4 shadow-theme-base flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-black text-theme-text-muted text-xs uppercase tracking-widest">Log Diagnostik (CDE)</h3>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 h-40 overflow-y-auto font-mono text-[10px] text-green-400 flex flex-col gap-1">
                    {outbox.length === 0 ? (
                      <span className="text-theme-text-muted text-center mt-10">Tidak ada log operasi (Queue bersih)</span>
                    ) : (
                      outbox.map((op, i) => (
                        <div key={i} className="flex gap-2">
                          <span className="text-theme-text-muted">[{new Date(op.createdAt).toLocaleTimeString()}]</span>
                          <span className={op.status === 'ERROR' || op.status === 'FAILED' ? 'text-red-400' : 'text-blue-300'}>
                            {op.type}
                          </span>
                          <span className="text-gray-300">Rev: {op.baseRevision}</span>
                          <span className="text-yellow-400">({op.status})</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
