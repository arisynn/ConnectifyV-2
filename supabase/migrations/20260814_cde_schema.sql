-- CDE Schema Foundation

CREATE TABLE IF NOT EXISTS cde_accounts (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cde_profiles (
    account_id UUID PRIMARY KEY REFERENCES cde_accounts(id) ON DELETE CASCADE,
    permen BIGINT NOT NULL DEFAULT 0 CHECK (permen >= 0),
    profile_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    revision BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cde_operations_log (
    idempotency_key UUID PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES cde_accounts(id) ON DELETE CASCADE,
    operation_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE cde_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cde_operations_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own account" ON cde_accounts FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own account" ON cde_accounts FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON cde_profiles FOR SELECT USING (auth.uid() = account_id);
CREATE POLICY "Users can update their own profile_data" ON cde_profiles FOR UPDATE USING (auth.uid() = account_id);

CREATE POLICY "Users can view their own ops" ON cde_operations_log FOR SELECT USING (auth.uid() = account_id);

-- CDE Permen Mutation RPC
CREATE OR REPLACE FUNCTION cde_mutate_permen(
    p_account_id UUID,
    p_idempotency_key UUID,
    p_operation_type TEXT,
    p_amount BIGINT,
    p_base_revision BIGINT
) RETURNS JSONB AS $$
DECLARE
    v_current_revision BIGINT;
    v_current_permen BIGINT;
    v_new_revision BIGINT;
    v_new_permen BIGINT;
    v_op_exists BOOLEAN;
    v_profile_data JSONB;
BEGIN
    -- Auth verification (if called from client, enforce UID)
    IF auth.uid() IS NOT NULL AND auth.uid() != p_account_id THEN
        RAISE EXCEPTION 'UNAUTHORIZED';
    END IF;

    -- Check Idempotency
    SELECT EXISTS (
        SELECT 1 FROM cde_operations_log 
        WHERE idempotency_key = p_idempotency_key
    ) INTO v_op_exists;

    IF v_op_exists THEN
        SELECT jsonb_build_object(
            'success', true, 
            'message', 'Operation already processed',
            'permen', permen,
            'revision', revision
        ) INTO v_profile_data
        FROM cde_profiles
        WHERE account_id = p_account_id;
        
        RETURN v_profile_data;
    END IF;

    -- Lock the row for update
    SELECT revision, permen INTO v_current_revision, v_current_permen
    FROM cde_profiles
    WHERE account_id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profile not found';
    END IF;

    -- OCC Check
    IF p_base_revision IS NOT NULL AND v_current_revision != p_base_revision THEN
        RAISE EXCEPTION 'STALE_REVISION';
    END IF;

    v_new_permen := v_current_permen + p_amount;
    
    IF v_new_permen < 0 THEN
        RAISE EXCEPTION 'INSUFFICIENT_PERMEN';
    END IF;

    v_new_revision := v_current_revision + 1;

    -- Execute Mutation
    UPDATE cde_profiles
    SET permen = v_new_permen,
        revision = v_new_revision,
        updated_at = NOW()
    WHERE account_id = p_account_id;

    -- Record Operation
    INSERT INTO cde_operations_log (idempotency_key, account_id, operation_type, created_at)
    VALUES (p_idempotency_key, p_account_id, p_operation_type, NOW());

    -- Return updated profile
    SELECT jsonb_build_object(
        'success', true,
        'permen', v_new_permen,
        'revision', v_new_revision
    ) INTO v_profile_data;

    RETURN v_profile_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
