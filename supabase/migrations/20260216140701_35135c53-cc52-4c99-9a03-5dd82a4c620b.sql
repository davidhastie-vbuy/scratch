
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Users can update own notifications (mark read)
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

-- System inserts via triggers (SECURITY DEFINER)
-- Allow service role / triggers to insert
CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Trigger: notify customer when a quote is submitted
CREATE OR REPLACE FUNCTION public.notify_on_new_quote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job RECORD;
  _provider RECORD;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  SELECT business_name INTO _provider FROM public.provider_profiles WHERE user_id = NEW.provider_user_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    _job.customer_user_id,
    'new_quote',
    'New quote received',
    COALESCE(_provider.business_name, 'A provider') || ' has quoted on "' || _job.title || '"',
    '/dashboard/jobs/' || _job.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_quote_notify
AFTER INSERT ON public.quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_quote();

-- Trigger: notify provider when invited to a job
CREATE OR REPLACE FUNCTION public.notify_on_job_invitation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _job RECORD;
BEGIN
  SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
  
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (
    NEW.provider_user_id,
    'job_invitation',
    'You''ve been invited to quote',
    'A customer has invited you to quote on "' || _job.title || '"',
    '/provider/jobs'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_job_invitation_notify
AFTER INSERT ON public.job_invitations
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_job_invitation();
