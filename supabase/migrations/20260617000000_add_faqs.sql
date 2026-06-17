-- FAQ table for Help Centre
CREATE TABLE IF NOT EXISTS public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  sort_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- Anyone can read published FAQs
CREATE POLICY "Anyone can read published FAQs"
  ON public.faqs FOR SELECT
  USING (is_published = true);

-- Admins can manage all FAQs
CREATE POLICY "Admins can manage FAQs"
  ON public.faqs FOR ALL
  USING (is_admin());

-- Seed initial FAQ data
INSERT INTO public.faqs (question, answer, category, sort_order) VALUES
('How much does it cost to post a job?', 'Posting a job on BOOKaTRADE is completely free. There are no upfront fees, no monthly subscriptions, and no hidden costs for homeowners. You only pay your chosen tradesperson for the work they complete.', 'For Customers', 1),
('How do I choose the right tradesperson?', 'Once you post a job, you''ll receive a limited number of quotes from vetted, local tradespeople. You can review their profiles, read verified reviews from other homeowners in your area, and compare quotes side by side before making your decision.', 'For Customers', 2),
('Is my payment protected?', 'Yes. All payments are held in secure escrow. Your money is only released to the tradesperson once you confirm you''re completely satisfied with the work. If there''s a dispute, our independent mediation process ensures a fair resolution.', 'For Customers', 3),
('Can I cancel a job after posting?', 'Yes, you can cancel a job at any time before accepting a quote at no cost. If you''ve already accepted a quote and work hasn''t started, please contact us and we''ll help resolve it.', 'For Customers', 4),
('How many quotes will I receive?', 'We limit the number of quotes per job to ensure tradespeople compete on quality, not volume. This means you get serious, considered quotes — not dozens of generic responses.', 'For Customers', 5),
('How much does it cost to join as a tradesperson?', 'Joining BOOKaTRADE is completely free. There are no upfront fees, no monthly subscriptions, and no hidden costs. We only charge a small percentage of the job value when a job is completed and payment is released.', 'For Providers', 6),
('How do I get paid?', 'When a customer accepts your quote and the job is completed, payment is released from escrow directly to your bank account within 2 working days. For larger jobs with milestones, payments are released as each milestone is completed and approved.', 'For Providers', 7),
('How does the quoting process work?', 'When a customer posts a job in your area and trade category, you''ll be notified. You can view the job details, ask questions, and submit a competitive quote. You''re only competing against a small number of other local providers.', 'For Providers', 8),
('What if there''s a dispute with a customer?', 'BOOKaTRADE has an independent dispute resolution process. Experienced trade professionals mediate between you and the customer to reach a fair outcome. Our goal is to ensure everyone leaves satisfied.', 'For Providers', 9),
('What verification is required to join?', 'We verify all tradespeople before they can quote on jobs. This includes identity verification, trade qualifications, insurance documentation, and business references. This protects both you and the customers you work with.', 'For Providers', 10),
('How does the escrow system work?', 'When a customer accepts a quote, the payment (or milestone payment) is collected and held securely in escrow. The funds are only released to the tradesperson when the customer confirms they''re satisfied with the work. This protects both parties.', 'General', 11),
('Is BOOKaTRADE available in my area?', 'BOOKaTRADE is expanding across the UK. We currently have tradespeople registered in most major cities and surrounding areas. Enter your postcode on our homepage to see available trades near you.', 'General', 12);
