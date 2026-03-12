CREATE POLICY "HR/Admin can update CVs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'employee-cvs' AND is_admin_or_hr(auth.uid()))
WITH CHECK (bucket_id = 'employee-cvs' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can update org charts"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'org-charts' AND is_admin_or_hr(auth.uid()) AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text)
WITH CHECK (bucket_id = 'org-charts' AND is_admin_or_hr(auth.uid()) AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text);