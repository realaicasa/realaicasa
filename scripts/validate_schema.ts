import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env loader for standalone script
const loadEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const env: Record<string, string> = {};
  content.split('\n').forEach(line => {
    const [key, ...value] = line.split('=');
    if (key && value) env[key.trim()] = value.join('=').trim();
  });
  return env;
};

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const EXPECTED_COLUMNS: Record<string, string[]> = {
  properties: ['property_id', 'user_id', 'address', 'price', 'status', 'data', 'amenities', 'ai_training', 'deep_data', 'seo', 'updated_at'],
  leads: ['id', 'user_id', 'name', 'phone', 'email', 'financing_status', 'property_id', 'property_address', 'status', 'created_at', 'notes', 'agent_notes', 'due_date', 'priority_score', 'notes_log'],
  app_config: ['id', 'business_name', 'primary_color', 'api_key', 'high_security_mode', 'language', 'theme', 'updated_at', 'training_enhancements']
};

async function validateSchema() {
  console.log("🛡️  EstateGuard Schema Sentinel: Starting validation...");
  let errors = 0;

  for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
    console.log(`\nChecking table: [${table}]`);
    
    // Attempt to select columns one by one or in a group to detect missing ones
    const { data, error } = await supabase
      .from(table)
      .select(columns.join(','))
      .limit(1);

    if (error) {
      if (error.message.includes('column') || error.message.includes('not found')) {
        console.error(`❌ TABLE ERROR: [${table}] - ${error.message}`);
        errors++;
      } else {
        console.warn(`⚠️  TABLE WARNING: [${table}] - ${error.message} (Likely RLS or empty table)`);
        
        // Secondary check: try columns individually if bulk select failed due to RLS/Complexity
        for (const col of columns) {
           const { error: colErr } = await supabase.from(table).select(col).limit(1);
           if (colErr && (colErr.message.includes('column') || colErr.message.includes('does not exist'))) {
              console.error(`   ❌ Missing column: ${col}`);
              errors++;
           }
        }
      }
    } else {
      console.log(`✅ Table [${table}] structure looks healthy.`);
    }
  }

  console.log("\n-------------------------------------------");
  if (errors === 0) {
    console.log("✨ ALL CLEAR: Cloud schema is synchronized with application logic.");
  } else {
    console.log(`🚨 FOUND ${errors} SCHEMA MISMATCHES. Run FINAL_REPAIR.sql in Supabase.`);
    process.exit(1);
  }
}

validateSchema().catch(err => {
  console.error("CRITICAL RUNTIME ERROR:", err);
  process.exit(1);
});
