import React from 'react';
import { useGame, Screen } from './GameContext';
import { useProfile } from './core/profile/ProfileContext';
import { User, Gem, Coins, Menu, Box, Gift, Store, Target, Palette, Trophy, BarChart2, MessageCircle, Users, Candy } from 'lucide-react';
import { ProfileComponent } from './designs/KineticComponents';
import { useCDE } from './core/cde';
import { DynamicIcon } from './components/theme/DynamicIcon';

export const TopBarStandard = ({ onMenuClick, hideProfile = false, hideCurrency = false, className = "" }: { onMenuClick?: () => void, hideProfile?: boolean, hideCurrency?: boolean, className?: string }) => {
  const { user, navigate } = useGame();
  const { profile } = useProfile();
  const cde = useCDE();

  return (
    <div className={`flex justify-between items-center px-4 py-3 relative z-10 ${className}`}>
       {!hideProfile && (
         <div className="flex items-center gap-2">
           {onMenuClick ? (
              <button onClick={onMenuClick} className="w-10 h-10 bg-theme-surface-card-white rounded-full flex items-center justify-center shadow-sm text-theme-text-secondary active:scale-95 transition-transform"><Menu size={20}/></button>
           ) : (
              <button onClick={() => navigate('profile')} className="relative active:scale-95 transition-transform">
                <div className="w-10 h-10 border-theme-sm border-white rounded-full flex items-center justify-center shadow-sm overflow-hidden bg-theme-bg-soft-pink">
                   <ProfileComponent avatarStr={profile?.activeAvatarId || profile?.avatar} avatarBg={profile?.activeAvatarBackground} seed={cde.account?.username || user.name} className="!w-full !h-full !border-0 !shadow-none" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-theme-primary-coral-pink rounded-full border-[1.5px] border-white flex items-center justify-center">
                   <User size={8} className="text-white" />
                </div>
              </button>
           )}
           <div className="leading-tight">
              <div className="font-bold text-[13px] text-theme-text-primary tracking-tight">{user.name}</div>
              <div className="text-[10px] text-theme-text-muted font-medium">Level {profile.highestLevel}</div>
           </div>
         </div>
       )}

       {hideProfile && onMenuClick && (
         <button onClick={onMenuClick} className="w-10 h-10 bg-theme-surface-card-white rounded-full flex items-center justify-center shadow-sm text-theme-text-secondary active:scale-95 transition-transform"><Menu size={20}/></button>
       )}

       {!hideCurrency && (
         <div className="flex gap-2">
           <div className="bg-theme-surface-card-white rounded-full pl-2 pr-1 py-1 flex items-center gap-1.5 shadow-sm border border-theme-neutral-100 cursor-pointer active:scale-95 transition-transform" onClick={() => navigate('toko')}>
             <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-5 h-5 object-contain drop-shadow-[1px_1px_0px_rgba(0,0,0,0.1)]" />
             <span className="text-[11px] font-bold text-theme-text-secondary">{cde.permen ?? 0}</span>
             <button className="w-4 h-4 bg-theme-currency-candy-purple rounded-full flex items-center justify-center text-white font-bold leading-none shrink-0 shadow-sm text-[10px]">+</button>
           </div>
         </div>
       )}
    </div>
  )
}

export const MAIN_FEATURES: { id: Screen, label: string, icon: any, color: string, bg: string }[] = [
  { id: 'peti', label: 'Peti', icon: Box, color: 'text-theme-primary-warm-orange', bg: 'bg-theme-bg-soft-orange' },
  { id: 'toko', label: 'Toko', icon: Store, color: 'text-theme-primary-sunny-yellow', bg: 'bg-theme-bg-soft-yellow' },
  { id: 'misi', label: 'Misi', icon: Target, color: 'text-theme-currency-candy-purple', bg: 'bg-theme-bg-soft-purple' },
  { id: 'tema', label: 'Tema', icon: Palette, color: 'text-theme-primary-tropical-green', bg: 'bg-theme-bg-soft-mint' },
  { id: 'prestasi', label: 'Prestasi', icon: Trophy, color: 'text-theme-primary-warm-orange', bg: 'bg-theme-bg-soft-orange' },
  { id: 'statistik', label: 'Statistik', icon: BarChart2, color: 'text-theme-primary-sky-blue', bg: 'bg-theme-bg-soft-blue' },
  { id: 'pesan', label: 'Pesan', icon: MessageCircle, color: 'text-theme-primary-turquoise', bg: 'bg-theme-bg-soft-teal' },
  { id: 'multiplayer', label: 'Multiplayer', icon: Users, color: 'text-theme-primary-indigo', bg: 'bg-theme-bg-soft-indigo' },
];
