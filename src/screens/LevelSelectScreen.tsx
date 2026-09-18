import { DynamicIcon } from "../components/theme/DynamicIcon";
import React from 'react';
import { useGame } from '../GameContext';
import { useProfile } from '../core/profile/ProfileContext';
import { motion } from 'motion/react';
import { ArrowLeft, LayoutGrid, Puzzle, Users, Flame, Play, Trophy, Check, Candy, Clock } from 'lucide-react';
import { CurrencyPill } from '../designs/KineticComponents';
import { useCDE } from '../core/cde';
import { DAILY_CHALLENGE_REWARD, DAILY_CHALLENGE_TIME, getTodayKey } from '../core/economy';
import { getDailyChallengeLevel } from '../game/hooks/useOnetGame';

export const LevelSelectScreen = () => {
  const { navigate, setGameMode } = useGame();
  const { profile, updateProfile } = useProfile();
  const cde = useCDE();
  const onetLevel = profile.highestLevel || 1;
  const puzzleLevel = profile.blockPuzzleLevel || 1;
  const dailyDone = profile.dailyChallengeDate === getTodayKey();
  const dailyLevel = getDailyChallengeLevel();

  const handlePlayOnet = () => {
      setGameMode('normal');
      updateProfile({ currentLevel: onetLevel });
      navigate('play');
  };

  const handlePlayDaily = () => {
      setGameMode('daily');
      navigate('play');
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="absolute inset-0 z-[100] bg-theme-bg-main bg-[image:var(--asset-bg-global)] flex flex-col font-sans overflow-hidden"
    >
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 z-50 p-4 pt-[calc(env(safe-area-inset-top)+1rem)] flex justify-between items-center bg-gradient-to-b from-black/10 to-transparent pb-8">
            <motion.button 
                onClick={() => navigate('home')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-12 h-12 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-full flex items-center justify-center shadow-theme-base active:shadow-[var(--geometry-shadow-active)] active:translate-y-1 transition-all"
            >
                <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
            </motion.button>
            <CurrencyPill type="candy" value={cde.permen} onClick={() => {}} />
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full flex flex-col pt-24 pb-8 px-5 overflow-y-auto hide-scrollbar max-w-md mx-auto">
            <h2 className="text-3xl font-black text-theme-text-primary uppercase tracking-tighter drop-shadow-md mb-6 text-center">
                Pilih Permainan
            </h2>
            
            <div className="flex flex-col gap-5 pb-8">
                {/* Onet Classic Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-base flex flex-col gap-4 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary-coral-pink/10 rounded-bl-[100px] pointer-events-none -z-10" />
                    
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-theme-primary-coral-pink border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center shadow-[inset_0px_-2px_0px_rgba(0,0,0,0.2)]">
                                <LayoutGrid size={28} className="text-theme-text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-theme-text-primary uppercase tracking-tighter">Onet Classic</h3>
                                <p className="font-bold text-xs text-theme-text-secondary">Hubungkan 2 gambar sama</p>
                            </div>
                        </div>
                        <div className="bg-theme-bg-soft-pink border-theme-sm border-theme-border-main rounded-xl px-3 py-1 flex flex-col items-center justify-center min-w-[3.5rem]">
                            <span className="text-[10px] font-black text-theme-text-muted uppercase">Level</span>
                            <span className="text-lg font-black text-theme-primary-coral-pink leading-none">{onetLevel}</span>
                        </div>
                    </div>
                    
                    <motion.button
                        onClick={handlePlayOnet}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-theme-primary-coral-pink py-3 rounded-xl border-theme-base border-theme-border-main shadow-theme-sm flex justify-center items-center gap-2 active:translate-y-1 active:shadow-none transition-all mt-2"
                    >
                        <Play size={20} className="fill-theme-text-primary text-theme-text-primary" />
                        <span className="font-black text-theme-text-primary text-lg tracking-wider">MAINKAN</span>
                    </motion.button>
                </motion.div>

                {/* Block Puzzle Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-base flex flex-col gap-4 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-theme-currency-candy-purple/10 rounded-bl-[100px] pointer-events-none -z-10" />
                    
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-theme-currency-candy-purple border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center shadow-[inset_0px_-2px_0px_rgba(0,0,0,0.2)]">
                                <Puzzle size={28} className="text-theme-text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-theme-text-primary uppercase tracking-tighter">Block Puzzle</h3>
                                <p className="font-bold text-xs text-theme-text-secondary">Susun blok, pecahkan rekor</p>
                            </div>
                        </div>
                        <div className="bg-purple-100 border-theme-sm border-theme-border-main rounded-xl px-3 py-1 flex flex-col items-center justify-center min-w-[3.5rem]">
                            <span className="text-[10px] font-black text-theme-text-muted uppercase">Level</span>
                            <span className="text-lg font-black text-theme-currency-candy-purple leading-none">{puzzleLevel}</span>
                        </div>
                    </div>
                    
                    <motion.button
                        onClick={() => navigate('block-puzzle')}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-theme-currency-candy-purple py-3 rounded-xl border-theme-base border-theme-border-main shadow-theme-sm flex justify-center items-center gap-2 active:translate-y-1 active:shadow-none transition-all mt-2"
                    >
                        <Play size={20} className="fill-theme-text-primary text-theme-text-primary" />
                        <span className="font-black text-theme-text-primary text-lg tracking-wider">MAINKAN</span>
                    </motion.button>
                </motion.div>

                {/* Multiplayer Card */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-base flex flex-col gap-4 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary-sky-blue/10 rounded-bl-[100px] pointer-events-none -z-10" />
                    
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-theme-primary-sky-blue border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center shadow-[inset_0px_-2px_0px_rgba(0,0,0,0.2)]">
                                <Users size={28} className="text-theme-text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-theme-text-primary uppercase tracking-tighter">Multiplayer</h3>
                                <p className="font-bold text-xs text-theme-text-secondary">Mabar bersama teman</p>
                            </div>
                        </div>
                    </div>
                    
                    <motion.button
                        onClick={() => navigate('multiplayer')}
                        whileTap={{ scale: 0.95 }}
                        className="w-full bg-theme-primary-sky-blue py-3 rounded-xl border-theme-base border-theme-border-main shadow-theme-sm flex justify-center items-center gap-2 active:translate-y-1 active:shadow-none transition-all mt-2"
                    >
                        <Users size={20} className="fill-theme-text-primary text-theme-text-primary" />
                        <span className="font-black text-theme-text-primary text-lg tracking-wider">MASUK LOBBY</span>
                    </motion.button>
                </motion.div>

                {/* Tantangan Harian */}
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    data-testid="daily-challenge-card"
                    className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-base flex flex-col gap-4 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-theme-primary-warm-orange/10 rounded-bl-[100px] pointer-events-none -z-10" />
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 bg-theme-primary-warm-orange border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center shadow-[inset_0px_-2px_0px_rgba(0,0,0,0.2)]">
                                <Flame size={28} className="text-theme-text-primary" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl text-theme-text-primary uppercase tracking-tighter">Tantangan Harian</h3>
                                <p className="font-bold text-xs text-theme-text-secondary flex items-center gap-1"><Clock size={12} /> Level {dailyLevel} · {DAILY_CHALLENGE_TIME} detik</p>
                            </div>
                        </div>
                        <div className="bg-orange-100 border-theme-sm border-theme-border-main rounded-xl px-3 py-1 flex flex-col items-center justify-center min-w-[3.5rem]">
                            <span className="text-[10px] font-black text-theme-text-muted uppercase">Bonus</span>
                            <span className="text-sm font-black text-theme-primary-warm-orange leading-none flex items-center gap-1">+{DAILY_CHALLENGE_REWARD} <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-4 h-4 object-contain" /></span>
                        </div>
                    </div>
                    
                    <motion.button
                        data-testid="daily-challenge-play-button"
                        onClick={handlePlayDaily}
                        whileTap={{ scale: 0.95 }}
                        className={`w-full py-3 rounded-xl border-theme-base border-theme-border-main shadow-theme-sm flex justify-center items-center gap-2 active:translate-y-1 active:shadow-none transition-all mt-2 ${dailyDone ? 'bg-theme-surface-card-soft' : 'bg-theme-primary-warm-orange'}`}
                    >
                        {dailyDone ? <Check size={20} className="text-theme-text-primary" strokeWidth={3} /> : <Play size={20} className="fill-theme-text-primary text-theme-text-primary" />}
                        <span className="font-black text-theme-text-primary text-lg tracking-wider">{dailyDone ? 'SELESAI · MAIN LAGI' : 'MULAI TANTANGAN'}</span>
                    </motion.button>
                </motion.div>

            </div>
        </div>

        {/* Global styles for hiding scrollbar cleanly */}
        <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}} />
    </motion.div>
  );
};
