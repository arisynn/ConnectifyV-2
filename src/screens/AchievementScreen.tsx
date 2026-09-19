import React, { useMemo, useState } from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, Trophy, Candy, Check, Lock, Star, Sparkles, Palette, Hammer, Bomb, Search, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DynamicIcon } from '../components/theme/DynamicIcon';
import { useProfile } from '../core/profile/ProfileContext';
import { useCDE } from '../core/cde';
import { useAudio } from '../core/audio/AudioEngine';
import { KineticButton, ProgressBar, CurrencyPill } from '../designs/KineticComponents';
import { KineticBadge } from '../designs/KineticPopups';
import { ACHIEVEMENTS_DATA, getCurrentTier, getAchievementRewardSummary } from '../core/achievements';

const CATEGORIES = [
  { id: 'all', label: 'Semua' },
  { id: 'progression', label: 'Progres' },
  { id: 'mastery', label: 'Keahlian' },
  { id: 'collection', label: 'Koleksi' },
  { id: 'secret', label: 'Rahasia' },
];

const CATEGORY_COLOR: Record<string, string> = {
  progression: 'bg-theme-primary-sky-blue',
  mastery: 'bg-theme-primary-coral-pink',
  collection: 'bg-theme-primary-sunny-yellow',
  secret: 'bg-theme-currency-candy-purple',
};

const REWARD_ICON: Record<string, any> = { hints: Search, shuffles: RefreshCw, hammers: Hammer, bombs: Bomb, theme: Palette };

const RewardChips = ({ tier }: { tier: any }) => (
  <div className="flex flex-wrap gap-1.5 justify-end">
    {getAchievementRewardSummary(tier).map((r: any, i: number) => {
      const Icon = REWARD_ICON[r.type];
      return (
        <div key={i} className="bg-theme-bg-soft-pink border-theme-sm border-theme-border-main rounded-lg px-2 py-1 flex items-center gap-1 shadow-theme-sm">
          <span className="font-black text-xs text-theme-text-primary">+{r.type === 'theme' ? r.theme : r.amount}</span>
          {r.type === 'permen'
            ? <DynamicIcon name="permen" type="logo" LucideFallback={Candy} className="w-4 h-4 object-contain" />
            : Icon ? <Icon size={12} className="text-theme-text-primary" strokeWidth={3} /> : null}
        </div>
      );
    })}
  </div>
);

