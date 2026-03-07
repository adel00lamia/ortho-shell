
-- Add company identification fields
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cnss_number text,
  ADD COLUMN IF NOT EXISTS rc_number text,
  ADD COLUMN IF NOT EXISTS ice_number text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS employee_count integer,
  ADD COLUMN IF NOT EXISTS company_size text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS org_chart_url text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Create storage bucket for org charts
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-charts', 'org-charts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policy for org-charts bucket: authenticated users in same company can read
CREATE POLICY "Users can view org charts in their company"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'org-charts'
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);

-- HR/Admin can upload org charts
CREATE POLICY "HR/Admin can upload org charts"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'org-charts'
  AND is_admin_or_hr(auth.uid())
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);

-- HR/Admin can delete org charts
CREATE POLICY "HR/Admin can delete org charts"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'org-charts'
  AND is_admin_or_hr(auth.uid())
  AND (storage.foldername(name))[1] = (get_user_company_id(auth.uid()))::text
);
