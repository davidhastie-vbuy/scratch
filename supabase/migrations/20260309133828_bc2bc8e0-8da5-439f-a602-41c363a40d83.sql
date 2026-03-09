
-- Helper function: check if a completed/cancelled job is within 72h messaging window
CREATE OR REPLACE FUNCTION public.is_job_within_message_window(_job_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs
    WHERE id = _job_id
      AND status IN ('completed', 'cancelled')
      AND updated_at > (now() - interval '72 hours')
  )
$$;

-- Update the INSERT policy on messages to allow 72h grace period
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages"
ON public.messages
FOR INSERT
TO public
WITH CHECK (
  (sender_user_id = auth.uid()) AND (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
      AND (get_job_provider_id(c.job_id) IS NULL OR c.provider_user_id = get_job_provider_id(c.job_id))
      AND (
        get_job_status(c.job_id) NOT IN ('completed', 'cancelled')
        OR is_job_within_message_window(c.job_id)
      )
  ))
);
