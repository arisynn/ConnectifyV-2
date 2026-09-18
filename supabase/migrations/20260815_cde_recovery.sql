CREATE TABLE IF NOT EXISTS cde_recovery_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES cde_accounts(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id)
);

CREATE OR REPLACE FUNCTION cde_transfer_account(
    p_old_account_id UUID,
    p_new_account_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
    -- Update account_id in cde_profiles
    UPDATE cde_profiles SET account_id = p_new_account_id WHERE account_id = p_old_account_id;
    
    -- Update id in cde_accounts
    UPDATE cde_accounts SET id = p_new_account_id WHERE id = p_old_account_id;
    
    -- We may want to return success
    RETURN true;
EXCEPTION WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
