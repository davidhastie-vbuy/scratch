
-- Table for milestone change requests (provider proposes, customer approves/rejects)
CREATE TABLE public.milestone_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  milestone_id uuid NOT NULL REFERENCES public.job_milestones(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  proposed_title text NOT NULL,
  proposed_amount numeric,
  status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.milestone_change_requests ENABLE ROW LEVEL SECURITY;

-- Job participants can view change requests
CREATE POLICY "Job participants can view change requests"
ON public.milestone_change_requests FOR SELECT TO public
USING (is_job_participant(job_id, auth.uid()) OR is_admin());

-- Providers can create change requests for their jobs
CREATE POLICY "Providers can create change requests"
ON public.milestone_change_requests FOR INSERT TO public
WITH CHECK (
  requested_by = auth.uid()
  AND is_job_provider(job_id, auth.uid())
);

-- Customer or admin can update (approve/reject)
CREATE POLICY "Customer or admin can update change requests"
ON public.milestone_change_requests FOR UPDATE TO public
USING (is_job_customer(job_id, auth.uid()) OR is_admin());
