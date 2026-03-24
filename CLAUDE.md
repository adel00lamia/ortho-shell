# CLAUDE.md — ortho-shell (TrainPro Academy)

This file provides guidance for AI assistants working in this codebase.

---

## Project Overview

**TrainPro Academy** is an enterprise AI-powered learning & development platform for Moroccan organizations. It covers the full L&D workflow:

**Assess → Plan → Execute → Track**

Key capabilities:
- Organizational diagnostic (skills mapping, org chart, 9-box grid)
- AI-driven training plan generation
- Module Studio (SCORM, xAPI course authoring)
- Content Marketplace (buy/sell training modules)
- Performance evaluation & career coaching
- OFPPT reimbursement compliance
- Multi-tenant SaaS with company-scoped data (RLS enforced)
- Bilingual UI (French primary, English supported)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript 5 |
| Build Tool | Vite 5 |
| UI Components | shadcn/ui (Radix UI + Tailwind CSS) |
| Database | Supabase (PostgreSQL + Auth) |
| Data Fetching | TanStack React Query 5 |
| Forms | react-hook-form + Zod |
| Routing | react-router-dom 6 |
| Testing | Vitest + Testing Library |
| Styling | Tailwind CSS 3 |
| Animations | Framer Motion |
| PDF/Export | jsPDF, docx |
| Charts | Recharts |
| Package Manager | npm (Bun also supported — `bun.lock` present) |

---

## Repository Structure

```
ortho-shell/
├── src/
│   ├── main.tsx                  # Entry point — React root + monitoring init
│   ├── App.tsx                   # Root router + provider stack + lazy routes
│   ├── index.css                 # Design system CSS variables (HSL)
│   ├── components/
│   │   ├── ui/                   # 48 shadcn/ui primitives (button, card, dialog…)
│   │   ├── assessment/           # OrgChartView, NineBoxGrid, SkillsMatrixView
│   │   ├── navigation/           # HierarchicalSidebar (role-based collapsible menu)
│   │   ├── module-studio/        # SlideEditor, QuizEditor, ScormPlayer, XAPIActivityLog
│   │   ├── career/               # AICareerCoachPanel, CareerPathCard
│   │   ├── diagnostic/           # EmployeeBulkUpload, EmployeeSkillProfiler
│   │   ├── plan/                 # AIPlanBuilder, PlanROICalculator
│   │   ├── performance/          # AIPerformancePanel, CompetencyScoreCard
│   │   ├── billing/              # TrialBanner, subscription components
│   │   ├── ofppt/                # OFPPT reimbursement compliance
│   │   ├── skills/               # SkillsTaxonomyEditor
│   │   ├── shared/               # Reusable components (Breadcrumbs)
│   │   ├── error-boundaries/     # RootErrorBoundary, FeatureErrorBoundary
│   │   └── [other feature dirs]
│   ├── pages/                    # 28 page components (all lazy-loaded)
│   │   ├── Index.tsx             # Public landing page
│   │   ├── Auth.tsx              # Authentication page
│   │   ├── Dashboard.tsx         # Admin dashboard
│   │   ├── AIPlanBuilder.tsx     # Largest file — AI training plan creation
│   │   ├── ModuleStudio.tsx      # Course authoring
│   │   ├── Analytics.tsx         # Performance analytics
│   │   └── [other pages]
│   ├── hooks/                    # 40+ domain-specific custom hooks
│   │   ├── useAuth.tsx           # Auth context + provider
│   │   ├── useCompanyId.ts       # Multi-tenant company scoping
│   │   ├── useUserRole.tsx       # RBAC role resolution
│   │   ├── useDashboardStats.ts  # Dashboard metrics via React Query
│   │   └── [feature-specific hooks]
│   ├── contexts/
│   │   └── LanguageContext.tsx   # EN/FR switching with localStorage persistence
│   ├── lib/                      # Utility functions
│   │   ├── utils.ts              # Shared helpers (cn(), etc.)
│   │   ├── export.ts             # Generic CSV/data export
│   │   ├── invoice.ts            # Invoice generation
│   │   ├── scormBridge.ts        # SCORM LMS integration
│   │   ├── monitoring.ts         # Sentry + PostHog setup
│   │   └── [export-specific libs]
│   ├── integrations/supabase/
│   │   ├── client.ts             # Supabase client singleton
│   │   └── types.ts             # Auto-generated DB types (53K — do not edit manually)
│   ├── config/
│   │   └── env.ts                # Zod-validated environment variables
│   ├── data/                     # Static data/constants
│   │   ├── jobDescriptionTemplates.ts  (76K)
│   │   ├── trainingContentTemplates.ts (93K)
│   │   └── diagnosticConstants.ts     (13K)
│   ├── locales/
│   │   ├── en.ts                 # English translations (29K)
│   │   ├── fr.ts                 # French translations (33K — primary)
│   │   └── translations.test.ts  # Ensures FR covers all EN keys
│   └── test/
│       └── setup.ts              # Vitest globals setup (mocks matchMedia, localStorage)
├── supabase/
│   └── migrations/               # 19+ SQL migration files (timestamped)
├── public/                       # Static assets, manifest.json (PWA), SW
├── .github/workflows/
│   └── ci.yml                    # CI: typecheck → lint → test → build + Supabase type gen
└── .lovable/
    └── plan.md                   # Known issues audit (read before making schema changes)
```

