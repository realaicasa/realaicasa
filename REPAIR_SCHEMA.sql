-- EstateGuard Schema Repair Script
-- Run this in your Supabase SQL Editor to fix 'updated_at' columns and missing feature fields

-- 1. Patch Core Tables
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE properties ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS ai_training JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS deep_data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT '{}'::jsonb;

ALTER TABLE app_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS training_enhancements TEXT;

-- 2. Patch Pipeline Intelligence (Leads)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS financing_status TEXT DEFAULT 'Unverified';

-- 3. Sync Schema Cache
NOTIFY pgrst, 'reload schema';

