
CREATE OR REPLACE FUNCTION public.email_provider_on_quote_action()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _job RECORD;
  _provider RECORD;
  _provider_email TEXT;
  _customer_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
  _subject TEXT;
  _action_heading TEXT;
  _action_body TEXT;
  _cta_label TEXT;
  _cta_link TEXT;
  _border_color TEXT;
  _heading_color TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN RETURN NEW; END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Check provider has email notifications enabled
  SELECT * INTO _provider FROM public.provider_profiles WHERE user_id = NEW.provider_user_id;
  IF NOT FOUND OR NOT _provider.email_notifications_enabled THEN RETURN NEW; END IF;

  SELECT email INTO _provider_email FROM public.profiles WHERE id = NEW.provider_user_id;
  IF _provider_email IS NULL OR _provider_email = '' THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), full_name, 'The customer') INTO _customer_name
  FROM public.profiles WHERE id = _job.customer_user_id;

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

  IF NEW.status = 'accepted' THEN
    _subject := 'BookATrade: Your quote for "' || _job.title || '" has been accepted!';
    _action_heading := '🎉 Quote Accepted!';
    _action_body := '<strong>' || _customer_name || '</strong> has accepted your quote for "<strong>' || _job.title || '</strong>". Please log in to set up the milestones and payment schedule so the job can get started.';
    _cta_label := 'Set Up Milestones';
    _cta_link := _site_url || '/provider/jobs/' || _job.id::text;
    _border_color := '#22863a';
    _heading_color := '#22863a';
  ELSIF NEW.status = 'declined' THEN
    _subject := 'BookATrade: Your quote for "' || _job.title || '" was not selected';
    _action_heading := 'Quote Not Selected';
    _action_body := '<strong>' || _customer_name || '</strong> has not selected your quote for "<strong>' || _job.title || '</strong>" this time. You can message the customer to discuss the job further or explore other available jobs.';
    _cta_label := 'Message Customer';
    _cta_link := _site_url || '/provider/messages';
    _border_color := '#d29922';
    _heading_color := '#d29922';
  END IF;

  _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
    || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
    || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
    || '</div>'
    || '<div style="padding:24px 0;">'
    || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_provider.contact_first_name), ''), 'there') || ',</p>'
    || '<div style="background:#f4f4f8;border-left:4px solid ' || _border_color || ';padding:16px;margin:16px 0;border-radius:4px;">'
    || '<p style="margin:0 0 8px;font-weight:bold;font-size:16px;color:' || _heading_color || ';">' || _action_heading || '</p>'
    || '<p style="margin:0;font-size:14px;color:#555;">' || _action_body || '</p>'
    || '</div>'
    || '<div style="text-align:center;padding:16px 0;">'
    || '<a href="' || _cta_link || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">' || _cta_label || '</a>'
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
      'to', _provider_email,
      'subject', _subject,
      'html', _html
    )
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_quote_action_email_provider
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.email_provider_on_quote_action();
