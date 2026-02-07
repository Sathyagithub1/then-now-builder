-- Add new settings for Stripe, PayPal, and Twilio
INSERT INTO public.app_settings (key, value, description, is_encrypted)
VALUES 
  -- Stripe settings
  ('STRIPE_PUBLISHABLE_KEY', NULL, 'Stripe publishable key for frontend', false),
  ('STRIPE_SECRET_KEY', NULL, 'Stripe secret key for backend processing', true),
  ('STRIPE_WEBHOOK_SECRET', NULL, 'Stripe webhook signing secret', true),
  
  -- PayPal settings
  ('PAYPAL_CLIENT_ID', NULL, 'PayPal client ID', false),
  ('PAYPAL_CLIENT_SECRET', NULL, 'PayPal client secret', true),
  ('PAYPAL_MODE', 'sandbox', 'PayPal mode: sandbox or live', false),
  
  -- Twilio settings
  ('TWILIO_ACCOUNT_SID', NULL, 'Twilio account SID', false),
  ('TWILIO_AUTH_TOKEN', NULL, 'Twilio auth token', true),
  ('TWILIO_PHONE_NUMBER', NULL, 'Twilio phone number for sending SMS', false),
  ('TWILIO_ENABLED', 'false', 'Enable Twilio for international SMS', false),
  
  -- SMS Provider preference
  ('SMS_PROVIDER', 'msg91', 'Primary SMS provider: msg91 or twilio', false)
ON CONFLICT (key) DO NOTHING;

-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;