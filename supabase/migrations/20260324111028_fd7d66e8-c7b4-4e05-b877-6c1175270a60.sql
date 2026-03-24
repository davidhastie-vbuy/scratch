CREATE OR REPLACE FUNCTION public.is_valid_message_update(
  _id uuid,
  _conversation_id uuid,
  _sender_user_id uuid,
  _body text,
  _message_type text,
  _created_at timestamp with time zone
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.id = _id
      AND m.conversation_id = _conversation_id
      AND m.sender_user_id = _sender_user_id
      AND m.body = _body
      AND m.message_type = _message_type
      AND m.created_at = _created_at
  );
$$;

DROP POLICY IF EXISTS "Users can mark messages read" ON public.messages;
DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;

CREATE POLICY "Participants can update messages"
ON public.messages
FOR UPDATE
TO public
USING (
  (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.customer_user_id = auth.uid()
          OR (
            c.provider_user_id = auth.uid()
            AND NOT public.provider_has_declined_quote(c.job_id, auth.uid())
          )
        )
    )
  )
  OR public.is_admin()
)
WITH CHECK (
  public.is_admin()
  OR (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (
          c.customer_user_id = auth.uid()
          OR (
            c.provider_user_id = auth.uid()
            AND NOT public.provider_has_declined_quote(c.job_id, auth.uid())
          )
        )
    )
    AND public.is_valid_message_update(id, conversation_id, sender_user_id, body, message_type, created_at)
  )
);