
CREATE OR REPLACE FUNCTION public.email_provider_on_changes_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _provider_email TEXT;
  _business_name TEXT;
  _admin_note TEXT;
  _base_url TEXT;
  _subject TEXT;
  _html TEXT;
  _edge_url TEXT;
  _service_role TEXT;
BEGIN
  -- Only fire when status changes TO changes_requested
  IF NEW.status IS DISTINCT FROM 'changes_requested' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM 'changes_requested' THEN
    RETURN NEW;
  END IF;

  _business_name := NEW.business_name;
  _admin_note := COALESCE(NEW.admin_note, '');

  -- Get provider email from auth.users
  SELECT email INTO _provider_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF _provider_email IS NULL THEN
    RETURN NEW;
  END IF;

  _base_url := 'https://bookatrade.lovable.app';
  _subject := 'Changes Requested on Your TradeTrust Application';

  _html := '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">'
    || '<h2 style="color:#1a1a1a;">Changes Requested</h2>'
    || '<p>Hi ' || _business_name || ',</p>'
    || '<p>An admin has reviewed your TradeTrust application and has requested some changes before it can be approved.</p>';

  IF _admin_note != '' THEN
    _html := _html
      || '<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0;font-weight:600;color:#92400E;">Admin Note:</p>'
      || '<p style="margin:8px 0 0 0;color:#78350F;">' || _admin_note || '</p>'
      || '</div>';
  END IF;

  _html := _html
    || '<p>Please log in and review your application, then make the requested updates and re-submit for review.</p>'
    || '<div style="text-align:center;margin:24px 0;">'
    || '<a href="' || _base_url || '/provider/account" style="display:inline-block;background:#2563EB;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">Review My Application</a>'
    || '</div>'
    || '<p style="color:#6B7280;font-size:13px;">If you have any questions, please contact our support team.</p>'
    || '</body></html>';

  _edge_url := 'https://gkiohsumxlzqfnnjflgb.supabase.co/functions/v1/send-provider-email';
  _service_role := current_setting('app.settings.service_role_key', true);

  PERFORM net.http_post(
    url := _edge_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _service_role
    ),
    body := jsonb_build_object(
      'to', _provider_email,
      'subject', _subject,
      'html', _html
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_changes_requested_email_provider ON public.provider_profiles;

CREATE TRIGGER on_changes_requested_email_provider
  AFTER UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.email_provider_on_changes_requested();
