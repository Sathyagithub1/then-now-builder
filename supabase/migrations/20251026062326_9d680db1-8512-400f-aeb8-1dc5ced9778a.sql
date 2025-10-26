-- 1. Create Work Crop Types table (categories like "Bee Keeping", "Livestock")
CREATE TABLE IF NOT EXISTS public.work_crop_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Update work_types to link to work_crop_types and rename for clarity
-- First, add the foreign key column
ALTER TABLE public.work_types ADD COLUMN IF NOT EXISTS work_crop_type_id UUID REFERENCES public.work_crop_types(id);

-- 3. Create user_work_types junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.user_work_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  work_type_id UUID NOT NULL REFERENCES public.work_types(id) ON DELETE CASCADE,
  work_crop_type_id UUID NOT NULL REFERENCES public.work_crop_types(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, work_type_id)
);

-- 4. Create saved_searches table
CREATE TABLE IF NOT EXISTS public.saved_searches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  location_state TEXT,
  location_district TEXT,
  radius_km INTEGER DEFAULT 5,
  work_crop_type_ids UUID[],
  work_type_ids UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Create job_alerts table
CREATE TABLE IF NOT EXISTS public.job_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_criteria JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Create worker_availability table
CREATE TABLE IF NOT EXISTS public.worker_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  available_from DATE NOT NULL,
  available_to DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Add missing profile fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coordinates_lat NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coordinates_lng NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS passport_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS election_card_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ration_card_number TEXT;

-- 8. Create translations table for multi-language support
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL,
  language_code TEXT NOT NULL,
  value TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(key, language_code)
);

-- 9. Create search_history table
CREATE TABLE IF NOT EXISTS public.search_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT NOT NULL,
  search_filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Add rating statistics to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0;

-- Enable RLS on all new tables
ALTER TABLE public.work_crop_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for work_crop_types (public read)
CREATE POLICY "Anyone can view active work crop types"
  ON public.work_crop_types FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage work crop types"
  ON public.work_crop_types FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for user_work_types
CREATE POLICY "Users can view all user work types"
  ON public.user_work_types FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own work types"
  ON public.user_work_types FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for saved_searches
CREATE POLICY "Users can manage their own saved searches"
  ON public.saved_searches FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for job_alerts
CREATE POLICY "Users can manage their own job alerts"
  ON public.job_alerts FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for worker_availability
CREATE POLICY "Anyone can view worker availability"
  ON public.worker_availability FOR SELECT
  USING (true);

CREATE POLICY "Workers can manage their own availability"
  ON public.worker_availability FOR INSERT
  WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Workers can update their own availability"
  ON public.worker_availability FOR UPDATE
  USING (auth.uid() = worker_id);

CREATE POLICY "Workers can delete their own availability"
  ON public.worker_availability FOR DELETE
  USING (auth.uid() = worker_id);

-- RLS Policies for translations (public read, admin write)
CREATE POLICY "Anyone can view translations"
  ON public.translations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage translations"
  ON public.translations FOR ALL
  USING (has_role(auth.uid(), 'admin'::user_role) OR has_role(auth.uid(), 'super_admin'::user_role));

-- RLS Policies for search_history
CREATE POLICY "Users can view their own search history"
  ON public.search_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own search history"
  ON public.search_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_types_crop_type ON public.work_types(work_crop_type_id);
CREATE INDEX IF NOT EXISTS idx_user_work_types_user ON public.user_work_types(user_id);
CREATE INDEX IF NOT EXISTS idx_user_work_types_work_type ON public.user_work_types(work_type_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON public.saved_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_job_alerts_user ON public.job_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_availability_worker ON public.worker_availability(worker_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_coordinates ON public.profiles(coordinates_lat, coordinates_lng);
CREATE INDEX IF NOT EXISTS idx_translations_key_lang ON public.translations(key, language_code);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_work_crop_types_updated_at
  BEFORE UPDATE ON public.work_crop_types
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_alerts_updated_at
  BEFORE UPDATE ON public.job_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_worker_availability_updated_at
  BEFORE UPDATE ON public.worker_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_translations_updated_at
  BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial work crop types based on the requirements
INSERT INTO public.work_crop_types (name, description, is_active) VALUES
  ('Bee Keeping', 'Beekeeping and apiculture work', true),
  ('Sericulture', 'Silk worm farming', true),
  ('Farm Management', 'General farm management and operations', true),
  ('Livestock', 'Cattle, sheep, goat, and animal husbandry', true),
  ('Tobacco', 'Tobacco farming and curing', true),
  ('Fishery', 'Fish farming and aquaculture', true),
  ('Orchard', 'Fruit tree cultivation', true),
  ('Dairy', 'Milk production and dairy farming', true),
  ('Maple', 'Maple syrup production', true),
  ('Fruit', 'Fruit cultivation', true),
  ('Farm Worker', 'General farm labor', true),
  ('Farmer', 'General farming', true),
  ('Vinery', 'Grape cultivation and vineyard management', true),
  ('Poultry', 'Chicken, duck, and bird farming', true),
  ('Irrigation and Machine', 'Irrigation systems and farm machinery', true)
ON CONFLICT (name) DO NOTHING;