const AchievementCard = ({ ach, profile, onClaim, index }: { ach: any, profile: any, onClaim: () => void, index: number }) => {
  const tierIdx = getCurrentTier(profile, ach.id);
  const maxed = tierIdx >= ach.tiers.length;
  const tier = maxed ? ach.tiers[ach.tiers.length - 1] : ach.tiers[tierIdx];
  const progress = ach.getProgress(profile) || 0;
  const pct = maxed ? 100 : Math.min(100, Math.round((progress / tier.target) * 100));
  const claimable = !maxed && progress >= tier.target;
  const isSecret = ach.category === 'secret' && tierIdx === 0 && progress === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', damping: 20 }}
      data-testid={`achievement-card-${ach.id}`}
      className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-4 shadow-theme-base flex flex-col gap-3 relative overflow-hidden shrink-0 ${maxed ? 'opacity-80' : ''} ${claimable ? 'ring-4 ring-theme-primary-tropical-green/60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-14 h-14 ${CATEGORY_COLOR[ach.category] || 'bg-theme-primary-sky-blue'} border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center shrink-0 shadow-[inset_0px_-2px_0px_rgba(0,0,0,0.2)] relative`}>
          {isSecret ? <Lock size={24} className="text-theme-text-primary" /> : <Trophy size={26} className="text-theme-text-primary drop-shadow-[2px_2px_0px_rgba(255,255,255,0.5)]" />}
          {maxed && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-theme-primary-sunny-yellow rounded-full border-theme-sm border-theme-border-main flex items-center justify-center shadow-theme-sm">
              <Sparkles size={12} className="text-theme-text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-theme-text-primary text-[15px] uppercase tracking-wider leading-tight">{isSecret ? '???' : ach.title}</h3>
          <p className="font-bold text-[11px] text-theme-text-muted leading-tight mt-1">
            {isSecret ? 'Pencapaian rahasia. Terus bermain untuk membukanya!' : ach.desc(tier.target)}
          </p>
          <div className="flex items-center gap-1 mt-2">
            {ach.tiers.map((_: any, i: number) => (
              <Star key={i} size={14} className={i < tierIdx ? 'fill-amber-400 text-amber-500' : 'fill-gray-200 text-gray-300'} />
            ))}
            <span className="font-black text-[10px] text-theme-text-muted uppercase ml-1">Tier {Math.min(tierIdx + 1, ach.tiers.length)}/{ach.tiers.length}</span>
          </div>
        </div>
        {!isSecret && <RewardChips tier={tier} />}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar progress={pct} label={maxed ? 'SELESAI' : `${Math.min(progress, tier.target).toLocaleString('id-ID')} / ${tier.target.toLocaleString('id-ID')}`} />
        </div>
        {maxed ? (
          <div className="w-24 py-2 rounded-xl bg-theme-surface-card-soft border-theme-sm border-theme-border-main flex items-center justify-center gap-1 font-black text-[11px] uppercase text-theme-text-muted">
            <Check size={14} strokeWidth={3} /> Maks
          </div>
        ) : (
          <KineticButton onClick={onClaim} disabled={!claimable} colorClass="bg-theme-primary-tropical-green" className="w-24 py-2 text-[11px]">
            <span data-testid={`achievement-claim-${ach.id}`}>Klaim</span>
          </KineticButton>
        )}
      </div>
    </motion.div>
  );
};

export const AchievementScreen = () => {
  const { navigate } = useGame();
  const { profile } = useProfile();
  const cde = useCDE();
  const audio = useAudio();
  const [category, setCategory] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  const stats = useMemo(() => {
    let claimed = 0, total = 0, claimable = 0;
    ACHIEVEMENTS_DATA.forEach(a => {
      const t = getCurrentTier(profile, a.id);
      claimed += t; total += a.tiers.length;
      if (t < a.tiers.length && a.getProgress(profile) >= a.tiers[t].target) claimable++;
    });
    return { claimed, total, claimable };
  }, [profile]);

  const list = useMemo(() => {
    const filtered = category === 'all' ? ACHIEVEMENTS_DATA : ACHIEVEMENTS_DATA.filter(a => a.category === category);
    // claimable first, then in-progress, maxed last
    return [...filtered].sort((a, b) => {
      const rank = (x: any) => {
        const t = getCurrentTier(profile, x.id);
        if (t >= x.tiers.length) return 2;
        return x.getProgress(profile) >= x.tiers[t].target ? 0 : 1;
      };
      return rank(a) - rank(b);
    });
  }, [category, profile]);

  const handleClaim = async (ach: any) => {
    try {
    const tierIdx = getCurrentTier(profile, ach.id);
    const tier = ach.tiers[tierIdx];
    audio.playSfx('uiReward', () => audio.playUiClick());
    await cde.queueMutation('CLAIM_ACHIEVEMENT_REWARD', { achievementId: ach.id, tierIdx, tier });
    const permen = tier.reward.permen || tier.reward.coins || 0;
    setToast(`${ach.title} Tier ${tierIdx + 1} diklaim! +${permen} Permen`);
    setTimeout(() => setToast(null), 2200);
    } catch(e:any) { setToast(e.message==='DAILY_LIMIT'?'Batas harian tercapai. Pencapaianmu tetap tersimpan; klaim setelah 00.00 WIB.':'Hadiah belum dapat diklaim.'); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: '100%' }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-red-50 z-[100] flex flex-col font-sans"
      data-testid="achievement-screen"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 z-10 shrink-0 bg-theme-primary-warm-orange border-b-theme-base border-theme-border-main shadow-theme-base">
        <div className="flex items-center gap-4">
          <button
              data-testid="achievement-back-button"
              onClick={() => navigate('home')}
              className="p-3 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
          >
            <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
          </button>
          <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Pencapaian</h2>
        </div>
        <CurrencyPill type="candy" value={cde.permen} />
      </div>

      {/* Summary */}
      <div className="px-5 pt-5 shrink-0">
        <div className="bg-theme-primary-navy border-theme-base border-theme-border-main rounded-[1.5rem] px-5 py-4 shadow-theme-base flex items-center justify-between text-theme-text-white">
          <div>
            <span className="font-black text-[10px] uppercase tracking-widest text-indigo-300 block">Tier Diraih</span>
            <span className="font-black text-3xl leading-none" data-testid="achievement-summary">{stats.claimed}<span className="text-lg text-indigo-300">/{stats.total}</span></span>
          </div>
          <div className="flex-1 mx-5">
            <ProgressBar progress={stats.total ? (stats.claimed / stats.total) * 100 : 0} label="" />
          </div>
          <div className="w-14 h-14 bg-theme-primary-sunny-yellow border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center relative shadow-theme-sm">
            <DynamicIcon name="achievement" type="logo" LucideFallback={Trophy} className="w-[75%] h-[75%] object-contain text-theme-text-primary" />
            {stats.claimable > 0 && (
              <span data-testid="achievement-claimable-badge" className="absolute -top-2 -right-2 w-6 h-6 bg-theme-notification rounded-full border-theme-sm border-theme-border-main flex items-center justify-center text-[11px] font-black text-white">{stats.claimable}</span>
            )}
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="px-5 pt-4 shrink-0 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 w-max">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              data-testid={`achievement-filter-${c.id}`}
              onClick={() => { audio.playUiClick(); setCategory(c.id); }}
              className={`px-4 h-9 rounded-full border-theme-sm border-theme-border-main font-black text-xs uppercase tracking-wider shrink-0 transition-colors ${category === c.id ? 'bg-theme-primary-coral-pink text-theme-text-primary shadow-theme-sm' : 'bg-theme-surface-card-white text-theme-text-muted'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3 pb-10">
        {list.map((a, i) => (
          <AchievementCard key={a.id} index={i} ach={a} profile={profile} onClaim={() => handleClaim(a)} />
        ))}
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-8 left-0 right-0 flex justify-center z-[120] pointer-events-none px-4"
          >
            <div data-testid="achievement-toast" className="bg-theme-primary-navy text-theme-text-white font-bold text-sm px-6 py-3 rounded-full shadow-theme-base border-theme-sm border-theme-border-main text-center">
              {toast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
