
CREATE OR REPLACE FUNCTION public.email_customer_on_escrow_payment_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer RECORD;
  _provider_name TEXT;
  _job RECORD;
  _milestone_title TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
BEGIN
  -- Only fire when status changes to 'held'
  IF NEW.status = 'held' AND (OLD.status IS NULL OR OLD.status != 'held') THEN

    SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
    IF NOT FOUND THEN RETURN NEW; END IF;

    SELECT email, first_name INTO _customer
    FROM public.profiles WHERE id = NEW.customer_user_id;
    IF _customer.email IS NULL OR _customer.email = '' THEN RETURN NEW; END IF;

    SELECT business_name INTO _provider_name
    FROM public.provider_profiles WHERE user_id = NEW.provider_user_id;
    _provider_name := COALESCE(_provider_name, 'Your provider');

    IF NEW.milestone_id IS NOT NULL THEN
      SELECT title INTO _milestone_title FROM public.job_milestones WHERE id = NEW.milestone_id;
    END IF;
    _milestone_title := COALESCE(_milestone_title, 'Milestone payment');

    _supabase_url := current_setting('app.settings.supabase_url', true);
    _service_role_key := current_setting('app.settings.service_role_key', true);
    IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

    _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
      || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
      || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
      || '</div>'
      || '<div style="padding:24px 0;">'
      || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_customer.first_name), ''), 'there') || ',</p>'
      || '<p style="font-size:15px;color:#333;">Your payment of <strong>£' || TRIM(TO_CHAR(NEW.amount, 'FM999,999,990.00')) || '</strong> for "<strong>' || _milestone_title || '</strong>" on job "<strong>' || _job.title || '</strong>" has been received and is now held securely in escrow.</p>'
      || '<div style="background:#f0faf0;border-left:4px solid #22863a;padding:16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#22863a;">✓ Payment Confirmed</p>'
      || '<p style="margin:0;font-size:14px;color:#555;"><strong>' || _provider_name || '</strong> can now proceed with the next stage of your job. Your funds are protected until you approve the completed work.</p>'
      || '</div>'
      || '<p style="font-size:14px;color:#555;">You can track progress on your job dashboard at any time.</p>'
      || '<div style="text-align:center;padding:16px 0;">'
      || '<a href="' || _site_url || '/dashboard/jobs/' || _job.id::text || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">View Job Progress</a>'
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
        'to', _customer.email,
        'subject', 'BookATrade: Payment confirmed for "' || _milestone_title || '" — ' || _job.title,
        'html', _html
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_escrow_payment_confirmed_email_customer
  AFTER UPDATE ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.email_customer_on_escrow_payment_confirmed();
