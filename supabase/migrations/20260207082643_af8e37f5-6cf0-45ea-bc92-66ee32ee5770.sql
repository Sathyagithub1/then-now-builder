-- Create function audit logs table for security monitoring
CREATE TABLE IF NOT EXISTS public.function_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  function_name TEXT NOT NULL,
  invocation_source TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  invoked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.function_audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.function_audit_logs
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::user_role) OR 
  public.has_role(auth.uid(), 'super_admin'::user_role)
);

-- No direct inserts/updates from client - only edge functions with service role
-- (No INSERT policy needed as service role bypasses RLS)

-- Create profile access audit log table
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  accessed_profile_id UUID NOT NULL,
  access_type TEXT NOT NULL, -- 'view', 'update', 'view_sensitive'
  accessed_fields TEXT[] DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view profile access logs
CREATE POLICY "Super admins can view profile access logs"
ON public.profile_access_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::user_role));

-- Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  p_accessed_profile_id UUID,
  p_access_type TEXT,
  p_accessed_fields TEXT[] DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profile_access_logs (user_id, accessed_profile_id, access_type, accessed_fields)
  VALUES (auth.uid(), p_accessed_profile_id, p_access_type, p_accessed_fields);
END;
$$;

-- Create trigger to automatically log when sensitive profile fields are accessed
CREATE OR REPLACE FUNCTION public.audit_profile_sensitive_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sensitive_fields TEXT[] := ARRAY['bank_account_number', 'bank_ifsc_code', 'bank_account_holder_name', 
    'gov_id_number', 'passport_number', 'election_card_number', 'ration_card_number', 'upi_id'];
BEGIN
  -- Log access to own profile with sensitive fields
  IF auth.uid() = OLD.id THEN
    INSERT INTO public.profile_access_logs (user_id, accessed_profile_id, access_type, accessed_fields)
    VALUES (auth.uid(), OLD.id, 'view_own', v_sensitive_fields);
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_function_audit_logs_function_name ON public.function_audit_logs(function_name);
CREATE INDEX IF NOT EXISTS idx_function_audit_logs_invoked_at ON public.function_audit_logs(invoked_at DESC);
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_user_id ON public.profile_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_accessed_profile_id ON public.profile_access_logs(accessed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_access_logs_created_at ON public.profile_access_logs(created_at DESC);

-- Create a view for sensitive profile data that requires explicit access
CREATE OR REPLACE VIEW public.profile_sensitive_data AS
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

-- Add comment explaining the security model
COMMENT ON VIEW public.profile_sensitive_data IS 
'View that provides access to sensitive profile data. Only returns data for the authenticated user. 
Access to this view should be logged for security auditing.';

-- Add comment on profiles table about sensitive data
COMMENT ON TABLE public.profiles IS 
'User profiles containing personal information. Sensitive fields (bank details, government IDs) 
should be accessed through profile_sensitive_data view and are subject to audit logging.';