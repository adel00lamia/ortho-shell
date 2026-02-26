
-- Storage bucket for OFPPT documents
INSERT INTO storage.buckets (id, name, public) VALUES ('ofppt-documents', 'ofppt-documents', false);

-- Create OFPPT reimbursement dossier status enum
CREATE TYPE public.ofppt_dossier_status AS ENUM (
  'draft', 'submitted', 'under_review', 'approved', 'rejected', 'reimbursed'
);

-- Create OFPPT document type enum matching the 10 CSF models
CREATE TYPE public.ofppt_document_type AS ENUM (
  'modele_1_recap_actions',
  'modele_2_contrat_csf',
  'modele_3_avis_annulation',
  'modele_4_facture',
  'modele_5_liste_presence',
  'modele_6_attestation_realisation',
  'modele_7_synthese_besoins',
  'modele_8_delegation_pouvoirs',
  'modele_9_contrat_formation_groupee',
  'modele_10_liste_presence_fg',
  'other'
);

-- Main dossier table
CREATE TABLE public.ofppt_reimbursement_dossiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  exercise_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  training_plan_id UUID REFERENCES public.training_plans(id),
  status public.ofppt_dossier_status NOT NULL DEFAULT 'draft',
  total_amount NUMERIC(12,2) DEFAULT 0,
  reimbursement_amount NUMERIC(12,2) DEFAULT 0,
  submission_date DATE,
  approval_date DATE,
  reimbursement_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ofppt_reimbursement_dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dossiers in their company"
  ON public.ofppt_reimbursement_dossiers FOR SELECT
  USING (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "HR/Admin can create dossiers"
  ON public.ofppt_reimbursement_dossiers FOR INSERT
  WITH CHECK (is_admin_or_hr(auth.uid()) AND created_by = auth.uid() AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "HR/Admin can update dossiers"
  ON public.ofppt_reimbursement_dossiers FOR UPDATE
  USING (is_admin_or_hr(auth.uid()) AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "HR/Admin can delete draft dossiers"
  ON public.ofppt_reimbursement_dossiers FOR DELETE
  USING (is_admin_or_hr(auth.uid()) AND status = 'draft' AND company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()));

CREATE TRIGGER update_ofppt_dossiers_updated_at
  BEFORE UPDATE ON public.ofppt_reimbursement_dossiers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Document tracking table
CREATE TABLE public.ofppt_dossier_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dossier_id UUID NOT NULL REFERENCES public.ofppt_reimbursement_dossiers(id) ON DELETE CASCADE,
  document_type public.ofppt_document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

ALTER TABLE public.ofppt_dossier_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view documents in their company dossiers"
  ON public.ofppt_dossier_documents FOR SELECT
  USING (dossier_id IN (
    SELECT d.id FROM ofppt_reimbursement_dossiers d
    WHERE d.company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())
  ));

CREATE POLICY "HR/Admin can upload documents"
  ON public.ofppt_dossier_documents FOR INSERT
  WITH CHECK (is_admin_or_hr(auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "HR/Admin can delete documents"
  ON public.ofppt_dossier_documents FOR DELETE
  USING (is_admin_or_hr(auth.uid()) AND dossier_id IN (
    SELECT d.id FROM ofppt_reimbursement_dossiers d
    WHERE d.company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid())
  ));

-- Storage policies for ofppt-documents bucket
CREATE POLICY "Users can view ofppt documents in their company"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ofppt-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "HR/Admin can upload ofppt documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ofppt-documents' AND is_admin_or_hr(auth.uid()));

CREATE POLICY "HR/Admin can delete ofppt documents"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'ofppt-documents' AND is_admin_or_hr(auth.uid()));
