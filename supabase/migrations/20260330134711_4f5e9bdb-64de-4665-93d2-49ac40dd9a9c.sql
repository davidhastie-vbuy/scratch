
-- Create dispute_attachments table
CREATE TABLE public.dispute_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id uuid NOT NULL REFERENCES public.job_disputes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.dispute_attachments ENABLE ROW LEVEL SECURITY;

-- Participants can view dispute attachments
CREATE POLICY "Dispute participants can view attachments"
ON public.dispute_attachments FOR SELECT
USING (
  (EXISTS (
    SELECT 1 FROM public.job_disputes d
    WHERE d.id = dispute_attachments.dispute_id
    AND is_job_participant(d.job_id, auth.uid())
  ))
  OR is_admin()
);

-- Users can insert own dispute attachments
CREATE POLICY "Users can insert own dispute attachments"
ON public.dispute_attachments FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.job_disputes d
    WHERE d.id = dispute_attachments.dispute_id
    AND is_job_participant(d.job_id, auth.uid())
  )
);

-- Create the dispute-attachments storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('dispute-attachments', 'dispute-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for dispute-attachments bucket
CREATE POLICY "Users can upload dispute attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'dispute-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view dispute attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'dispute-attachments'
  AND auth.role() = 'authenticated'
);
