
-- Add resume/CV fields to performance_evaluations
ALTER TABLE public.performance_evaluations
  ADD COLUMN IF NOT EXISTS resume_url text,
  ADD COLUMN IF NOT EXISTS resume_summary jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS skills_analysis jsonb DEFAULT '{}'::jsonb;

-- Create storage bucket for employee CVs
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-cvs', 'employee-cvs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for employee-cvs bucket: authenticated users in same company can upload/view
CREATE POLICY "HR/Admin can upload CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'employee-cvs'
  AND is_admin_or_hr(auth.uid())
);

CREATE POLICY "HR/Admin can view CVs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'employee-cvs'
  AND is_admin_or_hr(auth.uid())
);

CREATE POLICY "HR/Admin can delete CVs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'employee-cvs'
  AND is_admin_or_hr(auth.uid())
);
