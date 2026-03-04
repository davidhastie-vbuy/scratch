
-- Reviews table for both customer-to-provider and provider-to-customer reviews
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  reviewer_user_id uuid NOT NULL,
  reviewee_user_id uuid NOT NULL,
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('customer', 'provider')),
  communication_rating integer NOT NULL CHECK (communication_rating BETWEEN 1 AND 5),
  quality_rating integer NOT NULL CHECK (quality_rating BETWEEN 1 AND 5),
  value_rating integer NOT NULL CHECK (value_rating BETWEEN 1 AND 5),
  reliability_rating integer NOT NULL CHECK (reliability_rating BETWEEN 1 AND 5),
  overall_rating numeric GENERATED ALWAYS AS (
    (communication_rating + quality_rating + value_rating + reliability_rating)::numeric / 4.0
  ) STORED,
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(job_id, reviewer_user_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view reviews (they're public feedback)
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- Only job participants can leave reviews on completed jobs
CREATE POLICY "Job participants can create reviews on completed jobs"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    reviewer_user_id = auth.uid()
    AND is_job_participant(job_id, auth.uid())
    AND get_job_status(job_id) = 'completed'
  );

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;
