// Shared economy rules. No direct win, login, duel or trade currency rewards.
export const DAILY_EARNING_CAP = 100;
export const ECONOMY_TIME_ZONE = 'Asia/Jakarta';
export const ITEM_PRICES = { hint: 35, shuffle: 45, hammer: 60, bomb: 90, zen_undo: 40, zen_rescue: 75 };
export const THEME_PRICES = { ocean: 450, forest: 600, sunset: 750 };
export const DEFAULT_THEME_PRICE = 600;
export const CONSUMABLE_ITEMS = Object.keys(ITEM_PRICES);
export const ITEM_FIELD = { hint: 'hints', shuffle: 'shuffles', hammer: 'hammers', bomb: 'bombs', zen_undo: 'zenUndos', zen_rescue: 'zenRescues' };
export const DEFAULT_ITEM_COUNT = 3;
export const getDefaultItemCount = id => id?.startsWith('zen_') ? 0 : DEFAULT_ITEM_COUNT;
export const DAILY_CHALLENGE_REWARD = 0;
export const DAILY_CHALLENGE_TIME = 75;
export const MISSION_REWARDS = { daily: { Mudah: 2, Menengah: 4, Sulit: 6 }, weekly: { Menengah: 6, Sulit: 8, 'Sangat Sulit': 10 } };
export const calcWinPermen = () => 0;
export const getTodayKey = (now = Date.now()) => new Intl.DateTimeFormat('en-CA', { timeZone: ECONOMY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now));
export const getEconomy = (profile, now = Date.now()) => {
  const e = profile.economy || {};
  return { version: 3, day: getTodayKey(now), earnedToday: e.day === getTodayKey(now) ? e.earnedToday || 0 : 0,
    spentToday: e.day === getTodayKey(now) ? e.spentToday || 0 : 0, totalEarned: e.totalEarned || 0, totalSpent: e.totalSpent || 0,
    ledger: e.ledger || [] };
};
export const recordTransaction = (profile, amount, source, reference, now = Date.now()) => {
  const e = getEconomy(profile, now);
  const income = Math.max(0, amount), expense = Math.max(0, -amount);
  return { ...profile, statistics: { ...profile.statistics, totalPermenEarned: (profile.statistics?.totalPermenEarned || 0) + income },
    economy: { ...e, earnedToday: e.earnedToday + income, spentToday: e.spentToday + expense,
      totalEarned: e.totalEarned + income, totalSpent: e.totalSpent + expense,
      ledger: [{ id: `${now}-${e.ledger.length}-${reference}`, at: now, amount, source, reference }, ...e.ledger].slice(0, 100) } };
};
export const awardPermen = (profile, amount, source, reference, now = Date.now()) => {
  if (!['chest', 'mission', 'achievement'].includes(source) || !Number.isInteger(amount) || amount < 1 || amount > 10)
    return { profile, permenDelta: 0, error: 'INVALID_REWARD' };
  // Defer the entire claim instead of destroying the uncredited remainder.
  if (getEconomy(profile, now).earnedToday + amount > DAILY_EARNING_CAP)
    return { profile, permenDelta: 0, error: 'DAILY_LIMIT' };
  return { profile: recordTransaction(profile, amount, source, reference, now), permenDelta: amount, error: null };
};
import { COSMETICS } from './cosmetics.js';
export const getItemPrice = id => {
  if (typeof id !== 'string') return null;
  if (id.startsWith('theme_')) return THEME_PRICES[id.slice(6)] ?? null;
  return ITEM_PRICES[id] ?? COSMETICS.find(c => c.id === id)?.price ?? null;
};