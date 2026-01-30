-- Allow admins to update user_profiles
CREATE POLICY "Admins can update any profile"
ON public.user_profiles
FOR UPDATE
USING (is_admin(auth.uid()));

-- Allow admins to delete user_profiles
CREATE POLICY "Admins can delete profiles"
ON public.user_profiles
FOR DELETE
USING (is_admin(auth.uid()));