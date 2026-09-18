export interface ThemeColors {
  [key: string]: string;
}

export interface ThemeAssets {
  logo: Record<string, string>;
  tiles: Record<string, string>;
  backgrounds: {
    global?: string;
    popup?: string;
  };
}

export interface ThemeGeometry {
  'border-width': {
    base: string;
    sm: string;
    lg: string;
  };
  radius: {
    base: string;
    lg: string;
    full: string;
  };
  shadow: {
    base: string;
    sm: string;
    lg: string;
    active: string;
  };
  'press-translate': {
    x: string;
    y: string;
  };
}

export interface ThemeManifest {
  id: string;
  name: string;
  type?: 'standar' | 'premium' | 'custom' | 'reward';
  price?: number;
  currency?: string;
  data?: string[]; // for backward compatibility of emojis or legacy tiles
  colors: ThemeColors;
  geometry?: ThemeGeometry;
  shadow?: {
    enabled: boolean;
    color?: string;
  };
  assets: ThemeAssets;
  audio?: any; // For backward compatibility
}

export interface ThemeContextType {
  activeTheme: ThemeManifest;
  setCustomTheme: (theme: Partial<ThemeManifest> | null) => void;
  // Backward compatibility
  setTheme: (themeId: string) => void;
  availableThemes: Record<string, ThemeManifest>;
}
