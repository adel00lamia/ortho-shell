-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Create security definer function to check if user is admin or hr_manager
CREATE OR REPLACE FUNCTION public.is_admin_or_hr(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role IN ('admin', 'hr_manager')
  )
$$;

-- Drop existing policies on performance_evaluations
DROP POLICY IF EXISTS "Users can view evaluations in their company" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users can create evaluations in their company" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users can update evaluations in their company" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users can delete evaluations in their company" ON public.performance_evaluations;

-- Create new policies restricted to admins and HR managers only
CREATE POLICY "Only admins and HR can view evaluations"
ON public.performance_evaluations
FOR SELECT
USING (
  public.is_admin_or_hr(auth.uid())
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Only admins and HR can create evaluations"
ON public.performance_evaluations
FOR INSERT
WITH CHECK (
  public.is_admin_or_hr(auth.uid())
  AND created_by = auth.uid() 
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Only admins and HR can update evaluations"
ON public.performance_evaluations
FOR UPDATE
USING (
  public.is_admin_or_hr(auth.uid())
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Only admins and HR can delete evaluations"
ON public.performance_evaluations
FOR DELETE
USING (
  public.is_admin_or_hr(auth.uid())
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);