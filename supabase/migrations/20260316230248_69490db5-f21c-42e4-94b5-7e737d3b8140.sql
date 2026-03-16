
-- Make job-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'job-media';

-- Make recommendation-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'recommendation-photos';

-- Drop overly permissive storage policies for job-media
DROP POLICY IF EXISTS "Anyone can view job media" ON storage.objects;

-- Create restrictive SELECT policy for job-media: only job participants and admins
CREATE POLICY "Job participants can view job media" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'job-media'
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.job_media jm
      JOIN public.jobs j ON j.id = jm.job_id
      WHERE jm.file_url = name
      AND (
        j.customer_user_id = auth.uid()
        OR j.provider_id = auth.uid()
        OR public.provider_is_eligible(j.category, j.postcode_district, auth.uid())
        OR public.provider_is_invited(j.id, auth.uid())
      )
    )
  )
);

-- Create restrictive SELECT policy for recommendation-photos: admins only
DROP POLICY IF EXISTS "Anyone can view recommendation photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view recommendation photos" ON storage.objects;

CREATE POLICY "Only admins can view recommendation photos" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'recommendation-photos'
  AND public.is_admin()
);
