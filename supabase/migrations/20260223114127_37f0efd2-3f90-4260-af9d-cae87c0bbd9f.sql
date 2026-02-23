
-- Create a trigger function that blocks job status transitions to in_progress or completed
-- unless at least one escrow payment is in 'held' or 'released' status
CREATE OR REPLACE FUNCTION public.enforce_payment_before_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _paid_count INT;
BEGIN
  -- Only check when transitioning TO in_progress
  IF NEW.status = 'in_progress' AND (OLD.status IS NULL OR OLD.status != 'in_progress') THEN
    SELECT COUNT(*) INTO _paid_count
    FROM public.escrow_payments
    WHERE job_id = NEW.id AND status IN ('held', 'released');
    
    IF _paid_count = 0 THEN
      RAISE EXCEPTION 'Payment must be completed before this job can proceed. No confirmed escrow payment found.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER enforce_payment_before_job_progress
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.enforce_payment_before_progress();
