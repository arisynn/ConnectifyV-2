import type { Request, Response } from 'express';
import { getSupabase } from './supabase.js';
import { MultiplayerBankEngine } from '../MultiplayerBankEngine.js';

const rooms = new Map<string, any>();

function logMultiplayerEvent(event: string, roomId: string, details: any = {}) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        module: 'Multiplayer',
        event,
        roomId,
        ...details
    }));
}

async function updatePlayerBalance(playerName: string, currency: string, delta: number) {
    const supabase = getSupabase();
    if (!supabase) {
        logMultiplayerEvent('BALANCE_UPDATE_SKIPPED', '', { reason: 'Supabase missing', playerName, currency, delta });
        return 0;
    }
    
    try {
        const { data, error } = await supabase.from('profiles').select('profile_data').eq('player_name', playerName).maybeSingle();
        if (error || !data) {
            logMultiplayerEvent('BALANCE_UPDATE_FAILED', '', { reason: 'Profile not found', playerName, error: error?.message });
            return 0;
        }
        
        let profileData = data.profile_data || {};
        if (typeof profileData === 'string') {
            try { profileData = JSON.parse(profileData); } catch(e){}
        }
        
        if (!profileData.gameData) profileData.gameData = {};
        
        let currentBalance = profileData.gameData[currency] || 0;
        if (delta < 0 && currentBalance + delta < 0) {
            throw new Error(`INSUFFICIENT_BALANCE: Saldo tidak mencukupi untuk transaksi ini. (Butuh: ${-delta}, Dimiliki: ${currentBalance})`);
        }
        let newBalance = currentBalance + delta;
        
        profileData.gameData[currency] = newBalance;
        
        // CRITICAL FOR SAVE ENGINE V2: Increment revision so client gets 409 Conflict if they try to save an old state
        if (profileData._engine && typeof profileData._engine.revision === 'number') {
            profileData._engine.revision += 1;
            profileData._engine.updatedAt = Date.now();
        }
        
        await supabase.from('profiles').update({ profile_data: profileData }).eq('player_name', playerName);
        logMultiplayerEvent('BALANCE_UPDATED', '', { playerName, currency, oldBalance: currentBalance, newBalance, delta, newRevision: profileData._engine?.revision });
        return newBalance;
    } catch (e: any) {
        logMultiplayerEvent('BALANCE_UPDATE_ERROR', '', { playerName, error: e.message });
        if (e.message.includes('INSUFFICIENT_BALANCE')) throw e;
        throw new Error('TRANSACTION_FAILED: ' + e.message);
    }
}

