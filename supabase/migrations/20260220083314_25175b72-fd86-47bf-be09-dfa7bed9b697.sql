
-- Add deleted_at column to profiles for soft-delete
ALTER TABLE public.profiles ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- Update admin SELECT policy to optionally see all (including trashed)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin DELETE policy for permanent deletion
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));
