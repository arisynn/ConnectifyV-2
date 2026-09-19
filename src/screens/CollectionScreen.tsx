import React, { useMemo, useState } from 'react';
import { useGame } from '../GameContext';
import { ArrowLeft, Package, Palette, Box, Trophy, Check, Lock, Search, RefreshCw, Hammer, Bomb, Sparkles, UserRound } from 'lucide-react';
import { motion } from 'motion/react';
import { DynamicIcon } from '../components/theme/DynamicIcon';
import { useProfile } from '../core/profile/ProfileContext';
import { useTheme } from '../core/theme/ThemeProvider';
import { useAudio } from '../core/audio/AudioEngine';
import { KineticButton, ProgressBar } from '../designs/KineticComponents';
import { ACHIEVEMENTS_DATA, getCurrentTier } from '../core/achievements';
import { CHEST_TYPES } from '../core/chest';
import { CosmeticsPanel } from './CosmeticsPanel';

const ALL_AVATARS = ['avatar_male', 'avatar_female'];

const SectionTitle = ({ icon: Icon, title, count, colorClass }: { icon: any, title: string, count: string, colorClass: string }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <div className={`w-9 h-9 ${colorClass} border-theme-sm border-theme-border-main rounded-xl flex items-center justify-center shadow-theme-sm`}>
        <Icon size={18} className="text-theme-text-primary" strokeWidth={2.5} />
      </div>
      <h3 className="font-black text-lg text-theme-text-primary uppercase tracking-tighter">{title}</h3>
    </div>
    <span className="font-black text-xs text-theme-text-muted bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full px-3 py-1">{count}</span>
  </div>
);

