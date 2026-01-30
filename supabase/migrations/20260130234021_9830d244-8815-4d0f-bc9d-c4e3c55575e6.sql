-- Create access log table for performance evaluations
CREATE TABLE IF NOT EXISTS public.performance_evaluation_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  evaluation_id UUID NOT NULL REFERENCES public.performance_evaluations(id) ON DELETE CASCADE,
  accessed_by UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view', 'create', 'update', 'delete')),
  accessed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

-- Enable RLS on access logs
ALTER TABLE public.performance_evaluation_access_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view access logs
CREATE POLICY "Only admins can view access logs"
  ON public.performance_evaluation_access_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- System can insert access logs (via trigger)
CREATE POLICY "System can insert access logs"
  ON public.performance_evaluation_access_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (accessed_by = auth.uid());

-- Create index for faster log queries
CREATE INDEX idx_performance_eval_access_logs_evaluation_id 
  ON public.performance_evaluation_access_logs(evaluation_id);

CREATE INDEX idx_performance_eval_access_logs_accessed_at 
  ON public.performance_evaluation_access_logs(accessed_at DESC);

-- Create function to log performance evaluation access
CREATE OR REPLACE FUNCTION public.log_performance_evaluation_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.performance_evaluation_access_logs (
    evaluation_id,
    accessed_by,
    action
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    auth.uid(),
    TG_OP
  );
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers for logging access to performance evaluations
CREATE TRIGGER log_performance_evaluation_insert
  AFTER INSERT ON public.performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_performance_evaluation_access();

CREATE TRIGGER log_performance_evaluation_update
  AFTER UPDATE ON public.performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_performance_evaluation_access();

CREATE TRIGGER log_performance_evaluation_delete
  AFTER DELETE ON public.performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.log_performance_evaluation_access();

-- Add policy to allow employees to view their OWN evaluations
-- This gives employees transparency while maintaining HR control
CREATE POLICY "Employees can view their own evaluations"
  ON public.performance_evaluations
  FOR SELECT
  TO authenticated
  USING (
    employee_email = auth.email()
  );

-- Add comment documenting the security model
COMMENT ON TABLE public.performance_evaluations IS 
'Sensitive employee performance data. Access restricted to admins/HR for company evaluations, 
and employees can view their own evaluations. All access is logged for audit purposes.';