
-- Fix: Allow providers to update jobs they are assigned to
DROP POLICY "Customers can update own jobs" ON public.jobs;

CREATE POLICY "Job owner or assigned provider can update"
ON public.jobs
FOR UPDATE
USING (
  (customer_user_id = auth.uid()) 
  OR (provider_id = auth.uid()) 
  OR is_admin()
);

-- Clean up duplicate milestones for job 47930d1a-c706-4f48-8d66-cdafd8489dee
-- Keep only the latest set (created_at = '2026-02-19 00:46:36.717628+00')
DELETE FROM public.job_milestones 
WHERE job_id = '47930d1a-c706-4f48-8d66-cdafd8489dee' 
  AND is_auto = false 
  AND created_at < '2026-02-19 00:46:36';
