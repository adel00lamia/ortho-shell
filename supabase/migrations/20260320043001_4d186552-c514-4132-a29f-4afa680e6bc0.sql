
-- Clean up duplicate departments: keep the oldest one per (company_id, name)
DELETE FROM positions WHERE department_id IN (
  SELECT id FROM departments WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id, name ORDER BY created_at ASC) as rn
      FROM departments
    ) sub WHERE rn > 1
  )
);

DELETE FROM departments WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id, name ORDER BY created_at ASC) as rn
    FROM departments
  ) sub WHERE rn > 1
);
