import React from 'react';
import { useGame, Screen } from '../GameContext';
import { User, Gem, Coins, Bell, Users, Box, Gift, Store, Target, Palette, Trophy, BarChart2, Play, Lock, Candy } from 'lucide-react';
import { motion } from 'motion/react';
import { DynamicIcon } from '../components/theme/DynamicIcon';

// --- DESIGN TOKENS ---
export const BORDER = "border-theme-base border-theme-border-main";
export const BORDER_SM = "border-theme-sm border-theme-border-main";
export const SHADOW = "shadow-theme-base";
export const SHADOW_SM = "shadow-theme-sm";
export const RADIUS = "rounded-theme-base";
export const RADIUS_LG = "rounded-theme-lg";

// --- COMPONENTS ---

export const KineticButton = ({ 
  children, 
  onClick, 
  className = "", 
  colorClass = "bg-theme-primary-coral-pink",
  disabled = false
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  className?: string,
  colorClass?: string,
  disabled?: boolean
}) => (
  <motion.button
    whileHover={!disabled ? { scale: 1.02 } : {}}
    whileTap={!disabled ? { scale: 0.95 } : {}}
    onClick={!disabled ? onClick : undefined}
    disabled={disabled}
    className={`relative ${BORDER} ${RADIUS} font-black uppercase tracking-wider text-theme-text-primary ${SHADOW} transition-all ${!disabled ? 'active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)] active:translate-x-[var(--geometry-press-translate-x)]' : ''} ${disabled ? 'opacity-50 cursor-not-allowed bg-theme-divider-main' : colorClass} ${className}`}
  >
    {children}
  </motion.button>
);

export const KineticCard = ({ 
  children, 
  onClick,
  className = "", 
  colorClass = "bg-theme-surface-card-white",
  tiltClass = ""
}: { 
  children: React.ReactNode, 
  onClick?: () => void,
  className?: string,
  colorClass?: string,
  tiltClass?: string
}) => {
  const CardContent = (
    <div className={`${BORDER} ${RADIUS} ${SHADOW} p-4 ${colorClass} ${className} ${tiltClass}`}>
      {children}
    </div>
  );

  if (onClick) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`block w-full text-left ${BORDER} ${RADIUS} ${SHADOW} p-4 transition-all active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)] active:translate-x-[var(--geometry-press-translate-x)] ${colorClass} ${className} ${tiltClass}`}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        {children}
      </motion.button>
    );
  }

  return CardContent;
};

