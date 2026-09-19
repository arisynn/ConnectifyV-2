import React, { useEffect } from 'react';
import { useGame } from './GameContext';
import { ArrowLeft, Bell, Check, Gift, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton, NotificationCard } from './designs/KineticComponents';
import { useProfile } from './core/profile/ProfileContext';

import { ProfileScreen } from './screens/ProfileScreen';
import { ChestScreen } from './screens/ChestScreen';
import { ShopScreen } from './screens/ShopScreen';
import { MissionScreen } from './screens/MissionScreen';
import { ThemeScreen } from './screens/ThemeScreen';
import { AchievementScreen } from './screens/AchievementScreen';
import { StatistikScreen } from './screens/StatistikScreen';
import { MultiplayerScreen } from './screens/MultiplayerScreen';
import { LevelSelectScreen } from './screens/LevelSelectScreen';
import { GameplayScreen } from './game/GameplayScreen';
import { BlockPuzzleScreen } from './game/block-puzzle/BlockPuzzleScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CollectionScreen } from './screens/CollectionScreen';
import { EditAvatarScreen } from './screens/EditAvatarScreen';
import ZenMatchScreen from './game/zen/ZenMatchScreen';
import WalletScreen from './screens/WalletScreen';
import ChallengeScreen from './screens/ChallengeScreen';

export const DestinationScreen = () => {
  const { screen, navigate } = useGame();
  const { profile, markNotificationRead } = useProfile();
  
  // Mark all as read when opening notification screen
  useEffect(() => {
    if (screen === 'pesan' && profile.notifications) {
      profile.notifications.forEach((n: any) => {
        if (!n.read) markNotificationRead(n.id);
      });
    }
  }, [screen, profile.notifications, markNotificationRead]);

  if (screen === 'home') return null;
  
  if (screen === 'profile') return <ProfileScreen />;
  if (screen === 'peti') return <ChestScreen />;
  if (screen === 'toko') return <ShopScreen />;
  if (screen === 'misi') return <MissionScreen />;
  if (screen === 'koleksi') return <CollectionScreen />;
  if (screen === 'tema') return <ThemeScreen />;
  if (screen === 'prestasi') return <AchievementScreen />;
  if (screen === 'statistik') return <StatistikScreen />;
  if (screen === 'multiplayer') return <MultiplayerScreen />;
  if (screen === 'levels') return <LevelSelectScreen />;
  if (screen === 'play') return <GameplayScreen />;
  if (screen === 'block-puzzle') return <BlockPuzzleScreen />;
  if (screen === 'settings') return <SettingsScreen />;
  if (screen === 'edit-avatar') return <EditAvatarScreen />;
  if (screen === 'zen') return <ZenMatchScreen />;
  if (screen === 'wallet') return <WalletScreen />;
  if (screen === 'challenges') return <ChallengeScreen />;

  if (screen === 'pesan') {
    return (
      <AnimatePresence>
        <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           exit={{ opacity: 0 }}
           className="absolute inset-0 bg-black/60 z-[100] flex flex-col justify-end"
        >
          <div className="absolute inset-0" onClick={() => navigate('home')} />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-theme-surface-card-white border-t-theme-base border-theme-border-main rounded-t-[2.5rem] w-full min-h-[60vh] max-h-[85vh] z-10 flex flex-col pt-4 pb-6"
          >
             <div className="w-16 h-1.5 bg-theme-divider-main rounded-full mx-auto mb-6 shrink-0" />
             <div className="px-6 flex items-center justify-between mb-6 shrink-0">
               <h2 className="text-3xl font-black text-theme-text-primary tracking-tighter uppercase">Notifikasi</h2>
               <div className="w-12 h-12 bg-teal-200 border-theme-base border-theme-border-main rounded-full flex items-center justify-center shadow-theme-base">
                 <Bell size={24} strokeWidth={2.5} className="text-theme-text-primary" />
               </div>
             </div>
             
             <div className="flex-1 overflow-y-auto px-6 flex flex-col gap-4">
                {(!profile.notifications || profile.notifications.length === 0) ? (
                   <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                     <Bell size={48} className="mb-4 opacity-50" />
                     <p className="font-bold text-lg">Tidak ada notifikasi</p>
                   </div>
                ) : (
                   profile.notifications.map((n: any) => {
                      const timeStr = Math.floor((Date.now() - n.timestamp) / 60000) + 'm';
                      let icon = Info;
                      let colorClass = "bg-blue-100";
                      let accentClass = "bg-blue-400";
                      let iconColorClass = "text-blue-500";
                      
                      if (n.type === 'reward' || n.type === 'chest') {
                         icon = Gift;
                         colorClass = "bg-theme-bg-soft-pink";
                         accentClass = "bg-theme-primary-coral-pink";
                         iconColorClass = "text-theme-primary-coral-pink";
                      } else if (n.type === 'achievement' || n.type === 'mission') {
                         icon = Check;
                         colorClass = "bg-green-100";
                         accentClass = "bg-green-400";
                         iconColorClass = "text-green-500";
                      }
                      
                      return (
                         <NotificationCard 
                           key={n.id}
                           title={n.title} 
                           description={n.message} 
                           time={timeStr} 
                           icon={icon} 
                           colorClass={colorClass} 
                           accentClass={accentClass} 
                           iconColorClass={iconColorClass} 
                         />
                      );
                   })
                )}
             </div>
             
             <div className="px-6 mt-6 shrink-0">
               <KineticButton 
                 onClick={() => navigate('home')}
                 colorClass="bg-gray-900"
                 className="w-full py-4 !text-white text-lg"
               >
                 Tutup Panel
               </KineticButton>
             </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return null;
};
