-- =====================================================
-- FIX 1: Protect sensitive profile data with column-level security
-- =====================================================

-- Create a public view with only non-sensitive profile fields
-- This view will be used when displaying other users' profiles
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = on) AS
SELECT 
  id,
  full_name,
  avatar_url,
  bio,
  state,
  district,
  country,
  average_rating,
  total_ratings,
  user_type,
  role,
  active_role,
  is_active,
  kyc_verified,
  created_at
FROM profiles;

-- Grant SELECT on the view to authenticated and anon users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Update the profiles RLS policy to restrict SELECT to own profile only
-- Drop the old permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

-- Create new policy: users can only SELECT their own profile from the base table
CREATE POLICY "Users can view own profile only"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- =====================================================
-- FIX 2: Strengthen chat_messages RLS policy
-- The current policy is actually correct but let's make it more explicit
-- =====================================================

-- Drop and recreate the SELECT policy with a clearer name
DROP POLICY IF EXISTS "Users can view their messages" ON chat_messages;

CREATE POLICY "Users can only view messages they sent or received"
  ON chat_messages FOR SELECT
  USING (
    auth.uid() = sender_id 
    OR auth.uid() = receiver_id 
    OR has_role(auth.uid(), 'admin'::user_role) 
    OR has_role(auth.uid(), 'super_admin'::user_role)
  );