import { ThemeManifest } from './types';
import { vanillaTheme } from './utils';

export const DEFAULT_THEMES: Record<string, ThemeManifest> = {
  sweets: vanillaTheme,
  ocean: {
    id: 'ocean',
    name: 'Deep Blue',
    type: 'standar',
    price: 450,
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
    price: 600,
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
  },
  sunset: {
    id:'sunset',name:'Peach Sunset',type:'standar',price:750,currency:'coins',
    colors:{'bg-main':'#fff0e5','surface-card-white':'#fffaf3','primary-coral-pink':'#f5a184','primary-sky-blue':'#9bcac6','border-main':'#573e42','text-primary':'#573e42','text-muted':'#997376',bg:'#fff0e5',primary:'#f5a184'},
    assets:{logo:{},tiles:{},backgrounds:{}}
  }
};
