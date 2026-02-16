
-- Job invitations: customer invites a provider to quote on a specific job
CREATE TABLE public.job_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL,
  customer_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, viewed, quoted, expired
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Prevent duplicate invitations
CREATE UNIQUE INDEX idx_job_invitations_unique ON public.job_invitations(job_id, provider_user_id);

ALTER TABLE public.job_invitations ENABLE ROW LEVEL SECURITY;

-- Customers can create invitations for their own jobs
CREATE POLICY "Customers can create invitations"
ON public.job_invitations FOR INSERT
WITH CHECK (
  customer_user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND customer_user_id = auth.uid())
);

-- Customers can view invitations they sent
CREATE POLICY "Customers can view own invitations"
ON public.job_invitations FOR SELECT
USING (customer_user_id = auth.uid());

-- Providers can view invitations sent to them
CREATE POLICY "Providers can view their invitations"
ON public.job_invitations FOR SELECT
USING (provider_user_id = auth.uid());

-- Providers can update invitation status (e.g. mark viewed)
CREATE POLICY "Providers can update their invitations"
ON public.job_invitations FOR UPDATE
USING (provider_user_id = auth.uid());

-- Admins can view all
CREATE POLICY "Admins can view all invitations"
ON public.job_invitations FOR SELECT
USING (is_admin());
