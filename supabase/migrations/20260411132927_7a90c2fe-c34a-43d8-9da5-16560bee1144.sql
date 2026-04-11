CREATE POLICY "Authenticated users can view active provider documents"
ON public.provider_documents
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.provider_profiles pp
    WHERE pp.id = provider_documents.provider_profile_id
      AND pp.status = 'active'
  )
);