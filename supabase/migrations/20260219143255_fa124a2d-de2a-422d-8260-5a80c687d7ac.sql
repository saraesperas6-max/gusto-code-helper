
-- Allow residents to update their own pending requests (purpose/notes only enforced in app code)
CREATE POLICY "Residents can update their own pending requests"
ON public.certificate_requests
FOR UPDATE
USING (auth.uid() = resident_id AND status = 'Pending'::request_status);

-- Allow residents to delete their own pending requests
CREATE POLICY "Residents can delete their own pending requests"
ON public.certificate_requests
FOR DELETE
USING (auth.uid() = resident_id AND status = 'Pending'::request_status);
