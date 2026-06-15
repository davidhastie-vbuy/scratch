
-- Table for customer recommendations (sent to admin)
CREATE TABLE public.customer_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  message TEXT,
  photo_urls TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view recommendations"
ON public.customer_recommendations FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can delete recommendations"
ON public.customer_recommendations FOR DELETE
USING (is_admin());

-- Public bucket so admin can access photo URLs
INSERT INTO storage.buckets (id, name, public) VALUES ('recommendation-photos', 'recommendation-photos', true) ON CONFLICT (id) DO NOTHING;

-- Anyone can view (public bucket)
CREATE POLICY "Public can view recommendation photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'recommendation-photos');
