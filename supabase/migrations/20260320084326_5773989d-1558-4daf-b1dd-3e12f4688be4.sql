
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reminder_48h_sent_at timestamptz DEFAULT NULL;
