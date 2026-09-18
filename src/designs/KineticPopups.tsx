import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { BORDER, SHADOW, RADIUS, BORDER_SM, RADIUS_LG, SHADOW_SM } from './KineticComponents';
import { DynamicIcon } from '../components/theme/DynamicIcon';

// --- BASE MODAL/BACKDROP ---
export const KineticBackdrop = ({ children, onClick, isOpen }: { children: React.ReactNode, onClick?: () => void, isOpen: boolean }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClick}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-theme-overlay/40 backdrop-blur-sm"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export const KineticCloseButton = ({ onClick, className = "" }: { onClick: () => void, className?: string }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9, y: "var(--geometry-press-translate-y)", boxShadow: "var(--geometry-shadow-active)" }}
    onClick={onClick}
    className={`absolute -top-3 -right-3 w-10 h-10 bg-red-400 ${BORDER} rounded-full flex items-center justify-center ${SHADOW_SM} z-10 ${className}`}
  >
    <X size={24} className="text-theme-text-primary" strokeWidth={3} />
  </motion.button>
);

export const KineticModal = ({ 
  isOpen, 
  onClose, 
  children,
  className = "",
  colorClass = "bg-theme-surface-card-white",
  widthClass = "w-full max-w-sm"
}: { 
  isOpen: boolean, 
  onClose?: () => void, 
  children: React.ReactNode,
  className?: string,
  colorClass?: string,
  widthClass?: string
}) => (
  <KineticBackdrop isOpen={isOpen} onClick={onClose}>
    <motion.div
      initial={{ scale: 0.9, y: 20, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      exit={{ scale: 0.9, y: 20, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      onClick={(e) => e.stopPropagation()}
      className={`relative ${BORDER} ${RADIUS_LG} ${SHADOW} ${colorClass} bg-[image:var(--asset-bg-popup)] bg-cover bg-center ${widthClass} p-5 ${className}`}
    >
      {onClose && <KineticCloseButton onClick={onClose} />}
      {children}
    </motion.div>
  </KineticBackdrop>
);

export const KineticBottomSheet = ({
  isOpen,
  onClose,
  children,
  className = "",
  colorClass = "bg-theme-surface-card-white"
}: {
  isOpen: boolean,
  onClose?: () => void,
  children: React.ReactNode,
  className?: string,
  colorClass?: string
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-theme-overlay/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className={`fixed bottom-0 left-0 right-0 z-50 ${BORDER} rounded-t-[2rem] border-b-0 ${SHADOW} ${colorClass} bg-[image:var(--asset-bg-popup)] bg-cover bg-center p-5 pb-8 ${className}`}
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-theme-overlay rounded-full opacity-30" />
          {onClose && <KineticCloseButton onClick={onClose} className="top-4 right-4" />}
          <div className="mt-4">{children}</div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- MODAL INTERNAL COMPONENTS ---

export const KineticDialog = ({
  isOpen,
  onClose,
  title,
  description,
  primaryAction,
  secondaryAction,
  icon: Icon,
  iconName
}: {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  description: string,
  primaryAction: { label: string, onClick: () => void, colorClass?: string },
  secondaryAction?: { label: string, onClick: () => void },
  icon?: any,
  iconName?: string
}) => (
  <KineticModal isOpen={isOpen} onClose={onClose} widthClass="w-full max-w-xs" className="text-center pt-8">
    {(Icon || iconName) && (
      <div className={`absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-theme-primary-sunny-yellow ${BORDER} rounded-full flex items-center justify-center ${SHADOW} z-10`}>
        {iconName ? (
           <DynamicIcon name={iconName} type="logo" LucideFallback={Icon} className="w-10 h-10 object-contain drop-shadow-[2px_3px_0px_rgba(0,0,0,0.15)] text-theme-text-primary" />
        ) : (
           <Icon size={32} className="text-theme-text-primary" strokeWidth={2.5} />
        )}
      </div>
    )}
    <h2 className="font-black text-xl text-theme-text-primary uppercase tracking-wide mb-2">{title}</h2>
    <p className="font-bold text-theme-text-secondary text-sm leading-tight mb-6">{description}</p>
    <div className="flex flex-col gap-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95, y: "var(--geometry-press-translate-y)", x: "var(--geometry-press-translate-x)", boxShadow: "var(--geometry-shadow-active)" }}
        onClick={primaryAction.onClick}
        className={`w-full py-3 ${BORDER} ${RADIUS} font-black uppercase tracking-wider text-theme-text-primary ${SHADOW} transition-colors ${primaryAction.colorClass || 'bg-theme-primary-coral-pink'}`}
      >
        {primaryAction.label}
      </motion.button>
      {secondaryAction && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95, y: "var(--geometry-press-translate-y)", x: "var(--geometry-press-translate-x)", boxShadow: "var(--geometry-shadow-active)" }}
          onClick={secondaryAction.onClick}
          className={`w-full py-3 ${BORDER} ${RADIUS} font-black uppercase tracking-wider text-theme-text-primary shadow-theme-sm bg-theme-surface-card-white`}
        >
          {secondaryAction.label}
        </motion.button>
      )}
    </div>
  </KineticModal>
);

export const KineticIconButton = ({
  icon: Icon,
  onClick,
  colorClass = "bg-theme-surface-card-white",
  className = ""
}: {
  icon: any,
  onClick: () => void,
  colorClass?: string,
  className?: string
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.9, y: "var(--geometry-press-translate-y)", x: "var(--geometry-press-translate-x)", boxShadow: "var(--geometry-shadow-active)" }}
    onClick={onClick}
    className={`w-12 h-12 flex items-center justify-center ${BORDER} ${RADIUS} ${SHADOW_SM} ${colorClass} ${className}`}
  >
    <Icon size={24} className="text-theme-text-primary" strokeWidth={2.5} />
  </motion.button>
);

export const KineticToggle = ({
  isOn,
  onToggle,
  label,
  icon: Icon
}: {
  isOn: boolean,
  onToggle: () => void,
  label: string,
  icon?: any
}) => (
  <div className={`flex items-center justify-between p-3 ${BORDER_SM} ${RADIUS} bg-theme-surface-card-white shadow-[inset_2px_3px_0px_rgba(0,0,0,0.05)]`}>
    <div className="flex items-center gap-3">
      {Icon && <div className="w-8 h-8 bg-theme-neutral-100 rounded-lg flex items-center justify-center border-theme-sm border-theme-border-main"><Icon size={18} className="text-theme-text-primary" /></div>}
      <span className="font-black text-theme-text-primary uppercase tracking-wide text-sm">{label}</span>
    </div>
    <motion.button
      onClick={onToggle}
      className={`relative w-14 h-8 ${BORDER} rounded-full transition-colors ${isOn ? 'bg-green-400' : 'bg-theme-divider-main'} shadow-[inset_1px_2px_0px_rgba(0,0,0,0.2)]`}
    >
      <motion.div
        initial={false}
        animate={{ x: isOn ? 24 : 4 }}
        className={`absolute top-1 bottom-1 w-5 h-5 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full shadow-[var(--geometry-shadow-active)]`}
      />
    </motion.button>
  </div>
);

export const KineticBadge = ({ text, colorClass = "bg-theme-primary-sunny-yellow" }: { text: string, colorClass?: string }) => (
  <div className={`inline-block px-2.5 py-1 ${colorClass} ${BORDER_SM} rounded-full text-[10px] font-black uppercase tracking-widest text-theme-text-primary ${SHADOW_SM} `}>
    {text}
  </div>
);

export const KineticRewardCard = ({
  reward,
  delay = 0
}: {
  reward: { type: string, amount: number, icon: any, colorClass: string },
  delay?: number
}) => {
  const Icon = reward.icon;
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", damping: 15, delay }}
      className={`relative ${BORDER} ${RADIUS} ${reward.colorClass} p-4 flex flex-col items-center justify-center ${SHADOW} overflow-hidden`}
    >
      <div className="absolute -inset-4 bg-white/20  transform origin-top-left opacity-50" />
      <Icon size={48} className="text-theme-text-primary drop-shadow-[2px_3px_0px_rgba(255,255,255,0.5)] relative z-10 mb-2" strokeWidth={2} />
      <div className="relative z-10 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full px-3 py-1 shadow-theme-sm">
        <span className="font-black text-theme-text-primary text-sm">+{reward.amount} {reward.type}</span>
      </div>
    </motion.div>
  );
};
