-- Create app_settings table for storing configuration
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  is_encrypted BOOLEAN DEFAULT false,
  description TEXT,
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view settings
CREATE POLICY "Super admins can view settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Only super_admins can insert settings
CREATE POLICY "Super admins can insert settings"
ON public.app_settings FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Only super_admins can update settings
CREATE POLICY "Super admins can update settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'));

-- Insert default settings keys
INSERT INTO public.app_settings (key, value, description) VALUES
  ('MSG91_AUTH_KEY', NULL, 'MSG91 authentication key for SMS notifications'),
  ('MSG91_SENDER_ID', 'FARMCH', 'MSG91 sender ID (max 6 characters)'),
  ('MSG91_TEMPLATE_ID', NULL, 'MSG91 flow template ID'),
  ('RAZORPAY_KEY_ID', NULL, 'Razorpay API key ID'),
  ('RAZORPAY_KEY_SECRET', NULL, 'Razorpay API key secret'),
  ('COMMISSION_PERCENTAGE', '10', 'Default commission percentage for transactions'),
  ('SMS_ENABLED', 'false', 'Enable/disable SMS notifications globally');