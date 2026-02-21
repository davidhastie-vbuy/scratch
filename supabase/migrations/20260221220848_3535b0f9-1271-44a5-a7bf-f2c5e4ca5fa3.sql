
-- 1) Notify CUSTOMER when a provider sends them a message
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
BEGIN
  -- Skip system/proposal messages
  IF NEW.message_type != 'text' THEN RETURN NEW; END IF;
  
  SELECT * INTO _conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  
  -- Only notify if the sender is the PROVIDER
  IF NEW.sender_user_id != _conv.provider_user_id THEN RETURN NEW; END IF;
  
  SELECT title INTO _job_title FROM public.jobs WHERE id = _conv.job_id;
  SELECT business_name INTO _provider_name FROM public.provider_profiles WHERE user_id = _conv.provider_user_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _conv.customer_user_id,
    'new_message',
    'New message from ' || COALESCE(_provider_name, 'a provider'),
    'Message regarding "' || COALESCE(_job_title, 'a job') || '"',
    '/dashboard/messages'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_customer_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_new_message();

-- 2) Update the existing provider message notification to include customer name
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
BEGIN
  IF NEW.message_type != 'text' THEN RETURN NEW; END IF;

  SELECT * INTO _conv FROM public.conversations WHERE id = NEW.conversation_id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  
  -- Only notify if the sender is the customer
  IF NEW.sender_user_id = _conv.provider_user_id THEN RETURN NEW; END IF;
  
  SELECT title INTO _job_title FROM public.jobs WHERE id = _conv.job_id;
  SELECT COALESCE(first_name || ' ' || last_name, full_name, 'A customer') INTO _customer_name
  FROM public.profiles WHERE id = _conv.customer_user_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _conv.provider_user_id,
    'new_message',
    'New message from ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'a customer'),
    'Message regarding "' || COALESCE(_job_title, 'a job') || '"',
    '/provider/messages'
  );
  
  -- Email notification (keep existing behavior)
  SELECT * INTO _provider_profile FROM public.provider_profiles WHERE user_id = _conv.provider_user_id;
  IF _provider_profile.email_notifications_enabled THEN
    SELECT email INTO _provider_email FROM public.profiles WHERE id = _conv.provider_user_id;
    _supabase_url := current_setting('app.settings.supabase_url', true);
    _service_role_key := current_setting('app.settings.service_role_key', true);
    IF _provider_email IS NOT NULL AND _provider_email != '' AND _supabase_url IS NOT NULL AND _service_role_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-provider-email',
        headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || _service_role_key),
        body := jsonb_build_object('to', _provider_email, 'subject', 'New message on TradeTrust',
          'html', '<h2>New message from ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'a customer') || '</h2><p>Regarding "<strong>' || COALESCE(_job_title, 'a job') || '</strong>".</p><p>Log in to your TradeTrust dashboard to view and reply.</p>')
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3) Notify on quote status changes (accepted/declined)
CREATE OR REPLACE FUNCTION public.notify_on_quote_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job RECORD;
  _provider_name TEXT;
  _customer_name TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  SELECT business_name INTO _provider_name FROM public.provider_profiles WHERE user_id = NEW.provider_user_id;
  SELECT COALESCE(first_name || ' ' || last_name, full_name) INTO _customer_name FROM public.profiles WHERE id = _job.customer_user_id;

  -- Quote accepted → notify provider
  IF NEW.status = 'accepted' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.provider_user_id,
      'quote_accepted',
      'Your quote was accepted!',
      'Your quote for "' || _job.title || '" has been accepted by ' || COALESCE(NULLIF(TRIM(_customer_name), ''), 'the customer') || '.',
      '/provider/quotes'
    );
  END IF;

  -- Quote declined → notify provider
  IF NEW.status = 'declined' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      NEW.provider_user_id,
      'quote_declined',
      'Quote not selected',
      'Your quote for "' || _job.title || '" was not selected.',
      '/provider/quotes'
    );
  END IF;

  -- Quote withdrawn → notify customer
  IF NEW.status = 'withdrawn' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      _job.customer_user_id,
      'quote_withdrawn',
      'Quote withdrawn',
      COALESCE(_provider_name, 'A provider') || ' has withdrawn their quote for "' || _job.title || '".',
      '/dashboard/jobs/' || _job.id::text
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_quote_status_change
  AFTER UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_quote_status_change();

