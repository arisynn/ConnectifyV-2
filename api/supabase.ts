import { createClient } from '@supabase/supabase-js';

let supabaseInstance: any = null;
let initializationAttempted = false;

// ---------------------------------------------------------------------------
// In-memory fake Supabase (dev / preview only, used when no real keys are set)
// Supports the query chains used by api/cde.ts & api/multiplayer.ts and the
// two RPCs (cde_mutate_permen / cde_mutate_state) with the same semantics as
// the SQL functions in /supabase/migrations.
// ---------------------------------------------------------------------------
type Row = Record<string, any>;
const tables: Record<string, Row[]> = {};
const getTable = (name: string) => (tables[name] = tables[name] || []);

const UNIQUE_KEYS: Record<string, string[]> = {
  cde_accounts: ['id', 'username'],
  cde_profiles: ['account_id'],
  cde_operations_log: ['idempotency_key'],
  cde_recovery_codes: ['account_id'],
  profiles: ['player_name'],
};

const uniqueViolation = (table: string, col: string) => ({
  code: '23505',
  message: `duplicate key value violates unique constraint "${table}_${col}_key"`,
});

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class MockQuery {
  private filters: ((r: Row) => boolean)[] = [];
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private limitN: number | null = null;
  private conflictKey: string | null = null;

  constructor(private table: string) {}

  select(_cols?: string) { if (this.op === 'select') this.op = 'select'; return this; }
  eq(col: string, val: any) { this.filters.push(r => String(r[col]) === String(val)); return this; }
  ilike(col: string, pattern: string) {
    const re = new RegExp('^' + escapeRe(pattern).replace(/%/g, '.*') + '$', 'i');
    this.filters.push(r => re.test(String(r[col] ?? '')));
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }
  insert(row: Row | Row[]) { this.op = 'insert'; this.payload = row; return this; }
  update(patch: Row) { this.op = 'update'; this.payload = patch; return this; }
  upsert(row: Row, opts?: { onConflict?: string }) { this.op = 'upsert'; this.payload = row; this.conflictKey = opts?.onConflict || null; return this; }
  delete() { this.op = 'delete'; return this; }

  private matching() { return getTable(this.table).filter(r => this.filters.every(f => f(r))); }

  private checkUnique(row: Row, ignore?: Row) {
    for (const col of UNIQUE_KEYS[this.table] || []) {
      if (row[col] === undefined) continue;
      const clash = getTable(this.table).find(r => r !== ignore && String(r[col]) === String(row[col]));
      if (clash) return uniqueViolation(this.table, col);
    }
    return null;
  }

  private exec(): Promise<{ data: Row[] | null; error: any }> {
    const t = getTable(this.table);
    try {
      if (this.op === 'select') {
        let rows = this.matching().map(r => ({ ...r }));
        if (this.limitN !== null) rows = rows.slice(0, this.limitN);
        return Promise.resolve({ data: rows, error: null });
      }
      if (this.op === 'insert') {
        const rows = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const r of rows) {
          const err = this.checkUnique(r);
          if (err) return Promise.resolve({ data: null, error: err });
        }
        const inserted = rows.map(r => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...r }));
        t.push(...inserted);
        return Promise.resolve({ data: inserted.map(r => ({ ...r })), error: null });
      }
      if (this.op === 'upsert') {
        const key = this.conflictKey || (UNIQUE_KEYS[this.table] || [])[0];
        const existing = key ? t.find(r => String(r[key]) === String(this.payload[key])) : null;
        if (existing) Object.assign(existing, this.payload);
        else t.push({ id: crypto.randomUUID(), ...this.payload });
        return Promise.resolve({ data: [existing || this.payload], error: null });
      }
      if (this.op === 'update') {
        const rows = this.matching();
        for (const r of rows) {
          const err = this.checkUnique({ ...r, ...this.payload }, r);
          if (err) return Promise.resolve({ data: null, error: err });
          Object.assign(r, this.payload);
        }
        return Promise.resolve({ data: rows.map(r => ({ ...r })), error: null });
      }
      if (this.op === 'delete') {
        const rows = this.matching();
        tables[this.table] = t.filter(r => !rows.includes(r));
        return Promise.resolve({ data: rows, error: null });
      }
    } catch (e: any) {
      return Promise.resolve({ data: null, error: { message: e.message } });
    }
    return Promise.resolve({ data: [], error: null });
  }

  maybeSingle() { return this.exec().then(res => ({ data: res.data ? (res.data[0] ?? null) : null, error: res.error })); }
  single() {
    return this.exec().then(res => {
      if (res.error) return { data: null, error: res.error };
      if (!res.data || res.data.length === 0) return { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
      return { data: res.data[0], error: null };
    });
  }
  then(resolve: any, reject?: any) { return this.exec().then(resolve, reject); }
}

