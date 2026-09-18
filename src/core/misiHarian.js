import { MISSION_REWARDS } from './economy';
import { WEEKLY_MISSIONS_POOL, generateWeeklyMissions, getWeekNumber } from './misiMingguan';

const withReward = (m) => ({ ...m, rewardType: 'permen', rewardAmount: MISSION_REWARDS.daily[m.difficulty] || 300 });

export const DAILY_MISSIONS_POOL = [
    // Progress - Clear
    { id: "d_clear_easy", type: "clear", category: "progress", title: "Pemanasan", desc: "Selesaikan 2 level.", target: 2, difficulty: "Mudah" },
    { id: "d_clear_med", type: "clear", category: "progress", title: "Makin Jago", desc: "Selesaikan 4 level.", target: 4, difficulty: "Menengah" },
    { id: "d_clear_hard", type: "clear", category: "progress", title: "Hebat Banget Sayang", desc: "Selesaikan 7 level.", target: 7, difficulty: "Sulit" },
    
    // Progress - Match
    { id: "d_match_easy", type: "match", category: "progress", title: "Mulai Fokus", desc: "Hancurkan 40 pasang blok.", target: 40, difficulty: "Mudah" },
    { id: "d_match_med", type: "match", category: "progress", title: "Rajin Bersihin Papan", desc: "Hancurkan 80 pasang blok.", target: 80, difficulty: "Menengah" },
    { id: "d_match_hard", type: "match", category: "progress", title: "Nggak Ada yang Sisa", desc: "Hancurkan 150 pasang blok.", target: 150, difficulty: "Sulit" },

    // Progress - Score
    { id: "d_score_easy", type: "score", category: "progress", title: "Dikit-dikit Lama-lama Bukit", desc: "Kumpulkan 3.000 skor.", target: 3000, difficulty: "Mudah" },
    { id: "d_score_med", type: "score", category: "progress", title: "Poinnya Banyak", desc: "Kumpulkan 8.000 skor.", target: 8000, difficulty: "Menengah" },
    { id: "d_score_hard", type: "score", category: "progress", title: "Jago Kumpulin Poin", desc: "Kumpulkan 15.000 skor.", target: 15000, difficulty: "Sulit" },

    // Skill - Combo
    { id: "d_combo_easy", type: "combo", category: "skill", title: "Kombo Santai", desc: "Capai Combo x4.", target: 4, difficulty: "Mudah" },
    { id: "d_combo_med", type: "combo", category: "skill", title: "Makin Lincah", desc: "Capai Combo x7.", target: 7, difficulty: "Menengah" },
    { id: "d_combo_hard", type: "combo", category: "skill", title: "Nggak Ada Matinya", desc: "Capai Combo x12.", target: 12, difficulty: "Sulit" },

    // Skill - Flawless
    { id: "d_flawless_easy", type: "flawless", category: "skill", title: "Pelan Tapi Pasti", desc: "Selesaikan 1 level tanpa salah (Flawless).", target: 1, difficulty: "Mudah" },
    { id: "d_flawless_med", type: "flawless", category: "skill", title: "Fokus Banget", desc: "Selesaikan 2 level tanpa salah (Flawless).", target: 2, difficulty: "Menengah" },
    { id: "d_flawless_hard", type: "flawless", category: "skill", title: "Sempurna!", desc: "Selesaikan 4 level tanpa salah (Flawless).", target: 4, difficulty: "Sulit" },

    // Speed - Survivor
    { id: "d_survivor_easy", type: "survivor", category: "speed", title: "Santai Aja", desc: "Selesaikan 1 level dengan sisa waktu > 50%.", target: 1, difficulty: "Mudah" },
    { id: "d_survivor_med", type: "survivor", category: "speed", title: "Tenang", desc: "Selesaikan 2 level dengan sisa waktu > 50%.", target: 2, difficulty: "Menengah" },
    { id: "d_survivor_hard", type: "survivor", category: "speed", title: "Sisa Waktu Banyak", desc: "Selesaikan 4 level dengan sisa waktu > 50%.", target: 4, difficulty: "Sulit" },

    // Speed - Fast Clear
    { id: "d_fastclear_easy", type: "fast_clear", category: "speed", title: "Sat Set", desc: "Selesaikan 1 level di bawah 45 detik.", target: 1, difficulty: "Mudah" },
    { id: "d_fastclear_med", type: "fast_clear", category: "speed", title: "Cepet Juga", desc: "Selesaikan 2 level di bawah 45 detik.", target: 2, difficulty: "Menengah" },
    { id: "d_fastclear_hard", type: "fast_clear", category: "speed", title: "Kenceng Banget", desc: "Selesaikan 4 level di bawah 45 detik.", target: 4, difficulty: "Sulit" },

    // Economy - Chest
    { id: "d_chest_easy", type: "openChest", category: "economy", title: "Pembuka Peti", desc: "Buka 1 Peti.", target: 1, difficulty: "Mudah" },
    { id: "d_chest_med", type: "openChest", category: "economy", title: "Kolektor Peti", desc: "Buka 2 Peti.", target: 2, difficulty: "Menengah" },
    { id: "d_chest_hard", type: "openChest", category: "economy", title: "Pecinta Harta Karun", desc: "Buka 4 Peti.", target: 4, difficulty: "Sulit" },

    // Feature (Wildcard) - Hint, Shuffle
    { id: "d_hint_easy", type: "useHint", category: "feature", title: "Boleh Pake Bantuan Kok", desc: "Gunakan Hint 1 kali.", target: 1, difficulty: "Mudah" },
    { id: "d_shuffle_easy", type: "useShuffle", category: "feature", title: "Acak-acak Dulu", desc: "Gunakan Shuffle 1 kali.", target: 1, difficulty: "Mudah" },
].map(withReward);