export const CollectionScreen = () => {
  const { navigate } = useGame();
  const { profile, updateProfile } = useProfile();
  const { activeTheme, setTheme, availableThemes } = useTheme();
  const audio = useAudio();
  const [section, setSection] = useState<'avatar' | 'tema' | 'lencana' | 'item' | 'kosmetik'>('avatar');

  const themes = Object.values(availableThemes);
  const unlockedThemes: string[] = profile?.unlockedThemes || ['sweets'];
  const ownedAvatars: string[] = (profile?.avatarCollection || []).filter((a: string) => ALL_AVATARS.includes(a));
  const avatarsOwned = ownedAvatars.length > 0 ? ownedAvatars : ALL_AVATARS;

  const badges = useMemo(() => ACHIEVEMENTS_DATA.map(a => {
    const tier = getCurrentTier(profile, a.id);
    return { id: a.id, title: a.title, category: a.category, tier, total: a.tiers.length };
  }), [profile]);
  const badgesEarned = badges.filter(b => b.tier > 0).length;

  const items = [
    { id: 'hint', label: 'Hint', count: profile?.hints ?? 0, icon: Search, iconName: 'hint', colorClass: 'bg-blue-200' },
    { id: 'shuffle', label: 'Shuffle', count: profile?.shuffles ?? 0, icon: RefreshCw, iconName: 'shuffle', colorClass: 'bg-orange-200' },
    { id: 'hammer', label: 'Hammer', count: profile?.hammers ?? 0, icon: Hammer, colorClass: 'bg-amber-200' },
    { id: 'bomb', label: 'Bomb', count: profile?.bombs ?? 0, icon: Bomb, colorClass: 'bg-red-200' },
  ];

  const totalUnlocked = avatarsOwned.length + unlockedThemes.length + badgesEarned;
  const totalPossible = ALL_AVATARS.length + themes.length + ACHIEVEMENTS_DATA.length;

  const handleEquipTheme = (id: string) => {
    audio.playUiClick();
    setTheme(id);
    updateProfile({ activeTheme: id });
  };

  const handleEquipAvatar = (id: string) => {
    audio.playUiClick();
    updateProfile({ activeAvatarId: id, avatar: id });
  };

  const tabs = [
    { id: 'avatar', label: 'Avatar', icon: UserRound },
    { id: 'tema', label: 'Tema', icon: Palette },
    { id: 'lencana', label: 'Lencana', icon: Trophy },
    { id: 'item', label: 'Item', icon: Package },
  ] as const;

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="absolute inset-0 bg-theme-bg-main bg-[image:var(--asset-bg-global)] bg-cover bg-center z-[110] flex flex-col font-sans"
      data-testid="collection-screen"
    >
      <div className="flex items-center gap-4 px-5 py-4 shrink-0 bg-theme-surface-card-white border-b-theme-base border-theme-border-main shadow-theme-base z-10">
        <button
          data-testid="collection-back-button"
          onClick={() => navigate('home')}
          className="p-3 bg-theme-bg-main border-theme-base border-theme-border-main rounded-[1.5rem] shadow-theme-base active:translate-y-1 active:translate-x-0.5 active:shadow-[var(--geometry-shadow-active)] transition-all"
        >
          <DynamicIcon name="back" type="logo" LucideFallback={ArrowLeft} className="w-6 h-6 object-contain text-theme-text-primary" />
        </button>
        <h2 className="text-2xl font-black text-theme-text-primary uppercase tracking-tighter leading-none">Collection</h2>
      </div>

      {/* Overview */}
      <div className="px-5 pt-5 shrink-0">
        <div className="bg-theme-primary-sky-blue border-theme-base border-theme-border-main rounded-[1.5rem] p-4 shadow-theme-base flex items-center gap-4">
          <div className="w-14 h-14 bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-2xl flex items-center justify-center shrink-0 shadow-theme-sm">
            <DynamicIcon name="collection" type="logo" LucideFallback={Package} className="w-[75%] h-[75%] object-contain text-theme-text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-end mb-1.5">
              <span className="font-black text-[10px] uppercase tracking-widest text-theme-text-secondary">Koleksi Terbuka</span>
              <span className="font-black text-lg text-theme-text-primary leading-none" data-testid="collection-summary">{totalUnlocked}/{totalPossible}</span>
            </div>
            <ProgressBar progress={(totalUnlocked / totalPossible) * 100} label="" />
          </div>
        </div>
      </div>

      {/* Section tabs */}
      <div className="px-5 pt-4 shrink-0">
        <div className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-2xl p-1.5 grid grid-cols-4 gap-1 shadow-theme-sm">
          {tabs.map(t => (
            <button
              key={t.id}
              data-testid={`collection-tab-${t.id}`}
              onClick={() => { audio.playUiClick(); setSection(t.id); }}
              className={`py-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex flex-col items-center gap-0.5 transition-all border-theme-sm ${section === t.id ? 'bg-theme-primary-sky-blue border-theme-border-main text-theme-text-primary shadow-theme-sm' : 'border-transparent text-theme-text-muted'}`}
            >
              <t.icon size={16} strokeWidth={3} /> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 pb-10">
        <button data-testid="collection-cosmetics" onClick={()=>setSection(section==='kosmetik'?'avatar':'kosmetik')} className="game-action w-full mb-5 bg-theme-primary-sunny-yellow">Kosmetik saya · avatar, bingkai, tile & blok</button>
        {section==='kosmetik' && <CosmeticsPanel ownedOnly/>}
        {section === 'avatar' && (
          <div>
            <SectionTitle icon={UserRound} title="Avatar" count={`${avatarsOwned.length}/${ALL_AVATARS.length}`} colorClass="bg-theme-primary-sunny-yellow" />
            <div className="grid grid-cols-2 gap-4">
              {ALL_AVATARS.map(av => {
                const owned = avatarsOwned.includes(av);
                const active = (profile?.activeAvatarId || profile?.avatar || 'avatar_male') === av;
                return (
                  <div key={av} data-testid={`collection-avatar-${av}`} className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-4 shadow-theme-base flex flex-col items-center ${!owned ? 'opacity-60' : ''}`}>
                    <div className="w-full aspect-square rounded-full border-theme-base border-theme-border-main overflow-hidden mb-3 flex items-center justify-center relative" style={{ backgroundColor: profile?.activeAvatarBackground || '#bde0fe' }}>
                      <DynamicIcon name={av} type="logo" className="w-[85%] h-[85%] object-contain" />
                      {!owned && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Lock size={28} className="text-white" /></div>}
                    </div>
                    <p className="font-black text-theme-text-primary uppercase tracking-tighter mb-2">{av.replace('avatar_', '')}</p>
                    {active ? (
                      <div className="w-full py-2 rounded-xl bg-theme-surface-card-soft border-theme-sm border-theme-border-main flex items-center justify-center gap-1 font-black text-[11px] uppercase text-theme-text-muted"><Check size={14} strokeWidth={3} /> Dipakai</div>
                    ) : (
                      <KineticButton onClick={() => handleEquipAvatar(av)} disabled={!owned} colorClass="bg-theme-primary-coral-pink" className="w-full py-2 text-[11px]">Pakai</KineticButton>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {section === 'tema' && (
          <div>
            <SectionTitle icon={Palette} title="Tema" count={`${unlockedThemes.length}/${themes.length}`} colorClass="bg-theme-currency-candy-purple" />
            <div className="grid grid-cols-2 gap-4">
              {themes.map(theme => {
                const unlocked = unlockedThemes.includes(theme.id);
                const equipped = activeTheme.id === theme.id;
                return (
                  <div key={theme.id} data-testid={`collection-theme-${theme.id}`} className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[2rem] p-4 shadow-theme-base ${!unlocked ? 'opacity-70' : ''}`}>
                    <div className="w-full h-20 border-theme-base border-theme-border-main rounded-2xl mb-3 flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${theme.colors.bg || theme.colors['bg-main']}, ${theme.colors.primary || theme.colors['primary-coral-pink']})` }}>
                      {!unlocked && <Lock size={28} className="text-gray-900/50" />}
                      {equipped && <div className="absolute top-2 right-2 bg-theme-surface-card-white border-theme-sm border-theme-border-main rounded-full p-1"><Check size={14} className="text-theme-primary-tropical-green" strokeWidth={4} /></div>}
                    </div>
                    <h4 className="font-black text-theme-text-primary text-sm uppercase tracking-wider text-center mb-2">{theme.name}</h4>
                    {equipped ? (
                      <div className="w-full py-2 rounded-xl bg-theme-surface-card-soft border-theme-sm border-theme-border-main flex items-center justify-center gap-1 font-black text-[11px] uppercase text-theme-text-muted"><Check size={14} strokeWidth={3} /> Dipakai</div>
                    ) : unlocked ? (
                      <KineticButton onClick={() => handleEquipTheme(theme.id)} colorClass="bg-theme-primary-coral-pink" className="w-full py-2 text-[11px]">Pakai</KineticButton>
                    ) : (
                      <KineticButton onClick={() => navigate('toko')} colorClass="bg-theme-currency-candy-purple" className="w-full py-2 text-[11px]">Beli di Toko</KineticButton>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {section === 'lencana' && (
          <div>
            <SectionTitle icon={Trophy} title="Lencana" count={`${badgesEarned}/${badges.length}`} colorClass="bg-theme-primary-warm-orange" />
            <div className="grid grid-cols-3 gap-3">
              {badges.map(b => {
                const earned = b.tier > 0;
                const maxed = b.tier >= b.total;
                return (
                  <div key={b.id} data-testid={`collection-badge-${b.id}`} className={`bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-3 shadow-theme-sm flex flex-col items-center text-center ${!earned ? 'opacity-50' : ''}`}>
                    <div className={`w-12 h-12 rounded-full border-theme-sm border-theme-border-main flex items-center justify-center mb-2 relative ${maxed ? 'bg-theme-primary-sunny-yellow' : earned ? 'bg-theme-primary-warm-orange' : 'bg-theme-surface-card-soft'}`}>
                      {earned ? <Trophy size={22} className="text-theme-text-primary" /> : <Lock size={18} className="text-theme-text-muted" />}
                      {maxed && <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-600" />}
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-tight text-theme-text-primary leading-tight line-clamp-2">{b.title}</span>
                    <span className="font-bold text-[9px] text-theme-text-muted mt-1">Tier {b.tier}/{b.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {section === 'item' && (
          <div className="flex flex-col gap-6">
            <div>
              <SectionTitle icon={Package} title="Inventaris" count={`${items.reduce((a, i) => a + i.count, 0)} item`} colorClass="bg-theme-primary-tropical-green" />
              <div className="grid grid-cols-2 gap-3">
                {items.map(it => (
                  <div key={it.id} data-testid={`collection-item-${it.id}`} className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-4 shadow-theme-base flex items-center gap-3">
                    <div className={`w-12 h-12 ${it.colorClass} border-theme-sm border-theme-border-main rounded-xl flex items-center justify-center shrink-0`}>
                      {it.iconName ? <DynamicIcon name={it.iconName} type="logo" LucideFallback={it.icon} className="w-8 h-8 object-contain" /> : <it.icon size={24} className="text-theme-text-primary" />}
                    </div>
                    <div>
                      <span className="font-black text-2xl text-theme-text-primary leading-none block">{it.count}</span>
                      <span className="font-black text-[10px] uppercase tracking-widest text-theme-text-muted">{it.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <SectionTitle icon={Box} title="Peti" count={`${profile?.statistics?.totalChestsOpened || 0} dibuka`} colorClass="bg-theme-primary-warm-orange" />
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(CHEST_TYPES) as [string, { name: string, durationMs: number }][]).map(([id, cfg]) => (
                  <div key={id} className="bg-theme-surface-card-white border-theme-base border-theme-border-main rounded-[1.5rem] p-3 shadow-theme-sm flex flex-col items-center text-center">
                    <DynamicIcon name={`chest_${id}`} type="logo" LucideFallback={Box} className="w-12 h-12 object-contain mb-1" />
                    <span className="font-black text-[10px] uppercase tracking-tight text-theme-text-primary leading-tight">{cfg.name}</span>
                    <span className="font-bold text-[9px] text-theme-text-muted mt-0.5">{Math.round(cfg.durationMs / 3600000) >= 1 ? `${Math.round(cfg.durationMs / 3600000)} jam` : `${Math.round(cfg.durationMs / 60000)} mnt`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