export default async function handler(req: Request, res: Response) {
    try {
        // Prevent caching for multiplayer endpoints
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        const action = req.query.action || req.body.action;
        
        if (action === 'create') {
            const { host, level, theme, gameMode } = req.body;
            if (!host) return res.status(400).json({ error: 'MISSING_HOST: Host tidak ditemukan.' });
            
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const room = {
                id: roomId,
                host,
                status: 'WAITING',
                revision: 1, // Add revision for state conflict resolution
                players: [{ name: host, level, ready: false, theme, lastSync: Date.now() }],
                mode: 'Friendly Match',
                gameMode: gameMode || 'onet',
                wager: null
            };
            rooms.set(roomId, room);
            logMultiplayerEvent('ROOM_CREATED', roomId, { host, mode: room.mode });
            return res.json(room);
        }
        
        if (action === 'join') {
            let { roomId, name, level, theme } = req.body;
            if (roomId) roomId = roomId.trim().toUpperCase();
            if (!roomId || !name) return res.status(400).json({ error: 'MISSING_PARAMS: Parameter tidak lengkap.' });
            
            const room = rooms.get(roomId);
            if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
            
            if (room.status !== 'WAITING' && room.status !== 'STARTING') {
                // If they are rejoining, allow them if they are already in the room
                if (!room.players.find((p: any) => p.name === name)) {
                    return res.status(400).json({ error: 'ROOM_PLAYING: Room sedang dalam permainan.' });
                }
            }
            
            if (room.players.length >= 2 && !room.players.find((p: any) => p.name === name)) {
                return res.status(400).json({ error: 'ROOM_FULL: Room sudah penuh.' });
            }
            
            const existingPlayer = room.players.find((p: any) => p.name === name);
            if (existingPlayer) {
                existingPlayer.level = level;
                existingPlayer.theme = theme;
                existingPlayer.ready = false;
                existingPlayer.lastSync = Date.now();
                logMultiplayerEvent('PLAYER_REJOINED', roomId, { name });
            } else {
                room.players.push({ name, level, ready: false, theme, lastSync: Date.now() });
                logMultiplayerEvent('PLAYER_JOINED', roomId, { name });
            }
            
            room.players.forEach((p: any) => p.ready = false);
            room.revision += 1;
            return res.json(room);
        }
        
        if (action === 'leave') {
            const { roomId, name } = req.body;
            if (!roomId || !name) return res.status(400).json({ error: 'MISSING_PARAMS: Parameter tidak lengkap.' });
            
            const room = rooms.get(roomId);
            if (room) {
                if (room.status === 'PLAYING' && !room.winner) {
                    // Leaving during active match counts as disconnect/forfeit
                    const opponent = room.players.find((p: any) => p.name !== name);
                    if (opponent) {
                        room.winner = opponent.name;
                        room.finishReason = 'DISCONNECT';
                        logMultiplayerEvent('MATCH_FORFEITED', roomId, { leaver: name, winner: opponent.name });
                        
                        if (room.mode === 'Match Berhadiah' && room.wager && room.payoutProcessed !== room.matchId) {
                            room.payoutProcessed = room.matchId;
                            try {
                                const amount = room.wager.amount;
                                const curr = room.wager.currency;
                                const totalPot = amount * 2;
                                const tax = Math.floor(amount * 0.1);
                                const payout = totalPot - tax;
                                
                                logMultiplayerEvent('SETTLEMENT', roomId, { matchId: room.matchId, winner: opponent.name, totalPot, tax, payout, currency: curr });
                                
                                const winnerBal = await updatePlayerBalance(opponent.name, curr, payout);
                                room.wager.settledBalances = room.wager.settledBalances || {};
                                room.wager.settledBalances[opponent.name] = winnerBal;
                            } catch (e: any) {
                                logMultiplayerEvent('PAYOUT_FAILED', roomId, { error: e.message });
                            }
                        }
                        
                        room.status = 'FINISHED';
                        room.revision += 1;
                    }
                }
                
                MultiplayerBankEngine.cancelRoomOffers(roomId);
                room.mode = 'Friendly Match';
                room.wager = null;
                room.players = room.players.filter((p: any) => p.name !== name);
                logMultiplayerEvent('PLAYER_LEFT', roomId, { name, remaining: room.players.length });
                
                if (room.players.length === 0) {
                    rooms.delete(roomId);
                    logMultiplayerEvent('ROOM_DESTROYED', roomId, { reason: 'empty' });
                } else {
                    if (room.host === name) {
                        room.host = room.players[0].name;
                        MultiplayerBankEngine.cancelRoomOffers(roomId);
                        room.mode = 'Friendly Match';
                        room.wager = null;
                        logMultiplayerEvent('HOST_MIGRATED', roomId, { newHost: room.host });
                    }
                    room.players.forEach((p: any) => p.ready = false);
                    if (room.status === 'STARTING' || room.status === 'STARTING') {
                        room.status = 'WAITING';
                        if (room.mode === 'Match Berhadiah' && room.wagerLocked) {
                            // Refund wager if locked during preparing
                            try {
                                const p1 = room.players[0]?.name;
                                if (p1) await updatePlayerBalance(p1, room.wager.currency, room.wager.amount);
                            } catch (e: any) {
                                logMultiplayerEvent('REFUND_FAILED', roomId, { error: e.message });
                            }
                            room.wagerLocked = false;
                        }
                    }
                    room.revision += 1;
                }
            }
            return res.json({ success: true });
        }
        
        if (action === 'sync') {
            const { roomId, name, level, theme, progress, matchId } = req.query;
            let room;
            
            if (roomId) {
                room = rooms.get(roomId as string);
            } else if (name) {
                // Find room by player name
                for (const r of rooms.values()) {
                    if (r.players && r.players.some((p: any) => p.name === name)) {
                        room = r;
                        break;
                    }
                }
            }
            
            if (!room) {
                return res.status(404).json({ error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
            }
            
            const now = Date.now();
            if (room && room.players) {
                room.players.forEach((p: any) => {
                    if (p.lastSync && now - p.lastSync > 3000 && now - p.lastSync <= 15000) {
                        p.connection = 'RECONNECTING';
                    } else if (p.lastSync && now - p.lastSync <= 3000) {
                        p.connection = 'CONNECTED';
                    }
                });
            }
            if (name && room.players) {
                const p = room.players.find((p: any) => p.name === name);
                if (p) {
                    if (level) p.level = Number(level);
                    if (theme) p.theme = theme as string;
                    if (progress !== undefined) {
                        if (room.status === 'PLAYING' && matchId !== room.matchId) {
                            // stale progress from an old match, ignore
                        } else {
                            p.progress = Number(progress);
                        }
                    }
                    p.lastSync = now;
                    p.connection = 'CONNECTED';
                }
            }
            
            // Rehydrate / Check for disconnects
            if (room.status === 'PLAYING' && !room.winner) {
                for (const p of room.players) {
                    if (p.lastSync && (now - p.lastSync > 15000)) { // 15 seconds grace period
                        if (room.startAt && now >= room.startAt) {
                            const opponent = room.players.find((op: any) => op.name !== p.name);
                            if (opponent) {
                                room.winner = opponent.name;
                                room.finishReason = 'DISCONNECT';
                                logMultiplayerEvent('MATCH_ENDED_DISCONNECT', room.id, { disconnectedPlayer: p.name, winner: opponent.name });
                                
                                if (room.mode === 'Match Berhadiah' && room.wager && room.payoutProcessed !== room.matchId) {
                                    room.payoutProcessed = room.matchId;
                                    try {
                                        const amount = room.wager.amount;
                                        const curr = room.wager.currency;
                                        const totalPot = amount * 2;
                                        const tax = Math.floor(amount * 0.1);
                                        const payout = totalPot - tax;
                                        
                                        logMultiplayerEvent('SETTLEMENT', room.id, { matchId: room.matchId, winner: opponent.name, totalPot, tax, payout, currency: curr });
                                        
                                        const winnerBal = await updatePlayerBalance(opponent.name, curr, payout);
                                        room.wager.settledBalances = room.wager.settledBalances || {};
                                        room.wager.settledBalances[opponent.name] = winnerBal;
                                    } catch (e: any) {
                                        logMultiplayerEvent('PAYOUT_FAILED', room.id, { error: e.message });
                                    }
                                }
                                
                                room.status = 'FINISHED';
                                room.revision += 1;
                            }
                        } else {
                            // Disconnected during countdown - revert to lobby
                            room.status = 'WAITING';
                            room.revision += 1;
                            logMultiplayerEvent('COUNTDOWN_ABORTED_DISCONNECT', room.id, { disconnectedPlayer: p.name });
                            
                            if (room.mode === 'Match Berhadiah' && room.wagerLocked) {
                                try {
                                    const memberName = room.players.find((player: any) => player.name !== room.host)?.name;
                                    if (room.host) await updatePlayerBalance(room.host, room.wager.currency, room.wager.amount);
                                    if (memberName) await updatePlayerBalance(memberName, room.wager.currency, room.wager.amount);
                                } catch (e: any) {
                                    logMultiplayerEvent('REFUND_FAILED', room.id, { error: e.message });
                                }
                                room.wagerLocked = false;
                            }
                            room.players.forEach((player: any) => player.ready = false);
                        }
                    }
                }
            }
            
            return res.json(room);
        }
        
        if (action === 'report_loss') {
            const { roomId, name } = req.body;
            const room = rooms.get(roomId);
            if (room && room.status === 'PLAYING' && !room.winner) {
                const winnerName = room.players.find((p: any) => p.name !== name)?.name;
                if (winnerName) {
                    room.winner = winnerName;
                    room.finishReason = 'OPPONENT_LOST';
                    logMultiplayerEvent('MATCH_COMPLETED', roomId, { winner: winnerName, matchId: room.matchId });
                    
                    if (room.mode === 'Match Berhadiah' && room.wager && room.payoutProcessed !== room.matchId) {
                        room.payoutProcessed = room.matchId;
                        try {
                            const amount = room.wager.amount;
                            const curr = room.wager.currency;
                            
                            const totalPot = amount * 2;
                            const tax = Math.floor(amount * 0.1);
                            const payout = totalPot - tax;
                            
                            logMultiplayerEvent('SETTLEMENT', roomId, { matchId: room.matchId, winner: winnerName, totalPot, tax, payout, currency: curr });
                            
                            const winnerBal = await updatePlayerBalance(winnerName, curr, payout);
                            const loserBal = await updatePlayerBalance(name, curr, 0);
                            
                            room.wager.settledBalances = room.wager.settledBalances || {};
                            room.wager.settledBalances[winnerName] = winnerBal;
                            room.wager.settledBalances[name] = loserBal;
                        } catch (e: any) {
                            logMultiplayerEvent('PAYOUT_FAILED', roomId, { error: e.message });
                        }
                    }
                    
                    room.status = 'FINISHED';
                    room.revision += 1;
                }
            }
            return res.json(room || { error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
        }

        if (action === 'complete') {
            const { roomId, name } = req.body;
            const room = rooms.get(roomId);
            if (room && room.status === 'PLAYING' && !room.winner) {
                room.winner = name;
                room.finishReason = 'BOARD_COMPLETED';
                logMultiplayerEvent('MATCH_COMPLETED', roomId, { winner: name, matchId: room.matchId });
                
                if (room.mode === 'Match Berhadiah' && room.wager && room.payoutProcessed !== room.matchId) {
                    room.payoutProcessed = room.matchId; // use matchId as idempotency key
                    try {
                        const amount = room.wager.amount;
                        const curr = room.wager.currency;
                        
                        const totalPot = amount * 2;
                        const tax = Math.floor(amount * 0.1);
                        const payout = totalPot - tax;
                        
                        logMultiplayerEvent('SETTLEMENT', roomId, { matchId: room.matchId, winner: name, totalPot, tax, payout, currency: curr });
                        
                        const winnerBal = await updatePlayerBalance(name, curr, payout);
                        const loserName = room.players.find((p: any) => p.name !== name)?.name;
                        const loserBal = loserName ? await updatePlayerBalance(loserName, curr, 0) : 0;
                        
                        room.wager.settledBalances = room.wager.settledBalances || {};
                        room.wager.settledBalances[name] = winnerBal;
                        if (loserName) room.wager.settledBalances[loserName] = loserBal;
                    } catch (e: any) {
                        logMultiplayerEvent('PAYOUT_FAILED', roomId, { error: e.message });
                    }
                }
                
                room.status = 'FINISHED';
                room.revision += 1;
            }
            return res.json(room || { error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
        }

        if (action === 'time_up') {
            const { roomId, name } = req.body;
            const room = rooms.get(roomId);
            if (room && room.status === 'PLAYING' && !room.winner) {
                const me = room.players.find((p: any) => p.name === name);
                const opponent = room.players.find((p: any) => p.name !== name);
                let winnerName = null;
                
                if (me && opponent) {
                    if ((me.progress || 0) > (opponent.progress || 0)) {
                        winnerName = me.name;
                    } else if ((opponent.progress || 0) > (me.progress || 0)) {
                        winnerName = opponent.name;
                    } else {
                        winnerName = 'DRAW';
                    }
                }

                room.winner = winnerName;
                room.finishReason = 'TIME_UP';
                logMultiplayerEvent('MATCH_COMPLETED', roomId, { winner: winnerName, matchId: room.matchId });
                
                if (room.mode === 'Match Berhadiah' && room.wager && room.payoutProcessed !== room.matchId) {
                    room.payoutProcessed = room.matchId;
                    try {
                        const amount = room.wager.amount;
                        const curr = room.wager.currency;
                        
                        room.wager.settledBalances = room.wager.settledBalances || {};

                        if (winnerName === 'DRAW') {
                            // Refund wager on draw
                            logMultiplayerEvent('SETTLEMENT_REFUND', roomId, { matchId: room.matchId });
                            if (me?.name) room.wager.settledBalances[me.name] = await updatePlayerBalance(me.name, curr, amount);
                            if (opponent?.name) room.wager.settledBalances[opponent.name] = await updatePlayerBalance(opponent.name, curr, amount);
                        } else {
                            const totalPot = amount * 2;
                            const tax = Math.floor(amount * 0.1);
                            const payout = totalPot - tax;
                            
                            logMultiplayerEvent('SETTLEMENT', roomId, { matchId: room.matchId, winner: winnerName, totalPot, tax, payout, currency: curr });
                            
                            if (winnerName) {
                                room.wager.settledBalances[winnerName] = await updatePlayerBalance(winnerName, curr, payout);
                            }
                            const loserName = winnerName === me?.name ? opponent?.name : me?.name;
                            if (loserName) {
                                room.wager.settledBalances[loserName] = await updatePlayerBalance(loserName, curr, 0);
                            }
                        }
                    } catch (e: any) {
                        logMultiplayerEvent('PAYOUT_FAILED', roomId, { error: e.message });
                    }
                }
                
                room.status = 'FINISHED';
                room.revision += 1;
            }
            return res.json(room || { error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
        }

        if (action === 'rematch') {
            const { roomId, name } = req.body;
            if (!roomId || !name) return res.status(400).json({ error: 'MISSING_PARAMS: Parameter tidak lengkap.' });
            
            const room = rooms.get(roomId);
            if (room) {
                if (room.status === 'FINISHED') {
                    room.status = 'WAITING';
                    room.winner = null;
                    room.finishReason = null;
                    room.matchId = null;
                    // Reset to friendly match so they must wager again
                    room.mode = 'Friendly Match';
                    room.wager = null;
                    room.wagerLocked = false;
                    MultiplayerBankEngine.cancelRoomOffers(roomId);
                    room.players.forEach((p: any) => p.ready = false);
                    room.revision += 1;
                    logMultiplayerEvent('ROOM_REMATCH', roomId, { initiatedBy: name });
                }
                const p = room.players.find((p: any) => p.name === name);
                if (p) {
                    p.ready = true;
                    p.progress = 0;
                }
                room.revision += 1;
            }
            return res.json(room || { error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
        }
        
        if (action === 'ready') {
            const { roomId, name, ready } = req.body;
            if (!roomId || !name) return res.status(400).json({ error: 'MISSING_PARAMS: Parameter tidak lengkap.' });
            
            const room = rooms.get(roomId);
            if (room) {
                const p = room.players.find((p: any) => p.name === name);
                if (p && p.ready !== ready) {
                    p.ready = ready;
                    room.revision += 1;
                    logMultiplayerEvent('PLAYER_READY_CHANGED', roomId, { name, ready });
                }
            }
            return res.json(room || { error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
        }

        if (action === 'change_mode') {
            const { roomId, host, mode } = req.body;
            const room = rooms.get(roomId);
            if (!room || room.host !== host) return res.status(403).json({ error: 'FORBIDDEN: Hanya host yang bisa melakukan ini.' });
            
            if (room.mode !== mode) {
                room.mode = mode;
                room.revision += 1;
                if (mode === 'Friendly Match') room.wager = null;
                logMultiplayerEvent('MODE_CHANGED', roomId, { newMode: mode });
            }
            return res.json(room);
        }

        if (action === 'propose_wager') {
            const { roomId, host, currency, amount } = req.body;
            
            if (typeof amount !== 'number' || amount <= 0 || isNaN(amount) || !Number.isInteger(amount)) {
                return res.status(400).json({ error: 'INVALID_WAGER: Nominal taruhan tidak valid.' });
            }
            if (currency !== 'coins' && currency !== 'gems') {
                return res.status(400).json({ error: 'INVALID_CURRENCY: Mata uang tidak valid.' });
            }
            
            const room = rooms.get(roomId);
            if (!room || room.host !== host) return res.status(403).json({ error: 'FORBIDDEN: Hanya host yang bisa melakukan ini.' });
            
            const member = room.players.find((p: any) => p.name !== host);
            if (!member) {
                return res.status(400).json({ error: 'PLAYER_LEFT: Pemain sudah meninggalkan room.' });
            }
            
            try {
                const offer = await MultiplayerBankEngine.createOffer(roomId, host, member.name, amount, currency);
                room.mode = 'Match Berhadiah';
                room.wager = {
                    offerId: offer.offerId,
                    currency,
                    amount,
                    hostAgreed: true,
                    memberAgreed: false,
                    version: Date.now()
                };
                room.activeOffer = offer;
                room.revision += 1;
                logMultiplayerEvent('WAGER_PROPOSED', roomId, { host, currency, amount, offer });
                return res.json(room);
            } catch (e: any) {
                return res.status(400).json({ error: e.message || 'Gagal membuat offer.' });
            }
        }
        
        if (action === 'cancel_wager') {
            const { roomId, host, offerId } = req.body;
            const room = rooms.get(roomId);
            if (!room || room.host !== host) return res.status(403).json({ error: 'FORBIDDEN: Hanya host yang bisa membatalkan.' });
            
            try {
                const offer = MultiplayerBankEngine.cancelOffer(offerId, host);
                room.mode = 'Friendly Match';
                room.wager = null;
                room.activeOffer = offer;
                room.revision += 1;
                logMultiplayerEvent('WAGER_CANCELLED', roomId, { host, offerId });
                return res.json(room);
            } catch (e: any) {
                return res.status(400).json({ error: e.message || 'Gagal membatalkan offer.' });
            }
        }
        if (action === 'accept_wager') {
            const { roomId, name, offerId } = req.body;
            const room = rooms.get(roomId);
            if (!room) return res.status(404).json({ error: 'ROOM_CLOSED: Room sudah ditutup.' });
            if (!room.wager || room.wager.offerId !== offerId) return res.status(400).json({ error: 'OFFER_ALREADY_PROCESSED: Tawaran sudah kedaluwarsa atau berubah.' });
            
            try {
                const offer = await MultiplayerBankEngine.acceptOffer(offerId, name);
                
                try {
                    // Deduct balances immediately and set up bank
                    const { bank, newBalances } = await MultiplayerBankEngine.setupBank(offer, updatePlayerBalance);
                    
                    room.wager.memberAgreed = true;
                    room.wager.settledBalances = newBalances;
                    room.activeOffer = offer;
                    room.wagerLocked = true;
                    room.revision += 1;
                    logMultiplayerEvent('WAGER_ACCEPTED', roomId, { name, offerId });
                    return res.json(room);
                } catch (bankError: any) {
                    offer.status = 'PENDING';
                    offer.guestId = undefined;
                    throw bankError;
                }
            } catch (e: any) {
                return res.status(400).json({ error: e.message || 'Gagal menerima offer.' });
            }
        }
        if (action === 'reject_wager') {
            const { roomId, name, offerId } = req.body;
            const room = rooms.get(roomId);
            if (!room) return res.status(404).json({ error: 'ROOM_CLOSED: Room sudah ditutup.' });
            
            try {
                const offer = MultiplayerBankEngine.rejectOffer(offerId, name);
                room.wager = null;
                room.mode = 'Friendly Match';
                room.activeOffer = offer;
                room.revision += 1;
                logMultiplayerEvent('WAGER_REJECTED', roomId, { name, offerId });
                return res.json(room);
            } catch (e: any) {
                return res.status(400).json({ error: e.message || 'Gagal menolak offer.' });
            }
        }
        if (action === 'start_match') {
            const { roomId, host, board } = req.body;
            const room = rooms.get(roomId);
            if (!room || room.host !== host) return res.status(403).json({ error: 'INVALID_ROOM: Room tidak valid atau kamu bukan host.' });
            
            // ATOMIC CHECK: Ensure we don't start multiple times
            if (room.status === 'STARTING' || room.status === 'PLAYING') return res.json({ success: true, room });
            if (room.players.length < 2 || !room.players.every((p: any) => p.ready)) return res.status(400).json({ error: 'NOT_READY: Semua pemain harus siap.' });
            
            if (room.mode === 'Match Berhadiah') {
                if (!room.wager || !room.wager.hostAgreed || !room.wager.memberAgreed) {
                    return res.status(400).json({ error: 'WAGER_NOT_AGREED: Taruhan belum disetujui oleh kedua pemain.' });
                }
                
                const member = room.players.find((p: any) => p.name !== room.host)?.name;
                
                if (!room.wagerLocked) {
                    return res.status(500).json({ error: 'WAGER_NOT_LOCKED: Taruhan belum dikunci.' });
                }
            }
            
            room.status = 'STARTING';
            room.matchId = 'M-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
            room.winner = null;
            room.finishReason = null;
            room.payoutProcessed = null;
            room.revision += 1;
            room.players.forEach((p: any) => {
                p.progress = 0;
                p.readyForGame = false;
            });
            if (board) room.board = board;
            
            const startToken = room.revision; // Store current revision
            logMultiplayerEvent('MATCH_PREPARING', roomId, {});
            
            // Timeout if players don't both ready up for game
            setTimeout(async () => {
                const currentRoom = rooms.get(roomId);
                // Only abort if we are STILL in the same PREPARING state
                if (currentRoom && currentRoom.status === 'STARTING' && currentRoom.revision === startToken) {
                    logMultiplayerEvent('MATCH_START_TIMEOUT', roomId, {});
                    currentRoom.status = 'WAITING';
                    currentRoom.revision += 1;
                    
                    // Refund wager if it was locked
                    if (currentRoom.mode === 'Match Berhadiah' && currentRoom.wagerLocked) {
                        try {
                            const memberName = currentRoom.players.find((p: any) => p.name !== currentRoom.host)?.name;
                            if (currentRoom.host) await updatePlayerBalance(currentRoom.host, currentRoom.wager.currency, currentRoom.wager.amount);
                            if (memberName) await updatePlayerBalance(memberName, currentRoom.wager.currency, currentRoom.wager.amount);
                        } catch (e: any) {
                            logMultiplayerEvent('REFUND_FAILED', roomId, { error: e.message });
                        }
                        currentRoom.wagerLocked = false;
                    }
                    currentRoom.players.forEach((p: any) => p.ready = false);
                }
            }, 15000);
            
            return res.json({ success: true, room });
        }

        if (action === 'ready_for_game') {
            const { roomId, name } = req.body;
            const room = rooms.get(roomId);
            if (!room) return res.status(404).json({ error: 'ROOM_NOT_FOUND: Room tidak ditemukan.' });
            
            const player = room.players.find((p: any) => p.name === name);
            if (player && !player.readyForGame) {
                player.readyForGame = true;
                player.lastSync = Date.now();
                room.revision += 1;
                logMultiplayerEvent('PLAYER_READY_FOR_GAME', roomId, { name });
            }

            // ATOMIC START: Start only when both are ready and we are still PREPARING
            if (room.status === 'STARTING' && room.players.length === 2 && room.players.every((p: any) => p.readyForGame)) {
                room.status = 'PLAYING';
                // Server defines the precise start time (4 seconds in the future)
                room.startAt = Date.now() + 4000;
                room.revision += 1;
                logMultiplayerEvent('MATCH_STARTED', roomId, { startAt: room.startAt });
            }
            
            return res.json({ success: true, room });
        }
        
        return res.status(400).json({ error: 'INVALID_ACTION: Aksi tidak valid.' });
    } catch (e: any) {
        // Log all uncaught errors, do not let them fail silently on the client
        console.error("Multiplayer API Error:", e);
        // Instead of returning 500 which the client interprets as "Room tidak ditemukan", 
        // we return 500 with a specific error struct, so the frontend can handle it if needed.
        res.status(500).json({ error: 'Server error', details: e.message });
    }
}
