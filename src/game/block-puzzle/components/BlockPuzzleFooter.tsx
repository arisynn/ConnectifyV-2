import React,{useId} from 'react';
import { Hammer, Bomb } from 'lucide-react';
import { DynamicIcon } from '../../../components/theme/DynamicIcon';

interface BlockPuzzleFooterProps {
  shuffles?: number;
  hints?: number;
  bombs?: number;
  activePowerup?: 'hammer' | 'bomb' | null;
  onShuffle?: () => void;
  onHint?: () => void;
  onBomb?: () => void;
}

export const BlockPuzzleFooter: React.FC<BlockPuzzleFooterProps> = ({ shuffles = 0, hints = 0, bombs = 0, activePowerup, onShuffle, onHint, onBomb }) => {
  const id=useId().replace(/[^a-zA-Z0-9]/g,'').toLowerCase();
  return (
    <div className="w-full max-w-md flex flex-col items-center z-10 pb-2 px-3 sm:px-4 mt-auto">
      <div className="border-t-theme-base border-theme-border-main w-full mb-2"></div>
      <footer className="w-full flex items-center justify-between gap-2 md:grid md:grid-cols-1 md:gap-3">
        <button 
          data-testid={`block-powerup-shuffle-${id}`} aria-label={`Tukar balok, ${shuffles} tersedia`}
          onClick={onShuffle} 
          className="bg-indigo-200 flex-1 py-2.5 px-3 flex items-center justify-between hover:bg-indigo-300 border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all opacity-80"
        >
          <div className="flex items-center gap-1.5">
            <DynamicIcon 
              name="shuffle" 
              type="logo" 
              className="w-5 h-5" 
              LucideFallback={() => (
                <svg className="w-4 h-4 text-theme-text-primary" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M4 9a9 9 0 0115.3-4.3L20 5M20 15a9 9 0 01-15.3 4.3L4 19"/>
                </svg>
              )} 
            />
            <span className="font-black text-xs sm:text-sm tracking-wide text-theme-text-primary hidden sm:inline">TUKAR</span>
          </div>
          <span className="bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-sm px-2 py-0.5 text-xs font-black">{shuffles}</span>
        </button>
        <button 
          data-testid={`block-powerup-hammer-${id}`} aria-label={`Palu, ${hints} tersedia`}
          onClick={onHint} 
          className={`flex-1 py-2.5 px-3 flex items-center justify-between border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all ${activePowerup === 'hammer' ? 'bg-amber-400 opacity-100 ring-2 ring-amber-500 scale-105' : 'bg-amber-200 hover:bg-amber-300 opacity-80'}`}
        >
          <div className="flex items-center gap-1.5">
            <DynamicIcon 
              name="hammer" 
              type="logo" 
              className="w-5 h-5" 
              LucideFallback={() => <Hammer className="w-4 h-4 text-theme-text-primary" strokeWidth={3} />}
            />
            <span className="font-black text-xs sm:text-sm tracking-wide text-theme-text-primary hidden sm:inline">HANCUR</span>
          </div>
          <span className="bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-sm px-2 py-0.5 text-xs font-black">{hints}</span>
        </button>
        <button 
          data-testid={`block-powerup-bomb-${id}`} aria-label={`Bom, ${bombs} tersedia`}
          onClick={onBomb} 
          className={`flex-1 py-2.5 px-3 flex items-center justify-between border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all ${activePowerup === 'bomb' ? 'bg-red-400 opacity-100 ring-2 ring-red-500 scale-105' : 'bg-red-200 hover:bg-red-300 opacity-80'}`}
        >
          <div className="flex items-center gap-1.5">
            <DynamicIcon 
              name="bomb" 
              type="logo" 
              className="w-5 h-5" 
              LucideFallback={() => <Bomb className="w-4 h-4 text-theme-text-primary" strokeWidth={3} />}
            />
            <span className="font-black text-xs sm:text-sm tracking-wide text-theme-text-primary hidden sm:inline">BOM</span>
          </div>
          <span className="bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-sm px-2 py-0.5 text-xs font-black">{bombs}</span>
        </button>
      </footer>
    </div>
  );
};
