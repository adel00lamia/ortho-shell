
-- Tighten the companies INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.get_user_company_id(auth.uid()) IS NULL);
