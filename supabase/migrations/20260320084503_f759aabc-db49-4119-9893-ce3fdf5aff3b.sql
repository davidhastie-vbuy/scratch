
CREATE OR REPLACE FUNCTION public.email_customer_on_milestones_confirmed()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer RECORD;
  _provider_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
  _deposit_milestone RECORD;
BEGIN
  -- Only fire when milestones_confirmed changes to true
  IF NEW.milestones_confirmed = true AND (OLD.milestones_confirmed IS NULL OR OLD.milestones_confirmed = false) THEN

    SELECT email, first_name INTO _customer
    FROM public.profiles WHERE id = NEW.customer_user_id;
    IF _customer.email IS NULL OR _customer.email = '' THEN RETURN NEW; END IF;

    SELECT business_name INTO _provider_name
    FROM public.provider_profiles WHERE user_id = NEW.provider_id;
    _provider_name := COALESCE(_provider_name, 'Your provider');

    -- Get the deposit milestone (lowest sort_order)
    SELECT title, payment_amount INTO _deposit_milestone
    FROM public.job_milestones
    WHERE job_id = NEW.id
    ORDER BY sort_order ASC
    LIMIT 1;

    _supabase_url := current_setting('app.settings.supabase_url', true);
    _service_role_key := current_setting('app.settings.service_role_key', true);
    IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

    _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
      || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
      || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
      || '</div>'
      || '<div style="padding:24px 0;">'
      || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_customer.first_name), ''), 'there') || ',</p>'
      || '<p style="font-size:15px;color:#333;">Great news! <strong>' || _provider_name || '</strong> has set up the milestones for your job "<strong>' || NEW.title || '</strong>".</p>'
      || '<div style="background:#f4f4f8;border-left:4px solid #1a1a2e;padding:16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#1a1a2e;">Action Required: Pay Your Deposit</p>'
      || '<p style="margin:0;font-size:14px;color:#555;">To finalise your job and ensure work begins on the agreed date, please log in and pay your deposit'
      || CASE WHEN _deposit_milestone.payment_amount IS NOT NULL THEN ' of <strong>£' || TRIM(TO_CHAR(_deposit_milestone.payment_amount, 'FM999,999,990.00')) || '</strong>' ELSE '' END
      || '.</p>'
      || '</div>'
      || '<p style="font-size:14px;color:#555;">Once the deposit is received, your job will be confirmed and the provider can begin work as scheduled.</p>'
      || '<div style="text-align:center;padding:16px 0;">'
      || '<a href="' || _site_url || '/dashboard/jobs/' || NEW.id::text || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Pay Deposit Now</a>'
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
        'subject', 'BookATrade: Pay your deposit to finalise "' || NEW.title || '"',
        'html', _html
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER on_milestones_confirmed_email_customer
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.email_customer_on_milestones_confirmed();
