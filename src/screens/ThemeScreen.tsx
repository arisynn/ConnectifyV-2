import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, Palette, Check, Lock, Candy, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton, CurrencyPill } from '../designs/KineticComponents';
import { KineticDialog, KineticModal } from '../designs/KineticPopups';
import { useTheme } from '../core/theme/ThemeProvider';
import { useProfile } from '../core/profile/ProfileContext';

const ThemeCard = ({ 
  title, 
  state, 
  price,
  color1, 
  color2,
  onEquip,
  onBuy
}: { 
  title: string, 
  state: 'equipped' | 'unlocked' | 'locked', 
  price: number,
  color1: string, 
  color2: string,
  onEquip?: () => void,
  onBuy?: () => void
}) => (
  <div className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-4 shadow-theme-lg ${state === 'locked' ? 'opacity-70' : ''}`}>
     <div className={`w-full h-24 border-theme-base border-theme-border-main rounded-2xl mb-4 flex items-center justify-center relative overflow-hidden`} style={{ background: `linear-gradient(135deg, ${color1}, ${color2})` }}>
        {state === 'locked' && <Lock size={32} className="text-gray-900/50" />}
        {state === 'equipped' && (
           <div className="absolute top-2 right-2 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full p-1">
              <Check size={16} className="text-theme-primary-tropical-green" strokeWidth={4} />
           </div>
        )}
     </div>
     <h3 className="font-black text-theme-text-primary text-[15px] uppercase tracking-wider text-center mb-3">{title}</h3>
     
     {state === 'equipped' && (
       <KineticButton colorClass="bg-theme-surface-card-soft" className="w-full py-2.5 text-sm !shadow-none opacity-50 cursor-default">Sedang Dipakai</KineticButton>
     )}
     {state === 'unlocked' && (
       <KineticButton onClick={onEquip} colorClass="bg-theme-primary-coral-pink" className="w-full py-2.5 text-sm">Pakai Tema</KineticButton>
     )}
     {state === 'locked' && (
       <KineticButton onClick={onBuy} colorClass="bg-theme-currency-candy-purple" className="w-full py-2.5 text-sm flex items-center justify-center gap-1.5">
          <span className="font-black text-xs">{price}</span> <Candy size={14} className="text-purple-700 fill-purple-400" />
       </KineticButton>
     )}
  </div>
);

import { useCDE } from '../core/cde';
import { DynamicIcon } from '../components/theme/DynamicIcon';


export const ThemeScreen = () => {
  const { navigate } = useGame();
  const { profile, updateProfile } = useProfile();
  const { activeTheme, setTheme, availableThemes } = useTheme();
  const cde = useCDE();
  
  const [purchaseModal, setPurchaseModal] = useState<{id: string, name: string, price: number} | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleBuy = () => {
     if (!purchaseModal) return;
     if (cde.permen >= purchaseModal.price) {
        cde.queueMutation('PURCHASE_ITEM', { itemId: 'theme_' + purchaseModal.id });
        setPurchaseModal(null);
        setShowSuccess(true);
     } else {
        setPurchaseModal(null);
        setShowError(true);
     }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-theme-bg z-[100] flex flex-col font-sans"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 z-10 shrink-0 bg-theme-bg-soft-yellow border-b-theme-base border-theme-border-main shadow-theme-base">
        <div className="flex items-center gap-4">
           <button 
              onClick={() => navigate('home')} 
              className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
           >
             <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
           </button>
           <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Tema</h2>
        </div>
        <CurrencyPill type="candy" value={cde.permen} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pt-6 pb-12 grid grid-cols-2 gap-4 content-start">
         {Object.values(availableThemes).map((theme) => {
           const isEquipped = activeTheme.id === theme.id;
           const isUnlocked = profile?.unlockedThemes?.includes(theme.id);
           const state = isEquipped ? 'equipped' : (isUnlocked ? 'unlocked' : 'locked');

           return (
             <ThemeCard 
               key={theme.id}
               title={theme.name} 
               state={state} 
               price={theme.price}
               color1={theme.colors.bg || theme.colors['bg-main']} 
               color2={theme.colors.primary || theme.colors['primary-coral-pink']} 
               onEquip={() => setTheme(theme.id)}
               onBuy={() => setPurchaseModal({ id: theme.id, name: theme.name, price: theme.price })}
             />
           );
         })}
      </div>

      <KineticDialog
        isOpen={purchaseModal !== null}
        onClose={() => setPurchaseModal(null)}
        icon={Palette}
        title="Beli Tema?"
        description={`Kamu akan menukar ${purchaseModal?.price} Permen untuk tema ${purchaseModal?.name}.`}
        primaryAction={{ label: 'Ya, Beli', onClick: handleBuy, colorClass: 'bg-theme-primary-tropical-green' }}
        secondaryAction={{ label: 'Batal', onClick: () => setPurchaseModal(null) }}
      />

      <KineticModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} colorClass="bg-theme-bg-soft-mint" widthClass="w-full max-w-xs" className="text-center pt-8">
        <div className="w-16 h-16 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1rem] mx-auto flex items-center justify-center shadow-theme-sm mb-4">
           <Palette size={32} className="text-theme-primary-coral-pink" strokeWidth={2.5}/>
        </div>
        <h2 className="font-black text-xl text-theme-text-primary uppercase tracking-wide mb-6">Tema Terbuka!</h2>
        <KineticButton onClick={() => setShowSuccess(false)} colorClass="bg-theme-surface-card-white" className="w-full py-3">OK</KineticButton>
      </KineticModal>

      <KineticDialog
        isOpen={showError}
        onClose={() => setShowError(false)}
        icon={AlertTriangle}
        title="Permen Kurang"
        description="Maaf, kamu tidak memiliki cukup Permen untuk membeli tema ini."
        primaryAction={{ label: 'Tutup', onClick: () => setShowError(false), colorClass: 'bg-theme-divider-main' }}
      />

      {/* TOAST MODAL */}
      <AnimatePresence>
         {toastMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-20 left-0 right-0 flex justify-center z-[120] pointer-events-none"
            >
              <div className="bg-theme-primary-navy text-theme-text-white font-bold text-sm px-6 py-3 rounded-full shadow-theme-base border-theme-sm border-theme-border-main">
                {toastMsg}
              </div>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
};
