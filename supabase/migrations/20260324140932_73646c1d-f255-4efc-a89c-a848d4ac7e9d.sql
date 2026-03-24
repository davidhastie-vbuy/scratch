CREATE POLICY "Admins can add milestone comments"
ON public.milestone_comments
FOR INSERT
TO public
WITH CHECK (
  (user_id = auth.uid()) AND is_admin()
);