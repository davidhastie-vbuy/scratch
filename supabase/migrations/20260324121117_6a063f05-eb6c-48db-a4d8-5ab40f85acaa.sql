
-- Allow admins to insert messages into any conversation (for dispute replies & status updates)
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;

CREATE POLICY "Conversation participants can send messages"
ON public.messages
FOR INSERT
TO public
WITH CHECK (
  (sender_user_id = auth.uid()) AND (
    is_admin()
    OR
    (EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
        AND (get_job_provider_id(c.job_id) IS NULL OR c.provider_user_id = get_job_provider_id(c.job_id))
        AND (get_job_status(c.job_id) <> ALL (ARRAY['completed','cancelled']) OR is_job_within_message_window(c.job_id))
    ))
  )
);
