-- Allow users to view their own profile (even without org_id)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (user_id = auth.uid());

-- Allow users to view their own roles
CREATE POLICY "Users can view own role"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());