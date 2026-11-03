

## Comprehensive Audit Report & Fix Plan

### Critical Findings

**1. MISSING DATABASE TABLES (breaks Skills & Gaps feature)**
- `skill_categories`, `skills`, `employee_skills` tables do NOT exist in the database
- `seed_default_skills` RPC function does NOT exist
- `useSkillsTaxonomy.ts` hook references all three — every query will fail silently
- The entire Skills & Gaps page, Gap Analysis, Employee Skill sync, and Manager Dashboard skills tab are broken

**2. SECURITY: Job descriptions RLS allows cross-company insertion**
- INSERT policy on `job_descriptions` only checks `created_by = auth.uid()` but not `company_id`
- Any authenticated user can insert JDs into another company's data

**3. SECURITY: Dual role storage (profiles.role + user_roles)**
- `profiles.role` column exists AND `user_roles` table exists
- Some RLS policies check `profiles.role` (training_plans, training_diagnostics, learner_module_progress, inferred_skills, job_applications)
- Other policies use `has_role()` / `is_admin_or_hr()` which query `user_roles`
- These can be out of sync — a user could have `admin` in `user_roles` but `employee` in `profiles.role`, or vice versa
- This is a privilege escalation risk since `profiles` table allows self-update

**4. SECURITY: Leaked password protection disabled**
- Supabase Auth setting — users can sign up with known-breached passwords

### Moderate Findings

**5. ACCESSIBILITY: Missing DialogTitle in CommandDialog**
- `src/components/ui/command.tsx` `CommandDialog` wraps content in `DialogContent` without a `DialogTitle`
- Causes console errors on every command palette open
- Fix: Add a visually hidden `DialogTitle`

**6. PUBLIC PLAN TEMPLATES expose config across companies**
- `plan_templates` SELECT policy allows `is_public = true` to be read by any user
- `configuration` JSONB may contain sensitive business data

**7. TRAINING PLANS cannot be deleted**
- No DELETE policy on `training_plans` — users cannot remove draft plans

### Implementation Plan

#### Step 1: Create missing skills taxonomy tables (Migration)
```sql
-- skill_categories table
CREATE TABLE public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  ofppt_sector_code text,
  icon text NOT NULL DEFAULT 'BookOpen',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- skills table  
CREATE TABLE public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES skill_categories(id) ON DELETE CASCADE,
  name_fr text NOT NULL,
  name_en text NOT NULL,
  description text,
  max_level integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- employee_skills table
CREATE TABLE public.employee_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  employee_name text NOT NULL,
  employee_email text,
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level integer NOT NULL DEFAULT 1,
  target_level integer NOT NULL DEFAULT 3,
  assessed_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(company_id, employee_name, skill_id)
);

-- RLS for all three tables
-- seed_default_skills RPC function
```

#### Step 2: Fix job_descriptions INSERT RLS policy
- Add `company_id = get_user_company_id(auth.uid())` to the WITH CHECK

#### Step 3: Consolidate role checks
- Update RLS policies that reference `profiles.role` to use `has_role()` / `is_admin_or_hr()` instead
- Affected tables: `training_plans`, `training_diagnostics`, `learner_module_progress`, `inferred_skills`, `job_applications`

#### Step 4: Fix CommandDialog accessibility
- Add `<DialogTitle className="sr-only">Command palette</DialogTitle>` inside `CommandDialog` in `command.tsx`

#### Step 5: Add DELETE policy for training_plans
- Allow HR/admin to delete plans in their company

### Files Changed
- `supabase/migrations/` — new migration for tables, RLS, RPC, policy fixes
- `src/components/ui/command.tsx` — add hidden DialogTitle

### Summary Table

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | 3 missing DB tables break Skills feature | Fix |
| 2 | ERROR | JD cross-company insertion | Fix |
| 3 | ERROR | Dual role storage inconsistency | Fix |
| 4 | WARN | Leaked password protection | Manual toggle in Supabase dashboard |
| 5 | WARN | Missing DialogTitle accessibility | Fix |
| 6 | WARN | Public plan templates data leak | Fix |
| 7 | INFO | No DELETE on training_plans | Fix |

