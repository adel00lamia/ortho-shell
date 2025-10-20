-- Create job_descriptions table
CREATE TABLE public.job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  department TEXT,
  level TEXT, -- Junior, Mid, Senior, Executive
  description TEXT,
  required_skills JSONB DEFAULT '[]'::jsonb,
  preferred_skills JSONB DEFAULT '[]'::jsonb,
  responsibilities TEXT[],
  competencies JSONB DEFAULT '[]'::jsonb, -- {name, required_level (1-5)}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create performance_evaluations table
CREATE TABLE public.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_email TEXT,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
  department TEXT,
  evaluation_period TEXT, -- Q1 2025, 2024 Annual, etc
  evaluation_date DATE DEFAULT CURRENT_DATE,
  overall_rating DECIMAL(3,2), -- 1.00 to 5.00
  competency_scores JSONB DEFAULT '{}'::jsonb, -- {competency_name: score}
  strengths TEXT[],
  areas_for_improvement TEXT[],
  training_recommendations TEXT[],
  career_goals TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create training_diagnostic_employees table
CREATE TABLE public.training_diagnostic_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostic_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  job_description_id UUID REFERENCES public.job_descriptions(id) ON DELETE SET NULL,
  performance_evaluation_id UUID REFERENCES public.performance_evaluations(id) ON DELETE SET NULL,
  current_competencies JSONB DEFAULT '{}'::jsonb,
  target_competencies JSONB DEFAULT '{}'::jsonb,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_diagnostic_employees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_descriptions
CREATE POLICY "Users can view their job descriptions"
ON public.job_descriptions
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create job descriptions"
ON public.job_descriptions
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their job descriptions"
ON public.job_descriptions
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their job descriptions"
ON public.job_descriptions
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- RLS Policies for performance_evaluations
CREATE POLICY "Users can view their evaluations"
ON public.performance_evaluations
FOR SELECT
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can create evaluations"
ON public.performance_evaluations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their evaluations"
ON public.performance_evaluations
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their evaluations"
ON public.performance_evaluations
FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- RLS Policies for training_diagnostic_employees
CREATE POLICY "Users can view their diagnostic employees"
ON public.training_diagnostic_employees
FOR SELECT
TO authenticated
USING (
  diagnostic_id IN (
    SELECT id FROM public.training_diagnostics 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage their diagnostic employees"
ON public.training_diagnostic_employees
FOR ALL
TO authenticated
USING (
  diagnostic_id IN (
    SELECT id FROM public.training_diagnostics 
    WHERE created_by = auth.uid()
  )
);

-- Update function for timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_descriptions_updated_at
  BEFORE UPDATE ON public.job_descriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER performance_evaluations_updated_at
  BEFORE UPDATE ON public.performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();