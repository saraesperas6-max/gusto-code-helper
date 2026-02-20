CREATE POLICY "Admins can create requests on behalf of residents"
ON public.certificate_requests
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));