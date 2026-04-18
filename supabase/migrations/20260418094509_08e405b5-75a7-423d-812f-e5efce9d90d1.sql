-- Add a column for the full postcode (display-only)
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS full_postcode text;

-- Backfill existing rows with the district as a sensible fallback
UPDATE public.jobs
SET full_postcode = postcode_district
WHERE full_postcode IS NULL;