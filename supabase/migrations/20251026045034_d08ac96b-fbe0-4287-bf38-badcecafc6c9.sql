-- Drop existing unique constraint on mobile_number
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_mobile_number_key;

-- Add unique constraint: mobile number must be unique per role
-- This allows the same mobile number for different roles (Farmer vs Farm Worker)
ALTER TABLE public.profiles ADD CONSTRAINT profiles_mobile_role_unique UNIQUE (mobile_number, role);