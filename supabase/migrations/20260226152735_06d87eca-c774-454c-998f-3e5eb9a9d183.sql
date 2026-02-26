
-- Allow providers who can see a job (eligible or invited) to also see its media
CREATE POLICY "Eligible providers can view job media"
ON public.job_media
FOR SELECT
USING (
  provider_is_eligible(
    (SELECT category FROM public.jobs WHERE id = job_media.job_id),
    (SELECT postcode_district FROM public.jobs WHERE id = job_media.job_id),
    auth.uid()
  )
  OR provider_is_invited(job_media.job_id, auth.uid())
);
