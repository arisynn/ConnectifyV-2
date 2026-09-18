import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../GameContext';
import { useAudio } from '../core/audio/AudioEngine';
import { DynamicIcon } from '../components/theme/DynamicIcon';
import { Volume2, VolumeX } from 'lucide-react';
import { CDEAuth } from '../core/cde/auth/CDEAuth';
import { useProfile } from '../core/profile/ProfileContext';

export const StartupScreen = () => {
  const { navigate, updateUsername } = useGame();
  const { refreshProfileFromEngine } = useProfile();
  const { settings, updateSettings, playUiClick, playMenuBgm } = useAudio();
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade out and remove the static HTML loader
    const loader = document.getElementById('static-loader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => {
        loader.remove();
      }, 300);
    }
  }, []);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    // Don't trigger if tapping the mute button
    if ((e.target as HTMLElement).closest('.mute-toggle')) return;
    if (isLeaving) return;

    setIsLeaving(true);
    
    // Unlock AudioContext and play theme music
    if (!settings.muteSfx) playUiClick();
    if (!settings.muteMusic) playMenuBgm();

    // Initialize state / sync profile
    if ((window as any).setStartupComplete) {
      (window as any).setStartupComplete(true);
    }
    refreshProfileFromEngine();
    
    const loggedInUser = CDEAuth.getLoggedInUser();
    if (loggedInUser) {
       updateUsername(loggedInUser);
    }
    
    // Navigate home
    setTimeout(() => {
      navigate('home');
    }, 300); // Wait for crossfade
  };

  const isMuted = settings.muteMusic || settings.muteSfx;
  
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateSettings({ 
       muteMusic: !isMuted, 
       muteSfx: !isMuted 
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-[100] bg-theme-bg-main bg-[image:var(--asset-bg-global)] bg-cover bg-center flex flex-col items-center justify-center p-6 cursor-pointer"
      onClick={handleTap}
      onTouchEnd={handleTap}
    >
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* Floating Logo */}
      <motion.div 
        animate={{ 
          y: [0, -6, 0]
        }}
        transition={{ 
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="z-10"
      >
        <div className="w-48 h-48 sm:w-64 sm:h-64 mb-12 relative pointer-events-none">
           <DynamicIcon name="connectify_logo" type="logo" className="w-full h-full object-contain drop-shadow-xl" />
        </div>
      </motion.div>

      {/* Tap to Play text */}
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="z-10 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full px-8 py-4 shadow-theme-base pointer-events-none"
      >
        <h2 className="font-black text-theme-text-primary text-xl uppercase tracking-widest">
          TAP UNTUK BERMAIN
        </h2>
      </motion.div>

      {/* Footer controls & info */}
      <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between z-10 pointer-events-none">
        <div className="text-theme-text-secondary font-bold text-sm bg-white/80 px-3 py-1 rounded-full shadow-sm backdrop-blur-sm border-2 border-theme-border-main">
          v1.0.0
        </div>
        
        <button 
          className="mute-toggle pointer-events-auto w-12 h-12 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full flex items-center justify-center shadow-theme-sm active:translate-y-1 active:shadow-[1px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
          onClick={toggleMute}
        >
          {isMuted ? 
            <VolumeX size={24} strokeWidth={2.5} className="text-theme-game-danger" /> : 
            <Volume2 size={24} strokeWidth={2.5} className="text-theme-text-primary" />
          }
        </button>
      </div>
    </motion.div>
  );
};
