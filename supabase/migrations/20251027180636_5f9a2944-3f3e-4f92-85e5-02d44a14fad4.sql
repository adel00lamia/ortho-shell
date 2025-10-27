-- Drop existing policies on performance_evaluations
DROP POLICY IF EXISTS "Users can view their evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users can create evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users can update their evaluations" ON public.performance_evaluations;
DROP POLICY IF EXISTS "Users can delete their evaluations" ON public.performance_evaluations;

-- Create new policies that verify company_id matches user's company
CREATE POLICY "Users can view evaluations in their company"
ON public.performance_evaluations
FOR SELECT
USING (
  company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create evaluations in their company"
ON public.performance_evaluations
FOR INSERT
WITH CHECK (
  created_by = auth.uid() 
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update evaluations in their company"
ON public.performance_evaluations
FOR UPDATE
USING (
  created_by = auth.uid() 
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete evaluations in their company"
ON public.performance_evaluations
FOR DELETE
USING (
  created_by = auth.uid() 
  AND company_id IN (
    SELECT company_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);