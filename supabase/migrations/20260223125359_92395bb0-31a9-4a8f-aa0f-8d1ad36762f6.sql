
-- 1) Make recommendation-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'recommendation-photos';

-- 2) Drop existing public SELECT policy on recommendation-photos
DROP POLICY IF EXISTS "Anyone can view recommendation photos" ON storage.objects;
DROP POLICY IF EXISTS "Public can view recommendation photos" ON storage.objects;

-- 3) Add admin-only SELECT policy for recommendation-photos
CREATE POLICY "Admins can view recommendation photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'recommendation-photos' AND public.is_admin());

-- 4) Ensure service role can still upload (already works via service role key)

-- 5) Restrict user_roles SELECT to own roles + admin
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;

CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());
