import merge from 'lodash/merge';
import vanillaThemeData from '../../assets/vanilla/theme.json';
import { ThemeManifest } from './types';
import globalBg from '../../assets/vanilla/background/global_background.webp';
import popupBg from '../../assets/vanilla/background/popup_background.webp';

export const vanillaTheme = vanillaThemeData as unknown as ThemeManifest;

if (!vanillaTheme.assets) vanillaTheme.assets = { logo: {}, tiles: {}, backgrounds: {} };
if (!vanillaTheme.assets.logo) vanillaTheme.assets.logo = {};
if (!vanillaTheme.assets.tiles) vanillaTheme.assets.tiles = {};
if (!vanillaTheme.assets.backgrounds) vanillaTheme.assets.backgrounds = {};

vanillaTheme.assets.backgrounds.global = globalBg;
vanillaTheme.assets.backgrounds.popup = popupBg;

const logos = import.meta.glob<{ default: string }>('../../assets/vanilla/logo/*.png', { eager: true });
for (const path in logos) {
  const key = path.split('/').pop()?.replace('.png', '');
  if (key) {
    vanillaTheme.assets.logo[key] = logos[path].default;
  }
}
// Alias shop to store to maintain backward compatibility with existing code
if (vanillaTheme.assets.logo['shop']) {
  vanillaTheme.assets.logo['store'] = vanillaTheme.assets.logo['shop'];
}

const tiles = import.meta.glob<{ default: string }>('../../assets/vanilla/tiles/*.png', { eager: true });
for (const path in tiles) {
  const key = path.split('/').pop()?.replace('.png', '');
  if (key) {
    vanillaTheme.assets.tiles[key] = tiles[path].default;
  }
}

const premiumLogoFiles = import.meta.glob<{ default: string }>('../../assets/premium/logo/*.png', { eager: true, query: '?url', import: 'default' });
const premiumTileFiles = import.meta.glob<{ default: string }>('../../assets/premium/tiles/*.png', { eager: true, query: '?url', import: 'default' });
import premiumGlobalBg from '../../assets/premium/background/global.png';
import premiumPopupBg from '../../assets/premium/background/popup.png';

const collectAssets = (files: Record<string, unknown>) => Object.fromEntries(
  Object.entries(files).map(([path, value]) => [path.split('/').pop()?.replace('.png', ''), value])
);

export const premiumTheme: ThemeManifest = {
  id: 'nocturne',
  name: 'Nocturne Royale',
  type: 'premium',
  price: 2500,
  currency: 'coins',
  data: ['beach_ball','beach_hat','camera','coconut','crab','ice_cream','sandal','seagull','seashell','summer_shirt','summer_shorts','sunglasses','swim_ring','tropical_fish','tropical_juice'],
  colors: {
    'bg-main': '#0b1024',
    'bg': '#0b1024',
    'surface-card-white': '#141c39',
    'surface-card-soft': '#1d274a',
    'primary-coral-pink': '#d9b56d',
    'primary-sunny-yellow': '#f4d28d',
    'primary-sky-blue': '#6379c8',
    'primary-tropical-green': '#6da89c',
    'primary-navy': '#070b1c',
    'border-main': '#9c7b3c',
    'text-primary': '#f8f1df',
    'text-secondary': '#c3cbe3',
    'text-muted': '#8994b7',
    'text-white': '#fffaf0',
    'divider-main': '#2b3760',
    'currency-candy-purple': '#9f8bd4',
    primary: '#d9b56d'
  },
  shadow: { enabled: true, color: 'rgba(0, 0, 0, 0.45)' },
  assets: {
    logo: collectAssets(premiumLogoFiles) as Record<string, string>,
    tiles: collectAssets(premiumTileFiles) as Record<string, string>,
    backgrounds: { global: premiumGlobalBg, popup: premiumPopupBg }
  }
};

export const resolveTheme = (customTheme?: Partial<ThemeManifest> | null): ThemeManifest => {
  if (!customTheme) return vanillaTheme;
  return merge({}, vanillaTheme, customTheme);
};
