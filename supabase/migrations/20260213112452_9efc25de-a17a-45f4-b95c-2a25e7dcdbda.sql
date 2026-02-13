-- Drop the restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.user_roles;

CREATE POLICY "Anyone authenticated can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
