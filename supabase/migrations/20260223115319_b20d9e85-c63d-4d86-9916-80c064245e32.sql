
-- Block message inserts on conversations where a different provider was selected
DROP POLICY IF EXISTS "Conversation participants can send messages" ON public.messages;
CREATE POLICY "Conversation participants can send messages" ON public.messages
FOR INSERT WITH CHECK (
  sender_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM conversations c
    JOIN jobs j ON j.id = c.job_id
    WHERE c.id = messages.conversation_id
      AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
      AND (
        j.provider_id IS NULL
        OR c.provider_user_id = j.provider_id
      )
  )
);
