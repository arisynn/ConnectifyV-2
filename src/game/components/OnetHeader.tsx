import React from 'react';

interface OnetHeaderProps {
  level: number;
  score: number;
  time: number;
  onPause: () => void;
}

export const OnetHeader: React.FC<OnetHeaderProps> = ({ level, score, time, onPause }) => {
  return (
    <div className="w-full max-w-md flex flex-col items-center z-10 pt-2 px-3 sm:px-4">
      <header className="w-full flex items-center justify-between gap-1.5 pb-2">
        <button 
           onClick={onPause}
           className="bg-theme-surface-card-white p-2.5 flex items-center justify-center hover:bg-gray-50 border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] active:translate-y-[2px] active:translate-x-[2px] active:shadow-[var(--geometry-shadow-active)] transition-all flex-shrink-0"
        >
          <svg className="w-5 h-5 text-theme-text-primary" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16"/>
            <rect x="14" y="4" width="4" height="16"/>
          </svg>
        </button>

        <div className="bg-theme-surface-card-white px-3 py-1 flex-1 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px]">
          <div className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">LEVEL</div>
          <div className="text-lg sm:text-xl font-black text-theme-text-primary leading-none">{level}</div>
        </div>

        <div className="bg-theme-surface-card-white px-3 py-1 flex-1 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px]">
          <div className="text-[9px] sm:text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SKOR</div>
          <div className="text-lg sm:text-xl font-black text-theme-text-primary leading-none">{score}</div>
        </div>

        <div className={`px-3 py-1 flex-1 text-center border-theme-sm border-theme-border-main shadow-theme-base rounded-[4px] transition-colors duration-300 ${time <= 10 ? 'bg-rose-300 shadow-[inset_0_0_40px_rgba(239,68,68,0.6)] animate-pulse' : 'bg-sky-200'}`}>
          <div className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider ${time <= 10 ? 'text-slate-800' : 'text-slate-600'}`}>WAKTU</div>
          <div className="text-lg sm:text-xl font-black text-theme-text-primary leading-none">{time}s</div>
        </div>
      </header>

      <div className="border-b-theme-base border-theme-border-main w-full"></div>
    </div>
  );
};
