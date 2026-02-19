
-- Add deleted_at column for soft delete
ALTER TABLE public.certificate_requests
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Drop existing SELECT policies for residents to add soft-delete filter
DROP POLICY IF EXISTS "Residents can view their own requests" ON public.certificate_requests;
DROP POLICY IF EXISTS "Residents can delete their own pending requests" ON public.certificate_requests;
DROP POLICY IF EXISTS "Residents can update their own pending requests" ON public.certificate_requests;

-- Residents see their own non-deleted requests
CREATE POLICY "Residents can view their own requests"
ON public.certificate_requests
FOR SELECT
USING (auth.uid() = resident_id AND deleted_at IS NULL);

-- Residents can also view their own deleted requests (for trash bin)
CREATE POLICY "Residents can view their own trashed requests"
ON public.certificate_requests
FOR SELECT
USING (auth.uid() = resident_id AND deleted_at IS NOT NULL);

-- Residents can update their own pending requests (edit purpose/notes) OR soft-delete/restore
CREATE POLICY "Residents can update their own pending requests"
ON public.certificate_requests
FOR UPDATE
USING (auth.uid() = resident_id AND (status = 'Pending'::request_status OR deleted_at IS NOT NULL));

-- Residents can permanently delete their own trashed requests
CREATE POLICY "Residents can delete their own trashed requests"
ON public.certificate_requests
FOR DELETE
USING (auth.uid() = resident_id AND deleted_at IS NOT NULL);
