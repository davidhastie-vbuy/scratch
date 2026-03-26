
CREATE OR REPLACE FUNCTION public.email_providers_on_new_job()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _provider RECORD;
  _supabase_url TEXT;
  _service_role_key TEXT;
  _site_url TEXT := 'https://bookatrade.lovable.app';
  _html TEXT;
  _cat_label TEXT;
BEGIN
  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);

  -- Format category for display
  _cat_label := REPLACE(NEW.category, '_', ' ');
  _cat_label := INITCAP(_cat_label);

  -- Find all active providers eligible for this job
  FOR _provider IN
    SELECT pp.user_id, pp.contact_first_name, p.email, pp.email_notifications_enabled
    FROM public.provider_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    WHERE pp.status = 'active'
      AND p.email IS NOT NULL AND p.email != ''
      AND NEW.postcode_district = ANY(pp.operating_areas)
      AND (pp.trade_category = NEW.category OR NEW.category = ANY(pp.additional_categories))
  LOOP
    -- Always insert an internal notification
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      _provider.user_id,
      'new_job',
      'New ' || _cat_label || ' job in ' || NEW.postcode_district,
      '"' || NEW.title || '" — ' || LEFT(NEW.description, 100) || CASE WHEN LENGTH(NEW.description) > 100 THEN '...' ELSE '' END,
      '/provider/jobs'
    );

    -- Send email only if email notifications are enabled
    IF _provider.email_notifications_enabled AND _supabase_url IS NOT NULL AND _service_role_key IS NOT NULL THEN
      _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
        || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
        || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">TradeTrust</h1>'
        || '</div>'
        || '<div style="padding:24px 0;">'
        || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_provider.contact_first_name), ''), 'there') || ',</p>'
        || '<p style="font-size:15px;color:#333;">A new job is available in your area that matches your skills:</p>'
        || '<div style="background:#f4f4f8;border-left:4px solid #1a1a2e;padding:16px;margin:16px 0;border-radius:4px;">'
        || '<p style="margin:0 0 8px;font-weight:bold;font-size:16px;color:#1a1a2e;">' || NEW.title || '</p>'
        || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Category:</strong> ' || _cat_label || '</p>'
        || '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Area:</strong> ' || NEW.postcode_district || '</p>'
        || CASE WHEN NEW.timeline IS NOT NULL THEN '<p style="margin:0 0 6px;font-size:14px;color:#555;"><strong>Timeline:</strong> ' || NEW.timeline || '</p>' ELSE '' END
        || '<p style="margin:0;font-size:14px;color:#555;">' || LEFT(NEW.description, 200) || CASE WHEN LENGTH(NEW.description) > 200 THEN '...' ELSE '' END || '</p>'
        || '</div>'
        || '<div style="text-align:center;padding:16px 0;">'
        || '<a href="' || _site_url || '/provider/jobs" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">View Available Jobs</a>'
        || '</div>'
        || '<p style="font-size:13px;color:#999;margin-top:24px;">Log in to your TradeTrust dashboard to view full details and submit a quote.</p>'
        || '</div>'
        || '<div style="text-align:center;padding-top:16px;border-top:1px solid #eee;">'
        || '<p style="font-size:12px;color:#aaa;margin:0;">&copy; TradeTrust. All rights reserved.</p>'
        || '</div>'
        || '</div>';

      PERFORM net.http_post(
        url := _supabase_url || '/functions/v1/send-provider-email',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || _service_role_key
        ),
        body := jsonb_build_object(
          'to', _provider.email,
          'subject', 'New ' || _cat_label || ' job available in ' || NEW.postcode_district,
          'html', _html
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$function$;
