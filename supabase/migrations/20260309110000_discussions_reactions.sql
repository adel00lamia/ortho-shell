-- Discussions: threaded comments on modules and plans
CREATE TABLE IF NOT EXISTS public.discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.training_modules(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.training_plans(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.discussions(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (module_id IS NOT NULL OR plan_id IS NOT NULL)
);

CREATE INDEX idx_discussions_module ON public.discussions(module_id);
CREATE INDEX idx_discussions_plan ON public.discussions(plan_id);
CREATE INDEX idx_discussions_parent ON public.discussions(parent_id);
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company discussions"
  ON public.discussions FOR SELECT
  USING (company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create discussions"
  ON public.discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id AND company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own discussions"
  ON public.discussions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussions"
  ON public.discussions FOR DELETE
  USING (auth.uid() = user_id);

-- Reactions on discussions
CREATE TABLE IF NOT EXISTS public.reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id uuid NOT NULL REFERENCES public.discussions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (emoji IN ('👍', '❤️', '🎉', '💡', '👀', '🔥')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(discussion_id, user_id, emoji)
);

CREATE INDEX idx_reactions_discussion ON public.reactions(discussion_id);
ALTER TABLE public.reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reactions"
  ON public.reactions FOR SELECT
  USING (discussion_id IN (SELECT id FROM public.discussions WHERE company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())));

CREATE POLICY "Users can add reactions"
  ON public.reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
  ON public.reactions FOR DELETE
  USING (auth.uid() = user_id);
