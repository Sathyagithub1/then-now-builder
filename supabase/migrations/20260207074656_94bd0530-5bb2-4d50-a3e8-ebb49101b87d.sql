-- =====================================================
-- PHASE 1: Enhanced Reviews & Ratings System
-- =====================================================

-- Add rating_type to distinguish farmer vs worker reviews
ALTER TABLE public.order_reviews 
ADD COLUMN IF NOT EXISTS rating_type text CHECK (rating_type IN ('farmer_to_worker', 'worker_to_farmer'));

-- Create function to update profile average rating
CREATE OR REPLACE FUNCTION public.update_profile_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the reviewee's average rating
  UPDATE public.profiles
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating)::numeric(3,2), 0)
      FROM public.order_reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.order_reviews
      WHERE reviewee_id = NEW.reviewee_id
    ),
    updated_at = NOW()
  WHERE id = NEW.reviewee_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-update ratings
DROP TRIGGER IF EXISTS trigger_update_profile_rating ON public.order_reviews;
CREATE TRIGGER trigger_update_profile_rating
AFTER INSERT OR UPDATE OR DELETE ON public.order_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_rating();

-- =====================================================
-- PHASE 2: Quote System for Farm Workers
-- =====================================================

-- Create worker_quotes table for farm workers to send quotes
CREATE TABLE IF NOT EXISTS public.worker_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES public.job_postings(id) ON DELETE CASCADE,
  worker_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  proposed_amount numeric NOT NULL CHECK (proposed_amount > 0),
  proposed_hours numeric,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'withdrawn')),
  valid_until timestamp with time zone DEFAULT (NOW() + INTERVAL '7 days'),
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW(),
  CONSTRAINT quote_must_have_reference CHECK (order_id IS NOT NULL OR job_posting_id IS NOT NULL)
);

-- Enable RLS on worker_quotes
ALTER TABLE public.worker_quotes ENABLE ROW LEVEL SECURITY;

-- RLS policies for worker_quotes
CREATE POLICY "Workers can view their own quotes"
ON public.worker_quotes FOR SELECT
USING (auth.uid() = worker_id);

CREATE POLICY "Farmers can view quotes sent to them"
ON public.worker_quotes FOR SELECT
USING (auth.uid() = farmer_id);

CREATE POLICY "Workers can create quotes"
ON public.worker_quotes FOR INSERT
WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can update their pending quotes"
ON public.worker_quotes FOR UPDATE
USING (auth.uid() = worker_id AND status = 'pending');

CREATE POLICY "Farmers can accept or reject quotes"
ON public.worker_quotes FOR UPDATE
USING (auth.uid() = farmer_id AND status = 'pending');

CREATE POLICY "Workers can delete their pending quotes"
ON public.worker_quotes FOR DELETE
USING (auth.uid() = worker_id AND status = 'pending');

-- =====================================================
-- PHASE 3: Enhanced Payment System with Escrow
-- =====================================================

-- Create payment_transactions table for escrow functionality
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  quote_id uuid REFERENCES public.worker_quotes(id),
  payer_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  commission_percentage numeric NOT NULL DEFAULT 10 CHECK (commission_percentage >= 0 AND commission_percentage <= 50),
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL,
  payment_gateway text NOT NULL CHECK (payment_gateway IN ('razorpay', 'stripe', 'paypal')),
  gateway_order_id text,
  gateway_payment_id text,
  gateway_signature text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'held', 'released', 'refunded', 'failed', 'disputed')),
  held_at timestamp with time zone,
  released_at timestamp with time zone,
  refunded_at timestamp with time zone,
  failure_reason text,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT NOW(),
  updated_at timestamp with time zone DEFAULT NOW()
);

-- Enable RLS on payment_transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_transactions
CREATE POLICY "Users can view their own transactions"
ON public.payment_transactions FOR SELECT
USING (
  auth.uid() = payer_id 
  OR auth.uid() = receiver_id 
  OR has_role(auth.uid(), 'admin'::user_role) 
  OR has_role(auth.uid(), 'super_admin'::user_role)
);

CREATE POLICY "Payers can create transactions"
ON public.payment_transactions FOR INSERT
WITH CHECK (auth.uid() = payer_id);

-- Only system (via edge functions with service role) can update transactions
-- No direct user updates allowed for security

-- =====================================================
-- PHASE 4: Work Type Commission Configuration
-- =====================================================

-- Add commission_rate to work_types table
ALTER TABLE public.work_types
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 50);

-- =====================================================
-- PHASE 5: Helper Functions
-- =====================================================

-- Function to calculate net amount after commission
CREATE OR REPLACE FUNCTION public.calculate_payment_amounts(
  p_amount numeric,
  p_commission_percentage numeric
)
RETURNS TABLE (
  commission_amount numeric,
  net_amount numeric
) AS $$
BEGIN
  RETURN QUERY SELECT 
    ROUND((p_amount * p_commission_percentage / 100)::numeric, 2) as commission_amount,
    ROUND((p_amount - (p_amount * p_commission_percentage / 100))::numeric, 2) as net_amount;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- Function to auto-release payment when order is completed
CREATE OR REPLACE FUNCTION public.auto_release_payment_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update held payments to released
    UPDATE public.payment_transactions
    SET 
      status = 'released',
      released_at = NOW(),
      updated_at = NOW()
    WHERE order_id = NEW.id 
    AND status = 'held';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto-release
DROP TRIGGER IF EXISTS trigger_auto_release_payment ON public.orders;
CREATE TRIGGER trigger_auto_release_payment
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_release_payment_on_completion();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_quotes_worker_id ON public.worker_quotes(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_quotes_farmer_id ON public.worker_quotes(farmer_id);
CREATE INDEX IF NOT EXISTS idx_worker_quotes_status ON public.worker_quotes(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order_id ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_order_reviews_reviewee_id ON public.order_reviews(reviewee_id);