const seededRng = (seedStr) => {
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
        hash = Math.imul(31, hash) + seedStr.charCodeAt(i) | 0;
    }
    return () => {
        hash = Math.imul(hash ^ (hash >>> 15), 1 | hash);
        hash ^= hash + Math.imul(hash ^ (hash >>> 7), 61 | hash);
        return ((hash ^ (hash >>> 14)) >>> 0) / 4294967296;
    };
};


// Engine-independent Fisher-Yates shuffle (Array.sort with a random comparator differs between JS engines).
const shuffleDeterministic = (arr, rng) => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
};

export const generateDailyMissions = function(profile) {
    const highestLevel = profile?.highestLevel || 1;
    let playerDiff = "Mudah";
    if (highestLevel >= 15) playerDiff = "Sulit";
    else if (highestLevel >= 5) playerDiff = "Menengah";

    const rng = seededRng(new Date().toDateString());

    const slots = [
        ['progress'], // Slot 1: clear, match, score
        ['skill'],    // Slot 2: combo, flawless
        ['speed'],    // Slot 3: survivor, fast_clear
        ['economy'],  // Slot 4: openChest
        ['progress', 'skill', 'speed', 'feature'] // Slot 5: Wildcard (anything)
    ];

    const selected = [];
    const usedTypes = new Set();
    
    const diffRanks = { "Mudah": 1, "Menengah": 2, "Sulit": 3 };
    const playerDiffRank = diffRanks[playerDiff];

    const bestMissionsByType = {};
    for (const m of DAILY_MISSIONS_POOL) {
        if (diffRanks[m.difficulty] <= playerDiffRank) {
            if (!bestMissionsByType[m.type] || diffRanks[m.difficulty] > diffRanks[bestMissionsByType[m.type].difficulty]) {
                bestMissionsByType[m.type] = m;
            }
        }
    }
    const validMissions = Object.values(bestMissionsByType);

    for (const slotCategories of slots) {
        let candidates = validMissions.filter(m => slotCategories.includes(m.category) && !usedTypes.has(m.type));
        candidates = shuffleDeterministic(candidates, rng);
        
        if (candidates.length > 0) {
            let picked = candidates[0];
            selected.push(picked);
            usedTypes.add(picked.type);
        } else {
            let fallbacks = shuffleDeterministic(validMissions.filter(m => !usedTypes.has(m.type)), rng);
            if(fallbacks.length > 0) {
                let picked = fallbacks[0];
                selected.push(picked);
                usedTypes.add(picked.type);
            }
        }
    }
    
    return selected;
};

const EVENT_TO_TYPE = {
    winLevel: 'clear',
    flawless: 'flawless',
    survivor: 'survivor',
    fast_clear: 'fast_clear',
    match: 'match',
    score: 'score',
    combo: 'combo',
    openChest: 'openChest',
    useHint: 'useHint',
    useShuffle: 'useShuffle',
    dailyClaimed: 'complete_daily',
    dailyAllClaimed: 'complete_daily_all',
};

// "Peak" missions keep the best single value instead of accumulating.
const PEAK_TYPES = new Set(['combo']);

const pushNotification = (p, title, message, type) => {
    if (!p.notifications) p.notifications = [];
    const isDuplicate = p.notifications.some(
        (n) => n.title === title && n.message === message && (Date.now() - n.timestamp < 10000)
    );
    if (isDuplicate) return;
    p.notifications = [{
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        title, message, type,
        timestamp: Date.now(),
        read: false
    }, ...p.notifications].slice(0, 50);
};

const applyEvent = (missions, type, amount) => {
    let changed = false;
    const next = missions.map(m => {
        if (m.type !== type || m.claimed) return m;
        changed = true;
        const progress = PEAK_TYPES.has(type)
            ? Math.min(Math.max(m.progress || 0, amount), m.target)
            : Math.min((m.progress || 0) + amount, m.target);
        return { ...m, progress };
    });
    return changed ? next : missions;
};

