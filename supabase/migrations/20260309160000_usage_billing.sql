-- Usage-based billing: AI credit tracking and referral program

-- AI credit usage tracking
CREATE TABLE IF NOT EXISTS ai_credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL CHECK (action IN (
    'plan_generation', 'ai_matching', 'content_suggestion',
    'skill_analysis', 'report_generation', 'benchmark_analysis'
  )),
  credits_used integer NOT NULL DEFAULT 1,
  stripe_meter_event_id text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_usage_user ON ai_credit_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_company ON ai_credit_usage(company_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_month ON ai_credit_usage(created_at);

ALTER TABLE ai_credit_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own usage" ON ai_credit_usage
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admin sees company usage" ON ai_credit_usage
  FOR SELECT USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()));

-- Monthly usage summary view
CREATE OR REPLACE VIEW v_monthly_credit_usage AS
SELECT
  company_id,
  date_trunc('month', created_at) AS month,
  action,
  SUM(credits_used) AS total_credits,
  COUNT(*) AS total_requests
FROM ai_credit_usage
GROUP BY company_id, date_trunc('month', created_at), action;

-- Referral program
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referral_code text UNIQUE NOT NULL,
  referred_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  referred_company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded', 'expired')),
  reward_type text DEFAULT 'credits' CHECK (reward_type IN ('credits', 'discount', 'free_month')),
  reward_value integer DEFAULT 0,
  converted_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own referrals" ON referrals
  FOR SELECT USING (referrer_id = auth.uid());
CREATE POLICY "Users create referrals" ON referrals
  FOR INSERT WITH CHECK (referrer_id = auth.uid());

-- Generate referral code function
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_id uuid)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  v_code text;
BEGIN
  v_code := 'TP-' || upper(substring(md5(p_user_id::text || now()::text) from 1 for 8));
  INSERT INTO referrals (referrer_id, referral_code)
  VALUES (p_user_id, v_code)
  ON CONFLICT (referral_code) DO NOTHING;
  RETURN v_code;
END;
$$;

-- TFP (Taxe de Formation Professionnelle) grant tracking
CREATE TABLE IF NOT EXISTS tfp_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  fiscal_year integer NOT NULL,
  tfp_amount_paid numeric(12,2) NOT NULL DEFAULT 0,
  eligible_recovery_amount numeric(12,2) DEFAULT 0,
  claimed_amount numeric(12,2) DEFAULT 0,
  approved_amount numeric(12,2) DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected', 'disbursed')),
  submission_date date,
  approval_date date,
  notes text,
  documents jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, fiscal_year)
);

ALTER TABLE tfp_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company sees own grants" ON tfp_grants
  FOR SELECT USING (company_id = get_current_user_company_id());
CREATE POLICY "Admin/HR manage grants" ON tfp_grants
  FOR ALL USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()));

-- White-label configuration
CREATE TABLE IF NOT EXISTS white_label_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
  brand_name text NOT NULL DEFAULT 'TrainPro Academy',
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#6366f1',
  accent_color text DEFAULT '#14b8a6',
  custom_domain text,
  custom_css text,
  hide_powered_by boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE white_label_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company sees own branding" ON white_label_config
  FOR SELECT USING (company_id = get_current_user_company_id());
CREATE POLICY "Admin manages branding" ON white_label_config
  FOR ALL USING (company_id = get_current_user_company_id() AND is_admin_or_hr(auth.uid()));
