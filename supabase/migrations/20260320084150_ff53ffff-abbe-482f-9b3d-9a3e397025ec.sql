
-- 1. Trigger function: email customer when a new quote is submitted
CREATE OR REPLACE FUNCTION public.email_customer_on_new_quote()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _job RECORD;
  _customer RECORD;
  _provider_name TEXT;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT email, first_name INTO _customer
  FROM public.profiles WHERE id = _job.customer_user_id;
  IF _customer.email IS NULL OR _customer.email = '' THEN RETURN NEW; END IF;

  SELECT business_name INTO _provider_name
  FROM public.provider_profiles WHERE user_id = NEW.provider_user_id;
  _provider_name := COALESCE(_provider_name, 'A provider');

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

  _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
    || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
    || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
    || '</div>'
    || '<div style="padding:24px 0;">'
    || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_customer.first_name), ''), 'there') || ',</p>'
    || '<p style="font-size:15px;color:#333;">Great news! <strong>' || _provider_name || '</strong> has submitted a quote on your job "<strong>' || _job.title || '</strong>".</p>'
    || '<p style="font-size:15px;color:#333;">Log in to review their quote and start a conversation to get your job moving.</p>'
    || '<div style="text-align:center;padding:16px 0;">'
    || '<a href="' || _site_url || '/dashboard/jobs/' || _job.id::text || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review Quote</a>'
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
      'subject', 'BookATrade: New quote on "' || _job.title || '" from ' || _provider_name,
      'html', _html
    )
  );

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS on_new_quote_email_customer ON public.quotes;
CREATE TRIGGER on_new_quote_email_customer
  AFTER INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.email_customer_on_new_quote();

-- 2. Add a reminder_sent_at column to quotes for tracking the 24h reminder
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz DEFAULT NULL;
