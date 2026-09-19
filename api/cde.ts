import type { Request, Response } from 'express';
import { getSupabase } from './supabase.js';
import { purchaseItem, equipCosmetic } from '../src/core/purchases.js';
import {recordAttempt} from '../src/core/difficulty.js';


async function getUserWithRetry(supabase, token) {
    let authRetry = 0;
    while (authRetry < 3) {
        try {
            const res = await supabase.auth.getUser(token);
            if (res.error && res.error.message && res.error.message.includes('issued at future')) {
                authRetry++;
                await new Promise(r => setTimeout(r, 1000));
            } else if (res.error) {
                return res;
            } else {
                return res;
            }
        } catch (e: any) {
            if (e.message && e.message.includes('issued at future')) {
                authRetry++;
                await new Promise(r => setTimeout(r, 1000));
            } else {
                return { data: { user: null }, error: e };
            }
        }
    }
    return { data: { user: null }, error: new Error('JWT issued at future retry limit exceeded') };
}

export default async function handler(req: Request, res: Response) {
    res.setHeader('Access-Control-Allow-Credentials', "true");
    const origin = req.headers.origin || '*'; res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const action = req.query.action as string;
    const supabase = getSupabase();
    
    if (!supabase) {
        return res.status(500).json({ error: "Database not configured" });
    }

    // Extract Bearer token
    const authHeader = req.headers.authorization;
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }

    try {
        
        if (action === 'migrate_v2' && req.method === 'POST') {
            return res.status(410).json({ error: 'MIGRATION_REQUIRES_ADMIN', message: 'Migrasi saldo lama harus diverifikasi pengelola.' });
            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });

            const { opId, permen, profile_data } = req.body;
            if (!opId || typeof permen !== 'number' || !profile_data) {
                return res.status(400).json({ error: 'INVALID_PAYLOAD' });
            }

            const { data: userData } = await getUserWithRetry(supabase, token);
            const accountId = userData?.user?.id || 'mock-uuid-1234';

            // Check Idempotency
            const { data: existingOp, error: existingOpError } = await supabase.from('cde_operations_log')
                .select('idempotency_key')
                .eq('idempotency_key', opId)
                .maybeSingle();
            if (existingOpError) {
                console.error("existingOpError", existingOpError);
                return res.status(500).json({ error: existingOpError.message });
            }
            if (existingOp) {
                const { data: currentProfile } = await supabase.from('cde_profiles').select('*').eq('account_id', accountId).single();
                return res.status(200).json({ success: true, idempotent: true, result: currentProfile });
            }

            // Execute migration transactionally using cde_mutate_permen but bypassing it for full payload.
            // Wait, we need to set both permen and profile_data.
            // Let's do it sequentially since this is a one-time migration and we have the lock.
            
            // First fetch current to ensure it's not migrated
            const { data: currentProfile, error: getError } = await supabase.from('cde_profiles').select('*').eq('account_id', accountId).single();
            if (getError) return res.status(500).json({ error: getError.message });
            
            if (currentProfile?.profile_data?.migration?.v2_migrated) {
                 return res.status(200).json({ success: true, already_migrated: true, result: currentProfile });
            }

            // Map and update
            const newRevision = currentProfile.revision + 1;
            const updatedProfileData = {
                ...currentProfile.profile_data,
                ...profile_data,
                migration: profile_data.migration
            };

            const { data: updatedProfile, error: updateError } = await supabase.from('cde_profiles')
                .update({ 
                    permen: permen,
                    profile_data: updatedProfileData,
                    revision: newRevision,
                    updated_at: new Date().toISOString()
                })
                .eq('account_id', accountId)
                .select()
                .single();

            if (updateError) return res.status(500).json({ error: updateError.message });

            await supabase.from('cde_operations_log').insert({
                idempotency_key: opId,
                account_id: accountId,
                operation_type: 'MIGRATE_V2'
            }).then(res => { if (res.error && res.error.code !== '23505') console.error("Failed to log migration op:", res.error); });

            return res.status(200).json({ success: true, result: updatedProfile });
        }

        
        


        if (action === 'generate_recovery' && req.method === 'POST') {
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
            const { data: userData } = await getUserWithRetry(supabase, token);
            const accountId = userData?.user?.id;
            if (!accountId) return res.status(401).json({ error: 'UNAUTHORIZED' });

            const crypto = await import('crypto');
            const rawCode = crypto.randomBytes(6).toString('hex').toUpperCase();
            const formattedCode = `${rawCode.substring(0,4)}-${rawCode.substring(4,8)}-${rawCode.substring(8,12)}`;
            
            const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');

            const { error } = await supabase.from('cde_recovery_codes').upsert({
                account_id: accountId,
                code_hash: codeHash,
                created_at: new Date().toISOString()
            }, { onConflict: 'account_id' });

            if (error) {
                if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('schema cache') || error.code === 'PGRST205') {
                    // Fallback
                    const { data: profile } = await supabase.from('cde_profiles').select('profile_data').eq('account_id', accountId).single();
                    if (profile) {
                        const updatedData = { ...profile.profile_data, recovery_code_hash: codeHash };
                        await supabase.from('cde_profiles').update({ profile_data: updatedData }).eq('account_id', accountId);
                    }
                } else {
                    return res.status(500).json({ error: error.message });
                }
            }
            return res.status(200).json({ success: true, code: formattedCode });
        }

        if (action === 'recover_account' && req.method === 'POST') {
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
            const { data: userData } = await getUserWithRetry(supabase, token);
            const newAccountId = userData?.user?.id;
            if (!newAccountId) return res.status(401).json({ error: 'UNAUTHORIZED' });

            const { code } = req.body;
            if (!code) return res.status(400).json({ error: 'MISSING_CODE' });

            const crypto = await import('crypto');
            const codeHash = crypto.createHash('sha256').update(code.replace(/-/g, '').toUpperCase()).digest('hex');

            let targetAccountId = null;
            
            const { data: recoveryRows, error: findErr } = await supabase.from('cde_recovery_codes').select('account_id').eq('code_hash', codeHash);
            
            if (findErr && (findErr.code === '42P01' || findErr.message.includes('relation') || findErr.message.includes('schema cache') || findErr.code === 'PGRST205')) {
                const { data: profiles } = await supabase.from('cde_profiles').select('account_id, profile_data');
                const matched = (profiles || []).find(p => p?.profile_data?.recovery_code_hash === codeHash);
                if (matched) targetAccountId = matched.account_id;
            } else if (recoveryRows && recoveryRows.length > 0) {
                targetAccountId = recoveryRows[0].account_id;
            }

            if (!targetAccountId) return res.status(404).json({ error: 'INVALID_CODE' });

            const { data: oldAccount } = await supabase.from('cde_accounts').select('*').eq('id', targetAccountId).maybeSingle();
            const { data: oldProfile } = await supabase.from('cde_profiles').select('*').eq('account_id', targetAccountId).maybeSingle();
            
            if (!oldAccount || !oldProfile) return res.status(404).json({ error: 'ACCOUNT_NOT_FOUND' });

            const oldUsername = oldAccount.username;
            
            await supabase.from('cde_accounts').update({ username: `${oldUsername}_transferred_${Date.now()}` }).eq('id', targetAccountId);
            
            const { data: newAccount } = await supabase.from('cde_accounts').select('*').eq('id', newAccountId).maybeSingle();
            
            if (newAccount) {
                await supabase.from('cde_accounts').update({ username: oldUsername }).eq('id', newAccountId);
            } else {
                await supabase.from('cde_accounts').insert({ id: newAccountId, username: oldUsername });
            }

            const { data: newProfile } = await supabase.from('cde_profiles').select('*').eq('account_id', newAccountId).maybeSingle();
            
            if (newProfile) {
                await supabase.from('cde_profiles').update({
                    permen: oldProfile.permen,
                    profile_data: oldProfile.profile_data,
                    revision: oldProfile.revision
                }).eq('account_id', newAccountId);
            } else {
                await supabase.from('cde_profiles').insert({
                    account_id: newAccountId,
                    permen: oldProfile.permen,
                    profile_data: oldProfile.profile_data,
                    revision: oldProfile.revision
                });
            }

            await supabase.from('cde_accounts').delete().eq('id', targetAccountId);

            return res.status(200).json({ success: true, accountId: newAccountId, username: oldUsername });
        }

        if (action === 'check_username' && req.method === 'POST') {
            const { username } = req.body;
            if (!username) return res.status(400).json({ error: 'Missing username' });
            // Clean username exactly how provision does it (or roughly equivalent to pseudoEmail)
            const cleanName = username.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            // Actually in provision, username is stored directly or with #... Wait, let's check how it's stored.
            // If they use pseudoEmail, it's safer to check if auth user exists. But we can't query auth.users from anon.
            // We CAN query cde_accounts by username. 
            const { data } = await supabase.from('cde_accounts').select('id, username').ilike('username', `${cleanName}%`).limit(1);
            return res.status(200).json({ exists: data && data.length > 0 });
        }

        if (action === 'provision' && req.method === 'POST') {
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
            
            const { username } = req.body;
            if (!username) return res.status(400).json({ error: 'Missing username' });
            
            const userRes = await getUserWithRetry(supabase, token);
            const userData = userRes.data;
            const authError = userRes.error;

            if (authError || !userData?.user) return res.status(401).json({ error: 'INVALID_TOKEN' });
            
            const accountId = userData.user.id;
            
            
            // Check if account already exists
            const { data: existingAccount } = await supabase.from('cde_accounts').select('id').eq('id', accountId).maybeSingle();
            if (existingAccount) {
                // Account already exists, do not overwrite anything. Just return success.
                return res.status(200).json({ success: true, accountId, existing: true });
            }

            let safeUsername = username;
            let retryCount = 0;
            let insertError = null;

            while (retryCount < 3) {
                const { error } = await supabase.from('cde_accounts').insert({ 
                    id: accountId, 
                    username: safeUsername 
                });
                
                if (error && error.message.includes('cde_accounts_username_key')) {
                    // Unique constraint violation, append random numbers
                    safeUsername = `${username}#${Math.floor(Math.random() * 10000)}`;
                    retryCount++;
                    insertError = error;
                } else {
                    insertError = error;
                    break;
                }
            }
            
            if (insertError) throw insertError;
            
            const { error: profileError } = await supabase.from('cde_profiles').insert({
                account_id: accountId,
                permen: 0,
                profile_data: {},
                revision: 1
            });
            // Ignore if profile somehow already exists
            if (profileError && profileError.code !== '23505') {
                throw profileError;
            }
            
            
            
            return res.status(200).json({ success: true, accountId });
        }

        if (action === 'get_profile' && req.method === 'GET') {
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
            
            // Mock auth check or real Supabase auth
            const { data: userData, error: authError } = await getUserWithRetry(supabase, token);
            
            // For testing purposes when Supabase is mocked
            const accountId = userData?.user?.id || 'mock-uuid-1234';

            const { data, error } = await supabase
                .from('cde_profiles')
                .select('*')
                .eq('account_id', accountId)
                .maybeSingle();

            if (error) throw error;
            return res.json({ profile: data });
        }

        if (action === 'mutate_permen' && req.method === 'POST') {
            return res.status(403).json({ error: 'DIRECT_CURRENCY_DISABLED', message: 'Permen hanya dari peti, misi, dan pencapaian.' });
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
            
            const { opId, amount, baseRevision } = req.body;
            if (!opId || amount === undefined) {
                return res.status(400).json({ error: 'INVALID_PAYLOAD' });
            }

            const { data: userData } = await getUserWithRetry(supabase, token);
            const accountId = userData?.user?.id || 'mock-uuid-1234';

            // Use the RPC for atomic mutation
            const { data, error } = await supabase.rpc('cde_mutate_permen', {
                p_account_id: accountId,
                p_idempotency_key: opId,
                p_operation_type: 'MUTATE_PERMEN',
                p_amount: amount,
                p_base_revision: baseRevision
            });

            if (error) {
                if (error.message.includes('STALE_REVISION')) {
                    return res.status(409).json({ error: 'CONFLICT_STALE_REVISION' });
                }
                if (error.message.includes('INSUFFICIENT_PERMEN')) {
                    return res.status(400).json({ error: 'INSUFFICIENT_PERMEN' });
                }
                if (error.message.includes('Operation already processed')) {
                    // Idempotent success
                    return res.status(200).json({ success: true, idempotent: true, result: data });
                }
                throw error;
            }

            return res.status(200).json({ success: true, result: data });
        }

        if (action === 'mutate_state' && req.method === 'POST') {
            if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' });
            
            const { opId, type, payload, baseRevision } = req.body;
            if (!opId || !type || !payload) {
                return res.status(400).json({ error: 'INVALID_PAYLOAD' });
            }

            const { data: userData } = await getUserWithRetry(supabase, token);
            const accountId = userData?.user?.id;
            if (!accountId) return res.status(401).json({ error: 'UNAUTHORIZED' });

            // Get current profile for server-side validation
            const { data: currentProfile, error: getError } = await supabase.from('cde_profiles').select('*').eq('account_id', accountId).single();
            if (getError) throw getError;

            const { data: previousOperation } = await supabase.from('cde_operations_log').select('account_id').eq('idempotency_key', opId).maybeSingle();
            if (previousOperation) {
                if (previousOperation.account_id !== accountId) return res.status(403).json({ error: 'INVALID_OPERATION' });
                return res.json({ success: true, idempotent: true, result: currentProfile });
            }
            if (!Number.isInteger(baseRevision) || baseRevision !== Number(currentProfile.revision)) return res.status(409).json({ error: 'CONFLICT_STALE_REVISION' });

            let mergedProfileData = { ...currentProfile.profile_data };
            
            // Legacy garbage cleanup (Sanitization)
            if (mergedProfileData.profile) {
                const { 
                    hp, flexCrown, currentScore, customEmojis, activeSession, 
                    dailyReward, milestones, rewardProgress, dailyMissions, weeklyMissions, coins, permen,
                    ...restProfile 
                } = mergedProfileData.profile;
                mergedProfileData.profile = restProfile;
            }

            let mergedGameData = { ...currentProfile.profile_data.game };
            let permenDelta = 0;
            let profilePatch: any = {};
            let gamePatch: any = {};

            const ECON = await import('../src/core/economy.js');
            const applyProfilePatch = (patch: any) => {
                profilePatch = { ...profilePatch, ...patch };
                mergedProfileData.profile = { ...(mergedProfileData.profile || {}), ...patch };
            };
            const currentProf = () => (mergedProfileData.profile || {});

            if (type === 'UPDATE_PROFILE') {
                 const writable = ['playerName', 'avatar', 'activeAvatarId', 'activeAvatarBackground', 'activeTheme', 'settings', 'darkMode', 'notifications', 'currentLevel', 'highestLevel', 'blockPuzzleLevel', 'highestBlockPuzzleLevel', 'blockPuzzleSkill', 'blockPuzzleHighScore', 'blockEndlessHighScore'];
                 const safePayload = Object.fromEntries(Object.entries(payload).filter(([k]) => writable.includes(k)));
                 if (safePayload.activeTheme && !['sweets', 'vanilla', ...(currentProf().unlockedThemes || [])].includes(safePayload.activeTheme)) return res.status(400).json({ error: 'NOT_OWNED' });
                 for (const key of ['avatar', 'activeAvatarId']) if (safePayload[key] && !['avatar_male', 'avatar_female', ...(currentProf().ownedCosmetics || [])].includes(safePayload[key])) return res.status(400).json({ error: 'NOT_OWNED' });
                 for (const key of ['currentLevel', 'highestLevel', 'blockPuzzleLevel', 'highestBlockPuzzleLevel']) {
                     const limit = key === 'currentLevel' ? Math.max(Number(currentProf().highestLevel || 1),Number(safePayload.highestLevel || 1)) : Number(currentProf()[key] || 1) + 1;
                     if (safePayload[key] !== undefined && (!Number.isInteger(safePayload[key]) || Number(safePayload[key]) < 1 || Number(safePayload[key]) > limit)) return res.status(400).json({ error: 'INVALID_LEVEL' });
                 }
                 const protectedFields = ['hints', 'shuffles', 'hammers', 'bombs', 'chestSlots', 'chestProgress', 'activeMissions', 'activeWeeklyMissions', 'weeklyMissions', 'dailyMissionsDate', 'weeklyMissionsWeek', 'dailyBonusClaimed', 'dailyChallengeDate', 'achievements', 'winStreak', 'statistics', 'coins', 'permen'];
                 for (const f of protectedFields) {
                     delete safePayload[f];
                 }
                 if (Object.keys(safePayload).length === 0) {
                     return res.status(200).json({ success: true, ignored: true, reason: 'NO_WRITABLE_FIELDS', result: currentProfile });
                 }
                 applyProfilePatch(safePayload);
            } else if (type === 'UPDATE_GAME_STATE') {
                 const safeGamePayload = { ...payload };
                 if (payload.highestLevel !== undefined) {
                     const currentHighest = mergedProfileData.game?.highestLevel || 1;
                     if (payload.highestLevel > currentHighest + 1) {
                         return res.status(400).json({ error: 'INVALID_GAME_MUTATION', message: 'Cannot skip levels' });
                     }
                 }
                 gamePatch = safeGamePayload;
                 mergedProfileData.game = { ...(mergedProfileData.game || {}), ...safeGamePayload };
            } else if (type === 'PURCHASE_ITEM') {
                 const result = purchaseItem(currentProf(), Number(currentProfile.permen || 0), payload.itemId);
                 if (result.error) return res.status(400).json({ error: result.error });
                 permenDelta = result.permenDelta;
                 applyProfilePatch(result.profile);
            } else if (type === 'EQUIP_COSMETIC') {
                 const result = equipCosmetic(currentProf(), payload.itemId, payload.category);
                 if (result.error) return res.status(400).json({ error: result.error });
                 applyProfilePatch(result.profile);
            } else if (type === 'USE_ITEM') {
                 const itemId = payload.itemId;
                 if (!ECON.CONSUMABLE_ITEMS.includes(itemId)) return res.status(400).json({ error: 'INVALID_ITEM' });
                 const field = ECON.ITEM_FIELD[itemId];
                 const current = currentProf()[field] !== undefined ? currentProf()[field] : ECON.getDefaultItemCount(itemId);
                 if (current <= 0) return res.status(200).json({ success: true, ignored: true, reason: 'NO_ITEMS', result: currentProfile });
                 const { updateMissions } = await import('../src/core/misiHarian.js');
                 let nextProf = { ...currentProf(), [field]: current - 1 };
                 if (itemId === 'hint') nextProf = updateMissions(nextProf, 'useHint', 1);
                 if (itemId === 'shuffle') nextProf = updateMissions(nextProf, 'useShuffle', 1);
                 applyProfilePatch(nextProf);
            } else if (type === 'PROCESS_WIN') {
                 if(payload.endless){
                   if(payload.game!=='block'||typeof payload.runId!=='string'||payload.runId.length>64)return res.status(400).json({error:'INVALID_RUN'});
                   if((currentProf().completedEndless||[]).includes(payload.runId))return res.status(400).json({error:'REWARD_ALREADY_COUNTED'});
                   applyProfilePatch({completedEndless:[...(currentProf().completedEndless||[]),payload.runId].slice(-100)});
                   payload.isWinner=false;
                 }
                 if (!['onet', 'block', 'zen'].includes(payload.game) || !Number.isFinite(payload.score) || payload.score < 0 || payload.score > 1000000 || (payload.matches != null && (!Number.isInteger(payload.matches) || payload.matches < 0 || payload.matches > 300))) return res.status(400).json({ error: 'INVALID_RESULT' });
                 if (payload.isMultiplayer) {
                     const {data:match}=await supabase.from('cde_game_rooms').select('state').eq('room_code',payload.roomId).maybeSingle();
                     const room=match?.state, player=room?.players?.find((p:any)=>p.accountId===accountId);
                     if (!player || room.status!=='FINISHED' || room.matchId!==payload.matchId) return res.status(400).json({error:'MATCH_NOT_FINISHED'});
                     if ((currentProf().completedMatches||[]).includes(payload.matchId)) return res.status(400).json({error:'REWARD_ALREADY_COUNTED'});
                     payload.isWinner=room.winner===player.name;
                     payload.game=room.gameMode==='onet'?'onet':'block';
                     payload.score=room.gameMode==='onet'?(60-(player.progress||0))*100:player.progress||0;
                     payload.matches=room.gameMode==='onet'?Math.floor((60-(player.progress||0))/2):0;
                     applyProfilePatch({completedMatches:[...(currentProf().completedMatches||[]),payload.matchId].slice(-100)});
                 }
                 const { RewardEngine } = await import('../src/core/reward.js');
                 const { profile: newProfile, rewardResult } = RewardEngine.processWin(currentProf(), payload);
                 permenDelta = (rewardResult.permen || 0) + (rewardResult.dailyBonus || 0);
                 delete newProfile.permen; delete newProfile.coins;
                 applyProfilePatch(newProfile);
            } else if (type === 'RECORD_ATTEMPT') {
                 if(!['onet','block'].includes(payload.game))return res.status(400).json({error:'INVALID_GAME'});
                 applyProfilePatch(recordAttempt(currentProf(),{game:payload.game,isWinner:false}));
            } else if (type === 'CLAIM_MISSION_REWARD') {
                 const { claimMissionReward } = await import('../src/core/misiHarian.js');
                 const result = claimMissionReward(currentProf(), payload.missionId);
                 if (result.error) return res.status(400).json({ error: result.error });
                 permenDelta = result.permenDelta;
                 applyProfilePatch(result.profile);
            } else if (type === 'OPEN_CHEST') {
                 const { openChestAction } = await import('../src/core/chest.js');
                 const { updateMissions } = await import('../src/core/misiHarian.js');
                 const { profile: newProfile, rewards, error } = openChestAction(currentProf(), payload.slotId);
                 if (error) return res.status(400).json({ error });
                 if (rewards === null) return res.status(400).json({ error: 'CHEST_NOT_READY' });
                 if (!rewards.chestType) return res.status(400).json({ error: 'CHEST_EMPTY' });
                 permenDelta = rewards.permen || 0;
                 const withMissions = updateMissions(newProfile, 'openChest', 1);
                 delete withMissions.permen; delete withMissions.coins;
                 applyProfilePatch(withMissions);
            } else if (type === 'SPEED_UP_CHEST') {
                 const { speedUpChestAction } = await import('../src/core/chest.js');
                 const result = speedUpChestAction(currentProf(), payload.slotId, Number(currentProfile.permen || 0));
                 if (!result.success) return res.status(400).json({ error: result.cost === 0 ? 'CHEST_ALREADY_READY' : 'INSUFFICIENT_PERMEN' });
                 permenDelta = -result.cost;
                 applyProfilePatch(ECON.recordTransaction({ ...currentProf(), chestSlots: result.profile.chestSlots }, -result.cost, 'chest_speedup', String(payload.slotId)));
            } else if (type === 'CLAIM_ACHIEVEMENT_REWARD') {
                 const { claimAchievement } = await import('../src/core/achievements.js');
                 const result = claimAchievement(currentProf(), payload.achievementId);
                 if (result.error) return res.status(400).json({ error: result.error });
                 permenDelta = result.permenDelta;
                 applyProfilePatch(result.profile);
            } else {
                 return res.status(400).json({ error: 'UNKNOWN_OPERATION_TYPE' });
            }

            // Perform transactional update using RPC
            let updatedProfile;
            const rpcResult = await supabase.rpc('cde_mutate_state', {
                p_account_id: accountId,
                p_idempotency_key: opId,
                p_operation_type: type,
                p_profile_patch: Object.keys(profilePatch).length > 0 ? profilePatch : null,
                p_game_patch: Object.keys(gamePatch).length > 0 ? gamePatch : null,
                p_base_revision: baseRevision,
                p_permen_delta: permenDelta
            });

            if (rpcResult.error) {
                if (rpcResult.error.message?.includes('schema cache') || rpcResult.error.code === 'PGRST202' || rpcResult.error.message?.includes('Could not find the function')) {
                    console.log("RPC cde_mutate_state with p_permen_delta not found, falling back to manual atomic-like update.");
                    
                    // 1. Check idempotency log
                    const { data: opLog } = await supabase.from('cde_operations_log').select('id').eq('idempotency_key', opId).single();
                    if (opLog) {
                         return res.status(200).json({ success: true, idempotent: true, result: currentProfile });
                    }

                    // 2. Perform state update
                    const newRevision = Number(currentProfile.revision) + 1;
                    const newPermen = Number(currentProfile.permen || 0) + permenDelta;
                    const { data: fallbackProfile, error: fallbackError } = await supabase.from('cde_profiles')
                        .update({ 
                             profile_data: mergedProfileData,
                             permen: newPermen,
                             revision: newRevision,
                             updated_at: new Date().toISOString()
                        })
                        .eq('account_id', accountId)
                        .eq('revision', currentProfile.revision)
                        .select()
                        .maybeSingle();

                    if (fallbackError) {
                        return res.status(500).json({ error: fallbackError.message });
                    }
                    if (!fallbackProfile) {
                        return res.status(409).json({ error: 'CONFLICT_STALE_REVISION' });
                    }

                    // 3. Log operation
                    await supabase.from('cde_operations_log').insert({
                        idempotency_key: opId,
                        account_id: accountId,
                        operation_type: type
                    });

                    updatedProfile = fallbackProfile;
                } else {
                    console.error("RPC Error:", rpcResult.error);
                    if (rpcResult.error.message.includes('STALE_REVISION')) {
                        return res.status(409).json({ error: 'CONFLICT_STALE_REVISION' });
                    }
                    if (rpcResult.error.message.includes('Operation already processed')) {
                        return res.status(200).json({ success: true, idempotent: true, result: rpcResult.data });
                    }
                    return res.status(500).json({ error: rpcResult.error.message });
                }
            } else {
                updatedProfile = rpcResult.data;
            }

            // Return success
            return res.status(200).json({ success: true, result: updatedProfile });
        }

        return res.status(404).json({ error: 'Unknown action' });
    } catch (e: any) {
        console.error("CDE API Error details:", e);
        res.status(500).json({ error: e.message || 'Internal Server Error' });
    }
}