---

## Development Commands

```bash
npm run dev              # Start dev server at http://localhost:8080
npm run build            # Production build
npm run build:dev        # Dev-mode build
npm run typecheck        # TypeScript check (loose mode)
npm run typecheck:strict # Strict TypeScript check
npm run lint             # ESLint
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
npm run preview          # Preview production build locally
```

---

## Environment Variables

Copy `.env.example` to `.env` before running locally:

```
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY=""
VITE_SUPABASE_URL=""
```

All three are required and validated at runtime via Zod (`src/config/env.ts`). The app throws an error on startup if any are missing or malformed.

---

## Architecture & Key Patterns

### Provider Stack (App.tsx)

The root renders providers in this order (outer → inner):

```
RootErrorBoundary
  QueryClientProvider      ← React Query (5min stale, 1 retry, no refetch on focus)
    LanguageProvider        ← EN/FR i18n
      AuthProvider          ← Supabase auth session
        TooltipProvider     ← Radix UI tooltips
          RouterProvider    ← react-router-dom
```

### Routing

- All pages are **lazy-loaded** via `React.lazy()` + `Suspense` with a `PageLoader` fallback.
- **Public routes:** `/`, `/auth`, `/reset-password`, `/pricing`
- **Protected routes:** Wrapped in `ProtectedLayout` (sidebar + breadcrumbs + trial banner)
- **Subscription gating:** `GatedPage` (Starter+) and `ProGatedPage` (Professional) enforce plan tiers via `SubscriptionGate`
- **Route namespacing:**
  - `/workflow/assess/*` — Diagnostic, performance, skills
  - `/workflow/plan/*` — AI plan builder, training plans
  - `/workflow/execute/*` — Module studio, marketplace
  - `/workflow/track/*` — Analytics, certificates, OFPPT
  - `/manage/*` — Users, settings, billing
  - `/career/*` — Career paths, job board

### Data Fetching

- All server state lives in **React Query** hooks (in `src/hooks/`)
- Hooks are named `use<Entity>` (e.g., `useEmployeeProfiles`, `useDashboardStats`)
- Every hook narrows data via `company_id` (from `useCompanyId()`) — this is the multi-tenancy boundary
- Database access goes through the typed Supabase client in `src/integrations/supabase/client.ts`

### Forms

- All forms use **react-hook-form** with **Zod** resolvers
- Define schema with `z.object({...})`, pass to `useForm({ resolver: zodResolver(schema) })`
- Use shadcn/ui `<Form>`, `<FormField>`, `<FormItem>`, `<FormMessage>` components

### Multi-tenancy (CRITICAL)

Every query that touches company data **must** filter by `company_id`:

```typescript
const companyId = useCompanyId(); // always use this hook

supabase.from('training_plans')
  .select(...)
  .eq('company_id', companyId)   // never omit this
```

RLS policies enforce this at the DB level via `get_current_user_company_id()`, but always filter in application code as well.

### Role-based Access

```typescript
const { role, isAdmin, isHR, isManager, isEmployee } = useUserRole();
```

Roles: `admin`, `hr`, `manager`, `employee`. The sidebar and routes adapt based on role.

**Known issue:** Roles are stored in two places (`profiles.role` column + `user_roles` table). See `.lovable/plan.md` for migration plan to consolidate.

### Error Handling

- `RootErrorBoundary` catches any uncaught React errors at the app level
- `FeatureErrorBoundary` wraps each lazy route — one feature failing won't crash the whole app
- Hooks use `try-catch` for async operations; display errors via `toast` (Sonner)

### Internationalization

```typescript
const { t, language, setLanguage } = useLanguage(); // from LanguageContext

// Usage:
t('dashboard.title')  // returns string from en.ts or fr.ts
```

- French (`fr.ts`) is the primary language for the Moroccan market
- Always add keys to **both** `en.ts` and `fr.ts` — the test in `translations.test.ts` will fail otherwise
- Language preference persists to `localStorage`

---

## Component Conventions

### File Naming

