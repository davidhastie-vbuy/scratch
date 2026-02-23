
-- =============================================================
-- Security-definer helpers – bypass RLS to break circular refs
-- =============================================================

CREATE OR REPLACE FUNCTION public.provider_has_declined_quote(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.quotes WHERE job_id = _job_id AND provider_user_id = _user_id AND status = 'declined')
$$;

CREATE OR REPLACE FUNCTION public.provider_is_invited(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.job_invitations WHERE job_id = _job_id AND provider_user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.provider_is_eligible(_category text, _postcode text, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.provider_profiles pp
    WHERE pp.user_id = _user_id AND pp.status = 'active'
      AND (pp.trade_category = _category OR _category = ANY(pp.additional_categories))
      AND pp.operating_areas && ARRAY[_postcode]
  )
$$;

CREATE OR REPLACE FUNCTION public.is_job_customer(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND customer_user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_job_provider(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND provider_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_job_participant(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.jobs WHERE id = _job_id AND (customer_user_id = _user_id OR provider_id = _user_id))
$$;

CREATE OR REPLACE FUNCTION public.get_job_provider_id(_job_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT provider_id FROM public.jobs WHERE id = _job_id
$$;

CREATE OR REPLACE FUNCTION public.get_job_status(_job_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT status::text FROM public.jobs WHERE id = _job_id
$$;

-- =============================================================
-- JOBS policies (no self-reference, no cross-table RLS triggers)
-- =============================================================

DROP POLICY IF EXISTS "Providers can view eligible jobs" ON public.jobs;
CREATE POLICY "Providers can view eligible jobs" ON public.jobs FOR SELECT
USING (
  public.provider_is_eligible(category, postcode_district, auth.uid())
  AND NOT public.provider_has_declined_quote(id, auth.uid())
);

DROP POLICY IF EXISTS "Providers can view invited jobs" ON public.jobs;
CREATE POLICY "Providers can view invited jobs" ON public.jobs FOR SELECT
USING (public.provider_is_invited(id, auth.uid()));

-- =============================================================
-- QUOTES policies (avoid querying jobs with RLS)
-- =============================================================

DROP POLICY IF EXISTS "Customers can view quotes on own jobs" ON public.quotes;
CREATE POLICY "Customers can view quotes on own jobs" ON public.quotes FOR SELECT
USING (public.is_job_customer(job_id, auth.uid()));

DROP POLICY IF EXISTS "Quote participants can update" ON public.quotes;
CREATE POLICY "Quote participants can update" ON public.quotes FOR UPDATE
USING (provider_user_id = auth.uid() OR public.is_job_customer(job_id, auth.uid()) OR is_admin());

-- =============================================================
-- CONVERSATIONS (avoid querying quotes with RLS)
-- =============================================================

DROP POLICY IF EXISTS "Conversation participants can view" ON public.conversations;
CREATE POLICY "Conversation participants can view" ON public.conversations FOR SELECT
USING (
  customer_user_id = auth.uid()
  OR (provider_user_id = auth.uid() AND NOT public.provider_has_declined_quote(job_id, auth.uid()))
  OR is_admin()
);

-- =============================================================
-- MESSAGES (avoid querying jobs with RLS)
-- =============================================================

DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages" ON public.messages FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
      AND (public.get_job_provider_id(c.job_id) IS NULL OR c.provider_user_id = public.get_job_provider_id(c.job_id))
      AND public.get_job_status(c.job_id) NOT IN ('completed', 'cancelled')
  )
);

DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages" ON public.messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.customer_user_id = auth.uid()
        OR (c.provider_user_id = auth.uid() AND NOT public.provider_has_declined_quote(c.job_id, auth.uid()))
      )
  )
  OR is_admin()
);

-- =============================================================
-- MESSAGE_ATTACHMENTS
-- =============================================================

DROP POLICY IF EXISTS "Conversation participants can view attachments" ON public.message_attachments;
CREATE POLICY "Conversation participants can view attachments" ON public.message_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_attachments.message_id
      AND (c.customer_user_id = auth.uid()
        OR (c.provider_user_id = auth.uid() AND NOT public.provider_has_declined_quote(c.job_id, auth.uid())))
  )
  OR is_admin()
);

