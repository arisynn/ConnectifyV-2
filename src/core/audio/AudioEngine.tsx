import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useTheme } from '../theme/ThemeProvider';

// Types for Synthesis configuration
type SynthFreq = { f: number; t: number; d: number };
type SynthType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface AudioSettings {
  musicVol: number;
  sfxVol: number;
  muteMusic: boolean;
  muteSfx: boolean;
}

interface AudioEngineContextType {
  settings: AudioSettings;
  updateSettings: (newSettings: Partial<AudioSettings>) => void;
  playMenuBgm: () => void;
  playGameBgm: () => void;
  stopBgm: () => void;
  
  // Custom SFX method for playing arbitrary synth or fetching from theme
  playSfx: (type: string, fallbackSynth?: () => void) => void;
  
  // Core game sounds
  playMatch: () => void;
  playWrong: () => void;
  playUiClick: () => void;
}

const AudioEngineContext = createContext<AudioEngineContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTheme } = useTheme();
  
  const [settings, setSettings] = useState<AudioSettings>({
    musicVol: 100,
    sfxVol: 100,
    muteMusic: false,
    muteSfx: false,
  });

  const ctxRef = useRef<AudioContext | null>(null);
  const bgmMenuRef = useRef<HTMLAudioElement | null>(null);
  const bgmGameRef = useRef<HTMLAudioElement | null>(null);
  const currentBgmRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('sweetConnectAudioSettings');
      if (saved) {
        setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch (e) {}

    try {
      bgmMenuRef.current = new Audio('/assets/sounds/menu.mp3');
      bgmMenuRef.current.loop = true;
      bgmMenuRef.current.volume = 0;

      bgmGameRef.current = new Audio('/assets/sounds/game.mp3');
      bgmGameRef.current.loop = true;
      bgmGameRef.current.volume = 0;
    } catch (e) {}
    
    // Clean up BGM on unmount
    return () => {
       if (currentBgmRef.current) {
         currentBgmRef.current.pause();
       }
    };
  }, []);

  const saveSettings = (newSettings: AudioSettings) => {
    try {
      localStorage.setItem('sweetConnectAudioSettings', JSON.stringify(newSettings));
      localStorage.setItem('pkmnIsMuted', String(newSettings.muteMusic && newSettings.muteSfx));
    } catch (e) {}
  };

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      saveSettings(updated);
      applyMusicVolume(updated);
      return updated;
    });
  };

  const applyMusicVolume = (currentSettings: AudioSettings = settings) => {
    const targetVol = currentSettings.muteMusic ? 0 : (currentSettings.musicVol / 100 * 0.3);
    if (currentBgmRef.current && !fadeIntervalRef.current) {
      currentBgmRef.current.volume = targetVol;
    }
  };

  const getCtx = () => {
    if (!ctxRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AudioContextClass();
    }
    // Resume context if suspended (browser autoplay policy)
    if (ctxRef.current && ctxRef.current.state === 'suspended') {
        ctxRef.current.resume();
    }
    return ctxRef.current;
  };

  const fadeOut = (audio: HTMLAudioElement, callback?: () => void) => {
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume > 0.02) {
        audio.volume -= 0.02;
      } else {
        audio.pause();
        audio.volume = 0;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
        if (callback) callback();
      }
    }, 50);
  };

  const fadeIn = (audio: HTMLAudioElement) => {
    const maxVol = settings.muteMusic ? 0 : (settings.musicVol / 100 * 0.3);
    audio.volume = 0;
    audio.play().catch(() => {});
    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    fadeIntervalRef.current = setInterval(() => {
      if (audio.volume < maxVol - 0.02) {
        audio.volume += 0.02;
      } else {
        audio.volume = maxVol;
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    }, 50);
  };

  const playBgm = (audio: HTMLAudioElement | null) => {
    // If the theme has a custom BGM, we should ideally load that.
    // For now, if activeTheme.audio?.bgm is provided, we can dynamically swap it.
    // Assuming standard bgm structure here.
    const customBgmUrl = activeTheme?.audio?.bgm;
    let targetAudio = audio;

    // Theme override
    if (customBgmUrl) {
       // Stop caching logic or reuse a custom audio element...
       // Skipping full robust custom BGM cache for this POC, but the hook is here.
    }

    if (!targetAudio) return;
    if (currentBgmRef.current === targetAudio) return;

    if (currentBgmRef.current) {
      fadeOut(currentBgmRef.current, () => {
        currentBgmRef.current = targetAudio;
        fadeIn(targetAudio);
      });
    } else {
      currentBgmRef.current = targetAudio;
      fadeIn(targetAudio);
    }
  };

  const playMenuBgm = () => playBgm(bgmMenuRef.current);
  const playGameBgm = () => playBgm(bgmGameRef.current);
  const stopBgm = () => {
    if (currentBgmRef.current) {
      fadeOut(currentBgmRef.current, () => {
        currentBgmRef.current = null;
      });
    }
  };

  // ----------------------------------------------------
  // SYNTHESIS ENGINE
  // ----------------------------------------------------
  const playSynth = (freqs: SynthFreq[], dur: number, type: SynthType = 'sine', vol = 0.1, delay = 0) => {
    if (settings.muteSfx) return;
    const sfxScale = settings.sfxVol / 100;
    if (sfxScale === 0) return;

    const finalVol = vol * Math.min(1, sfxScale);
    try {
      const ac = getCtx();
      freqs.forEach(({ f, t, d }) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.type = type;
        osc.frequency.setValueAtTime(f, ac.currentTime + delay + t);
        gain.gain.setValueAtTime(finalVol, ac.currentTime + delay + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + t + d);
        osc.start(ac.currentTime + delay + t);
        osc.stop(ac.currentTime + delay + t + d + 0.05);
      });
    } catch (e) {}
  };

  // General PlaySFX router (Checks Theme first)
  const playSfx = (typeKey: string, fallbackSynth?: () => void) => {
    if (settings.muteSfx || settings.sfxVol === 0) return;

    // 1. Check if theme has an override
    const themeAudio = activeTheme?.audio?.sfx as any;
    if (themeAudio && themeAudio[typeKey]) {
      const url = themeAudio[typeKey];
      const audio = new Audio(url);
      audio.volume = settings.sfxVol / 100;
      audio.play().catch(() => fallbackSynth && fallbackSynth());
      return;
    }

    // 2. Play fallback synth
    if (fallbackSynth) {
      fallbackSynth();
    }
  };

  // Specific Sounds wrapped in the playSfx router
  const playMatch = () => playSfx('match', () => 
    playSynth([{ f: 523, t: 0, d: 0.1 }, { f: 659, t: 0.08, d: 0.1 }, { f: 784, t: 0.16, d: 0.2 }], 0.4, 'triangle', 0.25)
  );

  const playWrong = () => playSfx('wrong', () => 
    playSynth([{ f: 180, t: 0, d: 0.1 }], 0.1, 'sawtooth', 0.15)
  );

  const playUiClick = () => playSfx('click', () => 
    playSynth([{ f: 700, t: 0, d: 0.05 }], 0.05, 'sine', 0.05)
  );

  return (
    <AudioEngineContext.Provider value={{
      settings, updateSettings,
      playMenuBgm, playGameBgm, stopBgm,
      playSfx, playMatch, playWrong, playUiClick
    }}>
      {children}
    </AudioEngineContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioEngineContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};
