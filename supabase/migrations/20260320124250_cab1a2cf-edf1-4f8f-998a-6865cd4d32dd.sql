
-- Create helper functions to provide config values to email triggers
CREATE OR REPLACE FUNCTION public._supabase_url() RETURNS TEXT LANGUAGE sql IMMUTABLE SECURITY DEFINER AS $$
  SELECT 'https://gkiohsumxlzqfnnjflgb.supabase.co'::text;
$$;

CREATE OR REPLACE FUNCTION public._supabase_anon_key() RETURNS TEXT LANGUAGE sql IMMUTABLE SECURITY DEFINER AS $$
  SELECT 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdraW9oc3VteGx6cWZubmpmbGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NTQ2OTUsImV4cCI6MjA4NjIzMDY5NX0.kT4NNDjDkb99ytLZVnfxsHYjx3_BZHwnjOx81kZQyNE'::text;
$$;
