
CREATE OR REPLACE FUNCTION public.email_provider_on_job_cancelled()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _provider RECORD;
  _provider_email TEXT;
  _customer_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
  _cat_label TEXT;
  _conv RECORD;
BEGIN
  -- Only fire when status changes to cancelled from a pre-acceptance state
  IF NEW.status != 'cancelled' THEN RETURN NEW; END IF;
  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;
  IF OLD.status IN ('accepted', 'in_progress', 'completed') THEN RETURN NEW; END IF;

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), full_name, 'A customer') INTO _customer_name
  FROM public.profiles WHERE id = NEW.customer_user_id;

  _cat_label := INITCAP(REPLACE(NEW.category, '_', ' '));

  -- Email all providers who had a conversation on this job
  FOR _conv IN
    SELECT DISTINCT c.provider_user_id
    FROM public.conversations c
    WHERE c.job_id = NEW.id
  LOOP
    SELECT * INTO _provider FROM public.provider_profiles WHERE user_id = _conv.provider_user_id;
    IF NOT FOUND OR NOT _provider.email_notifications_enabled THEN CONTINUE; END IF;

    SELECT email INTO _provider_email FROM public.profiles WHERE id = _conv.provider_user_id;
    IF _provider_email IS NULL OR _provider_email = '' THEN CONTINUE; END IF;

    _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
      || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
      || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
      || '</div>'
      || '<div style="padding:24px 0;">'
      || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_provider.contact_first_name), ''), 'there') || ',</p>'
      || '<p style="font-size:15px;color:#333;">We''re writing to let you know that a job you were discussing has been cancelled by the customer.</p>'
      || '<div style="background:#f4f4f8;border-left:4px solid #cb2431;padding:16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#cb2431;">Job Cancelled</p>'
      || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Job:</strong> ' || NEW.title || '</p>'
      || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Category:</strong> ' || _cat_label || '</p>'
      || '<p style="margin:0;font-size:14px;color:#555;"><strong>Area:</strong> ' || NEW.postcode_district || '</p>'
      || '</div>'
      || '<p style="font-size:14px;color:#555;">This job is no longer available. You can explore other available jobs in your area.</p>'
      || '<div style="text-align:center;padding:16px 0;">'
      || '<a href="' || _site_url || '/provider/jobs" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">View Available Jobs</a>'
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
        'subject', 'BookATrade: Job cancelled — "' || NEW.title || '"',
        'html', _html
      )
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_job_cancelled_email_provider
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.email_provider_on_job_cancelled();
