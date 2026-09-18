import React from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, BarChart2, Star, Target, Zap, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import { useProfile } from '../core/profile/ProfileContext';
import { DynamicIcon } from '../components/theme/DynamicIcon';


const StatCard = ({ title, value, icon: Icon, colorClass }: { title: string, value: string, icon: any, colorClass: string }) => (
  <div className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-5 shadow-theme-lg flex flex-col items-center justify-center text-center ${colorClass}`}>
     <div className="w-12 h-12 bg-white/50 border-theme-base border-theme-border-main rounded-xl flex items-center justify-center mb-3">
        <Icon size={24} className="text-theme-text-primary" />
     </div>
     <span className="font-black text-3xl text-theme-text-primary uppercase tracking-tighter mb-1 leading-none">{value}</span>
     <span className="font-bold text-[10px] text-theme-text-secondary uppercase tracking-widest">{title}</span>
  </div>
);

export const StatistikScreen = () => {
  const { navigate } = useGame();
  const { profile } = useProfile();
  
  const stats = profile?.statistics || {};
  const totalPlay = (stats.totalGames || 0).toLocaleString('id-ID');
  
  const formatNumber = (num) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };
  
  const highScore = formatNumber(stats.highestScore || 0);
  const highestLevel = (profile?.highestLevel || 1).toString();
  const maxCombo = 'x' + (stats.highestCombo || 0);
  
  const totalPlaySeconds = Math.floor((stats.totalPlayTimeMs || 0) / 1000);
  const hours = Math.floor(totalPlaySeconds / 3600);
  const minutes = Math.floor((totalPlaySeconds % 3600) / 60);
  const playTimeStr = hours > 0 ? `${hours}j ${minutes}m` : `${minutes}m`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-indigo-50 z-[100] flex flex-col font-sans"
    >
      <div className="flex items-center gap-4 px-5 py-4 z-10 shrink-0 bg-theme-primary-turquoise border-b-theme-base border-theme-border-main shadow-theme-base">
        <button
            onClick={() => navigate('profile')}
            className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
        >
          <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
        </button>
        <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Statistik</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 pt-6 pb-12 grid grid-cols-2 gap-4 content-start">
         <div className="col-span-2 bg-theme-primary-navy border-theme-base border-theme-border-main rounded-[2rem] p-6 shadow-theme-lg flex items-center justify-between text-theme-text-white">
            <div>
               <h3 className="font-black text-xl uppercase tracking-tighter text-indigo-300 mb-1">Total Main</h3>
               <span className="font-black text-4xl">{totalPlay}</span>
            </div>
            <BarChart2 size={48} className="text-theme-text-secondary opacity-50" />
         </div>
         <StatCard title="Skor Tertinggi" value={highScore} icon={Star} colorClass="bg-theme-primary-sunny-yellow" />
         <StatCard title="Level Tertinggi" value={highestLevel} icon={Target} colorClass="bg-theme-bg-soft-pink" />
         <StatCard title="Max Combo" value={maxCombo} icon={Zap} colorClass="bg-theme-primary-warm-orange" />
         <StatCard title="Waktu Main" value={playTimeStr} icon={Clock} colorClass="bg-theme-primary-turquoise" />
      </div>
    </motion.div>
  );
};
