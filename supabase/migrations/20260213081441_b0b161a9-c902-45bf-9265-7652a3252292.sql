
-- Create provider_documents table
CREATE TABLE public.provider_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_profile_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_documents ENABLE ROW LEVEL SECURITY;

-- Provider can view own docs
CREATE POLICY "Providers can view own documents"
ON public.provider_documents FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- Provider can insert own docs
CREATE POLICY "Providers can insert own documents"
ON public.provider_documents FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Provider can delete own docs
CREATE POLICY "Providers can delete own documents"
ON public.provider_documents FOR DELETE
USING (user_id = auth.uid() OR public.is_admin());
