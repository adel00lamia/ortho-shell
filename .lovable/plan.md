

## Add 6 Missing JD Templates

Add templates for the 6 demo positions currently without job descriptions to `src/data/jobDescriptionTemplates.ts`.

### Templates to Add

All categorized as `morocco` to match the demo company context:

| Template | Department | Level | Industry |
|----------|-----------|-------|----------|
| Directeur Général / CEO | Direction Générale* | c-level | General |
| Directrice Commerciale / Sales Director | Sales | director | General |
| DAF / CFO | Finance | director | General |
| Chef d'Équipe Production / Production Team Lead | Manufacturing | lead | Manufacturing |
| Data Analyst | Analytics | mid | Technology |
| Responsable Export / Export Manager | Sales | manager | General |

*Will add "Executive" to `JD_DEPARTMENTS` array since "Direction Générale" maps best to an Executive/General Management department.

### Changes

**File: `src/data/jobDescriptionTemplates.ts`**
- Insert 6 new `JDTemplate` entries before the closing `];` of `JD_TEMPLATES`, each with full bilingual titles, descriptions, responsibilities (5-6 each), technical skills, soft skills, and competency ratings
- Add `'Executive'` to `JD_DEPARTMENTS` array

### Title Matching

These templates use French titles matching the demo seeder names (`Directeur Général`, `DAF`, `Directrice Commerciale`, `Chef d'Équipe Production`, `Data Analyst`, `Responsable Export`) so the auto-fill feature will match them automatically.

