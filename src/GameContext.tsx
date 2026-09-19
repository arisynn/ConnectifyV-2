import React, { createContext, useContext, useState } from 'react';

export type Screen = 'boot' | 'startup' | 'login' | 'home' | 'play' | 'multiplayer' | 'peti' | 'toko' | 'misi' | 'tema' | 'prestasi' | 'statistik' | 'pesan' | 'profile' | 'levels' | 'block-puzzle' | 'settings' | 'koleksi' | 'edit-avatar' | 'zen' | 'wallet' | 'challenges';

export type GameMode = 'normal' | 'daily' | 'endless';

interface GameContextType {
  screen: Screen;
  navigate: (screen: Screen) => void;
  gameMode: GameMode;
  setGameMode: (mode: GameMode) => void;
  user: { name: string; level: number; diamond: string; coin: string };
  updateUsername: (name: string) => void;
  resetProgress: () => void;
}

const defaultUser = { name: 'Player', level: 1, diamond: '0', coin: '0' };

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [screen, setScreen] = useState<Screen>('boot');
  const [user, setUser] = useState(defaultUser);
  const [gameMode, setGameMode] = useState<GameMode>('normal');

  const updateUsername = (name: string) => {
    setUser(prev => ({ ...prev, name }));
  };

  const resetProgress = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <GameContext.Provider value={{ screen, navigate: setScreen, gameMode, setGameMode, user, updateUsername, resetProgress }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
