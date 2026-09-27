# Architecture decisions

- Keep public landing-page visual tokens scoped under `.landing-shell` so its editorial identity cannot alter authenticated product screens.
- Keep Transformation cockpit styling scoped under `.transformation-shell`; its WorkGraph is built from existing company-scoped entities and the agent remains read-only.