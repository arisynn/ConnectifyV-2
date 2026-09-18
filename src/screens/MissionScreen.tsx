import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, Target, CalendarDays, Check, Clock, Candy, Gift, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicIcon } from '../components/theme/DynamicIcon';
import { useProfile } from '../core/profile/ProfileContext';
import { useCDE } from '../core/cde';
import { useAudio } from '../core/audio/AudioEngine';
import { KineticButton, ProgressBar, CurrencyPill } from '../designs/KineticComponents';
import { KineticBadge } from '../designs/KineticPopups';
import { checkDailyMissions } from '../core/misiHarian';

const DIFF_COLOR: Record<string, string> = {
  'Mudah': 'bg-theme-primary-tropical-green',
  'Menengah': 'bg-theme-primary-sunny-yellow',
  'Sulit': 'bg-theme-primary-warm-orange',
  'Sangat Sulit': 'bg-theme-game-danger',
};

const pad = (n: number) => String(n).padStart(2, '0');

const msUntilMidnight = (now: number) => {
  const d = new Date(now);
  d.setHours(24, 0, 0, 0);
  return d.getTime() - now;
};

const msUntilNextMonday = (now: number) => {
  const d = new Date(now);
  const day = d.getDay() || 7; // 1..7 (Mon..Sun)
  d.setHours(24, 0, 0, 0);
  d.setDate(d.getDate() + (7 - day));
  return d.getTime() - now;
};

