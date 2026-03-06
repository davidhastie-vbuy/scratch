
CREATE OR REPLACE FUNCTION public.auto_complete_job_on_all_released()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_milestones INT;
  _released_payments INT;
  _job_status TEXT;
BEGIN
  -- Only fire when escrow payment status changes to 'released'
  IF NEW.status = 'released' AND (OLD.status IS NULL OR OLD.status != 'released') THEN
    -- Get current job status
    SELECT status::text INTO _job_status FROM public.jobs WHERE id = NEW.job_id;
    
    -- Only act on accepted or in_progress jobs
    IF _job_status NOT IN ('accepted', 'in_progress') THEN
      RETURN NEW;
    END IF;
    
    -- Count total milestones for this job
    SELECT COUNT(*) INTO _total_milestones
    FROM public.job_milestones WHERE job_id = NEW.job_id;
    
    -- If no milestones, skip
    IF _total_milestones = 0 THEN RETURN NEW; END IF;
    
    -- Count milestones that have a released escrow payment
    SELECT COUNT(DISTINCT ep.milestone_id) INTO _released_payments
    FROM public.escrow_payments ep
    WHERE ep.job_id = NEW.job_id
      AND ep.milestone_id IS NOT NULL
      AND ep.status = 'released';
    
    -- If all milestones have released payments, mark job complete
    IF _released_payments >= _total_milestones THEN
      UPDATE public.jobs SET status = 'completed' WHERE id = NEW.job_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_complete_on_payment_release
  AFTER UPDATE ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_complete_job_on_all_released();
