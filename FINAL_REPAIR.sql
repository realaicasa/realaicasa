-- FINAL COMPLETE DATABASE REPAIR SCRIPT
-- RUN THIS IN YOUR SUPABASE SQL EDITOR TO FIX ALL SYNC FAILURES

-- 1. Patch 'properties' table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Patch 'app_config' table
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS training_enhancements TEXT;

-- 3. Patch 'leads' table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority_score INTEGER DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS notes_log JSONB DEFAULT '[]'::jsonb;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS financing_status TEXT DEFAULT 'Unverified';

-- 4. Reload Schema Cache
NOTIFY pgrst, 'reload schema';

-- Verification Tip: After running this, try Saving Identity again.
