-- Create user_roles table for secure role management
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Migrate existing roles to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Only admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update existing RLS policies to use has_role function
DROP POLICY IF EXISTS "Admins can manage commission history" ON public.commission_history;
CREATE POLICY "Admins can manage commission history"
ON public.commission_history FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Users can view their messages" ON public.chat_messages;
CREATE POLICY "Users can view their messages"
ON public.chat_messages FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = receiver_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Users can view their payments" ON public.order_payments;
CREATE POLICY "Users can view their payments"
ON public.order_payments FOR SELECT
TO authenticated
USING (
  auth.uid() = payer_id OR 
  auth.uid() = receiver_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Users can view their orders" ON public.orders;
CREATE POLICY "Users can view their orders"
ON public.orders FOR SELECT
TO authenticated
USING (
  auth.uid() = farmer_id OR 
  auth.uid() = worker_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Users can update their orders" ON public.orders;
CREATE POLICY "Users can update their orders"
ON public.orders FOR UPDATE
TO authenticated
USING (
  auth.uid() = farmer_id OR 
  auth.uid() = worker_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);

DROP POLICY IF EXISTS "Admins can manage work types" ON public.work_types;
CREATE POLICY "Admins can manage work types"
ON public.work_types FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Users can delete own reviews" ON public.order_reviews;
CREATE POLICY "Users can delete own reviews"
ON public.order_reviews FOR DELETE
TO authenticated
USING (
  auth.uid() = reviewer_id OR 
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'super_admin')
);