
-- Revert avatars bucket to public since avatar URLs are stored and displayed publicly
UPDATE storage.buckets SET public = true WHERE id = 'avatars';
