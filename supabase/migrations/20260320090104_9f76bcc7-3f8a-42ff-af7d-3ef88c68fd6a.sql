
CREATE OR REPLACE FUNCTION public.email_customer_on_milestone_completed()
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
  _total_milestones INT;
  _completed_milestones INT;
  _is_final BOOLEAN;
  _next_info TEXT;
BEGIN
  -- Only fire when status changes to 'completed'
  IF NEW.status != 'completed' OR OLD.status IS NOT DISTINCT FROM NEW.status THEN RETURN NEW; END IF;

  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT email, first_name INTO _customer FROM public.profiles WHERE id = _job.customer_user_id;
  IF _customer.email IS NULL OR _customer.email = '' THEN RETURN NEW; END IF;

  SELECT business_name INTO _provider_name FROM public.provider_profiles WHERE user_id = _job.provider_id;
  _provider_name := COALESCE(_provider_name, 'Your provider');

  -- Check if this is the final milestone
  SELECT COUNT(*) INTO _total_milestones FROM public.job_milestones WHERE job_id = NEW.job_id;
  SELECT COUNT(*) INTO _completed_milestones FROM public.job_milestones WHERE job_id = NEW.job_id AND status IN ('completed', 'accepted');
  _is_final := (_completed_milestones >= _total_milestones);

  _supabase_url := current_setting('app.settings.supabase_url', true);
  _service_role_key := current_setting('app.settings.service_role_key', true);
  IF _supabase_url IS NULL OR _service_role_key IS NULL THEN RETURN NEW; END IF;

  IF _is_final THEN
    _next_info := '<p style="font-size:14px;color:#555;">This is the <strong>final stage</strong> of the job. If you''re happy with the work, please accept the milestone to complete the job.</p>'
      || '<div style="background:#f4f4f8;border-left:4px solid #6f42c1;padding:16px;margin:16px 0;border-radius:4px;">'
      || '<p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#6f42c1;">⭐ Leave a Review</p>'
      || '<p style="margin:0;font-size:14px;color:#555;">Once the job is complete, please take a moment to leave a review. Your feedback helps others in your local community find trusted tradespeople.</p>'
      || '</div>';
  ELSE
    _next_info := '<p style="font-size:14px;color:#555;">If you''re happy with the work on this stage, please log in and accept the milestone. Your next milestone payment will be due soon as the provider moves on to the next stage.</p>';
  END IF;

  _html := '<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;">'
    || '<div style="text-align:center;padding-bottom:16px;border-bottom:2px solid #1a1a2e;">'
    || '<h1 style="margin:0;font-size:22px;color:#1a1a2e;">BookATrade</h1>'
    || '</div>'
    || '<div style="padding:24px 0;">'
    || '<p style="font-size:15px;color:#333;">Hi ' || COALESCE(NULLIF(TRIM(_customer.first_name), ''), 'there') || ',</p>'
    || '<p style="font-size:15px;color:#333;"><strong>' || _provider_name || '</strong> has marked "<strong>' || NEW.title || '</strong>" as complete on your job "<strong>' || _job.title || '</strong>".</p>'
    || '<div style="background:#f0faf0;border-left:4px solid #22863a;padding:16px;margin:16px 0;border-radius:4px;">'
    || '<p style="margin:0 0 8px;font-weight:bold;font-size:15px;color:#22863a;">✓ Milestone Completed</p>'
    || '<p style="margin:0;font-size:14px;color:#555;">Please review the completed work and accept the milestone if you are satisfied.</p>'
    || '</div>'
    || _next_info
    || '<div style="text-align:center;padding:16px 0;">'
    || '<a href="' || _site_url || '/dashboard/jobs/' || _job.id::text || '" style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:6px;font-size:15px;font-weight:bold;">Review Milestone</a>'
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
      'subject', CASE WHEN _is_final
        THEN 'BookATrade: Final milestone completed — "' || _job.title || '"'
        ELSE 'BookATrade: Milestone completed — "' || NEW.title || '" on "' || _job.title || '"'
      END,
      'html', _html
    )
  );

  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_milestone_completed_email_customer
  AFTER UPDATE ON public.job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.email_customer_on_milestone_completed();
