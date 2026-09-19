/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV.VITE_SUPABASE_URL) {
    return (window as any).ENV.VITE_SUPABASE_URL;
  }
  return import.meta.env.VITE_SUPABASE_URL;
};

const getSupabaseAnonKey = () => {
  if (typeof window !== 'undefined' && (window as any).ENV && (window as any).ENV.VITE_SUPABASE_ANON_KEY) {
    return (window as any).ENV.VITE_SUPABASE_ANON_KEY;
  }
  return import.meta.env.VITE_SUPABASE_ANON_KEY;
};

const supabaseUrl = getSupabaseUrl() as string;
const supabaseAnonKey = getSupabaseAnonKey() as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars are missing. Please ensure they are defined.');
}

export const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      storageKey: 'cde-auth-token-v1',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
) : createMockClient() as any;

// ---------------------------------------------------------------------------
// Dev/preview mock (no Supabase keys): persists fake accounts in localStorage
// so login / register / logout flows behave like the real thing.
// ---------------------------------------------------------------------------
function createMockClient() {
  if (import.meta.env.VITE_PREVIEW_MODE !== 'true') throw new Error('Konfigurasi Supabase belum tersedia.');
  const USERS_KEY = 'mock_supabase_users';
  const SESSION_KEY = 'mock_supabase_session';
  const readUsers = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(USERS_KEY) || '{}'); } catch { return {}; } };
  const writeUsers = (u: Record<string, string>) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
  const makeSession = (email: string) => ({ access_token: `mock-token:${email}`, user: { id: `mock:${email}`, email } });
  const readSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { return null; } };
  const writeSession = (s: any) => s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY);

  return {
    auth: {
      signUp: async ({ email, password }: any) => {
        const users = readUsers();
        if (users[email]) return { data: { session: null }, error: new Error('User already registered') };
        users[email] = password; writeUsers(users);
        const session = makeSession(email); writeSession(session);
        return { data: { session }, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        const users = readUsers();
        if (!users[email] || users[email] !== password) return { data: { session: null }, error: new Error('Invalid login credentials') };
        const session = makeSession(email); writeSession(session);
        return { data: { session }, error: null };
      },
      signInAnonymously: async () => {
        const session = makeSession(`anon-${Date.now()}@connectify.com`); writeSession(session);
        return { data: { session }, error: null };
      },
      signOut: async () => { writeSession(null); return { error: null }; },
      getSession: async () => ({ data: { session: readSession() }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: (_table: string) => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }), then: (cb: any) => cb({ data: [], error: null }) }) }),
      upsert: async () => ({ error: null }),
      update: () => ({ eq: async () => ({ error: null }) }),
      delete: () => ({ eq: async () => ({ error: null }) })
    })
  };
}
