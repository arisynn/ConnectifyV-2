import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, Candy, Heart, RefreshCw, Search, Hammer, Bomb, Check, AlertTriangle, Package, Palette, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton, CurrencyPill } from '../designs/KineticComponents';
import { KineticDialog, KineticModal } from '../designs/KineticPopups';
import { useProfile } from '../core/profile/ProfileContext';
import { ITEM_PRICES, getItemPrice } from '../core/economy';
const ShopConfig = [
    { id: 'shuffle', title: 'Shuffle Board', description: 'Acak papan permainan Connect, atau ganti pilihan balok di Block Puzzle.', price: ITEM_PRICES.shuffle, colorClass: 'bg-orange-200', iconColorClass: 'text-orange-600', iconName: 'RefreshCw', owned: 'shuffles' },
    { id: 'hint', title: 'Hint Tile', description: 'Tunjukkan satu pasang tile yang bisa dihubungkan.', price: ITEM_PRICES.hint, colorClass: 'bg-blue-200', iconColorClass: 'text-blue-600', iconName: 'Search', owned: 'hints' },
    { id: 'hammer', title: 'Hammer (Hancur)', description: 'Hancurkan satu blok yang mengganggu di papan Block Puzzle.', price: ITEM_PRICES.hammer, colorClass: 'bg-amber-200', iconColorClass: 'text-amber-600', iconName: 'Hammer', owned: 'hammers' },
    { id: 'bomb', title: 'Bomb (Ledakan)', description: 'Hancurkan area 3x3 blok di papan Block Puzzle.', price: ITEM_PRICES.bomb, colorClass: 'bg-red-200', iconColorClass: 'text-red-600', iconName: 'Bomb', owned: 'bombs' }
];
import { useTheme } from '../core/theme/ThemeProvider';
import { useCDE } from '../core/cde';
import { DynamicIcon } from '../components/theme/DynamicIcon';

const IconMap: Record<string, any> = {
    RefreshCw: RefreshCw,
    Search: Search,
    Hammer: Hammer,
    Bomb: Bomb
};

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
          <span className="font-black text-xs">{price}</span> <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-4 h-4 object-contain drop-shadow-sm" />
       </KineticButton>
     )}
  </div>
);

const ShopItem = ({ 
  icon: Icon, 
  iconName,
  title, 
  description, 
  price, 
  colorClass = "bg-theme-primary-tropical-green", 
  iconColorClass = "text-green-600",
  ownedCount,
  onBuy
}: { 
  icon: any, 
  iconName?: string,
  title: string, 
  description: string, 
  price: number, 
  colorClass?: string, 
  iconColorClass?: string,
  ownedCount?: number,
  onBuy: () => void 
}) => (
  <div data-testid={`shop-item-${iconName}`} className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-lg flex items-center gap-4">
     <div className={`w-16 h-16 ${colorClass} border-theme-base border-theme-border-main rounded-[1.2rem] flex items-center justify-center shrink-0 shadow-theme-sm relative`}>
        {ownedCount !== undefined && (
          <span data-testid={`shop-owned-${iconName}`} className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 px-1.5 bg-theme-surface-card-white rounded-full border-theme-sm border-theme-border-main flex items-center justify-center text-[11px] font-black text-theme-text-primary shadow-theme-sm">x{ownedCount}</span>
        )}
        {iconName ? (
           <DynamicIcon name={iconName} type="logo" LucideFallback={Icon} className={`w-10 h-10 object-contain drop-shadow-[2px_2px_0px_rgba(0,0,0,0.15)] ${iconColorClass}`} />
        ) : (
           <Icon size={32} className={iconColorClass} />
        )}
     </div>
     <div className="flex-1">
        <h3 className="font-black text-theme-text-primary text-[15px] uppercase tracking-wider leading-none mb-1">{title}</h3>
        <p className="font-bold text-[10px] text-theme-text-muted leading-tight mb-3 pr-2">{description}</p>
        <KineticButton onClick={onBuy} colorClass="bg-theme-currency-candy-purple" className="py-2 px-4 w-full flex items-center justify-center gap-1.5 !rounded-xl">
           <span className="font-black text-xs">{price}</span> <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-4 h-4 object-contain drop-shadow-sm" />
        </KineticButton>
     </div>
  </div>
);

