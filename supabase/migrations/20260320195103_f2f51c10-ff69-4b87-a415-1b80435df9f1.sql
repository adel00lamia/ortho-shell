
-- HR Knowledge Base articles table
CREATE TABLE public.hr_knowledge_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  summary text,
  category text NOT NULL DEFAULT 'general',
  tags text[] DEFAULT '{}',
  source_type text NOT NULL DEFAULT 'manual',
  source_url text,
  is_public boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hr_knowledge_articles ENABLE ROW LEVEL SECURITY;

-- HR/Admin can manage articles
CREATE POLICY "HR/Admin can manage articles"
  ON public.hr_knowledge_articles FOR ALL
  TO authenticated
  USING (
    (company_id = get_user_company_id(auth.uid()))
    AND is_admin_or_hr(auth.uid())
  );

-- All users can view articles in their company
CREATE POLICY "Users can view company articles"
  ON public.hr_knowledge_articles FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Public articles visible to all authenticated users
CREATE POLICY "Public articles visible to all"
  ON public.hr_knowledge_articles FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Updated_at trigger
CREATE TRIGGER update_hr_knowledge_articles_updated_at
  BEFORE UPDATE ON public.hr_knowledge_articles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Chat history table
CREATE TABLE public.hr_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  sources jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hr_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own chat messages"
  ON public.hr_chat_messages FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
