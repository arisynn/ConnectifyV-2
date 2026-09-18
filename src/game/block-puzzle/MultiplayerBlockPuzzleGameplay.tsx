import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../GameContext';
import { useBlockPuzzle } from './hooks/useBlockPuzzle';
import { KineticButton } from '../../designs/KineticComponents';
import { KineticModal } from '../../designs/KineticPopups';
import { ArrowLeft, RefreshCw, Trophy, Swords, LogOut } from 'lucide-react';
import { ProfileComponent } from '../../designs/KineticComponents';
import { MatchCountdown } from '../components/MatchCountdown';
import { Piece } from './core/pieces';
import { DynamicIcon } from '../../components/theme/DynamicIcon';
import { GameLoader } from '../../components/GameLoader';

export const MultiplayerBlockPuzzleGameplay = (props: any) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return <GameLoader onComplete={() => setIsLoaded(true)} />;
  }

  return <MultiplayerBlockPuzzleContent {...props} />;
};

const MultiplayerBlockPuzzleContent = ({ room, user, profile, reportLoss, reportTimeUp, onAttemptLeave }: any) => {
  const { navigate } = useGame();
  const {
    board,
    tray,
    score,
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
    clearingCells,
    comboText,
    isAnimating,
    BOARD_SIZE
  } = useBlockPuzzle();

  const boardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {

     if (room?.status === 'PLAYING') {

         fetch(`/api/multiplayer?action=sync&roomId=${room.id}&name=${encodeURIComponent(user.name)}&progress=${score}`);

     }

  }, [score, room?.id, user.name, room?.status]);



  useEffect(() => {

     if (gameState === 'gameover' && room?.status === 'PLAYING') {

         reportLoss();

     }

  }, [gameState, room?.status, reportLoss]);



  const opponent = room?.players.find((p: any) => p.name !== user.name);

  const me = room?.players.find((p: any) => p.name === user.name);

  const [isStarting, setIsStarting] = React.useState(() => room.startAt && Date.now() < room.startAt);
  const GAME_DURATION = 180000; // 3 menit
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  useEffect(() => {
     if (room?.status === 'PLAYING' && room?.startAt) {
         const interval = setInterval(() => {
             const now = Date.now();
             if (now < room.startAt) return;
             
             const elapsed = now - room.startAt;
             const remaining = Math.max(0, GAME_DURATION - elapsed);
             setTimeLeft(remaining);
             
             if (remaining === 0) {
                 clearInterval(interval);
                 if (gameState !== 'gameover') {
                     reportTimeUp();
                 }
             }
         }, 100);
         return () => clearInterval(interval);
     }
  }, [room?.status, room?.startAt, reportTimeUp, gameState]);




  const maxScore = Math.max(100, Math.max(me?.progress || 0, opponent?.progress || 0) * 1.2);

  const myProgress = Math.min(100, ((me?.progress || 0) / maxScore) * 100);

  const opponentProgress = Math.min(100, ((opponent?.progress || 0) / maxScore) * 100);
  const CELL_SIZE = 36; // We'll make it dynamic if we can, but a fixed size or measured size is better.
  // Actually, let's measure cell size dynamically based on boardRef.
  const getCellSize = () => {
    if (boardRef.current) {
      const innerWidth = boardRef.current.getBoundingClientRect().width - 12; 
      const gapTotal = (BOARD_SIZE - 1) * 2;
      return (innerWidth - gapTotal) / BOARD_SIZE;
    }
    return 36; // fallback
  };

  const handlePointerDown = (e: React.PointerEvent, piece: Piece, index: number) => {
    if (gameState !== 'playing' || room?.status !== 'PLAYING') return;
    e.preventDefault();
    setDragState({
      piece,
      trayIndex: index,
      x: e.clientX,
      y: e.clientY,
      isDragging: true
    });
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState || !dragState.isDragging) return;
      
      setDragState(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);

      if (boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();
        // 8px borders (4px each side), 4px padding (2px each side)
        const innerWidth = boardRect.width - 12; 
        const gapTotal = (BOARD_SIZE - 1) * 2;
        const cellSize = (innerWidth - gapTotal) / BOARD_SIZE;
        const totalCellStep = cellSize + 2; // size + 1 gap
        
        // Offset the touch point so the piece floats above finger
        const touchYOffset = -80;
        const adjustedY = e.clientY + touchYOffset;
        const adjustedX = e.clientX;

        // Calculate piece top-left based on centering it horizontally on the touch point
        const pieceWidth = dragState.piece.shape[0].length * totalCellStep;
        const pieceHeight = dragState.piece.shape.length * totalCellStep;
        const pieceLeftX = adjustedX - (pieceWidth / 2);
        const pieceTopY = adjustedY - (pieceHeight / 2);
        
        // Find board row/col
        // Also account for the 6px offset (4px border + 2px padding) from the top-left of the board element
        const relativeX = pieceLeftX - (boardRect.left + 6);
        const relativeY = pieceTopY - (boardRect.top + 6);

        const col = Math.round(relativeX / totalCellStep);
        const row = Math.round(relativeY / totalCellStep);

        if (
          row >= -dragState.piece.shape.length && row < BOARD_SIZE && 
          col >= -dragState.piece.shape[0].length && col < BOARD_SIZE
        ) {
           if (canPlace(dragState.piece, row, col, board)) {
              setPreviewPlacement({ row, col });
           } else {
              setPreviewPlacement(null);
           }
        } else {
          setPreviewPlacement(null);
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragState || !dragState.isDragging) return;
      
      if (previewPlacement) {
         placePiece(previewPlacement.row, previewPlacement.col);
      }
      
      setDragState(null);
      setPreviewPlacement(null);
    };

    if (dragState && dragState.isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragState, previewPlacement, board, placePiece]);

  const formatTime = (ms: number) => {
      const totalSeconds = Math.ceil(ms / 1000);
      const m = Math.floor(totalSeconds / 60);
      const s = totalSeconds % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col md:p-6 lg:p-10 items-center overflow-hidden font-sans touch-none select-none">
      <div className="w-full h-full md:max-w-6xl md:mx-auto md:bg-[#f8fafc] md:rounded-[2rem] md:shadow-2xl md:border-4 md:border-white/30 flex flex-col items-center overflow-hidden relative">
      
      {/* HEADER */}
      <div className="w-full flex justify-between items-center px-4 py-3 md:py-6 pt-[calc(env(safe-area-inset-top)+1rem)] md:pt-6 bg-black/10 backdrop-blur-md z-10">
          <button onClick={onAttemptLeave} className="p-2 bg-white/20 rounded-full hover:bg-white/30 active:scale-95 transition-transform mr-2"><LogOut size={20} className="text-white" /></button>
          <div className="flex items-center gap-2 flex-1">
              <ProfileComponent avatarStr={profile.activeAvatarId} avatarBg={profile.activeAvatarBackground} className="w-10 h-10 md:w-16 md:h-16 border-2 border-theme-primary-coral-pink shrink-0" />
              <div className="flex flex-col min-w-0">
                  <span className="font-black text-xs md:text-lg text-theme-text-primary uppercase truncate">{me?.name}</span>
                  <span className="font-black text-sm md:text-xl text-theme-primary-coral-pink">{score}</span>
              </div>
          </div>
          
          <div className="flex flex-col items-center justify-center shrink-0 mx-2 bg-theme-surface-card-white border-2 border-theme-border-main rounded-xl px-4 py-1 md:px-8 md:py-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
             <span className={`font-black text-xl md:text-3xl tracking-tighter ${timeLeft <= 10000 ? 'text-red-500 animate-pulse' : 'text-theme-text-primary'}`}>
                 {formatTime(timeLeft)}
             </span>
             <span className="font-bold text-[10px] md:text-xs text-theme-text-muted uppercase -mt-1 md:mt-0">WAKTU</span>
          </div>
          
          <div className="flex items-center gap-2 flex-row-reverse text-right flex-1">
              <ProfileComponent avatarStr={opponent?.avatarId || "avatar_male"} avatarBg={opponent?.avatarBackground || "#bde0fe"} className="w-10 h-10 md:w-16 md:h-16 border-2 border-theme-primary-sky-blue shrink-0" />
              <div className="flex flex-col items-end min-w-0">
                  <span className="font-black text-xs md:text-lg text-theme-text-primary uppercase truncate">{opponent?.name || 'Waiting...'}</span>
                  <span className="font-black text-sm md:text-xl text-theme-primary-sky-blue">{opponent?.progress || 0}</span>
              </div>
          </div>
      </div>

      <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-center md:bg-white/10 md:backdrop-blur-sm relative pt-4 md:pt-0">
        {/* BOARD */}
        <div className="flex-1 w-full max-w-md md:max-w-2xl flex flex-col items-center justify-center p-4">
          <div 
            ref={boardRef}
            className={`w-full max-w-[350px] md:max-w-[450px] aspect-square bg-theme-surface-card-soft border-theme-lg border-theme-border-main rounded-xl shadow-theme-lg grid relative transition-all`}
            style={{ 
                gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
                gap: '2px',
                padding: '2px'
            }}
          >
            {/* Cells */}
            {board.map((row, r) => 
                row.map((cellColor, c) => {
                  // Check if this cell is part of the preview
                  let isPreview = false;
                  let previewColor = '';
                  if (previewPlacement && dragState) {
                      const pr = r - previewPlacement.row;
                      const pc = c - previewPlacement.col;
                      if (
                        pr >= 0 && pr < dragState.piece.shape.length &&
                        pc >= 0 && pc < dragState.piece.shape[0].length &&
                        dragState.piece.shape[pr][pc] === 1
                      ) {
                        isPreview = true;
                        previewColor = dragState.piece.colorClass;
                      }
                  }

                  return (
                      <div 
                        key={`${r}-${c}`}
                        className={`w-full h-full rounded-sm transition-colors duration-150 border-theme-sm 
                            ${clearingCells.some(cell => cell.r === r && cell.c === c) ? 'bg-white brightness-150 scale-105 border-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10' :
                              cellColor !== '' ? `${cellColor} border-black/20 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.4)]` : 
                              isPreview ? `${previewColor} opacity-50 border-black/20` : 
                              'bg-gray-300/50 border-transparent'
                            }
                        `}
                      />
                  );
                })
            )}

            <AnimatePresence>
              {comboText && (
                <motion.div
                  key={comboText.id}
                  initial={{ opacity: 0, y: 0, scale: 0.5 }}
                  animate={{ opacity: 1, y: -40, scale: 1.2 }}
                  exit={{ opacity: 0, y: -80 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                >
                  <span className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] bg-gradient-to-t from-orange-500 to-yellow-300 text-transparent bg-clip-text" style={{ WebkitTextStroke: '1px #78350f' }}>
                    {comboText.text}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* TRAY */}
        <div className={`w-full max-w-md md:w-96 md:max-w-none md:border-l-4 md:border-white/40 md:h-full md:bg-white/40 md:backdrop-blur-md h-40 flex md:flex-col items-center justify-around md:justify-center md:gap-12 px-4 pb-8 md:pb-0 transition-opacity`}>
          {tray.map((piece, i) => (
              <div key={i} className="w-24 h-24 md:w-32 md:h-32 flex items-center justify-center">
                {piece && !(dragState?.trayIndex === i) && (
                    <div 
                      onPointerDown={(e) => handlePointerDown(e, piece, i)}
                      className="grid cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                      style={{
                          gridTemplateColumns: `repeat(${piece.shape[0].length}, 20px)`,
                          gridTemplateRows: `repeat(${piece.shape.length}, 20px)`,
                          gap: '1px'
                      }}
                    >
                      {piece.shape.map((row, r) => 
                          row.map((val, c) => (
                            <div 
                                key={`${r}-${c}`}
                                className={`w-5 h-5 rounded-[2px] ${val ? `${piece.colorClass} border-[1px] border-black/30 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.4)]` : 'bg-transparent'}`}
                            />
                          ))
                      )}
                    </div>
                )}
              </div>
          ))}
        </div>
      </div>
      </div>

      {isStarting && room?.startAt && (
          <MatchCountdown startAt={room.startAt} onFinished={() => setIsStarting(false)} />
      )}

      {/* DRAGGING OVERLAY */}
      {dragState && dragState.isDragging && (
         <div 
            className="fixed pointer-events-none z-[100]"
            style={{
               left: dragState.x,
               top: dragState.y - 80,
               transform: 'translate(-50%, -50%)', // Center horizontally over touch
            }}
         >
            <div 
               className="grid"
               style={{
                  gridTemplateColumns: `repeat(${dragState.piece.shape[0].length}, ${getCellSize()}px)`,
                  gridTemplateRows: `repeat(${dragState.piece.shape.length}, ${getCellSize()}px)`,
                  gap: '2px'
               }}
            >
               {dragState.piece.shape.map((row, r) => 
                  row.map((val, c) => (
                     <div 
                        key={`${r}-${c}`}
                        className={`w-full h-full rounded-sm ${val ? `${dragState.piece.colorClass} border-theme-sm border-black/30 shadow-[2px_2px_0px_rgba(0,0,0,0.5),inset_1px_1px_0px_rgba(255,255,255,0.4)] scale-105` : 'bg-transparent'}`}
                     />
                  ))
               )}
            </div>
         </div>
      )}

      {/* GAME OVER is handled by multiplayer Result Modal */}
    </div>
  );
};
