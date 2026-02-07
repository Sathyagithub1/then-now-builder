-- Fix: Change the view to use SECURITY INVOKER (the default, safer option)
-- Drop and recreate the view without SECURITY DEFINER
DROP VIEW IF EXISTS public.profile_sensitive_data;

-- Recreate as a regular view (SECURITY INVOKER is default)
CREATE VIEW public.profile_sensitive_data AS
SELECT 
  id,
  bank_account_number,
  bank_ifsc_code,
  bank_account_holder_name,
  gov_id_number,
  gov_id_type,
  passport_number,
  election_card_number,
  ration_card_number,
  upi_id
FROM public.profiles
WHERE id = auth.uid();

-- Explicitly set SECURITY INVOKER to be clear about intent
ALTER VIEW public.profile_sensitive_data SET (security_invoker = on);

-- Add comment explaining the security model
COMMENT ON VIEW public.profile_sensitive_data IS 
'View that provides access to sensitive profile data using SECURITY INVOKER. 
Only returns data for the authenticated user based on their RLS permissions.
Access to this view should be logged for security auditing.';