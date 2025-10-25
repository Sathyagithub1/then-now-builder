-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'farmer', 'farm_worker');

-- Create work category enum
CREATE TYPE public.work_category AS ENUM ('harvesting', 'plowing', 'irrigation', 'pesticide_spray', 'planting', 'weeding', 'other');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('new', 'ongoing', 'completed', 'partially_accepted', 'agreed_partially', 'accepted_finished', 'canceled', 'dispute');

-- Update profiles table to support new role system
ALTER TABLE public.profiles 
  ALTER COLUMN user_type TYPE text,
  ADD COLUMN role user_role,
  ADD COLUMN bank_account_number text,
  ADD COLUMN bank_ifsc_code text,
  ADD COLUMN bank_account_holder_name text,
  ADD COLUMN upi_id text,
  ADD COLUMN is_active boolean DEFAULT true,
  ADD COLUMN kyc_verified boolean DEFAULT false;

-- Create work types table
CREATE TABLE public.work_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.work_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active work types"
  ON public.work_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage work types"
  ON public.work_types FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

-- Create orders table (replacing quotes with full order management)
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES public.profiles(id),
  worker_id uuid NOT NULL REFERENCES public.profiles(id),
  work_type_id uuid REFERENCES public.work_types(id),
  title text NOT NULL,
  description text NOT NULL,
  location_address text NOT NULL,
  location_lat numeric,
  location_lng numeric,
  start_date date,
  end_date date,
  estimated_hours numeric,
  agreed_amount numeric NOT NULL,
  commission_percentage numeric DEFAULT 10,
  commission_amount numeric,
  status order_status DEFAULT 'new',
  notes text,
  cancellation_reason text,
  dispute_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their orders"
  ON public.orders FOR SELECT
  USING (auth.uid() IN (farmer_id, worker_id) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY "Farmers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = farmer_id AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role = 'farmer'
  ));

CREATE POLICY "Users can update their orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() IN (farmer_id, worker_id) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

-- Create order payments table
CREATE TABLE public.order_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  payer_id uuid NOT NULL REFERENCES public.profiles(id),
  receiver_id uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  commission_amount numeric DEFAULT 0,
  payment_method text NOT NULL,
  transaction_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their payments"
  ON public.order_payments FOR SELECT
  USING (auth.uid() IN (payer_id, receiver_id) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY "Users can create payments"
  ON public.order_payments FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id),
  receiver_id uuid NOT NULL REFERENCES public.profiles(id),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON public.chat_messages FOR SELECT
  USING (auth.uid() IN (sender_id, receiver_id) OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their messages"
  ON public.chat_messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Create order reviews table (replacing reviews)
CREATE TABLE public.order_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
  reviewee_id uuid NOT NULL REFERENCES public.profiles(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(order_id, reviewer_id, reviewee_id)
);

ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.order_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.order_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
  ON public.order_reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
  ON public.order_reviews FOR DELETE
  USING (auth.uid() = reviewer_id OR EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

-- Create commission history table
CREATE TABLE public.commission_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage numeric NOT NULL,
  effective_from timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.commission_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission history"
  ON public.commission_history FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('super_admin', 'admin')
  ));

-- Create trigger for updating timestamps
CREATE TRIGGER update_work_types_updated_at
  BEFORE UPDATE ON public.work_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_payments_updated_at
  BEFORE UPDATE ON public.order_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_order_reviews_updated_at
  BEFORE UPDATE ON public.order_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default work types
INSERT INTO public.work_types (name, description, icon) VALUES
  ('Harvesting', 'Crop harvesting and collection', '🌾'),
  ('Plowing', 'Land preparation and plowing', '🚜'),
  ('Irrigation', 'Water management and irrigation', '💧'),
  ('Pesticide Spray', 'Pest control and spraying', '🌿'),
  ('Planting', 'Seed sowing and planting', '🌱'),
  ('Weeding', 'Weed removal and management', '🪴'),
  ('Other', 'Other agricultural services', '🔧');

-- Insert default commission rate
INSERT INTO public.commission_history (percentage) VALUES (10.0);