const hashToUuid = (input: string) => {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    h1 = Math.imul(h1 ^ input.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 ^ input.charCodeAt(i), 2246822519) >>> 0;
  }
  const hex = (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).repeat(2);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
};

const mockRpc = async (fn: string, args: Row) => {
  const profiles = getTable('cde_profiles');
  const log = getTable('cde_operations_log');
  const profile = profiles.find(p => p.account_id === args.p_account_id);
  if (!profile) return { data: null, error: { message: 'PROFILE_NOT_FOUND' } };
  if (log.find(l => l.idempotency_key === args.p_idempotency_key)) {
    return { data: { ...profile }, error: { message: 'Operation already processed' } };
  }
  if (args.p_base_revision !== undefined && args.p_base_revision !== null && Number(args.p_base_revision) !== Number(profile.revision)) {
    return { data: null, error: { message: 'STALE_REVISION' } };
  }
  if (fn === 'cde_mutate_permen') {
    const next = Number(profile.permen || 0) + Number(args.p_amount || 0);
    if (next < 0) return { data: null, error: { message: 'INSUFFICIENT_PERMEN' } };
    profile.permen = next;
  } else if (fn === 'cde_mutate_state') {
    const next = Number(profile.permen || 0) + Number(args.p_permen_delta || 0);
    if (next < 0) return { data: null, error: { message: 'INSUFFICIENT_PERMEN' } };
    profile.permen = next;
    const pd = { ...(profile.profile_data || {}) };
    if (args.p_profile_patch) pd.profile = { ...(pd.profile || {}), ...args.p_profile_patch };
    if (args.p_game_patch) pd.game = { ...(pd.game || {}), ...args.p_game_patch };
    profile.profile_data = pd;
  } else {
    return { data: null, error: { code: 'PGRST202', message: `Could not find the function ${fn}` } };
  }
  profile.revision = Number(profile.revision) + 1;
  profile.updated_at = new Date().toISOString();
  log.push({ id: crypto.randomUUID(), idempotency_key: args.p_idempotency_key, account_id: args.p_account_id, operation_type: args.p_operation_type });
  return { data: { ...profile }, error: null };
};

const createMockSupabase = () => ({
  auth: {
    getUser: async (token?: string) => {
      if (!token) return { data: { user: null }, error: { message: 'NO_TOKEN' } };
      if (token.startsWith('mock-token:')) {
        return { data: { user: { id: hashToUuid(token.slice('mock-token:'.length)) } }, error: null };
      }
      return { data: { user: { id: 'mock-uuid-1234' } }, error: null };
    },
  },
  from: (table: string) => new MockQuery(table),
  rpc: mockRpc,
});

export function getSupabase(): any {
  if (!initializationAttempted) {
    initializationAttempted = true;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) {
      console.warn('[DEV] Supabase URL or Key is missing or invalid. Using in-memory mock database.');
      supabaseInstance = createMockSupabase();
      return supabaseInstance;
    }

    supabaseInstance = createClient(supabaseUrl, supabaseKey);
  }
  return supabaseInstance;
}
