-- EstateGuard Schema Repair Script
-- Run this in your Supabase SQL Editor to fix 'updated_at' columns

-- 1. Fix properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Fix app_config table
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Fix leads table (ensure it also has updated_at for consistency)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. Fix stripe_subscriptions table
ALTER TABLE stripe_subscriptions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 5. Force schema cache refresh (PostgREST)
NOTIFY pgrst, 'reload schema';
