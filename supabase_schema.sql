-- 1. Enable Row Level Security (RLS) on tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 2. Add user_id column to leads if it doesn't exist
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies for Leads
-- Allow users to insert their own leads (or leads assigned to them)
CREATE POLICY "Users can insert their own leads" ON leads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to view only their own leads
CREATE POLICY "Users can view their own leads" ON leads
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update only their own leads
CREATE POLICY "Users can update their own leads" ON leads
FOR UPDATE
USING (auth.uid() = user_id);

-- 5. Create Policies for Properties
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

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user signup
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, business_name)
  values (new.id, new.raw_user_meta_data->>'business_name');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to call the function
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
