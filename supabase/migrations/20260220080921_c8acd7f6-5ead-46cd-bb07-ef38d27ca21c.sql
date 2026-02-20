
-- Add claim_deadline column to certificate_requests
ALTER TABLE public.certificate_requests
ADD COLUMN claim_deadline timestamp with time zone DEFAULT NULL;
