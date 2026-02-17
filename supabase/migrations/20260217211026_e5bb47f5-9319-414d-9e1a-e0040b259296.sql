
-- Add additional categories columns
ALTER TABLE public.provider_profiles
ADD COLUMN additional_categories text[] DEFAULT '{}'::text[],
ADD COLUMN pending_additional_categories text[] DEFAULT NULL;

-- Drop existing RLS policy for providers viewing eligible jobs
DROP POLICY IF EXISTS "Providers can view eligible jobs" ON public.jobs;

-- Recreate with support for additional_categories
CREATE POLICY "Providers can view eligible jobs"
ON public.jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM provider_profiles pp
    WHERE pp.user_id = auth.uid()
      AND pp.status = 'active'::provider_status
      AND (
        pp.trade_category = jobs.category
        OR jobs.category = ANY(pp.additional_categories)
      )
      AND pp.operating_areas && ARRAY[jobs.postcode_district]
  )
);
