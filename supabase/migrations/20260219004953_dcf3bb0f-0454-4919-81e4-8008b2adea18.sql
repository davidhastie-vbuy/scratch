
-- Allow providers to delete their own non-auto milestones (for re-setup)
CREATE POLICY "Providers can delete own milestones"
ON public.job_milestones
FOR DELETE
USING (
  (created_by = auth.uid() AND is_auto = false)
  OR is_admin()
);
