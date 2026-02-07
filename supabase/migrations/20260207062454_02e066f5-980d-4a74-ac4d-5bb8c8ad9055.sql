-- Fix 4 security warnings:
-- 1. DEFINER_OR_RPC_BYPASS & INPUT_VALIDATION: Harden handle_new_user function
-- 2. PUBLIC_DATA_EXPOSURE: Create public_job_postings view without precise coords
-- 3. CLIENT_SIDE_AUTH: Add order status validation trigger

-- ============================================================
-- 1. REPLACE handle_new_user with validation (fixes DEFINER_OR_RPC_BYPASS + INPUT_VALIDATION)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_role text;
  v_full_name text;
  v_mobile_number text;
BEGIN
  -- Extract values for validation
  v_role := NEW.raw_user_meta_data->>'role';
  v_full_name := TRIM(NEW.raw_user_meta_data->>'full_name');
  v_mobile_number := NEW.raw_user_meta_data->>'mobile_number';

  -- SECURITY: Only allow farmer and farm_worker roles during signup
  -- Admin roles must be assigned through secure admin processes
  IF v_role IS NULL OR v_role NOT IN ('farmer', 'farm_worker') THEN
    RAISE EXCEPTION 'Invalid role for signup: only farmer and farm_worker are allowed';
  END IF;

  -- Validate full_name is present and reasonable length (2-100 chars)
  IF v_full_name IS NULL OR LENGTH(v_full_name) < 2 OR LENGTH(v_full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
  END IF;

  -- Validate mobile_number is exactly 10 digits
  IF v_mobile_number IS NULL OR v_mobile_number !~ '^\d{10}$' THEN
    RAISE EXCEPTION 'Mobile number must be exactly 10 digits';
  END IF;

  -- Insert into profiles with validated data
  INSERT INTO public.profiles (id, role, full_name, mobile_number, state, district, user_type, active_role)
  VALUES (
    NEW.id,
    v_role::user_role,
    v_full_name,
    v_mobile_number,
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    v_role,
    v_role::user_role
  );

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::user_role);

  RETURN NEW;
END;
$$;

-- ============================================================
-- 2. Create public_job_postings view without precise coordinates (fixes PUBLIC_DATA_EXPOSURE)
-- ============================================================
CREATE OR REPLACE VIEW public.public_job_postings 
WITH (security_invoker = on) AS
SELECT 
  id,
  farmer_id,
  work_type_id,
  work_crop_type_id,
  location_state,
  location_district,
  -- Exclude precise location: coordinates_lat, coordinates_lng, location_address
  estimated_budget,
  start_date,
  end_date,
  title,
  description,
  status,
  tags,
  estimated_duration,
  created_at,
  updated_at
FROM job_postings
WHERE status = 'open';

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.public_job_postings TO authenticated;
GRANT SELECT ON public.public_job_postings TO anon;

-- ============================================================
-- 3. Create order status validation trigger (fixes CLIENT_SIDE_AUTH)
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_order_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_user uuid;
  v_is_admin boolean;
BEGIN
  -- Get current user
  v_current_user := auth.uid();
  
  -- Check if user is admin
  v_is_admin := has_role(v_current_user, 'admin') OR has_role(v_current_user, 'super_admin');
  
  -- Admins can do anything
  IF v_is_admin THEN
    RETURN NEW;
  END IF;
  
  -- Validate the user is either farmer or worker on this order
  IF v_current_user IS NULL OR (v_current_user != OLD.farmer_id AND v_current_user != OLD.worker_id) THEN
    RAISE EXCEPTION 'You are not authorized to update this order';
  END IF;
  
  -- Prevent reopening completed orders (except for disputes)
  IF OLD.status = 'completed' AND NEW.status NOT IN ('completed', 'dispute') THEN
    RAISE EXCEPTION 'Cannot change a completed order status (except to dispute)';
  END IF;
  
  -- Prevent reopening canceled orders
  IF OLD.status = 'canceled' THEN
    RAISE EXCEPTION 'Cannot modify a canceled order';
  END IF;
  
  -- Only farmer can mark order as completed
  IF NEW.status = 'completed' AND v_current_user != OLD.farmer_id THEN
    RAISE EXCEPTION 'Only the farmer can mark an order as completed';
  END IF;
  
  -- Either party can mark as canceled, but require reason
  IF NEW.status = 'canceled' AND (NEW.cancellation_reason IS NULL OR TRIM(NEW.cancellation_reason) = '') THEN
    RAISE EXCEPTION 'Cancellation reason is required';
  END IF;
  
  -- Either party can raise dispute, but require reason
  IF NEW.status = 'dispute' AND (NEW.dispute_reason IS NULL OR TRIM(NEW.dispute_reason) = '') THEN
    RAISE EXCEPTION 'Dispute reason is required';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS order_status_validation_trigger ON orders;
CREATE TRIGGER order_status_validation_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_order_status_update();

-- ============================================================
-- 4. Set search_path on update_updated_at_column (fixes SUPA_function_search_path_mutable indirectly)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;