export const CurrencyPill = ({ type, value, onClick }: { type: 'gem' | 'coin' | 'candy', value?: string | number, onClick?: () => void }) => {
  const isGem = type === 'gem';
  const isCandy = type === 'candy';
  return (
    <motion.div 
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.92 } : {}}
      onClick={onClick}
      className={`flex items-center gap-1.5 bg-theme-surface-card-white ${BORDER} rounded-full pl-2 pr-2 py-1 ${SHADOW_SM} transition-all ${onClick ? 'cursor-pointer active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)]' : ''}`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center`}>
         {isGem ? (
           <Gem size={20} className="text-theme-primary-coral-pink fill-pink-200" strokeWidth={2.5} />
         ) : isCandy ? (
           <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-7 h-7 object-contain drop-shadow-sm" />
         ) : (
           <Coins size={20} className="text-yellow-500 fill-yellow-200" strokeWidth={2.5} />
         )}
      </div>
      <span className="font-black text-[15px] text-theme-text-primary tracking-tighter leading-none mt-0.5">{value ?? 0}</span>
      {onClick && (
        <div className={`w-5 h-5 ml-1 ${isGem ? 'bg-theme-primary-sunny-yellow' : isCandy ? 'bg-theme-currency-candy-purple' : 'bg-pink-300'} border-theme-sm border-theme-border-main rounded-full flex items-center justify-center text-[12px] font-black leading-none shadow-[var(--geometry-shadow-active)]`}>+</div>
      )}
    </motion.div>
  );
};

export const ProfileComponent = ({ onClick, className = "", avatarStr, avatarBg, seed, bgColor }: { onClick?: () => void, className?: string, seed?: string, bgColor?: string, avatarStr?: string | null, avatarBg?: string | null }) => {
  let finalAvatar = avatarStr;
  
  // Safe fallback for legacy dicebear data
  if (!finalAvatar || finalAvatar.includes(':') || finalAvatar.includes('dicebear') || finalAvatar.includes('http')) {
     finalAvatar = 'avatar_male';
  }

  return (
    <motion.button 
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.9, rotate: -5 } : {}}
      onClick={onClick} 
      className={`pointer-events-auto relative border-theme-base border-theme-border-main rounded-full overflow-hidden ${SHADOW} shrink-0 transition-all ${className} ${onClick ? 'cursor-pointer active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)] active:translate-x-[var(--geometry-press-translate-x)]' : ''}`}
      style={{ backgroundColor: avatarBg || bgColor || '#ffdfba' }}
    >
      <DynamicIcon name={finalAvatar} type="logo" className="w-full h-full object-cover p-2" />
    </motion.button>
  );
};

export const IconTile = ({ 
  icon: Icon, 
  iconName,
  onClick, 
  colorClass, 
  badge, 
  tiltClass = "",
  className = "",
  ariaLabel
}: { 
  icon: any,
  iconName?: string,
  onClick: () => void, 
  colorClass: string, 
  badge?: number,
  tiltClass?: string,
  className?: string,
  ariaLabel: string
}) => {
  return (
    <motion.button
      aria-label={ariaLabel}
      title={ariaLabel}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative w-full aspect-square ${colorClass} ${BORDER} ${RADIUS} flex items-center justify-center ${SHADOW} transition-all active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)] active:translate-x-[var(--geometry-press-translate-x)] ${tiltClass} ${className}`}
    >
      {iconName ? (
        <DynamicIcon name={iconName} type="logo" LucideFallback={Icon} className="w-[70%] h-[70%] max-w-[56px] max-h-[56px] object-contain drop-shadow-[2px_3px_0px_rgba(0,0,0,0.15)] text-theme-text-primary" />
      ) : (
        <Icon className="text-theme-text-primary drop-shadow-[2px_3px_0px_rgba(0,0,0,0.15)] w-[70%] h-[70%] max-w-[56px] max-h-[56px]" strokeWidth={2.5} />
      )}
      {!!badge && badge > 0 && (
        <div className={`absolute -top-2 -right-2 w-5 h-5 sm:w-6 sm:h-6 bg-red-500 rounded-full border-theme-sm border-theme-border-main flex items-center justify-center text-white text-[10px] sm:text-[11px] font-black shadow-theme-sm z-10`}>
          {badge}
        </div>
      )}
    </motion.button>
  );
};

export const PlayCTA = ({ onClick, className = "", colorClass = "bg-theme-primary-coral-pink" }: { onClick: () => void, className?: string, colorClass?: string }) => (
  <motion.button 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick} 
    className={`w-full aspect-[2.2/1] max-h-[25dvh] flex items-center justify-center group overflow-hidden relative border-theme-lg border-theme-border-main rounded-[2.5rem] shadow-theme-lg transition-all active:shadow-[var(--geometry-shadow-active)] active:translate-y-[calc(var(--geometry-press-translate-y)+1px)] active:translate-x-[var(--geometry-press-translate-x)] ${colorClass} ${className}`}
  >
     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
     
     <DynamicIcon 
       name="play" 
       type="logo" 
       LucideFallback={Play} 
       className="ml-1 sm:ml-2 w-20 h-20 sm:w-24 sm:h-24 drop-shadow-[2px_4px_0px_rgba(0,0,0,0.2)] group-active:scale-95 transition-transform z-10" 
     />
  </motion.button>
);

