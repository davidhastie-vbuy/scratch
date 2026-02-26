
-- Table for admin-editable legal pages (terms, privacy) per audience
CREATE TABLE public.legal_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL,
  audience text NOT NULL CHECK (audience IN ('customer', 'provider')),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid,
  UNIQUE (slug, audience)
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read (public pages)
CREATE POLICY "Anyone can view legal pages"
  ON public.legal_pages FOR SELECT
  USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "Admins can insert legal pages"
  ON public.legal_pages FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update legal pages"
  ON public.legal_pages FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete legal pages"
  ON public.legal_pages FOR DELETE
  USING (is_admin());

-- Seed default pages
INSERT INTO public.legal_pages (slug, audience, title, content) VALUES
  ('terms-of-service', 'customer', 'Customer Terms of Service', 'These are the Terms of Service for customers using TradeTrust. This content can be edited by an administrator.'),
  ('terms-of-service', 'provider', 'Provider Terms of Service', 'These are the Terms of Service for providers using TradeTrust. This content can be edited by an administrator.'),
  ('privacy-policy', 'customer', 'Customer Privacy Policy', 'This is the Privacy Policy for customers using TradeTrust. This content can be edited by an administrator.'),
  ('privacy-policy', 'provider', 'Provider Privacy Policy', 'This is the Privacy Policy for providers using TradeTrust. This content can be edited by an administrator.');
