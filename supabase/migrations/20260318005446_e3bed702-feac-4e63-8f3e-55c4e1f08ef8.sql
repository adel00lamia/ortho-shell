
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _requested_role text;
  _role app_role;
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  
  -- Get requested role from user metadata, default to 'employee'
  _requested_role := COALESCE(NEW.raw_user_meta_data->>'requested_role', 'employee');
  
  -- Validate and cast the role
  BEGIN
    _role := _requested_role::app_role;
  EXCEPTION WHEN OTHERS THEN
    _role := 'employee';
  END;
  
  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role);
  
  RETURN NEW;
END;
$function$;
