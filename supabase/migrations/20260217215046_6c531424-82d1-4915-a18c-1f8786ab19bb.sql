
-- Add message_type and metadata to messages for structured proposals
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type text NOT NULL DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS metadata jsonb;
