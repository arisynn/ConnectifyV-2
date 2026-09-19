import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../GameContext';
import { useTheme } from '../../core/theme/ThemeProvider';
import { useProfile } from '../../core/profile/ProfileContext';
import { useCDE, CDE } from '../../core/cde';
import { generateBoard, getPath, findHint, countRemaining, guaranteedShuffle, breakMatchedTiles, resolveTile } from '../../core/board';
import { ROWS, COLS } from '../../core/config';

import { RewardEngine } from '../../core/reward';
import { DAILY_CHALLENGE_TIME, getTodayKey } from '../../core/economy';
import {getOnetDifficulty} from '../../core/difficulty';

// Daily challenge: same level for everyone on a given day, a bit harder than usual.
export const getDailyChallengeLevel = () => {
  const dayIndex = Math.floor(Date.now() / 86400000);
  return 5 + ((dayIndex * 7) % 16); // level 5..20
};

export const useOnetGame = (initialBoard?: any[][], isMultiplayer?: boolean, onComplete?: () => void, onProgress?: (remaining: number) => void, onMatch?: (a:{r:number,c:number},b:{r:number,c:number})=>Promise<any[][]>) => {
  const { navigate, gameMode } = useGame();
  const isDailyChallenge = gameMode === 'daily' && !isMultiplayer;
  const { activeTheme } = useTheme();
  const { profile, updateProfile, addCurrency } = useProfile();
  const [difficulty,setDifficulty]=useState(()=>getOnetDifficulty(isDailyChallenge?getDailyChallengeLevel():profile.currentLevel||1,isDailyChallenge||isMultiplayer?{}:profile.adaptive?.onet));
  const LEVEL_TIME=isDailyChallenge?DAILY_CHALLENGE_TIME:isMultiplayer?120:difficulty.timeLimit;
  const lossRecorded=useRef(false);
  const cde = useCDE();
  
  const [board, setBoard] = useState<any[][]>(initialBoard || []);
  const [selected, setSelected] = useState<{r: number, c: number} | null>(null);
  const [activePaths, setActivePaths] = useState<{id: number, path: {r: number, c: number}[]}[]>([]);
  const pathIdCounter = useRef(0);
  const [hintTiles, setHintTiles] = useState<{p1: {r: number, c: number}, p2: {r: number, c: number}} | null>(null);
  const [directionErrorTiles, setDirectionErrorTiles] = useState<{r: number, c: number}[]>([]);
  const [matchingTiles, setMatchingTiles] = useState<{r: number, c: number}[]>([]);
  
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const comboRef = useRef(0);
  const comboTimerRef = useRef<any>(null);
  const highestComboRef = useRef(0);
  const mistakesRef = useRef(0);
  const matchesRef = useRef(0);
  const pendingMatch = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { const id = setTimeout(fn, ms); timers.current.push(id); return id; };
  useEffect(() => () => { timers.current.forEach(clearTimeout); clearTimeout(comboTimerRef.current); }, []);
  const floatingTextIdRef = useRef(0);
  const [floatingTexts, setFloatingTexts] = useState<{id: number, text: string, x: number, y: number}[]>([]);
  const [time, setTime] = useState(LEVEL_TIME);
  const [isPaused, setIsPaused] = useState(false);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [toastMsg, setToastMsg] = useState('');
  const [winReward, setWinReward] = useState<{chestPoints: number, permen: number, dailyBonus: number} | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
     setToastMsg(msg);
     setTimeout(() => setToastMsg(''), 2000);
  };

  const profileRef = useRef(profile);
  useEffect(() => {
      profileRef.current = profile;
  }, [profile]);

  const initGame = () => {
    timers.current.forEach(clearTimeout);
    pendingMatch.current = false;
    setMatchingTiles([]);
    const level = isDailyChallenge ? getDailyChallengeLevel() : (profile.currentLevel || 1);
    const nextDifficulty=getOnetDifficulty(level,isDailyChallenge||isMultiplayer?{}:profile.adaptive?.onet);
    setDifficulty(nextDifficulty);lossRecorded.current=false;
    const newBoard = initialBoard ? JSON.parse(JSON.stringify(initialBoard)) : generateBoard(activeTheme.id, level,nextDifficulty);
    setBoard(newBoard);
    setSelected(null);
    setActivePaths([]);
    setHintTiles(null);
    setScore(0);
    setCombo(0);
    comboRef.current = 0;
    highestComboRef.current = 0;
    mistakesRef.current = 0;
    matchesRef.current = 0;
    setWinReward(null);
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    setTime(isDailyChallenge?DAILY_CHALLENGE_TIME:isMultiplayer?120:nextDifficulty.timeLimit);
    setGameState('playing');
    setIsPaused(false);
  };

  // Initialize board
  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) return;
    
    const timer = setInterval(() => {
      setTime(t => t <= 1 ? 0 : t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState, isPaused]);

  useEffect(() => {
    if (time === 0 && gameState === 'playing' && !isMultiplayer) {
      setGameState('lost');
      if(!isDailyChallenge&&!lossRecorded.current){lossRecorded.current=true;cde.queueMutation('RECORD_ATTEMPT',{game:'onet'}).catch(()=>{});}
    }
  }, [time, gameState, updateProfile, isMultiplayer]);


  // Handle win condition and auto-shuffle if deadlock
  useEffect(() => {
     if (gameState === 'playing' && board.length > 0) {
        const remaining = countRemaining(board);
        if (onProgress) onProgress(remaining);
        
        if (remaining === 0) {
           setGameState('won');
           if (isMultiplayer && onComplete) {
               onComplete();
               return;
           }
           const timeElapsed = (LEVEL_TIME - time) * 1000;
           const isFlawless = mistakesRef.current === 0;
           const progress = (time / LEVEL_TIME) * 100; // Survivor bar percentage

           const winPayload = {
               game: 'onet',
               isMultiplayer: false,
               isFlawless,
               timeElapsed,
               progress,
               highestCombo: highestComboRef.current,
               isWinner: true,
               score,
               matches: matchesRef.current,
               mistakes:mistakesRef.current,
               isDailyChallenge
           };
           const currentProfile = JSON.parse(JSON.stringify(profileRef.current));
           const { rewardResult } = RewardEngine.processWin(currentProfile, winPayload);
           setWinReward(rewardResult);
           cde.queueMutation('PROCESS_WIN', winPayload);

        } else {
           const hint = findHint(board);
           if (!hint && !isMultiplayer) {
              showToast("Tidak ada langkah! Mengacak papan...");
              later(() => {
                 setBoard(prev => guaranteedShuffle(prev));
              }, 1000);
           }
        }
     }
  }, [board, gameState, addCurrency]);

  const handleTileClick = (r: number, c: number) => {
    if (gameState !== 'playing' || isPaused || pendingMatch.current) return;
    ({r,c} = resolveTile(board,r,c));
    if (board[r][c] === 0 || board[r][c].isSlave) return;
    if (matchingTiles.some(t => t.r === r && t.c === c) || directionErrorTiles.some(t => t.r === r && t.c === c)) return;

    if (!selected) {
      setSelected({ r, c });
      return;
    }

    if (selected.r === r && selected.c === c) {
      setSelected(null);
      return;
    }

    if (board[r][c].id !== board[selected.r][selected.c].id) {
      setSelected({ r, c });
      return;
    }

    // Same icon, check path
    const result = getPath(board, selected.r, selected.c, r, c, matchingTiles);
      if (result && result.path) {
      pendingMatch.current = true;
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
         navigator.vibrate(8);
      }
      const pathId = pathIdCounter.current++;
      setActivePaths(prev => [...prev, { id: pathId, path: result.path }]);
      
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      comboRef.current += 1;
      matchesRef.current += 1;
      highestComboRef.current = Math.max(highestComboRef.current, comboRef.current);
      const currentCombo = comboRef.current;
      setCombo(currentCombo);

      comboTimerRef.current = setTimeout(() => {
         comboRef.current = 0;
         setCombo(0);
      }, 4000);

      if (currentCombo > 1) {
         const id = floatingTextIdRef.current++;
         const x = ((c - 1 + 0.5) / COLS) * 100;
         const y = ((r - 1 + 0.5) / ROWS) * 100;
         setFloatingTexts(prev => [...prev, { id, text: `Combo x${currentCombo}!`, x, y }]);
         setTimeout(() => {
            setFloatingTexts(prev => prev.filter(ft => ft.id !== id));
         }, 600);
      }
      
      const s_r = selected.r;
      const s_c = selected.c;
      const remoteBoard = onMatch ? onMatch({r:s_r,c:s_c},{r,c}).then(board=>({board,error:null})).catch(error=>({board:null,error})) : null;
      
      setMatchingTiles(prev => [...prev, {r: s_r, c: s_c}, {r, c}]);
      setSelected(null); // Release selection immediately for snappy feel
      
      later(async () => {
         const remote = remoteBoard ? await remoteBoard : null;
         if (remote?.error) {
            pendingMatch.current=false;setMatchingTiles([]);setActivePaths([]);showToast('Langkah belum tersimpan. Coba lagi.');return;
         }
         setBoard(prev => {
            if (remote?.board) return remote.board;
            return breakMatchedTiles(prev, {r:s_r,c:s_c}, {r,c});
         });
         pendingMatch.current = false;
         setScore(s => s + 100 + ((currentCombo - 1) * 10));
         setHintTiles(null);
         setActivePaths(prev => prev.filter(p => p.id !== pathId));
         setMatchingTiles(prev => prev.filter(t => !(t.r === s_r && t.c === s_c) && !(t.r === r && t.c === c)));
      }, 600); // Path display duration
    } else if (result && (result.error === 'DIRECTION_MISMATCH' || result.error === 'NO_PATH')) {
      mistakesRef.current += 1;
      setDirectionErrorTiles([{r: selected.r, c: selected.c}, {r, c}]);
      setTimeout(() => setDirectionErrorTiles([]), 500);
      setSelected(null); // deselect to force player to think
    } else {
      setSelected({ r, c });
    }
  };

  const useHint = () => {
     if (gameState !== 'playing' || isPaused || pendingMatch.current) return;
     
     const currentHints = Number(CDE.getState().profile?.profile_data?.profile?.hints ?? profile.hints ?? 3);
     if (isNaN(currentHints) || currentHints <= 0) {
        showToast("Item Hint habis! Beli di Toko.");
        return;
     }
     
     const hint = findHint(board);
     if (hint) {
        cde.queueMutation('USE_ITEM', { itemId: 'hint' });
        setHintTiles(hint);
        showToast("Petunjuk ditemukan!");
     } else {
        showToast("Tidak ada pasangan, tunggu acak otomatis!");
     }
  };

  const useShuffle = () => {
     if (gameState !== 'playing' || isPaused) return;

     const currentShuffles = Number(CDE.getState().profile?.profile_data?.profile?.shuffles ?? profile.shuffles ?? 3);
     if (isNaN(currentShuffles) || currentShuffles <= 0) {
        showToast("Item Shuffle habis! Beli di Toko.");
        return;
     }
     
     const newBoard = guaranteedShuffle(board);
     if (newBoard !== board) {
         setBoard(newBoard);
         cde.queueMutation('USE_ITEM', { itemId: 'shuffle' });
         setHintTiles(null);
         setSelected(null);
         showToast("Papan diacak!");
     } else {
         showToast("Tidak ada yang bisa diacak!");
     }
  };

  return {
    board,
    selected,
    activePaths,
    hintTiles,
    directionErrorTiles,
    matchingTiles,
    score,
    combo,
    floatingTexts,
    time,
    isPaused,
    setIsPaused,
    gameState,
    toastMsg,
    winReward,
    isDailyChallenge,
    dailyChallengeDone: profile.dailyChallengeDate === getTodayKey(),
    levelTime: LEVEL_TIME,
    difficulty,
    currentLevel: isDailyChallenge ? getDailyChallengeLevel() : (profile.currentLevel || 1),
    boardRef,
    handleTileClick,
    useHint,
    useShuffle,
    initGame,
    profile,
    updateProfile,
    navigate
  };
};
