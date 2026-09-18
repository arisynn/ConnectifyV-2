CREATE TABLE IF NOT EXISTS cde_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES cde_accounts(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id)
);

ALTER TABLE cde_recovery_codes ENABLE ROW LEVEL SECURITY;
-- No policies needed if only accessed by service role via API
