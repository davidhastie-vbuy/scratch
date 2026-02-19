
-- Provider bank details
CREATE TABLE public.provider_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id uuid NOT NULL,
  account_name text NOT NULL,
  sort_code text NOT NULL,
  account_number text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider_user_id)
);

ALTER TABLE public.provider_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own bank details"
  ON public.provider_bank_details FOR SELECT
  USING (provider_user_id = auth.uid() OR is_admin());

CREATE POLICY "Providers can insert own bank details"
  ON public.provider_bank_details FOR INSERT
  WITH CHECK (provider_user_id = auth.uid());

CREATE POLICY "Providers can update own bank details"
  ON public.provider_bank_details FOR UPDATE
  USING (provider_user_id = auth.uid());

CREATE TRIGGER update_bank_details_updated_at
  BEFORE UPDATE ON public.provider_bank_details
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Payout requests
CREATE TYPE public.payout_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.payout_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id uuid NOT NULL,
  amount numeric NOT NULL,
  platform_fee numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  status payout_status NOT NULL DEFAULT 'pending',
  admin_note text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own payout requests"
  ON public.payout_requests FOR SELECT
  USING (provider_user_id = auth.uid() OR is_admin());

CREATE POLICY "Providers can create own payout requests"
  ON public.payout_requests FOR INSERT
  WITH CHECK (provider_user_id = auth.uid());

CREATE POLICY "Admins can update payout requests"
  ON public.payout_requests FOR UPDATE
  USING (is_admin());

CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Provider transactions
CREATE TABLE public.provider_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id uuid NOT NULL,
  type text NOT NULL, -- 'earning', 'payout', 'commission'
  amount numeric NOT NULL,
  description text,
  job_id uuid REFERENCES public.jobs(id),
  milestone_id uuid REFERENCES public.job_milestones(id),
  payout_request_id uuid REFERENCES public.payout_requests(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own transactions"
  ON public.provider_transactions FOR SELECT
  USING (provider_user_id = auth.uid() OR is_admin());

CREATE POLICY "No direct inserts on provider_transactions"
  ON public.provider_transactions FOR INSERT
  WITH CHECK (false);

-- Function to record earning when milestone is accepted
CREATE OR REPLACE FUNCTION public.record_milestone_earning()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  _job RECORD;
  _fee_percent numeric;
  _gross numeric;
BEGIN
  -- Only fire when status changes to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get job and provider info
    SELECT * INTO _job FROM public.jobs WHERE id = NEW.job_id;
    IF _job.provider_id IS NULL THEN RETURN NEW; END IF;

    -- Get platform fee
    SELECT platform_fee_percent INTO _fee_percent
    FROM public.provider_profiles WHERE user_id = _job.provider_id;
    _fee_percent := COALESCE(_fee_percent, 10);

    _gross := COALESCE(NEW.payment_amount, 0);
    IF _gross <= 0 THEN RETURN NEW; END IF;

    -- Insert earning transaction (net of fee)
    INSERT INTO public.provider_transactions (provider_user_id, type, amount, description, job_id, milestone_id)
    VALUES (
      _job.provider_id,
      'earning',
      _gross - (_gross * _fee_percent / 100),
      'Milestone "' || NEW.title || '" completed',
      NEW.job_id,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_milestone_accepted_record_earning
  AFTER UPDATE ON public.job_milestones
  FOR EACH ROW
  EXECUTE FUNCTION public.record_milestone_earning();
