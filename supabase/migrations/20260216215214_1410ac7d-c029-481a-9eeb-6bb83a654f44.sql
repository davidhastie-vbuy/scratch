
-- Add platform fee percentage to provider_profiles (set by admin at approval)
ALTER TABLE public.provider_profiles
ADD COLUMN platform_fee_percent numeric NOT NULL DEFAULT 10
CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100);

-- Add agreed_price to jobs (finalised price agreed between customer and provider)
ALTER TABLE public.jobs
ADD COLUMN agreed_price numeric DEFAULT NULL;

-- Add payment_amount to job_milestones (amount payable at this milestone)
ALTER TABLE public.job_milestones
ADD COLUMN payment_amount numeric DEFAULT NULL;

-- Create escrow_payments table to track all payments
CREATE TABLE public.escrow_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  milestone_id uuid REFERENCES public.job_milestones(id),
  customer_user_id uuid NOT NULL,
  provider_user_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  provider_payout numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  stripe_transfer_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;

-- Customers can view their own payments
CREATE POLICY "Customers can view own payments"
ON public.escrow_payments
FOR SELECT
USING (customer_user_id = auth.uid() OR is_admin());

-- Providers can view payments for their jobs
CREATE POLICY "Providers can view own payments"
ON public.escrow_payments
FOR SELECT
USING (provider_user_id = auth.uid());

-- No direct inserts from client (edge functions use service role)
CREATE POLICY "No direct inserts on escrow_payments"
ON public.escrow_payments
FOR INSERT
WITH CHECK (false);

-- No direct updates from client
CREATE POLICY "No direct updates on escrow_payments"
ON public.escrow_payments
FOR UPDATE
USING (false);

-- Trigger for updated_at
CREATE TRIGGER update_escrow_payments_updated_at
BEFORE UPDATE ON public.escrow_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for escrow_payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrow_payments;
