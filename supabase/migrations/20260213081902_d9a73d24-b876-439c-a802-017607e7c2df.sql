
-- Extend provider_status enum with new statuses
ALTER TYPE public.provider_status ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE public.provider_status ADD VALUE IF NOT EXISTS 'denied';
ALTER TYPE public.provider_status ADD VALUE IF NOT EXISTS 'changes_requested';

-- Add admin_note column to provider_profiles
ALTER TABLE public.provider_profiles
  ADD COLUMN IF NOT EXISTS admin_note text;

-- Create application_status_history table
CREATE TABLE public.application_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_profile_id uuid NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;

-- Admin can view all history
CREATE POLICY "Admins can view status history"
ON public.application_status_history FOR SELECT
USING (public.is_admin());

-- Admin can insert history
CREATE POLICY "Admins can insert status history"
ON public.application_status_history FOR INSERT
WITH CHECK (public.is_admin());

-- Providers can view their own history
CREATE POLICY "Providers can view own status history"
ON public.application_status_history FOR SELECT
USING (
  provider_profile_id IN (
    SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
  )
);
