
CREATE OR REPLACE FUNCTION public.validate_activity_log_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow known fixed actions
  IF NEW.action IN ('login', 'logout') THEN
    RETURN NEW;
  END IF;

  -- Allow known prefixed actions (admin operations)
  IF NEW.action LIKE 'Registered resident:%'
    OR NEW.action LIKE 'Edited resident profile:%'
    OR NEW.action LIKE 'Moved resident to trash:%'
    OR NEW.action LIKE 'Restored resident from trash:%'
    OR NEW.action LIKE 'Permanently deleted resident:%'
    OR NEW.action LIKE 'Approved resident:%'
    OR NEW.action LIKE 'Created % request for %'
    OR NEW.action LIKE 'Approved certificate request:%'
    OR NEW.action LIKE 'Denied certificate request:%'
    OR NEW.action LIKE 'Edited request:%'
  THEN
    RETURN NEW;
  END IF;

  -- Reject all other values
  RAISE EXCEPTION 'Invalid activity log action: %', NEW.action;
END;
$$;

CREATE TRIGGER validate_activity_log_action_trigger
  BEFORE INSERT ON public.activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_activity_log_action();
