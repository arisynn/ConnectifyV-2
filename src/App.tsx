import React from 'react';
import { GameProvider, useGame } from './GameContext';
import { MainLobby } from './MainLobby';
import { DestinationScreen } from './DestinationScreen';
import { StartupScreen } from './screens/StartupScreen';
import { LoginScreen } from './screens/LoginScreen';
import { BootScreen } from './screens/BootScreen';

import { AnimatePresence } from 'motion/react';
import { ThemeProvider } from './core/theme/ThemeProvider';
import { AudioProvider } from './core/audio/AudioEngine';
import { ProfileProvider } from './core/profile/ProfileContext';
import { CDEProvider } from './core/cde';

const GameApp = () => {
  const { screen, navigate } = useGame();

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
       (window as any)._loaderReady = true;
    }
  }, []);

  return (
    <div 
      className="relative w-full h-[100dvh] bg-theme-bg-main bg-[image:var(--asset-bg-global)] bg-cover bg-center overflow-hidden flex flex-col font-sans selection:bg-theme-primary-coral-pink/30"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
    >
       <div className="relative flex-1 w-full overflow-hidden flex flex-col">
           <AnimatePresence mode="wait">
             {screen === 'boot' && <BootScreen key="boot" />}
             {screen === 'startup' && <StartupScreen key="startup" />}
             {screen === 'login' && <LoginScreen key="login" />}
           </AnimatePresence>
           
           {/* Other screens are managed here or inside MainLobby */}
           {screen !== 'boot' && screen !== 'startup' && screen !== 'login' && (
             <>
               <MainLobby />
               
               <DestinationScreen />
             </>
           )}
       </div>
    </div>
  );
};

export default function App() {
  return (
    <ProfileProvider>
      <CDEProvider>
        <ThemeProvider>
           <AudioProvider>
             <GameProvider>
                 <GameApp />
             </GameProvider>
           </AudioProvider>
        </ThemeProvider>
      </CDEProvider>
    </ProfileProvider>
  );
}
