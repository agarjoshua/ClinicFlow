-- Enforce user limits based on subscription tier
-- This trigger prevents adding users beyond the clinic's max_consultants and max_assistants limits

CREATE OR REPLACE FUNCTION check_user_limits()
RETURNS TRIGGER AS $$
DECLARE
  clinic_max_consultants INTEGER;
  clinic_max_assistants INTEGER;
  current_consultants INTEGER;
  current_assistants INTEGER;
BEGIN
  -- Get clinic limits
  SELECT max_consultants, max_assistants
  INTO clinic_max_consultants, clinic_max_assistants
  FROM clinics
  WHERE id = NEW.clinic_id;

  -- If clinic not found or limits not set, deny
  IF clinic_max_consultants IS NULL OR clinic_max_assistants IS NULL THEN
    RAISE EXCEPTION 'Clinic limits not configured';
  END IF;

  -- Count existing users by role (excluding the current user if updating)
  IF TG_OP = 'INSERT' THEN
    -- For new user, count all existing users
    SELECT COUNT(*) INTO current_consultants
    FROM users
    WHERE clinic_id = NEW.clinic_id AND role = 'consultant';

    SELECT COUNT(*) INTO current_assistants
    FROM users
    WHERE clinic_id = NEW.clinic_id AND role = 'assistant';
  ELSE
    -- For update, count excluding current user
    SELECT COUNT(*) INTO current_consultants
    FROM users
    WHERE clinic_id = NEW.clinic_id AND role = 'consultant' AND id != NEW.id;

    SELECT COUNT(*) INTO current_assistants
    FROM users
    WHERE clinic_id = NEW.clinic_id AND role = 'assistant' AND id != NEW.id;
  END IF;

  -- Check consultant limit
  IF NEW.role = 'consultant' THEN
    IF current_consultants >= clinic_max_consultants THEN
      RAISE EXCEPTION 'Consultant limit reached (%). Upgrade subscription to add more consultants.', clinic_max_consultants;
    END IF;
  END IF;

  -- Check assistant limit
  IF NEW.role = 'assistant' THEN
    IF current_assistants >= clinic_max_assistants THEN
      RAISE EXCEPTION 'Assistant limit reached (%). Upgrade subscription to add more assistants.', clinic_max_assistants;
    END IF;
  END IF;

  -- If superadmin, allow (no clinic_id restriction)
  IF NEW.role = 'superadmin' THEN
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_user_limits ON users;

-- Create trigger that runs before insert or update
CREATE TRIGGER enforce_user_limits
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
WHEN (NEW.clinic_id IS NOT NULL AND NEW.role IN ('consultant', 'assistant'))
EXECUTE FUNCTION check_user_limits();

-- Add comment
COMMENT ON FUNCTION check_user_limits() IS 'Enforces max_consultants and max_assistants limits based on clinic subscription tier';
