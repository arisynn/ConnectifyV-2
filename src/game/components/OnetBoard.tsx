import React, { RefObject, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ROWS, COLS } from '../../core/config';
import { ThemeCard } from '../../components/theme/ThemeCard';
import { DynamicIcon } from '../../components/theme/DynamicIcon';

interface OnetBoardProps {
  boardRef: RefObject<HTMLDivElement>;
  board: any[][];
  selected: { r: number, c: number } | null;
  activePaths: { id: number, path: { r: number, c: number }[] }[];
  hintTiles: { p1: { r: number, c: number }, p2: { r: number, c: number } } | null;
  directionErrorTiles: { r: number, c: number }[];
  matchingTiles: { r: number, c: number }[];
  floatingTexts: { id: number, text: string, x: number, y: number }[];
  onTileClick: (r: number, c: number) => void;
}


const getStartSide = (dx: number, dy: number) => {
    if (dx > 0) return 'right';
    if (dx < 0) return 'left';
    if (dy > 0) return 'bottom';
    if (dy < 0) return 'top';
    return 'top';
};

const generateRingPath = (size: number, r: number, startSide: string, height = size) => {
    const half = size / 2;
    const top = -height / 2;
    const bottom = height / 2;
    const left = -half;
    const right = half;
    let d = '';
    
    if (startSide === 'top') {
        d += `M 0 ${top} `;
        d += `L ${right - r} ${top} `;
        d += `Q ${right} ${top} ${right} ${top + r} `;
        d += `L ${right} ${bottom - r} `;
        d += `Q ${right} ${bottom} ${right - r} ${bottom} `;
        d += `L ${left + r} ${bottom} `;
        d += `Q ${left} ${bottom} ${left} ${bottom - r} `;
        d += `L ${left} ${top + r} `;
        d += `Q ${left} ${top} ${left + r} ${top} `;
        d += `Z`;
    } else if (startSide === 'right') {
        d += `M ${right} 0 `;
        d += `L ${right} ${bottom - r} `;
        d += `Q ${right} ${bottom} ${right - r} ${bottom} `;
        d += `L ${left + r} ${bottom} `;
        d += `Q ${left} ${bottom} ${left} ${bottom - r} `;
        d += `L ${left} ${top + r} `;
        d += `Q ${left} ${top} ${left + r} ${top} `;
        d += `L ${right - r} ${top} `;
        d += `Q ${right} ${top} ${right} ${top + r} `;
        d += `Z`;
    } else if (startSide === 'bottom') {
        d += `M 0 ${bottom} `;
        d += `L ${left + r} ${bottom} `;
        d += `Q ${left} ${bottom} ${left} ${bottom - r} `;
        d += `L ${left} ${top + r} `;
        d += `Q ${left} ${top} ${left + r} ${top} `;
        d += `L ${right - r} ${top} `;
        d += `Q ${right} ${top} ${right} ${top + r} `;
        d += `L ${right} ${bottom - r} `;
        d += `Q ${right} ${bottom} ${right - r} ${bottom} `;
        d += `Z`;
    } else if (startSide === 'left') {
        d += `M ${left} 0 `;
        d += `L ${left} ${top + r} `;
        d += `Q ${left} ${top} ${left + r} ${top} `;
        d += `L ${right - r} ${top} `;
        d += `Q ${right} ${top} ${right} ${top + r} `;
        d += `L ${right} ${bottom - r} `;
        d += `Q ${right} ${bottom} ${right - r} ${bottom} `;
        d += `L ${left + r} ${bottom} `;
        d += `Q ${left} ${bottom} ${left} ${bottom - r} `;
        d += `Z`;
    } else {
        d += `M 0 ${top} `;
        d += `L ${right - r} ${top} `;
        d += `Q ${right} ${top} ${right} ${top + r} `;
        d += `L ${right} ${bottom - r} `;
        d += `Q ${right} ${bottom} ${right - r} ${bottom} `;
        d += `L ${left + r} ${bottom} `;
        d += `Q ${left} ${bottom} ${left} ${bottom - r} `;
        d += `L ${left} ${top + r} `;
        d += `Q ${left} ${top} ${left + r} ${top} `;
        d += `Z`;
    }
    return d;
};