-- 4) Notify on job status changes
CREATE OR REPLACE FUNCTION public.notify_on_job_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _provider_name TEXT;
  _customer_name TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  SELECT business_name INTO _provider_name FROM public.provider_profiles WHERE user_id = NEW.provider_id;
  SELECT COALESCE(first_name || ' ' || last_name, full_name) INTO _customer_name FROM public.profiles WHERE id = NEW.customer_user_id;

  -- Job in_progress → notify both
  IF NEW.status = 'in_progress' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (NEW.customer_user_id, 'job_in_progress', 'Job started', '"' || NEW.title || '" is now in progress.', '/dashboard/jobs/' || NEW.id::text);
    IF NEW.provider_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
      (NEW.provider_id, 'job_in_progress', 'Job started', '"' || NEW.title || '" is now in progress.', '/provider/jobs/' || NEW.id::text);
    END IF;
  END IF;

  -- Job completed → notify both
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (NEW.customer_user_id, 'job_completed', 'Job completed', '"' || NEW.title || '" has been marked as completed.', '/dashboard/jobs/' || NEW.id::text);
    IF NEW.provider_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
      (NEW.provider_id, 'job_completed', 'Job completed', '"' || NEW.title || '" has been marked as completed.', '/provider/jobs/' || NEW.id::text);
    END IF;
  END IF;

  -- Job cancelled → notify both
  IF NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (NEW.customer_user_id, 'job_cancelled', 'Job cancelled', '"' || NEW.title || '" has been cancelled.', '/dashboard/jobs/' || NEW.id::text);
    IF NEW.provider_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
      (NEW.provider_id, 'job_cancelled', 'Job cancelled', '"' || NEW.title || '" has been cancelled.', '/provider/jobs/' || NEW.id::text);
    END IF;
  END IF;

  -- Job accepted → notify customer
  IF NEW.status = 'accepted' AND NEW.provider_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (NEW.customer_user_id, 'job_accepted', 'Job accepted', '"' || NEW.title || '" has been accepted by ' || COALESCE(_provider_name, 'a provider') || '.', '/dashboard/jobs/' || NEW.id::text);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_job_status_change
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_job_status_change();

-- 5) Notify on milestone status changes
CREATE OR REPLACE FUNCTION public.notify_on_milestone_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job RECORD;
  _provider_name TEXT;
BEGIN
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  SELECT business_name INTO _provider_name FROM public.provider_profiles WHERE user_id = _job.provider_id;

  -- Milestone completed → notify customer
  IF NEW.status = 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (_job.customer_user_id, 'milestone_completed', 'Milestone completed',
     COALESCE(_provider_name, 'Your provider') || ' marked "' || NEW.title || '" as complete on "' || _job.title || '".',
     '/dashboard/jobs/' || _job.id::text);
  END IF;

  -- Milestone accepted → notify provider
  IF NEW.status = 'accepted' AND _job.provider_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (_job.provider_id, 'milestone_accepted', 'Milestone approved',
     'Customer approved milestone "' || NEW.title || '" on "' || _job.title || '".',
     '/provider/jobs/' || _job.id::text);
  END IF;

  -- Milestone flagged → notify provider
  IF NEW.status = 'flagged' AND _job.provider_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link) VALUES
    (_job.provider_id, 'milestone_flagged', 'Milestone flagged',
     'Customer flagged milestone "' || NEW.title || '" on "' || _job.title || '".',
     '/provider/jobs/' || _job.id::text);
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_milestone_status_change
  AFTER UPDATE ON public.job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_milestone_status_change();
