export interface CDEProfileData {
    avatar?: string | null;
    activeAvatarId?: string | null;
    settings?: { isMuted: boolean, audio: { music: number, sfx: number } };
    [key: string]: any;
}

export interface CDEGameState {
    currentLevel?: number;
    highestLevel?: number;
    statistics?: any;
    [key: string]: any;
}

export type CDESyncStatus = 'INITIALIZING' | 'SYNCED' | 'OFFLINE' | 'PENDING' | 'SYNCING' | 'CONFLICT' | 'ERROR';

export interface CDEAccount {
  id: string;
  username: string;
}

export interface CDEProfile {
  account_id: string;
  permen: number;
  profile_data: {
      profile?: CDEProfileData;
      game?: CDEGameState;
      [key: string]: any;
  };
  revision: number;
}

export interface CDEState {
  account: CDEAccount | null;
  profile: CDEProfile | null;
  syncStatus: CDESyncStatus;
  initialized: boolean;
  error: string | null;
}

export type CDEOperationStatus = 'PENDING' | 'SYNCING' | 'FAILED' | 'CONFLICT' | 'COMPLETED';

export type CDEOperationType = 'MUTATE_PERMEN' | 'UPDATE_PROFILE' | 'UPDATE_GAME_STATE' | 'PURCHASE_ITEM' | 'USE_ITEM' | 'PROCESS_WIN' | 'CLAIM_MISSION_REWARD' | 'OPEN_CHEST' | 'SPEED_UP_CHEST' | 'CLAIM_ACHIEVEMENT_REWARD';

export interface CDEOperation {
  opId: string;
  accountId: string;
  type: CDEOperationType;
  payload: any;
  baseRevision: number;
  createdAt: number;
  retryCount: number;
  status: CDEOperationStatus;
  error?: string;
}

export interface CDEMetadata {
  accountId: string;
  schemaVersion: number;
  lastSync: number;
}