// Ensures both daily (activeMissions) and weekly (activeWeeklyMissions) sets exist & are current.
export const checkDailyMissions = (profile) => {
    let p = { ...profile };
    const today = new Date().toDateString();
    if (!p.activeMissions || p.activeMissions.length === 0 || p.dailyMissionsDate !== today) {
        p.activeMissions = generateDailyMissions(p).map(m => ({ ...m, progress: 0, claimed: false }));
        p.dailyMissionsDate = today;
        p.dailyBonusClaimed = false;
    }
    const week = getWeekNumber(new Date());
    if (!p.activeWeeklyMissions || p.activeWeeklyMissions.length === 0 || p.weeklyMissionsWeek !== week) {
        p.activeWeeklyMissions = generateWeeklyMissions(p).map(m => ({ ...m, progress: 0, claimed: false }));
        p.weeklyMissionsWeek = week;
    }
    return p;
};

export const updateMissions = (profile, eventType, amount = 1) => {
    let p = checkDailyMissions(profile);
    const type = EVENT_TO_TYPE[eventType];
    if (!type) return p;

    const beforeDaily = p.activeMissions;
    const beforeWeekly = p.activeWeeklyMissions;
    p.activeMissions = applyEvent(p.activeMissions, type, amount);
    p.activeWeeklyMissions = applyEvent(p.activeWeeklyMissions, type, amount);

    const notifyCompleted = (before, after, label) => {
        after.forEach((m, idx) => {
            const prev = before[idx];
            if (prev && (prev.progress || 0) < prev.target && m.progress >= m.target && !m.claimed) {
                pushNotification(p, `${label} Selesai`, `Misi '${m.title}' telah selesai. Klaim hadiahmu!`, 'mission');
            }
        });
    };
    if (beforeDaily !== p.activeMissions) notifyCompleted(beforeDaily, p.activeMissions, 'Misi Harian');
    if (beforeWeekly !== p.activeWeeklyMissions) notifyCompleted(beforeWeekly, p.activeWeeklyMissions, 'Misi Mingguan');

    return p;
};

// Called after a daily mission reward is claimed: feeds weekly meta-missions + stats.
export const onDailyMissionClaimed = (profile) => {
    let p = { ...profile };
    if (!p.statistics) p.statistics = {};
    p.statistics = { ...p.statistics, totalDailyMissionsCompleted: (p.statistics.totalDailyMissionsCompleted || 0) + 1 };
    p = updateMissions(p, 'dailyClaimed', 1);
    const allClaimed = (p.activeMissions || []).length > 0 && p.activeMissions.every(m => m.claimed);
    if (allClaimed && !p.dailyBonusClaimed) {
        p.dailyBonusClaimed = true;
        p = updateMissions(p, 'dailyAllClaimed', 1);
    }
    return p;
};

// Finds a mission (daily or weekly) by id. Returns { list, index, mission } or null.
export const findMission = (profile, missionId) => {
    const daily = profile.activeMissions || [];
    const weekly = profile.activeWeeklyMissions || [];
    let idx = daily.findIndex(m => m.id === missionId);
    if (idx >= 0) return { list: 'activeMissions', index: idx, mission: daily[idx], scope: 'daily' };
    idx = weekly.findIndex(m => m.id === missionId);
    if (idx >= 0) return { list: 'activeWeeklyMissions', index: idx, mission: weekly[idx], scope: 'weekly' };
    return null;
};

// Pure claim logic shared by client (optimistic) and server (authoritative).
// Returns { profile, permenDelta, error }.
export const claimMissionReward = (profile, missionId) => {
    let p = { ...profile };
    const found = findMission(p, missionId);
    if (!found) return { profile: p, permenDelta: 0, error: 'MISSION_NOT_FOUND' };
    const { list, index, mission, scope } = found;
    if ((mission.progress || 0) < mission.target) return { profile: p, permenDelta: 0, error: 'MISSION_NOT_COMPLETE' };
    if (mission.claimed) return { profile: p, permenDelta: 0, error: 'MISSION_ALREADY_CLAIMED' };

    const missions = [...p[list]];
    missions[index] = { ...mission, claimed: true };
    p[list] = missions;

    let permenDelta = 0;
    if (mission.rewardType === 'permen' || mission.rewardType === 'coins') {
        permenDelta = mission.rewardAmount || 0;
    } else if (mission.rewardType === 'hints') {
        p.hints = (p.hints || 0) + (mission.rewardAmount || 0);
    }

    if (scope === 'daily') p = onDailyMissionClaimed(p);
    return { profile: p, permenDelta, error: null };
};

export { WEEKLY_MISSIONS_POOL };
