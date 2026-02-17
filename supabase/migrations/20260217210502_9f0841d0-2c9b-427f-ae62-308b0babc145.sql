
-- Add pending_operating_areas column for provider area change requests
ALTER TABLE public.provider_profiles
ADD COLUMN pending_operating_areas text[] DEFAULT NULL;
