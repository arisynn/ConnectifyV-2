import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGame } from '../../GameContext';
import { useBlockPuzzle } from './hooks/useBlockPuzzle';
import { usePowerups } from './hooks/usePowerups';
import { KineticButton } from '../../designs/KineticComponents';
import { KineticModal } from '../../designs/KineticPopups';
import { ArrowLeft, RefreshCw, Trophy, Play, Star } from 'lucide-react';
import { Piece } from './core/pieces';
import { DynamicIcon } from '../../components/theme/DynamicIcon';
import { GameLoader } from '../../components/GameLoader';

import { BlockPuzzleHeader } from './components/BlockPuzzleHeader';
import { BlockPuzzleFooter } from './components/BlockPuzzleFooter';

const ObstacleOverlay = ({ type }: { type: string }) => {
  if (!type) return null;
  if (type === 'ice') return <div className="absolute inset-0 bg-cyan-200/50 backdrop-blur-[1px] border-2 border-cyan-300 pointer-events-none rounded-sm z-10" style={{boxShadow: 'inset 0 0 8px rgba(255,255,255,0.8)'}}></div>;
  if (type === 'wood') return <div className="absolute inset-0 bg-amber-700/90 border-2 border-amber-900 flex items-center justify-center rounded-sm pointer-events-none z-10 overflow-hidden"><div className="w-[150%] h-[3px] bg-amber-900/40 absolute rotate-45"></div><div className="w-[150%] h-[3px] bg-amber-900/40 absolute -rotate-45"></div></div>;
  if (type === 'metal-2') return <div className="absolute inset-0 bg-slate-500 border-[3px] border-slate-700 rounded-sm pointer-events-none flex items-center justify-center z-10 shadow-inner"><div className="w-2 h-2 rounded-full bg-slate-400"></div></div>;
  if (type === 'metal-1') return <div className="absolute inset-0 bg-slate-400 border-[3px] border-slate-500 border-dashed rounded-sm pointer-events-none flex items-center justify-center z-10 shadow-inner"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div></div>;
  if (type === 'stone') return <div className="absolute inset-0 bg-stone-700 border-[4px] border-stone-900 rounded-sm pointer-events-none z-10" style={{backgroundImage: 'radial-gradient(circle, #555 10%, transparent 11%)', backgroundSize: '8px 8px'}}></div>;
  if (type === 'gem') return <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 drop-shadow-md"><div className="w-3/5 h-3/5 rotate-45 bg-fuchsia-400 border-[2px] border-fuchsia-600 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.5)]"></div></div>;
  return null;
}

export const BlockPuzzleScreen = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!isLoaded) {
    return <GameLoader onComplete={() => setIsLoaded(true)} />;
  }

  return <BlockPuzzleContent />;
};