export const ShopScreen = () => {
  const { navigate } = useGame();
  const { profile, updateProfile } = useProfile();
  const cde = useCDE();
  const { activeTheme, setTheme, availableThemes } = useTheme();
  
  const [activeTab, setActiveTab] = useState<'item' | 'tema'>('item');
  const [purchaseModal, setPurchaseModal] = useState<{name: string, price: number, id: string, type?: 'item' | 'theme'} | null>(null);
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
        if (purchaseModal.type === 'theme') {
            cde.queueMutation('PURCHASE_ITEM', { itemId: 'theme_' + purchaseModal.id });
        } else {
            cde.queueMutation('PURCHASE_ITEM', { itemId: purchaseModal.id });
        }
        setPurchaseModal(null);
        setShowSuccess(true);
     } else {
        setPurchaseModal(null);
        setShowError(true);
     }
  };

  const TabButton = ({ active, onClick, icon: Icon, colorClass }: { active: boolean, onClick: () => void, icon: any, colorClass: string }) => (
      <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] border-theme-base border-theme-border-main flex items-center justify-center transition-all duration-200 z-10 relative ${
              active 
                  ? `${colorClass} shadow-theme-base -translate-y-2` 
                  : 'bg-theme-surface-card-white shadow-theme-sm hover:bg-gray-50'
          }`}
      >
          <Icon size={26} strokeWidth={active ? 3 : 2.5} className={active ? 'text-theme-text-primary' : 'text-theme-text-muted'} />
      </motion.button>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-green-50 z-[100] flex flex-col font-sans"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 z-10 shrink-0 bg-theme-primary-tropical-green border-b-theme-base border-theme-border-main shadow-theme-base">
        <div className="flex items-center gap-4">
          <button 
             onClick={() => navigate('home')} 
             className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
          >
            <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
          </button>
          <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Toko</h2>
        </div>
        <CurrencyPill type="candy" value={cde.permen} />
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 pt-6 pb-32">
         {activeTab === 'item' && (
           <>
             {ShopConfig.map((item) => {
                 const IconComponent = IconMap[item.iconName] || Search;
                 return (
                   <ShopItem 
                     key={item.id}
                     icon={IconComponent} 
                     iconName={item.id}
                     title={item.title} 
                     description={item.description} 
                     price={item.price} 
                     colorClass={item.colorClass} 
                     iconColorClass={item.iconColorClass}
                     ownedCount={profile?.[item.owned] ?? 0}
                     onBuy={() => setPurchaseModal({name: item.title, price: item.price, id: item.id, type: 'item'})} 
                   />
                 );
             })}
             <div className="text-center text-xs text-gray-400 mt-4">Semua harga dalam Permen</div>
           </>
         )}

         {activeTab === 'tema' && (
           <div className="grid grid-cols-2 gap-4 content-start">
             {Object.values(availableThemes).map((theme) => {
               const isEquipped = activeTheme.id === theme.id;
               const isUnlocked = profile?.unlockedThemes?.includes(theme.id);
               const state = isEquipped ? 'equipped' : (isUnlocked ? 'unlocked' : 'locked');

               return (
                 <ThemeCard 
                   key={theme.id}
                   title={theme.name} 
                   state={state} 
                   price={getItemPrice('theme_' + theme.id) || theme.price}
                   color1={theme.colors.bg || theme.colors['bg-main']} 
                   color2={theme.colors.primary || theme.colors['primary-coral-pink']} 
                   onEquip={() => { setTheme(theme.id); updateProfile({ activeTheme: theme.id }); }}
                   onBuy={() => setPurchaseModal({ id: theme.id, name: theme.name, price: getItemPrice('theme_' + theme.id) || theme.price, type: 'theme' })}
                 />
               );
             })}
           </div>
         )}
      </div>

      {/* Bottom Navigation Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-theme-surface-card-white border-t-theme-lg border-theme-border-main flex justify-center gap-4 sm:gap-8 shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
          <TabButton 
              active={activeTab === 'item'} 
              onClick={() => setActiveTab('item')} 
              icon={Package} 
              colorClass="bg-theme-primary-coral-pink"
          />
          <TabButton 
              active={activeTab === 'tema'} 
              onClick={() => setActiveTab('tema')} 
              icon={Palette} 
              colorClass="bg-theme-currency-candy-purple"
          />
      </div>

      <KineticDialog
        isOpen={purchaseModal !== null}
        onClose={() => setPurchaseModal(null)}
        icon={Candy}
        iconName="permen"
        title="Beli Item?"
        description={`Apakah kamu yakin menukar ${purchaseModal?.price} Permen untuk ${purchaseModal?.name}?`}
        primaryAction={{ label: 'Ya, Beli', onClick: handleBuy, colorClass: 'bg-theme-primary-tropical-green' }}
        secondaryAction={{ label: 'Batal', onClick: () => setPurchaseModal(null) }}
      />

      <KineticModal isOpen={showSuccess} onClose={() => setShowSuccess(false)} colorClass="bg-theme-bg-soft-mint" widthClass="w-full max-w-xs" className="text-center pt-8">
        <div className="w-16 h-16 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full mx-auto flex items-center justify-center shadow-theme-sm mb-4">
           <Check size={32} className="text-theme-primary-tropical-green" strokeWidth={3}/>
        </div>
        <h2 className="font-black text-xl text-theme-text-primary uppercase tracking-wide mb-6">Pembelian Berhasil</h2>
        <KineticButton onClick={() => setShowSuccess(false)} colorClass="bg-theme-primary-tropical-green" className="w-full py-3">OK</KineticButton>
      </KineticModal>

      <KineticDialog
        isOpen={showError}
        onClose={() => setShowError(false)}
        icon={AlertTriangle}
        title="Permen Kurang"
        description="Maaf, kamu tidak memiliki cukup Permen untuk membeli item ini."
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
