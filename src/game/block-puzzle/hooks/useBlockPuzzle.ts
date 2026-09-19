import { useState, useEffect, useRef, useCallback } from 'react';
import { logGameplayEvent } from '../core/logger';
import { calculateMatchSkill, updateSkillEMA, getBracket, applyDDAToLevel, DDABracket } from '../core/dda';
import { Piece, getRandomPieces as generatePieces } from '../core/pieces';
import { seededRandom } from '../../../core/zen';
import { ObstacleType, getLevelConfig } from '../core/levelConfig';
import { useProfile } from '../../../core/profile/ProfileContext';
import { useCDE } from '../../../core/cde';
import { RewardEngine } from '../../../core/reward';
import {getBlockDifficulty} from '../../../core/difficulty';
import {canPlaceBlock,hasAnyBlockMove} from '../core/blockRules';

const BOARD_SIZE = 10;

export interface DragState {
  piece: Piece;
  trayIndex: number;
  x: number;
  y: number;
  isDragging: boolean;
}

export const useBlockPuzzle = (isMultiplayer=false, matchSeed?:string, isEndless=false) => {
  const { profile, updateProfile } = useProfile();
  const cde = useCDE();
  const generation=useRef(0);
  const saveKey=isEndless?`connectify-block-infinity-v4-${profile.id}`:`connectify-block-duel-${profile.id}-${matchSeed}`;
  const resultRecorded=useRef(false),runId=useRef(crypto.randomUUID()),restoring=useRef(true);
  const getRandomPieces=(count:number,board?:any,canPlaceFn?:any,rigChance=0,obstacles?:any)=>generatePieces(count,isMultiplayer?null:board,isMultiplayer?null:canPlaceFn,isMultiplayer?0:isEndless ? .1 : difficulty.assistChance,obstacles,isMultiplayer?seededRandom(`${matchSeed}:${generation.current++}`):Math.random,isMultiplayer ? .45 : isEndless?Math.min(.9,score/16000):difficulty.pressure);
  const [winReward, setWinReward] = useState<{ chestPoints: number, permen: number } | null>(null);
  const blocksClearedRef = useRef<number>(0);
  const highestComboRef = useRef<number>(0);
  const [board, setBoard] = useState<string[][]>(Array(BOARD_SIZE).fill(Array(BOARD_SIZE).fill('')));
  const [obstacles, setObstacles] = useState<ObstacleType[][]>(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill('')));
  const [tray, setTray] = useState<(Piece | null)[]>([null, null, null]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [highScore, setHighScore] = useState((isEndless?profile.blockEndlessHighScore:profile.blockPuzzleHighScore) || 0);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'won'>('playing');
  const currentLevel = isMultiplayer || isEndless ? 1 : profile.blockPuzzleLevel || 1;
  const [difficulty,setDifficulty]=useState(()=>getBlockDifficulty(currentLevel,profile.adaptive?.block));
  
  const [moves, setMoves] = useState(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState(0);
  const [gemsDestroyed, setGemsDestroyed] = useState(0);
  const [iceDestroyed, setIceDestroyed] = useState(0);
  const [woodDestroyed, setWoodDestroyed] = useState(0);
  const [missionResults, setMissionResults] = useState<boolean[]>([false, false, false]);
  
  const targetScore = currentLevel * 1000 + 500;
  
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [previewPlacement, setPreviewPlacement] = useState<{row: number, col: number} | null>(null);

  const [clearingCells, setClearingCells] = useState<{r: number, c: number}[]>([]);
  const [comboText, setComboText] = useState<{text: string, id: number} | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const levelStartTime = useRef<number>(Date.now());
  const retryCount = useRef<number>(0);
  const lastPlayedLevel = useRef<number>(currentLevel);
  const placementCount = useRef<number>(0);
  const totalClears = useRef<number>(0);
  const [skillScore, setSkillScore] = useState<number>(() => profile?.blockPuzzleSkill ?? profile?.statistics?.blockPuzzleSkill ?? 50);
  const [currentLevelConfig, setCurrentLevelConfig] = useState<any>(() => getLevelConfig(currentLevel));
  const [currentBracket, setCurrentBracket] = useState<DDABracket>('normal');


  const canPlace = (piece: Piece, row: number, col: number, currentBoard: string[][], currentObstacles: ObstacleType[][] = obstacles) => {
    return canPlaceBlock(piece,row,col,currentBoard,currentObstacles);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Evaluate Missions
  useEffect(() => {
    if (isMultiplayer || isEndless) return;
    if (gameState === 'playing' && !isAnimating && !resultRecorded.current) {
      const evaluateMission = (mission: any, finalCheck: boolean = false) => {
         switch(mission.type) {
            case 'score': return score >= mission.target;
            case 'clear_lines': return linesClearedTotal >= mission.target;
            case 'destroy_gems': return gemsDestroyed >= mission.target;
            case 'destroy_ice': return iceDestroyed >= mission.target;
            case 'destroy_wood': return woodDestroyed >= mission.target;
            case 'max_moves': return finalCheck ? moves <= mission.target : moves <= mission.target;
            default: return false;
         }
      };

      const mainMission = currentLevelConfig.missions[0];
      const mainMet = evaluateMission(mainMission, false);

      if (mainMet) {
         resultRecorded.current=true;
         const results = currentLevelConfig.missions.map(m => evaluateMission(m, true));
         setMissionResults(results);
         setGameState('won');
         

         const stars = results.filter(Boolean).length;
         const durationSec = Math.floor((Date.now() - levelStartTime.current) / 1000);
         const clearRate = placementCount.current > 0 ? totalClears.current / placementCount.current : 0;
         const matchSkill = calculateMatchSkill(true, stars, retryCount.current, clearRate);
         const newSkill = updateSkillEMA(skillScore, matchSkill);
         setSkillScore(newSkill);
         logGameplayEvent('level_end', { level: currentLevel, result: 'won', stars, moves, score, duration_sec: durationSec, new_skill: newSkill });

         const nextLevel = currentLevel + 1;
         updateProfile({
            blockPuzzleSkill: newSkill,
            blockPuzzleLevel: Math.max(profile.blockPuzzleLevel || 1, nextLevel),
            highestBlockPuzzleLevel: Math.max(profile.highestBlockPuzzleLevel || 1, nextLevel),
            blockPuzzleHighScore: Math.max(profile.blockPuzzleHighScore || 0, score)
         });

         // Rewards: permen + chest progress + missions + achievements (server authoritative)
         const winPayload = {
            game: 'block',
            isMultiplayer: false,
            isWinner: true,
            isFlawless: stars === 3,
            timeElapsed: Date.now() - levelStartTime.current,
            progress: 0,
            highestCombo: highestComboRef.current,
            score,
            matches: 0,
            stars,
            blocksCleared: blocksClearedRef.current
         };
         const { rewardResult } = RewardEngine.processWin(JSON.parse(JSON.stringify(profile)), winPayload);
         setWinReward({ chestPoints: rewardResult.chestPoints, permen: rewardResult.permen });
         cde.queueMutation('PROCESS_WIN', winPayload);
      }
    }
  }, [score, linesClearedTotal, gemsDestroyed, iceDestroyed, woodDestroyed, moves, gameState, currentLevelConfig, currentLevel, updateProfile, isAnimating]);

  useEffect(() => {
    if (isMultiplayer) return;
    if (gameState === 'gameover' && score > highScore) {
      setHighScore(score);
      updateProfile(isEndless?{blockEndlessHighScore:score}:{ blockPuzzleHighScore: score });
    }
    if (gameState === 'gameover') {
      if(!resultRecorded.current){
        resultRecorded.current=true;
        if(isEndless)cde.queueMutation('PROCESS_WIN',{game:'block',endless:true,runId:runId.current,isWinner:false,score,matches:0,blocksCleared:blocksClearedRef.current,highestCombo:highestComboRef.current,timeElapsed:Date.now()-levelStartTime.current}).catch(()=>{});
        else cde.queueMutation('RECORD_ATTEMPT',{game:'block'}).catch(()=>{});
      }
    }
  }, [gameState, score, highScore, updateProfile]);

  const initGame = () => {
    if((isMultiplayer||isEndless)&&restoring.current){restoring.current=false;try{const saved=JSON.parse(localStorage.getItem(saveKey)||'null');if(saved){setBoard(saved.board);setTray(saved.tray);setScore(saved.score);setGameState(saved.gameState);setMoves(saved.moves||0);setCombo(saved.combo||0);setLinesClearedTotal(saved.lines||0);blocksClearedRef.current=saved.blocksCleared||0;highestComboRef.current=saved.highestCombo||0;levelStartTime.current=saved.startedAt||Date.now();runId.current=saved.runId||crypto.randomUUID();resultRecorded.current=!!saved.resultRecorded;generation.current=saved.generation||0;return;}}catch{}}
    resultRecorded.current=false;runId.current=crypto.randomUUID();
    if (lastPlayedLevel.current === currentLevel && gameState !== 'playing') {
        retryCount.current += 1;
    } else if (lastPlayedLevel.current !== currentLevel) {
        retryCount.current = 0;
        lastPlayedLevel.current = currentLevel;
    }
    levelStartTime.current = Date.now();
    logGameplayEvent('level_start', { level: currentLevel, retry_count: retryCount.current });

    placementCount.current = 0;
    totalClears.current = 0;

    const bracket = getBracket(skillScore, retryCount.current);
    setCurrentBracket(bracket);
    // Use retryCount in seed so it generates a new level if they fail
    const seed = `${profile?.id || 'guest'}_${currentLevel}_${retryCount.current}`;
    const config = getLevelConfig(currentLevel, bracket, seed,profile.adaptive?.block);
    setDifficulty(getBlockDifficulty(currentLevel,profile.adaptive?.block));
    setCurrentLevelConfig(config);
    const emptyBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(''));
    const initialObstacles = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill('')) as ObstacleType[][];
    
    (isMultiplayer || isEndless ? [] : config.obstacles).forEach(obs => {
       initialObstacles[obs.r][obs.c] = obs.type;
    });

    setBoard(emptyBoard);
    setObstacles(initialObstacles);
    setTray(getRandomPieces(3, emptyBoard, (p, r, c, b) => canPlace(p, r, c, b, initialObstacles)));
    setScore(0);
    setCombo(0);
    setGameState('playing');
    setDragState(null);
    setPreviewPlacement(null);
    setClearingCells([]);
    setComboText(null);
    setIsAnimating(false);
    setMoves(0);
    setLinesClearedTotal(0);
    setGemsDestroyed(0);
    setIceDestroyed(0);
    setWoodDestroyed(0);
    setMissionResults([false, false, false]);
    setWinReward(null);
    blocksClearedRef.current = 0;
    highestComboRef.current = 0;
  };

  const checkGameOver = (currentBoard: string[][], currentTray: (Piece | null)[], currentObstacles: ObstacleType[][]) => {
    const canPlaceAny=hasAnyBlockMove(currentBoard,currentTray,currentObstacles);
    if (!canPlaceAny && currentTray.some(p => p !== null)) {
      setGameState('gameover');
      
      const durationSec = Math.floor((Date.now() - levelStartTime.current) / 1000);
      const clearRate = placementCount.current > 0 ? totalClears.current / placementCount.current : 0;
      const matchSkill = calculateMatchSkill(false, 0, retryCount.current, clearRate);
      const newSkill = updateSkillEMA(skillScore, matchSkill);
      setSkillScore(newSkill);
      logGameplayEvent('level_end', { level: currentLevel, result: 'lost', stars: 0, moves, score, duration_sec: durationSec, new_skill: newSkill });
      
      let filledCount = 0;
      currentBoard.forEach(row => row.forEach(cell => { if (cell !== '') filledCount++; }));
      const boardFillPercent = (filledCount / (BOARD_SIZE * BOARD_SIZE)) * 100;
      logGameplayEvent('game_over', { board_fill_percent: boardFillPercent.toFixed(2) });
    }
  };

  useEffect(()=>{if((isMultiplayer||isEndless) && !isAnimating && tray.some(Boolean))localStorage.setItem(saveKey,JSON.stringify({board,tray,score,gameState,moves,combo,lines:linesClearedTotal,blocksCleared:blocksClearedRef.current,highestCombo:highestComboRef.current,startedAt:levelStartTime.current,runId:runId.current,resultRecorded:resultRecorded.current,generation:generation.current}));},[board,tray,score,gameState,isAnimating,saveKey,isMultiplayer,isEndless]);

  const executeClearAndCascade = (
    currentBoard: string[][],
    currentObstacles: ObstacleType[][],
    currentTray: (Piece | null)[],
    currentCombo: number,
    iteration: number
  ) => {
    let rowsToClear: number[] = [];
    let colsToClear: number[] = [];

    for (let r = 0; r < BOARD_SIZE; r++) {
      let isFull = true;
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (currentBoard[r][c] === '' && !['wood', 'metal-2', 'metal-1', 'stone'].includes(currentObstacles[r][c])) {
          isFull = false; break;
        }
      }
      if (isFull) rowsToClear.push(r);
    }
    for (let c = 0; c < BOARD_SIZE; c++) {
      let isFull = true;
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (currentBoard[r][c] === '' && !['wood', 'metal-2', 'metal-1', 'stone'].includes(currentObstacles[r][c])) {
          isFull = false; break;
        }
      }
      if (isFull) colsToClear.push(c);
    }

    const linesCleared = rowsToClear.length + colsToClear.length;

    if (iteration === 0) {
      placementCount.current += 1;
      if (linesCleared > 0) totalClears.current += linesCleared;
      logGameplayEvent('placement', { clears: linesCleared });
    }

    if (linesCleared === 0 || iteration >= 5) {
      setBoard(currentBoard);
      setObstacles(currentObstacles);
      setClearingCells([]);
      setIsAnimating(false);
      
      if (currentTray.every(p => p === null)) {
        const freshTray = getRandomPieces(3, currentBoard, (p, r, c, b) => canPlace(p, r, c, b, currentObstacles));
        setTray(freshTray);
        checkGameOver(currentBoard, freshTray, currentObstacles);
      } else {
        setTray(currentTray);
        checkGameOver(currentBoard, currentTray, currentObstacles);
      }
      if (iteration === 0) setCombo(0);
      return;
    }

    const newCombo = currentCombo + 1;
    highestComboRef.current = Math.max(highestComboRef.current, newCombo);
    const lineScore = ((linesCleared * (linesCleared + 1)) / 2) * 100;
    const comboBonus = newCombo > 1 ? (newCombo - 1) * 200 : 0;
    const addedScore = lineScore + comboBonus;

    const cellsToClear: {r: number, c: number}[] = [];
    rowsToClear.forEach(r => {
      for (let c = 0; c < BOARD_SIZE; c++) { cellsToClear.push({r, c}); }
    });
    colsToClear.forEach(c => {
      for (let r = 0; r < BOARD_SIZE; r++) {
        if (!cellsToClear.some(cell => cell.r === r && cell.c === c)) { cellsToClear.push({r, c}); }
      }
    });

    let nonEmptyCount = 0;
    for(let r=0; r<BOARD_SIZE; r++) {
       for(let c=0; c<BOARD_SIZE; c++) {
          if (currentBoard[r][c] !== '') nonEmptyCount++;
       }
    }
    const isPerfectClear = nonEmptyCount === cellsToClear.length;

    let finalAddedScore = addedScore;
    if (isPerfectClear) {
       finalAddedScore += 2000;
       setComboText({ text: "PERFECT CLEAR!", id: Date.now() });
       setTimeout(() => setComboText(null), 2000);
    } else if (newCombo > 1) {
       setComboText({ text: `${newCombo} COMBO!`, id: Date.now() });
       setTimeout(() => setComboText(null), 1500);
    } else if (linesCleared >= 2) {
       setComboText({ text: `+${finalAddedScore}`, id: Date.now() });
       setTimeout(() => setComboText(null), 1000);
    } else {
       setComboText({ text: `+${finalAddedScore}`, id: Date.now() });
       setTimeout(() => setComboText(null), 1000);
    }

    setScore(s => s + finalAddedScore);
    setCombo(newCombo);
    setClearingCells(cellsToClear);
    setBoard(currentBoard);
    setObstacles(currentObstacles);

    setTimeout(() => {
       const nextBoard = currentBoard.map(r => [...r]);
       const nextObstacles = currentObstacles.map(r => [...r]);
       let gemsCleared = 0, iceCleared = 0, woodCleared = 0;
       
       cellsToClear.forEach(cell => {
           const obs = nextObstacles[cell.r][cell.c];
           if (obs === 'ice') { nextObstacles[cell.r][cell.c] = ''; iceCleared++; }
           else if (obs === 'wood') { nextObstacles[cell.r][cell.c] = ''; woodCleared++; }
           else if (obs === 'metal-1') { nextObstacles[cell.r][cell.c] = ''; }
           else if (obs === 'metal-2') { nextObstacles[cell.r][cell.c] = 'metal-1'; }
           else if (obs === 'gem') { nextObstacles[cell.r][cell.c] = ''; gemsCleared++; }
           
           if (obs !== 'stone' && obs !== 'metal-2') {
               nextBoard[cell.r][cell.c] = '';
           }
       });

       if (gemsCleared > 0) { setGemsDestroyed(g => g + gemsCleared); setScore(s => s + gemsCleared * 100); }
       if (iceCleared > 0) setIceDestroyed(i => i + iceCleared);
       if (woodCleared > 0) setWoodDestroyed(w => w + woodCleared);
       setLinesClearedTotal(l => l + linesCleared);
       blocksClearedRef.current += cellsToClear.length;

       if (currentLevelConfig.gravity) {
           for (let c = 0; c < BOARD_SIZE; c++) {
               let writeR = BOARD_SIZE - 1;
               for (let readR = BOARD_SIZE - 1; readR >= 0; readR--) {
                   if (nextBoard[readR][c] !== '' || nextObstacles[readR][c] !== '') {
                       if (writeR !== readR) {
                           nextBoard[writeR][c] = nextBoard[readR][c];
                           nextObstacles[writeR][c] = nextObstacles[readR][c];
                           nextBoard[readR][c] = '';
                           nextObstacles[readR][c] = '';
                       }
                       writeR--;
                   }
               }
           }
       }

       setBoard(nextBoard);
       setObstacles(nextObstacles);
       setClearingCells([]);

       if (currentLevelConfig.gravity) {
           setTimeout(() => {
               executeClearAndCascade(nextBoard, nextObstacles, currentTray, newCombo, iteration + 1);
           }, 250);
       } else {
           executeClearAndCascade(nextBoard, nextObstacles, currentTray, newCombo, 5);
       }
    }, 400);
  };

  const placePiece = (row: number, col: number) => {
    if (isAnimating || gameState !== 'playing') return;
    if (!dragState || !canPlace(dragState.piece, row, col, board, obstacles)) return;

    setMoves(m => m + 1);
    
    let newBoard = board.map(r => [...r]);
    const piece = dragState.piece;
    let cellsPlaced = 0;

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < piece.shape[r].length; c++) {
        if (piece.shape[r][c] === 1) {
          newBoard[row + r][col + c] = piece.colorClass;
          cellsPlaced++;
        }
      }
    }

    const baseScore = cellsPlaced * 10;
    setScore(s => s + baseScore);
    
    const newTray = [...tray];
    newTray[dragState.trayIndex] = null;
    setTray(newTray);
    
    setIsAnimating(true);
    
    executeClearAndCascade(newBoard, obstacles, newTray, combo, 0);
  };

  const shuffleTray = () => {
    const freshTray = getRandomPieces(3, board, (p, r, c, b, obs) => canPlace(p, r, c, b, obs || obstacles), 0, obstacles);
    setTray(freshTray);
    checkGameOver(board, freshTray, obstacles);
  };

  const useHammerAt = (row: number, col: number) => {
    if (board[row][col] === '') return false;
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = '';
    
    setBoard(newBoard);
    setScore(s => s + 2);
    logGameplayEvent('powerup_used', { type: 'hammer', moment: moves });

    if (gameState === 'gameover') {
       let canPlaceAny = false;
       for (const piece of tray) {
         if (!piece) continue;
         for (let r = 0; r < BOARD_SIZE; r++) {
           for (let c = 0; c < BOARD_SIZE; c++) {
             if (canPlace(piece, r, c, newBoard, obstacles)) {
               canPlaceAny = true;
               break;
             }
           }
           if (canPlaceAny) break;
         }
         if (canPlaceAny) break;
       }
       if (canPlaceAny) {
         setGameState('playing');
       }
    }
    return true;
  };

  const useBombAt = (row: number, col: number) => {
    let cellsCleared = 0;
    const newBoard = board.map(r => [...r]);
    
    for (let r = Math.max(0, row - 1); r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
        if (newBoard[r][c] !== '') {
          newBoard[r][c] = '';
          cellsCleared++;
        }
      }
    }
    
    if (cellsCleared === 0) return false;
    
    setBoard(newBoard);
    setScore(s => s + (cellsCleared * 5));
    logGameplayEvent('powerup_used', { type: 'bomb', moment: moves });

    if (gameState === 'gameover') {
       let canPlaceAny = false;
       for (const piece of tray) {
         if (!piece) continue;
         for (let r = 0; r < BOARD_SIZE; r++) {
           for (let c = 0; c < BOARD_SIZE; c++) {
             if (canPlace(piece, r, c, newBoard, obstacles)) {
               canPlaceAny = true;
               break;
             }
           }
           if (canPlaceAny) break;
         }
         if (canPlaceAny) break;
       }
       if (canPlaceAny) {
         setGameState('playing');
       }
    }
    return true;
  };

  return {
    isEndless,difficulty,
    board,
    obstacles,
    currentLevelConfig,
    missionResults,
    moves,
    linesClearedTotal,
    gemsDestroyed,
    iceDestroyed,
    woodDestroyed,
    tray,
    score,
    combo,
    highScore,
    gameState,
    dragState,
    setDragState,
    previewPlacement,
    setPreviewPlacement,
    canPlace,
    placePiece,
    initGame,
    shuffleTray,
    useHammerAt,
    useBombAt,
    clearingCells,
    comboText,
    isAnimating,
    BOARD_SIZE,
    targetScore,
    currentLevel,
    skillScore,
    currentBracket,
    winReward,
    clearRate: placementCount.current > 0 ? totalClears.current / placementCount.current : 0
  };
};
