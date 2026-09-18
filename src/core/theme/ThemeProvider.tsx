import React, { createContext, useContext, useLayoutEffect, useState, useMemo } from 'react';
import { ThemeManifest, ThemeContextType } from './types';
import { resolveTheme } from './utils';
import { DEFAULT_THEMES } from './registry';
import { useProfile } from '../profile/ProfileContext';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customTheme, setCustomTheme] = useState<Partial<ThemeManifest> | null>(null);
  const { profile } = useProfile();

  // Re-apply the player's saved theme whenever the synced profile changes it
  const savedTheme = profile?.activeTheme;
  const unlockedKey = (profile?.unlockedThemes || []).join(',');
  React.useEffect(() => {
    if (!savedTheme) return;
    const unlocked = profile?.unlockedThemes || ['sweets'];
    if (DEFAULT_THEMES[savedTheme] && savedTheme !== 'sweets' && unlocked.includes(savedTheme)) {
      setCustomTheme(DEFAULT_THEMES[savedTheme]);
    } else if (savedTheme === 'sweets' || savedTheme === 'vanilla') {
      setCustomTheme(null);
    }
  }, [savedTheme, unlockedKey]);

  const activeTheme = useMemo(() => {
    return resolveTheme(customTheme);
  }, [customTheme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    Object.entries(activeTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    if (activeTheme.geometry) {
      Object.entries(activeTheme.geometry).forEach(([category, values]) => {
        Object.entries(values).forEach(([key, value]) => {
          let finalValue = value as string;
          
          if (category === 'shadow') {
            const isEnabled = activeTheme.shadow?.enabled ?? true;
            if (!isEnabled) {
              finalValue = 'none';
            } else if (activeTheme.shadow?.color) {
              finalValue = finalValue.replace(/rgba?\([^)]+\)|#[0-9a-fA-F]+/g, activeTheme.shadow.color);
            }
          }
          
          root.style.setProperty(`--geometry-${category}-${key}`, finalValue);
        });
      });
    }

    if (activeTheme.assets?.backgrounds) {
      if (activeTheme.assets.backgrounds.global) {
        root.style.setProperty('--asset-bg-global', `url('${activeTheme.assets.backgrounds.global}')`);
      }
      if (activeTheme.assets.backgrounds.popup) {
        root.style.setProperty('--asset-bg-popup', `url('${activeTheme.assets.backgrounds.popup}')`);
      }
    }
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ 
      activeTheme, 
      setCustomTheme,
      setTheme: (id: string) => { 
        if (DEFAULT_THEMES[id]) {
          setCustomTheme(DEFAULT_THEMES[id]);
        } else if (id === 'vanilla' || id === 'sweets') {
          setCustomTheme(null);
        }
      },
      availableThemes: DEFAULT_THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
