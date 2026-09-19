import React from 'react';
import { ArrowLeft, Star } from 'lucide-react';

interface BlockPuzzleHeaderProps {
  score: number;
  currentLevel: number;
  moves: number;
  missions: any[];
  missionResults: boolean[];
  onPause: () => void;
  endless?:boolean;
  highScore?:number;
  difficulty?:string;
  idPrefix?:string;
}

export const BlockPuzzleHeader: React.FC<BlockPuzzleHeaderProps> = ({ 
  score, 
  currentLevel, 
  moves,
  missions,
  missionResults,
  onPause, endless=false, highScore=0, difficulty='',idPrefix='block'
}) => {
  return (
    <div className="w-full max-w-md flex flex-col items-center z-10 pt-2 px-3 sm:px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <header className="w-full flex items-center justify-between gap-1.5 pb-2">
        <button 
           data-testid={`${idPrefix}-pause`}
           aria-label="Jeda permainan"
           onClick={onPause}
           className="bg-theme-surface-card-white p-2.5 flex items-center justify-center hover:bg-gray-50 border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all flex-shrink-0"
        >
          <svg className="w-5 h-5 text-theme-text-primary" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        </button>

        <div className="bg-theme-surface-card-white px-3 py-1 flex-[2] text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] flex flex-col items-center">
          <div data-testid={`${idPrefix}-mode-label`} className="text-[9px] sm:text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">{endless?'INFINITY':`LEVEL ${currentLevel}`}</div>
          <div data-testid={`${idPrefix}-current-score`} className="text-lg sm:text-xl font-black text-theme-text-primary leading-none">{score}</div>
        </div>

        <div className="bg-theme-surface-card-white px-3 py-1 flex-1 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px]">
          <div className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{endless?'REKOR':'LANGKAH'}</div>
          <div data-testid={`${idPrefix}-secondary-score`} className="text-lg sm:text-xl font-black text-theme-text-primary leading-none">{endless?Math.max(highScore,score):moves}</div>
        </div>
      </header>

      {/* Missions UI */}
      <div data-testid={`${idPrefix}-mission-list`} className={`w-full flex gap-1 mb-2 mt-1 ${endless?'hidden':''}`}>
         {missions.map((mission, index) => {
            const isCompleted = missionResults[index];
            return (
               <div key={index} className={`flex-1 p-1 rounded-[4px] border-theme-sm border-theme-border-main flex flex-col items-center justify-center shadow-[var(--geometry-shadow-sm)] ${isCompleted ? 'bg-theme-primary-canary-yellow' : 'bg-theme-surface-card-white'}`}>
                  <Star size={14} className={isCompleted ? 'fill-theme-primary-coral-pink text-theme-primary-coral-pink' : 'fill-gray-300 text-gray-400'} />
                  <div className="text-[9px] font-bold text-center leading-tight mt-0.5 text-theme-text-primary line-clamp-2">{mission.description}</div>
               </div>
            );
         })}
      </div>
      <p data-testid={`${idPrefix}-difficulty-note`} className="text-[9px] font-bold text-slate-500 mb-2 text-center">{endless?'Tanpa misi atau waktu. Bertahan sampai tidak ada balok yang muat.':difficulty}</p>

      <div className="border-b-theme-base border-theme-border-main w-full"></div>
    </div>
  );
};