-- =============================================================
-- JOB_MEDIA
-- =============================================================

DROP POLICY IF EXISTS "Job media viewable by job participants" ON public.job_media;
CREATE POLICY "Job media viewable by job participants" ON public.job_media FOR SELECT
USING (user_id = auth.uid() OR is_admin() OR public.is_job_participant(job_id, auth.uid()));

-- =============================================================
-- JOB_MILESTONES
-- =============================================================

DROP POLICY IF EXISTS "Job participants can view milestones" ON public.job_milestones;
CREATE POLICY "Job participants can view milestones" ON public.job_milestones FOR SELECT
USING (public.is_job_participant(job_id, auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Participants can update milestones" ON public.job_milestones;
CREATE POLICY "Participants can update milestones" ON public.job_milestones FOR UPDATE
USING (public.is_job_participant(job_id, auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Providers can create milestones" ON public.job_milestones;
CREATE POLICY "Providers can create milestones" ON public.job_milestones FOR INSERT
WITH CHECK (created_by = auth.uid() AND public.is_job_provider(job_id, auth.uid()));

-- =============================================================
-- JOB_DISPUTES
-- =============================================================

DROP POLICY IF EXISTS "Dispute participants can view disputes" ON public.job_disputes;
CREATE POLICY "Dispute participants can view disputes" ON public.job_disputes FOR SELECT
USING (public.is_job_participant(job_id, auth.uid()) OR is_admin());

DROP POLICY IF EXISTS "Job participants can raise disputes" ON public.job_disputes;
CREATE POLICY "Job participants can raise disputes" ON public.job_disputes FOR INSERT
WITH CHECK (raised_by = auth.uid() AND public.is_job_participant(job_id, auth.uid()));

-- =============================================================
-- DISPUTE_MESSAGES
-- =============================================================

DROP POLICY IF EXISTS "Dispute participants can view messages" ON public.dispute_messages;
CREATE POLICY "Dispute participants can view messages" ON public.dispute_messages FOR SELECT
USING (
  (NOT is_admin_only AND EXISTS (
    SELECT 1 FROM job_disputes d WHERE d.id = dispute_messages.dispute_id
      AND public.is_job_participant(d.job_id, auth.uid())
  ))
  OR is_admin()
);

DROP POLICY IF EXISTS "Participants can send dispute messages" ON public.dispute_messages;
CREATE POLICY "Participants can send dispute messages" ON public.dispute_messages FOR INSERT
WITH CHECK (
  sender_user_id = auth.uid()
  AND (is_admin() OR (NOT is_admin_only AND EXISTS (
    SELECT 1 FROM job_disputes d WHERE d.id = dispute_messages.dispute_id
      AND public.is_job_participant(d.job_id, auth.uid())
  )))
);

-- =============================================================
-- MILESTONE_COMMENTS
-- =============================================================

DROP POLICY IF EXISTS "Job participants can view milestone comments" ON public.milestone_comments;
CREATE POLICY "Job participants can view milestone comments" ON public.milestone_comments FOR SELECT
USING (
  EXISTS (SELECT 1 FROM job_milestones m WHERE m.id = milestone_comments.milestone_id AND public.is_job_participant(m.job_id, auth.uid()))
  OR is_admin()
);

DROP POLICY IF EXISTS "Job participants can add milestone comments" ON public.milestone_comments;
CREATE POLICY "Job participants can add milestone comments" ON public.milestone_comments FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (SELECT 1 FROM job_milestones m WHERE m.id = milestone_comments.milestone_id AND public.is_job_participant(m.job_id, auth.uid()))
);

-- =============================================================
-- JOB_INVITATIONS (INSERT references jobs)
-- =============================================================

DROP POLICY IF EXISTS "Customers can create invitations" ON public.job_invitations;
CREATE POLICY "Customers can create invitations" ON public.job_invitations FOR INSERT
WITH CHECK (customer_user_id = auth.uid() AND public.is_job_customer(job_id, auth.uid()));
