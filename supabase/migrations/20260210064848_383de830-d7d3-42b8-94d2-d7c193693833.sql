
-- Step 1: Drop the existing profile_sensitive_data VIEW
DROP VIEW IF EXISTS public.profile_sensitive_data;

-- Step 2: Create profile_sensitive_data as a real TABLE with email + mobile_number
CREATE TABLE public.profile_sensitive_data (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  mobile_number text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 3: Migrate existing email + mobile_number data from profiles
INSERT INTO public.profile_sensitive_data (id, email, mobile_number)
SELECT id, email, mobile_number FROM public.profiles;

-- Step 4: Enable RLS on the new table
ALTER TABLE public.profile_sensitive_data ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS policies - users can only access their own sensitive data
CREATE POLICY "Users can view own sensitive data"
ON public.profile_sensitive_data
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own sensitive data"
ON public.profile_sensitive_data
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Users can insert own sensitive data"
ON public.profile_sensitive_data
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Admins can view for support purposes
CREATE POLICY "Admins can view sensitive data"
ON public.profile_sensitive_data
FOR SELECT
USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role));

-- Step 6: Drop all removed columns from profiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS bank_account_number,
  DROP COLUMN IF EXISTS bank_ifsc_code,
  DROP COLUMN IF EXISTS bank_account_holder_name,
  DROP COLUMN IF EXISTS upi_id,
  DROP COLUMN IF EXISTS passport_number,
  DROP COLUMN IF EXISTS election_card_number,
  DROP COLUMN IF EXISTS ration_card_number,
  DROP COLUMN IF EXISTS gov_id_number,
  DROP COLUMN IF EXISTS gov_id_type,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS mobile_number;

-- Step 7: Drop the gov_id_type enum since it's no longer used
DROP TYPE IF EXISTS public.gov_id_type;

-- Step 8: Update the handle_new_user trigger function to also insert into profile_sensitive_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_full_name text;
  v_mobile_number text;
BEGIN
  v_role := NEW.raw_user_meta_data->>'role';
  v_full_name := TRIM(NEW.raw_user_meta_data->>'full_name');
  v_mobile_number := NEW.raw_user_meta_data->>'mobile_number';

  IF v_role IS NULL OR v_role NOT IN ('farmer', 'farm_worker') THEN
    RAISE EXCEPTION 'Invalid role for signup: only farmer and farm_worker are allowed';
  END IF;

  IF v_full_name IS NULL OR LENGTH(v_full_name) < 2 OR LENGTH(v_full_name) > 100 THEN
    RAISE EXCEPTION 'Full name must be between 2 and 100 characters';
  END IF;

  IF v_mobile_number IS NULL OR v_mobile_number !~ '^\d{10}$' THEN
    RAISE EXCEPTION 'Mobile number must be exactly 10 digits';
  END IF;

  -- Insert into profiles (no longer stores mobile_number or email)
  INSERT INTO public.profiles (id, role, full_name, state, district, user_type, active_role)
  VALUES (
    NEW.id,
    v_role::user_role,
    v_full_name,
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', ''),
    v_role,
    v_role::user_role
  );

  -- Insert sensitive data into separate table
  INSERT INTO public.profile_sensitive_data (id, email, mobile_number)
  VALUES (
    NEW.id,
    NEW.email,
    v_mobile_number
  );

  -- Insert into user_roles
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, v_role::user_role);

  RETURN NEW;
END;
$function$;

-- Step 9: Update notification triggers to read mobile_number from profile_sensitive_data
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_sender_name TEXT;
  v_receiver_phone TEXT;
