
-- Add scheduling columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN scheduled_start timestamp with time zone DEFAULT NULL,
ADD COLUMN scheduled_end timestamp with time zone DEFAULT NULL;
