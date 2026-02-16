-- Allow providers to view jobs they've been invited to
CREATE POLICY "Providers can view invited jobs"
ON public.jobs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM job_invitations ji
    WHERE ji.job_id = jobs.id
    AND ji.provider_user_id = auth.uid()
  )
);