import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, Zap } from 'lucide-react';
import { useTheme } from '../core/theme/ThemeProvider';

interface GameLoaderProps {
  onComplete: () => void;
}

export const GameLoader: React.FC<GameLoaderProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const { activeTheme } = useTheme();

  useEffect(() => {
    let imagesToPreload: string[] = [];
    
    // Add backgrounds
    if (activeTheme?.assets?.backgrounds?.global) {
        imagesToPreload.push(activeTheme.assets.backgrounds.global as string);
    }
    
    // Add tiles
    if (activeTheme?.assets?.tiles) {
       imagesToPreload = [...imagesToPreload, ...(Object.values(activeTheme.assets.tiles) as string[])];
    }

    if (imagesToPreload.length === 0) {
      setProgress(100);
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }

    let loaded = 0;
    let isMounted = true;
    let completeCalled = false;
    const updateProgress = () => {
      if (!isMounted) return;
      loaded++;
      setProgress(Math.round((loaded / imagesToPreload.length) * 100));
      if (loaded >= imagesToPreload.length && !completeCalled) {
        completeCalled = true;
        setTimeout(onComplete, 300); // short delay to show 100%
      }
    };

    imagesToPreload.forEach(src => {
      const img = new Image();
      img.onload = updateProgress;
      img.onerror = updateProgress; // Continue even if error
      img.src = src;
    });

    return () => { isMounted = false; };
  }, [activeTheme, onComplete]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-[#f8fafc] z-[100] flex flex-col items-center justify-center font-sans overflow-hidden"
    >
       <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
       
       <motion.div 
           animate={{ 
               y: [0, -10, 0],
               rotate: [0, 5, -5, 0]
           }}
           transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
           className="w-28 h-28 bg-theme-primary-sunny-yellow border-theme-lg border-theme-border-main rounded-3xl flex items-center justify-center shadow-theme-lg mb-8 relative z-10"
       >
           <Zap size={56} className="text-theme-text-primary fill-theme-text-primary" />
       </motion.div>
       
       <h2 className="text-3xl font-black text-theme-text-primary uppercase tracking-tighter mb-6 relative z-10 drop-shadow-[2px_2px_0px_rgba(255,255,255,1)]">
           Memuat Game
       </h2>
       
       <div className="w-64 h-6 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full overflow-hidden shadow-theme-base relative z-10 p-1">
           <motion.div 
              className="h-full bg-theme-primary-coral-pink rounded-full border-r-2 border-black/10"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.2 }}
           />
       </div>
       <p className="mt-4 text-sm font-bold text-theme-text-muted relative z-10">Mempersiapkan Assets... {progress}%</p>
    </motion.div>
  );
};
