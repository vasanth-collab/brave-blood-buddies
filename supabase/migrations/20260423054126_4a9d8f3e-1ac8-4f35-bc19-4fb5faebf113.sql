CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role public.app_role;
BEGIN
  INSERT INTO public.profiles (id, name, email, phone, blood_group, location, pincode)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    NULLIF(NEW.raw_user_meta_data->>'blood_group','')::public.blood_group,
    COALESCE(NEW.raw_user_meta_data->>'location', ''),
    COALESCE(NEW.raw_user_meta_data->>'pincode', '')
  );

  -- Honour role chosen at signup; default to donor
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role','')::public.app_role, 'donor'::public.app_role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  -- Always create donor_details row (a requester may also donate later)
  INSERT INTO public.donor_details (user_id, is_available)
  VALUES (NEW.id, v_role = 'donor');

  RETURN NEW;
END; $function$;