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

export const resolveTheme = (customTheme?: Partial<ThemeManifest> | null): ThemeManifest => {
  if (!customTheme) return vanillaTheme;
  return merge({}, vanillaTheme, customTheme);
};
