
-- Learner progress tracking for module slides and quizzes
CREATE TABLE public.learner_module_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id UUID NOT NULL REFERENCES public.training_modules(id) ON DELETE CASCADE,
  completed_slides INTEGER[] NOT NULL DEFAULT '{}',
  quiz_answers JSONB NOT NULL DEFAULT '{}',
  quiz_score NUMERIC DEFAULT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  UNIQUE(user_id, module_id)
);

ALTER TABLE public.learner_module_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
ON public.learner_module_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert their own progress"
ON public.learner_module_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
ON public.learner_module_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- HR/Admin can view all progress in their company modules
CREATE POLICY "HR/Admin can view company progress"
ON public.learner_module_progress
FOR SELECT
USING (
  module_id IN (
    SELECT tm.id FROM training_modules tm
    JOIN training_plans tp ON tm.training_plan_id = tp.id
    JOIN profiles p ON p.company_id = tp.company_id
    WHERE p.id = auth.uid() AND p.role IN ('admin', 'hr_manager')
  )
);

-- Trigger for last_activity_at
CREATE TRIGGER update_learner_progress_updated_at
BEFORE UPDATE ON public.learner_module_progress
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
