import React, { useState, useEffect } from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, User, Trophy, BarChart2, Edit3, UserRound, Candy, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { KineticButton, ProfileComponent, ProgressBar } from '../designs/KineticComponents';
import { useProfile } from '../core/profile/ProfileContext';
import { ACHIEVEMENTS_DATA, getCurrentTier } from '../core/achievements';
import { KineticBottomSheet, KineticModal } from '../designs/KineticPopups';


import { useCDE } from '../core/cde';
import { DynamicIcon } from '../components/theme/DynamicIcon';


export const ProfileScreen = () => {
  const { navigate, user } = useGame();
  const { profile, updateProfile } = useProfile();
  const cde = useCDE();
  
  let completedAchievements = 0;
  ACHIEVEMENTS_DATA.forEach(a => {
      const tierIdx = getCurrentTier(profile, a.id);
      completedAchievements += tierIdx;
  });
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleEditAvatarClick = () => {
     navigate('edit-avatar');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-pink-50 z-[100] flex flex-col font-sans"
    >
      <div className="flex items-center gap-4 px-5 py-4 z-10 shrink-0 bg-theme-bg-soft-pink border-b-theme-base border-theme-border-main shadow-theme-base">
        <button 
           onClick={() => navigate('home')} 
           className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
        >
          <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
        </button>
        <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Profil Pemain</h2>
      </div>
      
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
         <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-6 shadow-theme-lg mb-6 flex flex-col items-center">
            
            <div className="relative mb-4">
               <ProfileComponent avatarStr={profile?.activeAvatarId || profile?.avatar} avatarBg={profile?.activeAvatarBackground} seed={cde.account?.username || user.name} className="!w-28 !h-28 border-theme-base" />
               <button 
                 onClick={handleEditAvatarClick}
                 className="absolute bottom-0 -right-2 bg-theme-primary-sunny-yellow w-11 h-11 rounded-full border-theme-base border-theme-border-main flex items-center justify-center shadow-theme-sm active:scale-95 transition-transform"
               >
                 <Edit3 size={20} className="text-theme-text-primary" strokeWidth={3} />
               </button>
            </div>
            
            <h3 className="text-3xl font-black text-theme-text-primary tracking-tighter uppercase mb-1">{cde.account?.username || user.name}</h3>
            <span className="bg-theme-primary-navy text-theme-text-white font-black text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">Pemain Reguler</span>
            
            <div className="w-full">
               <div className="flex justify-between items-center mb-2">
                  <span className="font-black text-sm uppercase text-theme-text-secondary">Level {Math.floor((profile.highestLevel || 1) / 5) + 1}</span>
                  <span className="font-black text-sm uppercase text-theme-primary-coral-pink">{((profile.highestLevel || 1) % 5) * 200} / 1000 EXP</span>
               </div>
               <ProgressBar progress={((profile.highestLevel || 1) % 5) * 20} label="" />
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.button whileTap={{ scale: 0.95 }} data-testid="profile-achievements-button" onClick={() => navigate('prestasi')} className="bg-theme-primary-sunny-yellow border-theme-base border-theme-border-main rounded-2xl p-4 flex flex-col items-center shadow-theme-base active:shadow-[var(--geometry-shadow-active)] active:translate-y-1 transition-all">
               <Trophy size={32} className="text-yellow-600 mb-2" />
               <span className="font-black text-2xl text-theme-text-primary leading-none">{completedAchievements}</span>
               <span className="font-black text-[10px] uppercase text-theme-text-secondary tracking-widest mt-1">Pencapaian</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} data-testid="profile-statistics-button" onClick={() => navigate('statistik')} className="bg-blue-200 border-theme-base border-theme-border-main rounded-2xl p-4 flex flex-col items-center shadow-theme-base active:shadow-[var(--geometry-shadow-active)] active:translate-y-1 transition-all">
               <BarChart2 size={32} className="text-blue-600 mb-2" />
               <span className="font-black text-2xl text-theme-text-primary leading-none">{profile.winStreak || 0}</span>
               <span className="font-black text-[10px] uppercase text-theme-text-secondary tracking-widest mt-1">Win Streak · Statistik</span>
            </motion.button>
         </div>

         <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Total Main', value: profile?.statistics?.totalGames || 0 },
              { label: 'Skor Terbaik', value: profile?.statistics?.highestScore || 0 },
              { label: 'Peti Dibuka', value: profile?.statistics?.totalChestsOpened || 0 },
            ].map(s => (
              <div key={s.label} className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-2xl p-3 flex flex-col items-center shadow-theme-sm">
                 <span className="font-black text-xl text-theme-text-primary leading-none">{Number(s.value).toLocaleString('id-ID')}</span>
                 <span className="font-black text-[9px] uppercase text-theme-text-muted tracking-widest mt-1 text-center">{s.label}</span>
              </div>
            ))}
         </div>
      </div>

      
      


    </motion.div>
  );
};
