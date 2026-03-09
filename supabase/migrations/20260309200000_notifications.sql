-- In-app notification system
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'plan_generated', 'module_published', 'evaluation_due',
    'certificate_issued', 'marketplace_purchase', 'team_invite',
    'dossier_status', 'ai_job_complete', 'system', 'mention'
  )),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,              -- optional in-app route, e.g. /workflow/plan/plans/123
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread
  ON notifications (user_id, read, created_at DESC)
  WHERE read = FALSE;

CREATE INDEX idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role / edge functions can insert
CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (TRUE);

-- Helper: mark all as read
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS VOID LANGUAGE SQL SECURITY DEFINER AS $$
  UPDATE notifications SET read = TRUE
  WHERE user_id = p_user_id AND read = FALSE;
$$;
