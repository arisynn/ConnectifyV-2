// Single-currency economy: everything is priced & rewarded in PERMEN.
// Shared by the client (optimistic updates) and the API (authoritative).

export const ITEM_PRICES = {
    hint: 250,
    shuffle: 300,
    hammer: 400,
    bomb: 600,
};

export const THEME_PRICES = {
    ocean: 1000,
    forest: 1500,
};

export const DEFAULT_THEME_PRICE = 1500;

export const getItemPrice = (itemId) => {
    if (!itemId) return null;
    if (itemId.startsWith('theme_')) {
        const themeId = itemId.replace('theme_', '');
        return THEME_PRICES[themeId] ?? DEFAULT_THEME_PRICE;
    }
    return ITEM_PRICES[itemId] ?? null;
};

// Items that can be consumed in-game through USE_ITEM.
export const CONSUMABLE_ITEMS = ['hint', 'shuffle', 'hammer', 'bomb'];
export const ITEM_FIELD = { hint: 'hints', shuffle: 'shuffles', hammer: 'hammers', bomb: 'bombs' };
export const DEFAULT_ITEM_COUNT = 3;

export const DAILY_CHALLENGE_REWARD = 500;
export const DAILY_CHALLENGE_TIME = 75; // seconds (normal level = 90)

export const MISSION_REWARDS = {
    daily: { 'Mudah': 300, 'Menengah': 600, 'Sulit': 1000 },
    weekly: { 'Menengah': 2000, 'Sulit': 3500, 'Sangat Sulit': 5000 },
};

// Permen earned from a single win (Onet / Block Puzzle).
export const calcWinPermen = ({ score = 0, highestCombo = 0, isFlawless = false, timeElapsed = 0, stars = 0, isMultiplayer = false, isWinner = true }) => {
    let permen = 40 + Math.floor(score / 25);
    if (isFlawless) permen += 20;
    if (timeElapsed && timeElapsed < 45000) permen += 15;
    permen += Math.min(60, (highestCombo || 0) * 2);
    if (stars) permen += stars * 15;
    if (isMultiplayer) permen = isWinner ? Math.floor(permen * 1.5) : Math.floor(permen * 0.4);
    return Math.max(10, Math.min(400, permen));
};

export const getTodayKey = () => new Date().toDateString();
