import { CDEProfile } from '../types/cde.types';

export class V2MigrationAdapter {
    static async runMigration(accountId: string, currentProfile: CDEProfile | null, token: string, username: string): Promise<boolean> {
        // Return true if migrated or already migrated. Return false if failed or critical error.
        
        // MIGRATION SAFETY FIX:
        // We do NOT automatically migrate old localStorage based merely on username,
        // because anonymous accounts lose their true identity when the session is lost.
        // Returning true silently skips the automatic migration attempt.
        return true;

        // 1. Detect if we are already migrated. 
        if (currentProfile?.profile_data?.migration?.v2_migrated) {
            return true; // Already migrated
        }

        // 2. Identify V2 source. We need the username.
        // We know V2 stores it in SC_BACKUP_{username}
        const raw = localStorage.getItem(`SC_BACKUP_${username}`);
        if (!raw) {
            // No V2 backup. Nothing to migrate. We can mark it as migrated or ignore.
            // Let's mark as migrated implicitly so we don't keep checking?
            // Actually, if there's no V2 save, they are a new user. It's safe to skip migration.
            return true;
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (e) {
            console.error("[CDE][Migration] Corrupt V2 JSON format");
            return false;
        }

        const gameData = parsed.gameData || parsed; // Handle V1 or V2 wrapper
        
        if (typeof gameData !== 'object' || Array.isArray(gameData)) {
            console.error("[CDE][Migration] Invalid V2 payload structure");
            return false;
        }

        console.log("[CDE][Migration] Started V2 Data validation");
        
        // 3. Validation & Field Mapping
        const permen = Math.max(0, Number(gameData.coins) || 0);
        
        const avatarCollection = Array.isArray(gameData.avatarCollection) ? gameData.avatarCollection : [];
        if (gameData.avatar && !avatarCollection.includes(gameData.avatar)) {
            avatarCollection.push(gameData.avatar);
        }
        
        const activeAvatarId = typeof gameData.activeAvatarId === 'string' ? gameData.activeAvatarId : (typeof gameData.avatar === 'string' ? gameData.avatar : null);
        
        const profilePayload = {
            profile: {
                ...gameData,
                avatar: activeAvatarId,
                activeAvatarId: activeAvatarId,
                avatarCollection: avatarCollection,
            },
            migration: {
                v2_migrated: true,
                migrated_at: Date.now()
            }
        };

        // Enforce validation constraints
        if ((profilePayload.profile.highestLevel || 1) < (profilePayload.profile.currentLevel || 1)) {
            profilePayload.profile.highestLevel = profilePayload.profile.currentLevel;
        }

        const opId = crypto.randomUUID();

        console.log("[CDE][Migration] Dispatching migration operation");

        try {
            const res = await fetch(`/api/cde?action=migrate_v2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    opId,
                    permen,
                    profile_data: profilePayload
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                console.error("[CDE][Migration] Failed:", data.error);
                return false;
            }

            console.log("[CDE][Migration] Success");
            return true;
        } catch (e: any) {
            console.error("[CDE][Migration] Network or execution failure:", e);
            return false;
        }
    }
}
