import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { useOnetGame } from './hooks/useOnetGame';
import { OnetHeader } from './components/OnetHeader';
import { OnetBoard } from './components/OnetBoard';
import { ThemeCard } from '../components/theme/ThemeCard';
import { Trophy, Swords, LogOut } from 'lucide-react';
import { ProfileComponent } from '../designs/KineticComponents';
import { MatchCountdown } from './components/MatchCountdown';
import { GameLoader } from '../components/GameLoader';

export const MultiplayerGameplay = (props: any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return <GameLoader onComplete={() => setIsLoaded(true)} />;
  }

  return <MultiplayerGameplayContent {...props} />;
};

const MultiplayerGameplayContent = ({ room, user, profile, completeMatch, onAttemptLeave }: any) => {
  const handleProgress = (remaining: number) => {
    // Send progress to server (e.g. via an API call or just rely on standard polling in useMultiplayer)
    // Actually, we can use a sync method if available, or just fetch directly.
    fetch(`/api/multiplayer?action=sync&roomId=${room.id}&name=${encodeURIComponent(user.name)}&progress=${remaining}`);
  };

  const {
    board,
    selected,
    activePaths,
    hintTiles,
    directionErrorTiles,
    matchingTiles,
    score,
    floatingTexts,
    time,
    isPaused,
    setIsPaused,
    gameState,
    boardRef,
    handleTileClick,
    useHint,
    useShuffle
  } = useOnetGame(room.board, true, completeMatch, handleProgress);

  const opponent = room.players.find((p: any) => p.name !== user.name);
  const me = room.players.find((p: any) => p.name === user.name);

  const [isStarting, setIsStarting] = useState(() => room.startAt && Date.now() < room.startAt);
  useEffect(() => {
    if (isStarting) setIsPaused(true);
  }, [isStarting, setIsPaused]);


  // We could calculate max progress based on initial board size
  const maxTiles = (room.board?.length - 2) * (room.board?.[0]?.length - 2); // Exclude border
  
  const getProgressPercentage = (progress: number | undefined) => {
      if (progress === undefined || !maxTiles) return 0;
      // progress is remaining tiles
      return Math.max(0, Math.min(100, 100 - (progress / maxTiles) * 100));
  };

  const myProgress = getProgressPercentage(me?.progress);
  const opponentProgress = getProgressPercentage(opponent?.progress);

  return (
    <div className="absolute inset-0 z-40 overflow-hidden bg-gray-900 md:p-6 lg:p-10">
      {isStarting && room.startAt && <MatchCountdown startAt={room.startAt} onFinished={() => { setIsStarting(false); setIsPaused(false); }} />}
      
      <ThemeCard 
         bgKey="gameplay_bg" 
         fallbackColorClass="bg-theme-bg-main"
        className="w-full h-full md:max-w-6xl md:mx-auto md:rounded-[2rem] md:shadow-2xl md:border-4 md:border-white/30 flex flex-col items-center select-none font-sans pb-10 md:pb-0 overflow-hidden"
      >
        <div className="w-full flex justify-between items-center px-4 py-3 md:py-6 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-6 bg-black/10 backdrop-blur-md z-20">
            <button onClick={onAttemptLeave} className="p-2 bg-white/20 rounded-full hover:bg-white/30 active:scale-95 transition-transform mr-2"><LogOut size={20} className="text-white" /></button>
            
            <div className="flex items-center gap-2">
                <ProfileComponent avatarStr={profile.activeAvatarId} avatarBg={profile.activeAvatarBackground} className="w-10 h-10 md:w-16 md:h-16 border-2 border-theme-primary-coral-pink" />
                <div className="flex flex-col">
                    <span className="font-black text-xs md:text-lg text-theme-text-primary uppercase">{me?.name}</span>
                    <div className="w-24 md:w-48 h-2 md:h-4 bg-black/20 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-theme-primary-coral-pink transition-all duration-300" style={{width: `${myProgress}%`}} />
                    </div>
                </div>
            </div>
            
            <Swords className="text-theme-primary-sunny-yellow md:w-12 md:h-12" size={24} />
            
            <div className="flex items-center gap-2 flex-row-reverse text-right">
                <ProfileComponent avatarStr="avatar_male" avatarBg="#bde0fe" className="w-10 h-10 md:w-16 md:h-16 border-2 border-theme-primary-sky-blue" />
                <div className="flex flex-col items-end">
                    <span className="font-black text-xs md:text-lg text-theme-text-primary uppercase">{opponent?.name || 'Waiting...'}</span>
                    <div className="w-24 md:w-48 h-2 md:h-4 bg-black/20 rounded-full overflow-hidden flex justify-end mt-1">
                        <div className="h-full bg-theme-primary-sky-blue transition-all duration-300" style={{width: `${opponentProgress}%`}} />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 w-full h-full flex items-center justify-center relative md:bg-white/10 md:backdrop-blur-sm">
          <OnetBoard 
            boardRef={boardRef}
            board={board}
            selected={selected}
            activePaths={activePaths}
            hintTiles={hintTiles}
            directionErrorTiles={directionErrorTiles}
            matchingTiles={matchingTiles}
            floatingTexts={floatingTexts}
            onTileClick={handleTileClick}
          />
        </div>
      </ThemeCard>
    </div>
  );
};
