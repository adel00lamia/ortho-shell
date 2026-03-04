
-- Create a security definer function to get user's company_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Drop the recursive SELECT policy on profiles
DROP POLICY IF EXISTS "Users can view company profiles" ON public.profiles;

-- Create a non-recursive SELECT policy using the security definer function
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view company profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (company_id = public.get_user_company_id(auth.uid()));
