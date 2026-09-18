import React, { useState } from 'react';
import { useGame } from '../GameContext';
import { useProfile } from '../core/profile/ProfileContext';
import { ArrowLeft, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { KineticButton } from '../designs/KineticComponents';
import { DynamicIcon } from '../components/theme/DynamicIcon';

const BACKGROUND_COLORS = [
  // TERANG
  '#bde0fe', '#fcf6bd', '#d0f4de', '#ffdac1', '#ffd1dc',
  // GELAP
  '#1e3a8a', '#1e1b4b', '#0f766e', '#581c87', '#9f1239',
  // NETRAL
  '#f5f5f4', '#e5e7eb', '#e5e5cb', '#94a3b8', '#a3b18a'
];

export const EditAvatarScreen = () => {
  const { navigate } = useGame();
  const { profile, updateProfile } = useProfile();
  
  const isNewPlayer = !profile?.activeAvatarId;

  // SANITIZE: Filter out legacy Dicebear strings so they don't break the UI
  const rawCollection = Array.isArray(profile?.avatarCollection) ? profile.avatarCollection : [];
  const safeCollection = rawCollection.filter((av: string) => av && !av.includes(':') && !av.includes('http') && !av.includes('dicebear'));
  
  // Default to vanilla assets if collection is empty or only had legacy strings
  const collection = safeCollection.length > 0 ? safeCollection : ['avatar_male', 'avatar_female'];

  let initialAvatar = profile?.activeAvatarId;
  if (!initialAvatar || initialAvatar.includes(':') || initialAvatar.includes('http') || initialAvatar.includes('dicebear')) {
    initialAvatar = 'avatar_male';
  }

  const [selectedAvatar, setSelectedAvatar] = useState<string>(initialAvatar);
  const [selectedBg, setSelectedBg] = useState<string>(profile?.activeAvatarBackground || BACKGROUND_COLORS[0]);
  
  const handleSave = () => {
    updateProfile({
      activeAvatarId: selectedAvatar,
      avatar: selectedAvatar, // Legacy compatibility
      activeAvatarBackground: selectedBg,
      avatarCollection: collection // Save the sanitized collection
    });
    navigate(isNewPlayer ? 'home' : 'profile');
  };
  
  const handleBack = () => {
    if (!isNewPlayer) {
      navigate('profile');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-theme-bg-main bg-[image:var(--asset-bg-global)] bg-cover bg-center z-[110] flex flex-col font-sans"
    >
      <div className="flex items-center gap-4 px-5 py-4 shrink-0 bg-theme-surface-card-white border-b-theme-base border-theme-border-main shadow-theme-base z-10">
        <button
          onClick={handleBack}
          disabled={isNewPlayer}
          className={`p-3 bg-theme-bg-main border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base transition-all ${isNewPlayer ? 'opacity-50 cursor-not-allowed' : 'active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)]'}`}
        >
          <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
        </button>
        <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">
          EDIT AVATAR
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col items-center">
        
        <div className="w-full max-w-md flex flex-col mb-8">
            <h3 className="font-black text-xl text-theme-text-primary tracking-tighter uppercase mb-4 text-center">PILIH AVATAR</h3>

            <div className="grid grid-cols-2 gap-4">
              {collection.map((av: string) => {
                const isSelected = selectedAvatar === av;
                const displayName = av === 'avatar_male' ? 'MALE' : av === 'avatar_female' ? 'FEMALE' : av.replace('avatar_', '').toUpperCase();
                return (
                  <div
                      key={av}
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-4 cursor-pointer transition-transform ${isSelected ? 'scale-105 shadow-theme-lg ring-4 ring-theme-primary-coral-pink z-10' : 'shadow-theme-base hover:scale-105'}`}
                  >
                      <div className="w-full aspect-square bg-[#f3f4f6] rounded-full border-theme-base border-theme-border-main overflow-hidden mb-3 relative flex items-center justify-center">
                        <DynamicIcon name={av} type="logo" className="w-[85%] h-[85%] object-contain" />
                      </div>
                      <p className="font-black text-center text-theme-text-primary tracking-tighter uppercase">{displayName}</p>
                      
                      {isSelected && (
                        <div className="absolute -top-2 -right-2 bg-theme-primary-tropical-green p-1.5 rounded-full border-theme-sm border-theme-border-main shadow-theme-sm">
                          <Check size={16} className="text-white" strokeWidth={4} />
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
        </div>

        <div className="w-full max-w-md flex flex-col">
            <h3 className="font-black text-xl text-theme-text-primary tracking-tighter uppercase mb-4 text-center">PILIH WARNA LATAR</h3>
            <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] shadow-theme-base p-6">
              <div className="grid grid-cols-5 gap-3 sm:gap-4">
                {BACKGROUND_COLORS.map(color => {
                  const isSelected = selectedBg === color;
                  return (
                    <div
                      key={color}
                      onClick={() => setSelectedBg(color)}
                      className={`relative aspect-square rounded-full border-theme-base border-theme-border-main cursor-pointer shadow-theme-sm transition-transform ${isSelected ? 'scale-110 ring-4 ring-theme-primary-coral-pink z-10' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-white rounded-full opacity-90 shadow-sm" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
        </div>

      </div>

      <div className="px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-theme-surface-card-white border-t-theme-base border-theme-border-main shadow-[0px_-4px_0px_0px_rgba(0,0,0,0.05)] z-10">
         <KineticButton
            onClick={handleSave}
            colorClass="bg-theme-primary-sunny-yellow"
            className="w-full py-4 text-xl"
          >
            SIMPAN
          </KineticButton>
      </div>
    </motion.div>
  );
};
