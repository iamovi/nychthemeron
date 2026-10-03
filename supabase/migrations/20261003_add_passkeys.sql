-- Migration: Add user_passkeys table & security RPC functions for WebAuthn Passkeys in Nychthemeron

CREATE TABLE IF NOT EXISTS public.user_passkeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,
  public_key TEXT NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_nickname TEXT NOT NULL DEFAULT 'Passkey',
  transports TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_passkeys_user_id ON public.user_passkeys(user_id);
CREATE INDEX IF NOT EXISTS idx_user_passkeys_cred_id ON public.user_passkeys(credential_id);

-- Enable RLS
ALTER TABLE public.user_passkeys ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own passkeys"
  ON public.user_passkeys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own passkeys"
  ON public.user_passkeys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own passkeys"
  ON public.user_passkeys FOR DELETE
  USING (auth.uid() = user_id);

-- RPC: Register New Passkey for Authenticated User
CREATE OR REPLACE FUNCTION public.register_user_passkey(
  p_credential_id TEXT,
  p_public_key TEXT,
  p_nickname TEXT DEFAULT 'Passkey',
  p_transports TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  INSERT INTO public.user_passkeys (user_id, credential_id, public_key, device_nickname, transports)
  VALUES (auth.uid(), p_credential_id, p_public_key, COALESCE(p_nickname, 'Passkey'), p_transports)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: Get Passkey User Details for Authentication
CREATE OR REPLACE FUNCTION public.get_passkey_user_for_auth(p_credential_id TEXT)
RETURNS TABLE (
  passkey_id UUID,
  user_id UUID,
  user_email TEXT,
  public_key TEXT,
  counter BIGINT
) AS $$
BEGIN
  -- Update last_used_at timestamp
  UPDATE public.user_passkeys
  SET last_used_at = now()
  WHERE credential_id = p_credential_id;

  RETURN QUERY
  SELECT 
    pk.id AS passkey_id,
    pk.user_id,
    u.email::TEXT AS user_email,
    pk.public_key,
    pk.counter
  FROM public.user_passkeys pk
  JOIN auth.users u ON u.id = pk.user_id
  WHERE pk.credential_id = p_credential_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Permissions
REVOKE EXECUTE ON FUNCTION public.register_user_passkey(text, text, text, text[]) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.register_user_passkey(text, text, text, text[]) TO authenticated;

GRANT EXECUTE ON FUNCTION public.get_passkey_user_for_auth(text) TO anon, authenticated;
