-- 1. Create the leads table (Main Prospect Vault)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  financing_status TEXT DEFAULT 'Unverified',
  property_id TEXT,
  property_address TEXT,
  status TEXT DEFAULT 'New',
  notes TEXT[] DEFAULT '{}',
  conversation_history JSONB DEFAULT '[]',
  agent_notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 3. Add user_id column to properties if it doesn't exist
-- Note: You might need to create the properties table first if it's currently just mock data in the code.
-- Creating a basic properties table store:
CREATE TABLE IF NOT EXISTS properties (
  property_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  address TEXT,
  price NUMERIC,
  status TEXT,
  data JSONB, -- Stores the full PropertySchema JSON
  amenities JSONB DEFAULT '{}',
  ai_training JSONB DEFAULT '{}',
  deep_data JSONB DEFAULT '{}',
  seo JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Leads
-- Allow users to insert their own leads (or leads assigned to them)
DROP POLICY IF EXISTS "Users can insert their own leads" ON leads;
CREATE POLICY "Users can insert their own leads" ON leads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own leads
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads" ON leads
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update only their own leads
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads" ON leads
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Create Policies for Properties
DROP POLICY IF EXISTS "Users can CRUD their own properties" ON properties;
CREATE POLICY "Users can CRUD their own properties" ON properties
FOR ALL
USING (auth.uid() = user_id);

-- 6. Create Profile Trigger (Optional but recommended to track agent details)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT,
  role TEXT DEFAULT 'agent'
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);



-- 7. Create app_config table for AgentSettings
CREATE TABLE IF NOT EXISTS app_config (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  business_name TEXT,
  primary_color TEXT DEFAULT '#d4af37',
  api_key TEXT,
  high_security_mode BOOLEAN DEFAULT true,
  monthly_price NUMERIC DEFAULT 0,
  contact_email TEXT,
  contact_phone TEXT,
  specialties TEXT[],
  language TEXT DEFAULT 'en',
  terms_and_conditions TEXT,
  privacy_policy TEXT,
  nda TEXT,
  location_hours TEXT,
  service_areas TEXT,
  commission_rates TEXT,
  marketing_strategy TEXT,
  team_members TEXT,
  awards TEXT,
  legal_disclaimer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Enable RLS on app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- 9. Create Policies for app_config
DROP POLICY IF EXISTS "Users can view own app_config" ON app_config;
CREATE POLICY "Users can view own app_config" ON app_config
FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own app_config" ON app_config;
CREATE POLICY "Users can insert own app_config" ON app_config
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own app_config" ON app_config;
CREATE POLICY "Users can update own app_config" ON app_config
FOR UPDATE
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own app_config" ON app_config;
CREATE POLICY "Users can delete own app_config" ON app_config
FOR DELETE
USING (auth.uid() = id);

-- 10. Update handle_new_user trigger to also initialize app_config
-- 10. Update handle_new_user trigger to also initialize app_config
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, business_name)
  VALUES (new.id, new.raw_user_meta_data->>'business_name');

  -- Insert into app_config with defaults
  INSERT INTO public.app_config (id, business_name)
  VALUES (new.id, new.raw_user_meta_data->>'business_name');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. Create stripe_subscriptions table for pre-signup verification
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  email TEXT PRIMARY KEY,
  status TEXT DEFAULT 'active', -- active, trialing, past_due, canceled
  customer_id TEXT, -- Stripe Customer ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on stripe_subscriptions
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow public read access to stripe_subscriptions for pre-signup verification
-- (Note: In a production environment, you might want to use an Edge Function or restricted view)
DROP POLICY IF EXISTS "Public can view active subscriptions" ON stripe_subscriptions;
CREATE POLICY "Public can view active subscriptions" ON stripe_subscriptions
FOR SELECT
USING (true);

