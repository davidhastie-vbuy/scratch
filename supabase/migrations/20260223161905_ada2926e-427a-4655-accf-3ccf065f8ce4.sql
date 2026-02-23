
-- Notify all admins when a provider submits pending profile changes
CREATE OR REPLACE FUNCTION public.notify_admins_on_provider_profile_update()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _admin RECORD;
  _provider_name TEXT;
  _change_desc TEXT := '';
BEGIN
  _provider_name := NEW.contact_first_name || ' ' || NEW.contact_last_name || ' (' || NEW.business_name || ')';

  -- Check for pending trade category change
  IF (NEW.pending_trade_category IS NOT NULL AND (OLD.pending_trade_category IS NULL OR OLD.pending_trade_category IS DISTINCT FROM NEW.pending_trade_category)) THEN
    _change_desc := 'trade category';
  END IF;

  -- Check for pending operating areas change
  IF (NEW.pending_operating_areas IS NOT NULL AND (OLD.pending_operating_areas IS NULL OR OLD.pending_operating_areas IS DISTINCT FROM NEW.pending_operating_areas)) THEN
    IF _change_desc != '' THEN _change_desc := _change_desc || ', '; END IF;
    _change_desc := _change_desc || 'operating areas';
  END IF;

  -- Check for pending additional categories change
  IF (NEW.pending_additional_categories IS NOT NULL AND (OLD.pending_additional_categories IS NULL OR OLD.pending_additional_categories IS DISTINCT FROM NEW.pending_additional_categories)) THEN
    IF _change_desc != '' THEN _change_desc := _change_desc || ', '; END IF;
    _change_desc := _change_desc || 'additional categories';
  END IF;

  -- Check for business detail changes (only for active providers updating basic info)
  IF NEW.status = 'active' AND OLD.status = 'active' THEN
    IF (OLD.business_name IS DISTINCT FROM NEW.business_name
        OR OLD.business_description IS DISTINCT FROM NEW.business_description
        OR OLD.business_address IS DISTINCT FROM NEW.business_address
        OR OLD.phone IS DISTINCT FROM NEW.phone
        OR OLD.postcode IS DISTINCT FROM NEW.postcode) THEN
      IF _change_desc != '' THEN _change_desc := _change_desc || ', '; END IF;
      _change_desc := _change_desc || 'business details';
    END IF;
  END IF;

  -- Only notify if something changed
  IF _change_desc = '' THEN
    RETURN NEW;
  END IF;

  FOR _admin IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      _admin.user_id,
      'provider_profile_update',
      'Provider profile update',
      _provider_name || ' has updated their ' || _change_desc || '.',
      '/admin'
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Create trigger on provider_profiles
CREATE TRIGGER notify_admins_on_provider_profile_update
  AFTER UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admins_on_provider_profile_update();
