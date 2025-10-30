-- Add active_role to profiles to track which role is currently being used
ALTER TABLE profiles ADD COLUMN active_role user_role;

-- Update active_role to match the role column for existing users
UPDATE profiles SET active_role = role WHERE active_role IS NULL;

-- Create job_postings table for farmers to post job requirements
CREATE TABLE job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES profiles(id),
  title text NOT NULL,
  description text NOT NULL,
  work_type_id uuid REFERENCES work_types(id),
  work_crop_type_id uuid REFERENCES work_crop_types(id),
  location_state text NOT NULL,
  location_district text NOT NULL,
  location_address text,
  coordinates_lat numeric,
  coordinates_lng numeric,
  estimated_budget numeric,
  estimated_duration text,
  start_date date,
  end_date date,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'completed', 'cancelled')),
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on job_postings
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;

-- RLS policies for job_postings
CREATE POLICY "Anyone can view open job postings"
  ON job_postings FOR SELECT
  USING (status = 'open' OR farmer_id = auth.uid());

CREATE POLICY "Farmers can create job postings"
  ON job_postings FOR INSERT
  WITH CHECK (
    auth.uid() = farmer_id AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'farmer'
    )
  );

CREATE POLICY "Farmers can update their job postings"
  ON job_postings FOR UPDATE
  USING (auth.uid() = farmer_id);

CREATE POLICY "Farmers can delete their job postings"
  ON job_postings FOR DELETE
  USING (auth.uid() = farmer_id);

-- Add trigger for updated_at on job_postings
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create index for better search performance
CREATE INDEX idx_job_postings_location ON job_postings(location_state, location_district);
CREATE INDEX idx_job_postings_work_type ON job_postings(work_type_id);
CREATE INDEX idx_job_postings_status ON job_postings(status);