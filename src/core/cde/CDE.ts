import { supabase } from '../../lib/supabase';
import { CDEIndexedDB, CDE_SCHEMA_VERSION } from './persistence/CDEIndexedDB';
import { CDEState, CDEProfile, CDEOperation, CDEOperationType, CDESyncStatus } from './types/cde.types';
import { CDEEventEmitter } from './events/CDEEventEmitter';
import { V2MigrationAdapter } from './migration/V2MigrationAdapter';
import { RewardEngine } from '../reward';
import { openChestAction, speedUpChestAction } from '../chest';
import { claimAchievement } from '../achievements';
import { claimMissionReward, updateMissions } from '../misiHarian';
import { ITEM_FIELD, getDefaultItemCount, recordTransaction } from '../economy';
import { purchaseItem, equipCosmetic } from '../purchases';
import {recordAttempt} from '../difficulty';

export class CDEngine {
  private static instance: CDEngine;
  private db: CDEIndexedDB;
  private emitter: CDEEventEmitter;
  
  private state: CDEState = {
    account: null,
    profile: null,
    syncStatus: 'INITIALIZING',
    initialized: false,
    error: null
  };

  private isSyncing = false;
  private syncTimeout: any = null;

  private constructor() {
    this.db = new CDEIndexedDB();
    this.emitter = new CDEEventEmitter();
    
    window.addEventListener('online', () => {
        if (this.state.syncStatus === 'OFFLINE' && this.state.initialized) {
            this.updateStatus('PENDING');
            this.sync();
        }
    });
    window.addEventListener('offline', () => {
        if (this.state.initialized) {
            this.updateStatus('OFFLINE');
        }
    });
  }

  static getInstance(): CDEngine {
    if (!CDEngine.instance) {
      CDEngine.instance = new CDEngine();
    }
    return CDEngine.instance;
  }

  subscribe(listener: () => void) {
    return this.emitter.subscribe(listener);
  }

  getState(): CDEState {
    return { ...this.state };
  }

  private sanitizeProfile(profile: CDEProfile): CDEProfile {
      if (!profile || !profile.profile_data || !profile.profile_data.profile) return profile;
      
      const newProfileData = { ...profile.profile_data };
      const { 
          hp, flexCrown, currentScore, customEmojis, activeSession, 
          dailyReward, milestones, rewardProgress, dailyMissions, weeklyMissions, 
          ...restProfile 
      } = newProfileData.profile as any;
      
      newProfileData.profile = restProfile;
      return { ...profile, profile_data: newProfileData };
  }

  private updateState(newState: Partial<CDEState>) {
    if (newState.profile) {
        newState.profile = this.sanitizeProfile(newState.profile);
    }
    this.state = { ...this.state, ...newState };
    this.emitter.emit();
  }

  private updateStatus(status: CDESyncStatus) {
    if (this.state.syncStatus !== status) {
        this.updateState({ syncStatus: status });
    }
  }

  private isInitializing = false;

