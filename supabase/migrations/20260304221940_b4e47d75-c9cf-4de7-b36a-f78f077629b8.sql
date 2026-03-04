
-- Fix companies SELECT policy (references profiles which had recursion)
DROP POLICY IF EXISTS "Users can view their company" ON public.companies;
CREATE POLICY "Users can view their company"
ON public.companies
FOR SELECT
TO authenticated
USING (id = public.get_user_company_id(auth.uid()));

-- Fix companies UPDATE policy
DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;
CREATE POLICY "Company admins can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (id = public.get_user_company_id(auth.uid()) AND public.is_admin_or_hr(auth.uid()));

-- Allow authenticated users to INSERT companies (needed for auto-create)
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own profile's company_id
-- (already have "Users can update their own profile" policy)
