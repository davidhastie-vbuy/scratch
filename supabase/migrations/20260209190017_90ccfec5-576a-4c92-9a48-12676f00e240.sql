
-- Provider status enum
CREATE TYPE public.provider_status AS ENUM ('pending', 'active', 'suspended');

-- Trade category enum
CREATE TYPE public.trade_category AS ENUM (
  'plumbing',
  'electrical',
  'carpentry',
  'painting_decorating',
  'roofing',
  'landscaping',
  'plastering',
  'tiling',
  'gas_heating',
  'locksmith',
  'cleaning',
  'general_maintenance',
  'other'
);

-- Provider profiles table
CREATE TABLE public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  business_address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  trade_category public.trade_category NOT NULL DEFAULT 'other',
  business_description TEXT,
  logo_url TEXT,
  status public.provider_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;

-- Providers can view their own profile
CREATE POLICY "Providers can view own profile"
ON public.provider_profiles FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- Providers can update their own profile
CREATE POLICY "Providers can update own profile"
ON public.provider_profiles FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

-- Anyone authenticated can insert (for application form)
CREATE POLICY "Authenticated users can apply as provider"
ON public.provider_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Admins can delete
CREATE POLICY "Admins can delete provider profiles"
ON public.provider_profiles FOR DELETE
USING (public.is_admin());

-- Updated_at trigger
CREATE TRIGGER update_provider_profiles_updated_at
BEFORE UPDATE ON public.provider_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create provider profile from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'role') = 'provider' THEN
    INSERT INTO public.provider_profiles (
      user_id, business_name, contact_first_name, contact_last_name,
      phone, business_address, postcode, trade_category, business_description, status
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'business_address', ''),
      COALESCE(NEW.raw_user_meta_data->>'postcode', ''),
      COALESCE((NEW.raw_user_meta_data->>'trade_category')::trade_category, 'other'),
      COALESCE(NEW.raw_user_meta_data->>'business_description', ''),
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created_provider
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_provider();

-- Storage bucket for business logos (reuse avatars pattern)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Logo images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

CREATE POLICY "Providers can upload own logo"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can update own logo"
ON storage.objects FOR UPDATE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can delete own logo"
ON storage.objects FOR DELETE
USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);
