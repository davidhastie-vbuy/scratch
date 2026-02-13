
-- Job status enum
CREATE TYPE public.job_status AS ENUM (
  'open', 'quoted', 'quotes_closed', 'accepted', 'in_progress', 'completed', 'cancelled'
);

-- Quote status enum
CREATE TYPE public.quote_status AS ENUM (
  'pending', 'accepted', 'declined', 'withdrawn'
);

-- Ticket status enum
CREATE TYPE public.ticket_status AS ENUM (
  'open', 'in_progress', 'resolved', 'closed'
);

-- ============ JOBS TABLE ============
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  postcode_district TEXT NOT NULL,
  timeline TEXT,
  budget TEXT,
  status public.job_status NOT NULL DEFAULT 'open',
  provider_id UUID,
  quote_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Customers see own jobs
CREATE POLICY "Customers can view own jobs"
  ON public.jobs FOR SELECT
  USING (customer_user_id = auth.uid() OR is_admin());

-- Approved providers can see eligible open jobs
CREATE POLICY "Providers can view eligible jobs"
  ON public.jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.provider_profiles pp
      WHERE pp.user_id = auth.uid()
        AND pp.status = 'active'
        AND pp.trade_category = jobs.category
        AND pp.operating_areas && ARRAY[jobs.postcode_district]
    )
  );

-- Customers can create jobs
CREATE POLICY "Customers can create jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (
    customer_user_id = auth.uid()
    AND public.has_role(auth.uid(), 'customer')
  );

-- Customers can update own jobs
CREATE POLICY "Customers can update own jobs"
  ON public.jobs FOR UPDATE
  USING (customer_user_id = auth.uid() OR is_admin());

-- Admins can delete jobs
CREATE POLICY "Admins can delete jobs"
  ON public.jobs FOR DELETE
  USING (is_admin());

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ JOB_MEDIA TABLE ============
CREATE TABLE public.job_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job media viewable by job participants"
  ON public.job_media FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = job_media.job_id
    )
  );

CREATE POLICY "Customers can upload job media"
  ON public.job_media FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Customers can delete own job media"
  ON public.job_media FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

-- ============ QUOTES TABLE ============
CREATE TABLE public.quotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_user_id UUID NOT NULL,
  price_min NUMERIC(10,2) NOT NULL,
  price_max NUMERIC(10,2) NOT NULL,
  message TEXT,
  availability TEXT,
  estimated_duration TEXT,
  status public.quote_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Unique: one quote per provider per job
CREATE UNIQUE INDEX idx_quotes_provider_job ON public.quotes(job_id, provider_user_id);

-- Providers see own quotes
CREATE POLICY "Providers can view own quotes"
  ON public.quotes FOR SELECT
  USING (provider_user_id = auth.uid() OR is_admin());

-- Customers see quotes on their jobs
CREATE POLICY "Customers can view quotes on own jobs"
  ON public.quotes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = quotes.job_id AND j.customer_user_id = auth.uid()
    )
  );

-- Providers can submit quotes (max 3 enforced in app + trigger)
CREATE POLICY "Providers can submit quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (
    provider_user_id = auth.uid()
    AND public.has_role(auth.uid(), 'provider')
  );

-- Providers can update own quotes, customers can accept/decline
CREATE POLICY "Quote participants can update"
  ON public.quotes FOR UPDATE
  USING (
    provider_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.jobs j WHERE j.id = quotes.job_id AND j.customer_user_id = auth.uid()
    )
    OR is_admin()
  );

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to enforce max 3 quotes and update job quote_count
CREATE OR REPLACE FUNCTION public.check_quote_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count INT;
BEGIN
  SELECT COUNT(*) INTO current_count FROM public.quotes WHERE job_id = NEW.job_id;
  IF current_count >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 quotes per job has been reached.';
  END IF;
  -- Update the quote_count on the job
  UPDATE public.jobs SET quote_count = current_count + 1 WHERE id = NEW.job_id;
  -- If now 3, close quotes
  IF current_count + 1 >= 3 THEN
    UPDATE public.jobs SET status = 'quotes_closed' WHERE id = NEW.job_id AND status = 'open';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_quote_limit
  BEFORE INSERT ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.check_quote_limit();

-- ============ CONVERSATIONS TABLE ============
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  customer_user_id UUID NOT NULL,
  provider_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, customer_user_id, provider_user_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view"
  ON public.conversations FOR SELECT
  USING (customer_user_id = auth.uid() OR provider_user_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (customer_user_id = auth.uid() OR provider_user_id = auth.uid());

-- ============ MESSAGES TABLE ============
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
    )
    OR is_admin()
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
    )
  );

CREATE POLICY "Users can mark messages read"
  ON public.messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
    )
  );

-- ============ SUPPORT TICKETS ============
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tickets"
  ON public.support_tickets FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users and admins can update tickets"
  ON public.support_tickets FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUPPORT TICKET MESSAGES ============
CREATE TABLE public.support_ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_user_id UUID NOT NULL,
  body TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Users see non-internal messages on own tickets; admins see all
CREATE POLICY "Users can view ticket messages"
  ON public.support_ticket_messages FOR SELECT
  USING (
    is_admin()
    OR (
      NOT is_internal_note
      AND EXISTS (
        SELECT 1 FROM public.support_tickets t
        WHERE t.id = support_ticket_messages.ticket_id AND t.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add ticket messages"
  ON public.support_ticket_messages FOR INSERT
  WITH CHECK (
    sender_user_id = auth.uid()
    AND (
      is_admin()
      OR (
        NOT is_internal_note
        AND EXISTS (
          SELECT 1 FROM public.support_tickets t
          WHERE t.id = support_ticket_messages.ticket_id AND t.user_id = auth.uid()
        )
      )
    )
  );

-- ============ STORAGE BUCKET FOR JOB MEDIA ============
INSERT INTO storage.buckets (id, name, public) VALUES ('job-media', 'job-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for job-media
CREATE POLICY "Anyone can view job media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-media');

CREATE POLICY "Customers can upload job media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Customers can delete own job media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'job-media' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
