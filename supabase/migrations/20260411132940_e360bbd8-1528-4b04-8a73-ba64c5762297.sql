CREATE POLICY "Authenticated users can view provider documents storage"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'provider-documents');