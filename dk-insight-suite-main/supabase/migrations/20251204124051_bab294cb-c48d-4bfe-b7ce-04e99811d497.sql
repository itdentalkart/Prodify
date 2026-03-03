-- Allow users to insert organizations (for first-time setup)
CREATE POLICY "Users can create organizations" 
ON public.organizations 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Allow users to insert their own roles (admin for first user)
CREATE POLICY "Users can insert own role" 
ON public.user_roles 
FOR INSERT 
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow admin to manage all roles
CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Fix profiles update policy to allow updating org_id
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());