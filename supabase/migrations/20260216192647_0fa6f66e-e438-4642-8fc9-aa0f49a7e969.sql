
-- Milestone status enum
CREATE TYPE public.milestone_status AS ENUM ('pending', 'completed', 'accepted', 'flagged');

-- Job milestones table
CREATE TABLE public.job_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  status public.milestone_status NOT NULL DEFAULT 'pending',
  is_auto BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  flag_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.job_milestones ENABLE ROW LEVEL SECURITY;

-- Milestone comments (the accept/flag/reconfirm conversation)
CREATE TABLE public.milestone_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  milestone_id UUID NOT NULL REFERENCES public.job_milestones(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  body TEXT,
  action TEXT NOT NULL CHECK (action IN ('complete', 'accept', 'flag', 'reconfirm')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.milestone_comments ENABLE ROW LEVEL SECURITY;

-- Dispute status enum
CREATE TYPE public.dispute_status AS ENUM ('open', 'under_review', 'resolved', 'closed');

-- Job disputes table
CREATE TABLE public.job_disputes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.dispute_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_disputes ENABLE ROW LEVEL SECURITY;

-- Dispute messages
CREATE TABLE public.dispute_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES public.job_disputes(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_admin_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- RLS: job_milestones
CREATE POLICY "Job participants can view milestones"
  ON public.job_milestones FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_milestones.job_id AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid()))
    OR is_admin()
  );

CREATE POLICY "Providers can create milestones"
  ON public.job_milestones FOR INSERT
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_milestones.job_id AND j.provider_id = auth.uid())
  );

CREATE POLICY "Participants can update milestones"
  ON public.job_milestones FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_milestones.job_id AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid()))
    OR is_admin()
  );

-- RLS: milestone_comments
CREATE POLICY "Job participants can view milestone comments"
  ON public.milestone_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.job_milestones m
      JOIN public.jobs j ON j.id = m.job_id
      WHERE m.id = milestone_comments.milestone_id
      AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid())
    )
    OR is_admin()
  );

CREATE POLICY "Job participants can add milestone comments"
  ON public.milestone_comments FOR INSERT
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.job_milestones m
      JOIN public.jobs j ON j.id = m.job_id
      WHERE m.id = milestone_comments.milestone_id
      AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid())
    )
  );

-- RLS: job_disputes
CREATE POLICY "Dispute participants can view disputes"
  ON public.job_disputes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_disputes.job_id AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid()))
    OR is_admin()
  );

CREATE POLICY "Job participants can raise disputes"
  ON public.job_disputes FOR INSERT
  WITH CHECK (
    raised_by = auth.uid() AND
    EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_disputes.job_id AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid()))
  );

CREATE POLICY "Admins can update disputes"
  ON public.job_disputes FOR UPDATE
  USING (is_admin());

-- RLS: dispute_messages
CREATE POLICY "Dispute participants can view messages"
  ON public.dispute_messages FOR SELECT
  USING (
    (NOT is_admin_only AND EXISTS (
      SELECT 1 FROM public.job_disputes d
      JOIN public.jobs j ON j.id = d.job_id
      WHERE d.id = dispute_messages.dispute_id
      AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid())
    ))
    OR is_admin()
  );

CREATE POLICY "Participants can send dispute messages"
  ON public.dispute_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid() AND
    (
      is_admin()
      OR (NOT is_admin_only AND EXISTS (
        SELECT 1 FROM public.job_disputes d
        JOIN public.jobs j ON j.id = d.job_id
        WHERE d.id = dispute_messages.dispute_id
        AND (j.customer_user_id = auth.uid() OR j.provider_id = auth.uid())
      ))
    )
  );

-- Trigger to auto-create Start and Finish milestones when job goes to in_progress
CREATE OR REPLACE FUNCTION public.auto_create_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    -- Only create if none exist yet
    IF NOT EXISTS (SELECT 1 FROM public.job_milestones WHERE job_id = NEW.id AND is_auto = true) THEN
      INSERT INTO public.job_milestones (job_id, title, sort_order, is_auto, created_by)
      VALUES
        (NEW.id, 'Work Started', 0, true, NEW.provider_id),
        (NEW.id, 'Work Complete', 1000, true, NEW.provider_id);
      -- Auto-mark "Work Started" as completed+accepted
      UPDATE public.job_milestones SET status = 'accepted', completed_at = now()
      WHERE job_id = NEW.id AND title = 'Work Started' AND is_auto = true;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_milestones
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_milestones();

-- Update trigger for disputes
CREATE TRIGGER update_disputes_updated_at
  BEFORE UPDATE ON public.job_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
