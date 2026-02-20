
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, middle_name, age, contact, address, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'first_name',
      split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1),
      ''
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'last_name',
      CASE 
        WHEN array_length(string_to_array(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' '), 1) > 1
        THEN array_to_string((string_to_array(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' '))[2:], ' ')
        ELSE ''
      END
    ),
    NEW.raw_user_meta_data->>'middle_name',
    (NEW.raw_user_meta_data->>'age')::integer,
    NEW.raw_user_meta_data->>'contact',
    NEW.raw_user_meta_data->>'address',
    'Pending Approval'
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'resident');

  RETURN NEW;
END;
$function$;
