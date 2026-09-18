import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton } from '../../designs/KineticComponents';
import { KineticModal } from '../../designs/KineticPopups';
import { Play, RefreshCw, Star, Candy, Flame } from 'lucide-react';
import { DynamicIcon } from '../../components/theme/DynamicIcon';

interface OnetModalsProps {
  isPaused: boolean;
  gameState: 'playing' | 'won' | 'lost';
  toastMsg: string;
  score: number;
  winReward?: { chestPoints: number, permen?: number, dailyBonus?: number } | null;
  isDailyChallenge?: boolean;
  onResume: () => void;
  onHome: () => void;
  onRetry: () => void;
  onNextLevel: () => void;
}

export const OnetModals: React.FC<OnetModalsProps> = ({
  isPaused, gameState, toastMsg, score, winReward, isDailyChallenge = false, onResume, onHome, onRetry, onNextLevel
}) => {
  return (
    <>
      {/* PAUSE MODAL */}
      <KineticModal isOpen={isPaused} onClose={onResume} colorClass="bg-theme-surface-card-white" widthClass="w-full max-w-xs" className="text-center">
        <h2 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mb-8">PAUSED</h2>
        <div className="flex flex-col gap-3">
          <KineticButton onClick={onResume} colorClass="bg-green-400" className="w-full py-3 flex items-center justify-center gap-2">
             <Play size={24} className="fill-gray-900" /> Lanjutkan
          </KineticButton>
          <KineticButton onClick={onHome} colorClass="bg-theme-surface-card-white" className="w-full py-3 text-red-500 shadow-theme-sm">Kembali</KineticButton>
        </div>
      </KineticModal>
      
      {/* LOSE MODAL */}
      <KineticModal isOpen={gameState === 'lost'} colorClass="bg-gray-900" widthClass="w-full max-w-sm" className="text-center pt-10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-red-500 border-theme-lg border-white rounded-full flex items-center justify-center shadow-theme-base z-10">
           <RefreshCw size={48} className="text-white" />
        </div>
        <h2 className="font-black text-3xl text-white uppercase tracking-tighter mt-4 mb-2">Game Over!</h2>
        <p className="font-bold text-gray-400 text-sm mb-6">Waktu habis atau gerakan habis.</p>
        
        <div className="bg-gray-800 border-theme-sm border-gray-700 rounded-xl p-4 mb-8">
           <span className="font-black text-xs text-theme-text-muted uppercase tracking-widest block mb-1">Skor Akhir</span>
           <span className="font-black text-3xl text-white">{score}</span>
        </div>
        
        <div className="flex gap-3">
           <KineticButton onClick={onHome} colorClass="bg-theme-surface-card-white" className="flex-1 py-3 text-sm">Keluar</KineticButton>
           <KineticButton onClick={onRetry} colorClass="bg-theme-primary-coral-pink" className="flex-1 py-3 text-sm border-white">Coba Lagi</KineticButton>
        </div>
      </KineticModal>

      {/* WIN MODAL */}
      <KineticModal isOpen={gameState === 'won'} colorClass="bg-green-400" widthClass="w-full max-w-sm" className="text-center pt-10 border-theme-lg">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-theme-surface-card-white border-theme-lg border-theme-border-main rounded-[2rem] flex items-center justify-center shadow-theme-base z-10 ">
           <Star size={56} className="text-green-500" />
        </div>
        <h2 className="font-black text-4xl text-theme-text-primary uppercase tracking-tighter mt-4 mb-6 drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">{isDailyChallenge ? 'Tantangan Selesai!' : 'Level Clear!'}</h2>
        
        <div data-testid="onet-win-summary" className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-4 mb-8 shadow-[inset_3px_4px_0px_rgba(0,0,0,0.1)]">
           <div className="flex justify-between items-center mb-2 border-b-theme-sm border-gray-200 pb-2">
              <span className="font-black text-sm text-theme-text-secondary uppercase">Skor</span>
              <span className="font-black text-xl text-theme-text-primary">{score}</span>
           </div>
           <div className="flex justify-between items-center mb-2 border-b-theme-sm border-gray-200 pb-2">
              <span className="font-black text-sm text-theme-text-secondary uppercase">Permen</span>
              <span className="font-black text-lg text-theme-currency-candy-purple flex items-center gap-1">
                 +{winReward ? winReward.permen || 0 : 0}
                 <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-5 h-5 object-contain" />
              </span>
           </div>
           {isDailyChallenge && (
             <div className="flex justify-between items-center mb-2 border-b-theme-sm border-gray-200 pb-2">
                <span className="font-black text-sm text-theme-text-secondary uppercase flex items-center gap-1"><Flame size={14} /> Bonus Harian</span>
                <span className="font-black text-lg text-orange-500">{winReward && winReward.dailyBonus ? `+${winReward.dailyBonus}` : 'Sudah diklaim'}</span>
             </div>
           )}
           <div className="flex justify-between items-center">
              <span className="font-black text-sm text-theme-text-secondary uppercase">Chest Progress</span>
              <span className="font-black text-lg text-blue-500">+{winReward ? winReward.chestPoints : 0} PTS</span>
           </div>
        </div>
        
        <KineticButton onClick={onNextLevel} colorClass="bg-theme-surface-card-white" className="w-full py-4 text-xl">{isDailyChallenge ? 'Kembali' : 'Lanjut'}</KineticButton>
      </KineticModal>

      {/* TOAST MODAL */}
      <AnimatePresence>
         {toastMsg && (
            <motion.div 
               initial={{ opacity: 0, y: 50, scale: 0.9 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-32 left-0 right-0 flex justify-center z-[120] pointer-events-none px-4"
            >
              <div className="bg-gray-900 text-white font-bold text-sm px-6 py-3 rounded-full shadow-theme-base border-theme-sm border-theme-border-main text-center">
                {toastMsg}
              </div>
            </motion.div>
         )}
      </AnimatePresence>
    </>
  );
};
