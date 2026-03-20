
-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_new_notification_email ON public.notifications;

-- Update function to send simpler customer-friendly email
CREATE OR REPLACE FUNCTION public.email_on_new_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _email TEXT;
  _first_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
  _topic TEXT;
BEGIN
  SELECT email, first_name INTO _email, _first_name
  FROM public.profiles WHERE id = NEW.user_id;

  IF _email IS NULL OR _email = '' THEN
    RETURN NEW;
  END IF;

  -- Check if this is a provider and if they have email notifications disabled
  IF EXISTS (
    SELECT 1 FROM public.provider_profiles
    WHERE user_id = NEW.user_id AND email_notifications_enabled = false
  ) THEN
    RETURN NEW;
  END IF;

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);

  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN
    RETURN NEW;
  END IF;

  -- Build a short topic line from the notification title
  _topic := NEW.title;

  _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
    || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
    || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
    || '</div>'
    || '<div style="padding:24px 0;">'
    || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_first_name), ''), 'there') || ',</p>'
    || '<p style="font-size:15px;color:#333;">You have a new notification on BookATrade:</p>'
    || '<div style="background:#f4f4f8;border-left:4px solid #1a1a2e;padding:16px;margin:16px 0;border-radius:4px;">'
    || '<p style="margin:0;font-weight:bold;font-size:15px;color:#1a1a2e;">' || _topic || '</p>'
    || '</div>'
    || '<p style="font-size:14px;color:#555;">Log in to your dashboard to view the full details.</p>'
    || '<div style="text-align:center;padding:16px 0;">'
    || '<a href="' || _site_url || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Log in to BookATrade</a>'
    || '</div>'
    || '</div>'
    || '<div style="text-align:center;padding-top:16px;border-top:1px solid #eee;">'
    || '<p style="font-size:12px;color:#aaa;margin:0;">&copy; BookATrade. All rights reserved.</p>'
    || '</div>'
    || '</div>';

  PERFORM net.http_post(
    url := _supabase_url || '/functions/v1/send-provider-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role_key
    ),
    body := jsonb_build_object(
      'to', _email,
      'subject', 'BookATrade: ' || _topic,
      'html', _html
    )
  );

  RETURN NEW;
END;
$function$;

-- Ensure the trigger is attached
CREATE TRIGGER on_new_notification_email
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.email_on_new_notification();
