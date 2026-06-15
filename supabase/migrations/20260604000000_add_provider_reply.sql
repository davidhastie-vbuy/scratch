-- F3: Add provider reply capability to customer reviews
-- Providers can reply once to customer reviews of their work

-- Add columns to the reviews table
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS provider_reply text,
  ADD COLUMN IF NOT EXISTS provider_reply_at timestamptz;

-- RLS: Allow the provider (reviewee) to update only the reply columns on reviews where they are the reviewee
-- Drop existing update policy if any
DROP POLICY IF EXISTS "Reviewees can reply to their reviews" ON public.reviews;

CREATE POLICY "Reviewees can reply to their reviews"
  ON public.reviews
  FOR UPDATE
  USING (reviewee_user_id = auth.uid())
  WITH CHECK (reviewee_user_id = auth.uid());