BEGIN
  SELECT full_name INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;
  
  SELECT mobile_number INTO v_receiver_phone
  FROM public.profile_sensitive_data WHERE id = NEW.receiver_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
  VALUES (
    NEW.receiver_id,
    'new_message',
    'New Message',
    'You have a new message from ' || COALESCE(v_sender_name, 'a user'),
    v_receiver_phone,
    jsonb_build_object('sender_id', NEW.sender_id, 'message_id', NEW.id)
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_order_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_farmer_phone TEXT;
  v_worker_phone TEXT;
  v_farmer_name TEXT;
  v_worker_name TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  SELECT full_name INTO v_farmer_name FROM public.profiles WHERE id = NEW.farmer_id;
  SELECT full_name INTO v_worker_name FROM public.profiles WHERE id = NEW.worker_id;
  
  SELECT mobile_number INTO v_farmer_phone FROM public.profile_sensitive_data WHERE id = NEW.farmer_id;
  SELECT mobile_number INTO v_worker_phone FROM public.profile_sensitive_data WHERE id = NEW.worker_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
  VALUES 
    (NEW.farmer_id, 'order_status', 'Order Update', 
     'Order "' || NEW.title || '" status changed to ' || REPLACE(NEW.status::text, '_', ' '),
     v_farmer_phone,
     jsonb_build_object('order_id', NEW.id, 'new_status', NEW.status, 'old_status', OLD.status)),
    (NEW.worker_id, 'order_status', 'Order Update', 
     'Order "' || NEW.title || '" status changed to ' || REPLACE(NEW.status::text, '_', ' '),
     v_worker_phone,
     jsonb_build_object('order_id', NEW.id, 'new_status', NEW.status, 'old_status', OLD.status));
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_quote_received()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_farmer_phone TEXT;
  v_worker_name TEXT;
BEGIN
  SELECT mobile_number INTO v_farmer_phone FROM public.profile_sensitive_data WHERE id = NEW.farmer_id;
  SELECT full_name INTO v_worker_name FROM public.profiles WHERE id = NEW.worker_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
  VALUES (
    NEW.farmer_id,
    'quote_received',
    'New Quote Received',
    COALESCE(v_worker_name, 'A worker') || ' sent you a quote for ₹' || NEW.proposed_amount,
    v_farmer_phone,
    jsonb_build_object('quote_id', NEW.id, 'worker_id', NEW.worker_id, 'amount', NEW.proposed_amount)
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_quote_response()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_worker_phone TEXT;
  v_farmer_name TEXT;
BEGIN
  IF OLD.status = NEW.status OR OLD.status != 'pending' THEN
    RETURN NEW;
  END IF;
  
  SELECT mobile_number INTO v_worker_phone FROM public.profile_sensitive_data WHERE id = NEW.worker_id;
  SELECT full_name INTO v_farmer_name FROM public.profiles WHERE id = NEW.farmer_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
  VALUES (
    NEW.worker_id,
    'quote_response',
    'Quote ' || INITCAP(NEW.status),
    COALESCE(v_farmer_name, 'A farmer') || ' has ' || NEW.status || ' your quote for ₹' || NEW.proposed_amount,
    v_worker_phone,
    jsonb_build_object('quote_id', NEW.id, 'farmer_id', NEW.farmer_id, 'status', NEW.status)
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_new_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_reviewee_phone TEXT;
  v_reviewer_name TEXT;
BEGIN
  SELECT mobile_number INTO v_reviewee_phone FROM public.profile_sensitive_data WHERE id = NEW.reviewee_id;
  SELECT full_name INTO v_reviewer_name FROM public.profiles WHERE id = NEW.reviewer_id;
  
  INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
  VALUES (
    NEW.reviewee_id,
    'new_review',
    'New Review Received',
    COALESCE(v_reviewer_name, 'Someone') || ' gave you a ' || NEW.rating || '-star review',
    v_reviewee_phone,
    jsonb_build_object('review_id', NEW.id, 'reviewer_id', NEW.reviewer_id, 'rating', NEW.rating)
  );
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_payment_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payer_phone TEXT;
  v_receiver_phone TEXT;
  v_message TEXT;
BEGIN
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  SELECT mobile_number INTO v_payer_phone FROM public.profile_sensitive_data WHERE id = NEW.payer_id;
  SELECT mobile_number INTO v_receiver_phone FROM public.profile_sensitive_data WHERE id = NEW.receiver_id;
  
  CASE NEW.status
    WHEN 'held' THEN v_message := 'Payment of ₹' || NEW.amount || ' is being held in escrow';
    WHEN 'released' THEN v_message := 'Payment of ₹' || NEW.net_amount || ' has been released to you';
    WHEN 'refunded' THEN v_message := 'Payment of ₹' || NEW.amount || ' has been refunded';
    WHEN 'failed' THEN v_message := 'Payment of ₹' || NEW.amount || ' has failed';
    ELSE v_message := 'Payment status updated to ' || NEW.status;
  END CASE;
  
  IF NEW.status IN ('released', 'held') THEN
    INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
    VALUES (
      NEW.receiver_id,
      'payment_update',
      'Payment Update',
      v_message,
      v_receiver_phone,
      jsonb_build_object('transaction_id', NEW.id, 'status', NEW.status, 'amount', NEW.amount)
    );
  END IF;
  
  INSERT INTO public.notifications (user_id, type, title, message, phone_number, metadata)
  VALUES (
    NEW.payer_id,
    'payment_update',
    'Payment Update',
    v_message,
    v_payer_phone,
    jsonb_build_object('transaction_id', NEW.id, 'status', NEW.status, 'amount', NEW.amount)
  );
  
  RETURN NEW;
END;
$function$;

-- Step 10: Drop the old audit trigger that referenced old sensitive fields
DROP FUNCTION IF EXISTS public.audit_profile_sensitive_access() CASCADE;

-- Step 11: Add updated_at trigger for the new table
CREATE TRIGGER update_profile_sensitive_data_updated_at
BEFORE UPDATE ON public.profile_sensitive_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
