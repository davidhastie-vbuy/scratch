
CREATE TABLE public.schedule_change_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  proposed_start TIMESTAMPTZ NOT NULL,
  proposed_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.schedule_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job participants can view schedule requests"
  ON public.schedule_change_requests FOR SELECT
  USING (is_job_participant(job_id, auth.uid()) OR is_admin());

CREATE POLICY "Provider can create schedule requests"
  ON public.schedule_change_requests FOR INSERT
  WITH CHECK (requested_by = auth.uid() AND is_job_provider(job_id, auth.uid()));

CREATE POLICY "Customer can update schedule requests"
  ON public.schedule_change_requests FOR UPDATE
  USING (is_job_customer(job_id, auth.uid()) OR is_admin());
