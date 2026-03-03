-- Fix the infinite recursion in user_roles RLS policy
-- The "Admins can manage roles" policy queries user_roles table which causes recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Create a new policy that uses a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id AND role = 'admin'::app_role
  );
$$;

-- Recreate the admin policy using the function
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));