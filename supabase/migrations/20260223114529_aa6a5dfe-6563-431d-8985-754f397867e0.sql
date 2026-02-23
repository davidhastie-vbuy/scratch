
-- Create message_attachments table
CREATE TABLE public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;

-- Participants can view attachments on messages they can see
CREATE POLICY "Conversation participants can view attachments"
ON public.message_attachments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.messages m
    JOIN public.conversations c ON c.id = m.conversation_id
    WHERE m.id = message_attachments.message_id
    AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
  )
  OR is_admin()
);

-- Participants can insert attachments on their own messages
CREATE POLICY "Users can insert own message attachments"
ON public.message_attachments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.messages m
    WHERE m.id = message_attachments.message_id
    AND m.sender_user_id = auth.uid()
  )
);

-- Create chat-attachments storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-attachments', 'chat-attachments', false);

-- Storage policies: participants can upload
CREATE POLICY "Chat participants can upload attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid() IS NOT NULL
);

-- Participants can view their conversation attachments
CREATE POLICY "Chat participants can view attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM public.message_attachments ma
      JOIN public.messages m ON m.id = ma.message_id
      JOIN public.conversations c ON c.id = m.conversation_id
      WHERE ma.file_url = name
      AND (c.customer_user_id = auth.uid() OR c.provider_user_id = auth.uid())
    )
  )
);

-- Admin can view all chat attachments
CREATE POLICY "Admins can view all chat attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments' AND is_admin());
