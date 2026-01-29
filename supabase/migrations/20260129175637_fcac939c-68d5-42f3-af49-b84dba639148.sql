-- Create table for saved plan templates
CREATE TABLE public.plan_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan templates
CREATE POLICY "Users can view their own templates" 
ON public.plan_templates 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own templates" 
ON public.plan_templates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" 
ON public.plan_templates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" 
ON public.plan_templates 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for plan versions (version history)
CREATE TABLE public.plan_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  plan_data JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  change_notes TEXT
);

-- Enable RLS
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan versions
CREATE POLICY "Users can view versions of their company plans" 
ON public.plan_versions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM training_plans tp 
  WHERE tp.id = plan_id 
  AND tp.created_by = auth.uid()
));

CREATE POLICY "Users can create versions of their plans" 
ON public.plan_versions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM training_plans tp 
  WHERE tp.id = plan_id 
  AND tp.created_by = auth.uid()
));

-- Create table for plan comments
CREATE TABLE public.plan_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.plan_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan comments
CREATE POLICY "Users can view comments on their company plans" 
ON public.plan_comments 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM training_plans tp 
  WHERE tp.id = plan_id 
  AND tp.created_by = auth.uid()
) OR user_id = auth.uid());

CREATE POLICY "Users can create comments" 
ON public.plan_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.plan_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.plan_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for plan sharing
CREATE TABLE public.plan_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_with_email TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'view',
  share_token UUID NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plan_shares ENABLE ROW LEVEL SECURITY;

-- RLS policies for plan shares
CREATE POLICY "Users can view shares they created or received" 
ON public.plan_shares 
FOR SELECT 
USING (shared_by = auth.uid() OR shared_with_email = auth.email());

CREATE POLICY "Users can create shares for their plans" 
ON public.plan_shares 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM training_plans tp 
  WHERE tp.id = plan_id 
  AND tp.created_by = auth.uid()
));

CREATE POLICY "Users can delete shares they created" 
ON public.plan_shares 
FOR DELETE 
USING (shared_by = auth.uid());

-- Create trigger for updated_at on plan_templates
CREATE TRIGGER update_plan_templates_updated_at
BEFORE UPDATE ON public.plan_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on plan_comments
CREATE TRIGGER update_plan_comments_updated_at
BEFORE UPDATE ON public.plan_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();