- **Components:** `PascalCase.tsx` (e.g., `OrgChartView.tsx`)
- **Hooks:** `camelCase.ts` with `use` prefix (e.g., `useEmployeeProfiles.ts`)
- **Pages:** `PascalCase.tsx` in `src/pages/`
- **Utils/constants:** `camelCase.ts`

### Adding a New Feature

1. Create components in `src/components/<feature-name>/`
2. Create hooks in `src/hooks/use<FeatureName>.ts`
3. Create page in `src/pages/<PageName>.tsx`
4. Add lazy import + route in `src/App.tsx`
5. Add translation keys to both `src/locales/en.ts` and `src/locales/fr.ts`
6. Write at least one test for hook logic

### Using shadcn/ui Components

Components are pre-installed in `src/components/ui/`. Import directly:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
```

Use the `cn()` utility for conditional class merging:

```typescript
import { cn } from '@/lib/utils';
<div className={cn('base-class', isActive && 'active-class')} />
```

### Path Aliases

Use `@/` for imports from `src/`:

```typescript
import { useAuth } from '@/hooks/useAuth';    // ✓
import { useAuth } from '../../hooks/useAuth'; // ✗ (relative paths discouraged)
```

---

## Database Conventions

### Supabase Types

The file `src/integrations/supabase/types.ts` is **auto-generated** by CI. Never edit it manually. To regenerate locally:

```bash
supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
```

### Migrations

Place new migrations in `supabase/migrations/` with a timestamp prefix:

```
20260325000000_description_of_change.sql
```

Migrations run in lexicographic order. Always include rollback comments.

### Known Critical Issues (from `.lovable/plan.md`)

Before making schema changes, read `.lovable/plan.md`. Key issues:

1. **Missing tables:** `skill_categories`, `skills`, `employee_skills` tables are referenced in code but may not exist in production — creating them requires the migration in the plan file.
2. **JD RLS gap:** `job_descriptions` INSERT policy doesn't restrict by company — cross-company insertion is possible.
3. **Dual role storage:** `profiles.role` and `user_roles` table are out of sync — use `user_roles` as the source of truth for new code.
4. **No DELETE on `training_plans`:** Users can't delete draft plans — add a DELETE policy.
5. **Leaked password protection disabled** in Supabase Auth settings.

---

## Testing

### Running Tests

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode during development
npm run test:coverage   # Generate coverage report
```

### Test Location

- Tests live alongside source files: `src/hooks/useDashboardLayout.test.ts`
- Or in dedicated folders: `src/locales/translations.test.ts`
- File pattern: `**/*.{test,spec}.{ts,tsx}`

### Writing Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Supabase / auth before importing hooks
vi.mock('@/integrations/supabase/client', () => ({ ... }));
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ user: mockUser }) }));
```

The test setup (`src/test/setup.ts`) provides mocks for:
- `window.matchMedia` — media query API
- `navigator.onLine` — network status
- `localStorage` — full Storage API

---

## CI/CD

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every PR and push to `main`:

1. **Type check** — `tsc --noEmit`
2. **Lint** — `eslint .`
3. **Tests** — `vitest run`
4. **Build** — `vite build`
5. **Supabase type generation** — (main branch only) regenerates `types.ts` and warns on drift

**All four quality checks must pass before merging.**

---

## Design System

### Color Tokens

Colors use HSL CSS variables defined in `src/index.css`:

```css
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: ...;
--sidebar-background: ...;
```

Reference in Tailwind: `bg-background`, `text-foreground`, `bg-primary`, `text-sidebar-foreground`, etc.

Dark mode is class-based (`class="dark"`) via `next-themes`.

### Fonts

- **Plus Jakarta Sans** (400–800) — headings and primary text
- **Inter** (400–600) — body text

---

## PWA & Service Worker

The app is PWA-enabled with:
- `public/manifest.json` — app metadata and icons
- `public/sw.js` — service worker
- `src/components/pwa/PWAInstallBanner.tsx` — install prompt

---

## Performance Notes

- All 28 pages are lazy-loaded — do not convert pages to eager imports
- React Query is configured with `staleTime: 5 * 60 * 1000` (5 min) — avoid setting lower values without justification
- `CommandPalette`, `OnboardingChecklist`, and `PWAInstallBanner` are lazy-loaded components
- The `AIPlanBuilder.tsx` page is 126K — keep feature additions in child components, not the page file

---

## Security Reminders

- Never expose `VITE_SUPABASE_SERVICE_ROLE_KEY` or other secret keys in frontend code
- All queries must filter by `company_id` (RLS is a safety net, not the primary guard)
- Validate all user input with Zod schemas before sending to Supabase
- The `user_roles` table is the authoritative source for roles — read it server-side for sensitive operations
- Sanitize any user-generated HTML before rendering (avoid `dangerouslySetInnerHTML` without sanitization)
