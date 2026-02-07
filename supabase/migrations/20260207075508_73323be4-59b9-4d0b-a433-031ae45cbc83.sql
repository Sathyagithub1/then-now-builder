-- Create notifications table to log all sent notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  phone_number TEXT,
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to insert (edge functions)
CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Create notification_settings table for user preferences
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  sms_enabled BOOLEAN DEFAULT true,
  new_message BOOLEAN DEFAULT true,
  order_status_change BOOLEAN DEFAULT true,
  quote_received BOOLEAN DEFAULT true,
  quote_response BOOLEAN DEFAULT true,
  new_review BOOLEAN DEFAULT true,
  payment_updates BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Users can manage their own settings
CREATE POLICY "Users can view own notification settings"
ON public.notification_settings FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
ON public.notification_settings FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
ON public.notification_settings FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to auto-create notification settings on user signup
CREATE OR REPLACE FUNCTION public.create_notification_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger to create settings when profile is created
CREATE TRIGGER on_profile_created_notification_settings
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.create_notification_settings();

-- Create function to queue notification when chat message is sent
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_name TEXT;
  v_receiver_phone TEXT;
BEGIN
  -- Get sender name
  SELECT full_name INTO v_sender_name
  FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Get receiver phone
  SELECT mobile_number INTO v_receiver_phone
  FROM public.profiles WHERE id = NEW.receiver_id;
  
  -- Insert notification record
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
$$;

CREATE TRIGGER on_chat_message_notify
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- Create function to notify on order status change
CREATE OR REPLACE FUNCTION public.notify_on_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_farmer_phone TEXT;
  v_worker_phone TEXT;
  v_farmer_name TEXT;
  v_worker_name TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get phone numbers and names
  SELECT mobile_number, full_name INTO v_farmer_phone, v_farmer_name
  FROM public.profiles WHERE id = NEW.farmer_id;
  
  SELECT mobile_number, full_name INTO v_worker_phone, v_worker_name
  FROM public.profiles WHERE id = NEW.worker_id;
  
  -- Notify both parties about status change
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
$$;

CREATE TRIGGER on_order_status_change_notify
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_order_status_change();

-- Create function to notify on quote received
CREATE OR REPLACE FUNCTION public.notify_on_quote_received()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_farmer_phone TEXT;
  v_worker_name TEXT;
BEGIN
  -- Get farmer phone and worker name
  SELECT mobile_number INTO v_farmer_phone
  FROM public.profiles WHERE id = NEW.farmer_id;
  
  SELECT full_name INTO v_worker_name
  FROM public.profiles WHERE id = NEW.worker_id;
  
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
$$;

CREATE TRIGGER on_quote_received_notify
AFTER INSERT ON public.worker_quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_quote_received();

-- Create function to notify worker on quote response
CREATE OR REPLACE FUNCTION public.notify_on_quote_response()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_worker_phone TEXT;
  v_farmer_name TEXT;
BEGIN
  -- Only notify if status changed from pending
  IF OLD.status = NEW.status OR OLD.status != 'pending' THEN
    RETURN NEW;
  END IF;
  
  -- Get worker phone and farmer name
  SELECT mobile_number INTO v_worker_phone
  FROM public.profiles WHERE id = NEW.worker_id;
  
  SELECT full_name INTO v_farmer_name
  FROM public.profiles WHERE id = NEW.farmer_id;
  
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
$$;

CREATE TRIGGER on_quote_response_notify
AFTER UPDATE ON public.worker_quotes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_quote_response();

-- Create function to notify on new review
CREATE OR REPLACE FUNCTION public.notify_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewee_phone TEXT;
  v_reviewer_name TEXT;
BEGIN
  -- Get reviewee phone and reviewer name
  SELECT mobile_number INTO v_reviewee_phone
  FROM public.profiles WHERE id = NEW.reviewee_id;
  
  SELECT full_name INTO v_reviewer_name
  FROM public.profiles WHERE id = NEW.reviewer_id;
  
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
$$;

CREATE TRIGGER on_new_review_notify
AFTER INSERT ON public.order_reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_review();

-- Create function to notify on payment status change
CREATE OR REPLACE FUNCTION public.notify_on_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payer_phone TEXT;
  v_receiver_phone TEXT;
  v_message TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  -- Get phone numbers
  SELECT mobile_number INTO v_payer_phone
  FROM public.profiles WHERE id = NEW.payer_id;
  
  SELECT mobile_number INTO v_receiver_phone
  FROM public.profiles WHERE id = NEW.receiver_id;
  
  -- Build message based on status
  CASE NEW.status
    WHEN 'held' THEN v_message := 'Payment of ₹' || NEW.amount || ' is being held in escrow';
    WHEN 'released' THEN v_message := 'Payment of ₹' || NEW.net_amount || ' has been released to you';
    WHEN 'refunded' THEN v_message := 'Payment of ₹' || NEW.amount || ' has been refunded';
    WHEN 'failed' THEN v_message := 'Payment of ₹' || NEW.amount || ' has failed';
    ELSE v_message := 'Payment status updated to ' || NEW.status;
  END CASE;
  
  -- Notify receiver (worker) for released/held payments
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
  
  -- Notify payer (farmer) for all status changes
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
$$;

CREATE TRIGGER on_payment_status_change_notify
AFTER UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_payment_status_change();

-- Index for faster notification queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);