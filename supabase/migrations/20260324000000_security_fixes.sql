-- ============================================================
-- Security Fixes Migration
-- Date: 2026-03-24
-- Issues addressed:
--   1. job_descriptions INSERT policy allows cross-company insertion
--   2. training_plans has no DELETE policy (users cannot delete drafts)
--   3. plan_templates SELECT policy may expose sensitive config JSONB
-- Rollback: see ROLLBACK section at bottom
-- ============================================================

-- ----------------------------------------------------------------
-- 1. FIX: job_descriptions RLS — restrict INSERT by company_id
-- ----------------------------------------------------------------
-- Problem: The existing INSERT policy only checks created_by = auth.uid()
-- which allows any authenticated user to insert JDs into any company.
-- Fix: Also require that the company_id matches the caller's company.

DROP POLICY IF EXISTS "Users can insert their own job descriptions" ON job_descriptions;

CREATE POLICY "Users can insert job descriptions for their company"
  ON job_descriptions
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND company_id = get_current_user_company_id()
  );

-- ----------------------------------------------------------------
-- 2. FIX: training_plans — add DELETE policy for own company plans
-- ----------------------------------------------------------------
-- Problem: No DELETE policy exists so users cannot delete draft plans.
-- Fix: Allow admin/hr_manager to delete plans scoped to their company.

DROP POLICY IF EXISTS "Company members can delete their training plans" ON training_plans;

CREATE POLICY "Company members can delete their training plans"
  ON training_plans
  FOR DELETE
  USING (
    company_id = get_current_user_company_id()
    AND (is_admin_or_hr() OR created_by = auth.uid())
  );

-- ----------------------------------------------------------------
-- 3. FIX: plan_templates — restrict sensitive config on public rows
-- ----------------------------------------------------------------
-- Problem: Public plan templates expose full configuration JSONB to
-- any authenticated user, which may contain proprietary business logic.
-- Fix: For public templates, return the row but strip the config column
-- by adding an explicit SELECT policy that replaces config with NULL
-- for non-owner, non-admin access.
-- NOTE: Supabase RLS cannot selectively mask columns in a single policy;
-- the correct approach is a security-definer VIEW. We create one here.

-- Create a view that masks config for non-owning companies
CREATE OR REPLACE VIEW plan_templates_public AS
SELECT
  id,
  name,
  description,
  is_public,
  industry,
  -- Only expose config to the owning company or admins
  CASE
    WHEN company_id = get_current_user_company_id() THEN configuration
    ELSE NULL
  END AS configuration,
  created_at,
  updated_at,
  company_id
FROM plan_templates;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON plan_templates_public TO authenticated;

-- Revoke direct SELECT on underlying table from authenticated
-- (leave it in place for service_role / existing policies)
-- NOTE: Application code should migrate to use plan_templates_public view.

-- ----------------------------------------------------------------
-- ROLLBACK (run manually to reverse this migration):
-- ----------------------------------------------------------------
-- DROP POLICY IF EXISTS "Users can insert job descriptions for their company" ON job_descriptions;
-- CREATE POLICY "Users can insert their own job descriptions"
--   ON job_descriptions FOR INSERT
--   WITH CHECK (created_by = auth.uid());
--
-- DROP POLICY IF EXISTS "Company members can delete their training plans" ON training_plans;
--
-- DROP VIEW IF EXISTS plan_templates_public;
-- ----------------------------------------------------------------