const generateRoundedPath = (points: {x: number, y: number}[], radius: number) => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y} `;
    
    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];
        
        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const len1 = Math.hypot(dx1, dy1);
        
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;
        const len2 = Math.hypot(dx2, dy2);
        
        const r = Math.min(radius, len1 / 2, len2 / 2);
        
        const p1x = curr.x - (dx1 / len1) * r;
        const p1y = curr.y - (dy1 / len1) * r;
        
        const p2x = curr.x + (dx2 / len2) * r;
        const p2y = curr.y + (dy2 / len2) * r;
        
        d += `L ${p1x} ${p1y} Q ${curr.x} ${curr.y} ${p2x} ${p2y} `;
    }
    
    const last = points[points.length - 1];
    d += `L ${last.x} ${last.y}`;
    return d;
};

export const OnetBoard: React.FC<OnetBoardProps> = ({
  boardRef, board, selected, activePaths, hintTiles, directionErrorTiles, matchingTiles, floatingTexts, onTileClick
}) => {
  const [boardSize, setBoardSize] = useState({ w: 0, h: 0 });
  
  useEffect(() => {
    if (!boardRef.current) return;
    const observer = new ResizeObserver((entries) => {
       for (let entry of entries) {
          setBoardSize({ w: entry.contentRect.width, h: entry.contentRect.height });
       }
    });
    observer.observe(boardRef.current);
    return () => observer.disconnect();
  }, [boardRef]);

  const gap = 5;
  const tileSize = boardSize.w > 0 ? (boardSize.w - (COLS - 1) * gap) / COLS : 0;
  const lineWidth = Math.max(4, Math.min(7, tileSize * 0.10));
  const ringOffset = 2;
  const ringSize = tileSize + 2 * ringOffset;
  const cutDist = ringSize / 2;
  const ringRadius = Math.max(8, 3 + ringOffset);
  const offset = gap + lineWidth / 2 + 5;
  const cornerRadius = Math.max(10, lineWidth * 1.5);

  const getPoint = (r: number, c: number) => {
      let x = 0;
      let y = 0;
      if (c === 0) x = -offset;
      else if (c === COLS + 1) x = boardSize.w + offset;
      else x = (c - 1) * (tileSize + gap) + tileSize / 2;

      if (r === 0) y = -offset;
      else if (r === ROWS + 1) y = boardSize.h + offset;
      else y = (r - 1) * (tileSize + gap) + tileSize / 2;

      return { x, y };
  };

  return (
    <div className="relative w-full max-w-md md:max-w-3xl flex-1 flex items-center justify-center px-6 sm:px-8 py-6 z-10 min-h-0 mx-auto">
       <div 
          ref={boardRef}
          data-testid="onet-board"
          className="w-full grid relative z-0 shrink-0 mx-auto"
          style={{ 
             gap: `${gap}px`,
             gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
             gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
             height: tileSize > 0 ? tileSize * ROWS + (ROWS - 1) * gap : undefined,
             width: 'min(100%, calc((100vh - 180px) * 0.58))'
          }}
       >
          <AnimatePresence>
             {floatingTexts.map(ft => (
                <motion.div
                   key={ft.id}
                   initial={{ opacity: 0, scale: 0.5, y: 5 }}
                   animate={{ opacity: 1, scale: 1, y: -25 }}
                   exit={{ opacity: 0, scale: 0.8, y: -35 }}
                   transition={{ duration: 0.5, ease: "easeOut" }}
                   className="absolute z-50 pointer-events-none flex items-center justify-center"
                   style={{
                      left: `${ft.x}%`,
                      top: `${ft.y}%`,
                      transform: 'translate(-50%, -50%)'
                   }}
                >
                   <span 
                       className="font-black text-sm sm:text-base italic text-sky-400 drop-shadow-[1px_2px_0px_#0f172a]"
                   >
                      {ft.text}
                   </span>
                </motion.div>
             ))}
          </AnimatePresence>

          {/* SVG Path Layer */}
          {activePaths && activePaths.length > 0 && boardSize.w > 0 && (
             <svg 
                className="absolute pointer-events-none z-50 overflow-visible"
                style={{ top: 0, left: 0, width: '100%', height: '100%' }}
             >
                 {activePaths.map(pathObj => {
                    const pts = pathObj.path.map(p => getPoint(p.r, p.c));
                    let drawLine = true;
                    let lineD = '';
                    let startSideA = 'top';
                    let startSideB = 'top';
                    
                    if (pts.length >= 2) {
                        const P0 = pts[0];
                        const P1 = pts[1];
                        const dxA = P1.x - P0.x;
                        const dyA = P1.y - P0.y;
                        startSideA = getStartSide(dxA, dyA);
                        const ux = Math.sign(dxA);
                        const uy = Math.sign(dyA);
                        const P0_new = { x: P0.x + cutDist * ux, y: P0.y + cutDist * uy };
                        
                        const Pn = pts[pts.length - 1];
                        const Pn_prev = pts[pts.length - 2];
                        const dxB = Pn_prev.x - Pn.x;
                        const dyB = Pn_prev.y - Pn.y;
                        startSideB = getStartSide(dxB, dyB);
                        const vx = Math.sign(dxB);
                        const vy = Math.sign(dyB);
                        const Pn_new = { x: Pn.x + cutDist * vx, y: Pn.y + cutDist * vy };
                        
                        if (pts.length === 2) {
                            const dist = Math.hypot(P1.x - P0.x, P1.y - P0.y);
                            if (dist <= 2 * cutDist + 1) { // +1 for floating point safety
                                drawLine = false;
                            }
                        }
                        
                        if (drawLine) {
                            const linePts = [...pts];
                            linePts[0] = P0_new;
                            linePts[linePts.length - 1] = Pn_new;
                            lineD = generateRoundedPath(linePts, cornerRadius);
                        }
                    }
                    
                    const footprint = (p: {r:number,c:number}) => {
                        let tile = board[p.r]?.[p.c];
                        let r=p.r, c=p.c;
                        if (tile?.isSlave) { r=tile.masterR; c=tile.masterC; tile=board[r][c]; }
                        const w=ringSize + (tile?.isSplit && tile.splitOrientation === 'horizontal' ? tileSize+gap : 0);
                        const h=ringSize + (tile?.isSplit && tile.splitOrientation === 'vertical' ? tileSize+gap : 0);
                        const center=getPoint(r,c);
                        return { w,h,x:center.x+(w-ringSize)/2,y:center.y+(h-ringSize)/2 };
                    };
                    const P0 = footprint(pathObj.path[0]);
                    const Pn = footprint(pathObj.path[pathObj.path.length - 1]);
                    const ringA_D = generateRingPath(P0.w, ringRadius, startSideA, P0.h);
                    const ringB_D = generateRingPath(Pn.w, ringRadius, startSideB, Pn.h);

                    return (
                        <g key={pathObj.id}>
                           {/* Ring A */}
                           <motion.g
                               style={{ x: P0.x, y: P0.y }}
                               initial={{ scale: 1, opacity: 1 }}
                               animate={{ scale: [1, 1, 1.08], opacity: [1, 1, 0] }}
                               transition={{ 
                                   scale: { times: [0, 0.655, 1], duration: 0.58, ease: "easeInOut" },
                                   opacity: { times: [0, 0.655, 1], duration: 0.58, ease: "linear" }
                               }}
                           >
                               <motion.path
                                  d={ringA_D}
                                  fill="none"
                                  stroke="rgba(255,255,255,0.85)"
                                  strokeWidth={lineWidth + 4}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 0.1, ease: "linear" }}
                               />
                               <motion.path
                                  d={ringA_D}
                                  fill="none"
                                  stroke="#1E88E5"
                                  strokeWidth={lineWidth}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 0.1, ease: "linear" }}
                               />
                           </motion.g>

                           {/* Ring B */}
                           <motion.g
                               style={{ x: Pn.x, y: Pn.y }}
                               initial={{ scale: 1, opacity: 1 }}
                               animate={{ scale: [1, 1, 1.08], opacity: [1, 1, 0] }}
                               transition={{ 
                                   scale: { times: [0, 0.655, 1], duration: 0.58, ease: "easeInOut" },
                                   opacity: { times: [0, 0.655, 1], duration: 0.58, ease: "linear" }
                               }}
                           >
                               <motion.path
                                  d={ringB_D}
                                  fill="none"
                                  stroke="rgba(255,255,255,0.85)"
                                  strokeWidth={lineWidth + 4}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ delay: 0.28, duration: 0.1, ease: "linear" }}
                               />
                               <motion.path
                                  d={ringB_D}
                                  fill="none"
                                  stroke="#1E88E5"
                                  strokeWidth={lineWidth}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ delay: 0.28, duration: 0.1, ease: "linear" }}
                               />
                           </motion.g>

                           {/* Main Line */}
                           {drawLine && (
                               <motion.g
                                   initial={{ opacity: 1 }}
                                   animate={{ opacity: 0 }}
                                   transition={{ delay: 0.38, duration: 0.2, ease: "linear" }}
                               >
                                  <motion.path 
                                      d={lineD}
                                      fill="none"
                                      stroke="rgba(255,255,255,0.85)"
                                      strokeWidth={lineWidth + 4}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ delay: 0.1, duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                  />
                                  <motion.path 
                                      d={lineD}
                                      fill="none"
                                      stroke="#1E88E5"
                                      strokeWidth={lineWidth}
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      initial={{ pathLength: 0 }}
                                      animate={{ pathLength: 1 }}
                                      transition={{ delay: 0.1, duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                                  />
                               </motion.g>
                           )}
                        </g>
                    );
                 })}
             </svg>
          )}

          {board.map((row, r) => 
             row.map((tile, c) => {
                if (r === 0 || r === ROWS + 1 || c === 0 || c === COLS + 1) return null;
                const isSelected = selected?.r === r && selected?.c === c;
                const isHinted = hintTiles && ((hintTiles.p1.r === r && hintTiles.p1.c === c) || (hintTiles.p2.r === r && hintTiles.p2.c === c));
                const isMatching = matchingTiles.some(t => t.r === r && t.c === c);
                const isError = directionErrorTiles.some(t => t.r === r && t.c === c);

                if (tile === 0) {
                   return <div key={`${r}-${c}`} style={{gridRow:r,gridColumn:c}} />;
                }
                if (tile.isSlave) return null;
                
                const icon = tile.id;
                const openSide = tile.openSide;

                let spanClasses = 'aspect-square';
                let splitScaleClass = 'text-xl sm:text-2xl';
                if (tile.isSplit) {
                   spanClasses = tile.splitOrientation === 'horizontal' ? 'col-span-2 w-full h-full' : 'row-span-2 w-full h-full';
                   splitScaleClass = 'text-3xl sm:text-5xl';
                }

                // Define directional styling
                let directionalStyles = '';
                let sideIndicator = null;
                if (openSide) {
                   directionalStyles = isError ? 'border-theme-sm border-[#b91c1c] rounded-[3px]' : isSelected ? 'border-theme-sm border-[#f59e0b] rounded-[3px]' : 'border-theme-sm border-theme-border-main rounded-[3px]';
                   
                   const gateClasses = `absolute w-full h-full bg-transparent ${isError ? 'border-[#b91c1c] shadow-[0_0_12px_rgba(239,68,68,0.9)]' : 'border-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]'} transition-colors duration-200 z-30`;
                   
                   if (openSide === 'up') {
                      directionalStyles += ' border-t-0 rounded-t-none';
                      sideIndicator = <div className={`${gateClasses} border-t-theme-sm border-x-0 border-b-0 top-0 left-0`} />;
                   } else if (openSide === 'down') {
                      directionalStyles += ' border-b-0 rounded-b-none';
                      sideIndicator = <div className={`${gateClasses} border-b-theme-sm border-x-0 border-t-0 bottom-0 left-0`} />;
                   } else if (openSide === 'left') {
                      directionalStyles += ' border-l-0 rounded-l-none';
                      sideIndicator = <div className={`${gateClasses} border-l-theme-sm border-y-0 border-r-0 top-0 left-0`} />;
                   } else if (openSide === 'right') {
                      directionalStyles += ' border-r-0 rounded-r-none';
                      sideIndicator = <div className={`${gateClasses} border-r-theme-sm border-y-0 border-l-0 top-0 right-0`} />;
                   }
                } else {
                   directionalStyles = isError ? 'border-theme-sm border-[#b91c1c] rounded-[3px]' : isSelected ? 'border-theme-sm border-[#f59e0b] rounded-[3px]' : 'border-theme-sm border-theme-border-main rounded-[3px]';
                }

                return (
                   <motion.button
                      key={`${r}-${c}-${tile.isSplit ? 'shell' : 'single'}-${tile.id}`}
                      data-testid={`onet-tile-${r}-${c}`}
                      data-tile-id={tile.id}
                      data-footprint={tile.isSplit ? tile.splitOrientation === 'horizontal' ? '2x1' : '1x2' : '1x1'}
                      aria-label={`${tile.id}, ${tile.isSplit ? 'tile gabungan dua sel' : 'tile satu sel'}`}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTileClick(r,c); } }}
                      initial={tile.spawned ? {scale:0.35, opacity:0} : false}
                      onPointerDown={(e) => {
                         e.preventDefault();
                         onTileClick(r, c);
                      }}
                      style={{ touchAction: 'none', gridRow: `${r} / span ${tile.isSplit && tile.splitOrientation === 'vertical' ? 2 : 1}`, gridColumn: `${c} / span ${tile.isSplit && tile.splitOrientation === 'horizontal' ? 2 : 1}` }}
                      whileHover={{ y: -2, scale: 1.02 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{ 
                         scale: isMatching ? [1, 1.15, 0] : 1,
                         opacity: isHinted ? [1, 0.6, 1] : isMatching ? [1, 1, 0] : 1,
                         rotate: isMatching ? [0, -5, 5, 0] : 0,
                         y: isMatching ? -8 : 0,
                         x: isError ? [0, -12, 12, -10, 10, -6, 6, 0] : 0
                      }}
                      transition={
                         isMatching ? { delay: 0.38, duration: 0.2, ease: "easeInOut" } :
                         isError ? { duration: 0.4, ease: "linear" } :
                         isHinted ? { repeat: Infinity, duration: 1 } : 
                         { type: 'spring', stiffness: 400, damping: 25 }
                      }
                      className={`w-full ${spanClasses} flex items-center justify-center ${splitScaleClass} select-none relative transition-shadow
                         ${isMatching ? `bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe] ${directionalStyles} shadow-theme-base z-40` :
                           isSelected ? `bg-amber-100 ${directionalStyles} shadow-[0_0_0_2px_#f59e0b,3px_3px_0px_#0f172a] z-10` :
                           isHinted ? `bg-gradient-to-br from-[#bbf7d0] to-[#86efac] ${directionalStyles} shadow-[0_0_12px_#22c55e,3px_3px_0px_#0f172a]` : 
                           isError ? `bg-gradient-to-br from-[#fee2e2] to-[#fca5a5] ${directionalStyles} shadow-[0_0_15px_#ef4444,3px_3px_0px_#0f172a] z-30` :
                           `bg-gradient-to-br from-[#ffffff] to-[#f8fafc] ${directionalStyles} shadow-theme-sm hover:shadow-theme-base`} 
                      `}
                   >
                      {sideIndicator}
                      {tile.isSplit && <span data-testid={`onet-size-${r}-${c}`} className="absolute bottom-0 right-1 z-20 text-[8px] font-black text-slate-600">{tile.splitOrientation === 'horizontal' ? '2×1' : '1×2'}</span>}
                      <div className="relative z-10 w-full h-full flex items-center justify-center p-1">
                         <DynamicIcon name={icon} type="tiles" className="w-[90%] h-[90%] drop-shadow-[2px_2px_0px_rgba(255,255,255,0.4)]" />
                      </div>
                      
                      
                   </motion.button>
                );
             })
          )}
       </div>
    </div>
  );
};
