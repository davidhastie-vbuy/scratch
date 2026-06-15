-- Pre-migration: RLS helper functions that were created outside of migrations
-- in the original Lovable-managed Supabase project.
-- These must exist before the RLS policies that reference them.
-- Note: _supabase_url and _supabase_anon_key point to the NEW project.

CREATE OR REPLACE FUNCTION public._supabase_url()
 RETURNS text
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 'https://agimibawtkmhbsweawir.supabase.co'::text;
$function$;

CREATE OR REPLACE FUNCTION public._supabase_anon_key()
 RETURNS text
 LANGUAGE sql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnaW1pYmF3dGttaGJzd2Vhd2lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwNDg2MDksImV4cCI6MjA5NTYyNDYwOX0.EFGCGJFv97Maskzd6_andH9o3EPXJSP67-lDEYuFQKQ'::text;
$function$;

CREATE OR REPLACE FUNCTION public.extract_postcode_district(_raw text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  stripped text;
  outward text;
  match_result text;
BEGIN
  IF _raw IS NULL THEN RETURN NULL; END IF;
  stripped := upper(regexp_replace(_raw, '\s+', '', 'g'));
  IF stripped = '' THEN RETURN ''; END IF;
  IF length(stripped) >= 5 THEN
    outward := left(stripped, length(stripped) - 3);
  ELSE
    outward := stripped;
  END IF;
  match_result := substring(outward FROM '^[A-Z]{1,2}[0-9][A-Z0-9]?');
  RETURN COALESCE(match_result, outward);
END;
$function$;

-- RLS helper functions (SQL language - validated at create time, all referenced tables exist by now)

CREATE OR REPLACE FUNCTION public.provider_is_eligible(_category text, _postcode text, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.provider_profiles pp
    WHERE pp.user_id = _user_id AND pp.status = 'active'
      AND (pp.trade_category = _category OR _category = ANY(pp.additional_categories))
      AND pp.operating_areas && ARRAY[_postcode]
  )
$function$;

CREATE OR REPLACE FUNCTION public.provider_is_invited(_job_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.job_invitations WHERE job_id = _job_id AND provider_user_id = _user_id)
$function$;

CREATE OR REPLACE FUNCTION public.provider_has_declined_quote(_job_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.quotes WHERE job_id = _job_id AND provider_user_id = _user_id AND status = 'declined')
$function$;

CREATE OR REPLACE FUNCTION public.is_job_customer(_job_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND customer_user_id = _user_id)
$function$;

CREATE OR REPLACE FUNCTION public.is_job_provider(_job_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND provider_id = _user_id)
$function$;

CREATE OR REPLACE FUNCTION public.is_job_participant(_job_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND (customer_user_id = _user_id OR provider_id = _user_id))
$function$;

CREATE OR REPLACE FUNCTION public.get_job_provider_id(_job_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT provider_id FROM public.jobs WHERE id = _job_id
$function$;

CREATE OR REPLACE FUNCTION public.get_job_status(_job_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT status::text FROM public.jobs WHERE id = _job_id
$function$;

CREATE OR REPLACE FUNCTION public.count_providers_in_slot(_postcode text, _category text)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM public.provider_profiles
  WHERE status = 'active'
    AND _postcode = ANY(operating_areas)
    AND (trade_category = _category OR _category = ANY(additional_categories))
$function$;

CREATE OR REPLACE FUNCTION public.resubmit_provider_application(_user_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- plpgsql trigger functions (not validated until execution, safe to create before referenced tables)

CREATE OR REPLACE FUNCTION public.normalise_job_postcode_district()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.postcode_district := public.extract_postcode_district(NEW.postcode_district);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_payment_before_progress()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _paid_count INT;
BEGIN
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    SELECT COUNT(*) INTO _paid_count
    FROM public.escrow_payments
    WHERE job_id = NEW.id AND status IN ('held', 'released');
    IF _paid_count = 0 THEN
      RAISE EXCEPTION 'Payment must be completed before this job can proceed.';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_provider_slot_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _area text;
  _cat text;
  _all_cats text[];
  _count integer;
BEGIN
  IF NEW.status != 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active'
    AND OLD.operating_areas IS NOT DISTINCT FROM NEW.operating_areas
    AND OLD.trade_category IS NOT DISTINCT FROM NEW.trade_category
    AND OLD.additional_categories IS NOT DISTINCT FROM NEW.additional_categories THEN
    RETURN NEW;
  END IF;
  _all_cats := ARRAY[NEW.trade_category] || COALESCE(NEW.additional_categories, '{}'::text[]);
  FOREACH _area IN ARRAY COALESCE(NEW.operating_areas, '{}'::text[])
  LOOP
    FOREACH _cat IN ARRAY _all_cats
    LOOP
      SELECT COUNT(*)::integer INTO _count
      FROM public.provider_profiles
      WHERE status = 'active' AND id != NEW.id
        AND _area = ANY(operating_areas)
        AND (trade_category = _cat OR _cat = ANY(additional_categories));
      IF _count >= 3 THEN
        RAISE EXCEPTION 'Maximum of 3 providers reached for category "%" in postcode "%".', _cat, _area;
      END IF;
    END LOOP;
  END LOOP;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_create_milestones()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    IF NOT EXISTS (SELECT 1 FROM public.job_milestones WHERE job_id = NEW.id AND is_auto = true) THEN
      INSERT INTO public.job_milestones (job_id, title, sort_order, is_auto, created_by)
      VALUES (NEW.id, 'Work Started', 0, true, NEW.provider_id),
             (NEW.id, 'Work Complete', 1000, true, NEW.provider_id);
      UPDATE public.job_milestones SET status = 'accepted', completed_at = now()
      WHERE job_id = NEW.id AND title = 'Work Started' AND is_auto = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.auto_complete_job_on_all_released()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _total_milestones INT;
  _released_payments INT;
  _job_status TEXT;
BEGIN
  IF NEW.status = 'released' AND (OLD.status IS NULL OR OLD.status != 'released') THEN
    SELECT status::text INTO _job_status FROM public.jobs WHERE id = NEW.job_id;
    IF _job_status NOT IN ('accepted', 'in_progress') THEN RETURN NEW; END IF;
    SELECT COUNT(*) INTO _total_milestones FROM public.job_milestones WHERE job_id = NEW.job_id;
    IF _total_milestones = 0 THEN RETURN NEW; END IF;
    SELECT COUNT(DISTINCT ep.milestone_id) INTO _released_payments
    FROM public.escrow_payments ep
    WHERE ep.job_id = NEW.job_id AND ep.milestone_id IS NOT NULL AND ep.status = 'released';
    IF _released_payments >= _total_milestones THEN
      UPDATE public.jobs SET status = 'completed' WHERE id = NEW.job_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.record_milestone_earning()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _job RECORD;
  _fee_percent numeric;
  _gross numeric;
BEGIN
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
    IF _job.provider_id IS NULL THEN RETURN NEW; END IF;
    SELECT platform_fee_percent INTO _fee_percent
    FROM public.provider_profiles WHERE user_id = _job.provider_id;
    _fee_percent := COALESCE(_fee_percent, 10);
    _gross := COALESCE(NEW.payment_amount, 0);
    IF _gross <= 0 THEN RETURN NEW; END IF;
    INSERT INTO public.provider_transactions (provider_user_id, type, amount, description, job_id, milestone_id)
    VALUES (_job.provider_id, 'earning', _gross - (_gross * _fee_percent / 100),
      'Milestone "' || NEW.title || '" completed', NEW.job_id, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

-- Message window function (references messages table which exists by now)
CREATE OR REPLACE FUNCTION public.is_job_within_message_window(_job_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = _job_id
      AND status IN ('completed', 'cancelled')
      AND updated_at > (now() - interval '72 hours')
  )
$function$;
