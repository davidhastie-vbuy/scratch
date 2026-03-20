
CREATE OR REPLACE FUNCTION public.email_provider_on_first_deposit()
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
  _existing_count INT;
  _start_date TEXT;
BEGIN
  -- Only fire when status changes to 'held'
  IF NEW.status != 'held' OR (OLD.status IS NOT NULL AND OLD.status = 'held') THEN RETURN NEW; END IF;

  -- Check this is the FIRST held payment for this job
  SELECT COUNT(*) INTO _existing_count
  FROM public.escrow_payments
  WHERE job_id = NEW.job_id AND status IN ('held', 'released') AND id != NEW.id;
  IF _existing_count > 0 THEN RETURN NEW; END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT * INTO _provider FROM public.provider_profiles WHERE user_id = NEW.provider_user_id;
  IF NOT FOUND OR NOT _provider.email_notifications_enabled THEN RETURN NEW; END IF;

  SELECT email INTO _provider_email FROM public.profiles WHERE id = NEW.provider_user_id;
  IF _provider_email IS NULL OR _provider_email = '' THEN RETURN NEW; END IF;

  SELECT COALESCE(NULLIF(TRIM(first_name || ' ' || last_name), ''), full_name, 'The customer') INTO _customer_name
  FROM public.profiles WHERE id = NEW.customer_user_id;

  _start_date := COALESCE(TO_CHAR(_job.scheduled_start AT TIME ZONE 'Europe/London', 'DD Month YYYY'), 'not yet confirmed');

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

  _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
    || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
    || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
    || '</div>'
    || '<div style="padding:24px 0;">'
    || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_provider.contact_first_name), ''), 'there') || ',</p>'
    || '<p style="font-size:15px;color:#333;">Great news! <strong>' || _customer_name || '</strong> has paid the deposit for "<strong>' || _job.title || '</strong>". The job is now fully confirmed and has been added to your calendar.</p>'
    || '<div style="background:#f0faf0;border-left:4px solid #22863a;padding:16px;margin:16px 0;border-radius:4px;">'
    || '<p style="margin:0 0 8px;font-weight:bold;font-size:16px;color:#22863a;">✓ Job Fully Accepted</p>'
    || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Job:</strong> ' || _job.title || '</p>'
    || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Agreed Price:</strong> £' || TRIM(TO_CHAR(COALESCE(_job.agreed_price, 0), 'FM999,999,990.00')) || '</p>'
    || '<p style="margin:0;font-size:14px;color:#555;"><strong>Scheduled Start:</strong> ' || _start_date || '</p>'
    || '</div>'
    || '<p style="font-size:14px;color:#555;">Please ensure you are ready to begin work on <strong>' || _start_date || '</strong>. If there are any changes required to the job or schedule, please contact the customer in advance to discuss.</p>'
    || '<div style="text-align:center;padding:16px 0;">'
    || '<a href="' || _site_url || '/provider/jobs/' || _job.id::text || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">View Job Details</a>'
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
      'subject', 'BookATrade: Job confirmed — "' || _job.title || '" starting ' || _start_date,
      'html', _html
    )
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_first_deposit_email_provider
  AFTER UPDATE ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.email_provider_on_first_deposit();
