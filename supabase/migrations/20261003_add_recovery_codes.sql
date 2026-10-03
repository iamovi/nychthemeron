-- Migration: Add single-use recovery codes table & security RPC functions for Nychthemeron

CREATE TABLE IF NOT EXISTS public.user_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast user_id and code_hash lookup
CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_user_id ON public.user_recovery_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recovery_codes_hash ON public.user_recovery_codes(code_hash);

-- Enable RLS
ALTER TABLE public.user_recovery_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own recovery codes metadata
CREATE POLICY "Users can view own recovery code status"
  ON public.user_recovery_codes FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own recovery codes
CREATE POLICY "Users can delete own recovery codes"
  ON public.user_recovery_codes FOR DELETE
  USING (auth.uid() = user_id);

-- RPC: Save (replace) user recovery codes
CREATE OR REPLACE FUNCTION public.save_user_recovery_codes(p_code_hashes TEXT[])
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  -- Remove older codes
  DELETE FROM public.user_recovery_codes WHERE user_id = auth.uid();

  -- Insert new code hashes
  INSERT INTO public.user_recovery_codes (user_id, code_hash)
  SELECT auth.uid(), unnest(p_code_hashes);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Verify and consume recovery code for logged-in / MFA session
CREATE OR REPLACE FUNCTION public.consume_recovery_code(p_code_hash TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_record_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_record_id
  FROM public.user_recovery_codes
  WHERE user_id = auth.uid()
    AND code_hash = p_code_hash
    AND used_at IS NULL
  LIMIT 1;

  IF v_record_id IS NOT NULL THEN
    UPDATE public.user_recovery_codes
    SET used_at = now()
    WHERE id = v_record_id;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Emergency Account Recovery & Password Reset via Recovery Code
CREATE OR REPLACE FUNCTION public.recover_account_with_code(
  p_email TEXT,
  p_code_hash TEXT,
  p_new_password TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_target_user_id UUID;
  v_record_id UUID;
BEGIN
  -- Find user_id by email from auth.users
  SELECT id INTO v_target_user_id
  FROM auth.users
  WHERE lower(email) = lower(p_email)
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT id INTO v_record_id
  FROM public.user_recovery_codes
  WHERE user_id = v_target_user_id
    AND code_hash = p_code_hash
    AND used_at IS NULL
  LIMIT 1;

  IF v_record_id IS NOT NULL THEN
    -- Mark code as used
    UPDATE public.user_recovery_codes
    SET used_at = now()
    WHERE id = v_record_id;

    -- Update encrypted_password in auth.users
    UPDATE auth.users
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = v_target_user_id;

    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

-- Permissions
REVOKE EXECUTE ON FUNCTION public.save_user_recovery_codes(text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.save_user_recovery_codes(text[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.consume_recovery_code(text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.consume_recovery_code(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.recover_account_with_code(text, text, text) TO anon, authenticated;
