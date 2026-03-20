
-- Drop existing trigger if any, then recreate
DROP TRIGGER IF EXISTS on_new_provider_email_customers ON public.provider_profiles;

-- Update function with improved email content
CREATE OR REPLACE FUNCTION public.email_customers_on_new_provider()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer RECORD;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
  _cat_label TEXT;
  _provider_cats TEXT[];
  _areas_display TEXT;
BEGIN
  IF NEW.status != 'active' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'active' THEN RETURN NEW; END IF;

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

  _provider_cats := ARRAY[NEW.trade_category] || COALESCE(NEW.additional_categories, '{}'::text[]);
  _cat_label := INITCAP(REPLACE(NEW.trade_category, '_', ' '));

  -- Format operating areas as comma-separated list
  _areas_display := ARRAY_TO_STRING(COALESCE(NEW.operating_areas, '{}'::text[]), ', ');

  FOR _customer IN
    SELECT DISTINCT ON (p.id) p.email, p.first_name
    FROM public.jobs j
    JOIN public.profiles p ON p.id = j.customer_user_id
    WHERE j.status IN ('open', 'quoted')
      AND p.email IS NOT NULL AND p.email != ''
      AND j.postcode_district = ANY(COALESCE(NEW.operating_areas, '{}'::text[]))
      AND (j.category = ANY(_provider_cats))
  LOOP
    _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
      || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
      || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
      || '</div>'
      || '<div style="padding:24px 0;">'
      || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_customer.first_name), ''), 'there') || ',</p>'
      || '<p style="font-size:15px;color:#333;">A new ' || _cat_label || ' provider has joined BookATrade in your area!</p>'
      || '<div style="background:#f4f4f8;border-left:4px solid #1a1a2e;padding:16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0 0 8px;font-weight:bold;font-size:16px;color:#1a1a2e;">' || NEW.business_name || '</p>'
      || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Trade:</strong> ' || _cat_label || '</p>'
      || '<p style="margin:0;font-size:14px;color:#555;"><strong>Areas served:</strong> ' || _areas_display || '</p>'
      || '</div>'
      || '<p style="font-size:14px;color:#555;">Visit their profile to learn more and invite them to quote on your jobs.</p>'
      || '<div style="text-align:center;padding:16px 0;">'
      || '<a href="' || _site_url || '/dashboard/provider/' || NEW.user_id || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">View Provider Profile</a>'
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
        'subject', 'New ' || _cat_label || ' provider available in your area — ' || NEW.business_name,
        'html', _html
      )
    );
  END LOOP;

  RETURN NEW;
END;
$function$;

-- Attach trigger
CREATE TRIGGER on_new_provider_email_customers
  AFTER INSERT OR UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.email_customers_on_new_provider();
