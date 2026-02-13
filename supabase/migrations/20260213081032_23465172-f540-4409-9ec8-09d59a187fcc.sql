
-- Add new columns to provider_profiles for onboarding
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS years_experience text,
  ADD COLUMN IF NOT EXISTS qualifications_certifications text,
  ADD COLUMN IF NOT EXISTS about_work text,
  ADD COLUMN IF NOT EXISTS accreditations text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS supporting_documents text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS operating_areas text[] DEFAULT '{}';

-- Create storage bucket for provider supporting documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('provider-documents', 'provider-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: providers can upload their own documents
CREATE POLICY "Providers can upload own documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'provider-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS: providers can view their own documents
CREATE POLICY "Providers can view own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'provider-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
  )
);

-- RLS: providers can delete their own documents
CREATE POLICY "Providers can delete own documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'provider-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
