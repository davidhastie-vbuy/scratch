
-- Fix 1: provider_profiles - prevent self-approval and restrict sensitive fields
-- Drop the existing overly permissive UPDATE policy
DROP POLICY IF EXISTS "Providers can update own profile" ON public.provider_profiles;

-- Create a restrictive UPDATE policy that prevents providers from modifying admin-controlled fields
-- Uses a WITH CHECK that ensures status, platform_fee_percent, and admin_note remain unchanged
CREATE POLICY "Providers can update own profile" ON public.provider_profiles
FOR UPDATE TO public
USING (user_id = auth.uid() OR is_admin())
WITH CHECK (
  is_admin() OR (
    user_id = auth.uid()
    AND status = (SELECT pp.status FROM public.provider_profiles pp WHERE pp.id = provider_profiles.id)
    AND platform_fee_percent = (SELECT pp.platform_fee_percent FROM public.provider_profiles pp WHERE pp.id = provider_profiles.id)
    AND admin_note IS NOT DISTINCT FROM (SELECT pp.admin_note FROM public.provider_profiles pp WHERE pp.id = provider_profiles.id)
  )
);

-- Fix 2: Restrict SELECT of active providers to authenticated users only
DROP POLICY IF EXISTS "Authenticated users can view active providers" ON public.provider_profiles;

CREATE POLICY "Authenticated users can view active providers" ON public.provider_profiles
FOR SELECT TO authenticated
USING (status = 'active'::provider_status);

-- Fix 3: messages - prevent content tampering, only allow updating read_at
DROP POLICY IF EXISTS "Users can mark messages read" ON public.messages;

CREATE POLICY "Users can mark messages read" ON public.messages
FOR UPDATE TO public
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id
    AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
  )
)
WITH CHECK (
  is_admin() OR (
    body = (SELECT m.body FROM public.messages m WHERE m.id = messages.id)
    AND sender_user_id = (SELECT m.sender_user_id FROM public.messages m WHERE m.id = messages.id)
    AND message_type = (SELECT m.message_type FROM public.messages m WHERE m.id = messages.id)
    AND metadata IS NOT DISTINCT FROM (SELECT m.metadata FROM public.messages m WHERE m.id = messages.id)
    AND conversation_id = (SELECT m.conversation_id FROM public.messages m WHERE m.id = messages.id)
  )
);
