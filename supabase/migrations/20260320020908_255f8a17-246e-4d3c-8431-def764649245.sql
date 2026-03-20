CREATE OR REPLACE FUNCTION public.log_performance_evaluation_access()
RETURNS trigger
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
    CASE TG_OP
      WHEN 'INSERT' THEN 'create'
      WHEN 'UPDATE' THEN 'update'
      WHEN 'DELETE' THEN 'delete'
    END
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;