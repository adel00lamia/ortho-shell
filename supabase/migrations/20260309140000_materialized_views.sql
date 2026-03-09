-- Materialized views for analytics dashboards
-- Refreshed periodically via pg_cron

-- Company training summary (aggregated stats)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_company_training_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  COUNT(DISTINCT p.id) AS total_employees,
  COUNT(DISTINCT tp.id) AS total_plans,
  COUNT(DISTINCT tm.id) AS total_modules,
  COALESCE(AVG(tp.progress_percentage), 0)::numeric(5,2) AS avg_plan_progress,
  COUNT(DISTINCT CASE WHEN tp.status = 'completed' THEN tp.id END) AS completed_plans,
  COUNT(DISTINCT CASE WHEN tp.status = 'active' THEN tp.id END) AS active_plans,
  COALESCE(SUM(tp.total_budget), 0) AS total_budget_spent,
  now() AS refreshed_at
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
LEFT JOIN training_plans tp ON tp.company_id = c.id
LEFT JOIN training_modules tm ON tm.plan_id = tp.id
GROUP BY c.id, c.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_company_summary_id ON mv_company_training_summary(company_id);

-- Skills gap summary per company
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_skills_gap_summary AS
SELECT
  sc.company_id,
  sc.id AS category_id,
  sc.name AS category_name,
  COUNT(DISTINCT s.id) AS total_skills,
  COUNT(DISTINCT es.id) AS assessed_count,
  COALESCE(AVG(es.current_level), 0)::numeric(3,1) AS avg_current_level,
  COALESCE(AVG(es.target_level), 0)::numeric(3,1) AS avg_target_level,
  COALESCE(AVG(es.target_level - es.current_level), 0)::numeric(3,1) AS avg_gap,
  now() AS refreshed_at
FROM skill_categories sc
LEFT JOIN skills s ON s.category_id = sc.id
LEFT JOIN employee_skills es ON es.skill_id = s.id
GROUP BY sc.company_id, sc.id, sc.name;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_skills_gap_cat ON mv_skills_gap_summary(category_id);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_company_training_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skills_gap_summary;
END;
$$;

-- Schedule refresh every hour (requires pg_cron extension)
-- Uncomment when pg_cron is enabled in Supabase dashboard:
-- SELECT cron.schedule('refresh-analytics', '0 * * * *', 'SELECT refresh_analytics_views()');
