
-- 1. Update eligible-jobs policy to exclude declined providers
DROP POLICY IF EXISTS "Providers can view eligible jobs" ON public.jobs;
CREATE POLICY "Providers can view eligible jobs" ON public.jobs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM provider_profiles pp
    WHERE pp.user_id = auth.uid()
      AND pp.status = 'active'
      AND (pp.trade_category = jobs.category OR jobs.category = ANY(pp.additional_categories))
      AND pp.operating_areas && ARRAY[jobs.postcode_district]
  )
  AND NOT EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.job_id = jobs.id
      AND q.provider_user_id = auth.uid()
      AND q.status = 'declined'
  )
);

-- 2. Add policy so assigned provider can always view their jobs
CREATE POLICY "Assigned provider can view their jobs" ON public.jobs
FOR SELECT USING (provider_id = auth.uid());

-- 3. Restrict conversations: declined providers lose access
DROP POLICY IF EXISTS "Conversation participants can view" ON public.conversations;
CREATE POLICY "Conversation participants can view" ON public.conversations
FOR SELECT USING (
  (customer_user_id = auth.uid())
  OR (provider_user_id = auth.uid() AND NOT EXISTS (
    SELECT 1 FROM quotes q
    WHERE q.job_id = conversations.job_id
      AND q.provider_user_id = auth.uid()
      AND q.status = 'declined'
  ))
  OR is_admin()
);

-- 4. Restrict messages: declined providers lose access
DROP POLICY IF EXISTS "Conversation participants can view messages" ON public.messages;
CREATE POLICY "Conversation participants can view messages" ON public.messages
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
      AND (
        c.customer_user_id = auth.uid()
        OR (c.provider_user_id = auth.uid() AND NOT EXISTS (
          SELECT 1 FROM quotes q
          WHERE q.job_id = c.job_id
            AND q.provider_user_id = auth.uid()
            AND q.status = 'declined'
        ))
      )
  ))
  OR is_admin()
);

-- 5. Restrict message attachments: declined providers lose access
DROP POLICY IF EXISTS "Conversation participants can view attachments" ON public.message_attachments;
CREATE POLICY "Conversation participants can view attachments" ON public.message_attachments
FOR SELECT USING (
  (EXISTS (
    SELECT 1 FROM messages m
    JOIN conversations c ON c.id = m.conversation_id
    WHERE m.id = message_attachments.message_id
      AND (
        c.customer_user_id = auth.uid()
        OR (c.provider_user_id = auth.uid() AND NOT EXISTS (
          SELECT 1 FROM quotes q
          WHERE q.job_id = c.job_id
            AND q.provider_user_id = auth.uid()
            AND q.status = 'declined'
        ))
      )
  ))
  OR is_admin()
);
