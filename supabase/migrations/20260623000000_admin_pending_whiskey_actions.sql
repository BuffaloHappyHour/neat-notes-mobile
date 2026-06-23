-- admin_approve_pending_whiskey
-- Sets a user-submitted pending whiskey to verified.
CREATE OR REPLACE FUNCTION public.admin_approve_pending_whiskey(p_id uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  v_whiskey record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_whiskey
  FROM public.whiskeys
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'whiskey not found';
  END IF;

  IF v_whiskey.source <> 'user' THEN
    RAISE EXCEPTION 'whiskey is not a user submission (source: %)', v_whiskey.source;
  END IF;

  IF v_whiskey.status <> 'pending' THEN
    RAISE EXCEPTION 'whiskey is not pending (current status: %)', v_whiskey.status;
  END IF;

  UPDATE public.whiskeys
  SET status = 'verified', updated_at = now()
  WHERE id = p_id;

  RETURN p_id;
END;
$$;


-- admin_reject_pending_whiskey
-- Soft-deletes a user-submitted whiskey: marks rejected and inactive.
-- Does not remove the row or re-point linked tastings.
CREATE OR REPLACE FUNCTION public.admin_reject_pending_whiskey(p_id uuid)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  v_whiskey record;
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  SELECT * INTO v_whiskey
  FROM public.whiskeys
  WHERE id = p_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'whiskey not found';
  END IF;

  IF v_whiskey.source <> 'user' THEN
    RAISE EXCEPTION 'whiskey is not a user submission (source: %)', v_whiskey.source;
  END IF;

  UPDATE public.whiskeys
  SET status = 'rejected', is_active = false, updated_at = now()
  WHERE id = p_id;

  RETURN p_id;
END;
$$;


-- create_custom_whiskey (updated)
-- Now accepts optional distillery, proof, and whiskey_type_id.
-- Falls back to the generic 'Other' type UUID when whiskey_type_id is omitted.
-- status = 'pending' and source = 'user' are unchanged.
CREATE OR REPLACE FUNCTION public.create_custom_whiskey(
  p_display_name      text,
  p_whiskey_canonical text,
  p_user_id           uuid,
  p_distillery        text    DEFAULT NULL,
  p_proof             numeric DEFAULT NULL,
  p_whiskey_type_id   uuid    DEFAULT NULL
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  v_whiskey_id      uuid;
  v_whiskey_type_id uuid;
BEGIN
  v_whiskey_type_id := COALESCE(p_whiskey_type_id, '3cde1227-e497-4a47-ba53-cb21d5d7b506');

  INSERT INTO public.whiskeys (
    display_name,
    whiskey_canonical,
    whiskey_type_id,
    distillery,
    proof,
    status,
    source
  ) VALUES (
    p_display_name,
    p_whiskey_canonical,
    v_whiskey_type_id,
    p_distillery,
    p_proof,
    'pending',
    'user'
  )
  RETURNING id INTO v_whiskey_id;

  RETURN v_whiskey_id;
END;
$$;
