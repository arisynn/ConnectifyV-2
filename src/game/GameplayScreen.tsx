import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useOnetGame } from './hooks/useOnetGame';
import { OnetHeader } from './components/OnetHeader';
import { OnetBoard } from './components/OnetBoard';
import { OnetFooter } from './components/OnetFooter';
import { OnetModals } from './components/OnetModals';
import { ThemeCard } from '../components/theme/ThemeCard';
import { GameLoader } from '../components/GameLoader';

export const GameplayScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return <GameLoader onComplete={() => setIsLoaded(true)} />;
  }

  return <GameplayContent />;
};

const GameplayContent = () => {
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
    toastMsg,
    winReward,
    isDailyChallenge,
    currentLevel,
    boardRef,
    handleTileClick,
    useHint,
    useShuffle,
    initGame,
    profile,
    updateProfile,
    navigate
  } = useOnetGame();

  const handleNextLevel = () => {
    if (isDailyChallenge) {
      navigate('levels');
      return;
    }
    const nextLevel = (profile.currentLevel || 1) + 1;
    const newHighest = Math.max(profile.highestLevel || 1, nextLevel);
    updateProfile({ 
        highestLevel: newHighest,
        currentLevel: nextLevel 
    });
    navigate('levels');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 overflow-hidden bg-gray-900 md:p-6 lg:p-10"
    >
      <ThemeCard 
        bgKey="gameplay_bg" 
        fallbackColorClass="bg-theme-bg-main"
        className="w-full h-full md:max-w-6xl md:mx-auto md:rounded-[2rem] md:shadow-2xl md:border-4 md:border-white/30 flex flex-col md:flex-row items-center select-none font-sans overflow-hidden"
      >
        {/* Mobile Header */}
        <div className="w-full md:hidden flex justify-center">
          <OnetHeader 
            level={currentLevel}
            score={score}
            time={time}
            onPause={() => setIsPaused(true)}
          />
        </div>

        {/* Center Board Area */}
        <div className="flex-1 w-full h-full flex items-center justify-center relative md:border-r-4 md:border-white/20 md:bg-white/10 md:backdrop-blur-sm">
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

        {/* Mobile Footer */}
        <div className="w-full md:hidden flex justify-center mt-auto">
          <OnetFooter 
            shuffles={profile.shuffles}
            hints={profile.hints}
            onShuffle={useShuffle}
            onHint={useHint}
          />
        </div>

        {/* Desktop Sidebar Panel */}
        <div className="hidden md:flex flex-col w-80 h-full bg-white/40 backdrop-blur-md p-8 z-20 shrink-0 border-l-4 border-white/40">
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter drop-shadow-sm">Onet Game</h2>
             <button
                onClick={() => setIsPaused(true)}
                className="bg-white p-2.5 flex items-center justify-center hover:bg-gray-50 border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] transition-all"
             >
                <svg className="w-5 h-5 text-theme-text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
             </button>
          </div>
          
          <div className="flex flex-col gap-5 mb-8">
            <div className="bg-white p-4 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-xl">
               <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Level</div>
               <div className="text-4xl font-black text-theme-text-primary leading-none">{currentLevel}</div>
            </div>
            <div className="bg-white p-4 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-xl">
               <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-1">Skor</div>
               <div className="text-4xl font-black text-theme-text-primary leading-none">{score}</div>
            </div>
            <div className={`p-4 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-xl transition-colors duration-300 ${time <= 10 ? 'bg-rose-300 shadow-[inset_0_0_40px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-sky-200'}`}>
               <div className={`text-xs font-extrabold uppercase tracking-wider mb-1 ${time <= 10 ? 'text-slate-800' : 'text-slate-600'}`}>Waktu</div>
               <div className="text-4xl font-black text-theme-text-primary leading-none">{time}s</div>
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-4">
            <button onClick={useShuffle} className="bg-indigo-200 w-full py-4 px-5 flex items-center justify-between hover:bg-indigo-300 border-theme-sm border-theme-border-main shadow-theme-base rounded-xl active:translate-y-[2px] active:translate-x-[2px] transition-all">
               <span className="font-black text-lg tracking-wide text-theme-text-primary">SHUFFLE</span>
               <span className="bg-white border-theme-sm border-theme-border-main rounded-md px-3 py-1 text-base font-black">{profile.shuffles}</span>
            </button>
            <button onClick={useHint} className="bg-amber-200 w-full py-4 px-5 flex items-center justify-between hover:bg-amber-300 border-theme-sm border-theme-border-main shadow-theme-base rounded-xl active:translate-y-[2px] active:translate-x-[2px] transition-all">
               <span className="font-black text-lg tracking-wide text-theme-text-primary">HINT</span>
               <span className="bg-white border-theme-sm border-theme-border-main rounded-md px-3 py-1 text-base font-black">{profile.hints}</span>
            </button>
          </div>
        </div>

        <OnetModals 
          isPaused={isPaused}
          gameState={gameState}
          toastMsg={toastMsg}
          score={score}
          winReward={winReward}
          isDailyChallenge={isDailyChallenge}
          onResume={() => setIsPaused(false)}
          onHome={() => navigate('levels')}
          onRetry={initGame}
          onNextLevel={handleNextLevel}
        />
      </ThemeCard>
    </motion.div>
  );
};
