-- Fix infinite recursion in profiles RLS policies
-- Drop the problematic policy that causes circular reference
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;

-- Create a simpler, non-recursive policy for viewing profiles in the same company
-- This policy allows users to view profiles that have the same company_id as their own profile
CREATE POLICY "Users can view company profiles" 
ON public.profiles 
FOR SELECT 
USING (
  company_id = (
    SELECT p.company_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid() 
    LIMIT 1
  )
  OR auth.uid() = id  -- Also allow viewing own profile
);

-- Remove the redundant "Users can view their own profile" policy since it's now covered above
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;