  async initialize(): Promise<void> {
    if (this.isInitializing || this.state.initialized) return;
    this.isInitializing = true;
    try {
        this.updateStatus('INITIALIZING');
        await this.db.init();

        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            this.updateState({ initialized: false, syncStatus: 'ERROR', error: 'No authenticated session' });
            return;
        }

        const accountId = session.user.id;
        const currentAccount = this.state.account;

        // If switching accounts, clear runtime
        if (currentAccount && currentAccount.id !== accountId) {
            this.state.profile = null;
        }

        const currentUsername = localStorage.getItem('pkmnPlayerName') || 'Player';
        this.updateState({ account: { id: accountId, username: currentUsername } }); // Username needs proper fetch if needed

        // Load cache
        const isValid = await this.db.validateCache(accountId);
        if (isValid) {
            const cachedProfile = await this.db.getProfile(accountId);
            if (cachedProfile) {
                this.updateState({ profile: cachedProfile });
            }
        } else {
            // Write metadata and clear invalid cache
            await this.db.clearProfile(accountId);
            await this.db.clearOutbox(accountId);
            await this.db.setMetadata({
                accountId,
                schemaVersion: CDE_SCHEMA_VERSION,
                lastSync: Date.now()
            });
        }

        this.updateState({ initialized: true });

        if (navigator.onLine) {
            await this.syncProfile();
            
            // Run V2 Migration if needed
            const legacyUsername = localStorage.getItem('pkmnPlayerName') || 'Player';
            try {
                const migrated = await V2MigrationAdapter.runMigration(accountId, this.state.profile, session.access_token, legacyUsername);
                if (migrated && !this.state.profile?.profile_data?.migration?.v2_migrated) {
                    await this.syncProfile(); // Pull new migrated data
                }
            } catch (err) {
                console.error("[CDE] Migration failed:", err);
            }

            this.sync();
        } else {
            this.updateStatus('OFFLINE');
        }
        
        // Final safety check: ensure we have a profile to prevent app crashes
        if (!this.state.profile) {
            this.updateState({ syncStatus: 'ERROR', error: 'DATA_UNAVAILABLE' });
            console.warn("No valid profile found locally or in cloud. Entering SYNC_ERROR state.");
        }
    } catch (e: any) {
        console.error("CDE Init Error:", e);
        this.updateState({ initialized: true, syncStatus: 'ERROR', error: e.message });
    } finally {
        this.isInitializing = false;
    }
  }

  private async syncProfile(force=false): Promise<void> {
      const accountId = this.state.account?.id;
      if (!accountId) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      try {
          const res = await fetch('/api/cde?action=get_profile&_t=' + Date.now(), {
              headers: { 'Authorization': `Bearer ${session.access_token}` }
          });
          
          if (!res.ok) throw new Error(`Failed to fetch authoritative profile: ${res.status}`);
          const data = await res.json();
          
          if (data.profile) {
              const currentProfile = this.state.profile;
              // Only apply if cloud revision is newer or we don't have one
              if (force || !currentProfile || Number(data.profile.revision) > Number(currentProfile.revision)) {
                  this.updateState({ profile: { ...data.profile, permen: Number(data.profile.permen), revision: Number(data.profile.revision) } });
                  await this.db.setProfile({ ...data.profile, permen: Number(data.profile.permen), revision: Number(data.profile.revision) });
              }
          }
      } catch (e: any) {
          if (e.message && e.message.includes("Failed to fetch")) {
              console.warn("Offline mode active: Cannot reach CDE profile sync endpoint.");
              this.updateStatus('OFFLINE');
          } else {
              console.error("Profile sync error:", e);
              this.updateStatus('ERROR');
          }
          
          if (!this.state.profile) {
              this.updateState({ syncStatus: 'ERROR', error: 'DATA_UNAVAILABLE' });
              console.warn("No valid profile found locally or in cloud. Entering SYNC_ERROR state.");
          }
      }
  }

  async queueMutation(type: CDEOperationType, payload: any): Promise<void> {
      if (type === 'MUTATE_PERMEN') throw new Error('Permen hanya dari peti, misi, dan pencapaian.');
      if (!this.state.account || !this.state.profile) {
          throw new Error("Cannot mutate: CDE not initialized or no profile");
      }

      const opId = crypto.randomUUID();
      const op: CDEOperation = {
          opId,
          accountId: this.state.account.id,
          type,
          payload,
          baseRevision: Number(this.state.profile.revision),
          createdAt: Date.now(),
          retryCount: 0,
          status: 'PENDING'
      };

      // Optimistic update (mirrors the authoritative logic in api/cde.ts using the same pure helpers)
      let newProfile = { ...this.state.profile };
      const prof = () => ({ ...(newProfile.profile_data?.profile || {}) });
      const patchProfile = (patch: any) => {
          const { permen, coins, ...rest } = patch || {};
          newProfile.profile_data = {
              ...newProfile.profile_data,
              profile: { ...(newProfile.profile_data?.profile || {}), ...rest }
          };
      };
      const addPermen = (delta: number) => { newProfile.permen = Math.max(0, (newProfile.permen || 0) + delta); };

      if (type === 'UPDATE_PROFILE') {
          patchProfile(payload);
      } else if (type === 'UPDATE_GAME_STATE') {
          newProfile.profile_data = {
              ...newProfile.profile_data,
              game: { ...(newProfile.profile_data?.game || {}), ...payload }
          };
      } else if (type === 'USE_ITEM') {
          const field = (ITEM_FIELD as any)[payload.itemId];
          if (field) {
              const current = prof()[field] !== undefined ? prof()[field] : getDefaultItemCount(payload.itemId);
              if (current <= 0) throw new Error('NO_ITEMS');
              let next: any = { ...prof(), [field]: Math.max(0, current - 1) };
              if (payload.itemId === 'hint') next = updateMissions(next, 'useHint', 1);
              if (payload.itemId === 'shuffle') next = updateMissions(next, 'useShuffle', 1);
              patchProfile(next);
          }
      } else if (type === 'EQUIP_COSMETIC') {
          const result = equipCosmetic(prof(), payload.itemId, payload.category);
          if (result.error) throw new Error(result.error);
          patchProfile(result.profile);
      } else if (type === 'PURCHASE_ITEM') {
          const result = purchaseItem(prof(), newProfile.permen || 0, payload.itemId);
          if (result.error) throw new Error(result.error);
          addPermen(result.permenDelta);
          patchProfile(result.profile);
      } else if (type === 'CLAIM_MISSION_REWARD') {
          const result = claimMissionReward(prof(), payload.missionId);
          if (result.error) throw new Error(result.error);
          if (!result.error) {
              addPermen(result.permenDelta);
              patchProfile(result.profile);
          }
      } else if (type === 'PROCESS_WIN') {
          const { profile: updated, rewardResult } = RewardEngine.processWin(prof(), payload);
          addPermen((rewardResult.permen || 0) + (rewardResult.dailyBonus || 0));
          patchProfile(updated);
      } else if (type === 'RECORD_ATTEMPT') {
          patchProfile(recordAttempt(prof(),{game:payload.game,isWinner:false}));
      } else if (type === 'OPEN_CHEST') {
          const { profile: updated, rewards, error } = openChestAction(prof(), payload.slotId);
          if (error) throw new Error(error);
          if (rewards && rewards.chestType) {
              addPermen(rewards.permen || 0);
              patchProfile(updateMissions(updated, 'openChest', 1));
          }
      } else if (type === 'SPEED_UP_CHEST') {
          const result = speedUpChestAction(prof(), payload.slotId, newProfile.permen || 0);
          if (result.success) {
              addPermen(-result.cost);
              patchProfile(recordTransaction({ ...prof(), chestSlots: result.profile.chestSlots }, -result.cost, 'chest_speedup', String(payload.slotId)));
          }
      } else if (type === 'CLAIM_ACHIEVEMENT_REWARD') {
          const result = claimAchievement(prof(), payload.achievementId);
          if (result.error) throw new Error(result.error);
          if (!result.error) {
              addPermen(result.permenDelta);
              patchProfile(result.profile);
          }
      }
      this.updateState({ profile: newProfile });

      await this.db.addOperation(op);
      
      this.updateStatus('PENDING');
      this.triggerSync();
  }

  private triggerSync() {
      if (!navigator.onLine) return;
      if (this.isSyncing) return;
      
      if (this.syncTimeout) clearTimeout(this.syncTimeout);
      this.syncTimeout = setTimeout(() => {
          this.sync();
      }, 100);
  }

  async getMetadata(): Promise<any> {
      if (!this.state.account) return null;
      return await this.db.getMetadata(this.state.account.id);
  }
  
  async getPendingOperations(): Promise<any[]> {
      if (!this.state.account) return [];
      return await this.db.getPendingOperations(this.state.account.id);
  }
  
  async forceSync(): Promise<void> {
      console.log("[CDE] Defibrillator activated: Forcing sync...");
      this.isSyncing = false;
      this.updateStatus('SYNCING');
      await this.sync();
  }

  async sync(): Promise<void> {
      if (this.isSyncing || !this.state.account) return;
      if (!navigator.onLine) {
          this.updateStatus('OFFLINE');
          return;
      }

      const accountId = this.state.account.id;
      this.isSyncing = true;
      this.updateStatus('SYNCING');

      try {
          const ops = await this.db.getPendingOperations(accountId);
          if (ops.length === 0) {
              this.updateStatus('SYNCED');
              this.isSyncing = false;
              return;
          }

          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
              throw new Error("No session");
          }

          for (const op of ops) {
              // Ensure we are still logged in as the same user
              if (this.state.account?.id !== accountId) {
                  break;
              }

              // Re-evaluate if conflict happened
              if (this.state.profile && Number(op.baseRevision) < Number(this.state.profile.revision)) {
                  console.warn("Operation baseRevision is stale. Rebasing...");
                  op.baseRevision = Number(this.state.profile.revision);
                  if (op.status === 'CONFLICT') op.status = 'PENDING';
                  // In a real sophisticated engine, you might check if payload is still valid
                  await this.db.updateOperation(op);
              }

              try {
                  let action = 'mutate_permen';
                  let bodyPayload: any = {
                      opId: op.opId,
                      baseRevision: op.baseRevision
                  };

                  if (op.type === 'MUTATE_PERMEN') {
                      bodyPayload.amount = op.payload.amount;
                  } else {
                      action = 'mutate_state';
                      bodyPayload.type = op.type;
                      bodyPayload.payload = op.payload;
                  }

                  const controller = new AbortController();
                  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 detik timeout (Circuit Breaker)

                  const res = await fetch(`/api/cde?action=${action}`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`
                      },
                      body: JSON.stringify(bodyPayload),
                      signal: controller.signal
                  });
                  clearTimeout(timeoutId);

                  const data = await res.json();

                  if (res.ok && data.success) {
                      op.status = 'COMPLETED';
                      await this.db.removeOperation(op.opId);
                      
                      // Update authoritative state
                      if (data.result) {
                          const updatedProfile = { 
                              ...this.state.profile!, 
                              profile_data: data.result.profile_data,
                              permen: data.result.permen, 
                              revision: data.result.revision 
                          };
                          this.updateState({ profile: updatedProfile });
                          await this.db.setProfile(updatedProfile);
                      }
                  } else if (res.status === 409) {
                      op.status = 'CONFLICT';
                      await this.db.updateOperation(op);
                      this.updateStatus('CONFLICT');
                      await this.syncProfile(); // Fetch latest
                      setTimeout(() => { if (!this.isSyncing) this.sync(); }, 500); // Trigger automatic retry
                      break; // Stop processing further ops in this run until rebase
                  } else {
                      await this.syncProfile(true);
                      throw new Error(data.error || `Server error ${res.status}`);
                  }
              } catch (err: any) {
                  if (err.name === 'AbortError' || (err.message && err.message.includes("Failed to fetch"))) {
                      console.warn("Offline/Timeout mode active: Op sync paused.");
                      this.updateStatus('OFFLINE');
                      
                      op.retryCount++;
                      if (op.retryCount >= 5) {
                          op.status = 'FAILED';
                      } else {
                          op.status = 'PENDING';
                      }
                      await this.db.updateOperation(op);
                      break; // Break queue if it's a network disconnection/timeout
                  } else {
                      console.error("Op Sync Failed unrecoverably (Non-Network Error):", err);
                      // ERROR UNBLOCKING: Jangan biarkan PENDING.
                      // Tandai sebagai FAILED secara instan agar getPendingOperations mengabaikannya pada iterasi berikutnya,
                      // membebaskan antrean di belakangnya dari deadlock.
                      op.status = 'FAILED';
                      op.error = err.message;
                      await this.db.updateOperation(op);
                      continue; // Lanjutkan ke operasi berikutnya (Lompati yang gagal ini)
                  }
              }
          }

          const remaining = await this.db.getPendingOperations(accountId);
          if (remaining.length === 0 && this.state.syncStatus !== 'CONFLICT') {
              this.updateStatus('SYNCED');
          } else if (this.state.syncStatus !== 'CONFLICT') {
              this.updateStatus('PENDING'); // Will retry on next interval or event
          }
      } finally {
          this.isSyncing = false;
      }
  }

  async logout(): Promise<void> {
      this.updateState({ account: null, profile: null, initialized: false, syncStatus: 'INITIALIZING' });
      // We don't delete IndexedDB data, just clear memory, since we have account isolation
  }
}

export const CDE = CDEngine.getInstance();
