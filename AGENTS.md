# Architecture decisions

- Keep public landing-page visual tokens scoped under `.landing-shell` so its editorial identity cannot alter authenticated product screens.
- Keep Transformation cockpit styling scoped under `.transformation-shell`; its WorkGraph is built from existing company-scoped entities and the agent remains read-only.
- Keep the Atlas guided demo as a presentation layer over company-scoped Transformation records; it must navigate existing views instead of duplicating analysis logic.
- Treat the saved `training_plans` record as the handoff source for engineering/OFPPT actions; filter every lookup by company to prevent cross-tenant prefills.
- Keep sector inference in a tested pure helper so short technology keywords cannot match unrelated industry names.
- Generate Claude plans as bounded forced-tool JSON sections and validate every section before merging; never publish partial plans or silently drop analysis.
- Keep the planner's Anthropic stream adapter independently testable and reject terminal errors or missing completion before parsing a plan.
- Keep the HR Transformation workspace (/transformation-rh, public /transformation-rh/demo) on one pure model in src/lib/hrWorkspace with device-local storage keyed by user+company; the demo must never query company tables.
- Use one complete-frame plan response reader for the planner and HR workspace; keep HR training proposals in user/company-scoped local storage without overwriting the transformation roadmap.
- Build WorkGraph people/intervention/impact layers in pure src/lib/workGraphLinks from existing records using exact references only, so links are never guessed.
- Remount the HR workspace on user/company storage-key changes and keep demo/real backup formats separated to prevent accidental local cross-context writes.
- Import edge-function preflight headers from `_shared/cors.ts`, not Supabase client subpaths, to avoid unavailable package exports.
