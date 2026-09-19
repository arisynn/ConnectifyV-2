import levelData from './levels.json';
import { generateProceduralLevel } from './pcg';
import { DDABracket } from './dda';
import {createAdaptiveBlockLevel} from './adaptiveLevels';

export type ObstacleType = 'ice' | 'wood' | 'metal-2' | 'metal-1' | 'stone' | 'gem' | '';
export type MissionType = 'score' | 'clear_lines' | 'destroy_gems' | 'destroy_ice' | 'destroy_wood' | 'max_moves';

export interface Mission {
  type: MissionType;
  target: number;
  description: string;
}

export interface LevelConfig {
  level: number;
  obstacles: { r: number, c: number, type: ObstacleType }[];
  missions: [Mission, Mission, Mission];
  gravity?: boolean;
}

export const LEVEL_CONFIGS: Record<string, LevelConfig> = levelData as any;

export const validateLevelConfig = (config: any): string | null => {
  if (!config) return "Level config is missing or undefined.";
  if (!config.missions || !Array.isArray(config.missions) || config.missions.length !== 3) {
    return "Level must have exactly 3 missions.";
  }
  
  // Validate missions against obstacles
  const hasIce = config.obstacles?.some((o: any) => o.type === 'ice');
  const hasWood = config.obstacles?.some((o: any) => o.type === 'wood');
  const hasGem = config.obstacles?.some((o: any) => o.type === 'gem');

  for (const m of config.missions) {
    if (m.type === 'destroy_ice' && !hasIce) return "Mission requires destroying ice, but no ice obstacles are present.";
    if (m.type === 'destroy_wood' && !hasWood) return "Mission requires destroying wood, but no wood obstacles are present.";
    if (m.type === 'destroy_gems' && !hasGem) return "Mission requires destroying gems, but no gem obstacles are present.";
  }

  return null;
}

export const getLevelConfig = (level: number, bracket: DDABracket = 'normal', seedStr: string = '',record?:any): LevelConfig => {
  return createAdaptiveBlockLevel(level,record||{skill:bracket==='hard'?85:bracket==='easy'?30:50,failStreak:bracket==='pity'?4:0},seedStr);
  /* Legacy curated/PCG data remains available for reference, not the active engine.
  if (level > 20) {
      return generateProceduralLevel(level, bracket, seedStr || `default_${level}`);
  }
  const config = LEVEL_CONFIGS[level];
  const error = validateLevelConfig(config);
  
  if (error) {
    console.error(`[Level Validation Error] Level ${level}: ${error}`);
    // Return a safe fallback so the game doesn't crash, satisfying "bukan crash"
    return {
      level,
      obstacles: [],
      gravity: false,
      missions: [
        { type: 'score', target: 500, description: `ERROR: ${error}` },
        { type: 'clear_lines', target: 1, description: 'Level Invalid' },
        { type: 'max_moves', target: 99, description: 'Check console for details' }
      ]
    };
  }

  return config as LevelConfig; */
};
