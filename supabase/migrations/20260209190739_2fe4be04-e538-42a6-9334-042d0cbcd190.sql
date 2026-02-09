
-- Create trade_categories table
CREATE TABLE public.trade_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trade_categories ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read active categories
CREATE POLICY "Anyone can view active categories"
  ON public.trade_categories FOR SELECT
  USING (true);

-- Only admins can insert
CREATE POLICY "Admins can insert categories"
  ON public.trade_categories FOR INSERT
  WITH CHECK (is_admin());

-- Only admins can update
CREATE POLICY "Admins can update categories"
  ON public.trade_categories FOR UPDATE
  USING (is_admin());

-- Only admins can delete
CREATE POLICY "Admins can delete categories"
  ON public.trade_categories FOR DELETE
  USING (is_admin());

-- Seed with existing enum values
INSERT INTO public.trade_categories (name, slug) VALUES
  ('Plumbing', 'plumbing'),
  ('Electrical', 'electrical'),
  ('Carpentry', 'carpentry'),
  ('Painting & Decorating', 'painting_decorating'),
  ('Roofing', 'roofing'),
  ('Landscaping', 'landscaping'),
  ('Plastering', 'plastering'),
  ('Tiling', 'tiling'),
  ('Gas & Heating', 'gas_heating'),
  ('Locksmith', 'locksmith'),
  ('Cleaning', 'cleaning'),
  ('General Maintenance', 'general_maintenance'),
  ('Other', 'other');

-- Convert provider_profiles.trade_category from enum to text
ALTER TABLE public.provider_profiles
  ALTER COLUMN trade_category TYPE TEXT USING trade_category::TEXT;

-- Update default
ALTER TABLE public.provider_profiles
  ALTER COLUMN trade_category SET DEFAULT 'other';

-- Update handle_new_provider trigger to cast to text instead of enum
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
      COALESCE(NEW.raw_user_meta_data->>'trade_category', 'other'),
      COALESCE(NEW.raw_user_meta_data->>'business_description', ''),
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Add updated_at trigger
CREATE TRIGGER update_trade_categories_updated_at
  BEFORE UPDATE ON public.trade_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
