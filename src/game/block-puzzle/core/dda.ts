import { LevelConfig } from './levelConfig';

export const DDA_CONFIG = {
    SKILL_EMA_ALPHA: 0.3,
    DEFAULT_SKILL: 50,
    BRACKET_THRESHOLDS: {
        EASY_MAX: 40,
        NORMAL_MAX: 70,
    },
    BOARD_FILL_DANGER_THRESHOLD: 0.60,
    POOR_CLEAR_RATE_THRESHOLD: 0.25,
    RIG_CHANCE_MAX: 0.30,
    PITY_FAIL_COUNT: 3
};

export type DDABracket = 'pity' | 'easy' | 'normal' | 'hard';

export const calculateMatchSkill = (win: boolean, stars: number, retries: number, clearRate: number): number => {
    let matchSkill = win ? 50 : 10;
    matchSkill += (stars * 10); 
    matchSkill -= (retries * 5); 
    if (clearRate >= 0.5) matchSkill += 10;
    else if (clearRate <= 0.2) matchSkill -= 10;
    return Math.max(0, Math.min(100, matchSkill));
};

export const updateSkillEMA = (currentSkill: number, matchSkill: number): number => {
    return Math.round((matchSkill * DDA_CONFIG.SKILL_EMA_ALPHA) + (currentSkill * (1 - DDA_CONFIG.SKILL_EMA_ALPHA)));
};

export const getBracket = (skill: number, retryCount: number): DDABracket => {
    if (retryCount >= DDA_CONFIG.PITY_FAIL_COUNT) return 'pity';
    if (skill < DDA_CONFIG.BRACKET_THRESHOLDS.EASY_MAX) return 'easy';
    if (skill < DDA_CONFIG.BRACKET_THRESHOLDS.NORMAL_MAX) return 'normal';
    return 'hard';
};

export const applyDDAToLevel = (config: LevelConfig, bracket: DDABracket): LevelConfig => {
    if (bracket === 'normal') return config;
    
    const newConfig: LevelConfig = JSON.parse(JSON.stringify(config));
    
    const moveMission = newConfig.missions.find(m => m.type === 'max_moves');
    if (moveMission) {
        if (bracket === 'pity') moveMission.target = Math.floor(moveMission.target * 1.5);
        else if (bracket === 'easy') moveMission.target = Math.floor(moveMission.target * 1.25);
        else if (bracket === 'hard') moveMission.target = Math.floor(moveMission.target * 0.85);
    }

    if (bracket === 'pity' || bracket === 'easy') {
        const requiredCounts: Record<string, number> = {};
        newConfig.missions.forEach(m => {
            if (m.type === 'destroy_ice') requiredCounts['ice'] = m.target;
            if (m.type === 'destroy_wood') requiredCounts['wood'] = m.target;
            if (m.type === 'destroy_gems') requiredCounts['gem'] = m.target;
        });

        const currentCounts: Record<string, number> = {};
        newConfig.obstacles.forEach(o => {
            currentCounts[o.type] = (currentCounts[o.type] || 0) + 1;
        });

        const dropChance = bracket === 'pity' ? 0.5 : 0.25;
        
        newConfig.obstacles = newConfig.obstacles.filter(o => {
            if (Math.random() < dropChance) {
                const req = requiredCounts[o.type] || 0;
                const curr = currentCounts[o.type] || 0;
                if (curr > req) {
                    currentCounts[o.type]--;
                    return false;
                }
            }
            return true;
        });
    } else if (bracket === 'hard') {
        const extraStones = 2;
        let added = 0;
        for (let i = 0; i < 20 && added < extraStones; i++) {
            const r = Math.floor(Math.random() * 10);
            const c = Math.floor(Math.random() * 10);
            if (!newConfig.obstacles.some(o => o.r === r && o.c === c) && !(r === 4 && c === 4)) {
                newConfig.obstacles.push({ r, c, type: 'stone' });
                added++;
            }
        }
    }
    
    return newConfig;
};
