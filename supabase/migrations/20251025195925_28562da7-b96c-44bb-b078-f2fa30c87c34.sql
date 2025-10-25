-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user types
CREATE TYPE user_type AS ENUM ('employee', 'employer');

-- Create enum for government ID types
CREATE TYPE gov_id_type AS ENUM ('aadhar_card', 'pan_card', 'voter_id', 'driving_license');

-- Create enum for service categories
CREATE TYPE service_category AS ENUM ('harvest', 'planting', 'irrigation', 'pest_control', 'transportation', 'equipment_rental', 'consulting', 'other');

-- Create enum for quote status
CREATE TYPE quote_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- Create enum for payment status
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  user_type user_type NOT NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  country TEXT DEFAULT 'India',
  state TEXT NOT NULL,
  district TEXT NOT NULL,
  gov_id_type gov_id_type,
  gov_id_number TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category service_category NOT NULL,
  price_per_unit DECIMAL(10, 2),
  unit TEXT DEFAULT 'hour',
  location_state TEXT NOT NULL,
  location_district TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  images TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(service_id, reviewer_id)
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  proposed_price DECIMAL(10, 2) NOT NULL,
  estimated_duration TEXT,
  status quote_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  status payment_status DEFAULT 'pending',
  transaction_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Services policies
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (is_active = true OR user_id = auth.uid());

CREATE POLICY "Users can create own services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own services"
  ON public.services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own services"
  ON public.services FOR DELETE
  USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = reviewer_id);

CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = reviewer_id);

-- Quotes policies
CREATE POLICY "Users can view their quotes"
  ON public.quotes FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = provider_id);

CREATE POLICY "Users can create quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Service providers can update quotes"
  ON public.quotes FOR UPDATE
  USING (auth.uid() = provider_id OR auth.uid() = requester_id);

-- Payments policies
CREATE POLICY "Users can view their payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = payer_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = payer_id);

CREATE POLICY "Payment receivers can update payment status"
  ON public.payments FOR UPDATE
  USING (auth.uid() = receiver_id OR auth.uid() = payer_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at
  BEFORE UPDATE ON public.services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_services_user_id ON public.services(user_id);
CREATE INDEX idx_services_category ON public.services(category);
CREATE INDEX idx_services_location ON public.services(location_state, location_district);
CREATE INDEX idx_reviews_service_id ON public.reviews(service_id);
CREATE INDEX idx_quotes_service_id ON public.quotes(service_id);
CREATE INDEX idx_quotes_status ON public.quotes(status);
CREATE INDEX idx_payments_quote_id ON public.payments(quote_id);