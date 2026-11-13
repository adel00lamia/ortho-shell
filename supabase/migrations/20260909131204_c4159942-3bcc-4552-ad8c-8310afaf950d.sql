CREATE OR REPLACE FUNCTION public.qimatak_executive_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _cid uuid; _res jsonb;
BEGIN
  _cid := public.get_user_company_id(auth.uid());
  IF _cid IS NULL THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'company_id', _cid,
    'diagnostics_total', (SELECT count(*) FROM root_cause_diagnostics WHERE company_id = _cid),
    'diagnostics_active', (SELECT count(*) FROM root_cause_diagnostics WHERE company_id = _cid AND status <> 'closed'),
    'training_primary', (SELECT count(*) FROM root_cause_diagnostics WHERE company_id = _cid AND COALESCE(training_fit_score, 0) >= 50),
    'training_not_primary', (SELECT count(*) FROM root_cause_diagnostics WHERE company_id = _cid AND COALESCE(training_fit_score, 0) < 50),
    'high_impact_open', (SELECT count(*) FROM root_cause_diagnostics WHERE company_id = _cid AND status <> 'closed' AND COALESCE(headcount_affected, 0) >= 10),
    'pulses', (SELECT count(*) FROM evidence_pulses WHERE company_id = _cid),
    'pulse_responses', (
      SELECT count(*) FROM evidence_pulse_responses r
      JOIN evidence_pulses p ON p.id = r.pulse_id
      WHERE p.company_id = _cid),
    'actions_total', (SELECT count(*) FROM root_cause_actions WHERE company_id = _cid),
    'actions_in_progress', (SELECT count(*) FROM root_cause_actions WHERE company_id = _cid AND status = 'in_progress'),
    'actions_done', (SELECT count(*) FROM root_cause_actions WHERE company_id = _cid AND status = 'done'),
    'kpis_improving', (SELECT count(*) FROM (
        SELECT DISTINCT ON (kpi_name) kpi_name, baseline_value, actual_value, direction
        FROM diagnostic_impact_measurements
        WHERE company_id = _cid AND actual_value IS NOT NULL AND baseline_value IS NOT NULL
        ORDER BY kpi_name, measured_at DESC NULLS LAST, created_at DESC) k
      WHERE (k.direction = 'increase' AND k.actual_value > k.baseline_value)
         OR (k.direction <> 'increase' AND k.actual_value < k.baseline_value)),
    'kpis_flat', (SELECT count(*) FROM (
        SELECT DISTINCT ON (kpi_name) kpi_name, baseline_value, actual_value
        FROM diagnostic_impact_measurements
        WHERE company_id = _cid AND actual_value IS NOT NULL AND baseline_value IS NOT NULL
        ORDER BY kpi_name, measured_at DESC NULLS LAST, created_at DESC) k
      WHERE k.actual_value = k.baseline_value),
    'kpis_worsening', (SELECT count(*) FROM (
        SELECT DISTINCT ON (kpi_name) kpi_name, baseline_value, actual_value, direction
        FROM diagnostic_impact_measurements
        WHERE company_id = _cid AND actual_value IS NOT NULL AND baseline_value IS NOT NULL
        ORDER BY kpi_name, measured_at DESC NULLS LAST, created_at DESC) k
      WHERE (k.direction = 'increase' AND k.actual_value < k.baseline_value)
         OR (k.direction <> 'increase' AND k.actual_value > k.baseline_value)),
    'avoided_spend_mad', (
      SELECT COALESCE(sum(avoided_training_cost_mad), 0) FROM root_cause_diagnostics
      WHERE company_id = _cid AND COALESCE(avoided_training_cost_mad, 0) > 0),
    'avoided_spend_grounded', (
      SELECT count(*) > 0 FROM root_cause_diagnostics
      WHERE company_id = _cid AND COALESCE(avoided_training_cost_mad, 0) > 0)
  ) INTO _res;

  RETURN _res;
END;
$$;

REVOKE ALL ON FUNCTION public.qimatak_executive_overview() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.qimatak_executive_overview() FROM anon;
GRANT EXECUTE ON FUNCTION public.qimatak_executive_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.qimatak_executive_overview() TO service_role;