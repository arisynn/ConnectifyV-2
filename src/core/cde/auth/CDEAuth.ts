import { supabase } from '../../../lib/supabase';
import { CDE } from '../CDE';

export const CDEAuth = {
    checkUsernameExists: async (playerName: string) => {
        try {
            const response = await fetch('/api/cde?action=check_username', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: playerName })
            });
            if (response.ok) {
                const data = await response.json();
                return !!data.exists;
            }
            return false;
        } catch (e) {
            console.error('Failed to check username', e);
            return false;
        }
    },
    restoreSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            await CDE.initialize();
            return true;
        }
        return false;
    },

    login: async (playerName: string, password?: string, isNewAccount?: boolean) => {
        if (!password) {
            throw new Error("Kata sandi dibutuhkan");
        }

        const cleanName = playerName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const pseudoEmail = `${cleanName}@connectify.com`;

        let session = null;
        let isNewSession = false;

        if (isNewAccount) {
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: pseudoEmail,
                password: password,
            });
            
            if (signUpError) {
                if (signUpError.message.includes('User already registered') || signUpError.message.includes('already exists')) {
                    throw new Error("Nama ini sudah dipakai pemain lain! Silakan kembali dan login.");
                }
                throw signUpError;
            }
            
            if (!signUpData.session) {
                throw new Error("Gagal membuat sesi pendaftaran.");
            }
            
            session = signUpData.session;
            isNewSession = true;
        } else {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: pseudoEmail,
                password: password,
            });

            if (signInError) {
                if (signInError.message.includes('Invalid login credentials')) {
                    throw new Error("Kata sandi salah!");
                }
                throw signInError;
            }
            session = signInData.session;
        }

        if (session && isNewSession) {
            try {
                const response = await fetch('/api/cde?action=provision', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify({ username: playerName })
                });
                if (!response.ok) {
                    console.error("Provisioning failed:", await response.json());
                }
            } catch (err) {
                console.warn("Offline mode active: Cannot reach provisioning endpoint.");
            }
        }
        
        localStorage.setItem('pkmnPlayerName', playerName); // Kept for legacy compat if needed for migration, though we can probably drop it later
        
        await CDE.initialize();
        return CDE.getState().profile?.profile_data?.profile || {};
    },
    
    generateRecoveryCode: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');
        
        const response = await fetch('/api/cde?action=generate_recovery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate code');
        return data.code;
    },
    
    recoverAccount: async (code: string) => {
        // Sign out any existing session first
        await supabase.auth.signOut();
        
        // Start a fresh anonymous session
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        const session = data.session;
        
        const response = await fetch('/api/cde?action=recover_account', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ code })
        });
        
        const result = await response.json();
        if (!response.ok) {
            // Revert session creation on failure so they don't get stuck in empty session
            await supabase.auth.signOut();
            throw new Error(result.error || 'Recovery failed');
        }
        
        localStorage.setItem('pkmnPlayerName', result.username);
        
        await CDE.logout(); // flush any cached stuff
        await CDE.initialize(); // load the recovered profile
        return result.username;
    },
    logout: async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('pkmnPlayerName');
        await CDE.logout();
    },
    validateSession: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        return !!session;
    },
    getLoggedInUser: () => {
        return localStorage.getItem('pkmnPlayerName');
    }
};
