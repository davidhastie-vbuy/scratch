
-- Portfolio projects table for provider showcases
CREATE TABLE public.provider_portfolio_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_profile_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_portfolio_projects ENABLE ROW LEVEL SECURITY;

-- Providers manage their own projects
CREATE POLICY "Providers can view own projects"
  ON public.provider_portfolio_projects FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Providers can insert own projects"
  ON public.provider_portfolio_projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Providers can update own projects"
  ON public.provider_portfolio_projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Providers can delete own projects"
  ON public.provider_portfolio_projects FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- Logged-in customers can view projects of active providers
CREATE POLICY "Authenticated users can view active provider projects"
  ON public.provider_portfolio_projects FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_profiles pp
      WHERE pp.id = provider_portfolio_projects.provider_profile_id
        AND pp.status = 'active'
    )
  );

-- Portfolio images table
CREATE TABLE public.provider_portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.provider_portfolio_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own images"
  ON public.provider_portfolio_images FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Providers can insert own images"
  ON public.provider_portfolio_images FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Providers can delete own images"
  ON public.provider_portfolio_images FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can view active provider images"
  ON public.provider_portfolio_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM provider_portfolio_projects ppp
      JOIN provider_profiles pp ON pp.id = ppp.provider_profile_id
      WHERE ppp.id = provider_portfolio_images.project_id
        AND pp.status = 'active'
    )
  );

-- Add a public_bio field to provider_profiles for the public page
ALTER TABLE public.provider_profiles ADD COLUMN IF NOT EXISTS public_bio TEXT;

-- Trigger for updated_at on portfolio projects
CREATE TRIGGER update_portfolio_projects_updated_at
  BEFORE UPDATE ON public.provider_portfolio_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio images
CREATE POLICY "Anyone authenticated can view portfolio images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Providers can upload portfolio images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Providers can delete own portfolio images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'portfolio-images' AND auth.uid()::text = (storage.foldername(name))[1]);
