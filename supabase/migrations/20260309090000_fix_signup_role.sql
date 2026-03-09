-- Fix: allow users to select their role at signup instead of always defaulting to 'employee'
-- The role is passed via auth.users.raw_user_meta_data.requested_role

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
BEGIN
  -- Read requested role from user metadata, default to 'employee'
  v_role := COALESCE(
    (NEW.raw_user_meta_data ->> 'requested_role')::app_role,
    'employee'
  );

  -- Insert into profiles (without role)
  INSERT INTO public.profiles (id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;

  -- Insert role into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
