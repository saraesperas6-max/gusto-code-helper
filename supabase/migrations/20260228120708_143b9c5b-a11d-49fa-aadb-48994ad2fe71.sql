
-- Make avatars bucket private
UPDATE storage.buckets SET public = false WHERE id = 'avatars';

-- Add RLS policies for avatars bucket (storage.objects RLS is already enabled by Supabase)

-- Users can upload their own avatars (folder name = user_id)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Authenticated users can view any avatar (needed for profile display)
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated'
);

-- Users can delete their own avatars
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
USING (
  bucket_id = 'avatars' AND
  public.has_role(auth.uid(), 'admin'::public.app_role)
);
