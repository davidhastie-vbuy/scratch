
-- Trigger function: notify on provider application status changes
CREATE OR REPLACE FUNCTION public.notify_on_application_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin RECORD;
  _provider_name TEXT;
BEGIN
  -- Only fire on actual status changes
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  -- 1) Admin sets status to changes_requested → notify the provider
  IF NEW.status = 'changes_requested' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.user_id,
      'application_changes_requested',
      'Changes requested on your application',
      COALESCE(NEW.admin_note, 'An admin has requested changes to your provider application. Please review and update your profile.'),
      '/provider/profile'
    );
  END IF;

  -- 2) Provider re-submits (changes_requested → pending_review) → notify all admins
  IF OLD.status = 'changes_requested' AND NEW.status = 'pending_review' THEN
    _provider_name := NEW.contact_first_name || ' ' || NEW.contact_last_name || ' (' || NEW.business_name || ')';
    
    FOR _admin IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.notifications (user_id, type, title, body, link)
      VALUES (
        _admin.user_id,
        'application_resubmitted',
        'Provider re-submitted application',
        _provider_name || ' has updated and re-submitted their application for review.',
        '/admin'
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER trg_notify_application_status_change
  AFTER UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_application_status_change();
