ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_address text,
  ADD COLUMN IF NOT EXISTS job_phone text,
  ADD COLUMN IF NOT EXISTS access_notes text;