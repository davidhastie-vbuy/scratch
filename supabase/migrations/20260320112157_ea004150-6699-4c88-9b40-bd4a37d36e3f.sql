
CREATE OR REPLACE FUNCTION public.resubmit_provider_application(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_profiles
  SET status = 'pending_review',
      updated_at = now()
  WHERE user_id = _user_id
    AND status = 'changes_requested';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No profile found with changes_requested status for this user';
  END IF;
END;
$$;
