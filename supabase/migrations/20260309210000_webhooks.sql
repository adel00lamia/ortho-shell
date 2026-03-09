-- Webhook system for enterprise integrations
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events TEXT[] NOT NULL DEFAULT '{}',  -- e.g. {'plan.created', 'module.completed', 'evaluation.created'}
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  status_code INT,
  response_body TEXT,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries (webhook_id, delivered_at DESC);

-- RLS
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage webhooks"
  ON webhooks FOR ALL
  USING (company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Company admins can view webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (webhook_id IN (
    SELECT id FROM webhooks WHERE company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  ));
