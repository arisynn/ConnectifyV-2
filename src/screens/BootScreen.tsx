import React, { useEffect } from 'react';
import { useGame } from '../GameContext';
import { CDEAuth } from '../core/cde/auth/CDEAuth';
import { supabase } from '../lib/supabase';

// Properly import assets so Vite resolves their hashed paths in production
import bgGlobal from '../assets/vanilla/background/global_background.webp';
import bgPopup from '../assets/vanilla/background/popup_background.webp';
import logoSrc from '../assets/vanilla/logo/connectify_logo.png';
import playIcon from '../assets/vanilla/logo/play.png';
import settingsIcon from '../assets/vanilla/logo/settings.png';
import beachBall from '../assets/vanilla/tiles/beach_ball.png';
import coconut from '../assets/vanilla/tiles/coconut.png';
import crab from '../assets/vanilla/tiles/crab.png';

const ASSETS_TO_PRELOAD = [
    bgGlobal,
    bgPopup,
    logoSrc,
    playIcon,
    settingsIcon,
    beachBall,
    coconut,
    crab
];

export const BootScreen = () => {
  const { navigate } = useGame();

  useEffect(() => {
    let isMounted = true;
    let authListenerSub: any = null;
    let timeoutId: any = null;
    
    // Signal to watchdog that JS is alive
    (window as any)._loaderReady = true;

    const setProgress = (percent: number, text?: string) => {
      const bar = document.getElementById('static-loader-progress');
      const label = document.getElementById('static-loader-text');
      if (bar) {
        bar.classList.add('determinate');
        bar.style.width = `${percent}%`;
        bar.style.transform = 'translateX(0)';
      }
      if (label && text) {
        label.innerText = text;
      }
    };

    const preloadAssets = async () => {
       // Font load with timeout
       const fontLoad = Promise.race([
          document.fonts.ready,
          new Promise(resolve => setTimeout(resolve, 2000))
       ]);

       let loaded = 0;
       const total = ASSETS_TO_PRELOAD.length;

       const imagePromises = ASSETS_TO_PRELOAD.map(src => {
          return new Promise((resolve, reject) => {
             const img = new Image();
             const timeout = setTimeout(() => reject('timeout'), 8000); // 8s timeout per asset
             img.onload = () => {
                clearTimeout(timeout);
                loaded++;
                setProgress(20 + Math.floor((loaded / total) * 50), `MEMUAT ASET ${loaded}/${total}`);
                resolve(true);
             };
             img.onerror = () => {
                clearTimeout(timeout);
                reject('error');
             };
             img.src = src;
          });
       });

       // Use Promise.allSettled so a single failure doesn't block boot
       await Promise.allSettled([fontLoad, ...imagePromises]);
    };

    const processSession = async (isValid: boolean) => {
      if (!isMounted) return;
      try {
        if (isValid) {
          setProgress(80, 'MEMULIHKAN SESI...');
          await CDEAuth.restoreSession();
        }
      } catch (error) {
        console.warn('CDEAuth error in BootScreen:', error);
      } finally {
        setProgress(100, 'SELESAI!');
        setTimeout(() => {
           if (isMounted) {
               if (isValid) {
                   navigate('startup');
               } else {
                   navigate('login');
               }
           }
        }, 300);
      }
    };

    const checkAuthAndPreload = async () => {
      setProgress(10, 'MEMUAT ENGINE...');
      
      // Wait for preload first
      await preloadAssets();
      
      setProgress(75, 'MEMERIKSA SESI...');

      let isUnsubscribed = false;

      // Listen for the event indicating storage has loaded
      const { data } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
          if (timeoutId) clearTimeout(timeoutId);
          if (!isUnsubscribed) {
            isUnsubscribed = true;
            setTimeout(() => {
              if (authListenerSub) authListenerSub.unsubscribe();
            }, 0);
          }
          await processSession(!!currentSession);
        }
      });
      authListenerSub = data?.subscription;

      // Fallback timeout in case onAuthStateChange is never fired
      timeoutId = setTimeout(async () => {
        if (!isUnsubscribed) {
          isUnsubscribed = true;
          if (authListenerSub) authListenerSub.unsubscribe();
          
          try {
            const { data: { session } } = await supabase.auth.getSession();
            await processSession(!!session);
          } catch (err) {
            await processSession(false);
          }
        }
      }, 2500);
    };

    setTimeout(() => {
      if (!isMounted) return;
      checkAuthAndPreload();
    }, 100);

    return () => {
      isMounted = false;
      if (authListenerSub) authListenerSub.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [navigate]);

  return null; // The static loader overlay handles the visuals
};
