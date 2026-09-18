import React from 'react';
import { DynamicIcon } from '../../components/theme/DynamicIcon';

interface OnetFooterProps {
  shuffles: number;
  hints: number;
  onShuffle: () => void;
  onHint: () => void;
}

export const OnetFooter: React.FC<OnetFooterProps> = ({ shuffles, hints, onShuffle, onHint }) => {
  return (
    <div className="w-full max-w-md flex flex-col items-center z-10 pb-2 px-3 sm:px-4 mt-auto">
      <div className="border-t-theme-base border-theme-border-main w-full mb-2"></div>

      <footer className="w-full flex items-center justify-between gap-2">
        <button onClick={onShuffle} className="bg-indigo-200 flex-1 py-2.5 px-3 flex items-center justify-between hover:bg-indigo-300 border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all">
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
            <span className="font-black text-xs sm:text-sm tracking-wide text-theme-text-primary">SHUFFLE</span>
          </div>
          <span className="bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-sm px-2 py-0.5 text-xs font-black">{shuffles}</span>
        </button>

        <button onClick={onHint} className="bg-amber-200 flex-1 py-2.5 px-3 flex items-center justify-between hover:bg-amber-300 border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all">
          <div className="flex items-center gap-1.5">
            <DynamicIcon 
              name="hint" 
              type="logo" 
              className="w-5 h-5" 
              LucideFallback={() => (
                <svg className="w-4 h-4 text-theme-text-primary" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35"/>
                </svg>
              )} 
            />
            <span className="font-black text-xs sm:text-sm tracking-wide text-theme-text-primary">HINT</span>
          </div>
          <span className="bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-sm px-2 py-0.5 text-xs font-black">{hints}</span>
        </button>
      </footer>
    </div>
  );
};
