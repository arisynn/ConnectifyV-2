export const ACHIEVEMENTS_DATA = [
    {
        id: 'total_score',
        category: 'progression',
        title: 'Pengumpul Skor',
        desc: (target) => `Kumpulkan total ${target.toLocaleString('id-ID')} Score.`,
        tiers: [
            { target: 10000, reward: { permen: 200 } },
            { target: 100000, reward: { permen: 500 } },
            { target: 1000000, reward: { permen: 1000 } }
        ],
        getProgress: (p) => p.statistics?.totalScore || 0
    },
    {
        id: 'high_score',
        category: 'mastery',
        title: 'Pencetak Rekor',
        desc: (target) => `Raih ${target.toLocaleString('id-ID')} Score dalam satu level.`,
        tiers: [
            { target: 2500, reward: { permen: 200 } },
            { target: 5000, reward: { permen: 500 } },
            { target: 10000, reward: { permen: 1000 } }
        ],
        getProgress: (p) => p.statistics?.highestScore || 0
    },
    {
        id: 'levels_cleared',
        category: 'progression',
        title: 'Penjelajah Dunia',
        desc: (target) => `Selesaikan ${target} level.`,
        tiers: [
            { target: 10, reward: { permen: 200 } },
            { target: 50, reward: { permen: 500 } },
            { target: 200, reward: { permen: 1000 } },
            { target: 500, reward: { permen: 2500 } },
            { target: 1000, reward: { permen: 5000, theme: 'mythic' } }
        ],
        getProgress: (p) => Math.max(0, (p.highestLevel || 1) - 1) + Math.max(0, (p.highestBlockPuzzleLevel || 1) - 1)
    },
    {
        id: 'daily_missions',
        category: 'progression',
        title: 'Semangat Terus',
        desc: (target) => `Selesaikan ${target} Misi Harian.`,
        tiers: [
            { target: 50, reward: { permen: 200 } },
            { target: 200, reward: { permen: 500 } },
            { target: 500, reward: { permen: 1000 } },
            { target: 1500, reward: { permen: 2500 } },
            { target: 3000, reward: { permen: 5000, theme: 'neon' } }
        ],
        getProgress: (p) => p.statistics?.totalDailyMissionsCompleted || 0
    },
    {
        id: 'loyalty',
        category: 'progression',
        title: 'Pelanggan Setia',
        desc: (target) => `Login selama ${target} hari.`,
        tiers: [
            { target: 3, reward: { permen: 200 } },
            { target: 7, reward: { permen: 500 } },
            { target: 30, reward: { permen: 1000 } },
            { target: 100, reward: { permen: 2500 } },
            { target: 365, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.totalLoginDays || 0
    },
    {
        id: 'blocks_cleared',
        category: 'progression',
        title: 'Rajin Banget Bersihinnya',
        desc: (target) => `Hancurkan total ${target} blok.`,
        tiers: [
            { target: 5000, reward: { permen: 200 } },
            { target: 20000, reward: { permen: 500 } },
            { target: 50000, reward: { permen: 1000 } },
            { target: 150000, reward: { permen: 2500 } },
            { target: 500000, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.totalBlocksCleared || 0
    },
    {
        id: 'flawless_victory',
        category: 'mastery',
        title: 'Mainnya Sempurna',
        desc: (target) => `Selesaikan ${target} level tanpa melakukan kesalahan (Flawless).`,
        tiers: [
            { target: 5, reward: { permen: 200 } },
            { target: 25, reward: { permen: 500 } },
            { target: 100, reward: { permen: 1000 } },
            { target: 250, reward: { permen: 2500 } },
            { target: 500, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.totalFlawless || 0
    },
    {
        id: 'highest_combo',
        category: 'mastery',
        title: 'Kombo Mantap',
        desc: (target) => `Capai Combo x${target}.`,
        tiers: [
            { target: 10, reward: { permen: 200 } },
            { target: 20, reward: { permen: 500 } },
            { target: 35, reward: { permen: 1000 } },
            { target: 50, reward: { permen: 2500 } },
            { target: 80, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.highestCombo || 0
    },
    {
        id: 'speedrun',
        category: 'mastery',
        title: 'Cepat Banget Mainnya',
        desc: (target) => `Selesaikan ${target} level di bawah 45 detik.`,
        tiers: [
            { target: 10, reward: { permen: 200 } },
            { target: 50, reward: { permen: 500 } },
            { target: 150, reward: { permen: 1000 } },
            { target: 300, reward: { permen: 2500 } },
            { target: 600, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.speedrunLevels || 0
    },
    {
        id: 'survivor',
        category: 'mastery',
        title: 'Master Bertahan',
        desc: (target) => `Selesaikan ${target} level dengan sisa Bar Waktu lebih dari 50%.`,
        tiers: [
            { target: 5, reward: { permen: 200 } },
            { target: 15, reward: { permen: 500 } },
            { target: 30, reward: { permen: 1000 } },
            { target: 60, reward: { permen: 2500 } },
            { target: 100, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.survivorLevels || 0
    },
    {
        id: 'theme_purchases',
        category: 'collection',
        title: 'Suka Ganti Tema Ya',
        desc: (target) => `Buka dan kumpulkan ${target} Tema.`,
        tiers: [
            { target: 3, reward: { permen: 200 } },
            { target: 8, reward: { permen: 500 } },
            { target: 15, reward: { permen: 1000 } },
            { target: 25, reward: { permen: 2500 } },
            { target: 40, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.totalThemesBought || 0
    },
    {
        id: 'chests_opened',
        category: 'collection',
        title: 'Kolektor Peti',
        desc: (target) => `Buka ${target} Peti.`,
        tiers: [
            { target: 10, reward: { permen: 200 } },
            { target: 50, reward: { permen: 500 } },
            { target: 150, reward: { permen: 1000 } },
            { target: 500, reward: { permen: 2500 } },
            { target: 2000, reward: { permen: 5000 } }
        ],
        getProgress: (p) => p.statistics?.totalChestsOpened || 0
    },
    {
        id: 'overthinker',
        category: 'secret',
        title: 'Lagi Bingung Ya?',
        desc: (target) => `Gunakan Shuffle saat tidak ada pasangan yang bisa dimatch sebanyak ${target} kali.`,
        tiers: [
            { target: 10, reward: { permen: 200 } }
        ],
        getProgress: (p) => p.statistics?.shuffleOnNoMoves || 0
    },
    {
        id: 'near_death',
        category: 'secret',
        title: 'Deg-degan Ya?',
        desc: (target) => `Selesaikan level saat sisa waktu kurang dari 1 detik.`,
        tiers: [
            { target: 1, reward: { permen: 200 } }
        ],
        getProgress: (p) => p.statistics?.nearDeathEscapes || 0
    }
];

export const getCurrentTier = (profile, achId) => {
    return profile.achievements?.[achId] || 0;
};

export const getClaimableAchievements = (profile) => {
    const claimable = [];
    ACHIEVEMENTS_DATA.forEach(a => {
        const tierIdx = getCurrentTier(profile, a.id);
        if (tierIdx < a.tiers.length) {
            const tier = a.tiers[tierIdx];
            let isCompleted = a.getProgress(profile) >= tier.target;
            if (isCompleted) claimable.push({ ...a, tierIdx, tier });
        }
    });
    return claimable;
};

export const applyAchievementReward = (profile, achievementItem) => {
    const { id, tierIdx, tier } = achievementItem;
    const newProfile = { ...profile, achievements: { ...(profile.achievements||{}), [id]: tierIdx + 1 } };
    if (!newProfile.statistics) newProfile.statistics = {};
    const permenReward = tier.reward.permen || tier.reward.coins || 0;
    if (permenReward) newProfile.permen = (newProfile.permen || 0) + permenReward;
    if (tier.reward.hammers) newProfile.hammers = Math.min(99, (newProfile.hammers || 0) + tier.reward.hammers);
    if (tier.reward.bombs) newProfile.bombs = Math.min(99, (newProfile.bombs || 0) + tier.reward.bombs);
    if (tier.reward.hints) newProfile.hints = Math.min(99, (newProfile.hints || 0) + tier.reward.hints);
    if (tier.reward.shuffles) newProfile.shuffles = Math.min(99, (newProfile.shuffles || 0) + tier.reward.shuffles);
    if (tier.reward.theme && !newProfile.unlockedThemes?.includes(tier.reward.theme)) {
        newProfile.unlockedThemes = [...(newProfile.unlockedThemes || []), tier.reward.theme];
        newProfile.newThemes = [...(newProfile.newThemes || []), tier.reward.theme];
    }
    return newProfile;
};

// Server-side safety: achievements map only stores claimed tier counts, nothing to recompute,
// but we normalise the structure so claims can never target a skipped tier.
export const checkAchievements = (profile) => {
    const p = { ...profile, achievements: { ...(profile.achievements || {}) } };
    ACHIEVEMENTS_DATA.forEach(a => {
        const t = p.achievements[a.id];
        if (typeof t !== 'number' || t < 0) p.achievements[a.id] = 0;
        if (t > a.tiers.length) p.achievements[a.id] = a.tiers.length;
    });
    return p;
};

// Pure, validated claim used by both client (optimistic) and server (authoritative).
// Returns { profile, permenDelta, error, tier }.
export const claimAchievement = (profile, achievementId) => {
    const p = checkAchievements(profile);
    const ach = ACHIEVEMENTS_DATA.find(a => a.id === achievementId);
    if (!ach) return { profile: p, permenDelta: 0, error: 'ACHIEVEMENT_NOT_FOUND' };
    const tierIdx = getCurrentTier(p, ach.id);
    if (tierIdx >= ach.tiers.length) return { profile: p, permenDelta: 0, error: 'ACHIEVEMENT_MAXED' };
    const tier = ach.tiers[tierIdx];
    if (ach.getProgress(p) < tier.target) return { profile: p, permenDelta: 0, error: 'ACHIEVEMENT_NOT_COMPLETE' };
    const before = p.permen || 0;
    const next = applyAchievementReward(p, { id: ach.id, tierIdx, tier });
    const permenDelta = (next.permen || 0) - before;
    delete next.permen;
    delete next.coins;
    return { profile: next, permenDelta, error: null, tier, tierIdx };
};

export const getAchievementRewardSummary = (tier) => {
    const parts = [];
    const permen = tier.reward.permen || tier.reward.coins;
    if (permen) parts.push({ type: 'permen', amount: permen });
    if (tier.reward.hints) parts.push({ type: 'hints', amount: tier.reward.hints });
    if (tier.reward.shuffles) parts.push({ type: 'shuffles', amount: tier.reward.shuffles });
    if (tier.reward.hammers) parts.push({ type: 'hammers', amount: tier.reward.hammers });
    if (tier.reward.bombs) parts.push({ type: 'bombs', amount: tier.reward.bombs });
    if (tier.reward.theme) parts.push({ type: 'theme', amount: 1, theme: tier.reward.theme });
    return parts;
};