export const ProgressBar = ({ progress, label }: { progress: number, label: string }) => (
  <div className={`bg-theme-surface-card-soft ${BORDER} rounded-full h-5 p-0.5 relative overflow-hidden flex shadow-[inset_2px_3px_0px_rgba(0,0,0,0.1)]`}>
     <div className={`bg-theme-primary-coral-pink h-full rounded-full ${BORDER_SM}`} style={{ width: `${progress}%` }} />
     {label && (
       <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black tracking-widest text-theme-text-primary drop-shadow-[1px_1px_0px_rgba(255,255,255,1)]">
         {label}
       </span>
     )}
  </div>
);

export const NotificationCard = ({ 
  title, 
  description, 
  time, 
  icon: Icon, 
  colorClass = "bg-theme-bg-soft-pink", 
  accentClass = "bg-theme-primary-coral-pink", 
  iconColorClass = "text-theme-primary-coral-pink" 
}: {
  title: string,
  description: string,
  time: string,
  icon: any,
  colorClass?: string,
  accentClass?: string,
  iconColorClass?: string
}) => (
  <div className={`${colorClass} ${BORDER_SM} ${RADIUS} p-4 flex gap-4 ${SHADOW} relative overflow-hidden`}>
     <div className={`absolute top-0 right-0 w-2 h-full ${accentClass} border-l-theme-sm border-theme-border-main`} />
     <div className={`w-12 h-12 bg-theme-surface-card-white ${BORDER_SM} rounded-xl flex items-center justify-center shrink-0 ${SHADOW_SM}`}>
       <Icon size={24} className={iconColorClass} />
     </div>
     <div className="flex-1">
       <div className="flex justify-between items-start">
         <h3 className="font-black text-theme-text-primary text-sm uppercase tracking-wider">{title}</h3>
         <span className="font-bold text-[10px] text-theme-text-muted">{time}</span>
       </div>
       <p className="font-bold text-theme-text-secondary text-[11px] leading-tight mt-1 max-w-[90%]">{description}</p>
     </div>
  </div>
);

export const ChestSlot = ({ 
  state, 
  onClick 
}: { 
  state: 'available' | 'empty' | 'locked', 
  onClick?: () => void 
}) => {
  if (state === 'available') {
    return (
      <motion.div 
        whileTap={{ scale: 0.95 }}
        onClick={onClick} 
        className={`flex-1 aspect-square bg-theme-primary-sunny-yellow ${BORDER} ${RADIUS} flex flex-col items-center justify-center relative ${SHADOW} cursor-pointer group transition-all active:shadow-[var(--geometry-shadow-active)] active:translate-y-[var(--geometry-press-translate-y)] active:translate-x-[var(--geometry-press-translate-x)]`}
      >
        <Box size={32} className="text-theme-primary-coral-pink mb-1 group-active:scale-90 transition-transform drop-shadow-[2px_2px_0px_rgba(0,0,0,0.2)]" />
        <span className="font-black text-[11px] uppercase tracking-widest">Buka</span>
        <div className={`absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full ${BORDER_SM}`} />
      </motion.div>
    );
  }
  
  if (state === 'empty') {
    return (
      <div onClick={onClick} className={`flex-1 aspect-square bg-white/50 border-theme-base border-dashed border-theme-border-main ${RADIUS} flex flex-col items-center justify-center opacity-60 cursor-pointer`}>
        <Box size={28} className="text-theme-text-muted mb-1" />
        <span className="font-black text-[10px] uppercase text-theme-text-secondary tracking-widest">Kosong</span>
      </div>
    );
  }
  
  return (
    <div onClick={onClick} className={`flex-1 aspect-square bg-theme-divider-main ${BORDER} ${RADIUS} flex flex-col items-center justify-center shadow-[inset_3px_4px_0px_rgba(0,0,0,0.15)] cursor-pointer`}>
      <Lock size={24} className="text-theme-text-muted mb-1" />
      <span className="font-black text-[10px] uppercase text-theme-text-secondary tracking-widest">Kunci</span>
    </div>
  );
};
