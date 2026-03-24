
-- Update provider message notification trigger to also handle 'proposal' messages
CREATE OR REPLACE FUNCTION public.notify_provider_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conv RECORD;
  _provider_profile RECORD;
  _provider_email TEXT;
  _job_title TEXT;
  _customer_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _notif_title TEXT;
  _notif_body TEXT;
  _email_subject TEXT;
  _email_html TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
BEGIN
  -- Only handle text and proposal messages
  IF NEW.message_type NOT IN ('text', 'proposal') THEN RETURN NEW; END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Only notify if the sender is the customer (message TO provider)
  IF NEW.sender_user_id = _conv.provider_user_id THEN RETURN NEW; END IF;

  SELECT title INTO _job_title FROM public.jobs WHERE id = _conv.job_id;
  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), full_name, 'A customer') INTO _customer_name
  FROM public.profiles WHERE id = _conv.customer_user_id;

  IF NEW.message_type = 'proposal' THEN
    _notif_title := 'New proposal from ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'a customer');
    _notif_body := 'You have received a new proposal for "' || COALESCE(_job_title, 'a job') || '". Log in to review and respond.';
    _email_subject := 'BookATrade: ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'A customer') || ' sent a proposal for "' || COALESCE(_job_title, 'a job') || '"';
    _email_html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
      || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
      || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
      || '</div>'
      || '<div style="padding:24px 0;">'
      || '<p style="font-size:15px;color:#333;">Hi there,</p>'
      || '<div style="background:#f4f4f8;border-left:4px solid #0366d6;padding:16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0 0 8px;font-weight:bold;font-size:16px;color:#0366d6;">📝 New Proposal Received</p>'
      || '<p style="margin:0;font-size:14px;color:#555;"><strong>' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'A customer') || '</strong> has sent you a proposal for "<strong>' || COALESCE(_job_title, 'a job') || '</strong>". Log in to review the terms and respond.</p>'
      || '</div>'
      || '<div style="text-align:center;padding:16px 0;">'
      || '<a href="' || _site_url || '/provider/messages" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review Proposal</a>'
      || '</div>'
      || '</div>'
      || '<div style="text-align:center;padding-top:16px;border-top:1px solid #eee;">'
      || '<p style="font-size:12px;color:#aaa;margin:0;">&copy; BookATrade. All rights reserved.</p>'
      || '</div>'
      || '</div>';
  ELSE
    _notif_title := 'New message from ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'a customer');
    _notif_body := 'Message regarding "' || COALESCE(_job_title, 'a job') || '"';
    _email_subject := 'New message on BookATrade';
    _email_html := '<h2>New message from ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'a customer') || '</h2><p>Regarding "<strong>' || COALESCE(_job_title, 'a job') || '</strong>".</p><p>Log in to your BookATrade dashboard to view and reply.</p>';
  END IF;

  -- In-app notification
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _conv.provider_user_id,
    CASE WHEN NEW.message_type = 'proposal' THEN 'new_proposal' ELSE 'new_message' END,
    _notif_title,
    _notif_body,
    '/provider/messages'
  );

  -- Email notification
  SELECT * INTO _provider_profile FROM public.provider_profiles WHERE user_id = _conv.provider_user_id;
  IF _provider_profile.email_notifications_enabled THEN
    SELECT email INTO _provider_email FROM public.profiles WHERE id = _conv.provider_user_id;
    _supabase_url := public._supabase_url();
    _service_role_key := public._supabase_anon_key();
    IF _provider_email IS NOT NULL AND _provider_email != '' AND _supabase_url IS NOT NULL AND _service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-provider-email',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _service_role_key),
        body := jsonb_build_object('to', _provider_email, 'subject', _email_subject, 'html', _email_html)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Update customer message notification trigger to also handle 'proposal' messages from providers
CREATE OR REPLACE FUNCTION public.notify_customer_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conv RECORD;
  _job_title TEXT;
  _provider_name TEXT;
  _notif_title TEXT;
  _notif_body TEXT;
BEGIN
  -- Only handle text and proposal messages
  IF NEW.message_type NOT IN ('text', 'proposal') THEN RETURN NEW; END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  -- Only notify if the sender is the PROVIDER
  IF NEW.sender_user_id != _conv.provider_user_id THEN RETURN NEW; END IF;

  SELECT title INTO _job_title FROM public.jobs WHERE id = _conv.job_id;
  SELECT business_name INTO _provider_name FROM public.provider_profiles WHERE user_id = _conv.provider_user_id;

  IF NEW.message_type = 'proposal' THEN
    _notif_title := 'New proposal from ' || COALESCE(_provider_name, 'a provider');
    _notif_body := 'You have received a new proposal for "' || COALESCE(_job_title, 'a job') || '". Log in to review and respond.';
  ELSE
    _notif_title := 'New message from ' || COALESCE(_provider_name, 'a provider');
    _notif_body := 'Message regarding "' || COALESCE(_job_title, 'a job') || '"';
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _conv.customer_user_id,
    CASE WHEN NEW.message_type = 'proposal' THEN 'new_proposal' ELSE 'new_message' END,
    _notif_title,
    _notif_body,
    '/dashboard/messages'
  );
  RETURN NEW;
END;
$$;
