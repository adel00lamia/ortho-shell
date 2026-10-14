# Architecture decisions

- Keep public landing-page visual tokens scoped under `.landing-shell` so its editorial identity cannot alter authenticated product screens.
- Keep Transformation cockpit styling scoped under `.transformation-shell`; its WorkGraph is built from existing company-scoped entities and the agent remains read-only.
- Keep the Atlas guided demo as a presentation layer over company-scoped Transformation records; it must navigate existing views instead of duplicating analysis logic.
- Treat the saved `training_plans` record as the handoff source for engineering/OFPPT actions; filter every lookup by company to prevent cross-tenant prefills.
- Keep sector inference in a tested pure helper so short technology keywords cannot match unrelated industry names.
- Keep the planner's Anthropic stream adapter independently testable and reject terminal errors or missing completion before parsing a plan.