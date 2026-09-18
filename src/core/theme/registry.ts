import { ThemeManifest } from './types';
import { vanillaTheme } from './utils';

export const DEFAULT_THEMES: Record<string, ThemeManifest> = {
  sweets: vanillaTheme,
  ocean: {
    id: 'ocean',
    name: 'Deep Blue',
    type: 'standar',
    price: 1000,
    currency: 'coins',
    data: ['🐟','🐠','🐡','🐙','🦑','🦐','🦞','🦀','🐬','🐋','🦈','🦭','🐚','🐌','🐧','🐢','🦆','🧊'],
    colors: {
      'bg-main': '#eff6ff',        // Tailwind blue-50
      'surface-card-white': '#ffffff',
      'primary-indigo': '#3b82f6',   // mapped primary
      'border-main': '#bfdbfe',    // mapped border
      'text-primary': '#1e3a8a',      // mapped text
      'text-muted': '#60a5fa', // mapped textMuted
      // Fallbacks to avoid undefined errors during partial merge if needed
      'bg': '#eff6ff', 
      'primary': '#3b82f6',
    },
    assets: {
      logo: {},
      tiles: {},
      backgrounds: {}
    }
  },
  forest: {
    id: 'forest',
    name: 'Green Forest',
    type: 'standar',
    price: 1500,
    currency: 'coins',
    data: ['🌲','🌳','🌴','🌵','🌿','☘️','🍀','🎍','🪴','🍃','🍂','🍁','🍄','🌾','💐','🌷','🌹','🥀'],
    colors: {
      'bg-main': '#f0fdf4',        // Tailwind green-50
      'surface-card-white': '#ffffff',
      'primary-tropical-green': '#22c55e',   // mapped primary
      'border-main': '#bbf7d0',    // Tailwind green-200
      'text-primary': '#14532d',      // Tailwind green-900
      'text-muted': '#4ade80', // Tailwind green-400
      'bg': '#f0fdf4', 
      'primary': '#22c55e',
    },
    assets: {
      logo: {},
      tiles: {},
      backgrounds: {}
    }
  }
};
