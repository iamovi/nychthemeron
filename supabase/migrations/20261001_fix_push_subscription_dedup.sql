-- =============================================================================
-- Fix: upsert_push_subscription — enforce one subscription per user
-- Prevents duplicate push notifications when a user subscribes from
-- multiple domains (e.g. genjutsu.xyz → nychthemeron.vercel.app migration)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_push_subscription(
  p_endpoint TEXT,
  p_p256dh TEXT,
  p_auth TEXT
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove this endpoint from any other user (same browser, different account)
  DELETE FROM public.push_subscriptions
  WHERE endpoint = p_endpoint AND user_id <> v_user_id;

  -- Remove ALL old subscriptions for this user (prevents duplicates across domains)
  DELETE FROM public.push_subscriptions
  WHERE user_id = v_user_id AND endpoint <> p_endpoint;

  -- Upsert the new subscription
  INSERT INTO public.push_subscriptions (user_id, endpoint, p256dh, auth)
  VALUES (v_user_id, p_endpoint, p_p256dh, p_auth)
  ON CONFLICT (user_id, endpoint)
  DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
