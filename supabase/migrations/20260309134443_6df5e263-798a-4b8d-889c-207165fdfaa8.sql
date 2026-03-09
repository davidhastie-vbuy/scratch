
CREATE TABLE public.customer_favourites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_user_id uuid NOT NULL,
  provider_user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (customer_user_id, provider_user_id)
);

ALTER TABLE public.customer_favourites ENABLE ROW LEVEL SECURITY;

-- Customers can view their own favourites
CREATE POLICY "Customers can view own favourites"
ON public.customer_favourites
FOR SELECT TO public
USING (customer_user_id = auth.uid());

-- Customers can add favourites (only if they completed a job with this provider)
CREATE POLICY "Customers can add favourites"
ON public.customer_favourites
FOR INSERT TO public
WITH CHECK (
  customer_user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.jobs
    WHERE customer_user_id = auth.uid()
      AND provider_id = customer_favourites.provider_user_id
      AND status = 'completed'
  )
);

-- Customers can remove their own favourites
CREATE POLICY "Customers can remove own favourites"
ON public.customer_favourites
FOR DELETE TO public
USING (customer_user_id = auth.uid());
