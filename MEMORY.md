# TrainPro Academy — Working Memory

## Pending Questions / To Verify

| # | Item | Notes |
|---|------|-------|
| 1 | **GIAC reimbursement rates** | Verify 80% (with strategic diagnostic) / 70% (without) against official OFPPT/CSF documentation. Currently hardcoded in `src/lib/ofpptFinancials.ts`. |
| 2 | **Training Provider module** | Decide: full provider entity (profile, catalog, search, ratings) vs simple text field in fiches techniques. |
| 3 | **Full authentication** | Email verification, MFA, session hardening — current auth is basic Supabase only. |
| 4 | **Testimonials** | Landing/pricing page social proof — needs data model, submission form, moderation, display. |
| 5 | **Stripe integration** | Subscription plans, checkout, webhooks, billing portal, invoice generation. |