const BlockPuzzleContent = () => {
  const { navigate } = useGame();
  const [isPaused, setIsPaused] = useState(false);
  const {
    board,
    obstacles,
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
    useBombAt,
    clearingCells,
    comboText,
    isAnimating,
    BOARD_SIZE,
    targetScore,
    currentLevel,
    currentLevelConfig,
    missionResults,
    moves,
    winReward
  } = useBlockPuzzle();

  const powerups = usePowerups();

  const handleShuffle = () => {
    if (gameState === 'playing' || gameState === 'gameover') {
      if (powerups.requestShuffle()) {
        shuffleTray();
      }
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (powerups.activePowerup === 'hammer') {
      if (board[r][c] !== '') {
        const success = useHammerAt(r, c);
        if (success) {
          powerups.consumeHammer();
        }
      }
    } else if (powerups.activePowerup === 'bomb') {
      const success = useBombAt(r, c);
      if (success) {
        powerups.consumeBomb();
      }
    }
  };

  const boardRef = useRef<HTMLDivElement>(null);
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
    if (gameState !== 'playing') return;
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

  return (
    <div className="absolute inset-0 bg-gray-900 z-50 flex flex-col md:p-6 lg:p-10 items-center overflow-hidden font-sans touch-none select-none">
      <div className="w-full h-full md:max-w-6xl md:mx-auto md:bg-[#f8fafc] md:rounded-[2rem] md:shadow-2xl md:border-4 md:border-white/30 flex flex-col md:flex-row items-center overflow-hidden">
        
        {/* Mobile Header */}
        <div className="w-full md:hidden flex justify-center bg-[#f8fafc]">
          <BlockPuzzleHeader 
            score={score} 
            currentLevel={currentLevel}
            moves={moves}
            missions={currentLevelConfig.missions}
            missionResults={missionResults}
            onPause={() => setIsPaused(true)}
          />
        </div>

        {/* Center Board Area */}
        <div className="flex-1 w-full flex flex-col items-center justify-center relative md:border-r-4 md:border-white/20 bg-[#f8fafc] md:bg-white/10 md:backdrop-blur-sm pt-4 md:pt-0">
          
          {/* BOARD */}
          <div className="flex-1 w-full max-w-md md:max-w-2xl flex flex-col items-center justify-center p-4">
            <div 
              ref={boardRef}
              className={`w-full max-w-[350px] md:max-w-[450px] aspect-square bg-theme-surface-card-soft border-theme-lg border-theme-border-main rounded-xl shadow-theme-lg grid relative transition-all ${powerups.activePowerup === 'hammer' ? 'ring-4 ring-amber-400 opacity-90' : ''}`}
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
                          onClick={() => handleCellClick(r, c)}
                          className={`relative w-full h-full rounded-sm transition-colors duration-150 border-theme-sm 
                              ${clearingCells.some(cell => cell.r === r && cell.c === c) ? 'bg-white brightness-150 scale-105 border-white shadow-[0_0_10px_rgba(255,255,255,0.8)] z-10' :
                                cellColor !== '' ? `${cellColor} border-black/20 shadow-[inset_1px_1px_0px_rgba(255,255,255,0.4)]` : 
                                isPreview ? `${previewColor} opacity-50 border-black/20` : 
                                'bg-gray-300/50 border-transparent'
                              }
                              ${(powerups.activePowerup === 'hammer' && cellColor !== '') || powerups.activePowerup === 'bomb' ? 'cursor-crosshair hover:brightness-110 hover:scale-95 transition-transform' : ''}
                          `}
                        >
                          <ObstacleOverlay type={obstacles[r][c]} />
                        </div>
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
          <div className={`w-full max-w-md h-40 flex items-center justify-around px-4 pb-8 transition-opacity ${powerups.activePowerup === 'hammer' ? 'opacity-30 pointer-events-none' : ''}`}>
            {tray.map((piece, i) => (
                <div key={i} className="w-24 h-24 flex items-center justify-center">
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

        {/* Mobile Footer */}
        <div className="w-full md:hidden flex justify-center mt-auto bg-[#f8fafc]">
          <BlockPuzzleFooter 
            shuffles={powerups.shuffles} 
            hints={powerups.hammers}
            bombs={powerups.bombs}
            activePowerup={powerups.activePowerup}
            onShuffle={handleShuffle} 
            onHint={powerups.toggleHammer} 
            onBomb={powerups.toggleBomb}
          />
        </div>

        {/* Desktop Sidebar Panel */}
        <div className="hidden md:flex flex-col w-96 h-full bg-white/40 backdrop-blur-md p-8 z-20 shrink-0 border-l-4 border-white/40 overflow-y-auto">
          <BlockPuzzleHeader 
            score={score} 
            currentLevel={currentLevel}
            moves={moves}
            missions={currentLevelConfig.missions}
            missionResults={missionResults}
            onPause={() => setIsPaused(true)}
          />
          <div className="mt-auto pt-8">
            <BlockPuzzleFooter 
              shuffles={powerups.shuffles} 
              hints={powerups.hammers}
              bombs={powerups.bombs}
              activePowerup={powerups.activePowerup}
              onShuffle={handleShuffle} 
              onHint={powerups.toggleHammer} 
              onBomb={powerups.toggleBomb}
            />
          </div>
        </div>
      </div>

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

      {/* PAUSE MODAL */}
      <KineticModal isOpen={isPaused} onClose={() => setIsPaused(false)} colorClass="bg-theme-surface-card-white" widthClass="w-full max-w-xs" className="text-center">
        <h2 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mb-8">PAUSED</h2>
        <div className="flex flex-col gap-3">
          <KineticButton onClick={() => setIsPaused(false)} colorClass="bg-green-400" className="w-full py-3 flex items-center justify-center gap-2">
             <Play size={24} className="fill-gray-900" /> Lanjutkan
          </KineticButton>
          <KineticButton onClick={() => navigate('levels')} colorClass="bg-theme-surface-card-white" className="w-full py-3 text-red-500 shadow-theme-sm">Kembali</KineticButton>
        </div>
      </KineticModal>

      {/* GAME OVER MODAL */}
      <KineticModal isOpen={gameState === 'gameover'} colorClass="bg-gray-900" widthClass="w-full max-w-sm" className="text-center pt-10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-rose-500 border-theme-lg border-white rounded-full flex items-center justify-center shadow-theme-base z-10">
           <RefreshCw size={48} className="text-white" />
        </div>
        <h2 className="font-black text-3xl text-white uppercase tracking-tighter mt-4 mb-2">Penuh!</h2>
        <p className="font-bold text-gray-400 text-sm mb-6">Level Gagal</p>
        
        <div className="flex flex-col gap-2 mb-8 text-left bg-gray-800 p-4 rounded-xl border-theme-sm border-gray-700">
           {currentLevelConfig.missions.map((m: any, i: number) => (
             <div key={i} className="flex items-center gap-3">
               <Star size={20} className="fill-gray-600 text-gray-500 flex-shrink-0" />
               <span className="text-sm font-bold text-gray-500">{m.description}</span>
             </div>
           ))}
        </div>
        
        <div className="flex gap-3">
           <KineticButton onClick={() => navigate('levels')} colorClass="bg-theme-surface-card-white" className="flex-1 py-3 text-sm">Kembali</KineticButton>
           <KineticButton onClick={initGame} colorClass="bg-theme-primary-coral-pink" className="flex-1 py-3 text-sm border-white">Main Lagi</KineticButton>
        </div>
      </KineticModal>

      {/* LEVEL WON MODAL */}
      <KineticModal isOpen={gameState === 'won'} colorClass="bg-theme-surface-card-white" widthClass="w-full max-w-sm" className="text-center pt-10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-theme-primary-tropical-green border-theme-lg border-white rounded-full flex items-center justify-center shadow-theme-base z-10">
           <Trophy size={48} className="text-white" />
        </div>
        <h2 className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mt-4 mb-2">Level Selesai!</h2>
        
        <div className="flex gap-2 justify-center mb-6 mt-4">
           {[0, 1, 2].map(i => (
              <Star key={i} size={48} className={missionResults[i] ? 'fill-theme-primary-canary-yellow text-amber-600 drop-shadow-md' : 'fill-gray-200 text-gray-300'} />
           ))}
        </div>
        
        <div className="flex flex-col gap-2 mb-4 text-left bg-gray-50 p-4 rounded-xl border-theme-sm border-gray-200">
           {currentLevelConfig.missions.map((m: any, i: number) => (
             <div key={i} className="flex items-center gap-3">
               <Star size={20} className={missionResults[i] ? 'fill-amber-400 text-amber-500 flex-shrink-0' : 'fill-gray-200 text-gray-300 flex-shrink-0'} />
               <span className={`text-sm font-bold ${missionResults[i] ? 'text-theme-text-primary' : 'text-gray-400 line-through'}`}>{m.description}</span>
             </div>
           ))}
        </div>

        <div data-testid="block-win-rewards" className="flex gap-3 mb-8">
           <div className="flex-1 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-xl py-2 flex flex-col items-center shadow-theme-sm">
              <span className="font-black text-lg text-theme-currency-candy-purple">+{winReward?.permen ?? 0}</span>
              <span className="font-black text-[9px] text-theme-text-secondary uppercase tracking-widest mt-0.5">Permen</span>
           </div>
           <div className="flex-1 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-xl py-2 flex flex-col items-center shadow-theme-sm">
              <span className="font-black text-lg text-blue-500">+{winReward?.chestPoints ?? 0}</span>
              <span className="font-black text-[9px] text-theme-text-secondary uppercase tracking-widest mt-0.5">Peti PTS</span>
           </div>
        </div>
        
        <div className="flex gap-3">
           <KineticButton onClick={() => navigate('levels')} colorClass="bg-gray-200" className="flex-1 py-3 text-sm border-gray-300 shadow-none">Kembali</KineticButton>
           <KineticButton onClick={initGame} colorClass="bg-theme-primary-tropical-green" className="flex-1 py-3 text-sm border-white">Lanjut Level Berikutnya</KineticButton>
        </div>
      </KineticModal>

    </div>
  );
};
