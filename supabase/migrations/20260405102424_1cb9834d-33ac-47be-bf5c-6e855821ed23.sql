
-- Delete existing seed data to replace with comprehensive T&Cs
DELETE FROM public.legal_pages;

-- Insert comprehensive Terms & Conditions hub pages
-- PLATFORM TERMS (applies to everyone)
INSERT INTO public.legal_pages (slug, audience, title, content) VALUES
('platform-terms', 'customer', 'Platform Terms of Use', ''),
('platform-terms', 'provider', 'Platform Terms of Use', ''),

-- TERMS OF SERVICE (audience-specific)
('terms-of-service', 'customer', 'Customer Terms of Service', ''),
('terms-of-service', 'provider', 'Provider Terms of Service', ''),

-- PRIVACY POLICY (audience-specific)
('privacy-policy', 'customer', 'Customer Privacy Notice', ''),
('privacy-policy', 'provider', 'Provider Privacy Notice', ''),

-- ACCEPTABLE USE (same for both)
('acceptable-use', 'customer', 'Acceptable Use Policy', ''),
('acceptable-use', 'provider', 'Acceptable Use Policy', ''),

-- PAYMENT TERMS (audience-specific)
('payment-terms', 'customer', 'Payment & Escrow Terms – Customers', ''),
('payment-terms', 'provider', 'Payment & Escrow Terms – Providers', ''),

-- CANCELLATION POLICY
('cancellation-policy', 'customer', 'Cancellation & Refund Policy', ''),
('cancellation-policy', 'provider', 'Cancellation & Refund Policy', ''),

-- DISPUTE RESOLUTION
('dispute-resolution', 'customer', 'Dispute Resolution Policy', ''),
('dispute-resolution', 'provider', 'Dispute Resolution Policy', ''),

-- REVIEW POLICY
('review-policy', 'customer', 'Review & Feedback Policy', ''),
('review-policy', 'provider', 'Review & Feedback Policy', ''),

-- PROVIDER STANDARDS
('provider-standards', 'provider', 'Provider Standards & Conduct', ''),
('provider-standards', 'customer', 'Provider Standards & Conduct', ''),

-- SANCTIONS POLICY
('sanctions-policy', 'provider', 'Deactivation & Sanctions Policy', ''),
('sanctions-policy', 'customer', 'Deactivation & Sanctions Policy', '');
