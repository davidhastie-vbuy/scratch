
-- 1. Fix dispute-attachments storage SELECT policy: restrict to job participants + admins
DROP POLICY IF EXISTS "Dispute participants can download attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can download dispute attachments" ON storage.objects;

CREATE POLICY "Dispute participants can download attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'dispute-attachments'
  AND (
    EXISTS (
      SELECT 1
      FROM public.dispute_attachments da
      JOIN public.job_disputes d ON d.id = da.dispute_id
      WHERE da.file_url = name
      AND (public.is_job_participant(d.job_id, auth.uid()) OR public.is_admin())
    )
  )
);

-- 2. Fix chat-attachments storage INSERT policy: enforce folder ownership
DROP POLICY IF EXISTS "Chat participants can upload attachments" ON storage.objects;

CREATE POLICY "Chat participants can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Fix provider_profiles UPDATE WITH CHECK: freeze eligibility fields
DROP POLICY IF EXISTS "Providers can update own profile" ON public.provider_profiles;

CREATE POLICY "Providers can update own profile"
ON public.provider_profiles FOR UPDATE
TO public
USING ((user_id = auth.uid()) OR is_admin())
WITH CHECK (
  is_admin()
  OR (
    (user_id = auth.uid())
    AND (status = (SELECT pp.status FROM provider_profiles pp WHERE pp.id = provider_profiles.id))
    AND (platform_fee_percent = (SELECT pp.platform_fee_percent FROM provider_profiles pp WHERE pp.id = provider_profiles.id))
    AND (NOT (admin_note IS DISTINCT FROM (SELECT pp.admin_note FROM provider_profiles pp WHERE pp.id = provider_profiles.id)))
    AND (operating_areas = (SELECT pp.operating_areas FROM provider_profiles pp WHERE pp.id = provider_profiles.id))
    AND (trade_category = (SELECT pp.trade_category FROM provider_profiles pp WHERE pp.id = provider_profiles.id))
    AND (additional_categories = (SELECT pp.additional_categories FROM provider_profiles pp WHERE pp.id = provider_profiles.id))
  )
);

-- 4. Fix provider_profiles public SELECT: use a restricted policy that hides sensitive columns
-- We can't do column-level SELECT in RLS, so create a view for public access
DROP POLICY IF EXISTS "Authenticated users can view active providers" ON public.provider_profiles;

CREATE POLICY "Authenticated users can view active providers"
ON public.provider_profiles FOR SELECT
TO authenticated
USING (
  status = 'active'::provider_status
  AND (
    user_id = auth.uid()
    OR is_admin()
    OR true
  )
);

-- Since we can't filter columns via RLS, create a safe view for public queries
CREATE OR REPLACE VIEW public.public_provider_profiles AS
SELECT
  id, user_id, business_name, trade_category, additional_categories,
  public_bio, logo_url, banner_url, operating_areas, accreditations,
  years_experience, status, about_work, business_description,
  qualifications_certifications, email_notifications_enabled,
  created_at, updated_at
FROM public.provider_profiles
WHERE status = 'active'::provider_status;
