import React from 'react';
import { useGame } from './GameContext';
import { useProfile } from './core/profile/ProfileContext';
import { Play, Package, Box, MessageCircle, Users, Store, Target, Bell, Settings, ChevronRight, Trophy } from 'lucide-react';
import { ProfileComponent, CurrencyPill, PlayCTA, IconTile } from './designs/KineticComponents';
import { motion } from 'motion/react';
import { useCDE } from './core/cde';
import { DynamicIcon } from './components/theme/DynamicIcon';
import { ACHIEVEMENTS_DATA, getCurrentTier } from './core/achievements';
import { isChestReady } from './core/chest';

export const MainLobby = () => {
  const { navigate, user } = useGame();
  const { profile } = useProfile();
  
  const cde = useCDE();
  
  const unreadCount = (profile.notifications || []).filter((n: any) => !n.read).length;
  const claimableMissions = [...(profile.activeMissions || []), ...(profile.activeWeeklyMissions || [])].filter((m: any) => !m.claimed && (m.progress || 0) >= m.target).length;
  const claimableAchievements = ACHIEVEMENTS_DATA.filter(a => {
    const t = getCurrentTier(profile, a.id);
    return t < a.tiers.length && a.getProgress(profile) >= a.tiers[t].target;
  }).length;
  const readyChests = (profile.chestSlots || []).filter((c: any) => isChestReady(c)).length;

  return (
    <div className="w-full h-full flex flex-col relative overflow-hidden font-sans bg-theme-bg-main bg-[image:var(--asset-bg-global)] bg-cover bg-center">
      
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />

      {/* Top Floating Actions (Settings & Notifications) */}
      <div className="absolute top-4 sm:top-6 left-4 right-4 z-50 flex justify-between">

        <motion.button 
           aria-label="Pengaturan"
           onClick={() => navigate('settings')}
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.9, y: "var(--geometry-press-translate-y)", boxShadow: "var(--geometry-shadow-active)" }}
           className="w-12 h-12 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full flex items-center justify-center shadow-theme-sm transition-transform "
        >
          <DynamicIcon name="settings" type="logo" LucideFallback={Settings} className="w-8 h-8 text-theme-text-primary drop-shadow-sm" />
        </motion.button>

        <motion.button 
           aria-label="Pesan dan Notifikasi"
           onClick={() => navigate('pesan')}
           whileHover={{ scale: 1.05 }}
           whileTap={{ scale: 0.9, y: "var(--geometry-press-translate-y)", boxShadow: "var(--geometry-shadow-active)" }}
           className="w-12 h-12 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full flex items-center justify-center shadow-theme-sm relative transition-transform "
        >
          <DynamicIcon name="notification" type="logo" LucideFallback={Bell} className="w-8 h-8 text-theme-text-primary drop-shadow-sm" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-theme-notification rounded-full border-theme-sm border-theme-border-main flex items-center justify-center text-[11px] font-black text-white shadow-[var(--geometry-shadow-active)]">{unreadCount}</span>
          )}
        </motion.button>
      </div>

      {/* Unified Content Flex Wrapper with Consistent Gap */}
      <div className="flex-1 flex flex-col px-5 pt-16 pb-4 sm:pb-6 gap-4 sm:gap-6 items-center justify-center z-20 min-h-0 w-full max-w-md mx-auto overflow-y-auto overflow-x-hidden no-scrollbar">
         
         {/* Profile Anchor Block */}
         <div className="flex flex-col items-center gap-3 shrink-0">
            <ProfileComponent avatarStr={profile?.activeAvatarId || profile?.avatar} avatarBg={profile?.activeAvatarBackground} seed={user.name} onClick={() => navigate('profile')} className="!w-28 !h-28 sm:!w-32 sm:!h-32 border-theme-lg" />
            <div className="flex flex-col items-center gap-2">
               <span className="font-black text-3xl sm:text-4xl uppercase tracking-tighter text-theme-text-primary drop-shadow-[2px_2px_0px_rgba(255,255,255,1)] leading-none">{user.name}</span>
               <div className="flex gap-3">
                   <CurrencyPill type="candy" value={cde.permen} onClick={() => navigate('toko')} />
               </div>
            </div>
         </div>
         
         {/* Main Play CTA */}
         <motion.div
           className="w-full flex justify-center shrink-0 min-h-0"
         >
           <PlayCTA onClick={() => navigate('levels')} colorClass="bg-theme-primary-coral-pink" className="!rounded-[2.5rem] w-full" />
         </motion.div>
         
         {/* Miniature Chest Tracker */}
         <motion.button 
            aria-label="Peti Hadiah"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95, y: "var(--geometry-press-translate-y)", boxShadow: "var(--geometry-shadow-active)" }}
            className="w-full bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-3 shadow-theme-base flex items-center justify-between gap-4 shrink-0" 
            onClick={() => navigate('peti')}
         >
            <div className="w-12 h-12 bg-theme-primary-warm-orange border-theme-base border-theme-border-main rounded-xl flex items-center justify-center shrink-0 relative shadow-[inset_0px_-3px_0px_rgba(0,0,0,0.1)]">
               <DynamicIcon name="collection_chest" type="logo" LucideFallback={Box} className="w-[80%] h-[80%] object-contain text-theme-text-primary drop-shadow-[2px_2px_0px_rgba(255,255,255,0.6)]" />
               {readyChests > 0 && (
                 <div data-testid="lobby-chest-ready-badge" className="absolute -top-2 -right-2 w-5 h-5 bg-theme-notification rounded-full border-theme-sm border-theme-border-main flex items-center justify-center text-[10px] font-black text-white shadow-theme-sm animate-pulse">
                   {readyChests}
                 </div>
               )}
            </div>
            <div className="flex-1 flex items-center justify-between gap-1.5 px-1">
               {(profile.chestSlots || [null, null, null]).slice(0, 3).map((slot: any, index: number) => (
                  <div 
                    key={index}
                    className={`flex-1 h-3.5 rounded-full border-theme-sm border-theme-border-main shadow-[inset_1px_2px_0px_rgba(0,0,0,0.15)] ${
                       slot ? (isChestReady(slot) ? 'bg-theme-primary-tropical-green' : 'bg-theme-primary-coral-pink') : 'bg-theme-surface-card-soft'
                    }`} 
                  />
               ))}
            </div>
            <div className="text-theme-text-primary">
               <ChevronRight size={24} strokeWidth={3} />
            </div>
         </motion.button>

         {/* Icon-First Feature Grid */}
         <div className="w-full shrink min-h-0 flex items-end justify-center">
            <div className="grid grid-cols-4 gap-4 w-full">
               <IconTile ariaLabel="Toko" icon={Store} iconName="store" onClick={() => navigate('toko')} colorClass="bg-theme-primary-sunny-yellow" />
               <IconTile ariaLabel="Misi" icon={Target} iconName="missions" onClick={() => navigate('misi')} colorClass="bg-theme-currency-candy-purple" badge={claimableMissions} />
               <IconTile ariaLabel="Collection" icon={Package} iconName="collection" onClick={() => navigate('koleksi')} colorClass="bg-theme-primary-sky-blue" />
               <IconTile ariaLabel="Pencapaian" icon={Trophy} iconName="achievement" onClick={() => navigate('prestasi')} colorClass="bg-theme-primary-warm-orange" badge={claimableAchievements} />
            </div>
         </div>
      </div>
    </div>
  );
};
