

## Plan: Add per-step error reporting to demo data loader

### Problem
The seeder currently wraps everything in a single try/catch, so when any step fails the error message is generic and doesn't identify which table or RLS policy blocked the operation. Several steps also silently ignore errors (no error check after insert).

### Approach
Create a helper function `seedStep` that wraps each Supabase call with:
- Progress update (step N/8 + label)
- Error check with table name in the error message
- Console logging of the exact error object

### Changes — single file: `src/hooks/useSeedDemoData.ts`

1. **Add a `seedStep` helper** inside `seedDemoData`:
```typescript
const runStep = async <T>(
  stepNum: number, 
  totalSteps: number, 
  label: string, 
  table: string, 
  fn: () => Promise<{ data: T; error: any }>
): Promise<T> => {
  setProgress(`[${stepNum}/${totalSteps}] ${label}`);
  const { data, error } = await fn();
  if (error) {
    console.error(`Seed failed at step ${stepNum} (${table}):`, error);
    throw new Error(`Échec sur la table "${table}": ${error.message}`);
  }
  return data as T;
};
```

2. **Replace each bare Supabase call** with `runStep(...)`, adding proper error checking to the 4 calls that currently ignore errors (departments, employees, positions, evaluations).

3. **Update the catch block** to show both the step and table name in the toast, and log the full error with `console.error`.

4. **Update progress strings** to show step numbers like `[3/8] Création des départements...`

### Result
When a failure occurs, the user sees exactly which table failed (e.g., "Échec sur la table 'departments': new row violates row-level security policy") and the console contains the full Supabase error object for debugging.

