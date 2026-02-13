-- Allow authenticated users to view active provider profiles (for Local Trades directory)
CREATE POLICY "Authenticated users can view active providers"
ON public.provider_profiles
FOR SELECT
USING (status = 'active'::provider_status);