-- Fix performance_evaluations RLS policies to use get_user_company_id()
DROP POLICY IF EXISTS "Only admins and HR can delete evaluations" ON public.performance_evaluations;
CREATE POLICY "Only admins and HR can delete evaluations"
  ON public.performance_evaluations
  FOR DELETE
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND is_admin_or_hr(auth.uid())
  );

DROP POLICY IF EXISTS "Only admins and HR can update evaluations" ON public.performance_evaluations;
CREATE POLICY "Only admins and HR can update evaluations"
  ON public.performance_evaluations
  FOR UPDATE
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND is_admin_or_hr(auth.uid())
  );

DROP POLICY IF EXISTS "Only admins and HR can create evaluations" ON public.performance_evaluations;
CREATE POLICY "Only admins and HR can create evaluations"
  ON public.performance_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    company_id = get_user_company_id(auth.uid())
    AND is_admin_or_hr(auth.uid())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "Only admins and HR can view evaluations" ON public.performance_evaluations;
CREATE POLICY "Only admins and HR can view evaluations"
  ON public.performance_evaluations
  FOR SELECT
  TO authenticated
  USING (
    company_id = get_user_company_id(auth.uid())
    AND is_admin_or_hr(auth.uid())
  );