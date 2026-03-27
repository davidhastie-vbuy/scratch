
-- Update email_providers_on_new_job: replace TradeTrust with BookATrade
CREATE OR REPLACE FUNCTION public.email_providers_on_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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

  _cat_label := REPLACE(NEW.category, '_', ' ');
  _cat_label := INITCAP(_cat_label);

  FOR _provider IN
    SELECT pp.user_id, pp.contact_first_name, p.email, pp.email_notifications_enabled
    FROM public.provider_profiles pp
    JOIN public.profiles p ON p.id = pp.user_id
    WHERE pp.status = 'active'
      AND p.email IS NOT NULL AND p.email != ''
      AND NEW.postcode_district = ANY(pp.operating_areas)
      AND (pp.trade_category = NEW.category OR NEW.category = ANY(pp.additional_categories))
  LOOP
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (
      _provider.user_id,
      'new_job',
      'New ' || _cat_label || ' job in ' || NEW.postcode_district,
      '"' || NEW.title || '" — ' || LEFT(NEW.description, 100) || CASE WHEN LENGTH(NEW.description) > 100 THEN '...' ELSE '' END,
      '/provider/jobs'
    );

    IF _provider.email_notifications_enabled AND _supabase_url IS NOT NULL AND _service_role_key IS NOT NULL THEN
      _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
        || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
        || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
        || '</div>'
        || '<div style="padding:24px 0;">'
        || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_provider.contact_first_name), ''), 'there') || ',</p>'
        || '<p style="font-size:15px;color:#333;">A new <strong>' || _cat_label || '</strong> job has been posted in <strong>' || NEW.postcode_district || '</strong> that matches your profile:</p>'
        || '<div style="background:#f4f4f8;border-left:4px solid #1a1a2e;padding:16px;margin:16px 0;border-radius:4px;">'
        || '<p style="margin:0 0 6px;font-weight:bold;font-size:16px;color:#1a1a2e;">' || NEW.title || '</p>'
        || '<p style="margin:0;font-size:14px;color:#555;">' || LEFT(NEW.description, 200) || CASE WHEN LENGTH(NEW.description) > 200 THEN '…' ELSE '' END || '</p>'
        || '</div>'
        || '<div style="text-align:center;padding:16px 0;">'
        || '<a href="' || _site_url || '/provider/jobs" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">View Available Jobs</a>'
        || '</div>'
        || '<p style="font-size:13px;color:#999;margin-top:24px;">Log in to your BookATrade dashboard to view full details and submit a quote.</p>'
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
          'to', _provider.email,
          'subject', 'New ' || _cat_label || ' job in ' || NEW.postcode_district || ' — BookATrade',
          'html', _html
        )
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Update email_provider_on_changes_requested: replace TradeTrust with BookATrade
CREATE OR REPLACE FUNCTION public.email_provider_on_changes_requested()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _provider_email TEXT;
  _business_name TEXT;
  _admin_note TEXT;
  _base_url TEXT;
  _subject TEXT;
  _html TEXT;
  _edge_url TEXT;
  _service_role TEXT;
BEGIN
  IF NEW.status IS DISTINCT FROM 'changes_requested' THEN
    RETURN NEW;
  END IF;
  IF OLD.status IS NOT DISTINCT FROM 'changes_requested' THEN
    RETURN NEW;
  END IF;

  _business_name := NEW.business_name;
  _admin_note := COALESCE(NEW.admin_note, '');

  SELECT email INTO _provider_email
  FROM auth.users
  WHERE id = NEW.user_id;

  IF _provider_email IS NULL THEN
    RETURN NEW;
  END IF;

  _base_url := 'https://bookatrade.lovable.app';
  _subject := 'Changes Requested on Your BookATrade Application';

  _html := '<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">'
    || '<h2 style="color:#1a1a1a;">Changes Requested</h2>'
    || '<p>Hi ' || _business_name || ',</p>'
    || '<p>An admin has reviewed your BookATrade application and has requested some changes before it can be approved.</p>';

  IF _admin_note != '' THEN
    _html := _html
      || '<div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0;font-weight:600;color:#92400E;">Admin Note:</p>'
      || '<p style="margin:8px 0 0 0;color:#78350F;">' || _admin_note || '</p>'
      || '</div>';
  END IF;

  _html := _html
    || '<p>Please log in to review the feedback and resubmit your application:</p>'
    || '<p style="text-align:center;margin:24px 0;">'
    || '<a href="' || _base_url || '/provider/account" style="display:inline-block;background:#1a1a2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review &amp; Resubmit</a>'
    || '</p>'
    || '<p style="font-size:13px;color:#999;">If you have questions, please contact support.</p>'
    || '</body></html>';

  _edge_url := current_setting('app.settings.supabase_url', true);
  _service_role := current_setting('app.settings.service_role_key', true);

  IF _edge_url IS NOT NULL AND _service_role IS NOT NULL THEN
    PERFORM net.http_post(
      url := _edge_url || '/functions/v1/send-provider-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || _service_role
      ),
      body := jsonb_build_object(
        'to', _provider_email,
        'subject', _subject,
        'html', _html
      )
    );
  END IF;

  RETURN NEW;
END;
$$;
