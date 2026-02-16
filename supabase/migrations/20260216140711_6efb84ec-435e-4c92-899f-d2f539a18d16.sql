
-- Replace the permissive INSERT policy with a restrictive one
-- Only triggers (SECURITY DEFINER) insert, so no user should insert directly
DROP POLICY "System can insert notifications" ON public.notifications;

CREATE POLICY "No direct inserts on notifications"
ON public.notifications FOR INSERT
WITH CHECK (false);
