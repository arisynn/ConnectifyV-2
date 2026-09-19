import { getItemPrice, ITEM_FIELD, getDefaultItemCount, recordTransaction } from './economy.js';
import { COSMETICS, COSMETIC_FIELDS } from './cosmetics.js';
export const purchaseItem = (profile, balance, id) => {
  const cost = getItemPrice(id);
  if (cost === null) return { error: 'INVALID_ITEM' };
  const cosmetic = COSMETICS.find(c => c.id === id);
  const theme = id.startsWith('theme_') ? id.slice(6) : null;
  if ((cosmetic && profile.ownedCosmetics?.includes(id)) || (theme && profile.unlockedThemes?.includes(theme))) return { error: 'ALREADY_OWNED' };
  if (balance < cost) return { error: 'INSUFFICIENT_PERMEN' };
  let p = recordTransaction(profile, -cost, 'shop', id);
  if (cosmetic) p.ownedCosmetics = [...(p.ownedCosmetics || []), id];
  else if (theme) { p.unlockedThemes = [...(p.unlockedThemes || ['sweets']), theme]; p.statistics.totalThemesBought = (p.statistics.totalThemesBought || 0) + 1; }
  else p[ITEM_FIELD[id]] = (p[ITEM_FIELD[id]] ?? getDefaultItemCount(id)) + 1;
  return { profile: p, permenDelta: -cost, error: null };
};
export const equipCosmetic = (profile, id, category) => {
  if (id === 'default' && COSMETIC_FIELDS[category]) return { profile: { ...profile, [COSMETIC_FIELDS[category]]: category === 'avatar' ? 'avatar_male' : 'default' }, error: null };
  const c = COSMETICS.find(c => c.id === id);
  if (!c || !profile.ownedCosmetics?.includes(id)) return { error: 'NOT_OWNED' };
  return { profile: { ...profile, [COSMETIC_FIELDS[c.category]]: c.category === 'avatar' || c.category === 'tile' ? c.id : c.value }, error: null };
};