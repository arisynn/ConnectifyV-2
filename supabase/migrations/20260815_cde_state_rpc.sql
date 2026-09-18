-- CDE State Mutation RPC
CREATE OR REPLACE FUNCTION cde_mutate_state(
    p_account_id UUID,
    p_idempotency_key UUID,
    p_operation_type TEXT,
    p_profile_patch JSONB,
    p_game_patch JSONB,
    p_base_revision BIGINT
) RETURNS JSONB AS $$
DECLARE
    v_current_revision BIGINT;
    v_new_revision BIGINT;
    v_op_exists BOOLEAN;
    v_profile_data JSONB;
    v_permen BIGINT;
BEGIN
    -- Auth verification
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
            'profile_data', profile_data,
            'revision', revision
        ) INTO v_profile_data
        FROM cde_profiles
        WHERE account_id = p_account_id;
        
        RETURN v_profile_data;
    END IF;

    -- Lock the row for update
    SELECT revision, permen, profile_data INTO v_current_revision, v_permen, v_profile_data
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

    v_new_revision := v_current_revision + 1;
    
    -- Merge JSON patches
    IF p_profile_patch IS NOT NULL THEN
        -- Ensure 'profile' key exists
        IF v_profile_data->'profile' IS NULL THEN
            v_profile_data := jsonb_set(v_profile_data, '{profile}', '{}'::jsonb);
        END IF;
        v_profile_data := jsonb_set(v_profile_data, '{profile}', (v_profile_data->'profile') || p_profile_patch);
    END IF;

    IF p_game_patch IS NOT NULL THEN
        IF v_profile_data->'game' IS NULL THEN
            v_profile_data := jsonb_set(v_profile_data, '{game}', '{}'::jsonb);
        END IF;
        v_profile_data := jsonb_set(v_profile_data, '{game}', (v_profile_data->'game') || p_game_patch);
    END IF;

    -- Execute Mutation
    UPDATE cde_profiles
    SET profile_data = v_profile_data,
        revision = v_new_revision,
        updated_at = NOW()
    WHERE account_id = p_account_id;

    -- Record Operation
    INSERT INTO cde_operations_log (idempotency_key, account_id, operation_type, created_at)
    VALUES (p_idempotency_key, p_account_id, p_operation_type, NOW());

    -- Return updated state
    RETURN jsonb_build_object(
        'success', true,
        'permen', v_permen,
        'profile_data', v_profile_data,
        'revision', v_new_revision
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
