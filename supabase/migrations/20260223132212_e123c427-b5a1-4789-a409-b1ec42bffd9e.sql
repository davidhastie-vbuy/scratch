
-- Input validation: Add CHECK constraints to critical tables

ALTER TABLE public.jobs
  ADD CONSTRAINT job_title_length CHECK (length(title) <= 200),
  ADD CONSTRAINT job_description_length CHECK (length(description) <= 5000);

ALTER TABLE public.quotes
  ADD CONSTRAINT quote_price_positive CHECK (price_min >= 0 AND price_max >= price_min),
  ADD CONSTRAINT quote_price_reasonable CHECK (price_max <= 1000000);

ALTER TABLE public.messages
  ADD CONSTRAINT message_body_length CHECK (length(body) <= 10000);

ALTER TABLE public.job_milestones
  ADD CONSTRAINT milestone_title_length CHECK (length(title) <= 200);

ALTER TABLE public.support_tickets
  ADD CONSTRAINT ticket_subject_length CHECK (length(subject) <= 200),
  ADD CONSTRAINT ticket_description_length CHECK (length(description) <= 5000);

ALTER TABLE public.dispute_messages
  ADD CONSTRAINT dispute_message_body_length CHECK (length(body) <= 5000);

ALTER TABLE public.profiles
  ADD CONSTRAINT profile_phone_length CHECK (phone IS NULL OR length(phone) <= 30),
  ADD CONSTRAINT profile_postcode_length CHECK (postcode IS NULL OR length(postcode) <= 15);

ALTER TABLE public.support_ticket_messages
  ADD CONSTRAINT ticket_message_body_length CHECK (length(body) <= 5000);

ALTER TABLE public.milestone_comments
  ADD CONSTRAINT milestone_comment_body_length CHECK (body IS NULL OR length(body) <= 5000);
