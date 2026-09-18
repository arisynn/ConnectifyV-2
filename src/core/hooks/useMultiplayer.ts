import { useState, useEffect, useRef } from 'react';
import { useGame } from '../../GameContext';
import { useProfile } from '../profile/ProfileContext';

export interface Room {
    id: string;
    host: string;
    status: 'WAITING' | 'STARTING' | 'PLAYING' | 'FINISHED';
    players: any[];
    mode: string;
    wager: any;
    winner?: string;
    finishReason?: string;
    wagerLocked?: boolean;
    startAt?: number;
    gameMode?: string;
}

export const useMultiplayer = () => {
    const { user } = useGame();
    const { profile, refreshProfileFromEngine } = useProfile();
    const [room, setRoom] = useState<Room | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const pollInterval = useRef<any>(null);

    const apiCall = async (action: string, payload: any = {}) => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/multiplayer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ...payload })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setIsLoading(false);
            return data;
        } catch (e: any) {
            setError(e.message);
            setIsLoading(false);
            throw e;
        }
    };

    const createRoom = async (gameMode: string = 'onet') => {
        const data = await apiCall('create', { host: user.name, level: profile.highestLevel, theme: profile.activeTheme, gameMode });
        setRoom(data);
        startPolling(data.id);
        return data;
    };

    const joinRoom = async (roomId: string) => {
        const data = await apiCall('join', { roomId, name: user.name, level: profile.highestLevel, theme: profile.activeTheme });
        setRoom(data);
        startPolling(data.id);
        return data;
    };

    const leaveRoom = async () => {
        if (!room) return;
        stopPolling();
        await apiCall('leave', { roomId: room.id, name: user.name }).catch(() => {});
        setRoom(null);
    };

    const setReady = async (ready: boolean) => {
        if (!room) return;
        const data = await apiCall('ready', { roomId: room.id, name: user.name, ready });
        setRoom(data);
    };

    const changeMode = async (mode: string) => {
        if (!room) return;
        const data = await apiCall('change_mode', { roomId: room.id, host: user.name, mode });
        setRoom(data);
    };

    const proposeWager = async (amount: number, currency: string = 'coins') => {
        if (!room) return;
        const data = await apiCall('propose_wager', { roomId: room.id, host: user.name, amount, currency });
        setRoom(data);
    };

    const acceptWager = async (offerId: string) => {
        if (!room) return;
        const data = await apiCall('accept_wager', { roomId: room.id, name: user.name, offerId });
        setRoom(data);
    };

    const rejectWager = async (offerId: string) => {
        if (!room) return;
        const data = await apiCall('reject_wager', { roomId: room.id, name: user.name, offerId });
        setRoom(data);
    };

    const startMatch = async (board?: any[][]) => {
        if (!room) return;
        const data = await apiCall('start_match', { roomId: room.id, host: user.name, board });
        if (data.room) setRoom(data.room);
    };

    const readyForGame = async () => {
        if (!room) return;
        const data = await apiCall('ready_for_game', { roomId: room.id, name: user.name });
        if (data.room) setRoom(data.room);
    };

    const completeMatch = async () => {
        if (!room) return;
        const data = await apiCall('complete', { roomId: room.id, name: user.name });
        setRoom(data);
        // Refresh balance in case of payout
        refreshProfileFromEngine();
    };

    const reportLoss = async () => {
        if (!room) return;
        const data = await apiCall('report_loss', { roomId: room.id, name: user.name });
        setRoom(data);
        refreshProfileFromEngine();
    };

    const reportTimeUp = async () => {
        if (!room) return;
        const data = await apiCall('time_up', { roomId: room.id, name: user.name });
        setRoom(data);
        refreshProfileFromEngine();
    };

    const startPolling = (roomId: string) => {
        stopPolling();
        pollInterval.current = setInterval(async () => {
            try {
                const res = await fetch(`/api/multiplayer?action=sync&roomId=${roomId}&name=${encodeURIComponent(user.name)}`);
                const data = await res.json();
                if (!data.error) {
                    setRoom(data);
                }
            } catch (e) {
                console.error("Polling error", e);
            }
        }, 2000);
    };

    const stopPolling = () => {
        if (pollInterval.current) clearInterval(pollInterval.current);
    };

    useEffect(() => {
        return () => stopPolling();
    }, []);

    return {
        room, error, isLoading,
        createRoom, joinRoom, leaveRoom, setReady,
        changeMode, proposeWager, acceptWager, rejectWager,
        startMatch, readyForGame, completeMatch, reportLoss, reportTimeUp
    };
};
