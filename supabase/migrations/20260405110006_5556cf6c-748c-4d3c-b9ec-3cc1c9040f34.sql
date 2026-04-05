
DROP VIEW IF EXISTS public.public_provider_profiles;

CREATE VIEW public.public_provider_profiles
WITH (security_invoker = true)
AS
SELECT
  id, user_id, business_name, trade_category, additional_categories,
  public_bio, logo_url, banner_url, operating_areas, accreditations,
  years_experience, status, about_work, business_description,
  qualifications_certifications, email_notifications_enabled,
  created_at, updated_at
FROM public.provider_profiles
WHERE status = 'active'::provider_status;