const formatCountdown = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return days > 0 ? `${days}h ${pad(h)}:${pad(m)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
};

const MissionCard = ({ mission, onClaim, isPersisted, index }: { mission: any, onClaim: () => void, isPersisted: boolean, index: number }) => {
  const progress = Math.min(mission.progress || 0, mission.target);
  const pct = Math.round((progress / mission.target) * 100);
  const isComplete = progress >= mission.target;
  const claimed = !!mission.claimed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: 'spring', damping: 20 }}
      data-testid={`mission-card-${mission.id}`}
      className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-4 shadow-theme-base flex flex-col gap-3 relative overflow-hidden shrink-0 ${claimed ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <KineticBadge text={mission.difficulty} colorClass={DIFF_COLOR[mission.difficulty] || 'bg-theme-primary-sunny-yellow'} />
          </div>
          <h3 className="font-black text-theme-text-primary text-[15px] uppercase tracking-wider leading-tight">{mission.title}</h3>
          <p className="font-bold text-[11px] text-theme-text-muted leading-tight mt-1">{mission.desc}</p>
        </div>
        <div className="shrink-0 bg-theme-bg-soft-pink border-theme-sm border-theme-border-main rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-theme-sm">
          <span className="font-black text-sm text-theme-text-primary">+{mission.rewardAmount}</span>
          <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-5 h-5 object-contain" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar progress={pct} label={`${progress.toLocaleString('id-ID')} / ${mission.target.toLocaleString('id-ID')}`} />
        </div>
        {claimed ? (
          <div className="w-24 py-2 rounded-xl bg-theme-surface-card-soft border-theme-sm border-theme-border-main flex items-center justify-center gap-1 font-black text-[11px] uppercase text-theme-text-muted">
            <Check size={14} strokeWidth={3} /> Selesai
          </div>
        ) : (
          <KineticButton
            onClick={onClaim}
            disabled={!isComplete || !isPersisted}
            colorClass="bg-theme-primary-tropical-green"
            className="w-24 py-2 text-[11px]"
          >
            <span data-testid={`mission-claim-${mission.id}`}>Klaim</span>
          </KineticButton>
        )}
      </div>
    </motion.div>
  );
};

export const MissionScreen = () => {
  const { navigate } = useGame();
  const { profile } = useProfile();
  const cde = useCDE();
  const audio = useAudio();
  const [tab, setTab] = useState<'harian' | 'mingguan'>('harian');
  const [now, setNow] = useState(Date.now());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Missions live on the server profile; before the first win they are only previewed locally.
  const { daily, weekly, dailyPersisted, weeklyPersisted } = useMemo(() => {
    const generated = checkDailyMissions(profile);
    const dailyPersisted = !!(profile.activeMissions && profile.activeMissions.length > 0 && profile.dailyMissionsDate === new Date().toDateString());
    const weeklyPersisted = !!(profile.activeWeeklyMissions && profile.activeWeeklyMissions.length > 0 && generated.weeklyMissionsWeek === profile.weeklyMissionsWeek);
    return { daily: generated.activeMissions || [], weekly: generated.activeWeeklyMissions || [], dailyPersisted, weeklyPersisted };
  }, [profile]);

  const list = tab === 'harian' ? daily : weekly;
  const persisted = tab === 'harian' ? dailyPersisted : weeklyPersisted;
  const claimableCount = list.filter((m: any) => !m.claimed && (m.progress || 0) >= m.target).length;
  const completedCount = list.filter((m: any) => m.claimed).length;

  const handleClaim = (mission: any) => {
    audio.playSfx('uiReward', () => audio.playUiClick());
    cde.queueMutation('CLAIM_MISSION_REWARD', { missionId: mission.id });
    setToast(`+${mission.rewardAmount} Permen dari '${mission.title}'`);
    setTimeout(() => setToast(null), 2200);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-purple-50 z-[100] flex flex-col font-sans"
      data-testid="mission-screen"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 z-10 shrink-0 bg-theme-primary-coral-pink border-b-theme-base border-theme-border-main shadow-theme-base">
        <div className="flex items-center gap-4">
          <button
              data-testid="mission-back-button"
              onClick={() => navigate('home')}
              className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
          >
            <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
          </button>
          <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Misi</h2>
        </div>
        <CurrencyPill type="candy" value={cde.permen} />
      </div>

      {/* Tabs */}
      <div className="px-5 pt-5 shrink-0">
        <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-2xl p-1.5 flex gap-1.5 shadow-theme-sm">
          {([
            { id: 'harian', label: 'Harian', icon: Target, count: daily.filter((m: any) => !m.claimed && (m.progress || 0) >= m.target).length },
            { id: 'mingguan', label: 'Mingguan', icon: CalendarDays, count: weekly.filter((m: any) => !m.claimed && (m.progress || 0) >= m.target).length },
          ] as const).map(t => (
            <button
              key={t.id}
              data-testid={`mission-tab-${t.id}`}
              onClick={() => { audio.playUiClick(); setTab(t.id); }}
              className={`flex-1 py-2.5 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-theme-sm ${tab === t.id ? 'bg-theme-currency-candy-purple border-theme-border-main text-theme-text-primary shadow-theme-sm' : 'border-transparent text-theme-text-muted'}`}
            >
              <t.icon size={16} strokeWidth={3} /> {t.label}
              {t.count > 0 && <span className="w-5 h-5 rounded-full bg-theme-notification text-white text-[10px] flex items-center justify-center border-theme-sm border-theme-border-main">{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="px-5 pt-4 shrink-0">
        <div className="bg-theme-primary-navy border-theme-base border-theme-border-main rounded-[1.5rem] px-5 py-3 shadow-theme-base flex items-center justify-between text-theme-text-white">
          <div>
            <span className="font-black text-[10px] uppercase tracking-widest text-indigo-300 block">Progres {tab === 'harian' ? 'Hari Ini' : 'Minggu Ini'}</span>
            <span className="font-black text-2xl leading-none" data-testid="mission-summary-count">{completedCount}/{list.length}</span>
            <span className="font-bold text-xs ml-2 text-indigo-200">selesai</span>
          </div>
          <div className="text-right">
            <span className="font-black text-[10px] uppercase tracking-widest text-indigo-300 flex items-center justify-end gap-1"><Clock size={12} /> Reset dalam</span>
            <span className="font-black text-lg leading-none tabular-nums" data-testid="mission-reset-timer">
              {formatCountdown(tab === 'harian' ? msUntilMidnight(now) : msUntilNextMonday(now))}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 pb-10">
        {!persisted && (
          <div className="bg-theme-surface-card-white/80 border-theme-sm border-dashed border-theme-border-main rounded-xl px-4 py-2.5 flex items-center gap-2 text-theme-text-muted shrink-0">
            <Lock size={14} />
            <span className="font-bold text-[11px]">Mainkan 1 level untuk mengaktifkan progres misi {tab === 'harian' ? 'harian' : 'mingguan'}.</span>
          </div>
        )}
        {list.map((m: any, i: number) => (
          <MissionCard key={m.id} index={i} mission={m} isPersisted={persisted} onClaim={() => handleClaim(m)} />
        ))}
        {claimableCount === 0 && completedCount === list.length && list.length > 0 && (
          <div className="flex flex-col items-center py-6 text-theme-text-muted shrink-0">
            <Gift size={40} className="mb-2 text-theme-primary-coral-pink" />
            <p className="font-black text-sm uppercase tracking-wider">Semua misi selesai!</p>
            <p className="font-bold text-xs">Kembali lagi setelah reset.</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-8 left-0 right-0 flex justify-center z-[120] pointer-events-none px-4"
          >
            <div data-testid="mission-toast" className="bg-theme-primary-navy text-theme-text-white font-bold text-sm px-6 py-3 rounded-full shadow-theme-base border-theme-sm border-theme-border-main text-center">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
