import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { useAudio } from '../core/audio/AudioEngine';
import { Box, Gift, Unlock, X, Zap, Candy, Search, RefreshCw, Hammer, Bomb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton, ProgressBar } from '../designs/KineticComponents';
import { useProfile } from '../core/profile/ProfileContext';
import { DynamicIcon } from '../components/theme/DynamicIcon';
import { CHEST_TYPES, openChestAction, calculateDynamicSpeedUpCost, CHEST_POINTS_REQUIRED } from '../core/chest';

const ChestItem = ({ 
  state, 
  title, 
  timeLabel,
  iconName,
  progressPct,
  onOpen,
  speedUpCost,
  canAfford,
  onSpeedUp,
  slotIndex
}: { 
  state: 'ready' | 'opening' | 'empty', 
  title: string, 
  timeLabel: string,
  iconName?: string,
  progressPct?: number,
  onOpen?: () => void,
  speedUpCost?: number,
  canAfford?: boolean,
  onSpeedUp?: () => void,
  slotIndex?: number
}) => {
  if (state === 'empty') {
    return (
      <div className="flex-1 bg-white/50 border-theme-base border-dashed border-theme-border-main rounded-[1.25rem] p-3 flex flex-col items-center justify-center opacity-60 min-h-[130px]">
        <Box size={24} className="text-theme-text-muted mb-2" />
        <span className="font-black text-[9px] uppercase text-theme-text-secondary tracking-widest text-center">Kosong</span>
      </div>
    );
  }
  
  if (state === 'opening') {
    return (
      <div className="flex-1 bg-theme-bg-soft-blue border-theme-base border-theme-border-main rounded-[1.25rem] p-2.5 shadow-theme-base relative flex flex-col items-center justify-between min-h-[130px] text-center">
         <div className="w-10 h-10 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-lg flex items-center justify-center shrink-0 shadow-theme-sm mb-2 mt-1">
            <DynamicIcon name={iconName || "collection_chest"} type="logo" LucideFallback={Unlock} className="w-[80%] h-[80%] object-contain" />
         </div>
         <div className="flex-1 flex flex-col w-full items-center justify-end">
            <h3 className="font-black text-theme-text-primary text-[10px] uppercase tracking-wider leading-tight">{title}</h3>
            <span className="font-black text-[8px] text-blue-600 uppercase tracking-widest mt-0.5 mb-2">{timeLabel}</span>
            <div className="w-full mt-auto">
               <ProgressBar progress={progressPct || 0} label="" />
            </div>
            {onSpeedUp && (
              <KineticButton onClick={onSpeedUp} disabled={!canAfford} colorClass="bg-theme-primary-sunny-yellow" className="py-1.5 px-1 w-full text-[9px] mt-2 flex items-center justify-center gap-1">
                 <span data-testid={`chest-speedup-${slotIndex}`} className="flex items-center gap-1"><Zap size={10} strokeWidth={3} /> {speedUpCost} <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-3 h-3 object-contain" /></span>
              </KineticButton>
            )}
         </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-theme-primary-warm-orange border-theme-base border-theme-border-main rounded-[1.25rem] p-2.5 shadow-theme-base flex flex-col items-center justify-between min-h-[130px] relative text-center">
       <div className="absolute -top-2 -right-2 w-5 h-5 bg-theme-game-danger border-theme-sm border-theme-border-main rounded-full flex items-center justify-center text-theme-text-white font-black text-[10px] shadow-theme-sm z-10 animate-pulse">!</div>
       <div className="w-10 h-10 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-lg flex items-center justify-center shrink-0 shadow-theme-sm mb-2 mt-1">
          <DynamicIcon name={iconName || "collection_chest"} type="logo" LucideFallback={Box} className="w-[80%] h-[80%] object-contain" />
       </div>
       <div className="flex-1 flex flex-col w-full items-center justify-end">
          <h3 className="font-black text-theme-text-primary text-[10px] uppercase tracking-wider leading-tight">{title}</h3>
          <span className="font-black text-[8px] text-green-600 uppercase tracking-widest mt-0.5 mb-2">{timeLabel}</span>
          <KineticButton onClick={onOpen} colorClass="bg-theme-primary-coral-pink" className="py-1.5 px-1 w-full text-[9px] mt-auto"><span data-testid={`chest-open-${slotIndex}`}>BUKA</span></KineticButton>
       </div>
    </div>
  );
};

import { useCDE } from '../core/cde';

export const ChestScreen = () => {
  const { navigate, screen } = useGame();
  const audio = useAudio();
  const { profile, updateProfile } = useProfile();
  const cde = useCDE();
  const [rewardModal, setRewardModal] = useState<any>(null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track if this component is mounted to handle the close animation
  const [isVisible, setIsVisible] = useState(true);

  // When 'screen' changes away from 'peti', trigger exit animation
  useEffect(() => {
    if (screen !== 'peti') {
      setIsVisible(false);
    } else {
      setIsVisible(true);
    }
  }, [screen]);

  const handleClose = () => {
    audio.playUiClick();
    setIsVisible(false);
    setTimeout(() => {
      navigate('home');
    }, 300); // Wait for animation to finish
  };

  const handleOpenChest = (slotIndex: number) => {
    const result = openChestAction(profile, slotIndex);
    if (result.rewards && result.rewards.chestType) {
       audio.playSfx('uiReward', () => audio.playMatch());
       // The authoritative roll happens on the server; the preview shows the local roll.
       cde.queueMutation('OPEN_CHEST', { slotId: slotIndex });
       setRewardModal(result.rewards);
    }
  };

  const handleSpeedUp = (slotIndex: number) => {
    const chest = (profile?.chestSlots || [])[slotIndex];
    if (!chest) return;
    const cost = calculateDynamicSpeedUpCost(chest.type, chest.startTime);
    if (cost > 0 && cde.permen >= cost) {
      audio.playUiClick();
      cde.queueMutation('SPEED_UP_CHEST', { slotId: slotIndex });
    }
  };

  const chestProgress = Math.min(profile?.chestProgress || 0, CHEST_POINTS_REQUIRED);

  const handleClaim = () => {
    audio.playUiClick();
    setRewardModal(null);
  };

  const chestSlots = profile?.chestSlots || [null, null, null];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          key="chest-sheet-backdrop"
          className="absolute inset-0 z-[100] flex flex-col justify-end pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-black/60 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />
          
          {/* Bottom Sheet */}
          <motion.div 
            className="w-full bg-orange-50 border-t-theme-lg border-theme-border-main rounded-t-[2.5rem] shadow-[0px_-8px_0px_0px_rgba(0,0,0,0.2)] flex flex-col font-sans relative pointer-events-auto max-h-[85vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b-theme-base border-gray-900/10">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-theme-primary-warm-orange border-theme-sm border-theme-border-main rounded-xl flex items-center justify-center shadow-theme-sm">
                   <DynamicIcon name="collection_chest" type="logo" LucideFallback={Box} className="w-[80%] h-[80%] object-contain text-theme-text-primary drop-shadow-[2px_2px_0px_rgba(255,255,255,0.6)]" />
                 </div>
                 <h2 className="text-xl font-black text-theme-text-primary uppercase tracking-tighter leading-none mt-1">Peti Harta Karun</h2>
              </div>
              <button
                  data-testid="chest-close-button"
                  onClick={handleClose}
                  className="p-2 bg-theme-surface-card-soft border-theme-sm border-theme-border-main rounded-full shadow-theme-sm active:translate-y-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
              >
                <X size={20} className="text-theme-text-primary" strokeWidth={3}/>
              </button>
            </div>
            
            {/* Next chest progress */}
            <div className="px-5 pt-4 flex items-center gap-3">
               <span className="font-black text-[10px] uppercase tracking-widest text-theme-text-secondary shrink-0">Peti Berikutnya</span>
               <div className="flex-1"><ProgressBar progress={(chestProgress / CHEST_POINTS_REQUIRED) * 100} label={`${chestProgress} / ${CHEST_POINTS_REQUIRED} PTS`} /></div>
            </div>
            <div className="px-5 pt-2 flex items-center justify-between">
               <span className="font-bold text-[10px] text-theme-text-muted">Menang level = +2 PTS (bonus: flawless, combo, cepat)</span>
               <div className="flex items-center gap-1 font-black text-xs text-theme-text-primary"><DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-4 h-4 object-contain" /> {cde.permen}</div>
            </div>

            {/* Content List */}
            <div className="p-5 flex flex-row gap-3 pb-8 overflow-x-auto min-h-[160px]">
               {chestSlots.map((chest: any, idx: number) => {
                  if (!chest) {
                     return <ChestItem key={idx} state="empty" title="" timeLabel="" />;
                  }
                  
                  const typeConfig = CHEST_TYPES[chest.type as keyof typeof CHEST_TYPES];
                  const elapsed = now - chest.startTime;
                  const remainingMs = typeConfig.durationMs - elapsed;
                  const isReady = remainingMs <= 0;
                  
                  if (isReady) {
                     return <ChestItem key={idx} slotIndex={idx} state="ready" title={typeConfig.name} timeLabel="Siap!" iconName={`chest_${chest.type}`} onOpen={() => handleOpenChest(idx)} />;
                  } else {
                     const h = Math.floor(remainingMs / 3600000);
                     const m = Math.floor((remainingMs % 3600000) / 60000);
                     const timeLabel = h > 0 ? `${h}j ${m}m` : `${m}m`;
                     const progressPct = Math.min(100, (elapsed / typeConfig.durationMs) * 100);
                     
                     const cost = calculateDynamicSpeedUpCost(chest.type, chest.startTime, now);
                     return <ChestItem key={idx} slotIndex={idx} state="opening" title={typeConfig.name} timeLabel={timeLabel} iconName={`chest_${chest.type}`} progressPct={progressPct} speedUpCost={cost} canAfford={cde.permen >= cost} onSpeedUp={() => handleSpeedUp(idx)} />;
                  }
               })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Reward Modal - Rendered on top of the sheet */}
      {rewardModal && (
        <motion.div
           key="reward-modal"
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/80 z-[110] flex items-center justify-center p-6 pointer-events-auto"
        >
           <motion.div
             initial={{ scale: 0.5, y: 50 }}
             animate={{ scale: 1, y: 0 }}
             exit={{ scale: 0.8, opacity: 0 }}
             transition={{ type: 'spring', damping: 15 }}
             className="bg-theme-surface-card-white border-theme-lg border-theme-border-main rounded-[2rem] p-6 flex flex-col items-center w-full max-w-[320px] shadow-theme-lg text-center relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-theme-bg-soft-pink opacity-50" />
              <div className="absolute -top-20 -left-20 w-40 h-40 bg-theme-primary-sunny-yellow rounded-full blur-3xl opacity-50" />
              
              <h3 className="font-black text-2xl text-theme-text-primary uppercase tracking-tighter mb-6 relative z-10">Peti Terbuka!</h3>
              
              <div className="w-24 h-24 bg-theme-primary-sunny-yellow border-theme-base border-theme-border-main rounded-[1.5rem] flex items-center justify-center shadow-theme-base mb-6 relative z-10 ">
                 <Gift size={48} className="text-theme-primary-coral-pink" />
              </div>
              
              <div data-testid="chest-reward-list" className="grid grid-cols-2 gap-3 relative z-10 w-full mb-6">
                 {[
                   { key: 'permen', label: 'Permen', color: 'text-theme-currency-candy-purple', icon: Candy, iconName: 'permen' },
                   { key: 'hints', label: 'Hint', color: 'text-blue-600', icon: Search, iconName: 'hint' },
                   { key: 'shuffles', label: 'Shuffle', color: 'text-orange-600', icon: RefreshCw, iconName: 'shuffle' },
                   { key: 'hammers', label: 'Hammer', color: 'text-amber-600', icon: Hammer },
                   { key: 'bombs', label: 'Bomb', color: 'text-red-600', icon: Bomb },
                 ].filter(r => rewardModal?.[r.key]).map(r => (
                   <div key={r.key} className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-xl py-2 px-2 flex items-center justify-center gap-2 shadow-theme-base">
                      {r.iconName ? <DynamicIcon name={r.iconName} type="logo" LucideFallback={r.icon} className="w-6 h-6 object-contain" /> : <r.icon size={18} className={r.color} />}
                      <div className="flex flex-col items-start leading-none">
                        <span className={`font-black text-lg ${r.color}`}>+{rewardModal[r.key]}</span>
                        <span className="font-black text-[9px] text-theme-text-secondary uppercase tracking-widest">{r.label}</span>
                      </div>
                   </div>
                 ))}
              </div>
              <KineticButton
                 onClick={handleClaim}
                colorClass="bg-theme-primary-coral-pink"
                className="w-full py-3 text-base relative z-10"
              >
                <span data-testid="chest-reward-claim">Klaim Hadiah</span>
              </KineticButton>
           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
