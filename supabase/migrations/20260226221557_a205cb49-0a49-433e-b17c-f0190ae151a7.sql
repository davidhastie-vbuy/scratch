
-- 1. Add DELETE policy for provider_bank_details
CREATE POLICY "Providers can delete own bank details"
  ON public.provider_bank_details FOR DELETE
  USING (provider_user_id = auth.uid() OR is_admin());

-- 2. Add UPDATE policy for provider_portfolio_images
CREATE POLICY "Providers can update own images"
  ON public.provider_portfolio_images FOR UPDATE
  USING (user_id = auth.uid());

-- 3. Tighten conversations INSERT policy: only allow providers who are eligible or invited
DROP POLICY "Authenticated can create conversations" ON public.conversations;

CREATE POLICY "Authenticated can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (
    (customer_user_id = auth.uid() AND is_job_customer(job_id, auth.uid()))
    OR 
    (provider_user_id = auth.uid() AND (
      provider_is_eligible(
        (SELECT category FROM public.jobs WHERE id = job_id),
        (SELECT postcode_district FROM public.jobs WHERE id = job_id),
        auth.uid()
      )
      OR provider_is_invited(job_id, auth.uid())
    ))
  );

-- 4. Make recommendation-photos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'recommendation-photos';
