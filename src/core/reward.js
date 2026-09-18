import { addChestProgress } from './chest';
import { updateMissions } from './misiHarian';
import { calcWinPermen, DAILY_CHALLENGE_REWARD, getTodayKey } from './economy';

// Pure win processor shared by client (optimistic) and API (authoritative).
// Returns { profile, rewardResult: { chestPoints, permen, dailyBonus } }.
export const RewardEngine = {
    processWin: (profile, payload) => {
        const {
            isMultiplayer = false, isFlawless = false, timeElapsed = 0, progress = 0, highestCombo = 0,
            isWinner = true, score = 0, matches = 0, game = 'onet', stars = 0, blocksCleared = 0,
            isDailyChallenge = false
        } = payload || {};

        let p = { ...profile };
        p.statistics = { ...(p.statistics || {}) };

        p.winStreak = isWinner ? (p.winStreak || 0) + 1 : 0;

        // Statistics
        p.statistics.totalGames = (p.statistics.totalGames || 0) + 1;
        if (timeElapsed) {
            p.statistics.totalPlayTimeMs = (p.statistics.totalPlayTimeMs || 0) + timeElapsed;
        }
        p.statistics.totalScore = (p.statistics.totalScore || 0) + score;
        p.statistics.highestScore = Math.max(p.statistics.highestScore || 0, score);
        if (isFlawless) p.statistics.totalFlawless = (p.statistics.totalFlawless || 0) + 1;
        p.statistics.highestCombo = Math.max(p.statistics.highestCombo || 0, highestCombo || 0);
        if (timeElapsed && timeElapsed < 45000 && game === 'onet') p.statistics.speedrunLevels = (p.statistics.speedrunLevels || 0) + 1;
        if (progress >= 50 && game === 'onet') p.statistics.survivorLevels = (p.statistics.survivorLevels || 0) + 1;
        if (time_is_near_death(timeElapsed, game)) p.statistics.nearDeathEscapes = (p.statistics.nearDeathEscapes || 0) + 1;
        p.statistics.totalBlocksCleared = (p.statistics.totalBlocksCleared || 0) + (matches * 2) + blocksCleared;
        p.statistics.totalMatches = (p.statistics.totalMatches || 0) + matches;
        if (game === 'block') {
            p.statistics.blockPuzzleGames = (p.statistics.blockPuzzleGames || 0) + 1;
            p.statistics.blockPuzzleStars = (p.statistics.blockPuzzleStars || 0) + stars;
            p.statistics.blockPuzzleHighScore = Math.max(p.statistics.blockPuzzleHighScore || 0, score);
        } else {
            p.statistics.onetGames = (p.statistics.onetGames || 0) + 1;
        }
        if (isMultiplayer) {
            p.statistics.multiplayerGames = (p.statistics.multiplayerGames || 0) + 1;
            if (isWinner) p.statistics.multiplayerWins = (p.statistics.multiplayerWins || 0) + 1;
        }

        // 1. Chest progress
        let chestPoints = isMultiplayer ? (isWinner ? 4 : 1) : 2;
        if (isFlawless) chestPoints += 1;
        if (highestCombo >= 15) chestPoints += 2;
        else if (highestCombo >= 8) chestPoints += 1;
        if (timeElapsed && timeElapsed < 45000) chestPoints += 1;
        if (stars >= 3) chestPoints += 1;
        p = addChestProgress(p, chestPoints);

        // 2. Permen (single currency) win reward
        let permen = calcWinPermen({ score, highestCombo, isFlawless, timeElapsed, stars, isMultiplayer, isWinner });
        let dailyBonus = 0;
        if (isDailyChallenge && isWinner) {
            const today = getTodayKey();
            if (p.dailyChallengeDate !== today) {
                p.dailyChallengeDate = today;
                p.statistics.dailyChallengesWon = (p.statistics.dailyChallengesWon || 0) + 1;
                dailyBonus = DAILY_CHALLENGE_REWARD;
            }
        }
        p.statistics.totalPermenEarned = (p.statistics.totalPermenEarned || 0) + permen + dailyBonus;

        // 3. Missions (daily + weekly)
        if (isWinner) p = updateMissions(p, 'winLevel', 1);
        if (isFlawless) p = updateMissions(p, 'flawless', 1);
        if (progress >= 50 && game === 'onet') p = updateMissions(p, 'survivor', 1);
        if (timeElapsed && timeElapsed < 45000 && game === 'onet') p = updateMissions(p, 'fast_clear', 1);
        if (highestCombo > 0) p = updateMissions(p, 'combo', highestCombo);
        if (matches > 0) p = updateMissions(p, 'match', matches);
        if (score > 0) p = updateMissions(p, 'score', score);

        const rewardResult = { chestPoints, permen, dailyBonus };
        return { profile: p, rewardResult };
    }
};

function time_is_near_death(timeElapsed, game) {
    // Onet levels last 90s; finishing with < 1s left counts as a near-death escape.
    return game === 'onet' && timeElapsed >= 89000 && timeElapsed <= 90000;
}
