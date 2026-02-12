import { createClient } from '@supabase/supabase-js';

// --- STABLE PROJECT HARD-PATCH (v1.1.9-fix11) ---
// ENSURE qry project ID is used to bypass potential environment typos (grv)
const CORRECT_URL = "https://qrydrfgrwzjewkjennli.supabase.co";
const envUrl = import.meta.env.VITE_SUPABASE_URL;

// Use correct URL if env is missing or contains the 'grv' typo
const supabaseUrl = (!envUrl || envUrl.includes('grvdrf')) ? CORRECT_URL : envUrl;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[EstateGuard] Supabase configuration is incomplete.');
}

console.log(`[EstateGuard] Connectivity Node: ${supabaseUrl.split('.')[0].replace('https://', '')}`);

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || ''
);
