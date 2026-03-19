
-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

-- Recreate with a simpler, more reliable check that doesn't use security definer function
CREATE POLICY "Authenticated users can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.company_id IS NOT NULL
  )
);
