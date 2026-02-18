
-- Add milestones_confirmed flag to jobs table
ALTER TABLE public.jobs ADD COLUMN milestones_confirmed boolean NOT NULL DEFAULT false;
